import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Award,
  Download,
  Share2,
  Loader2,
  CheckCircle
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Certificate() {
  const { certificateId } = useParams();
  const { language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);

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

  const shareCertificate = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AIT Education Certificate - ${certificate.course_title}`,
          text: `I completed ${certificate.course_title} on AIT Education!`,
          url: shareUrl
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success(language === "te" ? "లింక్ కాపీ చేయబడింది" : "Link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "సర్టిఫికెట్" : "Certificate"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!certificate) {
    return (
      <Layout showBackButton title={language === "te" ? "సర్టిఫికెట్" : "Certificate"}>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Certificate not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "సర్టిఫికెట్" : "Certificate"}>
      <div className="space-y-4 pb-20" data-testid="certificate-view">
        
        {/* Certificate Card */}
        <div className="relative bg-gradient-to-br from-amber-50 via-white to-amber-50 border-4 border-amber-200 rounded-xl p-6 shadow-xl">
          {/* Decorative corners */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl"></div>
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr"></div>
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl"></div>
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br"></div>
          
          <div className="text-center space-y-4">
            {/* Header */}
            <div className="flex items-center justify-center gap-2">
              <Award className="h-8 w-8 text-amber-600" />
              <h1 className="text-2xl font-bold text-amber-800 font-serif">
                AIT Education
              </h1>
            </div>
            
            <p className="text-amber-600 text-sm uppercase tracking-widest">
              {language === "te" ? "పూర్తి చేసిన సర్టిఫికెట్" : "Certificate of Completion"}
            </p>
            
            {/* Divider */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-amber-300"></div>
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div className="h-px w-16 bg-amber-300"></div>
            </div>
            
            {/* Body */}
            <div className="py-4">
              <p className="text-gray-600 text-sm">
                {language === "te" ? "ఈ ద్వారా ధృవీకరించబడింది" : "This is to certify that"}
              </p>
              <h2 className="text-3xl font-bold text-gray-800 my-3 font-serif">
                {certificate.user_name}
              </h2>
              <p className="text-gray-600 text-sm">
                {language === "te" ? "విజయవంతంగా పూర్తి చేసారు" : "has successfully completed"}
              </p>
              <h3 className="text-xl font-semibold text-primary mt-2">
                {certificate.course_title}
              </h3>
            </div>
            
            {/* Footer */}
            <div className="pt-4 border-t border-amber-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div>
                  <p className="font-medium text-gray-700">{certificate.instructor_name}</p>
                  <p>{language === "te" ? "బోధకుడు" : "Instructor"}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-amber-700">{certificate.certificate_number}</p>
                  <p>{new Date(certificate.issued_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={shareCertificate}>
            <Share2 className="h-4 w-4 mr-2" />
            {language === "te" ? "షేర్ చేయి" : "Share"}
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            {language === "te" ? "డౌన్‌లోడ్" : "Download"}
          </Button>
        </div>

        {/* Verification Info */}
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-green-700 font-medium">
            {language === "te" ? "ధృవీకరించబడిన సర్టిఫికెట్" : "Verified Certificate"}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {language === "te" 
              ? "ఈ సర్టిఫికెట్ AIT Education ద్వారా జారీ చేయబడింది"
              : "This certificate was issued by AIT Education"}
          </p>
        </div>
      </div>
    </Layout>
  );
}
