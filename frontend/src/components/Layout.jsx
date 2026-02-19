import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
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
  Moon,
  Sun
} from "lucide-react";
import { useState } from "react";

export default function Layout({ children, title, showBackButton = false }) {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, logout, isVolunteer, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Bottom navigation items - main features
  const bottomNavItems = [
    { path: "/dashboard", icon: <Home className="h-5 w-5" />, label: language === "te" ? "హోమ్" : "Home" },
    { path: "/education", icon: <GraduationCap className="h-5 w-5" />, label: language === "te" ? "విద్య" : "Learn" },
    { path: "/fitness", icon: <Activity className="h-5 w-5" />, label: language === "te" ? "ఫిట్" : "Fit" },
    { path: "/chat", icon: <MessageCircle className="h-5 w-5" />, label: language === "te" ? "చాట్" : "Chat" },
    { path: "/profile", icon: <User className="h-5 w-5" />, label: language === "te" ? "ప్రొఫైల్" : "Profile" }
  ];

  const menuItems = [
    { path: "/dashboard", icon: <Home className="h-5 w-5" />, label: t("dashboard") },
    { path: "/education", icon: <GraduationCap className="h-5 w-5" />, label: language === "te" ? "AIT విద్య" : "AIT Education" },
    { path: "/wall", icon: <PenSquare className="h-5 w-5" />, label: language === "te" ? "సిటిజన్ వాల్" : "Citizen Wall" },
    { path: "/news", icon: <Newspaper className="h-5 w-5" />, label: language === "te" ? "వార్తలు" : "News" },
    { path: "/issues", icon: <AlertTriangle className="h-5 w-5" />, label: t("issues") },
    { path: "/report", icon: <AlertTriangle className="h-5 w-5" />, label: t("reportIssue") },
    { path: "/aqi", icon: <Wind className="h-5 w-5" />, label: language === "te" ? "గాలి నాణ్యత" : "Air Quality" },
    { path: "/dumpyard", icon: <MapPin className="h-5 w-5" />, label: t("dumpYard") },
    { path: "/fitness", icon: <Activity className="h-5 w-5" />, label: t("fitness") },
    { path: "/doctor", icon: <Stethoscope className="h-5 w-5" />, label: language === "te" ? "కైజర్ డాక్టర్" : "Kaizer Doctor" },
    { path: "/chat", icon: <MessageCircle className="h-5 w-5" />, label: language === "te" ? "AI చాట్" : "AI Chat" },
    { path: "/family", icon: <Users className="h-5 w-5" />, label: language === "te" ? "నా కుటుంబం" : "My Family" },
    { path: "/benefits", icon: <Heart className="h-5 w-5" />, label: t("benefits") },
    { path: "/expenditure", icon: <BarChart3 className="h-5 w-5" />, label: t("expenditure") },
    { path: "/polls", icon: <FileText className="h-5 w-5" />, label: t("polls") },
    ...(isVolunteer ? [{ path: "/volunteer", icon: <Users className="h-5 w-5" />, label: language === "te" ? "వలంటీర్" : "Volunteer" }] : []),
    ...(isAdmin ? [{ path: "/admin", icon: <Settings className="h-5 w-5" />, label: language === "te" ? "అడ్మిన్" : "Admin" }] : []),
    { path: "/profile", icon: <User className="h-5 w-5" />, label: t("profile") }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-primary via-primary to-purple-600 text-white shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          {showBackButton ? (
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center gap-2 text-white/80 hover:text-white"
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 -ml-2 text-white/80 hover:text-white"
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
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading font-bold text-white">
                {t("appName")}
              </span>
            </Link>
          )}

          <div className="flex items-center gap-2">
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
            
            {/* Profile Avatar in Header */}
            <Link 
              to="/profile" 
              className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              data-testid="header-profile"
            >
              {user?.name ? (
                <span className="text-sm font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-in slide-in-from-left">
            {/* Menu Header */}
            <div className="p-4 bg-gradient-to-r from-primary to-purple-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-heading font-bold text-white">
                    {t("appName")}
                  </span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-white/80 hover:text-white"
                  data-testid="close-menu-button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Info in Menu */}
              {user && (
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-xl font-bold">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{user.name || "User"}</p>
                      <p className="text-sm text-white/70">{user.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <nav className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className={isActive(item.path) ? "text-primary" : "text-gray-500"}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
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
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation Bar - PhonePe Style */}
      {!showBackButton && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-lg mx-auto px-2">
            <div className="flex items-center justify-around py-2">
              {bottomNavItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                      active 
                        ? "text-primary" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    data-testid={`nav-${item.path.replace("/", "")}`}
                  >
                    <div className={`p-2 rounded-xl transition-all ${
                      active 
                        ? "bg-primary/10 text-primary scale-110" 
                        : "text-gray-500"
                    }`}>
                      {item.icon}
                    </div>
                    <span className={`text-[10px] mt-0.5 font-medium ${
                      active ? "text-primary" : "text-gray-500"
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
