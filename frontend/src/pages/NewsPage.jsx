import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Newspaper,
  Clock,
  Eye,
  ThumbsUp,
  Heart,
  Angry,
  Frown,
  Share2,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Play,
  Zap,
  MapPin,
  Building2,
  Calendar,
  Stethoscope,
  GraduationCap,
  Trophy,
  Sparkles
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NewsPage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState("shorts"); // "shorts" or "feed"
  const containerRef = useRef(null);

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      let url = `${API}/news?limit=30`;
      if (activeCategory !== "all") {
        url += `&category=${activeCategory}`;
      }
      const response = await axios.get(url);
      setNews(response.data?.news || []);
      if (isRefresh) {
        toast.success(language === "te" ? "వార్తలు రిఫ్రెష్ అయ్యాయి" : "News refreshed");
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      // Fallback sample news
      setNews([
        {
          id: "sample-1",
          title: "New Metro Line Approved for Dammaiguda",
          title_te: "దమ్మాయిగూడకు కొత్త మెట్రో లైన్ ఆమోదం",
          summary: "The Telangana government has approved the extension of Metro Rail to Dammaiguda, connecting the suburb to the city center. Construction is expected to begin next year.",
          summary_te: "తెలంగాణ ప్రభుత్వం దమ్మాయిగూడకు మెట్రో రైల్ విస్తరణను ఆమోదించింది. నిర్మాణం వచ్చే సంవత్సరం ప్రారంభం కానుంది.",
          category: "local",
          image_url: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=600",
          created_at: new Date().toISOString(),
          views: 1234,
          reactions: { like: 156, love: 89, angry: 12, sad: 5 }
        },
        {
          id: "sample-2",
          title: "Free Health Camp at Community Hall",
          title_te: "కమ్యూనిటీ హాల్‌లో ఉచిత ఆరోగ్య క్యాంప్",
          summary: "A free health camp will be organized this Sunday at Dammaiguda Community Hall. Services include general checkup, eye testing, and dental screening.",
          summary_te: "ఈ ఆదివారం దమ్మాయిగూడ కమ్యూనిటీ హాల్‌లో ఉచిత ఆరోగ్య క్యాంప్ నిర్వహించబడుతుంది.",
          category: "health",
          image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          views: 567,
          reactions: { like: 234, love: 156, angry: 0, sad: 0 }
        },
        {
          id: "sample-3",
          title: "Local School Wins State Level Quiz",
          title_te: "స్థానిక పాఠశాల రాష్ట్ర స్థాయి క్విజ్ గెలిచింది",
          summary: "Students from Government High School Dammaiguda won first place in the State Level Science Quiz competition held in Hyderabad.",
          summary_te: "హైదరాబాద్‌లో నిర్వహించిన రాష్ట్ర స్థాయి సైన్స్ క్విజ్ పోటీలో దమ్మాయిగూడ ప్రభుత్వ హైస్కూల్ విద్యార్థులు మొదటి స్థానం సాధించారు.",
          category: "education",
          image_url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          views: 890,
          reactions: { like: 345, love: 234, angry: 0, sad: 0 }
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "local": return <MapPin className="h-3.5 w-3.5" />;
      case "government": return <Building2 className="h-3.5 w-3.5" />;
      case "events": return <Calendar className="h-3.5 w-3.5" />;
      case "health": return <Stethoscope className="h-3.5 w-3.5" />;
      case "education": return <GraduationCap className="h-3.5 w-3.5" />;
      case "sports": return <Trophy className="h-3.5 w-3.5" />;
      default: return <Sparkles className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "local": return "bg-blue-500";
      case "government": return "bg-purple-500";
      case "events": return "bg-pink-500";
      case "health": return "bg-red-500";
      case "education": return "bg-indigo-500";
      case "sports": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
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
      // Update local state
      setNews(prev => prev.map(n => {
        if (n.id === newsId) {
          return {
            ...n,
            reactions: {
              ...n.reactions,
              [reaction]: (n.reactions?.[reaction] || 0) + 1
            }
          };
        }
        return n;
      }));
    } catch (error) {
      console.error("React error:", error);
    }
  };

  const shareNews = (newsItem) => {
    const text = `${language === "te" && newsItem.title_te ? newsItem.title_te : newsItem.title}\n\n${language === "te" && newsItem.summary_te ? newsItem.summary_te : newsItem.summary}`;
    
    if (navigator.share) {
      navigator.share({
        title: newsItem.title,
        text: text,
        url: newsItem.source_url || window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success(language === "te" ? "కాపీ అయింది" : "Copied to clipboard");
    }
  };

  const goToNext = () => {
    if (currentIndex < news.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const categories = [
    { value: "all", label: language === "te" ? "అన్నీ" : "All" },
    { value: "local", label: language === "te" ? "స్థానికం" : "Local" },
    { value: "government", label: language === "te" ? "ప్రభుత్వం" : "Govt" },
    { value: "health", label: language === "te" ? "ఆరోగ్యం" : "Health" },
    { value: "education", label: language === "te" ? "విద్య" : "Edu" },
    { value: "sports", label: language === "te" ? "క్రీడలు" : "Sports" }
  ];

  const currentNews = news[currentIndex];

  return (
    <Layout title={language === "te" ? "వార్తలు" : "News"}>
      <div className="space-y-4 pb-20" data-testid="news-page">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">
                {language === "te" ? "వార్తలు" : "News Shorts"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {language === "te" ? "స్వైప్ చేయండి" : "Swipe to read"}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fetchNews(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={activeCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveCategory(cat.value); setCurrentIndex(0); }}
              className="flex-shrink-0"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* News Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {language === "te" ? "వార్తలు అందుబాటులో లేవు" : "No news available"}
            </p>
          </div>
        ) : (
          /* Shorts Style View */
          <div className="relative" ref={containerRef}>
            {/* News Card - Full Height */}
            <Card className="overflow-hidden border-0 shadow-xl">
              {/* Image Section */}
              <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900">
                {currentNews?.image_url ? (
                  <img
                    src={currentNews.image_url}
                    alt={currentNews.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Newspaper className="h-16 w-16 text-gray-600" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Category Badge */}
                <Badge 
                  className={`absolute top-3 left-3 ${getCategoryColor(currentNews?.category)} text-white`}
                >
                  {getCategoryIcon(currentNews?.category)}
                  <span className="ml-1 capitalize">{currentNews?.category}</span>
                </Badge>
                
                {/* Counter */}
                <div className="absolute top-3 right-3 bg-black/50 px-2 py-1 rounded-full text-white text-xs">
                  {currentIndex + 1} / {news.length}
                </div>
                
                {/* Title on Image */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h2 className="text-white font-bold text-lg leading-tight">
                    {language === "te" && currentNews?.title_te 
                      ? currentNews.title_te 
                      : currentNews?.title}
                  </h2>
                </div>
              </div>

              {/* Content Section */}
              <CardContent className="p-4">
                {/* Summary */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {language === "te" && currentNews?.summary_te 
                    ? currentNews.summary_te 
                    : currentNews?.summary}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(currentNews?.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {currentNews?.views || 0}
                    </span>
                  </div>
                  {currentNews?.source && (
                    <span className="text-primary">{currentNews.source}</span>
                  )}
                </div>

                {/* Reactions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => handleReact(currentNews?.id, "like")}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      <span className="text-xs">{currentNews?.reactions?.like || 0}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => handleReact(currentNews?.id, "love")}
                    >
                      <Heart className="h-4 w-4 mr-1 text-red-500" />
                      <span className="text-xs">{currentNews?.reactions?.love || 0}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => handleReact(currentNews?.id, "angry")}
                    >
                      <Angry className="h-4 w-4 mr-1 text-orange-500" />
                      <span className="text-xs">{currentNews?.reactions?.angry || 0}</span>
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => shareNews(currentNews)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={goToPrev}
                disabled={currentIndex === 0}
              >
                <ChevronUp className="h-5 w-5 mr-2" />
                {language === "te" ? "మునుపటి" : "Previous"}
              </Button>
              <Button
                variant="default"
                size="lg"
                className="flex-1"
                onClick={goToNext}
                disabled={currentIndex === news.length - 1}
              >
                {language === "te" ? "తదుపరి" : "Next"}
                <ChevronDown className="h-5 w-5 ml-2" />
              </Button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1 mt-4">
              {news.slice(0, 10).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex 
                      ? "w-6 bg-primary" 
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
              {news.length > 10 && (
                <span className="text-xs text-muted-foreground ml-2">
                  +{news.length - 10}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
