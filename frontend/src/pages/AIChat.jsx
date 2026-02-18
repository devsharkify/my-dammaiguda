import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Stethoscope,
  Activity,
  Brain,
  Trash2,
  Loader2
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CHAT_TYPES = [
  { value: "general", label: { en: "General", te: "సాధారణ" }, icon: <MessageCircle className="h-4 w-4" />, color: "bg-blue-500" },
  { value: "health", label: { en: "Health", te: "ఆరోగ్యం" }, icon: <Stethoscope className="h-4 w-4" />, color: "bg-green-500" },
  { value: "fitness", label: { en: "Fitness", te: "ఫిట్‌నెస్" }, icon: <Activity className="h-4 w-4" />, color: "bg-orange-500" },
  { value: "doctor", label: { en: "Doctor", te: "డాక్టర్" }, icon: <Stethoscope className="h-4 w-4" />, color: "bg-red-500" },
  { value: "psychologist", label: { en: "Mind", te: "మనస్సు" }, icon: <Brain className="h-4 w-4" />, color: "bg-purple-500" }
];

export default function AIChat() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [chatType, setChatType] = useState("general");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [chatType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(`${API}/chat/history?chat_type=${chatType}&limit=50`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message immediately
    const tempId = Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      message: userMessage,
      response: null,
      chat_type: chatType,
      created_at: new Date().toISOString()
    }]);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: userMessage,
        chat_type: chatType
      });

      // Update with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? response.data : msg
      ));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send message");
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await axios.delete(`${API}/chat/history?chat_type=${chatType}`);
      setMessages([]);
      toast.success(language === "te" ? "చరిత్ర క్లియర్ చేయబడింది" : "History cleared");
    } catch (error) {
      toast.error("Failed to clear history");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentChatType = CHAT_TYPES.find(t => t.value === chatType);

  const getWelcomeMessage = () => {
    const messages = {
      general: {
        en: "Hello! I'm your My Dammaiguda assistant. How can I help you today?",
        te: "హలో! నేను మీ మై దమ్మాయిగూడ అసిస్టెంట్. ఈ రోజు మీకు ఎలా సహాయం చేయగలను?"
      },
      health: {
        en: "Hello! I'm Kaizer Doctor, your health advisor. Ask me about pollution-related health concerns, general wellness, or health tips for Dammaiguda residents.",
        te: "హలో! నేను కైజర్ డాక్టర్, మీ ఆరోగ్య సలహాదారు. కాలుష్య సంబంధిత ఆరోగ్య సమస్యలు, సాధారణ ఆరోగ్యం, లేదా దమ్మాయిగూడ నివాసితులకు ఆరోగ్య చిట్కాల గురించి నన్ను అడగండి."
      },
      fitness: {
        en: "Hi! I'm Kaizer Fit Coach. I can help you with exercise recommendations, fitness goals, and pollution-safe workout timing for Dammaiguda.",
        te: "హాయ్! నేను కైజర్ ఫిట్ కోచ్. వ్యాయామ సిఫార్సులు, ఫిట్‌నెస్ లక్ష్యాలు మరియు దమ్మాయిగూడ కోసం కాలుష్య-సురక్షిత వర్కౌట్ సమయంతో మీకు సహాయం చేయగలను."
      },
      doctor: {
        en: "Hello! I'm Kaizer Doctor AI. I can provide diet recommendations (South Indian cuisine focused), basic health guidance, and wellness tips. Remember, I'm not a replacement for real doctors!",
        te: "హలో! నేను కైజర్ డాక్టర్ AI. నేను ఆహార సిఫార్సులు (దక్షిణ భారత వంటకాలు), ప్రాథమిక ఆరోగ్య మార్గదర్శకత్వం మరియు ఆరోగ్య చిట్కాలను అందించగలను. గుర్తుంచుకోండి, నేను నిజమైన వైద్యులకు ప్రత్యామ్నాయం కాదు!"
      },
      psychologist: {
        en: "Hello! I'm Kaizer Mind, your mental wellness companion. I'm here to listen and provide support. Feel free to share what's on your mind.",
        te: "హలో! నేను కైజర్ మైండ్, మీ మానసిక ఆరోగ్య సహచరుడు. వినడానికి మరియు మద్దతు ఇవ్వడానికి నేను ఇక్కడ ఉన్నాను. మీ మనస్సులో ఏముందో నిర్భయంగా చెప్పండి."
      }
    };
    return messages[chatType]?.[language] || messages.general[language];
  };

  return (
    <Layout showBackButton title={language === "te" ? "AI చాట్" : "AI Chat"}>
      <div className="flex flex-col h-[calc(100vh-180px)]" data-testid="ai-chat">
        {/* Chat Type Selector */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
          {CHAT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setChatType(type.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                chatType === type.value
                  ? `${type.color} text-white`
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid={`chat-type-${type.value}`}
            >
              {type.icon}
              <span className="text-sm font-medium">{type.label[language]}</span>
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {historyLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="flex gap-3 items-start">
                  <div className={`h-10 w-10 rounded-full ${currentChatType?.color} flex items-center justify-center flex-shrink-0`}>
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                    <p className="text-sm">{getWelcomeMessage()}</p>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {/* User Message */}
                  <div className="flex gap-3 items-start justify-end">
                    <div className="bg-primary text-white rounded-2xl rounded-tr-sm p-4 max-w-[85%]">
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {/* AI Response */}
                  {msg.response && (
                    <div className="flex gap-3 items-start">
                      <div className={`h-10 w-10 rounded-full ${currentChatType?.color} flex items-center justify-center flex-shrink-0`}>
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                        <p className="text-sm whitespace-pre-wrap">{msg.response}</p>
                      </div>
                    </div>
                  )}

                  {/* Loading indicator for pending response */}
                  {!msg.response && loading && (
                    <div className="flex gap-3 items-start">
                      <div className={`h-10 w-10 rounded-full ${currentChatType?.color} flex items-center justify-center flex-shrink-0`}>
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm p-4">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 pt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === "te" ? "మీ సందేశం టైప్ చేయండి..." : "Type your message..."}
              className="flex-1 h-12 rounded-full px-5"
              disabled={loading}
              data-testid="chat-input"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="h-12 w-12 rounded-full bg-primary text-white"
              data-testid="send-message-btn"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-muted-foreground w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {language === "te" ? "చరిత్ర క్లియర్ చేయండి" : "Clear History"}
            </Button>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground mt-2">
          {language === "te" 
            ? "AI సలహాలు వృత్తిపరమైన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు"
            : "AI advice is not a substitute for professional medical advice"}
        </p>
      </div>
    </Layout>
  );
}
