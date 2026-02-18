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
import AQIWidget from "../components/AQIWidget";
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
  ChevronLeft,
  Loader2,
  Trash2,
  Clock
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
      const [issuesRes, storiesRes, groupsRes] = await Promise.all([
        axios.get(`${API}/issues?limit=3`).catch(() => ({ data: { issues: [] } })),
        axios.get(`${API}/stories/feed`, { headers }).catch(() => ({ data: { feed: [], my_stories: null } })),
        axios.get(`${API}/wall/groups`, { headers }).catch(() => ({ data: [] }))
      ]);
      
      setRecentIssues(issuesRes.data?.issues || issuesRes.data || []);
      setStoriesFeed(storiesRes.data?.feed || []);
      setMyStories(storiesRes.data?.my_stories);
      setMyGroups(groupsRes.data || []);
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

    // Mark first story as viewed
    if (storyUser.stories[0] && !storyUser.stories[0].viewed_by_me) {
      await axios.post(`${API}/stories/view`, { story_id: storyUser.stories[0].id }, { headers }).catch(() => {});
    }

    startStoryTimer(storyUser.stories.length);
  };

  const startStoryTimer = (totalStories) => {
    if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    
    setStoryProgress(0);
    const duration = 5000; // 5 seconds per story
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
      
      // Mark as viewed
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

  const quickActions = [
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: language === "te" ? "సమస్య" : "Report",
      link: "/report",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Activity className="h-5 w-5" />,
      title: language === "te" ? "ఫిట్" : "Fit",
      link: "/fitness",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: language === "te" ? "డాక్టర్" : "Doctor",
      link: "/doctor",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: <Newspaper className="h-5 w-5" />,
      title: language === "te" ? "వార్తలు" : "News",
      link: "/news",
      color: "from-blue-500 to-indigo-500"
    }
  ];

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
      <div className="space-y-4" data-testid="dashboard">
        {/* Stories Bar */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Add Story Button */}
          <button
            onClick={() => setShowCreateStory(true)}
            className="flex flex-col items-center flex-shrink-0"
            data-testid="add-story-btn"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                {myStories ? (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg font-bold">
                    {user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                ) : (
                  <Plus className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                <Plus className="h-3 w-3 text-white" />
              </div>
            </div>
            <span className="text-[10px] mt-1 text-text-muted">
              {language === "te" ? "స్టోరీ" : "Story"}
            </span>
          </button>

          {/* My Stories (if any) */}
          {myStories && (
            <button
              onClick={() => openStoryViewer(myStories)}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className={`h-16 w-16 rounded-full p-[3px] ${myStories.has_unseen ? "bg-gradient-to-br from-primary via-secondary to-pink-500" : "bg-gray-300"}`}>
                <div className="h-full w-full rounded-full bg-white p-[2px]">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                    {user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                </div>
              </div>
              <span className="text-[10px] mt-1 text-text-muted truncate max-w-[60px]">
                {language === "te" ? "మీరు" : "You"}
              </span>
            </button>
          )}

          {/* Other Users' Stories */}
          {storiesFeed.map((storyUser) => (
            <button
              key={storyUser.user_id}
              onClick={() => openStoryViewer(storyUser)}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className={`h-16 w-16 rounded-full p-[3px] ${storyUser.has_unseen ? "bg-gradient-to-br from-primary via-secondary to-pink-500" : "bg-gray-300"}`}>
                <div className="h-full w-full rounded-full bg-white p-[2px]">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {storyUser.user_name?.[0]?.toUpperCase() || "?"}
                  </div>
                </div>
              </div>
              <span className="text-[10px] mt-1 text-text-muted truncate max-w-[60px]">
                {storyUser.user_name?.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Actions - Compact */}
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link}>
              <div className={`h-16 rounded-xl bg-gradient-to-br ${action.color} flex flex-col items-center justify-center text-white shadow-md active:scale-95 transition-transform`}>
                {action.icon}
                <span className="text-[10px] mt-1 font-medium">{action.title}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Groups Quick Access */}
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {language === "te" ? "గ్రూప్‌లు" : "Groups"}
              </h3>
              <Link to="/wall" className="text-xs text-primary flex items-center">
                {language === "te" ? "అన్నీ చూడు" : "See all"}
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            
            {myGroups.length === 0 ? (
              <Link to="/wall">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{language === "te" ? "గ్రూప్‌లో చేరండి" : "Join a Group"}</p>
                    <p className="text-xs text-muted-foreground">{language === "te" ? "కమ్యూనిటీతో కనెక్ట్ అవండి" : "Connect with community"}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {myGroups.slice(0, 4).map((group) => (
                  <Link key={group.id} to="/wall" className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {group.name?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-[10px] text-center mt-1 truncate max-w-[48px]">{group.name?.split(" ")[0]}</p>
                  </Link>
                ))}
                <Link to="/wall" className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] text-center mt-1 text-muted-foreground">{language === "te" ? "మరిన్ని" : "More"}</p>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Citizen Wall Quick Access */}
        <Link to="/wall">
          <Card className="border-border/50 hover:shadow-md transition-shadow bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{language === "te" ? "సిటిజన్ వాల్" : "Citizen Wall"}</h3>
                  <p className="text-xs text-muted-foreground">{language === "te" ? "పోస్ట్‌లు, గ్రూప్‌లు & చాట్" : "Posts, Groups & Chat"}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        {/* AQI Widget */}
        <AQIWidget onViewFullReport={() => navigate("/aqi")} />

        {/* Recent Issues */}
        {recentIssues.length > 0 && (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{language === "te" ? "ఇటీవలి సమస్యలు" : "Recent Issues"}</h3>
                <Link to="/issues" className="text-xs text-primary">{language === "te" ? "అన్నీ" : "All"}</Link>
              </div>
              <div className="space-y-2">
                {recentIssues.slice(0, 3).map((issue) => (
                  <div key={issue.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{issue.description?.substring(0, 40)}...</p>
                      <p className="text-xs text-muted-foreground">{issue.category}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{issue.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Story Dialog */}
      <Dialog open={showCreateStory} onOpenChange={setShowCreateStory}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-primary to-secondary text-white">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {language === "te" ? "స్టోరీ సృష్టించండి" : "Create Story"}
            </DialogTitle>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Story Type Selection */}
            <div className="flex gap-2">
              <Button
                variant={storyType === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => { setStoryType("text"); setStoryMedia(null); }}
                className="flex-1"
              >
                <Type className="h-4 w-4 mr-1" />
                {language === "te" ? "టెక్స్ట్" : "Text"}
              </Button>
              <Button
                variant={storyType === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-1" />
                {language === "te" ? "ఫోటో" : "Photo"}
              </Button>
              <Button
                variant={storyType === "video" ? "default" : "outline"}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
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

            {/* Preview */}
            <div 
              className="aspect-[9/16] max-h-[300px] rounded-xl overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: storyType === "text" ? storyBgColor : "#000" }}
            >
              {storyType === "text" ? (
                <textarea
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder={language === "te" ? "మీ స్టోరీ టైప్ చేయండి..." : "Type your story..."}
                  className="w-full h-full bg-transparent text-white text-center text-lg p-4 resize-none placeholder:text-white/50 focus:outline-none"
                  style={{ minHeight: "200px" }}
                />
              ) : storyMedia ? (
                storyType === "image" ? (
                  <img src={storyMedia} alt="Preview" className="max-h-full object-contain" />
                ) : (
                  <video src={storyMedia} controls className="max-h-full" />
                )
              ) : (
                <div className="text-white/50 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-2" />
                  <p>{language === "te" ? "మీడియా ఎంచుకోండి" : "Select media"}</p>
                </div>
              )}
            </div>

            {/* Background Colors (for text stories) */}
            {storyType === "text" && (
              <div className="flex gap-2 justify-center">
                {bgColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setStoryBgColor(color)}
                    className={`h-8 w-8 rounded-full ${storyBgColor === color ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            {/* Caption for media stories */}
            {storyType !== "text" && storyMedia && (
              <input
                type="text"
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder={language === "te" ? "క్యాప్షన్ జోడించండి..." : "Add caption..."}
                className="w-full p-2 border rounded-lg"
              />
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
          {/* Progress Bars */}
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

          {/* Header */}
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
                  <button
                    onClick={() => fetchViewers(currentStory.id)}
                    className="text-white/80 hover:text-white p-2"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteStory(currentStory.id)}
                    className="text-white/80 hover:text-red-400 p-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
              <button onClick={closeStoryViewer} className="text-white p-2">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Story Content */}
          <div className="flex-1 relative">
            {/* Navigation areas */}
            <button
              onClick={goToPrevStory}
              className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            />
            <button
              onClick={goToNextStory}
              className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
            />

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {currentStory.content_type === "text" ? (
                <div
                  className="w-full h-full flex items-center justify-center p-8"
                  style={{ backgroundColor: currentStory.background_color }}
                >
                  <p className="text-white text-xl text-center font-medium">{currentStory.text}</p>
                </div>
              ) : currentStory.content_type === "image" ? (
                <img src={currentStory.media_url} alt="Story" className="max-h-full max-w-full object-contain" />
              ) : (
                <video src={currentStory.media_url} autoPlay className="max-h-full max-w-full" />
              )}
            </div>

            {/* Caption overlay */}
            {currentStory.text && currentStory.content_type !== "text" && (
              <div className="absolute bottom-20 left-0 right-0 p-4">
                <p className="text-white text-center text-shadow">{currentStory.text}</p>
              </div>
            )}
          </div>

          {/* View count (for own stories) */}
          {currentStoryUser.user_id === user?.id && (
            <div className="p-4">
              <button
                onClick={() => fetchViewers(currentStory.id)}
                className="flex items-center gap-2 text-white/80"
              >
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
