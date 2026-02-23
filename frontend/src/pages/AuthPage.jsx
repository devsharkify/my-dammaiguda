import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { toast } from "sonner";
import { Shield, Phone, ArrowLeft, Globe, User, MapPin, Calendar, Timer } from "lucide-react";
import { Link } from "react-router-dom";

const colonies = [
  "Dammaiguda",
  "Nagaram",
  "Rampally",
  "Jawaharnagar",
  "Alkapuri Colony",
  "Sai Nagar",
  "Sri Sai Colony",
  "Vinayak Nagar",
  "Other"
];

const ageRanges = [
  "18-25",
  "26-35",
  "36-45",
  "46-55",
  "56-65",
  "65+"
];

export default function AuthPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: phone, 2: otp, 3: register (new user)
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Resend OTP timer
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  // Registration fields
  const [name, setName] = useState("");
  const [colony, setColony] = useState("");
  const [ageRange, setAgeRange] = useState("");

  // Timer effect for resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error(language === "te" ? "చెల్లుబాటు అయ్యే ఫోన్ నంబర్ నమోదు చేయండి" : "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      const result = await sendOTP(formattedPhone);
      
      if (result.success) {
        toast.success(t("otpSent"));
        // Show dev OTP for testing
        if (result.dev_otp) {
          toast.info(`Dev OTP: ${result.dev_otp}`);
        }
        setStep(2);
        // Start 30 second timer
        setResendTimer(30);
        setCanResend(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend && resendTimer > 0) {
      toast.error(language === "te" ? `${resendTimer} సెకన్లలో మళ్లీ ప్రయత్నించండి` : `Please wait ${resendTimer} seconds`);
      return;
    }
    
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      const result = await sendOTP(formattedPhone);
      
      if (result.success) {
        toast.success(language === "te" ? "OTP మళ్ళీ పంపబడింది" : "OTP resent successfully");
        if (result.dev_otp) {
          toast.info(`Dev OTP: ${result.dev_otp}`);
        }
        // Reset timer
        setResendTimer(30);
        setCanResend(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error(t("invalidOTP"));
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      const result = await verifyOTP(formattedPhone, otp);
      
      if (result.is_new_user) {
        // New user - show registration form
        setIsNewUser(true);
        setStep(3);
      } else {
        // Existing user - logged in
        toast.success(language === "te" ? "విజయవంతంగా లాగిన్ అయ్యారు!" : "Logged in successfully!");
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t("invalidOTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      toast.error(language === "te" ? "పేరు అవసరం" : "Name is required");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      await verifyOTP(formattedPhone, otp, {
        name: name.trim(),
        colony: colony || null,
        age_range: ageRange || null
      });
      
      toast.success(language === "te" ? "విజయవంతంగా నమోదు అయ్యారు!" : "Registered successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-5 w-5" />
            <span>{t("back")}</span>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5"
            data-testid="auth-language-toggle"
          >
            <Globe className="h-4 w-4" />
            <span>{language === "te" ? "EN" : "తె"}</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="font-heading text-2xl text-text-primary">
                {t("appName")}
              </CardTitle>
              <CardDescription className="text-text-muted mt-1">
                {language === "te" 
                  ? "మీ ఫోన్ నంబర్‌తో లాగిన్ అవ్వండి"
                  : "Login with your phone number"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Step 1: Phone Number */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-text-primary font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("phoneNumber")}
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-3 bg-muted rounded-lg border border-input text-text-secondary">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={language === "te" ? "98765 43210" : "98765 43210"}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="h-12 text-lg"
                      data-testid="phone-input"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={loading || phone.length < 10}
                  className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-full text-lg font-medium"
                  data-testid="send-otp-btn"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      {t("loading")}
                    </span>
                  ) : (
                    t("sendOTP")
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && !isNewUser && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-text-secondary mb-1">
                    {language === "te" ? "OTP పంపబడింది" : "OTP sent to"}
                  </p>
                  <p className="font-semibold text-text-primary">+91 {phone}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-text-primary font-medium text-center block">
                    {t("enterOTP")}
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      data-testid="otp-input"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-14 w-12 text-xl" />
                        <InputOTPSlot index={1} className="h-14 w-12 text-xl" />
                        <InputOTPSlot index={2} className="h-14 w-12 text-xl" />
                        <InputOTPSlot index={3} className="h-14 w-12 text-xl" />
                        <InputOTPSlot index={4} className="h-14 w-12 text-xl" />
                        <InputOTPSlot index={5} className="h-14 w-12 text-xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-full text-lg font-medium"
                  data-testid="verify-otp-btn"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      {t("loading")}
                    </span>
                  ) : (
                    t("verifyOTP")
                  )}
                </Button>

                {/* Resend OTP with Timer */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-text-muted text-sm flex items-center justify-center gap-2">
                      <Timer className="h-4 w-4" />
                      {language === "te" 
                        ? `${resendTimer} సెకన్లలో OTP మళ్ళీ పంపవచ్చు` 
                        : `Resend OTP in ${resendTimer}s`}
                    </p>
                  ) : (
                    <Button
                      variant="link"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-primary hover:text-primary/80"
                      data-testid="resend-otp-btn"
                    >
                      {language === "te" ? "OTP రాలేదా? మళ్ళీ పంపండి" : "Didn't receive OTP? Resend"}
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => { setStep(1); setOtp(""); setResendTimer(0); setCanResend(false); }}
                  className="w-full text-text-muted"
                  data-testid="change-phone-btn"
                >
                  {language === "te" ? "ఫోన్ నంబర్ మార్చు" : "Change phone number"}
                </Button>
              </div>
            )}

            {/* Step 3: Registration (New User) */}
            {step === 3 && isNewUser && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-text-secondary">
                    {language === "te" 
                      ? "మీ వివరాలతో నమోదు చేయండి"
                      : "Register with your details"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-text-primary font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("name")} *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("enterName")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                    data-testid="name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-text-primary font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t("colony")}
                  </Label>
                  <Select value={colony} onValueChange={setColony}>
                    <SelectTrigger className="h-12" data-testid="colony-select">
                      <SelectValue placeholder={t("selectColony")} />
                    </SelectTrigger>
                    <SelectContent>
                      {colonies.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-text-primary font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t("ageRange")}
                  </Label>
                  <Select value={ageRange} onValueChange={setAgeRange}>
                    <SelectTrigger className="h-12" data-testid="age-select">
                      <SelectValue placeholder={t("selectAge")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ageRanges.map((age) => (
                        <SelectItem key={age} value={age}>{age}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={loading || !name.trim()}
                  className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-full text-lg font-medium mt-4"
                  data-testid="register-btn"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      {t("loading")}
                    </span>
                  ) : (
                    t("register")
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Credentials for Google Play Review */}
        <Card className="w-full max-w-md border-dashed border-2 border-muted bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-center text-muted-foreground mb-3 font-medium">
              🔐 Test Credentials (For App Review)
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <span className="text-muted-foreground">Test User:</span>
                <code className="font-mono text-primary">9876543210</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <span className="text-muted-foreground">Test OTP:</span>
                <code className="font-mono text-primary">123456</code>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-dashed space-y-1">
              <p className="text-xs text-muted-foreground text-center">
                Admin & Manager Portal: <code className="text-primary">/staff-login</code>
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Phone: <code className="text-primary">9876543210</code> | OTP: <code className="text-primary">123456</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
