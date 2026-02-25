import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useAppConfig, useFeatureFlags } from "../context/AppConfigContext";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "./NotificationBell";
import {
  Home,
  AlertTriangle,
  Activity,
  User,
  ArrowLeft,
  Globe,
  Shield,
  Menu,
  X,
  LogOut,
  MapPin,
  Heart,
  BarChart3,
  FileText,
  Users,
  Settings,
  MessageCircle,
  Stethoscope,
  Wind,
  Newspaper,
  PenSquare,
  GraduationCap,
  Search,
  Bell,
  Gift,
  Phone
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";

export default function Layout({ children, title, showBackButton = false, onRefresh }) {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, logout, isVolunteer, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const config = useAppConfig();
  const features = useFeatureFlags();

  // Handle hardware back button (Android)
  useEffect(() => {
    const handlePopState = (e) => {
      if (menuOpen) {
        e.preventDefault();
        setMenuOpen(false);
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [menuOpen]);

  // Push state when menu opens for back button handling
  useEffect(() => {
    if (menuOpen) {
      window.history.pushState(null, '', window.location.href);
    }
  }, [menuOpen]);

  // Native back button handler
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Bottom navigation items - main features (5 items with center bulge for NEWS)
  const bottomNavItems = [
    { path: "/dashboard", icon: <Home className="h-5 w-5" />, label: language === "te" ? "హోమ్" : "Home" },
    { path: "/education", icon: <GraduationCap className="h-5 w-5" />, label: language === "te" ? "విద్య" : "Education" },
    { path: "/news", icon: <Newspaper className="h-6 w-6" />, label: language === "te" ? "వార్తలు" : "News", isBulge: true },
    { path: "/benefits", icon: <Heart className="h-5 w-5" />, label: language === "te" ? "ప్రయోజనాలు" : "Benefits" },
    { path: "/helpline", icon: <Phone className="h-5 w-5" />, label: language === "te" ? "హెల్ప్‌లైన్" : "Helpline" }
  ];

  // Build menu items based on feature flags
  const menuItems = useMemo(() => {
    const items = [
      { path: "/dashboard", icon: <Home className="h-5 w-5" />, label: t("dashboard") },
      features.shop && { path: "/shop", icon: <Gift className="h-5 w-5" />, label: language === "te" ? "గిఫ్ట్ షాప్" : "Gift Shop" },
      features.education && { path: "/education", icon: <GraduationCap className="h-5 w-5" />, label: language === "te" ? "బోస్ అమెరికన్ అకాడమీ" : "Bose American Academy" },
      features.wall && { path: "/wall", icon: <PenSquare className="h-5 w-5" />, label: language === "te" ? "సిటిజన్ వాల్" : "Citizen Wall" },
      features.news && { path: "/news", icon: <Newspaper className="h-5 w-5" />, label: language === "te" ? "వార్తలు" : "News" },
      features.issues && { path: "/issues", icon: <AlertTriangle className="h-5 w-5" />, label: t("issues") },
      features.issues && { path: "/report", icon: <AlertTriangle className="h-5 w-5" />, label: t("reportIssue") },
      features.aqi && { path: "/aqi", icon: <Wind className="h-5 w-5" />, label: language === "te" ? "గాలి నాణ్యత" : "Air Quality" },
      // Only show dumpyard if feature is enabled
      features.dumpYard && { path: "/dumpyard", icon: <MapPin className="h-5 w-5" />, label: t("dumpYard") },
      features.fitness && { path: "/fitness", icon: <Activity className="h-5 w-5" />, label: t("fitness") },
      features.doctor && { path: "/doctor", icon: <Stethoscope className="h-5 w-5" />, label: language === "te" ? "కైజర్ డాక్టర్" : "Kaizer Doctor" },
      features.chat && { path: "/chat", icon: <MessageCircle className="h-5 w-5" />, label: language === "te" ? "AI చాట్" : "AI Chat" },
      features.family && { path: "/family", icon: <Users className="h-5 w-5" />, label: language === "te" ? "నా కుటుంబం" : "My Family" },
      features.benefits && { path: "/benefits", icon: <Heart className="h-5 w-5" />, label: t("benefits") },
      features.wardExpenditure && { path: "/expenditure", icon: <BarChart3 className="h-5 w-5" />, label: t("expenditure") },
      features.polls && { path: "/polls", icon: <FileText className="h-5 w-5" />, label: t("polls") },
      isVolunteer && { path: "/volunteer", icon: <Users className="h-5 w-5" />, label: language === "te" ? "వలంటీర్" : "Volunteer" },
      isAdmin && { path: "/admin", icon: <Settings className="h-5 w-5" />, label: language === "te" ? "అడ్మిన్" : "Admin" },
      { path: "/profile", icon: <User className="h-5 w-5" />, label: t("profile") }
    ];
    
    // Filter out falsy values
    return items.filter(Boolean);
  }, [features, language, t, isVolunteer, isAdmin]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Solid Black */}
      <header className="sticky top-0 z-50 bg-gray-900 text-white shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          {showBackButton ? (
            <button 
              onClick={handleBack} 
              className="flex items-center gap-2 p-2 -ml-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors native-press"
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 -ml-2 text-white/80 hover:text-white native-press"
              data-testid="menu-button"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {title ? (
            <h1 className="font-heading font-semibold text-lg text-white">
              {title}
            </h1>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {config.branding.logo ? (
                  <img src={config.branding.logo} alt={config.branding.appName} className="h-full w-full object-cover" />
                ) : (
                  <Shield className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="font-heading font-bold text-white">
                {config.branding.appNameShort || t("appName")}
              </span>
            </Link>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-white/80 hover:text-white hover:bg-white/10"
              data-testid="header-language-toggle"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">
                {language === "te" ? "EN" : "తె"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute left-0 top-0 bottom-0 w-72 bg-background shadow-2xl flex flex-col"
          >
            {/* User Profile at Top - Black Header Matching */}
            <div className="bg-gray-900 text-white p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 -ml-2 text-white/80 hover:text-white"
                  data-testid="close-menu-button"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    {config.branding.logo ? (
                      <img src={config.branding.logo} alt={config.branding.appName} className="h-full w-full object-cover" />
                    ) : (
                      <Shield className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="font-heading font-bold text-white text-sm">
                    {config.branding.appNameShort || t("appName")}
                  </span>
                </div>
              </div>
              
              {/* User Info Compact */}
              {user && (
                <Link 
                  to="/profile" 
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 mt-4 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user.name || "User"}</p>
                    <p className="text-sm text-white/70">{user.phone}</p>
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-white/50" />
                </Link>
              )}
            </div>

            {/* Menu Items - Scrollable */}
            <nav className="flex-1 p-2 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className={isActive(item.path) ? "text-primary" : "text-muted-foreground"}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-border bg-background">
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                data-testid="logout-button"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">{language === "te" ? "లాగ్ అవుట్" : "Logout"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation Bar - Black to Match Header */}
      {!showBackButton && (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 shadow-lg z-40">
          <div className="max-w-lg mx-auto px-2">
            <div className="flex items-center justify-around py-2">
              {bottomNavItems.map((item, index) => {
                const active = isActive(item.path);
                
                // Special bulge styling for center NEWS item
                if (item.isBulge) {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex flex-col items-center relative -mt-6"
                      data-testid={`nav-${item.path.replace("/", "")}`}
                    >
                      <motion.div 
                        className={`p-4 rounded-full shadow-lg transition-all ${
                          active 
                            ? "bg-white text-gray-900" 
                            : "bg-gradient-to-br from-red-500 to-orange-500 text-white"
                        }`}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {item.icon}
                      </motion.div>
                      <span className={`text-[10px] mt-1 font-semibold ${
                        active ? "text-white" : "text-gray-400"
                      }`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                }
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                      active 
                        ? "text-white" 
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                    data-testid={`nav-${item.path.replace("/", "")}`}
                  >
                    <motion.div 
                      className={`p-2 rounded-xl transition-all ${
                        active 
                          ? "bg-white/10 text-white" 
                          : "text-gray-400"
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      {item.icon}
                    </motion.div>
                    <span className={`text-[10px] mt-0.5 font-medium ${
                      active ? "text-white" : "text-gray-400"
                    }`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
