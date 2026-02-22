import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import {
  Shield,
  Users,
  GraduationCap,
  Heart,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  ChevronRight,
  Building2,
  Settings,
  BookOpen,
  UserCog
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PORTALS = [
  {
    id: "admin",
    name: "Admin Panel",
    name_te: "అడ్మిన్ ప్యానెల్",
    description: "Full system control, user management, analytics",
    icon: Shield,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50",
    roles: ["admin"],
    path: "/admin/panel"
  },
  {
    id: "manager",
    name: "Manager Portal",
    name_te: "మేనేజర్ పోర్టల్",
    description: "Area-specific issue management",
    icon: UserCog,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    roles: ["admin", "manager"],
    path: "/manager"
  },
  {
    id: "instructor",
    name: "Instructor Portal",
    name_te: "ఇన్‌స్ట్రక్టర్ పోర్టల్",
    description: "Course creation, student analytics",
    icon: GraduationCap,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    roles: ["admin", "instructor"],
    path: "/instructor"
  },
  {
    id: "volunteer",
    name: "Volunteer Dashboard",
    name_te: "వాలంటీర్ డాష్‌బోర్డ్",
    description: "Community service activities",
    icon: Heart,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    roles: ["admin", "volunteer"],
    path: "/volunteer"
  }
];

export default function PortalSelector() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(user);

  // Update local state when auth context changes
  useEffect(() => {
    setLoggedInUser(user);
    if (user) {
      setShowLogin(false);
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("Please enter phone and password");
      return;
    }

    setLoading(true);
    try {
      // Normalize phone
      let normalizedPhone = phone.replace(/\D/g, "");
      if (normalizedPhone.length === 10) {
        normalizedPhone = `+91${normalizedPhone}`;
      } else if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = `+${normalizedPhone}`;
      }

      const response = await axios.post(`${API}/auth/admin-login`, {
        phone: normalizedPhone,
        password
      });

      if (response.data.success) {
        // Note: login expects (user, token) order
        login(response.data.user, response.data.token);
        setLoggedInUser(response.data.user);
        toast.success(`Welcome, ${response.data.user.name || "Admin"}!`);
        setShowLogin(false);
        // Force page reload to update state
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const canAccessPortal = (portal) => {
    // Check localStorage directly for most up-to-date state
    const storedUser = localStorage.getItem('dammaiguda_user');
    const currentUser = storedUser ? JSON.parse(storedUser) : (loggedInUser || user);
    if (!currentUser) return false;
    return portal.roles.includes(currentUser.role);
  };

  const handlePortalClick = (portal) => {
    // Check localStorage directly for most up-to-date state
    const storedUser = localStorage.getItem('dammaiguda_user');
    const currentUser = storedUser ? JSON.parse(storedUser) : (loggedInUser || user);
    
    if (!currentUser) {
      setShowLogin(true);
      toast.info("Please login first");
      return;
    }
    
    if (!portal.roles.includes(currentUser.role)) {
      toast.error(`You need ${portal.roles.join(" or ")} role to access this portal`);
      return;
    }
    
    // Navigate to the portal
    window.location.href = portal.path;
  };

  // Get current user from multiple sources
  const storedUser = typeof window !== 'undefined' && localStorage.getItem('dammaiguda_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : (loggedInUser || user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">Staff Portal</h1>
              <p className="text-xs text-white/60">My Dammaiguda Administration</p>
            </div>
          </div>
          
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-white font-medium">{currentUser.name}</p>
                <p className="text-xs text-white/60 capitalize">{currentUser.role}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.reload();
                }}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Login Card */}
        {!currentUser && (
          <Card className="mb-8 border-0 shadow-2xl bg-white/10 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Staff Login</h2>
                  <p className="text-sm text-white/60">Enter your credentials to access portals</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Login to Continue
                </Button>
              </form>

              {/* Test Credentials Info */}
              <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/60 mb-2">🔑 Master Admin Credentials:</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Phone: <code className="bg-white/10 px-2 py-0.5 rounded">9100063133</code></span>
                  <span className="text-white/80">Password: <code className="bg-white/10 px-2 py-0.5 rounded">Plan@123</code></span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portal Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Select Portal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              const hasAccess = canAccessPortal(portal);
              
              return (
                <Card
                  key={portal.id}
                  className={`border-0 shadow-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                    hasAccess 
                      ? "bg-white/10 backdrop-blur-md hover:bg-white/15" 
                      : "bg-white/5 opacity-60"
                  }`}
                  onClick={() => handlePortalClick(portal)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Icon Section */}
                      <div className={`w-20 flex items-center justify-center bg-gradient-to-br ${portal.color}`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      
                      {/* Content Section */}
                      <div className="flex-1 p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{portal.name}</h3>
                          <p className="text-xs text-white/60 mt-0.5">{portal.description}</p>
                          <div className="flex gap-1 mt-2">
                            {portal.roles.map(role => (
                              <span
                                key={role}
                                className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  user?.role === role 
                                    ? "bg-green-500/20 text-green-400" 
                                    : "bg-white/10 text-white/50"
                                }`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <ChevronRight className={`h-5 w-5 ${hasAccess ? "text-white/60" : "text-white/20"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-white/60 mb-3">Quick Links:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => navigate("/")}
            >
              ← Back to User App
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => window.open("https://mydammaiguda.in", "_blank")}
            >
              Production Site ↗
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-white/10 py-3">
        <p className="text-center text-xs text-white/40">
          My Dammaiguda Staff Portal • Powered by Rohan Kulkarni
        </p>
      </div>
    </div>
  );
}
