import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { toast } from "sonner";
import { Phone, ChevronRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Enter valid phone number");
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
      const result = await verifyOTP(formattedPhone, otp);
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

      {/* Main Content - No Scroll */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-8">
        
        {/* Logo & Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 mb-4 shadow-lg shadow-teal-500/30">
            <span className="text-4xl font-black text-white">M</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            My Dammaiguda
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Track Issues. Protect Health. Claim Benefits.
          </p>
        </div>

        {/* Primary Actions - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="text-xl">🚨</span>
            <span className="text-xs text-slate-300 font-medium">Report a Problem</span>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="text-xl">❤️</span>
            <span className="text-xs text-slate-300 font-medium">Health & Fitness</span>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="text-xl">🌿</span>
            <span className="text-xs text-slate-300 font-medium">Dump Yard & Environment</span>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="text-xl">👥</span>
            <span className="text-xs text-slate-300 font-medium">Citizen Benefits</span>
          </div>
        </div>

        {/* Login Section */}
        {!showLogin ? (
          <div className="w-full max-w-xs space-y-2">
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
          <div className="w-full max-w-xs space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {step === 1 ? (
              <>
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
                    className="h-14 pl-20 text-lg bg-white/10 border-white/20 text-white placeholder:text-slate-500 rounded-2xl focus:ring-2 focus:ring-teal-500"
                    data-testid="phone-input"
                  />
                </div>
                <Button 
                  onClick={handleSendOTP}
                  disabled={loading || phone.length < 10}
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-2xl disabled:opacity-50"
                  data-testid="send-otp-btn"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center mb-2">
                  <p className="text-slate-400 text-sm">Enter OTP sent to</p>
                  <p className="text-white font-medium">+91 {phone}</p>
                </div>
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
                          className="w-11 h-14 text-xl bg-white/10 border-white/20 text-white rounded-xl"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button 
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-2xl disabled:opacity-50"
                  data-testid="verify-btn"
                >
                  {loading ? "Verifying..." : "Verify & Enter"}
                </Button>
                <button 
                  onClick={() => { setStep(1); setOtp(""); }}
                  className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Change number
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer with Kaizer News Logo */}
      <div className="relative pb-6 px-6">
        <div className="flex flex-col items-center gap-3">
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">
            Powered by Rohan Kulkarni Foundation
          </p>
          <div className="flex items-center gap-2">
            <img 
              src="https://customer-assets.emergentagent.com/job_b415d412-3e65-4362-a62f-f8bab1368136/artifacts/x1zovr9l_kaizer%20logo.png" 
              alt="Kaizer News" 
              className="h-8 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
