"""WebSocket Real-Time Chat Router"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
from .utils import db, generate_id, now_iso, get_current_user
import json
import logging

router = APIRouter(prefix="/chat", tags=["Real-Time Chat"])

# Store active connections
class ConnectionManager:
    def __init__(self):
        # room_id -> list of (websocket, user_info)
        self.active_connections: Dict[str, List[tuple]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user: dict):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append((websocket, user))
        
        # Notify others about new user
        await self.broadcast_system(room_id, f"{user.get('name', 'Someone')} joined the chat")
    
    def disconnect(self, websocket: WebSocket, room_id: str, user: dict):
        if room_id in self.active_connections:
            self.active_connections[room_id] = [
                (ws, u) for ws, u in self.active_connections[room_id] 
                if ws != websocket
            ]
    
    async def broadcast(self, room_id: str, message: dict, exclude_ws: WebSocket = None):
        if room_id in self.active_connections:
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
    
    async def broadcast_system(self, room_id: str, text: str):
        message = {
            "type": "system",
            "text": text,
            "timestamp": now_iso()
        }
        await self.broadcast(room_id, message)
    
    def get_online_users(self, room_id: str) -> List[dict]:
        if room_id not in self.active_connections:
            return []
        return [{"id": u.get("id"), "name": u.get("name")} for _, u in self.active_connections[room_id]]

manager = ConnectionManager()

# Models
class MessageCreate(BaseModel):
    room_id: str
    content: str
    reply_to: Optional[str] = None

class RoomCreate(BaseModel):
    name: str
    name_te: Optional[str] = None
    description: Optional[str] = None
    is_public: bool = True

# REST Endpoints for rooms and message history

@router.get("/rooms")
async def get_rooms(user: dict = Depends(get_current_user)):
    """Get all public chat rooms"""
    rooms = await db.chat_rooms.find(
        {"$or": [{"is_public": True}, {"members": user["id"]}]},
        {"_id": 0}
    ).sort("last_activity", -1).to_list(50)
    
    # Add online count
    for room in rooms:
        room["online_count"] = len(manager.get_online_users(room["id"]))
    
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
    return {"success": True, "room": room}

@router.get("/rooms/{room_id}/messages")
async def get_messages(room_id: str, limit: int = 50, before: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Get message history for a room"""
    query = {"room_id": room_id}
    if before:
        query["created_at"] = {"$lt": before}
    
    messages = await db.chat_messages.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Reverse to get chronological order
    messages.reverse()
    
    return {"messages": messages, "online_users": manager.get_online_users(room_id)}

@router.post("/rooms/{room_id}/messages")
async def send_message_rest(room_id: str, message: MessageCreate, user: dict = Depends(get_current_user)):
    """Send a message via REST (for when WebSocket is not available)"""
    msg = {
        "id": generate_id(),
        "room_id": room_id,
        "user_id": user["id"],
        "user_name": user.get("name", "User"),
        "content": message.content,
        "reply_to": message.reply_to,
        "created_at": now_iso(),
        "reactions": {}
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
    
    return {"success": True, "message": msg}

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

# WebSocket endpoint
@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: Optional[str] = None):
    """WebSocket connection for real-time chat"""
    # Validate user from token (simplified - in production use proper auth)
    user = None
    if token:
        try:
            import jwt
            payload = jwt.decode(token, "dammaiguda-secret-key-2024", algorithms=["HS256"])
            user = await db.users.find_one({"id": payload.get("user_id")}, {"_id": 0})
        except:
            pass
    
    if not user:
        user = {"id": "guest-" + generate_id()[:8], "name": "Guest"}
    
    await manager.connect(websocket, room_id, user)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                # Save message
                msg = {
                    "id": generate_id(),
                    "room_id": room_id,
                    "user_id": user["id"],
                    "user_name": user.get("name", "User"),
                    "content": data.get("content", ""),
                    "reply_to": data.get("reply_to"),
                    "created_at": now_iso(),
                    "reactions": {}
                }
                
                await db.chat_messages.insert_one(msg)
                
                # Update room
                await db.chat_rooms.update_one(
                    {"id": room_id},
                    {"$set": {"last_activity": now_iso()}, "$inc": {"message_count": 1}}
                )
                
                # Broadcast
                broadcast_msg = {
                    "type": "message",
                    **{k: v for k, v in msg.items() if k != "_id"}
                }
                await manager.broadcast(room_id, broadcast_msg)
            
            elif data.get("type") == "typing":
                await manager.broadcast(room_id, {
                    "type": "typing",
                    "user_id": user["id"],
                    "user_name": user.get("name"),
                    "is_typing": data.get("is_typing", False)
                }, exclude_ws=websocket)
            
            elif data.get("type") == "reaction":
                # Handle reaction
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
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, user)
        await manager.broadcast_system(room_id, f"{user.get('name', 'Someone')} left the chat")

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
        }
    ]
    
    for room in default_rooms:
        existing = await db.chat_rooms.find_one({"id": room["id"]})
        if not existing:
            await db.chat_rooms.insert_one(room)
    
    return {"success": True, "message": "Default rooms seeded"}
