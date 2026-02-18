import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
  Newspaper,
  MapPin,
  Building2,
  Landmark,
  Globe,
  Trophy,
  Tv,
  Cpu,
  Heart,
  Briefcase,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Bookmark,
  Share2,
  Loader2,
  ArrowUp
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_CONFIG = {
  local: { icon: <MapPin className="h-4 w-4" />, color: "bg-green-500", gradient: "from-green-500 to-emerald-600" },
  city: { icon: <Building2 className="h-4 w-4" />, color: "bg-blue-500", gradient: "from-blue-500 to-cyan-600" },
  state: { icon: <Landmark className="h-4 w-4" />, color: "bg-purple-500", gradient: "from-purple-500 to-violet-600" },
  national: { icon: <Globe className="h-4 w-4" />, color: "bg-orange-500", gradient: "from-orange-500 to-red-500" },
  international: { icon: <Globe className="h-4 w-4" />, color: "bg-red-500", gradient: "from-red-500 to-pink-600" },
  sports: { icon: <Trophy className="h-4 w-4" />, color: "bg-yellow-500", gradient: "from-yellow-500 to-amber-600" },
  entertainment: { icon: <Tv className="h-4 w-4" />, color: "bg-pink-500", gradient: "from-pink-500 to-rose-600" },
  tech: { icon: <Cpu className="h-4 w-4" />, color: "bg-indigo-500", gradient: "from-indigo-500 to-blue-600" },
  health: { icon: <Heart className="h-4 w-4" />, color: "bg-teal-500", gradient: "from-teal-500 to-cyan-600" },
  business: { icon: <Briefcase className="h-4 w-4" />, color: "bg-slate-500", gradient: "from-slate-500 to-gray-600" }
};

export default function NewsShorts() {
  const { language } = useLanguage();
  const [categories, setCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState("local");
  const [news, setNews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNews(activeCategory);
    setCurrentIndex(0);
  }, [activeCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/news/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchNews = async (category) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/news/${category}?limit=20`);
      setNews(response.data.news || []);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error(language === "te" ? "వార్తలు లోడ్ చేయడంలో విఫలమైంది" : "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    setRefreshing(true);
    await fetchNews(activeCategory);
    setRefreshing(false);
    toast.success(language === "te" ? "వార్తలు రిఫ్రెష్ అయ్యాయి" : "News refreshed");
  };

  const handleSwipeUp = () => {
    if (currentIndex < news.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSwipeDown = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleSwipeUp();
      } else {
        handleSwipeDown();
      }
    }
  };

  const shareNews = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.summary,
        url: item.link || window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${item.title}\n${item.summary}`);
      toast.success(language === "te" ? "కాపీ చేయబడింది" : "Copied to clipboard");
    }
  };

  const currentNews = news[currentIndex];
  const categoryConfig = CATEGORY_CONFIG[activeCategory] || CATEGORY_CONFIG.national;

  return (
    <Layout title={language === "te" ? "వార్తలు" : "News Shorts"} showBackButton>
      <div className="flex flex-col h-[calc(100vh-140px)]" data-testid="news-shorts-page">
        {/* Category Tabs - Horizontal Scroll */}
        <div className="flex-shrink-0 mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-2">
            {Object.entries(categories).map(([key, value]) => {
              const config = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.national;
              return (
                <Button
                  key={key}
                  variant={activeCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(key)}
                  className={`flex-shrink-0 whitespace-nowrap ${
                    activeCategory === key 
                      ? `bg-gradient-to-r ${config.gradient} text-white border-0` 
                      : "bg-white"
                  }`}
                  data-testid={`news-category-${key}`}
                >
                  {config.icon}
                  <span className="ml-1.5">
                    {language === "te" ? value.te?.split(" - ")[0] : value.en?.split(" - ")[0]}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-text-muted">
              {currentIndex + 1} / {news.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshNews}
            disabled={refreshing}
            className="text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* News Card - Swipeable */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !currentNews ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <Newspaper className="h-16 w-16 opacity-30 mb-4" />
              <p>{language === "te" ? "వార్తలు అందుబాటులో లేవు" : "No news available"}</p>
            </div>
          ) : (
            <Card 
              className="h-full overflow-hidden border-0 shadow-xl"
              style={{ 
                background: `linear-gradient(135deg, ${categoryConfig.color.replace("bg-", "var(--")}` 
              }}
            >
              {/* Image or Gradient Background */}
              <div className={`h-48 bg-gradient-to-br ${categoryConfig.gradient} relative`}>
                {currentNews.image ? (
                  <img 
                    src={currentNews.image} 
                    alt={currentNews.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/20">
                      {CATEGORY_CONFIG[activeCategory]?.icon && (
                        <div className="scale-[6]">
                          {CATEGORY_CONFIG[activeCategory].icon}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Category Badge */}
                <Badge 
                  className={`absolute top-4 left-4 ${categoryConfig.color} text-white border-0`}
                >
                  {CATEGORY_CONFIG[activeCategory]?.icon}
                  <span className="ml-1">
                    {language === "te" 
                      ? categories[activeCategory]?.te?.split(" - ")[0] 
                      : categories[activeCategory]?.en?.split(" - ")[0]}
                  </span>
                </Badge>

                {/* Swipe Indicator */}
                {currentIndex > 0 && (
                  <div className="absolute top-4 right-4 text-white/70">
                    <ArrowUp className="h-5 w-5 animate-bounce" />
                  </div>
                )}
              </div>

              {/* Content */}
              <CardContent className="p-5 bg-white flex flex-col h-[calc(100%-12rem)]">
                <h2 className="text-xl font-bold text-text-primary mb-3 leading-tight">
                  {language === "te" && currentNews.title_te 
                    ? currentNews.title_te 
                    : currentNews.title}
                </h2>
                
                <p className="text-text-muted leading-relaxed flex-1 overflow-y-auto">
                  {language === "te" && currentNews.summary_te 
                    ? currentNews.summary_te 
                    : currentNews.summary}
                </p>

                {/* Source & Time */}
                <div className="flex items-center justify-between text-xs text-text-muted mt-4 pt-3 border-t border-border/30">
                  <span>{currentNews.source}</span>
                  <span>
                    {new Date(currentNews.published_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  {currentNews.link && currentNews.link !== "#" && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(currentNews.link, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {language === "te" ? "చదవండి" : "Read More"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => shareNews(currentNews)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          {news.length > 1 && (
            <>
              <button
                onClick={handleSwipeDown}
                disabled={currentIndex === 0}
                className="absolute left-1/2 top-2 -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5 rotate-90" />
              </button>
              <button
                onClick={handleSwipeUp}
                disabled={currentIndex === news.length - 1}
                className="absolute left-1/2 bottom-2 -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5 rotate-90" />
              </button>
            </>
          )}
        </div>

        {/* Swipe Hint */}
        <p className="text-center text-xs text-text-muted mt-3 flex-shrink-0">
          {language === "te" 
            ? "పైకి/కిందికి స్వైప్ చేసి వార్తలు చూడండి" 
            : "Swipe up/down to browse news"}
        </p>
      </div>
    </Layout>
  );
}
