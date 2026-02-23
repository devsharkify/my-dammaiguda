import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Newspaper,
  Clock,
  Eye,
  ThumbsUp,
  Heart,
  Share2,
  RefreshCw,
  Loader2,
  MapPin,
  Building2,
  Calendar,
  Stethoscope,
  GraduationCap,
  Trophy,
  Sparkles,
  TrendingUp,
  Flame,
  ChevronRight,
  Bookmark,
  MessageCircle
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { id: "all", name: "All", name_te: "అన్నీ", icon: Sparkles, color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { id: "trending", name: "Trending", name_te: "ట్రెండింగ్", icon: TrendingUp, color: "bg-gradient-to-r from-red-500 to-orange-500" },
  { id: "local", name: "Local", name_te: "స్థానికం", icon: MapPin, color: "bg-blue-500" },
  { id: "government", name: "Government", name_te: "ప్రభుత్వం", icon: Building2, color: "bg-purple-600" },
  { id: "health", name: "Health", name_te: "ఆరోగ్యం", icon: Stethoscope, color: "bg-red-500" },
  { id: "education", name: "Education", name_te: "విద్య", icon: GraduationCap, color: "bg-indigo-500" },
  { id: "sports", name: "Sports", name_te: "క్రీడలు", icon: Trophy, color: "bg-green-500" },
  { id: "events", name: "Events", name_te: "ఈవెంట్స్", icon: Calendar, color: "bg-pink-500" }
];

export default function NewsPage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [savedNews, setSavedNews] = useState([]);

  useEffect(() => {
    fetchNews();
  }, [activeCategory]);

  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      let url = `${API}/news/local`;
      if (activeCategory !== "all" && activeCategory !== "trending") {
        url = `${API}/news/${activeCategory}`;
      }
      const response = await axios.get(url);
      let newsData = response.data?.news || response.data || [];
      
      // Handle different response formats
      if (!Array.isArray(newsData)) {
        newsData = [];
      }
      
      // Sort by views for trending
      if (activeCategory === "trending") {
        newsData = newsData.sort((a, b) => (b.views || 0) - (a.views || 0));
      }
      
      // If no news from API, show empty state
      if (newsData.length === 0) {
        // No fallback to mock data - show empty state
      }
      
      setNews(newsData);
      if (isRefresh) {
        toast.success(language === "te" ? "రిఫ్రెష్ అయింది" : "Refreshed");
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      // Show empty state instead of mock data
      setNews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSampleNews = () => [
    {
      id: "1",
      title: "Metro Extension to Dammaiguda Approved",
      title_te: "దమ్మాయిగూడకు మెట్రో విస్తరణ ఆమోదం",
      summary: "Telangana government approves metro extension connecting Dammaiguda to city center. Work to begin next year.",
      summary_te: "తెలంగాణ ప్రభుత్వం దమ్మాయిగూడను సిటీ సెంటర్‌కు కలుపుతూ మెట్రో విస్తరణను ఆమోదించింది.",
      category: "local",
      image_url: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800",
      created_at: new Date().toISOString(),
      views: 2456,
      reactions: { like: 234, love: 156 },
      is_breaking: true
    },
    {
      id: "2",
      title: "Free Health Camp This Sunday",
      title_te: "ఈ ఆదివారం ఉచిత ఆరోగ్య క్యాంప్",
      summary: "Free health screening at Community Hall including general checkup, eye testing, and dental screening.",
      summary_te: "కమ్యూనిటీ హాల్‌లో ఉచిత ఆరోగ్య పరీక్ష - జనరల్ చెకప్, కంటి పరీక్ష, దంత పరీక్ష.",
      category: "health",
      image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      views: 1823,
      reactions: { like: 345, love: 234 }
    },
    {
      id: "3",
      title: "Local School Wins State Quiz Championship",
      title_te: "స్థానిక పాఠశాల రాష్ట్ర క్విజ్ ఛాంపియన్‌షిప్ గెలిచింది",
      summary: "Government High School students win first place in State Science Quiz held in Hyderabad.",
      summary_te: "హైదరాబాద్‌లో జరిగిన రాష్ట్ర సైన్స్ క్విజ్‌లో ప్రభుత్వ హైస్కూల్ విద్యార్థులు మొదటి స్థానం.",
      category: "education",
      image_url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      views: 1234,
      reactions: { like: 456, love: 123 }
    },
    {
      id: "4",
      title: "New Road Development Project Launched",
      title_te: "కొత్త రోడ్డు అభివృద్ధి ప్రాజెక్ట్ ప్రారంభం",
      summary: "MLA inaugurates new road widening project connecting main junction to bypass road.",
      summary_te: "మెయిన్ జంక్షన్ నుండి బైపాస్ రోడ్డుకు కలుపుతూ కొత్త రోడ్డు విస్తరణ ప్రాజెక్ట్‌ను MLA ప్రారంభించారు.",
      category: "government",
      image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
      created_at: new Date(Date.now() - 14400000).toISOString(),
      views: 987,
      reactions: { like: 123, love: 45 }
    },
    {
      id: "5",
      title: "Cricket Tournament Finals This Weekend",
      title_te: "ఈ వారాంతంలో క్రికెట్ టోర్నమెంట్ ఫైనల్స్",
      summary: "Annual inter-colony cricket tournament finals at local stadium. Entry free for all.",
      summary_te: "స్థానిక స్టేడియంలో వార్షిక ఇంటర్-కాలనీ క్రికెట్ టోర్నమెంట్ ఫైనల్స్. అందరికీ ఉచిత ప్రవేశం.",
      category: "sports",
      image_url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
      created_at: new Date(Date.now() - 28800000).toISOString(),
      views: 2100,
      reactions: { like: 567, love: 234 }
    }
  ];

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return language === "te" ? `${diffMins} ని. క్రితం` : `${diffMins}m ago`;
    if (diffHours < 24) return language === "te" ? `${diffHours} గం. క్రితం` : `${diffHours}h ago`;
    if (diffDays < 7) return language === "te" ? `${diffDays} రోజుల క్రితం` : `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  const handleReact = async (newsId, reaction) => {
    if (!token) {
      toast.error(language === "te" ? "దయచేసి లాగిన్ అవ్వండి" : "Please login first");
      return;
    }
    
    try {
      await axios.post(
        `${API}/news/${newsId}/react?reaction=${reaction}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNews(prev => prev.map(n => {
        if (n.id === newsId) {
          return {
            ...n,
            reactions: { ...n.reactions, [reaction]: (n.reactions?.[reaction] || 0) + 1 }
          };
        }
        return n;
      }));
    } catch (error) {
      console.error("React error:", error);
    }
  };

  const toggleSave = (newsId) => {
    setSavedNews(prev => 
      prev.includes(newsId) 
        ? prev.filter(id => id !== newsId)
        : [...prev, newsId]
    );
    toast.success(savedNews.includes(newsId) 
      ? (language === "te" ? "తీసివేయబడింది" : "Removed from saved")
      : (language === "te" ? "సేవ్ చేయబడింది" : "Saved")
    );
  };

  const shareNews = (newsItem) => {
    const text = `${language === "te" && newsItem.title_te ? newsItem.title_te : newsItem.title}`;
    
    if (navigator.share) {
      navigator.share({ title: newsItem.title, text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      toast.success(language === "te" ? "కాపీ అయింది" : "Copied");
    }
  };

  const featuredNews = news[0];
  const otherNews = news.slice(1);

  return (
    <Layout title={language === "te" ? "వార్తలు" : "News"}>
      <div className="space-y-4 pb-20" data-testid="news-page">
        {/* Way2News Style Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">
                {language === "te" ? "వార్తలు" : "News"}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {language === "te" ? "తాజా వార్తలు" : "Latest updates"}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full"
            onClick={() => fetchNews(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Category Pills - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? `${cat.color} text-white shadow-lg scale-105`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="h-4 w-4" />
                {language === "te" ? cat.name_te : cat.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-red-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {language === "te" ? "వార్తలు లోడ్ అవుతున్నాయి..." : "Loading news..."}
              </p>
            </div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {language === "te" ? "వార్తలు అందుబాటులో లేవు" : "No news available"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured/Breaking News - Large Card */}
            {featuredNews && (
              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="relative">
                  {/* Image */}
                  <div className="relative h-52">
                    {featuredNews.image_url ? (
                      <img
                        src={featuredNews.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center">
                        <Newspaper className="h-16 w-16 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    
                    {/* Breaking Badge */}
                    {featuredNews.is_breaking && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        <Flame className="h-3 w-3" />
                        {language === "te" ? "బ్రేకింగ్" : "BREAKING"}
                      </div>
                    )}
                    
                    {/* Category */}
                    {!featuredNews.is_breaking && (
                      <Badge className={`absolute top-3 left-3 ${getCategoryInfo(featuredNews.category).color} text-white`}>
                        {language === "te" 
                          ? getCategoryInfo(featuredNews.category).name_te 
                          : getCategoryInfo(featuredNews.category).name}
                      </Badge>
                    )}
                    
                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h2 className="text-white font-bold text-xl leading-tight mb-2">
                        {language === "te" && featuredNews.title_te 
                          ? featuredNews.title_te 
                          : featuredNews.title}
                      </h2>
                      <div className="flex items-center gap-3 text-white/70 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(featuredNews.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {featuredNews.views?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between p-3 bg-slate-900">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-white/70 hover:text-white hover:bg-white/10 h-8 px-2"
                        onClick={() => handleReact(featuredNews.id, "like")}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span className="text-xs">{featuredNews.reactions?.like || 0}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-white/70 hover:text-red-400 hover:bg-white/10 h-8 px-2"
                        onClick={() => handleReact(featuredNews.id, "love")}
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        <span className="text-xs">{featuredNews.reactions?.love || 0}</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                        onClick={() => toggleSave(featuredNews.id)}
                      >
                        <Bookmark className={`h-4 w-4 ${savedNews.includes(featuredNews.id) ? "fill-current text-yellow-400" : ""}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                        onClick={() => shareNews(featuredNews)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* News List - Way2News Style Cards */}
            <div className="space-y-3">
              {otherNews.map((item) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex">
                    {/* Thumbnail */}
                    <div className="w-28 h-24 flex-shrink-0 relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full ${getCategoryInfo(item.category).color} flex items-center justify-center`}>
                          {(() => {
                            const Icon = getCategoryInfo(item.category).icon;
                            return <Icon className="h-8 w-8 text-white/70" />;
                          })()}
                        </div>
                      )}
                      {/* Category overlay */}
                      <div className={`absolute bottom-0 left-0 right-0 py-0.5 px-1.5 text-[10px] font-medium text-white text-center ${getCategoryInfo(item.category).color}`}>
                        {language === "te" 
                          ? getCategoryInfo(item.category).name_te 
                          : getCategoryInfo(item.category).name}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
                          {language === "te" && item.title_te ? item.title_te : item.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {formatTime(item.created_at)}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="h-3 w-3" />
                            {item.views?.toLocaleString() || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-0.5">
                          <button 
                            className="p-1.5 hover:bg-muted rounded-full"
                            onClick={(e) => { e.stopPropagation(); handleReact(item.id, "like"); }}
                          >
                            <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button 
                            className="p-1.5 hover:bg-muted rounded-full"
                            onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }}
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${savedNews.includes(item.id) ? "fill-current text-yellow-500" : "text-muted-foreground"}`} />
                          </button>
                          <button 
                            className="p-1.5 hover:bg-muted rounded-full"
                            onClick={(e) => { e.stopPropagation(); shareNews(item); }}
                          >
                            <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="flex items-center pr-2">
                      <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {news.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => fetchNews()}
              >
                {language === "te" ? "మరిన్ని వార్తలు చూడండి" : "Load more news"}
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
