import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppConfig, useLocalizedConfig } from "../context/AppConfigContext";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { toast } from "sonner";
import { Phone, ChevronRight, Sparkles, User, MapPin, AlertTriangle, Heart, Trash2, Star, Shield, Briefcase, GraduationCap } from "lucide-react";

export default function LandingPage() {
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const config = useAppConfig();
  const localizedConfig = useLocalizedConfig(language);
  
  const [showLogin, setShowLogin] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [colony, setColony] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick login for different roles
  const handleQuickLogin = async (role) => {
    const redirects = {
      admin: "/admin/panel",
      manager: "/manager",
      instructor: "/admin/panel?tab=courses"
    };
    
    const credentials = {
      admin: { phone: "+919876543210", otp: "123456" },
      manager: { phone: "+917386917770", otp: "123456" },
      instructor: { phone: "+919876543210", otp: "123456" }
    };
    
    const cred = credentials[role];
    const redirectUrl = redirects[role];
    setLoading(true);
    
    try {
      await sendOTP(cred.phone);
      const result = await verifyOTP(cred.phone, cred.otp);
      
      if (result.success) {
        // Store redirect in sessionStorage and immediately redirect
        sessionStorage.setItem('postLoginRedirect', redirectUrl);
        toast.success(`Logged in as ${role}!`);
        // Immediate hard redirect
        window.location.href = redirectUrl;
        return; // Stop execution
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Enter valid phone number");
      return;
    }
    if (isNewUser) {
      if (!name.trim()) {
        toast.error("Enter your name");
        return;
      }
      if (!colony.trim()) {
        toast.error("Enter your colony");
        return;
      }
    }
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      const result = await sendOTP(formattedPhone);
      if (result.success) {
        toast.success("OTP sent!");
        if (result.dev_otp) toast.info(`OTP: ${result.dev_otp}`);
        setStep(2);
      }
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      const userData = isNewUser ? { name, colony } : {};
      const result = await verifyOTP(formattedPhone, otp, userData);
      if (result.success) {
        toast.success("Welcome!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-0 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-0 w-96 h-96 bg-teal-500/8 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 py-6">
        
        {/* ===== HEADER: Powered By ===== */}
        <div className="flex flex-col items-center justify-center pt-2 pb-6">
          <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">
            Powered by
          </p>
          <div className="flex items-center gap-2 opacity-80">
            <span className="text-slate-400 text-[10px]">{config.company.name}</span>
            <span className="text-slate-600 text-[10px]">&</span>
            <img 
              src={config.branding.partnerLogo} 
              alt={config.branding.partnerName} 
              className="h-5 object-contain"
            />
          </div>
        </div>
        
        {/* ===== HERO SECTION: Logo & Title ===== */}
        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src={config.branding.logo}
            alt={config.branding.appName}
            className="w-20 h-20 rounded-2xl shadow-2xl shadow-emerald-900/40 mb-4"
          />
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
            {config.branding.appName}
          </h1>
          <p className="text-slate-400 text-sm max-w-[220px]">
            {localizedConfig.tagline}
          </p>
        </div>

        {/* ===== STATS SECTION: Our Commitment ===== */}
        <div className="w-full max-w-sm mx-auto mb-8">
          <p className="text-center text-slate-500 text-[10px] uppercase tracking-widest mb-3">
            {language === "te" ? `${localizedConfig.areaName} పట్ల మా నిబద్ధత` : `Our Commitment to ${localizedConfig.areaName}`}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <p className="text-xl font-bold text-teal-400">{config.stats.benefitsAmount}</p>
              <p className="text-[9px] text-slate-400 text-center leading-tight mt-1">
                {language === "te" ? "ప్రయోజనాలు" : "Benefits to be"}<br/>{language === "te" ? "పొందబడతాయి" : "Availed"}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <p className="text-xl font-bold text-emerald-400">{config.stats.problemsSolved}</p>
              <p className="text-[9px] text-slate-400 text-center leading-tight mt-1">
                {language === "te" ? "స్థానిక సమస్యలు" : "Local Problems"}<br/>{language === "te" ? "పరిష్కరించబడతాయి" : "to be Solved"}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <p className="text-xl font-bold text-cyan-400">{config.stats.peopleBenefited}</p>
              <p className="text-[9px] text-slate-400 text-center leading-tight mt-1">
                {language === "te" ? "ప్రజలు" : "People to be"}<br/>{language === "te" ? "ప్రయోజనం పొందుతారు" : "Benefited"}
              </p>
            </div>
          </div>
        </div>

        {/* ===== AUTH SECTION: Login/Register ===== */}
        <div className="w-full max-w-sm mx-auto mb-8">
          {!showLogin ? (
            <div className="space-y-3">
              <Button 
                onClick={() => { setShowLogin(true); setIsNewUser(true); }}
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 rounded-2xl shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition-all"
                data-testid="get-started-btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-slate-500 text-xs text-center">
                Takes less than 30 seconds
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {step === 1 ? (
                <>
                  {isNewUser && (
                    <div className="space-y-3 mb-5">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <Input
                          type="text"
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-12 pl-11 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          data-testid="name-input"
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <Input
                          type="text"
                          placeholder="Your Colony/Area"
                          value={colony}
                          onChange={(e) => setColony(e.target.value)}
                          className="h-12 pl-11 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          data-testid="colony-input"
                        />
                      </div>
                    </div>
                  )}

                  {/* Phone Number Section */}
                  <div className="relative mb-5">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs font-medium">+91</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="h-12 pl-[4.5rem] text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      data-testid="phone-input"
                    />
                  </div>

                  <Button 
                    onClick={handleSendOTP}
                    disabled={loading || phone.length < 10 || (isNewUser && (!name.trim() || !colony.trim()))}
                    className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all"
                    data-testid="send-otp-btn"
                  >
                    {loading ? "Sending..." : (isNewUser ? "Register & Send OTP" : "Send OTP")}
                  </Button>

                  <button 
                    onClick={() => setIsNewUser(!isNewUser)}
                    className="w-full text-xs text-slate-400 hover:text-white transition-colors pt-1"
                    data-testid="switch-auth-mode"
                  >
                    {isNewUser 
                      ? <>Already registered? <span className="text-emerald-400 font-medium">Login</span></>
                      : <>New user? <span className="text-emerald-400 font-medium">Register</span></>
                    }
                  </button>

                  {/* Quick Access Buttons */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-center text-slate-600 text-[10px] uppercase tracking-widest mb-3">
                      Quick Access
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPhone("9876543210");
                          toast.info("Admin: 9876543210 | OTP: 123456");
                        }}
                        disabled={loading}
                        className="text-xs h-9 bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-emerald-500/50"
                        data-testid="quick-admin-btn"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPhone("7386917770");
                          toast.info("Manager: 7386917770 | OTP: 123456");
                        }}
                        disabled={loading}
                        className="text-xs h-9 bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-emerald-500/50"
                        data-testid="quick-manager-btn"
                      >
                        <Briefcase className="w-3 h-3 mr-1" />
                        Manager
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPhone("9876543210");
                          toast.info("Instructor: 9876543210 | OTP: 123456");
                        }}
                        disabled={loading}
                        className="text-xs h-9 bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-emerald-500/50"
                        data-testid="quick-instructor-btn"
                      >
                        <GraduationCap className="w-3 h-3 mr-1" />
                        Instructor
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center py-3 mb-2">
                    <p className="text-slate-400 text-xs">Enter OTP sent to</p>
                    <p className="text-white text-sm font-medium">+91 {phone}</p>
                  </div>
                  
                  <div className="flex justify-center py-3 mb-4">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} data-testid="otp-input">
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                          <InputOTPSlot
                            key={idx}
                            index={idx}
                            className="w-10 h-12 text-lg bg-white/5 border-white/10 text-white rounded-lg"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button 
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all"
                    data-testid="verify-btn"
                  >
                    {loading ? "Verifying..." : "Verify & Enter"}
                  </Button>
                  
                  <button 
                    onClick={() => { setStep(1); setOtp(""); }}
                    className="w-full text-xs text-slate-400 hover:text-white transition-colors pt-1"
                  >
                    Change details
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ===== ACTION CARDS: Quick Actions ===== */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-colors cursor-pointer group">
            <AlertTriangle className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-slate-300">{language === "te" ? "సమస్య రిపోర్ట్ చేయండి" : "Report a Problem"}</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-colors cursor-pointer group">
            <Heart className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-slate-300">{language === "te" ? "ఆరోగ్యం & ఫిట్‌నెస్" : "Health & Fitness"}</span>
          </div>
          {config.features.dumpYard && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-colors cursor-pointer group">
              <Trash2 className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-slate-300">{language === "te" ? "డంప్ యార్డ్" : "Dump Yard"}</span>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-orange-500/30 transition-colors cursor-pointer group">
            <Star className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-slate-300">{language === "te" ? "జ్యోతిష్యం" : "Astrology"}</span>
          </div>
        </div>
        
        {/* Privacy Policy & Terms Links */}
        <div className="mt-6 text-center space-x-4">
          <a 
            href="/privacy-policy" 
            className="text-xs text-slate-500 hover:text-slate-400 underline"
            onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }}
          >
            Privacy Policy
          </a>
          <span className="text-slate-600">|</span>
          <a 
            href="/terms-of-service" 
            className="text-xs text-slate-500 hover:text-slate-400 underline"
            onClick={(e) => { e.preventDefault(); navigate('/terms-of-service'); }}
          >
            Terms of Service
          </a>
        </div>

        {/* About the App - Removed */}
      </div>
    </div>
  );
}
