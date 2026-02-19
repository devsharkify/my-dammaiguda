import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "../components/ui/button";
import { 
  AlertTriangle, 
  FileText, 
  Heart, 
  Activity, 
  Users, 
  BarChart3,
  Globe,
  ArrowRight,
  Shield,
  MapPin
} from "lucide-react";

export default function LandingPage() {
  const { t, language, toggleLanguage } = useLanguage();

  const features = [
    {
      icon: <AlertTriangle className="h-8 w-8" />,
      title: language === "te" ? "సమస్యలు తెలియజేయండి" : "Report Issues",
      description: language === "te" 
        ? "చెత్త, రోడ్లు, డ్రైనేజీ సమస్యలను ఫోటోతో పంపండి"
        : "Report garbage, roads, drainage issues with photos",
      color: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: language === "te" ? "డంప్ యార్డ్ వివరాలు" : "Dump Yard Info",
      description: language === "te"
        ? "కాలుష్యం, ఆరోగ్య ప్రమాదాల సమాచారం తెలుసుకోండి"
        : "Learn about pollution zones and health risks",
      color: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
    },
    {
      icon: <Activity className="h-8 w-8" />,
      title: language === "te" ? "ఆరోగ్యం & ఫిట్‌నెస్" : "Kaizer Fit",
      description: language === "te"
        ? "నడక, పరుగు ట్రాక్ చేయండి, బ్యాడ్జిలు గెలవండి"
        : "Track walks, runs and win badges",
      color: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: language === "te" ? "ప్రభుత్వ సహాయాలు" : "Citizen Benefits",
      description: language === "te"
        ? "ఉచిత వైద్య పరీక్షలు, విద్య వౌచర్లు, బీమా"
        : "Free health checkups, education vouchers & insurance",
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: language === "te" ? "ఖర్చుల వివరాలు" : "Expenditure Details",
      description: language === "te"
        ? "వార్డు ఖర్చులు, RTI పత్రాలు చూడండి"
        : "View ward expenditure and RTI documents",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: language === "te" ? "పోల్స్ & అభిప్రాయాలు" : "Polls & Opinions",
      description: language === "te"
        ? "మీ అభిప్రాయం చెప్పండి, నిర్ణయాలలో పాల్గొనండి"
        : "Share opinion, participate in decisions",
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
    }
  ];

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md border-b border-border/50 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-primary">
              {t("appName")}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-muted-foreground dark:text-gray-400"
              data-testid="language-toggle"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">
                {language === "te" ? "EN" : "తె"}
              </span>
            </Button>
            
            <Link to="/auth">
              <Button 
                className="bg-primary text-white hover:bg-primary/90 rounded-full px-6 h-10"
                data-testid="login-btn"
              >
                {language === "te" ? "లాగిన్" : "Login"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:to-purple-900/20"
        />
        
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary dark:text-white tracking-tight leading-tight">
              {language === "te" ? (
                <>
                  <span className="text-primary">దమ్మాయిగూడ</span>
                  <br />
                  మీ వార్డు, మీ చేతుల్లో
                </>
              ) : (
                <>
                  Civic Engagement for
                  <br />
                  <span className="text-primary">Dammaiguda</span>
                </>
              )}
            </h1>
            
            <p className="mt-6 text-lg text-text-secondary dark:text-gray-300 leading-relaxed font-body">
              {language === "te"
                ? "సమస్యలు తెలియజేయండి, ప్రభుత్వ సహాయాలు పొందండి, ఆరోగ్యం ట్రాక్ చేయండి - అంతా ఒకే చోట!"
                : "Report issues, access benefits, track health - all in one place!"}
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button 
                  size="lg"
                  className="bg-primary text-white hover:bg-primary/90 h-14 rounded-full px-10 text-lg font-medium shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                  data-testid="get-started-btn"
                >
                  {language === "te" ? "ప్రారంభించు" : "Get Started"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link to="/issues">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary text-primary hover:bg-primary/10 h-14 rounded-full px-10 text-lg font-medium dark:text-primary dark:border-primary"
                  data-testid="view-issues-btn"
                >
                  {language === "te" ? "సమస్యలు చూడండి" : "View Issues"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-background-subtle dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-heading text-3xl font-semibold text-center text-text-primary dark:text-white mb-12">
            {language === "te" ? "మీరు ఏమి చేయవచ్చు" : "What You Can Do"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl border border-border/50 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30"
                data-testid={`feature-card-${index}`}
              >
                <div className={`h-14 w-14 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold text-text-primary dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-muted dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              to="/dumpyard" 
              className="bg-red-500 text-white rounded-xl p-6 text-center hover:bg-red-600 transition-colors shadow-lg"
              data-testid="quick-link-dumpyard"
            >
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <span className="font-medium">
                {language === "te" ? "డంప్ యార్డ్" : "Dump Yard"}
              </span>
            </Link>
            
            <Link 
              to="/expenditure"
              className="bg-blue-500 text-white rounded-xl p-6 text-center hover:bg-blue-600 transition-colors shadow-lg"
              data-testid="quick-link-expenditure"
            >
              <BarChart3 className="h-8 w-8 mx-auto mb-2" />
              <span className="font-medium">
                {language === "te" ? "ఖర్చులు" : "Expenditure"}
              </span>
            </Link>
            
            <Link 
              to="/polls"
              className="bg-purple-500 text-white rounded-xl p-6 text-center hover:bg-purple-600 transition-colors shadow-lg"
              data-testid="quick-link-polls"
            >
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <span className="font-medium">
                {language === "te" ? "పోల్స్" : "Polls"}
              </span>
            </Link>
            
            <Link 
              to="/issues"
              className="bg-orange-500 text-white rounded-xl p-6 text-center hover:bg-orange-600 transition-colors shadow-lg"
              data-testid="quick-link-issues"
            >
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <span className="font-medium">
                {language === "te" ? "సమస్యలు" : "Issues"}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6" />
            <span className="font-heading font-bold text-lg">{t("appName")}</span>
          </div>
          <p className="text-gray-400 text-sm">
            {language === "te" 
              ? "దమ్మాయిగూడ వార్డు - పౌర సేవల వేదిక"
              : "Civic Engagement Platform for Dammaiguda Ward"}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © 2024 My Dammaiguda. {language === "te" ? "అన్ని హక్కులు భద్రం" : "All rights reserved."}
          </p>
        </div>
      </footer>
    </div>
  );
}
