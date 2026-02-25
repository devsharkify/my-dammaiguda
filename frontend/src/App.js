import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppConfigProvider } from "./context/AppConfigContext";
import { OfflineBanner } from "./components/OfflineBanner";
import { useServiceWorker } from "./hooks/useOffline";
import { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import initSecurityShield from "./utils/securityShield";
import SplashScreen from "./components/SplashScreen";
import { PageSkeleton } from "./components/Skeletons";
import usePreventZoom from "./hooks/usePreventZoom";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import IssueFeed from "./pages/IssueFeed";
import ReportIssue from "./pages/ReportIssue";
import DumpYardInfo from "./pages/DumpYardInfo";
import KaizerFit from "./pages/KaizerFit";
import KaizerDoctor from "./pages/KaizerDoctor";
import AIChat from "./pages/AIChat";
import CitizenBenefits from "./pages/CitizenBenefits";
import Expenditure from "./pages/Expenditure";
import Polls from "./pages/Polls";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import MyFamily from "./pages/MyFamily";
import AQIReport from "./pages/AQIReport";
import NewsShorts from "./pages/NewsShorts";
import CitizenWall from "./pages/CitizenWall";
import LiveActivity from "./pages/LiveActivity";
import AITEducation from "./pages/AITEducation";
import CourseDetail from "./pages/CourseDetail";
import Certificate from "./pages/Certificate";
import GiftShop from "./pages/GiftShop";
import DeviceSync from "./pages/DeviceSync";
import Helpline from "./pages/Helpline";
import StatusTemplates from "./pages/StatusTemplates";
import NewsPage from "./pages/NewsPage";
import InstructorPortal from "./pages/InstructorPortal";
import Leaderboard from "./pages/Leaderboard";
import LiveChat from "./pages/LiveChat";
import AdminConsole from "./pages/AdminConsole";
import Astrology from "./pages/Astrology";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShareHandler from "./pages/ShareHandler";
import DeleteAccount from "./pages/DeleteAccount";
import TermsOfService from "./pages/TermsOfService";
import ChildSafety from "./pages/ChildSafety";
import CloneMaker from "./pages/CloneMaker";
import AdminPanel from "./pages/AdminPanel";
import ManagerApp from "./pages/ManagerApp";
import PortalSelector from "./pages/PortalSelector";
import MuhurtamCalculator from "./pages/MuhurtamCalculator";
import ClaimBenefits from "./pages/ClaimBenefits";
import SafetyStandards from "./pages/SafetyStandards";

import "./App.css";

// Native-like page transition variants
const pageVariants = {
  initial: { 
    opacity: 0, 
    x: 20,
    scale: 0.98
  },
  in: { 
    opacity: 1, 
    x: 0,
    scale: 1
  },
  out: { 
    opacity: 0, 
    x: -20,
    scale: 0.98
  }
};

const pageTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8
};

// Animated page wrapper
function AnimatedPage({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
      <Route path="/issues" element={<IssueFeed />} />
      <Route path="/dumpyard" element={<DumpYardInfo />} />
      <Route path="/expenditure" element={<Expenditure />} />
      <Route path="/polls" element={<Polls />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/report" element={
        <ProtectedRoute>
          <ReportIssue />
        </ProtectedRoute>
      } />
      <Route path="/fitness" element={
        <ProtectedRoute>
          <KaizerFit />
        </ProtectedRoute>
      } />
      <Route path="/doctor" element={
        <ProtectedRoute>
          <KaizerDoctor />
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <AIChat />
        </ProtectedRoute>
      } />
      <Route path="/benefits" element={<CitizenBenefits />} />
      <Route path="/claim-benefits" element={
        <ProtectedRoute>
          <ClaimBenefits />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/family" element={
        <ProtectedRoute>
          <MyFamily />
        </ProtectedRoute>
      } />
      <Route path="/aqi" element={<AQIReport />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/wall" element={
        <ProtectedRoute>
          <CitizenWall />
        </ProtectedRoute>
      } />
      <Route path="/live-activity/:activityType" element={
        <ProtectedRoute>
          <LiveActivity />
        </ProtectedRoute>
      } />
      
      {/* AIT Education Routes */}
      <Route path="/education" element={<AITEducation />} />
      <Route path="/education/course/:courseId" element={
        <ProtectedRoute>
          <CourseDetail />
        </ProtectedRoute>
      } />
      <Route path="/education/certificate/:certificateId" element={<Certificate />} />
      
      {/* Gift Shop Route */}
      <Route path="/shop" element={
        <ProtectedRoute>
          <GiftShop />
        </ProtectedRoute>
      } />
      
      {/* Device Sync Route */}
      <Route path="/devices" element={
        <ProtectedRoute>
          <DeviceSync />
        </ProtectedRoute>
      } />
      
      {/* Helpline Route */}
      <Route path="/helpline" element={<Helpline />} />
      
      {/* Status Templates Route */}
      <Route path="/status-templates" element={<StatusTemplates />} />
      
      {/* Astrology Route */}
      <Route path="/astrology" element={
        <ProtectedRoute>
          <Astrology />
        </ProtectedRoute>
      } />
      
      {/* Muhurtam Calculator */}
      <Route path="/muhurtam" element={
        <ProtectedRoute>
          <MuhurtamCalculator />
        </ProtectedRoute>
      } />
      
      {/* Instructor Portal */}
      <Route path="/instructor" element={
        <ProtectedRoute roles={["admin", "instructor"]}>
          <InstructorPortal />
        </ProtectedRoute>
      } />
      
      {/* Leaderboard */}
      <Route path="/leaderboard" element={<Leaderboard />} />
      
      {/* Live Chat Routes */}
      <Route path="/live-chat" element={
        <ProtectedRoute>
          <LiveChat />
        </ProtectedRoute>
      } />
      <Route path="/live-chat/:roomId" element={
        <ProtectedRoute>
          <LiveChat />
        </ProtectedRoute>
      } />
      
      {/* Volunteer Routes */}
      <Route path="/volunteer" element={
        <ProtectedRoute roles={["volunteer", "admin"]}>
          <VolunteerDashboard />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminConsole />} />
      <Route path="/admin-dashboard" element={
        <ProtectedRoute roles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/clone" element={
        <ProtectedRoute roles={["admin"]}>
          <CloneMaker />
        </ProtectedRoute>
      } />
      <Route path="/admin/panel" element={
        <ProtectedRoute roles={["admin"]}>
          <AdminPanel />
        </ProtectedRoute>
      } />
      
      {/* Staff Portal Selector */}
      <Route path="/portals" element={<PortalSelector />} />
      
      {/* Manager App - Separate Login */}
      <Route path="/manager" element={<ManagerApp />} />
      <Route path="/manager/*" element={<ManagerApp />} />
      
      {/* Public Routes */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/child-safety" element={<ChildSafety />} />
      <Route path="/safety-standards" element={<SafetyStandards />} />
      <Route path="/share" element={<ShareHandler />} />
      <Route path="/delete-account" element={<DeleteAccount />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Animated Routes Wrapper
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen"
      >
        <Suspense fallback={<PageSkeleton />}>
          <AppRoutes />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  
  // Register service worker for PWA
  useServiceWorker();
  
  // Initialize security shield
  useEffect(() => {
    initSecurityShield();
    
    // Preload critical resources
    const preloadApp = async () => {
      // Give splash screen minimum display time
      await new Promise(resolve => setTimeout(resolve, 100));
      setAppReady(true);
    };
    
    preloadApp();
  }, []);
  
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);
  
  // Show splash screen on first load only (session-based)
  useEffect(() => {
    if (sessionStorage.getItem('splashShown')) {
      setShowSplash(false);
    } else {
      sessionStorage.setItem('splashShown', 'true');
    }
  }, []);
  
  return (
    <BrowserRouter>
      <AppConfigProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {showSplash && appReady && (
                <SplashScreen onComplete={handleSplashComplete} />
              )}
              <OfflineBanner />
              <AnimatedRoutes />
              <Toaster position="top-center" richColors />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AppConfigProvider>
    </BrowserRouter>
  );
}

export default App;
