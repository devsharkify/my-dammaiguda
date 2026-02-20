import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { trackFeature, trackAction, FEATURES, ACTIONS } from "../utils/analytics";
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
  Bookmark,
  Share2,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
  Megaphone,
  Play,
  Volume2,
  VolumeX
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_CONFIG = {
  local: { icon: <MapPin className="h-4 w-4" />, gradient: "from-green-600 to-emerald-700" },
  city: { icon: <Building2 className="h-4 w-4" />, gradient: "from-blue-600 to-cyan-700" },
  state: { icon: <Landmark className="h-4 w-4" />, gradient: "from-purple-600 to-violet-700" },
  national: { icon: <Globe className="h-4 w-4" />, gradient: "from-orange-600 to-red-600" },
  international: { icon: <Globe className="h-4 w-4" />, gradient: "from-red-600 to-pink-700" },
  sports: { icon: <Trophy className="h-4 w-4" />, gradient: "from-yellow-600 to-amber-700" },
  entertainment: { icon: <Tv className="h-4 w-4" />, gradient: "from-pink-600 to-rose-700" },
  tech: { icon: <Cpu className="h-4 w-4" />, gradient: "from-indigo-600 to-blue-700" },
  health: { icon: <Heart className="h-4 w-4" />, gradient: "from-teal-600 to-cyan-700" },
  business: { icon: <Briefcase className="h-4 w-4" />, gradient: "from-slate-600 to-gray-700" }
};

export default function NewsShorts() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const [categories, setCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState("local");
  const [news, setNews] = useState([]);
  const [newsAds, setNewsAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Swipe state
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchDeltaY, setTouchDeltaY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'up' or 'down'
  
  const containerRef = useRef(null);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchCategories();
    fetchNewsAds();
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

  const fetchNewsAds = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/stories/ads/news`, { headers });
      setNewsAds(response.data?.ads || []);
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  };

  // Inject ads into news feed (every 5 articles)
  const getMergedFeed = useCallback(() => {
    if (newsAds.length === 0) return news.map(n => ({ ...n, isAd: false }));
    
    const merged = [];
    let adIndex = 0;
    
    news.forEach((article, idx) => {
      merged.push({ ...article, isAd: false });
      
      // Insert ad after every 5 articles
      if ((idx + 1) % 5 === 0 && adIndex < newsAds.length) {
        merged.push({ ...newsAds[adIndex], isAd: true });
        adIndex++;
      }
    });
    
    return merged;
  }, [news, newsAds]);

  const mergedFeed = getMergedFeed();

  const fetchNews = async (category) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/news/${category}?limit=20`);
      setNews(response.data.news || []);
    } catch (error) {
      console.error("Error fetching news:", error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    setRefreshing(true);
    await fetchNews(activeCategory);
    setCurrentIndex(0);
    setRefreshing(false);
    toast.success(language === "te" ? "వార్తలు రిఫ్రెష్ అయ్యాయి" : "News refreshed");
  };

  // Swipe handlers
  const handleTouchStart = (e) => {
    if (isAnimating) return;
    setTouchStartY(e.touches[0].clientY);
    setTouchDeltaY(0);
  };

  const handleTouchMove = (e) => {
    if (isAnimating) return;
    const delta = touchStartY - e.touches[0].clientY;
    setTouchDeltaY(delta);
  };

  const handleTouchEnd = () => {
    if (isAnimating) return;
    
    const threshold = 80;
    
    if (touchDeltaY > threshold) {
      // Swipe up - next article
      goToNext();
    } else if (touchDeltaY < -threshold) {
      // Swipe down - previous article
      goToPrev();
    }
    
    setTouchDeltaY(0);
  };

  const goToNext = useCallback(() => {
    if (currentIndex < mergedFeed.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setSwipeDirection('up');
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentIndex, mergedFeed.length, isAnimating]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setSwipeDirection('down');
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentIndex, isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'k') goToPrev();
      if (e.key === 'ArrowDown' || e.key === 'j') goToNext();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  const shareArticle = async (article) => {
    const title = language === "te" ? (article.title_te || article.title) : article.title;
    
    // Track share action
    trackAction(ACTIONS.SHARE, 'news_article', '/news', { category: activeCategory, is_video: isVideoNews(article) });
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: article.summary,
          url: article.link !== "#" ? article.link : window.location.href
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(title);
      toast.success(language === "te" ? "కాపీ చేయబడింది" : "Copied to clipboard");
    }
  };

  // Track news category change
  useEffect(() => {
    trackFeature(FEATURES.NEWS, activeCategory, ACTIONS.VIEW);
  }, [activeCategory]);

  const currentItem = mergedFeed[currentIndex];
  const config = currentItem?.isAd ? null : (CATEGORY_CONFIG[activeCategory] || CATEGORY_CONFIG.local);

  // Get localized content
  const getTitle = (article) => {
    if (article.isAd) {
      return language === "te" ? (article.title_te || article.title) : article.title;
    }
    if (language === "te") {
      return article.title_te || article.title;
    }
    return article.title;
  };

  const getSummary = (article) => {
    if (article.isAd) return null;
    if (language === "te") {
      return article.summary_te || article.summary;
    }
    return article.summary;
  };

  const getCTA = (ad) => {
    return language === "te" ? (ad.cta_text_te || ad.cta_text) : ad.cta_text;
  };

  const getCategoryLabel = () => {
    const catInfo = categories[activeCategory];
    if (!catInfo) return activeCategory;
    return language === "te" ? catInfo.te : catInfo.en;
  };

  // Extract YouTube video ID from URL (supports regular, shorts, embed, youtu.be)
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    // Handle YouTube Shorts
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    
    // Handle youtu.be
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    
    // Handle regular YouTube URLs with watch?v=
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    
    // Handle embed URLs
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
    
    return null;
  };

  // Check if item is a video news
  const isVideoNews = (item) => {
    return item.content_type === 'video' || item.video_url;
  };

  return (
    <Layout showBackButton title={language === "te" ? "వార్తలు" : "News"}>
      <div className="flex flex-col h-[calc(100vh-140px)]" data-testid="news-shorts">
        {/* Category Pills - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide flex-shrink-0">
          {Object.keys(categories).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? `bg-gradient-to-r ${CATEGORY_CONFIG[cat]?.gradient || "from-gray-600 to-gray-700"} text-white shadow-md`
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid={`cat-${cat}`}
            >
              {CATEGORY_CONFIG[cat]?.icon}
              {language === "te" ? categories[cat]?.te : categories[cat]?.en}
            </button>
          ))}
        </div>

        {/* News Card Container - Tinder Style */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden rounded-2xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          ) : mergedFeed.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white">
              <Newspaper className="h-16 w-16 opacity-50 mb-4" />
              <p className="text-lg">{language === "te" ? "వార్తలు లేవు" : "No news available"}</p>
              <Button onClick={refreshNews} variant="outline" className="mt-4 text-white border-white/50">
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === "te" ? "రిఫ్రెష్" : "Refresh"}
              </Button>
            </div>
          ) : currentItem ? (
            <div
              className={`absolute inset-0 transition-transform duration-300 ease-out ${
                swipeDirection === 'up' ? '-translate-y-full' :
                swipeDirection === 'down' ? 'translate-y-full' : ''
              }`}
              style={{
                transform: !isAnimating && touchDeltaY ? `translateY(${-touchDeltaY * 0.3}px)` : undefined
              }}
            >
              {/* Check if it's an Ad */}
              {currentItem.isAd ? (
                // AD CARD
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600">
                  {currentItem.media_url && (
                    currentItem.ad_type === 'video' ? (
                      <video
                        src={currentItem.media_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={currentItem.media_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Ad Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                    <Badge className="w-fit mb-3 bg-yellow-500/90 text-black border-0">
                      <Megaphone className="h-3 w-3 mr-1" />
                      {language === "te" ? "ప్రచారం" : "Sponsored"}
                    </Badge>
                    
                    <h2 className="text-xl font-bold leading-tight mb-4">
                      {getTitle(currentItem)}
                    </h2>
                    
                    {currentItem.click_url && (
                      <a
                        href={currentItem.click_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-semibold text-sm w-fit"
                      >
                        {getCTA(currentItem) || (language === "te" ? "మరింత తెలుసుకోండి" : "Learn More")}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ) : isVideoNews(currentItem) ? (
                // VIDEO NEWS CARD
                <>
                  {/* YouTube Embed */}
                  <div className="absolute inset-0 bg-black">
                    {getYouTubeVideoId(currentItem.video_url) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(currentItem.video_url)}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`}
                        title={getTitle(currentItem)}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-16 w-16 text-white/50" />
                      </div>
                    )}
                    {/* Overlay for title */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5">
                      <Badge className="w-fit mb-2 bg-red-500/90 text-white border-0">
                        <Play className="h-3 w-3 mr-1" />
                        {language === "te" ? "వీడియో వార్త" : "Video News"}
                      </Badge>
                      <h2 className="text-lg font-bold text-white leading-tight">
                        {getTitle(currentItem)}
                      </h2>
                      <div className="flex items-center gap-3 mt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => shareArticle(currentItem)}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          {language === "te" ? "షేర్" : "Share"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // NEWS ARTICLE CARD
                <>
                  {/* Background Image or Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${config?.gradient || "from-gray-700 to-gray-800"}`}>
                    {currentItem.image && (
                      <img
                        src={currentItem.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                    {/* Category Badge - No Source */}
                    <Badge className={`w-fit mb-3 bg-white/20 backdrop-blur-sm text-white border-0`}>
                      {CATEGORY_CONFIG[activeCategory]?.icon}
                      <span className="ml-1">{getCategoryLabel()}</span>
                    </Badge>

                    {/* Title */}
                    <h2 className="text-xl font-bold leading-tight mb-3">
                      {getTitle(currentItem)}
                    </h2>

                    {/* Summary */}
                    <p className="text-white/80 text-sm leading-relaxed mb-4 line-clamp-4">
                      {getSummary(currentItem)}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => shareArticle(currentItem)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        {language === "te" ? "షేర్" : "Share"}
                      </Button>
                      {/* Only show Read More for admin-pushed news with links */}
                      {currentItem.is_admin_pushed && currentItem.link && currentItem.link !== "#" && (
                        <a
                          href={currentItem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-white bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {language === "te" ? "మరింత చదవండి" : "Read more"}
                        </a>
                      )}
                    </div>

                    {/* Pinned indicator */}
                    {currentItem.is_pinned && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-yellow-500 text-black text-xs">
                          {language === "te" ? "ప్రధాన" : "Featured"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Swipe Hint */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/50 animate-bounce">
                <ChevronUp className="h-5 w-5" />
                <span className="text-[10px]">{language === "te" ? "స్వైప్ అప్" : "Swipe up"}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Progress & Navigation */}
        <div className="flex items-center justify-between pt-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={goToPrev}
              disabled={currentIndex === 0 || isAnimating}
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground font-mono">
              {mergedFeed.length > 0 ? `${currentIndex + 1}/${mergedFeed.length}` : "0/0"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={goToNext}
              disabled={currentIndex >= mergedFeed.length - 1 || isAnimating}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={refreshNews}
            disabled={refreshing}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            {language === "te" ? "రిఫ్రెష్" : "Refresh"}
          </Button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-1 py-2">
          {mergedFeed.slice(Math.max(0, currentIndex - 3), Math.min(mergedFeed.length, currentIndex + 4)).map((item, idx) => {
            const actualIndex = Math.max(0, currentIndex - 3) + idx;
            return (
              <div
                key={actualIndex}
                className={`h-1.5 rounded-full transition-all ${
                  actualIndex === currentIndex
                    ? item.isAd ? "w-6 bg-yellow-500" : "w-6 bg-primary"
                    : item.isAd ? "w-1.5 bg-yellow-500/30" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
