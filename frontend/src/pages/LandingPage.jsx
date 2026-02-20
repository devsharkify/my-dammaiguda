import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { toast } from "sonner";
import { Phone, ChevronRight, Sparkles, User, MapPin } from "lucide-react";

export default function LandingPage() {
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [colony, setColony] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Enter valid phone number");
      return;
    }
    if (!name.trim()) {
      toast.error("Enter your name");
      return;
    }
    if (!colony.trim()) {
      toast.error("Enter your colony");
      return;
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
      const result = await verifyOTP(formattedPhone, otp, name, colony);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header - Powered By Section */}
      <div className="relative pt-4 pb-2 px-6">
        <div className="flex flex-col items-center gap-1">
          <p className="text-slate-500 text-[9px] uppercase tracking-widest">
            Powered by
          </p>
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-[11px] font-medium">Rohan Kulkarni Foundation</span>
            <span className="text-slate-500 text-[11px]">&</span>
            <img 
              src="https://customer-assets.emergentagent.com/job_b415d412-3e65-4362-a62f-f8bab1368136/artifacts/zoaa3k1e_Untitled%20design%20%2823%29.png" 
              alt="Kaizer News" 
              className="h-7 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Main Content - No Scroll */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-4">
        
        {/* Logo & Title */}
        <div className="text-center mb-4">
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/b415d412-3e65-4362-a62f-f8bab1368136/images/fd09263f1ffaceb3dad575cd85696c5fbff1a43edc5d0829bc8e76785518ca64.png"
            alt="My Dammaiguda"
            className="w-24 h-24 mx-auto mb-3 rounded-2xl shadow-lg shadow-teal-500/30"
          />
          <h1 className="text-3xl font-bold text-white tracking-tight">
            My Dammaiguda
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">
            Track Issues. Protect Health. Claim Benefits.
          </p>
        </div>

        {/* Our Commitment Section */}
        <div className="w-full max-w-xs mb-4">
          <p className="text-center text-slate-500 text-[10px] uppercase tracking-widest mb-3">
            Our Commitment to Dammaiguda
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center py-2.5 px-1 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xl font-bold text-teal-400">₹10Cr+</p>
              <p className="text-[9px] text-slate-400 leading-tight mt-1">Benefits to be<br/>Availed</p>
            </div>
            <div className="text-center py-2.5 px-1 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xl font-bold text-emerald-400">100+</p>
              <p className="text-[9px] text-slate-400 leading-tight mt-1">Local Problems<br/>to be Solved</p>
            </div>
            <div className="text-center py-2.5 px-1 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xl font-bold text-cyan-400">50K+</p>
              <p className="text-[9px] text-slate-400 leading-tight mt-1">People to be<br/>Benefited</p>
            </div>
          </div>
        </div>

        {/* Login Section - Now After Numbers */}
        {!showLogin ? (
          <div className="w-full max-w-xs space-y-1.5 mb-4">
            <Button 
              onClick={() => setShowLogin(true)}
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-2xl shadow-lg shadow-teal-500/30 transition-all"
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
          <div className="w-full max-w-xs space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300 mb-4">
            {step === 1 ? (
              <>
                {/* Name Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 pl-12 text-base bg-white/10 border-white/20 text-white placeholder:text-slate-500 rounded-2xl focus:ring-2 focus:ring-teal-500"
                    data-testid="name-input"
                  />
                </div>

                {/* Phone Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">+91</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="h-12 pl-20 text-base bg-white/10 border-white/20 text-white placeholder:text-slate-500 rounded-2xl focus:ring-2 focus:ring-teal-500"
                    data-testid="phone-input"
                  />
                </div>

                {/* Colony Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Your Colony/Area"
                    value={colony}
                    onChange={(e) => setColony(e.target.value)}
                    className="h-12 pl-12 text-base bg-white/10 border-white/20 text-white placeholder:text-slate-500 rounded-2xl focus:ring-2 focus:ring-teal-500"
                    data-testid="colony-input"
                  />
                </div>

                <Button 
                  onClick={handleSendOTP}
                  disabled={loading || phone.length < 10 || !name.trim() || !colony.trim()}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-2xl disabled:opacity-50"
                  data-testid="send-otp-btn"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center py-2">
                  <p className="text-slate-400 text-sm">Enter OTP sent to</p>
                  <p className="text-white font-medium">+91 {phone}</p>
                </div>
                
                <div className="py-3">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      data-testid="otp-input"
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                          <InputOTPSlot
                            key={idx}
                            index={idx}
                            className="w-10 h-12 text-xl bg-white/10 border-white/20 text-white rounded-xl"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button 
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-2xl disabled:opacity-50"
                  data-testid="verify-btn"
                >
                  {loading ? "Verifying..." : "Verify & Enter"}
                </Button>
                <button 
                  onClick={() => { setStep(1); setOtp(""); }}
                  className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Change details
                </button>
              </>
            )}
          </div>
        )}

        {/* Primary Actions - 2x2 Grid - Now After Login */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="text-lg">🚨</span>
            <span className="text-[11px] text-slate-300 font-medium">Report a Problem</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="text-lg">❤️</span>
            <span className="text-[11px] text-slate-300 font-medium">Health & Fitness</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="text-lg">🌿</span>
            <span className="text-[11px] text-slate-300 font-medium">Dump Yard</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="text-lg">👥</span>
            <span className="text-[11px] text-slate-300 font-medium">Claim Benefits</span>
          </div>
        </div>
      </div>
    </div>
  );
}
