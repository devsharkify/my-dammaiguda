import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  MessageCircle,
  Send,
  Users,
  Smile,
  Loader2,
  ArrowLeft,
  MoreVertical,
  Reply,
  Hash,
  Wifi,
  WifiOff,
  Check,
  CheckCheck
} from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;
const WS_URL = API.replace("https://", "wss://").replace("http://", "ws://");

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function LiveChat() {
  const { roomId } = useParams();
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  const headers = { Authorization: `Bearer ${token}` };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Connect to WebSocket when room changes
  useEffect(() => {
    if (roomId && token) {
      connectWebSocket();
      fetchMessages();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, token]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API}/api/chat/rooms`, { headers });
      setRooms(res.data.rooms || []);
      
      // Find current room
      if (roomId) {
        const room = res.data.rooms?.find(r => r.id === roomId);
        setCurrentRoom(room);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API}/api/chat/rooms/${roomId}/messages`, { headers });
      setMessages(res.data.messages || []);
      setOnlineUsers(res.data.online_users || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      wsRef.current = new WebSocket(`${WS_URL}/api/chat/ws/${roomId}?token=${token}`);
      
      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
      };
      
      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        
        // Attempt reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }, [roomId, token]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case "message":
        setMessages(prev => [...prev, data]);
        break;
      
      case "typing":
        if (data.is_typing) {
          setTypingUsers(prev => {
            if (!prev.find(u => u.user_id === data.user_id)) {
              return [...prev, { user_id: data.user_id, user_name: data.user_name }];
            }
            return prev;
          });
        } else {
          setTypingUsers(prev => prev.filter(u => u.user_id !== data.user_id));
        }
        break;
      
      case "reaction":
        setMessages(prev => prev.map(msg => 
          msg.id === data.message_id ? { ...msg, reactions: data.reactions } : msg
        ));
        break;
      
      case "system":
        // Show system message
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          type: "system",
          content: data.text,
          created_at: data.timestamp
        }]);
        break;
      
      default:
        break;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);
    
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "message",
          content: messageContent,
          reply_to: replyTo?.id
        }));
      } else {
        // Fallback to REST
        await axios.post(`${API}/api/chat/rooms/${roomId}/messages`, {
          room_id: roomId,
          content: messageContent,
          reply_to: replyTo?.id
        }, { headers });
      }
      
      setReplyTo(null);
    } catch (error) {
      toast.error(language === "te" ? "పంపడం విఫలమైంది" : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "typing",
        is_typing: true
      }));
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Send stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "typing",
            is_typing: false
          }));
        }
      }, 2000);
    }
  };

  const sendReaction = (messageId, emoji) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "reaction",
        message_id: messageId,
        emoji
      }));
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  // Room list view
  if (!roomId) {
    return (
      <Layout showBackButton title={language === "te" ? "చాట్ రూమ్‌లు" : "Chat Rooms"}>
        <div className="space-y-4" data-testid="chat-rooms-list">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rooms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {language === "te" ? "చాట్ రూమ్‌లు లేవు" : "No chat rooms available"}
                </p>
              </CardContent>
            </Card>
          ) : (
            rooms.map((room) => (
              <Card 
                key={room.id}
                className="cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                onClick={() => navigate(`/live-chat/${room.id}`)}
                data-testid={`room-${room.id}`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Hash className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {language === "te" && room.name_te ? room.name_te : room.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {room.description || `${room.message_count || 0} messages`}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {room.online_count || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Layout>
    );
  }

  // Chat room view
  return (
    <div className="flex flex-col h-screen bg-background" data-testid="live-chat">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/live-chat")} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex-1">
            <h1 className="font-semibold">
              {language === "te" && currentRoom?.name_te ? currentRoom.name_te : currentRoom?.name || "Chat"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-white/80">
              {connected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-300" />
                  <span>{onlineUsers.length} {language === "te" ? "ఆన్‌లైన్" : "online"}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-300" />
                  <span>{language === "te" ? "కనెక్ట్ అవుతోంది..." : "Connecting..."}</span>
                </>
              )}
            </div>
          </div>
          
          <button className="p-2 rounded-full hover:bg-white/10">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          msg.type === "system" ? (
            <div key={msg.id} className="text-center text-xs text-muted-foreground py-2">
              {msg.content}
            </div>
          ) : (
            <div
              key={msg.id}
              className={`flex ${msg.user_id === user?.id ? "justify-end" : "justify-start"}`}
              data-testid={`message-${msg.id}`}
            >
              <div className={`max-w-[75%] ${msg.user_id === user?.id ? "order-2" : ""}`}>
                {msg.user_id !== user?.id && (
                  <p className="text-xs text-muted-foreground mb-1 ml-1">
                    {msg.user_name}
                  </p>
                )}
                
                <div 
                  className={`rounded-2xl px-4 py-2 ${
                    msg.user_id === user?.id 
                      ? "bg-primary text-white rounded-br-sm" 
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  {msg.reply_to && (
                    <div className="text-xs opacity-70 border-l-2 pl-2 mb-1 border-current">
                      {language === "te" ? "జవాబు:" : "Reply"}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                
                <div className={`flex items-center gap-2 mt-1 ${msg.user_id === user?.id ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(msg.created_at)}
                  </span>
                  {msg.user_id === user?.id && (
                    <CheckCheck className="h-3 w-3 text-primary" />
                  )}
                </div>
                
                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        onClick={() => sendReaction(msg.id, emoji)}
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          users.includes(user?.id) 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted"
                        }`}
                      >
                        {emoji} {users.length}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Quick reactions */}
                <div className="flex gap-1 mt-1 opacity-0 hover:opacity-100 transition-opacity">
                  {EMOJI_REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(msg.id, emoji)}
                      className="text-sm hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Reply className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )
        ))}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="text-xs text-muted-foreground animate-pulse">
            {typingUsers.map(u => u.user_name).join(", ")} {language === "te" ? "టైప్ చేస్తున్నారు..." : "typing..."}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center gap-2">
          <Reply className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 text-xs truncate">
            {language === "te" ? "జవాబు:" : "Replying to:"} {replyTo.content}
          </div>
          <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground hover:text-primary">
            <Smile className="h-5 w-5" />
          </button>
          
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={language === "te" ? "మెసేజ్ టైప్ చేయండి..." : "Type a message..."}
            className="flex-1 rounded-full"
            disabled={!connected}
            data-testid="chat-input"
          />
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending || !connected}
            className="h-10 w-10 rounded-full p-0"
            data-testid="send-message-btn"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
