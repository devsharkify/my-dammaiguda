"""Enhanced WebSocket Real-Time Chat Router
Features:
- User presence (online/offline)
- Typing indicators
- Message history with pagination
- Reactions
- Read receipts
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Set
from datetime import datetime, timezone, timedelta
from .utils import db, generate_id, now_iso, get_current_user, JWT_SECRET
import json
import logging
import asyncio

router = APIRouter(prefix="/chat", tags=["Real-Time Chat"])

logger = logging.getLogger(__name__)

# Enhanced Connection Manager with Presence
class ConnectionManager:
    def __init__(self):
        # room_id -> list of (websocket, user_info)
        self.active_connections: Dict[str, List[tuple]] = {}
        # user_id -> set of room_ids (for multi-room support)
        self.user_rooms: Dict[str, Set[str]] = {}
        # room_id -> set of user_ids currently typing
        self.typing_users: Dict[str, Set[str]] = {}
        # user_id -> last activity timestamp
        self.user_last_seen: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user: dict):
        await websocket.accept()
        
        user_id = user.get("id")
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        
        self.active_connections[room_id].append((websocket, user))
        
        # Track user rooms
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)
        
        # Update last seen
        self.user_last_seen[user_id] = now_iso()
        
        # Update user online status in DB
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"is_online": True, "last_seen": now_iso()}}
        )
        
        # Notify others about new user joining
        await self.broadcast_presence(room_id, user, "join")
        
        # Send current online users to the new connection
        await websocket.send_json({
            "type": "presence_list",
            "online_users": self.get_online_users(room_id)
        })
    
    def disconnect(self, websocket: WebSocket, room_id: str, user: dict):
        user_id = user.get("id")
        
        if room_id in self.active_connections:
            self.active_connections[room_id] = [
                (ws, u) for ws, u in self.active_connections[room_id] 
                if ws != websocket
            ]
        
        # Remove from user rooms
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
            if not self.user_rooms[user_id]:
                del self.user_rooms[user_id]
        
        # Remove from typing
        if room_id in self.typing_users:
            self.typing_users[room_id].discard(user_id)
    
    async def handle_disconnect(self, room_id: str, user: dict):
        """Handle cleanup after disconnect"""
        user_id = user.get("id")
        
        # Check if user is still connected to other rooms
        is_still_online = user_id in self.user_rooms and len(self.user_rooms[user_id]) > 0
        
        if not is_still_online:
            # Update user offline status in DB
            await db.users.update_one(
                {"id": user_id},
                {"$set": {"is_online": False, "last_seen": now_iso()}}
            )
        
        # Broadcast leave to room
        await self.broadcast_presence(room_id, user, "leave")
    
    async def broadcast(self, room_id: str, message: dict, exclude_ws: WebSocket = None):
        if room_id not in self.active_connections:
            return
            
        dead_connections = []
        for websocket, user in self.active_connections[room_id]:
            if websocket != exclude_ws:
                try:
                    await websocket.send_json(message)
                except Exception:
                    dead_connections.append((websocket, user))
        
        # Clean up dead connections
        for conn in dead_connections:
            self.active_connections[room_id].remove(conn)
    
    async def broadcast_presence(self, room_id: str, user: dict, action: str):
        """Broadcast presence update (join/leave)"""
        message = {
            "type": "presence",
            "action": action,
            "user": {
                "id": user.get("id"),
                "name": user.get("name"),
                "avatar": user.get("avatar_url")
            },
            "online_count": len(self.get_online_users(room_id)),
            "timestamp": now_iso()
        }
        await self.broadcast(room_id, message)
    
    async def broadcast_typing(self, room_id: str, user: dict, is_typing: bool):
        """Broadcast typing indicator"""
        user_id = user.get("id")
        
        if room_id not in self.typing_users:
            self.typing_users[room_id] = set()
        
        if is_typing:
            self.typing_users[room_id].add(user_id)
        else:
            self.typing_users[room_id].discard(user_id)
        
        # Get typing users info
        typing_users_info = []
        for uid in self.typing_users[room_id]:
            for ws, u in self.active_connections.get(room_id, []):
                if u.get("id") == uid:
                    typing_users_info.append({"id": uid, "name": u.get("name")})
                    break
        
        message = {
            "type": "typing",
            "typing_users": typing_users_info,
            "timestamp": now_iso()
        }
        await self.broadcast(room_id, message)
    
    def get_online_users(self, room_id: str) -> List[dict]:
        if room_id not in self.active_connections:
            return []
        
        seen_ids = set()
        users = []
        for _, user in self.active_connections[room_id]:
            user_id = user.get("id")
            if user_id not in seen_ids:
                seen_ids.add(user_id)
                users.append({
                    "id": user_id,
                    "name": user.get("name"),
                    "avatar": user.get("avatar_url")
                })
        return users

manager = ConnectionManager()

# Models
class MessageCreate(BaseModel):
    room_id: str
    content: str
    reply_to: Optional[str] = None
    message_type: str = "text"  # text, image, file

class RoomCreate(BaseModel):
    name: str
    name_te: Optional[str] = None
    description: Optional[str] = None
    is_public: bool = True

class MarkReadRequest(BaseModel):
    message_ids: List[str]

# REST Endpoints

@router.get("/rooms")
async def get_rooms(user: dict = Depends(get_current_user)):
    """Get all public chat rooms"""
    rooms = await db.chat_rooms.find(
        {"$or": [{"is_public": True}, {"members": user["id"]}]},
        {"_id": 0}
    ).sort("last_activity", -1).to_list(50)
    
    # Add online count and unread count
    for room in rooms:
        room["online_count"] = len(manager.get_online_users(room["id"]))
        
        # Get unread count
        last_read = await db.chat_read_receipts.find_one(
            {"room_id": room["id"], "user_id": user["id"]},
            {"_id": 0, "last_read_at": 1}
        )
        
        if last_read and last_read.get("last_read_at"):
            unread = await db.chat_messages.count_documents({
                "room_id": room["id"],
                "created_at": {"$gt": last_read["last_read_at"]},
                "user_id": {"$ne": user["id"]}
            })
            room["unread_count"] = unread
        else:
            room["unread_count"] = room.get("message_count", 0)
    
    return {"rooms": rooms}

@router.post("/rooms")
async def create_room(room_data: RoomCreate, user: dict = Depends(get_current_user)):
    """Create a new chat room"""
    room = {
        "id": generate_id(),
        "name": room_data.name,
        "name_te": room_data.name_te,
        "description": room_data.description,
        "is_public": room_data.is_public,
        "created_by": user["id"],
        "members": [user["id"]],
        "message_count": 0,
        "last_activity": now_iso(),
        "created_at": now_iso()
    }
    
    await db.chat_rooms.insert_one(room)
    return {"success": True, "room": {k: v for k, v in room.items() if k != "_id"}}

@router.get("/rooms/{room_id}/messages")
async def get_messages(
    room_id: str, 
    limit: int = 50, 
    before: Optional[str] = None, 
    user: dict = Depends(get_current_user)
):
    """Get message history for a room with pagination"""
    query = {"room_id": room_id}
    if before:
        query["created_at"] = {"$lt": before}
    
    messages = await db.chat_messages.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Reverse to get chronological order
    messages.reverse()
    
    # Mark as read
    if messages:
        await db.chat_read_receipts.update_one(
            {"room_id": room_id, "user_id": user["id"]},
            {"$set": {"last_read_at": now_iso(), "last_read_message_id": messages[-1]["id"]}},
            upsert=True
        )
    
    return {
        "messages": messages, 
        "online_users": manager.get_online_users(room_id),
        "has_more": len(messages) == limit
    }

@router.post("/rooms/{room_id}/messages")
async def send_message_rest(room_id: str, message: MessageCreate, user: dict = Depends(get_current_user)):
    """Send a message via REST (for when WebSocket is not available)"""
    msg = {
        "id": generate_id(),
        "room_id": room_id,
        "user_id": user["id"],
        "user_name": user.get("name", "User"),
        "user_avatar": user.get("avatar_url"),
        "content": message.content,
        "message_type": message.message_type,
        "reply_to": message.reply_to,
        "created_at": now_iso(),
        "reactions": {},
        "read_by": [user["id"]]
    }
    
    await db.chat_messages.insert_one(msg)
    
    # Update room activity
    await db.chat_rooms.update_one(
        {"id": room_id},
        {"$set": {"last_activity": now_iso()}, "$inc": {"message_count": 1}}
    )
    
    # Broadcast to WebSocket clients
    broadcast_msg = {
        "type": "message",
        **{k: v for k, v in msg.items() if k != "_id"}
    }
    await manager.broadcast(room_id, broadcast_msg)
    
    return {"success": True, "message": {k: v for k, v in msg.items() if k != "_id"}}

@router.post("/rooms/{room_id}/read")
async def mark_messages_read(room_id: str, user: dict = Depends(get_current_user)):
    """Mark all messages in a room as read"""
    await db.chat_read_receipts.update_one(
        {"room_id": room_id, "user_id": user["id"]},
        {"$set": {"last_read_at": now_iso()}},
        upsert=True
    )
    
    return {"success": True}

@router.post("/messages/{message_id}/react")
async def react_to_message(message_id: str, emoji: str, user: dict = Depends(get_current_user)):
    """Add or remove a reaction to a message"""
    message = await db.chat_messages.find_one({"id": message_id})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    reactions = message.get("reactions", {})
    user_id = user["id"]
    
    # Toggle reaction
    if emoji in reactions:
        if user_id in reactions[emoji]:
            reactions[emoji].remove(user_id)
            if not reactions[emoji]:
                del reactions[emoji]
        else:
            reactions[emoji].append(user_id)
    else:
        reactions[emoji] = [user_id]
    
    await db.chat_messages.update_one(
        {"id": message_id},
        {"$set": {"reactions": reactions}}
    )
    
    # Broadcast reaction update
    await manager.broadcast(message["room_id"], {
        "type": "reaction",
        "message_id": message_id,
        "reactions": reactions
    })
    
    return {"success": True, "reactions": reactions}

@router.get("/presence/online")
async def get_online_users_global(user: dict = Depends(get_current_user)):
    """Get all online users across all rooms"""
    online_users = await db.users.find(
        {"is_online": True},
        {"_id": 0, "id": 1, "name": 1, "avatar_url": 1, "last_seen": 1}
    ).to_list(100)
    
    return {"online_users": online_users}

# WebSocket endpoint
@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: Optional[str] = None):
    """WebSocket connection for real-time chat"""
    # Validate user from token
    user = None
    if token:
        try:
            import jwt
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user = await db.users.find_one({"id": payload.get("user_id")}, {"_id": 0})
        except Exception:
            pass
    
    if not user:
        user = {"id": "guest-" + generate_id()[:8], "name": "Guest"}
    
    await manager.connect(websocket, room_id, user)
    
    # Typing timeout task
    typing_timeout_task = None
    
    async def clear_typing():
        await asyncio.sleep(3)
        await manager.broadcast_typing(room_id, user, False)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            # Update last activity
            manager.user_last_seen[user["id"]] = now_iso()
            
            if msg_type == "message":
                # Save message
                msg = {
                    "id": generate_id(),
                    "room_id": room_id,
                    "user_id": user["id"],
                    "user_name": user.get("name", "User"),
                    "user_avatar": user.get("avatar_url"),
                    "content": data.get("content", ""),
                    "message_type": data.get("message_type", "text"),
                    "reply_to": data.get("reply_to"),
                    "created_at": now_iso(),
                    "reactions": {},
                    "read_by": [user["id"]]
                }
                
                await db.chat_messages.insert_one(msg)
                
                # Update room
                await db.chat_rooms.update_one(
                    {"id": room_id},
                    {"$set": {"last_activity": now_iso()}, "$inc": {"message_count": 1}}
                )
                
                # Clear typing indicator for sender
                await manager.broadcast_typing(room_id, user, False)
                
                # Broadcast message
                broadcast_msg = {
                    "type": "message",
                    **{k: v for k, v in msg.items() if k != "_id"}
                }
                await manager.broadcast(room_id, broadcast_msg)
            
            elif msg_type == "typing":
                is_typing = data.get("is_typing", False)
                await manager.broadcast_typing(room_id, user, is_typing)
                
                # Auto-clear typing after 3 seconds
                if is_typing:
                    if typing_timeout_task:
                        typing_timeout_task.cancel()
                    typing_timeout_task = asyncio.create_task(clear_typing())
            
            elif msg_type == "reaction":
                message_id = data.get("message_id")
                emoji = data.get("emoji")
                
                message = await db.chat_messages.find_one({"id": message_id})
                if message:
                    reactions = message.get("reactions", {})
                    if emoji in reactions:
                        if user["id"] in reactions[emoji]:
                            reactions[emoji].remove(user["id"])
                            if not reactions[emoji]:
                                del reactions[emoji]
                        else:
                            reactions[emoji].append(user["id"])
                    else:
                        reactions[emoji] = [user["id"]]
                    
                    await db.chat_messages.update_one(
                        {"id": message_id},
                        {"$set": {"reactions": reactions}}
                    )
                    
                    await manager.broadcast(room_id, {
                        "type": "reaction",
                        "message_id": message_id,
                        "reactions": reactions
                    })
            
            elif msg_type == "read":
                # Mark messages as read
                message_ids = data.get("message_ids", [])
                if message_ids:
                    await db.chat_messages.update_many(
                        {"id": {"$in": message_ids}},
                        {"$addToSet": {"read_by": user["id"]}}
                    )
                    
                    # Broadcast read receipt
                    await manager.broadcast(room_id, {
                        "type": "read_receipt",
                        "user_id": user["id"],
                        "message_ids": message_ids
                    }, exclude_ws=websocket)
            
            elif msg_type == "ping":
                # Heartbeat
                await websocket.send_json({"type": "pong", "timestamp": now_iso()})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, user)
        await manager.handle_disconnect(room_id, user)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, room_id, user)
        await manager.handle_disconnect(room_id, user)

# Seed default rooms
@router.post("/seed")
async def seed_rooms(user: dict = Depends(get_current_user)):
    """Seed default chat rooms"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    default_rooms = [
        {
            "id": "general",
            "name": "General Chat",
            "name_te": "సాధారణ చాట్",
            "description": "Discuss anything about Dammaiguda",
            "is_public": True,
            "created_by": "system",
            "members": [],
            "message_count": 0,
            "last_activity": now_iso(),
            "created_at": now_iso()
        },
        {
            "id": "announcements",
            "name": "Announcements",
            "name_te": "ప్రకటనలు",
            "description": "Official announcements from ward",
            "is_public": True,
            "created_by": "system",
            "members": [],
            "message_count": 0,
            "last_activity": now_iso(),
            "created_at": now_iso()
        },
        {
            "id": "health-fitness",
            "name": "Health & Fitness",
            "name_te": "ఆరోగ్యం & ఫిట్‌నెస్",
            "description": "Discuss health tips and fitness",
            "is_public": True,
            "created_by": "system",
            "members": [],
            "message_count": 0,
            "last_activity": now_iso(),
            "created_at": now_iso()
        },
        {
            "id": "community",
            "name": "Community",
            "name_te": "సమాజం",
            "description": "Community discussions and local events",
            "is_public": True,
            "created_by": "system",
            "members": [],
            "message_count": 0,
            "last_activity": now_iso(),
            "created_at": now_iso()
        }
    ]
    
    for room in default_rooms:
        existing = await db.chat_rooms.find_one({"id": room["id"]})
        if not existing:
            await db.chat_rooms.insert_one(room)
    
    return {"success": True, "message": "Default rooms seeded"}
