import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  AlertTriangle,
  Activity,
  Heart,
  Plus,
  ChevronRight,
  Users,
  MapPin,
  Newspaper,
  MessageSquare,
  Camera,
  Video,
  Type,
  X,
  Eye,
  Loader2,
  Trash2,
  Clock,
  Wind,
  Gift,
  Stethoscope,
  PenSquare,
  Play,
  Send,
  Bot,
  Trash,
  Ticket,
  FileText
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stories state
  const [storiesFeed, setStoriesFeed] = useState([]);
  const [myStories, setMyStories] = useState(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStoryUser, setCurrentStoryUser] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [storyAds, setStoryAds] = useState([]);
  
  // Story creation
  const [storyType, setStoryType] = useState("text");
  const [storyText, setStoryText] = useState("");
  const [storyMedia, setStoryMedia] = useState(null);
  const [storyBgColor, setStoryBgColor] = useState("#6366f1");
  const [creatingStory, setCreatingStory] = useState(false);
  const fileInputRef = useRef(null);
  const storyTimerRef = useRef(null);

  // Groups state
  const [myGroups, setMyGroups] = useState([]);
  
  // AQI data
  const [aqiData, setAqiData] = useState(null);
  
  // Wall posts for widget
  const [latestWallPost, setLatestWallPost] = useState(null);
  
  // Benefits data
  const [benefits, setBenefits] = useState([]);
  
  // Floating AI Chat
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const bgColors = [
    "#6366f1", "#ec4899", "#8b5cf6", "#10b981", 
    "#f59e0b", "#ef4444", "#3b82f6", "#14b8a6"
  ];

  useEffect(() => {
    fetchDashboardData();
    return () => {
      if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [issuesRes, storiesRes, groupsRes, aqiRes, adsRes, wallRes, benefitsRes] = await Promise.all([
        axios.get(`${API}/issues?limit=3`).catch(() => ({ data: { issues: [] } })),
        axios.get(`${API}/stories/feed`, { headers }).catch(() => ({ data: { feed: [], my_stories: null } })),
        axios.get(`${API}/wall/groups`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/aqi/both`).catch(() => ({ data: null })),
        axios.get(`${API}/stories/ads/stories`, { headers }).catch(() => ({ data: { ads: [] } })),
        axios.get(`${API}/wall/posts?limit=1`, { headers }).catch(() => ({ data: { posts: [] } })),
        axios.get(`${API}/benefits`).catch(() => ({ data: [] }))
      ]);
      
      setRecentIssues(issuesRes.data?.issues || issuesRes.data || []);
      setStoriesFeed(storiesRes.data?.feed || []);
      setMyStories(storiesRes.data?.my_stories);
      setMyGroups(groupsRes.data || []);
      setAqiData(aqiRes.data);
      setStoryAds(adsRes.data?.ads || []);
      setLatestWallPost(wallRes.data?.posts?.[0] || null);
      setBenefits(benefitsRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Story functions
  const createStory = async () => {
    if (storyType === "text" && !storyText.trim()) {
      toast.error(language === "te" ? "టెక్స్ట్ అవసరం" : "Text is required");
      return;
    }
    if (storyType !== "text" && !storyMedia) {
      toast.error(language === "te" ? "మీడియా అవసరం" : "Media is required");
      return;
    }

    setCreatingStory(true);
    try {
      await axios.post(`${API}/stories/create`, {
        content_type: storyType,
        text: storyText || null,
        media_url: storyMedia,
        background_color: storyBgColor
      }, { headers });

      toast.success(language === "te" ? "స్టోరీ పోస్ట్ అయింది!" : "Story posted!");
      setShowCreateStory(false);
      setStoryText("");
      setStoryMedia(null);
      setStoryType("text");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to create story");
    } finally {
      setCreatingStory(false);
    }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Invalid file type");
      return;
    }

    setStoryType(isImage ? "image" : "video");

    const reader = new FileReader();
    reader.onloadend = () => setStoryMedia(reader.result);
    reader.readAsDataURL(file);
  };

  const openStoryViewer = async (storyUser) => {
    setCurrentStoryUser(storyUser);
    setCurrentStoryIndex(0);
    setStoryProgress(0);
    setShowStoryViewer(true);

    if (storyUser.stories[0] && !storyUser.stories[0].viewed_by_me) {
      await axios.post(`${API}/stories/view`, { story_id: storyUser.stories[0].id }, { headers }).catch(() => {});
    }

    startStoryTimer(storyUser.stories.length);
  };

  const startStoryTimer = (totalStories) => {
    if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    
    setStoryProgress(0);
    const duration = 5000;
    const interval = 50;
    let progress = 0;

    storyTimerRef.current = setInterval(() => {
      progress += (100 / (duration / interval));
      setStoryProgress(progress);

      if (progress >= 100) {
        goToNextStory();
      }
    }, interval);
  };

  const goToNextStory = async () => {
    if (!currentStoryUser) return;

    const nextIndex = currentStoryIndex + 1;
    if (nextIndex < currentStoryUser.stories.length) {
      setCurrentStoryIndex(nextIndex);
      setStoryProgress(0);
      
      const nextStory = currentStoryUser.stories[nextIndex];
      if (!nextStory.viewed_by_me) {
        await axios.post(`${API}/stories/view`, { story_id: nextStory.id }, { headers }).catch(() => {});
      }
      
      startStoryTimer(currentStoryUser.stories.length);
    } else {
      closeStoryViewer();
    }
  };

  const goToPrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setStoryProgress(0);
      startStoryTimer(currentStoryUser.stories.length);
    }
  };

  const closeStoryViewer = () => {
    if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    setShowStoryViewer(false);
    setCurrentStoryUser(null);
    fetchDashboardData();
  };

  const fetchViewers = async (storyId) => {
    try {
      const response = await axios.get(`${API}/stories/${storyId}/viewers`, { headers });
      setViewers(response.data.viewers || []);
      setShowViewers(true);
    } catch (error) {
      toast.error("Failed to load viewers");
    }
  };

  const deleteStory = async (storyId) => {
    try {
      await axios.delete(`${API}/stories/${storyId}`, { headers });
      toast.success(language === "te" ? "స్టోరీ తొలగించబడింది" : "Story deleted");
      closeStoryViewer();
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to delete story");
    }
  };

  // Quick AI Chat
  const sendAiMessage = async () => {
    if (!aiMessage.trim()) return;
    
    setAiLoading(true);
    try {
      const response = await axios.post(`${API}/chat/message`, {
        message: aiMessage,
        assistant_type: "general"
      }, { headers });
      
      setAiResponse(response.data.response);
      setAiMessage("");
    } catch (error) {
      toast.error("Failed to get AI response");
    } finally {
      setAiLoading(false);
    }
  };

  // Get AQI color and status
  const getAqiInfo = (aqi) => {
    if (!aqi) return { bg: "bg-gray-100", text: "text-gray-600", status: "Loading", status_te: "లోడ్ అవుతోంది" };
    if (aqi <= 50) return { bg: "bg-green-100", text: "text-green-700", status: "Good", status_te: "మంచి" };
    if (aqi <= 100) return { bg: "bg-yellow-100", text: "text-yellow-700", status: "Moderate", status_te: "మధ్యస్థం" };
    if (aqi <= 150) return { bg: "bg-orange-100", text: "text-orange-700", status: "Poor", status_te: "చెడు" };
    if (aqi <= 200) return { bg: "bg-red-100", text: "text-red-700", status: "Unhealthy", status_te: "అనారోగ్యకరమైన" };
    if (aqi <= 300) return { bg: "bg-purple-100", text: "text-purple-700", status: "Very Unhealthy", status_te: "చాలా అనారోగ్యకరమైన" };
    return { bg: "bg-rose-100", text: "text-rose-800", status: "Hazardous", status_te: "ప్రమాదకరమైన" };
  };
  
  // Legacy function for backward compatibility
  const getAqiColor = (aqi) => {
    const info = getAqiInfo(aqi);
    return `${info.bg} ${info.text}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const currentStory = currentStoryUser?.stories[currentStoryIndex];

  return (
    <Layout>
      <div className="space-y-3 pb-20" data-testid="dashboard">
        {/* Stories Bar */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Add Story Button */}
          <button
            onClick={() => setShowCreateStory(true)}
            className="flex flex-col items-center flex-shrink-0"
            data-testid="add-story-btn"
          >
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                {myStories ? (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                ) : (
                  <Plus className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                <Plus className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <span className="text-[9px] mt-1 text-text-muted">
              {language === "te" ? "స్టోరీ" : "Story"}
            </span>
          </button>

          {/* My Stories */}
          {myStories && (
            <button
              onClick={() => openStoryViewer(myStories)}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className={`h-14 w-14 rounded-full p-[2px] ${myStories.has_unseen ? "bg-gradient-to-br from-primary via-secondary to-pink-500" : "bg-gray-300"}`}>
                <div className="h-full w-full rounded-full bg-white p-[2px]">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                </div>
              </div>
              <span className="text-[9px] mt-1 text-text-muted truncate max-w-[50px]">
                {language === "te" ? "మీరు" : "You"}
              </span>
            </button>
          )}

          {/* Other Stories */}
          {storiesFeed.map((storyUser) => (
            <button
              key={storyUser.user_id}
              onClick={() => openStoryViewer(storyUser)}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className={`h-14 w-14 rounded-full p-[2px] ${storyUser.has_unseen ? "bg-gradient-to-br from-primary via-secondary to-pink-500" : "bg-gray-300"}`}>
                <div className="h-full w-full rounded-full bg-white p-[2px]">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                    {storyUser.user_name?.[0]?.toUpperCase() || "?"}
                  </div>
                </div>
              </div>
              <span className="text-[9px] mt-1 text-text-muted truncate max-w-[50px]">
                {storyUser.user_name?.split(" ")[0]}
              </span>
            </button>
          ))}

          {/* Groups as Circles */}
          {myGroups.slice(0, 5).map((group) => (
            <Link
              key={group.id}
              to="/wall"
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className="relative">
                <div className="h-14 w-14 rounded-full p-[2px] bg-gradient-to-br from-purple-400 to-pink-500">
                  <div className="h-full w-full rounded-full bg-white p-[2px]">
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                      {group.name?.[0]?.toUpperCase() || "G"}
                    </div>
                  </div>
                </div>
                {/* Notification badge for unread messages */}
                {group.unread_count > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[9px] text-white font-bold">
                      {group.unread_count > 9 ? "9+" : group.unread_count}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[9px] mt-1 text-text-muted truncate max-w-[50px]">
                {group.name?.substring(0, 6)}
              </span>
            </Link>
          ))}
        </div>

        {/* Quick Actions Row 1 - Report, Issues, Dump Yard */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/report" data-testid="quick-action-report">
            <div className="h-16 rounded-xl bg-red-50 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform border border-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <span className="text-[10px] mt-1 font-medium text-red-700">{language === "te" ? "రిపోర్ట్" : "Report"}</span>
            </div>
          </Link>
          <Link to="/issues" data-testid="quick-action-issues">
            <div className="h-16 rounded-xl bg-orange-50 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform border border-orange-100">
              <FileText className="h-6 w-6 text-orange-600" />
              <span className="text-[10px] mt-1 font-medium text-orange-700">{language === "te" ? "సమస్యలు" : "Issues"}</span>
            </div>
          </Link>
          <Link to="/dump-yard" data-testid="quick-action-dump">
            <div className="h-16 rounded-xl bg-amber-50 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform border border-amber-100">
              <Trash className="h-6 w-6 text-amber-600" />
              <span className="text-[10px] mt-1 font-medium text-amber-700">{language === "te" ? "డంప్ యార్డ్" : "Dump"}</span>
            </div>
          </Link>
        </div>

        {/* Quick Actions Row 2 - Fit, Doctor, My Family */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/fitness" data-testid="quick-action-fit">
            <div className="h-16 rounded-xl bg-blue-50 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform border border-blue-100">
              <Activity className="h-6 w-6 text-blue-600" />
              <span className="text-[10px] mt-1 font-medium text-blue-700">{language === "te" ? "ఫిట్" : "Fit"}</span>
            </div>
          </Link>
          <Link to="/doctor" data-testid="quick-action-doctor">
            <div className="h-16 rounded-xl bg-teal-50 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform border border-teal-100">
              <Stethoscope className="h-6 w-6 text-teal-600" />
              <span className="text-[10px] mt-1 font-medium text-teal-700">{language === "te" ? "డాక్టర్" : "Doctor"}</span>
            </div>
          </Link>
          <Link to="/family" data-testid="quick-action-family">
            <div className="h-16 rounded-xl bg-purple-50 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform border border-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
              <span className="text-[10px] mt-1 font-medium text-purple-700">{language === "te" ? "కుటుంబం" : "Family"}</span>
            </div>
          </Link>
        </div>

        {/* AQI Widgets - Two cards side by side */}
        <div className="grid grid-cols-2 gap-3" data-testid="aqi-widgets">
          {/* Hyderabad AQI Widget */}
          <Link to="/aqi">
            <Card className="border-border/50 overflow-hidden h-full">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-lg ${getAqiInfo(aqiData?.hyderabad?.aqi).bg} ${getAqiInfo(aqiData?.hyderabad?.aqi).text} flex items-center justify-center`}>
                    <Wind className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {language === "te" ? "హైదరాబాద్" : "Hyderabad"}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="font-bold text-2xl">{aqiData?.hyderabad?.aqi || "—"}</p>
                  <Badge className={`${getAqiInfo(aqiData?.hyderabad?.aqi).bg} ${getAqiInfo(aqiData?.hyderabad?.aqi).text} text-[10px]`}>
                    {language === "te" ? getAqiInfo(aqiData?.hyderabad?.aqi).status_te : getAqiInfo(aqiData?.hyderabad?.aqi).status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          {/* Dammaiguda AQI Widget */}
          <Link to="/aqi">
            <Card className="border-border/50 overflow-hidden h-full">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-lg ${getAqiInfo(aqiData?.dammaiguda?.aqi).bg} ${getAqiInfo(aqiData?.dammaiguda?.aqi).text} flex items-center justify-center`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {language === "te" ? "దమ్మాయిగూడ" : "Dammaiguda"}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="font-bold text-2xl">{aqiData?.dammaiguda?.aqi || "—"}</p>
                  <Badge className={`${getAqiInfo(aqiData?.dammaiguda?.aqi).bg} ${getAqiInfo(aqiData?.dammaiguda?.aqi).text} text-[10px]`}>
                    {language === "te" ? getAqiInfo(aqiData?.dammaiguda?.aqi).status_te : getAqiInfo(aqiData?.dammaiguda?.aqi).status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Wall Widget - Medium Sized */}
        <Card className="border-border/50 overflow-hidden" data-testid="wall-widget">
          <CardContent className="p-0">
            <div className="p-3 bg-primary/5 border-b border-border/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <PenSquare className="h-4 w-4 text-primary" />
                  {language === "te" ? "సిటిజన్ వాల్" : "Citizen Wall"}
                </h3>
                <Link to="/wall" className="text-xs text-primary flex items-center">
                  {language === "te" ? "అన్నీ చూడండి" : "View All"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            {latestWallPost ? (
              <Link to="/wall" className="block p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {latestWallPost.user_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{latestWallPost.user_name}</p>
                      <span className="text-xs text-muted-foreground">
                        {latestWallPost.created_at ? new Date(latestWallPost.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {latestWallPost.content?.substring(0, 100)}...
                    </p>
                    {latestWallPost.media_url && (
                      <div className="mt-2 h-24 rounded-lg bg-muted overflow-hidden">
                        <img src={latestWallPost.media_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ) : (
              <Link to="/wall" className="block p-4">
                <div className="text-center py-4">
                  <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === "te" ? "కమ్యూనిటీలో చేరండి" : "Join the community"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "te" ? "మీ పొరుగువారితో కనెక్ట్ అవ్వండి" : "Connect with your neighbors"}
                  </p>
                </div>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Citizen Benefits Slider */}
        <div data-testid="benefits-section">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {language === "te" ? "పౌర ప్రయోజనాలు" : "Citizen Benefits"}
            </h3>
            <Link to="/benefits" className="text-xs text-primary flex items-center">
              {language === "te" ? "అన్నీ" : "All"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {/* Static benefit cards */}
            <Link to="/benefits" className="flex-shrink-0 w-56">
              <div className="h-32 rounded-xl overflow-hidden relative shadow-md">
                <img 
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=200&fit=crop" 
                  alt="Senior Pension" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-sm">
                    {language === "te" ? "వృద్ధాప్య పెన్షన్" : "Senior Pension Scheme"}
                  </p>
                  <p className="text-white/80 text-xs">₹2,500/month</p>
                </div>
              </div>
            </Link>
            <Link to="/benefits" className="flex-shrink-0 w-56">
              <div className="h-32 rounded-xl overflow-hidden relative shadow-md">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop" 
                  alt="Health Camp" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-sm">
                    {language === "te" ? "ఉచిత ఆరోగ్య క్యాంప్" : "Free Health Camp"}
                  </p>
                  <p className="text-white/80 text-xs">{language === "te" ? "ప్రతి ఆదివారం" : "Every Sunday"}</p>
                </div>
              </div>
            </Link>
            <Link to="/benefits" className="flex-shrink-0 w-56">
              <div className="h-32 rounded-xl overflow-hidden relative shadow-md">
                <img 
                  src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=200&fit=crop" 
                  alt="Education" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-sm">
                    {language === "te" ? "విద్యా స్కాలర్‌షిప్" : "Education Scholarship"}
                  </p>
                  <p className="text-white/80 text-xs">₹15,000/year</p>
                </div>
              </div>
            </Link>
            <Link to="/benefits" className="flex-shrink-0 w-56">
              <div className="h-32 rounded-xl overflow-hidden relative shadow-md">
                <img 
                  src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=200&fit=crop" 
                  alt="Ration" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-sm">
                    {language === "te" ? "రేషన్ కార్డు" : "Ration Card Benefits"}
                  </p>
                  <p className="text-white/80 text-xs">{language === "te" ? "ఉచిత బియ్యం" : "Free Rice"}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Discount Vouchers Widget */}
        <div data-testid="vouchers-section">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Ticket className="h-5 w-5 text-green-600" />
              {language === "te" ? "డిస్కౌంట్ వౌచర్లు" : "Discount Vouchers"}
            </h3>
            <Link to="/vouchers" className="text-xs text-primary flex items-center">
              {language === "te" ? "అన్నీ" : "All"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            <div className="flex-shrink-0 w-44">
              <Card className="border-green-200 bg-green-50 overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">20%</span>
                    </div>
                    <span className="text-xs font-medium text-green-700">
                      {language === "te" ? "మెడికల్" : "Medical"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-green-800">
                    {language === "te" ? "ఔషధాల తగ్గింపు" : "Medicine Discount"}
                  </p>
                  <p className="text-[10px] text-green-600 mt-1">Apollo Pharmacy</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex-shrink-0 w-44">
              <Card className="border-blue-200 bg-blue-50 overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">15%</span>
                    </div>
                    <span className="text-xs font-medium text-blue-700">
                      {language === "te" ? "గ్రోసరీ" : "Grocery"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-blue-800">
                    {language === "te" ? "కిరాణా తగ్గింపు" : "Grocery Discount"}
                  </p>
                  <p className="text-[10px] text-blue-600 mt-1">More Supermarket</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex-shrink-0 w-44">
              <Card className="border-purple-200 bg-purple-50 overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">₹50</span>
                    </div>
                    <span className="text-xs font-medium text-purple-700">
                      {language === "te" ? "రవాణా" : "Transport"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-purple-800">
                    {language === "te" ? "బస్ పాస్ తగ్గింపు" : "Bus Pass Off"}
                  </p>
                  <p className="text-[10px] text-purple-600 mt-1">TSRTC</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setShowAiChat(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
        data-testid="floating-ai-btn"
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Quick AI Chat Dialog */}
      <Dialog open={showAiChat} onOpenChange={setShowAiChat}>
        <DialogContent className="max-w-md max-h-[70vh] p-0 overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5" />
              {language === "te" ? "AI సహాయకుడు" : "AI Assistant"}
            </DialogTitle>
          </div>
          <div className="p-4 space-y-3">
            {aiResponse && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendAiMessage()}
                placeholder={language === "te" ? "మీ ప్రశ్న అడగండి..." : "Ask your question..."}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                disabled={aiLoading}
              />
              <Button onClick={sendAiMessage} disabled={aiLoading} size="sm">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { en: "Weather today?", te: "ఈ రోజు వాతావరణం?" },
                { en: "Health tips", te: "ఆరోగ్య చిట్కాలు" },
                { en: "Local news", te: "స్థానిక వార్తలు" }
              ].map((prompt, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setAiMessage(language === "te" ? prompt.te : prompt.en)}
                >
                  {language === "te" ? prompt.te : prompt.en}
                </Button>
              ))}
            </div>
            <Link to="/chat" className="block">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                {language === "te" ? "పూర్తి చాట్ తెరవండి" : "Open Full Chat"} →
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Story Dialog */}
      <Dialog open={showCreateStory} onOpenChange={setShowCreateStory}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-primary to-secondary text-white">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Camera className="h-5 w-5" />
              {language === "te" ? "స్టోరీ సృష్టించండి" : "Create Story"}
            </DialogTitle>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <Button
                variant={storyType === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => { setStoryType("text"); setStoryMedia(null); }}
                className="flex-1 h-9"
              >
                <Type className="h-4 w-4 mr-1" />
                {language === "te" ? "టెక్స్ట్" : "Text"}
              </Button>
              <Button
                variant={storyType === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-9"
              >
                <Camera className="h-4 w-4 mr-1" />
                {language === "te" ? "ఫోటో" : "Photo"}
              </Button>
              <Button
                variant={storyType === "video" ? "default" : "outline"}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-9"
              >
                <Video className="h-4 w-4 mr-1" />
                {language === "te" ? "వీడియో" : "Video"}
              </Button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMediaSelect}
              accept="image/*,video/*"
              className="hidden"
            />

            <div 
              className="aspect-[9/16] max-h-[250px] rounded-xl overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: storyType === "text" ? storyBgColor : "#000" }}
            >
              {storyType === "text" ? (
                <textarea
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder={language === "te" ? "మీ స్టోరీ టైప్ చేయండి..." : "Type your story..."}
                  className="w-full h-full bg-transparent text-white text-center text-base p-4 resize-none placeholder:text-white/50 focus:outline-none"
                />
              ) : storyMedia ? (
                storyType === "image" ? (
                  <img src={storyMedia} alt="Preview" className="max-h-full object-contain" />
                ) : (
                  <video src={storyMedia} controls className="max-h-full" />
                )
              ) : (
                <div className="text-white/50 text-center">
                  <Camera className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">{language === "te" ? "మీడియా ఎంచుకోండి" : "Select media"}</p>
                </div>
              )}
            </div>

            {storyType === "text" && (
              <div className="flex gap-1.5 justify-center">
                {bgColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setStoryBgColor(color)}
                    className={`h-7 w-7 rounded-full ${storyBgColor === color ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            <Button
              onClick={createStory}
              disabled={creatingStory}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              {creatingStory ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {language === "te" ? "పోస్ట్ చేయండి" : "Post Story"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Story Viewer */}
      {showStoryViewer && currentStoryUser && currentStory && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex gap-1 p-2 pt-4">
            {currentStoryUser.stories.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{
                    width: idx < currentStoryIndex ? "100%" : idx === currentStoryIndex ? `${storyProgress}%` : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                {currentStoryUser.user_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{currentStoryUser.user_name}</p>
                <p className="text-white/60 text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {currentStory.time_remaining}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentStoryUser.user_id === user?.id && (
                <>
                  <button onClick={() => fetchViewers(currentStory.id)} className="text-white/80 hover:text-white p-2">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button onClick={() => deleteStory(currentStory.id)} className="text-white/80 hover:text-red-400 p-2">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
              <button onClick={closeStoryViewer} className="text-white p-2">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <button onClick={goToPrevStory} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" />
            <button onClick={goToNextStory} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" />

            <div className="absolute inset-0 flex items-center justify-center">
              {currentStory.content_type === "text" ? (
                <div className="w-full h-full flex items-center justify-center p-8" style={{ backgroundColor: currentStory.background_color }}>
                  <p className="text-white text-xl text-center font-medium">{currentStory.text}</p>
                </div>
              ) : currentStory.content_type === "image" ? (
                <img src={currentStory.media_url} alt="Story" className="max-h-full max-w-full object-contain" />
              ) : (
                <video src={currentStory.media_url} autoPlay className="max-h-full max-w-full" />
              )}
            </div>
          </div>

          {currentStoryUser.user_id === user?.id && (
            <div className="p-4">
              <button onClick={() => fetchViewers(currentStory.id)} className="flex items-center gap-2 text-white/80">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{currentStory.view_count || 0} {language === "te" ? "వ్యూలు" : "views"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Viewers Dialog */}
      <Dialog open={showViewers} onOpenChange={setShowViewers}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {language === "te" ? "వీక్షకులు" : "Viewers"} ({viewers.length})
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {viewers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {language === "te" ? "ఇంకా వ్యూలు లేవు" : "No views yet"}
              </p>
            ) : (
              viewers.map((viewer) => (
                <div key={viewer.id} className="flex items-center gap-3 p-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {viewer.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium">{viewer.name}</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
