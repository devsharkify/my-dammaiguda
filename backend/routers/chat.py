"""AI Chat Router - Multi-persona AI assistant"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import os
import httpx
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/chat", tags=["AI Chat"])

# ============== MODELS ==============

class ChatMessage(BaseModel):
    message: str
    chat_type: str = "general"

# ============== CHAT PERSONAS ==============

CHAT_PERSONAS = {
    "general": {
        "system": "You are a helpful assistant for the My Dammaiguda civic platform. Help users with questions about the app, local issues, and community services. Respond in a friendly manner. If the user writes in Telugu, respond in Telugu.",
        "name": "General Assistant",
        "name_te": "సాధారణ సహాయకుడు"
    },
    "health": {
        "system": "You are a health advisor for citizens living near the Dammaiguda dump yard. Provide advice on pollution-related health concerns, respiratory issues, and preventive measures. Always recommend consulting a doctor for serious concerns. Respond in Telugu if the user writes in Telugu.",
        "name": "Health Advisor",
        "name_te": "ఆరోగ్య సలహాదారు"
    },
    "fitness": {
        "system": "You are a fitness coach helping citizens stay active despite pollution concerns. Provide exercise recommendations, safe workout times (early morning before pollution peaks), and indoor exercise alternatives. Be motivating and encouraging. Respond in Telugu if asked.",
        "name": "Fitness Coach",
        "name_te": "ఫిట్‌నెస్ కోచ్"
    },
    "doctor": {
        "system": "You are a nutrition advisor specializing in South Indian diet. Help users with meal planning, explain nutritional value of Telugu foods (idli, dosa, pesarattu, sambar, etc.), and provide diet tips for weight management, diabetes, and heart health. Always recommend professional consultation for medical conditions.",
        "name": "Nutrition Advisor",
        "name_te": "పోషకాహార సలహాదారు"
    },
    "psychologist": {
        "system": "You are a mental wellness companion. Provide emotional support, stress management tips, and mindfulness techniques. Be empathetic and supportive. If users express serious mental health concerns, always recommend professional help. Respond warmly and in Telugu if the user prefers.",
        "name": "Wellness Companion",
        "name_te": "మానసిక సహాయకుడు"
    }
}

# ============== ROUTES ==============

@router.get("/personas")
async def get_chat_personas():
    """Get available chat personas"""
    return {k: {"name": v["name"], "name_te": v["name_te"]} for k, v in CHAT_PERSONAS.items()}

@router.post("")
async def chat(message: ChatMessage, user: dict = Depends(get_current_user)):
    """Send a message to AI assistant"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    if message.chat_type not in CHAT_PERSONAS:
        raise HTTPException(status_code=400, detail="Invalid chat type")
    
    persona = CHAT_PERSONAS[message.chat_type]
    
    # Get conversation history
    history = await db.chat_history.find(
        {"user_id": user["id"], "chat_type": message.chat_type},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    history.reverse()
    
    # Build messages
    messages = []
    for h in history:
        messages.append({"role": "user", "content": h["message"]})
        messages.append({"role": "assistant", "content": h["response"]})
    
    try:
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat_instance = LlmChat(
            api_key=llm_key,
            model="gpt-4o-mini",
            system_message=persona["system"]
        )
        
        # Add history
        for msg in messages:
            if msg["role"] == "user":
                chat_instance.add_user_message(msg["content"])
            else:
                chat_instance.messages.append({"role": "assistant", "content": msg["content"]})
        
        # Get response
        response = await chat_instance.async_chat(message.message)
        
        # Save to history
        chat_entry = {
            "id": generate_id(),
            "user_id": user["id"],
            "chat_type": message.chat_type,
            "message": message.message,
            "response": response,
            "created_at": now_iso()
        }
        
        await db.chat_history.insert_one(chat_entry)
        chat_entry.pop("_id", None)
        
        return chat_entry
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

@router.get("/history")
async def get_chat_history(chat_type: str = "general", limit: int = 20, user: dict = Depends(get_current_user)):
    """Get chat history"""
    history = await db.chat_history.find(
        {"user_id": user["id"], "chat_type": chat_type},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    history.reverse()
    return history

@router.delete("/history")
async def clear_chat_history(chat_type: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Clear chat history"""
    query = {"user_id": user["id"]}
    if chat_type:
        query["chat_type"] = chat_type
    
    await db.chat_history.delete_many(query)
    
    return {"success": True, "message": "Chat history cleared"}
