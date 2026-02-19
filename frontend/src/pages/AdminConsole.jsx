import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import {
  Shield,
  Smartphone,
  Download,
  Lock,
  Users,
  AlertTriangle,
  GraduationCap,
  Settings,
  ChevronRight,
  Loader2,
  CheckCircle
} from "lucide-react";

export default function AdminConsole() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if app is installed
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Redirect to admin dashboard if already logged in as admin
  useEffect(() => {
    if (user && user.role === "admin") {
      const tab = searchParams.get("tab");
      navigate(tab ? `/admin-dashboard?tab=${tab}` : "/admin-dashboard");
    }
  }, [user, navigate, searchParams]);

  // Add admin manifest to head
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/admin-manifest.json';
    document.head.appendChild(link);

    // Update theme color for admin
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute('content', '#1f2937');
    }

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success("Admin Console installed!");
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Enter valid phone number");
      return;
    }
    setLoading(true);
    try {
      const phoneNum = phone.startsWith('+') ? phone : `+91${phone}`;
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNum })
      });
      if (response.ok) {
        setOtpSent(true);
        toast.success("OTP sent to your phone");
      }
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const phoneNum = phone.startsWith('+') ? phone : `+91${phone}`;
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNum, otp })
      });
      const data = await response.json();
      
      if (response.ok && data.user?.role === "admin") {
        login(data.user, data.token);
        toast.success("Welcome, Admin!");
        navigate("/admin-dashboard");
      } else if (response.ok && data.user?.role !== "admin") {
        toast.error("Access denied. Admin only.");
      } else {
        toast.error(data.detail || "Invalid OTP");
      }
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const adminFeatures = [
    { icon: <AlertTriangle className="h-5 w-5" />, title: "Issues", desc: "Manage reported issues" },
    { icon: <Users className="h-5 w-5" />, title: "Users", desc: "User management" },
    { icon: <GraduationCap className="h-5 w-5" />, title: "Education", desc: "Courses & scholarships" },
    { icon: <Settings className="h-5 w-5" />, title: "CMS", desc: "Content management" }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Console</h1>
              <p className="text-xs text-gray-400">My Dammaiguda</p>
            </div>
          </div>
          {!isInstalled && deferredPrompt && (
            <Button
              size="sm"
              onClick={handleInstall}
              className="bg-primary hover:bg-primary/90"
            >
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Install Banner */}
        {!isInstalled && (
          <Card className="bg-gradient-to-r from-primary/20 to-purple-900/20 border-primary/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Install Admin App</h3>
                <p className="text-xs text-gray-400">Add to home screen for quick access</p>
              </div>
              {deferredPrompt ? (
                <Button size="sm" onClick={handleInstall} className="bg-primary">
                  Install
                </Button>
              ) : (
                <div className="text-xs text-gray-500">
                  Use browser menu → "Add to Home Screen"
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isInstalled && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Admin Console installed</span>
          </div>
        )}

        {/* Login Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center">
                <Lock className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Admin Login</h2>
                <p className="text-sm text-gray-400">Secure access for administrators</p>
              </div>
            </div>

            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Phone Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-gray-700 rounded-lg text-gray-400 text-sm">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="9999999999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 bg-gray-700 border-gray-600 text-white"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Admin: +919999999999 | OTP: 123456</p>
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={loading || phone.length < 10}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send OTP
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Enter OTP</label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-gray-700 border-gray-600 text-white text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify & Login
                </Button>
                <button
                  onClick={() => { setOtpSent(false); setOtp(""); }}
                  className="w-full text-sm text-gray-400 hover:text-white"
                >
                  Change phone number
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Admin Features</h3>
          <div className="grid grid-cols-2 gap-3">
            {adminFeatures.map((feature, idx) => (
              <Card key={idx} className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="text-primary mb-2">{feature.icon}</div>
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4">
          <p>My Dammaiguda Admin Console v1.0</p>
          <p className="mt-1">Secure • Fast • Mobile-first</p>
        </div>
      </div>
    </div>
  );
}
