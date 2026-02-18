import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Play,
  Pause,
  Square,
  MapPin,
  Clock,
  Flame,
  Footprints,
  Activity,
  Heart,
  Zap,
  ChevronLeft,
  Navigation,
  Target,
  Award,
  Loader2
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Activity icons and colors
const ACTIVITY_ICONS = {
  running: { icon: "🏃", color: "from-orange-500 to-red-500", name: "Running", name_te: "పరుగు" },
  walking: { icon: "🚶", color: "from-green-500 to-emerald-500", name: "Walking", name_te: "నడక" },
  cycling: { icon: "🚴", color: "from-blue-500 to-cyan-500", name: "Cycling", name_te: "సైక్లింగ్" },
  yoga: { icon: "🧘", color: "from-purple-500 to-violet-500", name: "Yoga", name_te: "యోగా" },
  gym: { icon: "🏋️", color: "from-red-500 to-orange-500", name: "Gym", name_te: "జిమ్" },
  swimming: { icon: "🏊", color: "from-cyan-500 to-blue-500", name: "Swimming", name_te: "ఈత" },
  hiking: { icon: "🥾", color: "from-amber-500 to-yellow-500", name: "Hiking", name_te: "హైకింగ్" },
  badminton: { icon: "🏸", color: "from-lime-500 to-green-500", name: "Badminton", name_te: "బ్యాడ్మింటన్" },
  cricket: { icon: "🏏", color: "from-blue-600 to-indigo-500", name: "Cricket", name_te: "క్రికెట్" },
  football: { icon: "⚽", color: "from-green-600 to-teal-500", name: "Football", name_te: "ఫుట్‌బాల్" },
  tennis: { icon: "🎾", color: "from-yellow-500 to-lime-500", name: "Tennis", name_te: "టెన్నిస్" },
  dancing: { icon: "💃", color: "from-pink-500 to-rose-500", name: "Dancing", name_te: "నృత్యం" },
  hiit: { icon: "⚡", color: "from-red-600 to-orange-500", name: "HIIT", name_te: "HIIT" },
  skipping: { icon: "⏫", color: "from-violet-500 to-purple-500", name: "Skipping", name_te: "తాడు దూకడం" },
  meditation: { icon: "🧠", color: "from-indigo-500 to-blue-500", name: "Meditation", name_te: "ధ్యానం" }
};

export default function LiveActivity() {
  const { activityType } = useParams();
  const { language } = useLanguage();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [sessionId, setSessionId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [steps, setSteps] = useState(0);
  const [pace, setPace] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [gpsPoints, setGpsPoints] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const timerRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };
  const activity = ACTIVITY_ICONS[activityType] || ACTIVITY_ICONS.walking;

  // Format time display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate distance between two GPS points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Return in meters
  };

  // Start GPS tracking
  const startGPSTracking = () => {
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPoint = { lat: latitude, lng: longitude, timestamp: new Date().toISOString() };
          
          setCurrentPosition(newPoint);
          
          // Calculate distance from last point
          if (lastPositionRef.current) {
            const dist = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              latitude,
              longitude
            );
            
            // Only add if moved more than 5 meters (filter GPS noise)
            if (dist > 5) {
              setDistance(prev => prev + dist);
              setGpsPoints(prev => [...prev, newPoint]);
              lastPositionRef.current = newPoint;
              
              // Calculate pace (min/km)
              if (elapsedSeconds > 0) {
                const kmTraveled = (distance + dist) / 1000;
                const minElapsed = elapsedSeconds / 60;
                if (kmTraveled > 0) {
                  setPace(minElapsed / kmTraveled);
                }
              }
            }
          } else {
            lastPositionRef.current = newPoint;
            setGpsPoints([newPoint]);
          }
        },
        (error) => {
          console.error("GPS error:", error);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
  };

  // Stop GPS tracking
  const stopGPSTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Start activity
  const startActivity = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/fitness/live/start`, {
        activity_type: activityType
      }, { headers });
      
      setSessionId(response.data.session.id);
      setIsRunning(true);
      setIsPaused(false);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const newTime = prev + 1;
          // Calculate calories based on MET and time
          const weight = user?.health_profile?.weight_kg || 70;
          const met = response.data.session.met_value || 5;
          const hours = newTime / 3600;
          setCalories(Math.round(met * weight * hours));
          
          // Estimate steps for walking/running
          if (['walking', 'running', 'hiking'].includes(activityType)) {
            const stepsPerMin = activityType === 'running' ? 160 : 100;
            setSteps(Math.round((newTime / 60) * stepsPerMin));
          }
          
          return newTime;
        });
      }, 1000);
      
      // Start GPS for applicable activities
      if (['running', 'walking', 'cycling', 'hiking', 'football'].includes(activityType)) {
        startGPSTracking();
      }
      
      toast.success(language === "te" ? "యాక్టివిటీ ప్రారంభమైంది!" : "Activity started!");
    } catch (error) {
      toast.error("Failed to start activity");
    } finally {
      setLoading(false);
    }
  };

  // Pause activity
  const pauseActivity = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopGPSTracking();
    setIsPaused(true);
  };

  // Resume activity
  const resumeActivity = () => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const newTime = prev + 1;
        const weight = user?.health_profile?.weight_kg || 70;
        const met = 5;
        const hours = newTime / 3600;
        setCalories(Math.round(met * weight * hours));
        return newTime;
      });
    }, 1000);
    
    if (['running', 'walking', 'cycling', 'hiking', 'football'].includes(activityType)) {
      startGPSTracking();
    }
    
    setIsPaused(false);
  };

  // Stop and save activity
  const stopActivity = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopGPSTracking();
    
    setLoading(true);
    try {
      await axios.post(`${API}/fitness/live/end`, {
        session_id: sessionId,
        total_duration_seconds: elapsedSeconds,
        total_distance_meters: distance,
        total_calories: calories,
        total_steps: steps,
        avg_pace_min_per_km: pace,
        gps_points: gpsPoints
      }, { headers });
      
      toast.success(language === "te" ? "యాక్టివిటీ సేవ్ అయింది!" : "Activity saved!");
      navigate("/fitness");
    } catch (error) {
      toast.error("Failed to save activity");
    } finally {
      setLoading(false);
    }
  };

  // Discard activity
  const discardActivity = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopGPSTracking();
    
    if (sessionId) {
      await axios.delete(`${API}/fitness/live/${sessionId}`, { headers }).catch(() => {});
    }
    
    navigate("/fitness");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopGPSTracking();
    };
  }, []);

  // Simulate heart rate (in real app, get from smartwatch)
  useEffect(() => {
    if (isRunning && !isPaused) {
      const baseHR = activityType === 'meditation' ? 60 : activityType === 'yoga' ? 70 : 80;
      const maxHR = activityType === 'running' ? 160 : activityType === 'hiit' ? 170 : 140;
      const progress = Math.min(elapsedSeconds / 600, 1); // Ramp up over 10 mins
      setHeartRate(Math.round(baseHR + (maxHR - baseHR) * progress + Math.random() * 10));
    }
  }, [elapsedSeconds, isRunning, isPaused, activityType]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${activity.color}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={discardActivity} className="flex items-center gap-1">
          <ChevronLeft className="h-6 w-6" />
          <span className="text-sm">{language === "te" ? "వెనక్కి" : "Back"}</span>
        </button>
        <div className="text-center">
          <span className="text-3xl">{activity.icon}</span>
          <p className="text-sm font-medium mt-1">
            {language === "te" ? activity.name_te : activity.name}
          </p>
        </div>
        <div className="w-16" />
      </div>

      {/* Main Display */}
      <div className="flex flex-col items-center justify-center px-4 py-8">
        {/* Timer */}
        <div className="text-center mb-8">
          <p className="text-white/70 text-sm mb-2">
            {language === "te" ? "సమయం" : "Duration"}
          </p>
          <p className="text-7xl font-bold text-white font-mono tracking-wider">
            {formatTime(elapsedSeconds)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          {/* Distance */}
          {['running', 'walking', 'cycling', 'hiking', 'swimming'].includes(activityType) && (
            <Card className="bg-white/20 backdrop-blur-sm border-0">
              <CardContent className="p-4 text-center text-white">
                <MapPin className="h-5 w-5 mx-auto mb-1 opacity-70" />
                <p className="text-2xl font-bold">{(distance / 1000).toFixed(2)}</p>
                <p className="text-xs opacity-70">km</p>
              </CardContent>
            </Card>
          )}

          {/* Calories */}
          <Card className="bg-white/20 backdrop-blur-sm border-0">
            <CardContent className="p-4 text-center text-white">
              <Flame className="h-5 w-5 mx-auto mb-1 opacity-70" />
              <p className="text-2xl font-bold">{calories}</p>
              <p className="text-xs opacity-70">kcal</p>
            </CardContent>
          </Card>

          {/* Steps */}
          {['running', 'walking', 'hiking'].includes(activityType) && (
            <Card className="bg-white/20 backdrop-blur-sm border-0">
              <CardContent className="p-4 text-center text-white">
                <Footprints className="h-5 w-5 mx-auto mb-1 opacity-70" />
                <p className="text-2xl font-bold">{steps}</p>
                <p className="text-xs opacity-70">{language === "te" ? "అడుగులు" : "steps"}</p>
              </CardContent>
            </Card>
          )}

          {/* Pace */}
          {['running', 'walking', 'cycling'].includes(activityType) && pace > 0 && (
            <Card className="bg-white/20 backdrop-blur-sm border-0">
              <CardContent className="p-4 text-center text-white">
                <Zap className="h-5 w-5 mx-auto mb-1 opacity-70" />
                <p className="text-2xl font-bold">{pace.toFixed(1)}</p>
                <p className="text-xs opacity-70">min/km</p>
              </CardContent>
            </Card>
          )}

          {/* Heart Rate */}
          {heartRate > 0 && (
            <Card className="bg-white/20 backdrop-blur-sm border-0">
              <CardContent className="p-4 text-center text-white">
                <Heart className="h-5 w-5 mx-auto mb-1 opacity-70 animate-pulse" />
                <p className="text-2xl font-bold">{heartRate}</p>
                <p className="text-xs opacity-70">bpm</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* GPS Status */}
        {currentPosition && (
          <div className="flex items-center gap-2 text-white/70 text-xs mb-6">
            <Navigation className="h-4 w-4 animate-pulse" />
            <span>{language === "te" ? "GPS ట్రాకింగ్ యాక్టివ్" : "GPS tracking active"}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          {!isRunning ? (
            <button
              onClick={startActivity}
              disabled={loading}
              className="h-24 w-24 rounded-full bg-white text-green-600 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            >
              {loading ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : (
                <Play className="h-10 w-10 ml-1" />
              )}
            </button>
          ) : (
            <>
              {/* Pause/Resume */}
              <button
                onClick={isPaused ? resumeActivity : pauseActivity}
                className="h-16 w-16 rounded-full bg-white/90 text-gray-800 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                {isPaused ? <Play className="h-7 w-7 ml-0.5" /> : <Pause className="h-7 w-7" />}
              </button>

              {/* Stop */}
              <button
                onClick={stopActivity}
                disabled={loading}
                className="h-24 w-24 rounded-full bg-white text-red-500 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              >
                {loading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <Square className="h-10 w-10" />
                )}
              </button>

              {/* Discard */}
              <button
                onClick={discardActivity}
                className="h-16 w-16 rounded-full bg-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <span className="text-2xl">✕</span>
              </button>
            </>
          )}
        </div>

        {/* Status Text */}
        <p className="text-white/70 text-sm mt-6">
          {!isRunning 
            ? (language === "te" ? "ప్రారంభించడానికి నొక్కండి" : "Tap to start")
            : isPaused 
              ? (language === "te" ? "పాజ్ చేయబడింది" : "Paused")
              : (language === "te" ? "రికార్డింగ్..." : "Recording...")
          }
        </p>
      </div>
    </div>
  );
}
