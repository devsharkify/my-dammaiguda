import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
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
  PenSquare
} from "lucide-react";
import { useState } from "react";

export default function Layout({ children, title, showBackButton = false }) {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, logout, isVolunteer, isAdmin } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", icon: <Home className="h-5 w-5" />, label: t("home") },
    { path: "/issues", icon: <AlertTriangle className="h-5 w-5" />, label: t("issues") },
    { path: "/fitness", icon: <Activity className="h-5 w-5" />, label: t("fitness") },
    { path: "/profile", icon: <User className="h-5 w-5" />, label: t("profile") }
  ];

  const menuItems = [
    { path: "/dashboard", icon: <Home className="h-5 w-5" />, label: t("dashboard") },
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          {showBackButton ? (
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 -ml-2 text-text-secondary hover:text-text-primary"
              data-testid="menu-button"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {title ? (
            <h1 className="font-heading font-semibold text-lg text-text-primary">
              {title}
            </h1>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading font-bold text-primary">
                {t("appName")}
              </span>
            </Link>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-1 text-text-secondary"
            data-testid="header-language-toggle"
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">
              {language === "te" ? "EN" : "తె"}
            </span>
          </Button>
        </div>
      </header>

      {/* Side Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            {/* Menu Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="font-heading font-bold text-primary">
                  {t("appName")}
                </span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-text-secondary hover:text-text-primary"
                data-testid="close-menu-button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="p-4 bg-muted/50 border-b border-border/50">
                <p className="font-semibold text-text-primary">{user.name}</p>
                <p className="text-sm text-text-muted">{user.phone}</p>
                {user.colony && (
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {user.colony}
                  </p>
                )}
              </div>
            )}

            {/* Menu Items */}
            <nav className="p-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:bg-muted"
                  }`}
                  data-testid={`menu-item-${item.path.slice(1)}`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Logout */}
            {user && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  data-testid="logout-button"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  {t("logout")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/50 z-40">
          <div className="max-w-lg mx-auto flex items-center justify-around py-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
                data-testid={`nav-${item.path.slice(1)}`}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
