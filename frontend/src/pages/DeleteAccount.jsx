import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Shield, CheckCircle, Loader2, Timer } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function DeleteAccount() {
  const { language } = useLanguage();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: info, 2: confirm, 3: verify, 4: done
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer effect for resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev <= 1 ? 0 : prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error(language === "te" ? "చెల్లుబాటు అయ్యే ఫోన్ నంబర్ నమోదు చేయండి" : "Enter valid phone number");
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/send-otp`, { phone });
      setOtpSent(true);
      setResendTimer(30);
      toast.success(language === "te" ? "OTP పంపబడింది" : "OTP sent to your phone");
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!otp || otp.length !== 6) {
      toast.error(language === "te" ? "6-అంకెల OTP నమోదు చేయండి" : "Enter 6-digit OTP");
      return;
    }
    
    setLoading(true);
    try {
      // Verify OTP first
      const verifyResponse = await axios.post(`${API}/api/auth/verify-otp`, { 
        phone, 
        otp,
        delete_request: true 
      });
      
      if (verifyResponse.data.success) {
        // Request account deletion
        await axios.delete(`${API}/api/user/delete-account`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { reason, phone }
        });
        
        setStep(4);
        toast.success(language === "te" ? "ఖాతా తొలగింపు అభ్యర్థన సమర్పించబడింది" : "Account deletion request submitted");
        
        // Logout after 3 seconds
        setTimeout(() => {
          logout();
          navigate("/");
        }, 3000);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showBackButton title={language === "te" ? "ఖాతా తొలగించు" : "Delete Account"}>
      <div className="p-4 pb-24 space-y-6" data-testid="delete-account-page">
        
        {step === 1 && (
          <>
            {/* Warning Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {language === "te" ? "ఖాతా తొలగింపు అభ్యర్థన" : "Request Account Deletion"}
              </h1>
              <p className="text-sm text-gray-500">
                {language === "te" 
                  ? "మీ ఖాతాను తొలగించడానికి ముందు దయచేసి క్రింది సమాచారాన్ని చదవండి"
                  : "Please read the following information before deleting your account"
                }
              </p>
            </div>

            {/* What Gets Deleted */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-800 font-semibold">
                  <AlertTriangle className="w-5 h-5" />
                  {language === "te" ? "తొలగించబడే డేటా" : "Data That Will Be Deleted"}
                </div>
                <ul className="text-sm text-red-700 space-y-1 pl-6 list-disc">
                  <li>{language === "te" ? "మీ ప్రొఫైల్ సమాచారం (పేరు, ఫోన్, కాలనీ)" : "Your profile information (name, phone, colony)"}</li>
                  <li>{language === "te" ? "ఆరోగ్య & ఫిట్‌నెస్ డేటా (BMI, నీటి తీసుకోవడం, వ్యాయామ రికార్డులు)" : "Health & fitness data (BMI, water intake, exercise records)"}</li>
                  <li>{language === "te" ? "మీరు నివేదించిన సమస్యలు మరియు ఫోటోలు" : "Issues you reported and photos"}</li>
                  <li>{language === "te" ? "మీ యాప్ ప్రాధాన్యతలు మరియు సెట్టింగ్‌లు" : "Your app preferences and settings"}</li>
                </ul>
              </CardContent>
            </Card>

            {/* What Gets Retained */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-800 font-semibold">
                  <Shield className="w-5 h-5" />
                  {language === "te" ? "30 రోజులు ఉంచబడే డేటా" : "Data Retained for 30 Days"}
                </div>
                <p className="text-sm text-blue-700">
                  {language === "te" 
                    ? "చట్టపరమైన మరియు నియంత్రణ అవసరాల కోసం, మేము మీ ఖాతా తొలగింపు అభ్యర్థన తర్వాత 30 రోజుల పాటు కొన్ని డేటాను ఉంచుతాము. ఈ వ్యవధి తర్వాత, అన్ని డేటా శాశ్వతంగా తొలగించబడుతుంది."
                    : "For legal and regulatory requirements, we retain some data for 30 days after your account deletion request. After this period, all data will be permanently deleted."
                  }
                </p>
              </CardContent>
            </Card>

            <Button 
              onClick={() => setStep(2)} 
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {language === "te" ? "కొనసాగించు" : "Continue"}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Confirmation */}
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-gray-900">
                {language === "te" ? "మీ గుర్తింపును ధృవీకరించండి" : "Verify Your Identity"}
              </h2>
              <p className="text-sm text-gray-500">
                {language === "te" 
                  ? "భద్రత కోసం, దయచేసి మీ ఫోన్ నంబర్‌ను OTP తో ధృవీకరించండి"
                  : "For security, please verify your phone number with OTP"
                }
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>{language === "te" ? "ఫోన్ నంబర్" : "Phone Number"}</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>

              {!otpSent ? (
                <Button 
                  onClick={handleSendOtp} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {language === "te" ? "OTP పంపు" : "Send OTP"}
                </Button>
              ) : (
                <>
                  <div>
                    <Label>{language === "te" ? "OTP నమోదు చేయండి" : "Enter OTP"}</Label>
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>

                  {/* Resend OTP Timer */}
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                        <Timer className="h-4 w-4" />
                        {language === "te" 
                          ? `${resendTimer} సెకన్లలో OTP మళ్ళీ పంపవచ్చు` 
                          : `Resend OTP in ${resendTimer}s`}
                      </p>
                    ) : (
                      <Button
                        variant="link"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="text-teal-600"
                      >
                        {language === "te" ? "OTP మళ్ళీ పంపండి" : "Resend OTP"}
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label>{language === "te" ? "తొలగింపు కారణం (ఐచ్ఛికం)" : "Reason for deletion (optional)"}</Label>
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={language === "te" ? "మీ అభిప్రాయాన్ని పంచుకోండి" : "Share your feedback"}
                    />
                  </div>

                  <Button 
                    onClick={handleDeleteAccount} 
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {language === "te" ? "ఖాతాను శాశ్వతంగా తొలగించు" : "Permanently Delete Account"}
                  </Button>
                </>
              )}

              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setStep(1)}
              >
                {language === "te" ? "వెనుకకు" : "Go Back"}
              </Button>
            </div>
          </>
        )}

        {step === 4 && (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {language === "te" ? "అభ్యర్థన సమర్పించబడింది" : "Request Submitted"}
            </h2>
            <p className="text-sm text-gray-600">
              {language === "te" 
                ? "మీ ఖాతా తొలగింపు అభ్యర్థన స్వీకరించబడింది. 30 రోజులలో మీ డేటా శాశ్వతంగా తొలగించబడుతుంది."
                : "Your account deletion request has been received. Your data will be permanently deleted within 30 days."
              }
            </p>
            <p className="text-xs text-gray-400">
              {language === "te" ? "మీరు స్వయంచాలకంగా లాగ్ అవుట్ చేయబడతారు..." : "You will be logged out automatically..."}
            </p>
          </div>
        )}

        {/* Contact Info */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          <p>{language === "te" ? "సహాయం కావాలా?" : "Need help?"}</p>
          <p className="font-medium">support@sharkify.in</p>
        </div>
      </div>
    </Layout>
  );
}
