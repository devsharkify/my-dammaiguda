/**
 * FitnessComingSoon - Temporary page while Kaizer Fit is being prepared
 * Launch Date: April 7, 2025 - World Health Day
 */

import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "../components/ui/button";
import { Heart, Activity, Star, Sparkles, ArrowLeft, Calendar } from "lucide-react";
import Layout from "../components/Layout";

export default function FitnessComingSoon() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <Layout showBackButton>
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        {/* Animated Heart */}
        <div className="relative mb-8">
          <div className="absolute inset-0 w-32 h-32 bg-teal-500/20 rounded-full animate-ping"></div>
          <div className="absolute inset-0 w-32 h-32 bg-teal-500/10 rounded-full animate-pulse"></div>
          <div className="relative w-32 h-32 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
            <Heart className="h-16 w-16 text-white animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-2 font-heading bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
          {language === "te" ? "కైజర్ ఫిట్" : "Kaizer Fit"}
        </h1>
        
        <p className="text-lg text-muted-foreground mb-6">
          {language === "te" ? "త్వరలో వస్తుంది" : "Coming Soon"}
        </p>

        {/* Launch Date Card */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl p-6 mb-8 text-center max-w-xs w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-rose-500" />
            <span className="text-xl font-bold text-rose-600">
              {language === "te" ? "ఏప్రిల్ 7, 2025" : "April 7, 2025"}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Sparkles className="h-4 w-4 text-rose-400" />
            <span className="text-sm text-rose-500 font-medium">
              {language === "te" ? "ప్రపంచ ఆరోగ్య దినం" : "World Health Day"}
            </span>
            <Sparkles className="h-4 w-4 text-rose-400" />
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-xs w-full">
          <div className="flex flex-col items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <Activity className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-xs font-semibold text-blue-700 text-center">
              {language === "te" ? "స్టెప్ ట్రాకింగ్" : "Step Tracking"}
            </span>
          </div>
          <div className="flex flex-col items-center p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <Heart className="h-8 w-8 text-orange-500 mb-2" />
            <span className="text-xs font-semibold text-orange-700 text-center">
              {language === "te" ? "కేలరీ కౌంట్" : "Calorie Count"}
            </span>
          </div>
          <div className="flex flex-col items-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <Star className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-xs font-semibold text-purple-700 text-center">
              {language === "te" ? "బ్యాడ్జెస్" : "Badges"}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-center text-muted-foreground mb-8 max-w-xs">
          {language === "te" 
            ? "మీ ఆరోగ్యాన్ని ట్రాక్ చేయండి, లక్ష్యాలను సాధించండి, బహుమతులు గెలుచుకోండి! కైజర్ ఫిట్‌తో ఆరోగ్యకరమైన జీవితాన్ని ప్రారంభించండి."
            : "Track your health, achieve goals, win rewards! Start a healthier life with Kaizer Fit."}
        </p>

        {/* Back Button */}
        <Button 
          onClick={() => navigate("/dashboard")}
          className="h-12 px-8 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full font-semibold shadow-lg hover:from-teal-600 hover:to-emerald-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "te" ? "డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళండి" : "Back to Dashboard"}
        </Button>
      </div>
    </Layout>
  );
}
