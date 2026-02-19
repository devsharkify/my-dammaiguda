import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Award,
  Download,
  Share2,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  MessageCircle,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Link2,
  Sparkles,
  GraduationCap,
  Instagram
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Certificate() {
  const { certificateId } = useParams();
  const { language } = useLanguage();
  const certificateRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCertificate();
  }, [certificateId]);

  const fetchCertificate = async () => {
    try {
      const response = await axios.get(`${API}/education/certificates/${certificateId}`);
      setCertificate(response.data);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      toast.error("Certificate not found");
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = certificate ? `I completed "${certificate.course_title}" on AIT Education! 🎓` : '';
  const shareText = certificate 
    ? `I just earned my certificate for completing "${certificate.course_title}" on AIT Education! Check out my achievement.`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(language === "te" ? "లింక్ కాపీ చేయబడింది!" : "Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(shareTitle);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(shareTitle);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we copy and guide user
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    toast.success(
      language === "te" 
        ? "టెక్స్ట్ కాపీ చేయబడింది! Instagram స్టోరీలో పేస్ట్ చేయండి" 
        : "Text copied! Paste it in your Instagram story"
    );
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`🎓 ${certificate?.user_name} completed ${certificate?.course_title}`);
    const body = encodeURIComponent(`${shareText}\n\nView certificate: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Share failed:", error);
        }
      }
    } else {
      setShowShareDialog(true);
    }
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "సర్టిఫికెట్" : "Certificate"}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-pulse">
            <Award className="h-10 w-10 text-white" />
          </div>
          <p className="text-muted-foreground">{language === "te" ? "లోడ్ అవుతోంది..." : "Loading certificate..."}</p>
        </div>
      </Layout>
    );
  }

  if (!certificate) {
    return (
      <Layout showBackButton title={language === "te" ? "సర్టిఫికెట్" : "Certificate"}>
        <div className="text-center py-10">
          <Award className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Certificate not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "సర్టిఫికెట్" : "Certificate"}>
      <div className="space-y-4 pb-20" data-testid="certificate-view">
        
        {/* Achievement Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-4 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">
              {language === "te" ? "అభినందనలు!" : "Congratulations!"}
            </span>
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm text-white/90">
            {language === "te" 
              ? "మీరు ఈ కోర్సును విజయవంతంగా పూర్తి చేసారు" 
              : "You have successfully completed this course"}
          </p>
        </div>

        {/* Premium Certificate Card */}
        <div 
          ref={certificateRef}
          className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-amber-200 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          {/* Gold Border Frame */}
          <div className="absolute inset-3 border-2 border-amber-300 rounded-xl pointer-events-none"></div>
          
          {/* Corner Decorations */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-400 rounded-br-lg"></div>
          
          <div className="relative p-8 text-center space-y-5">
            {/* Logo & Header */}
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  AIT Education
                </h1>
                <p className="text-amber-600 text-xs uppercase tracking-[0.3em] mt-1">
                  {language === "te" ? "పూర్తి చేసిన సర్టిఫికెట్" : "Certificate of Completion"}
                </p>
              </div>
            </div>
            
            {/* Decorative Divider */}
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300"></div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-300"></div>
            </div>
            
            {/* Certificate Body */}
            <div className="py-2">
              <p className="text-gray-500 text-sm">
                {language === "te" ? "ఈ ద్వారా ధృవీకరించబడింది" : "This is to certify that"}
              </p>
              <h2 className="text-3xl font-bold text-gray-800 my-3 font-serif">
                {certificate.user_name}
              </h2>
              <p className="text-gray-500 text-sm">
                {language === "te" ? "విజయవంతంగా పూర్తి చేసారు" : "has successfully completed"}
              </p>
              <div className="mt-3 p-3 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl">
                <h3 className="text-xl font-bold text-primary">
                  {certificate.course_title}
                </h3>
              </div>
            </div>
            
            {/* Footer */}
            <div className="pt-4 border-t border-amber-200/50">
              <div className="flex items-center justify-between text-xs">
                <div className="text-left">
                  <p className="font-semibold text-gray-700">{certificate.instructor_name}</p>
                  <p className="text-gray-500">{language === "te" ? "బోధకుడు" : "Instructor"}</p>
                </div>
                <div className="text-center">
                  <Award className="h-8 w-8 text-amber-500 mx-auto" />
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-amber-600">{certificate.certificate_number}</p>
                  <p className="text-gray-500">{new Date(certificate.issued_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Actions */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardContent className="p-4">
            <h3 className="font-semibold text-center mb-4 flex items-center justify-center gap-2">
              <Share2 className="h-4 w-4" />
              {language === "te" ? "మీ సాధనను షేర్ చేయండి" : "Share Your Achievement"}
            </h3>
            
            {/* Social Share Buttons */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              <button
                onClick={shareToWhatsApp}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                data-testid="share-whatsapp"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-[9px]">WhatsApp</span>
              </button>
              
              <button
                onClick={shareToInstagram}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white hover:opacity-90 transition-opacity"
                data-testid="share-instagram"
              >
                <Instagram className="h-5 w-5" />
                <span className="text-[9px]">Instagram</span>
              </button>
              
              <button
                onClick={shareToTwitter}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                data-testid="share-twitter"
              >
                <Twitter className="h-5 w-5" />
                <span className="text-[9px]">Twitter</span>
              </button>
              
              <button
                onClick={shareToFacebook}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                data-testid="share-facebook"
              >
                <Facebook className="h-5 w-5" />
                <span className="text-[9px]">Facebook</span>
              </button>
              
              <button
                onClick={shareToLinkedIn}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors"
                data-testid="share-linkedin"
              >
                <Linkedin className="h-5 w-5" />
                <span className="text-[9px]">LinkedIn</span>
              </button>
              
              <button
                onClick={shareByEmail}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                data-testid="share-email"
              >
                <Mail className="h-5 w-5" />
                <span className="text-[9px]">Email</span>
              </button>
            </div>
            
            {/* Copy Link */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm truncate">
                <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate text-muted-foreground">{shareUrl}</span>
              </div>
              <Button 
                onClick={copyLink}
                variant={copied ? "default" : "outline"}
                className="flex-shrink-0"
              >
                {copied ? (
                  <><CheckCircle className="h-4 w-4 mr-1" /> {language === "te" ? "కాపీ!" : "Copied!"}</>
                ) : (
                  <><Copy className="h-4 w-4 mr-1" /> {language === "te" ? "కాపీ" : "Copy"}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={nativeShare}
            className="h-12"
          >
            <Share2 className="h-4 w-4 mr-2" />
            {language === "te" ? "మరిన్ని ఎంపికలు" : "More Options"}
          </Button>
          <Button className="h-12 bg-gradient-to-r from-primary to-purple-600">
            <Download className="h-4 w-4 mr-2" />
            {language === "te" ? "డౌన్‌లోడ్" : "Download"}
          </Button>
        </div>

        {/* Verification Badge */}
        <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-green-700">
              {language === "te" ? "ధృవీకరించబడిన సర్టిఫికెట్" : "Verified Certificate"}
            </p>
            <p className="text-xs text-green-600">
              {language === "te" 
                ? `ధృవీకరణ ID: ${certificate.certificate_number}`
                : `Verification ID: ${certificate.certificate_number}`}
            </p>
          </div>
        </div>
      </div>

      {/* Share Dialog for non-native share */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              {language === "te" ? "షేర్ చేయండి" : "Share Certificate"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {language === "te" 
                ? "మీ సాధనను మీ స్నేహితులు మరియు కుటుంబంతో షేర్ చేయండి!"
                : "Share your achievement with friends and family!"}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={shareToWhatsApp} className="bg-green-500 hover:bg-green-600">
                <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
              </Button>
              <Button onClick={shareToTwitter} className="bg-sky-500 hover:bg-sky-600">
                <Twitter className="h-4 w-4 mr-2" /> Twitter
              </Button>
              <Button onClick={shareToFacebook} className="bg-blue-600 hover:bg-blue-700">
                <Facebook className="h-4 w-4 mr-2" /> Facebook
              </Button>
              <Button onClick={shareToLinkedIn} className="bg-blue-700 hover:bg-blue-800">
                <Linkedin className="h-4 w-4 mr-2" /> LinkedIn
              </Button>
            </div>
            
            <Button onClick={copyLink} variant="outline" className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              {language === "te" ? "లింక్ కాపీ చేయండి" : "Copy Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
