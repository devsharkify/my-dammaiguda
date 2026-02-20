import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Play,
  Volume2,
  VolumeX,
  X
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_CONFIG = {
  local: { icon: MapPin, label: "Local", labelTe: "స్థానిక", gradient: "from-green-600 to-emerald-700" },
  city: { icon: Building2, label: "City", labelTe: "నగరం", gradient: "from-blue-600 to-cyan-700" },
  state: { icon: Landmark, label: "State", labelTe: "రాష్ట్రం", gradient: "from-purple-600 to-violet-700" },
  national: { icon: Globe, label: "National", labelTe: "జాతీయ", gradient: "from-orange-600 to-red-600" },
  sports: { icon: Trophy, label: "Sports", labelTe: "క్రీడలు", gradient: "from-yellow-600 to-amber-700" },
  entertainment: { icon: Tv, label: "Entertainment", labelTe: "వినోదం", gradient: "from-pink-600 to-rose-700" },
  tech: { icon: Cpu, label: "Tech", labelTe: "టెక్", gradient: "from-indigo-600 to-blue-700" },
  health: { icon: Heart, label: "Health", labelTe: "ఆరోగ్యం", gradient: "from-teal-600 to-cyan-700" },
  business: { icon: Briefcase, label: "Business", labelTe: "వ్యాపారం", gradient: "from-slate-600 to-gray-700" }
};

// Spring animation config for smooth physics
const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

export default function NewsShorts() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState("local");
  const [news, setNews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0); // -1 = prev, 1 = next
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [bookmarked, setBookmarked] = useState({});
  
  // Video state
  const [isMuted, setIsMuted] = useState(true);
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Motion values for drag
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transform for visual feedback
  const rotateZ = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const scale = useTransform(
    [x, y],
    ([latestX, latestY]) => {
      const distance = Math.sqrt(latestX * latestX + latestY * latestY);
      return Math.max(0.95, 1 - distance / 1000);
    }
  );

  useEffect(() => {
    fetchNews(activeCategory);
    setCurrentIndex(0);
    trackFeature(FEATURES.NEWS_SHORTS, token);
    
    // Hide swipe hint after 3 seconds
    const timer = setTimeout(() => setShowSwipeHint(false), 3000);
    return () => clearTimeout(timer);
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
      trackAction(ACTIONS.VIEW_CONTENT, { type: 'news_swipe', direction: 'next' }, token);
    }
  }, [currentIndex, news.length, token]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      trackAction(ACTIONS.VIEW_CONTENT, { type: 'news_swipe', direction: 'prev' }, token);
    }
  }, [currentIndex, token]);

  const handleDragEnd = (event, info) => {
    const { offset, velocity } = info;
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    
    // Determine swipe direction based on dominant axis
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    
    if (absX > absY) {
      // Horizontal swipe
      if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
        // Swipe RIGHT = Next
        goToNext();
      } else if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
        // Swipe LEFT = Previous
        goToPrev();
      }
    } else {
      // Vertical swipe
      if (offset.y < -swipeThreshold || velocity.y < -velocityThreshold) {
        // Swipe UP = Next
        goToNext();
      } else if (offset.y > swipeThreshold || velocity.y > velocityThreshold) {
        // Swipe DOWN = Previous
        goToPrev();
      }
    }
  };

  const handleShare = async (item) => {
    const shareData = {
      title: item.title,
      text: item.summary || item.title,
      url: item.link || window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${item.title}\n${item.link || window.location.href}`);
        toast.success(language === "te" ? "లింక్ కాపీ అయింది" : "Link copied!");
      }
      trackAction(ACTIONS.SHARE, { type: 'news' }, token);
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const toggleBookmark = (itemId) => {
    setBookmarked(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
    toast.success(
      bookmarked[itemId] 
        ? (language === "te" ? "బుక్‌మార్క్ తీసివేయబడింది" : "Bookmark removed")
        : (language === "te" ? "బుక్‌మార్క్ చేయబడింది" : "Bookmarked!")
    );
  };

  const currentNews = news[currentIndex];

  // Card variants for animations
  const cardVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 300 : dir < 0 ? -300 : 0,
      y: dir === 0 ? 100 : 0,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      transition: springConfig
    },
    exit: (dir) => ({
      x: dir > 0 ? -300 : dir < 0 ? 300 : 0,
      y: dir === 0 ? -100 : 0,
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.3 }
    })
  };

  // Check if current item is a video
  const isVideo = currentNews?.video_url;
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&\n?#]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&controls=0&modestbranding=1&playsinline=1`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/60 font-medium">
            {language === "te" ? "వార్తలు లోడ్ అవుతున్నాయి..." : "Loading news..."}
          </p>
        </div>
      </div>
    );
  }

  if (!news.length) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center">
          <Newspaper className="h-16 w-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 text-lg">
            {language === "te" ? "వార్తలు అందుబాటులో లేవు" : "No news available"}
          </p>
          <button 
            onClick={() => fetchNews(activeCategory)}
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            {language === "te" ? "రిఫ్రెష్" : "Refresh"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 overflow-hidden relative" data-testid="news-shorts">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all"
        data-testid="news-back-btn"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Category Pills - Floating */}
      <div className="absolute top-4 left-16 right-4 z-40 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg` 
                    : 'bg-white/10 backdrop-blur-md text-white/80 hover:bg-white/20'
                }`}
                data-testid={`category-${key}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{language === "te" ? config.labelTe : config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-16 left-4 right-4 z-40 flex gap-1">
        {news.slice(0, 10).map((_, idx) => (
          <div
            key={idx}
            className={`h-0.5 flex-1 rounded-full transition-all ${
              idx === currentIndex ? 'bg-white' : idx < currentIndex ? 'bg-white/50' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Swipe Hint Overlay */}
      <AnimatePresence>
        {showSwipeHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/60 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center text-white">
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="flex flex-col items-center">
                  <ArrowLeft className="h-8 w-8 animate-pulse" />
                  <span className="text-xs mt-1 opacity-70">Prev</span>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowUp className="h-8 w-8 animate-bounce" />
                  <span className="text-xs mt-1 opacity-70">Next</span>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRight className="h-8 w-8 animate-pulse" />
                  <span className="text-xs mt-1 opacity-70">Next</span>
                </div>
              </div>
              <p className="text-sm opacity-80">
                {language === "te" ? "స్వైప్ చేయండి" : "Swipe to navigate"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* News Card Container */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          style={{ x, y, rotateZ, scale }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          {/* Background Image/Video */}
          <div className="absolute inset-0">
            {isVideo ? (
              <iframe
                src={getYouTubeEmbedUrl(currentNews.video_url)}
                className="w-full h-full object-cover"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={currentNews.title}
              />
            ) : (
              <img
                src={currentNews.image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800"}
                alt={currentNews.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-24 z-20">
            {/* Category Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {currentNews.category && CATEGORY_CONFIG[currentNews.category] && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${CATEGORY_CONFIG[currentNews.category].gradient} text-white mb-3`}>
                  {(() => {
                    const Icon = CATEGORY_CONFIG[currentNews.category].icon;
                    return <Icon className="h-3 w-3" />;
                  })()}
                  {language === "te" 
                    ? CATEGORY_CONFIG[currentNews.category].labelTe 
                    : CATEGORY_CONFIG[currentNews.category].label}
                </span>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3 drop-shadow-lg"
              style={{ fontFamily: "'Merriweather', serif" }}
            >
              {currentNews.title}
            </motion.h1>

            {/* Summary */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/80 text-sm md:text-base leading-relaxed line-clamp-3 mb-4"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {currentNews.summary}
            </motion.p>

            {/* Source & Time */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 text-white/60 text-xs"
            >
              <span>{currentNews.source}</span>
              <span>•</span>
              <span>{currentNews.time_ago || "Just now"}</span>
              {currentNews.link && (
                <>
                  <span>•</span>
                  <a 
                    href={currentNews.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Read full</span>
                  </a>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Sidebar */}
      <div className="absolute right-4 bottom-32 z-30 flex flex-col gap-4">
        {/* Bookmark */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleBookmark(currentNews?.id || currentIndex)}
          className={`p-3 rounded-full backdrop-blur-md transition-all ${
            bookmarked[currentNews?.id || currentIndex] 
              ? 'bg-yellow-500 text-white' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          data-testid="bookmark-btn"
        >
          <Bookmark className={`h-6 w-6 ${bookmarked[currentNews?.id || currentIndex] ? 'fill-current' : ''}`} />
        </motion.button>

        {/* Share */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleShare(currentNews)}
          className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
          data-testid="share-btn"
        >
          <Share2 className="h-6 w-6" />
        </motion.button>

        {/* Mute/Unmute for video */}
        {isVideo && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
            data-testid="mute-btn"
          >
            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </motion.button>
        )}

        {/* Refresh */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => fetchNews(activeCategory)}
          className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
          data-testid="refresh-btn"
        >
          <RefreshCw className="h-6 w-6" />
        </motion.button>
      </div>

      {/* Bottom Navigation Dots */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center items-center gap-4">
        <span className="text-white/60 text-sm font-medium">
          {currentIndex + 1} / {news.length}
        </span>
      </div>
    </div>
  );
}
