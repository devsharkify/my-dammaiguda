import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
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
  ChevronLeft,
  Volume2,
  VolumeX,
  Play
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_CONFIG = {
  local: { icon: MapPin, label: "Local", labelTe: "స్థానిక", gradient: "from-emerald-500 to-teal-600" },
  city: { icon: Building2, label: "City", labelTe: "నగరం", gradient: "from-blue-500 to-cyan-600" },
  state: { icon: Landmark, label: "State", labelTe: "రాష్ట్రం", gradient: "from-purple-500 to-violet-600" },
  national: { icon: Globe, label: "National", labelTe: "జాతీయ", gradient: "from-orange-500 to-red-500" },
  sports: { icon: Trophy, label: "Sports", labelTe: "క్రీడలు", gradient: "from-yellow-500 to-amber-600" },
  entertainment: { icon: Tv, label: "Entertainment", labelTe: "వినోదం", gradient: "from-pink-500 to-rose-600" },
  tech: { icon: Cpu, label: "Tech", labelTe: "టెక్", gradient: "from-indigo-500 to-blue-600" },
  health: { icon: Heart, label: "Health", labelTe: "ఆరోగ్యం", gradient: "from-teal-500 to-cyan-600" },
  business: { icon: Briefcase, label: "Business", labelTe: "వ్యాపారం", gradient: "from-slate-500 to-gray-600" }
};

export default function NewsShorts() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState("local");
  const [news, setNews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const [bookmarked, setBookmarked] = useState({});
  const [isMuted, setIsMuted] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchNews(activeCategory);
    setCurrentIndex(0);
    trackFeature(FEATURES.NEWS_SHORTS, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const fetchNews = async (category) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/news/local`, {
        params: { category, limit: 30 },
        headers
      });
      const newsItems = response.data?.news || [];
      setNews(newsItems);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  const goToNext = useCallback(() => {
    if (currentIndex < news.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, news.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const { offset, velocity } = info;
    const swipeThreshold = 80;
    const velocityThreshold = 300;
    
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    
    // Vertical swipe (primary - like TikTok)
    if (absY > absX && absY > 30) {
      if (offset.y < -swipeThreshold || velocity.y < -velocityThreshold) {
        // Swipe UP = Next
        goToNext();
      } else if (offset.y > swipeThreshold || velocity.y > velocityThreshold) {
        // Swipe DOWN = Previous
        goToPrev();
      }
    }
    // Horizontal swipe (secondary)
    else if (absX > absY && absX > 30) {
      if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
        // Swipe LEFT = Next
        goToNext();
      } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
        // Swipe RIGHT = Previous
        goToPrev();
      }
    }
  };

  const handleShare = async (item) => {
    const shareText = `${item.title}\n\nRead on My Dammaiguda`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success(language === "te" ? "కాపీ అయింది" : "Copied!");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const toggleBookmark = (itemId) => {
    setBookmarked(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    toast.success(bookmarked[itemId] 
      ? (language === "te" ? "తీసివేయబడింది" : "Removed")
      : (language === "te" ? "సేవ్ అయింది" : "Saved!")
    );
  };

  const currentNews = news[currentIndex];

  // Check if video
  const isVideo = currentNews?.video_url;
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&controls=0&playsinline=1` : null;
  };

  // Smooth animation variants
  const variants = {
    enter: (dir) => ({
      y: dir > 0 ? "100%" : dir < 0 ? "-100%" : 0,
      opacity: 0.5,
      scale: 0.95
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        y: { type: "spring", stiffness: 400, damping: 35 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }
    },
    exit: (dir) => ({
      y: dir > 0 ? "-100%" : dir < 0 ? "100%" : 0,
      opacity: 0.5,
      scale: 0.95,
      transition: {
        y: { type: "spring", stiffness: 400, damping: 35 },
        opacity: { duration: 0.2 }
      }
    })
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-white/60 mx-auto mb-3" />
          <p className="text-white/40 text-sm">{language === "te" ? "లోడ్ అవుతోంది..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!news.length) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <Newspaper className="h-12 w-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">{language === "te" ? "వార్తలు లేవు" : "No news"}</p>
          <button onClick={() => fetchNews(activeCategory)} className="mt-4 px-5 py-2 bg-white/10 rounded-full text-white/70 text-sm">
            {language === "te" ? "రిఫ్రెష్" : "Refresh"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative select-none" data-testid="news-shorts">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-50 p-2.5 bg-black/50 backdrop-blur-sm rounded-full text-white"
        data-testid="news-back-btn"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Category Pills */}
      <div className="absolute top-4 left-14 right-4 z-40 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${config.gradient} text-white` 
                    : 'bg-black/40 backdrop-blur-sm text-white/70'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{language === "te" ? config.labelTe : config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-14 left-4 right-4 z-40 flex gap-0.5">
        {news.slice(0, Math.min(news.length, 15)).map((_, idx) => (
          <div
            key={idx}
            className={`h-0.5 flex-1 rounded-full transition-colors duration-200 ${
              idx === currentIndex ? 'bg-white' : idx < currentIndex ? 'bg-white/40' : 'bg-white/15'
            }`}
          />
        ))}
      </div>

      {/* News Card */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.15}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 touch-pan-y"
        >
          {/* Background */}
          <div className="absolute inset-0">
            {isVideo ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <iframe
                  src={getYouTubeEmbedUrl(currentNews.video_url)}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={currentNews.title}
                />
              </div>
            ) : (
              <img
                src={currentNews.image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800"}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-16 p-5 pb-20">
            {/* Category */}
            {currentNews.category && CATEGORY_CONFIG[currentNews.category] && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-gradient-to-r ${CATEGORY_CONFIG[currentNews.category].gradient} text-white mb-3`}>
                {language === "te" ? CATEGORY_CONFIG[currentNews.category].labelTe : CATEGORY_CONFIG[currentNews.category].label}
              </span>
            )}
            
            {/* Title */}
            <h1 className="text-xl font-bold text-white leading-snug mb-2 line-clamp-3">
              {currentNews.title}
            </h1>
            
            {/* Summary */}
            <p className="text-white/70 text-sm leading-relaxed line-clamp-2 mb-3">
              {currentNews.summary}
            </p>
            
            {/* Time */}
            <p className="text-white/40 text-xs">
              {currentNews.time_ago || "Just now"}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col gap-5">
        <button
          onClick={() => toggleBookmark(currentNews?.id || currentIndex)}
          className={`p-3 rounded-full transition-all ${bookmarked[currentNews?.id || currentIndex] ? 'bg-amber-500 text-white' : 'bg-black/40 backdrop-blur-sm text-white'}`}
        >
          <Bookmark className={`h-5 w-5 ${bookmarked[currentNews?.id || currentIndex] ? 'fill-current' : ''}`} />
        </button>
        
        <button
          onClick={() => handleShare(currentNews)}
          className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white"
        >
          <Share2 className="h-5 w-5" />
        </button>
        
        {isVideo && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}
        
        <button
          onClick={() => fetchNews(activeCategory)}
          className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Page Counter */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center">
        <span className="text-white/50 text-xs font-medium bg-black/30 px-3 py-1 rounded-full">
          {currentIndex + 1} / {news.length}
        </span>
      </div>
    </div>
  );
}
