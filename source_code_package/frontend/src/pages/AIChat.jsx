import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
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
  Loader2,
  Sparkles,
  Heart,
  ChevronDown,
  Mic,
  Image,
  MoreHorizontal,
  Copy,
  Check,
  RefreshCw
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CHAT_TYPES = [
  { 
    value: "general", 
    label: { en: "Assistant", te: "అసిస్టెంట్" }, 
    icon: <Sparkles className="h-4 w-4" />, 
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
  },
  { 
    value: "health", 
    label: { en: "Health", te: "ఆరోగ్యం" }, 
    icon: <Heart className="h-4 w-4" />, 
    gradient: "from-green-500 to-emerald-500",
    bg: "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
  },
  { 
    value: "fitness", 
    label: { en: "Fitness", te: "ఫిట్‌నెస్" }, 
    icon: <Activity className="h-4 w-4" />, 
    gradient: "from-orange-500 to-amber-500",
    bg: "bg-gradient-to-br from-orange-500/10 to-amber-500/10"
  },
  { 
    value: "doctor", 
    label: { en: "Doctor", te: "డాక్టర్" }, 
    icon: <Stethoscope className="h-4 w-4" />, 
    gradient: "from-red-500 to-rose-500",
    bg: "bg-gradient-to-br from-red-500/10 to-rose-500/10"
  },
  { 
    value: "psychologist", 
    label: { en: "Mind", te: "మనస్సు" }, 
    icon: <Brain className="h-4 w-4" />, 
    gradient: "from-purple-500 to-pink-500",
    bg: "bg-gradient-to-br from-purple-500/10 to-pink-500/10"
  }
];

const QUICK_PROMPTS = {
  general: [
    { en: "What's happening in Dammaiguda?", te: "దమ్మాయిగూడలో ఏం జరుగుతోంది?" },
    { en: "Find nearby services", te: "సమీపంలోని సేవలు కనుగొనండి" },
    { en: "Help with an issue", te: "సమస్యలో సహాయం" }
  ],
  health: [
    { en: "Today's health tips", te: "ఈ రోజు ఆరోగ్య చిట్కాలు" },
    { en: "AQI health advice", te: "AQI ఆరోగ్య సలహా" },
    { en: "Seasonal health care", te: "సీజనల్ ఆరోగ్య సంరక్షణ" }
  ],
  fitness: [
    { en: "Quick home workout", te: "త్వరిత ఇంటి వ్యాయామం" },
    { en: "Best time to exercise", te: "వ్యాయామానికి ఉత్తమ సమయం" },
    { en: "Weight loss tips", te: "బరువు తగ్గడం చిట్కాలు" }
  ],
  doctor: [
    { en: "Diet recommendations", te: "ఆహార సిఫార్సులు" },
    { en: "Common cold remedies", te: "జలుబు నివారణలు" },
    { en: "Diabetes care tips", te: "డయాబెటిస్ సంరక్షణ చిట్కాలు" }
  ],
  psychologist: [
    { en: "I'm feeling stressed", te: "నాకు ఒత్తిడిగా ఉంది" },
    { en: "Help me relax", te: "విశ్రాంతి తీసుకోండి" },
    { en: "Motivation for today", te: "ఈ రోజు ప్రేరణ" }
  ]
};

export default function AIChat() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [chatType, setChatType] = useState("general");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  const sendMessage = async (customMessage = null) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend) return;

    setInput("");
    setLoading(true);

    const tempId = Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      message: messageToSend,
      response: null,
      chat_type: chatType,
      created_at: new Date().toISOString()
    }]);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: messageToSend,
        chat_type: chatType
      });

      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? response.data : msg
      ));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send message");
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentChatType = CHAT_TYPES.find(t => t.value === chatType);
  const quickPrompts = QUICK_PROMPTS[chatType] || QUICK_PROMPTS.general;

  const getWelcomeMessage = () => {
    const messages = {
      general: {
        en: "Hi! I'm your AI assistant for My Dammaiguda. How can I help you today?",
        te: "హాయ్! నేను మై దమ్మాయిగూడ AI అసిస్టెంట్. ఈ రోజు మీకు ఎలా సహాయం చేయగలను?"
      },
      health: {
        en: "Hello! I'm here to help with health-related questions. Ask me about wellness, pollution health concerns, or general health tips!",
        te: "హలో! ఆరోగ్య సంబంధిత ప్రశ్నలకు సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను!"
      },
      fitness: {
        en: "Hey there! Ready to help you with workout plans, fitness tips, and safe exercise timing based on air quality.",
        te: "హాయ్! వర్కౌట్ ప్లాన్లు, ఫిట్‌నెస్ చిట్కాలతో సహాయం చేయడానికి సిద్ధంగా ఉన్నాను."
      },
      doctor: {
        en: "Hello! I can help with diet recommendations, basic health guidance, and wellness tips. Note: I'm not a replacement for real doctors!",
        te: "హలో! ఆహార సిఫార్సులు, ప్రాథమిక ఆరోగ్య మార్గదర్శకత్వంతో సహాయం చేయగలను. గమనిక: నేను నిజమైన వైద్యులకు ప్రత్యామ్నాయం కాదు!"
      },
      psychologist: {
        en: "Hello! I'm Kaizer Mind, your mental wellness companion. I'm here to listen and support you. Feel free to share what's on your mind.",
        te: "హలో! నేను కైజర్ మైండ్, మీ మానసిక ఆరోగ్య సహచరుడు. వినడానికి నేను ఇక్కడ ఉన్నాను."
      }
    };
    return messages[chatType]?.[language] || messages.general[language];
  };

  return (
    <Layout showBackButton title={language === "te" ? "AI చాట్" : "AI Chat"}>
      <div className="flex flex-col h-[calc(100vh-140px)]" data-testid="ai-chat">
        
        {/* Header with Chat Type */}
        <div className="pb-3 border-b border-border/50">
          <button 
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className={`w-full flex items-center justify-between p-3 rounded-xl ${currentChatType?.bg} transition-all`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${currentChatType?.gradient} flex items-center justify-center text-white shadow-lg`}>
                {currentChatType?.icon}
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{currentChatType?.label[language]}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "te" ? "AI సహాయకుడు" : "AI Assistant"}
                </p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showTypeSelector ? "rotate-180" : ""}`} />
          </button>
          
          {/* Type Selector Dropdown */}
          {showTypeSelector && (
            <div className="mt-2 p-2 bg-background border border-border rounded-xl shadow-lg space-y-1 animate-in slide-in-from-top-2">
              {CHAT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => { setChatType(type.value); setShowTypeSelector(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    chatType === type.value ? type.bg : "hover:bg-muted"
                  }`}
                  data-testid={`chat-type-${type.value}`}
                >
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${type.gradient} flex items-center justify-center text-white`}>
                    {type.icon}
                  </div>
                  <span className="font-medium text-sm">{type.label[language]}</span>
                  {chatType === type.value && (
                    <Check className="h-4 w-4 ml-auto text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${currentChatType?.gradient} flex items-center justify-center text-white shadow-xl animate-pulse`}>
                <Bot className="h-8 w-8" />
              </div>
              <p className="text-sm text-muted-foreground">{language === "te" ? "లోడ్ అవుతోంది..." : "Loading..."}</p>
            </div>
          ) : (
            <>
              {/* Welcome State */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full px-4">
                  <div className={`h-20 w-20 rounded-3xl bg-gradient-to-br ${currentChatType?.gradient} flex items-center justify-center text-white shadow-2xl mb-4`}>
                    <Bot className="h-10 w-10" />
                  </div>
                  <h2 className="text-lg font-bold text-center mb-2">
                    {language === "te" ? "మీకు స్వాగతం!" : "Welcome!"}
                  </h2>
                  <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
                    {getWelcomeMessage()}
                  </p>
                  
                  {/* Quick Prompts */}
                  <div className="w-full space-y-2">
                    <p className="text-xs text-muted-foreground text-center mb-2">
                      {language === "te" ? "త్వరిత ప్రశ్నలు" : "Quick prompts"}
                    </p>
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(prompt[language])}
                        className="w-full p-3 text-left text-sm bg-muted/50 hover:bg-muted rounded-xl transition-colors border border-border/50"
                      >
                        {prompt[language]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, idx) => (
                <div key={msg.id} className="space-y-3 px-1">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] space-y-1">
                      <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl rounded-br-md p-4 shadow-md">
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right px-2">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  {msg.response && (
                    <div className="flex gap-2">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${currentChatType?.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="max-w-[85%] space-y-1">
                        <div className={`${currentChatType?.bg} rounded-2xl rounded-tl-md p-4 border border-border/30`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.response}</p>
                        </div>
                        <div className="flex items-center gap-2 px-2">
                          <button
                            onClick={() => copyToClipboard(msg.response, msg.id)}
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            {copiedId === msg.id ? (
                              <><Check className="h-3 w-3" /> {language === "te" ? "కాపీ అయింది" : "Copied"}</>
                            ) : (
                              <><Copy className="h-3 w-3" /> {language === "te" ? "కాపీ" : "Copy"}</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {!msg.response && loading && idx === messages.length - 1 && (
                    <div className="flex gap-2">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${currentChatType?.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className={`${currentChatType?.bg} rounded-2xl rounded-tl-md p-4 border border-border/30`}>
                        <div className="flex gap-1.5">
                          <span className="h-2 w-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="h-2 w-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="h-2 w-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
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
        <div className="pt-3 border-t border-border/50 space-y-2">
          {messages.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={clearHistory}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-1 rounded-full hover:bg-muted transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                {language === "te" ? "చరిత్ర క్లియర్" : "Clear chat"}
              </button>
            </div>
          )}
          
          <div className="relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === "te" ? "మీ సందేశం టైప్ చేయండి..." : "Type your message..."}
              className="h-14 rounded-2xl pl-5 pr-14 bg-muted/50 border-border/50 focus:bg-background transition-colors"
              disabled={loading}
              data-testid="chat-input"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-gradient-to-br ${currentChatType?.gradient} text-white shadow-lg hover:shadow-xl transition-all`}
              data-testid="send-message-btn"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* Disclaimer */}
          <p className="text-[10px] text-center text-muted-foreground">
            {language === "te" 
              ? "AI సలహాలు వృత్తిపరమైన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు"
              : "AI advice is not a substitute for professional advice"}
          </p>
        </div>
      </div>
    </Layout>
  );
}
