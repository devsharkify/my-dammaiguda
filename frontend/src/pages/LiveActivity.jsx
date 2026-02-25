import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import {
  Play,
  Pause,
  Square,
  MapPin,
  Clock,
  Flame,
  Footprints,
  Activity,
  Navigation,
  Loader2,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const GOOGLE_MAPS_API_KEY = "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // Will use env var

// Activity configs
const ACTIVITY_CONFIG = {
  running: { icon: "🏃", color: "from-orange-500 to-red-500", name: "Running", name_te: "పరుగు", tracksGPS: true },
  walking: { icon: "🚶", color: "from-green-500 to-emerald-500", name: "Walking", name_te: "నడక", tracksGPS: true },
  cycling: { icon: "🚴", color: "from-blue-500 to-cyan-500", name: "Cycling", name_te: "సైక్లింగ్", tracksGPS: true },
  yoga: { icon: "🧘", color: "from-purple-500 to-violet-500", name: "Yoga", name_te: "యోగా", tracksGPS: false },
  gym: { icon: "🏋️", color: "from-red-500 to-orange-500", name: "Gym", name_te: "జిమ్", tracksGPS: false },
  swimming: { icon: "🏊", color: "from-cyan-500 to-blue-500", name: "Swimming", name_te: "ఈత", tracksGPS: false },
  hiking: { icon: "🥾", color: "from-amber-500 to-yellow-500", name: "Hiking", name_te: "హైకింగ్", tracksGPS: true },
  football: { icon: "⚽", color: "from-green-600 to-teal-500", name: "Football", name_te: "ఫుట్‌బాల్", tracksGPS: true },
  dancing: { icon: "💃", color: "from-pink-500 to-rose-500", name: "Dancing", name_te: "నృత్యం", tracksGPS: false },
};

// Route polyline component
function RoutePolyline({ path, color = "#3B82F6" }) {
  const map = useMap();
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || path.length < 2) return;

    // Create or update polyline
    if (polylineRef.current) {
      polylineRef.current.setPath(path);
    } else {
      polylineRef.current = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: map,
      });
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, path, color]);

  return null;
}

export default function LiveActivity() {
  const { activityType } = useParams();
  const { language } = useLanguage();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const config = ACTIVITY_CONFIG[activityType] || ACTIVITY_CONFIG.running;
  
  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Stats
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [steps, setSteps] = useState(0);
  const [pace, setPace] = useState(0);
  const [speed, setSpeed] = useState(0); // km/h
  
  // GPS
  const [currentPosition, setCurrentPosition] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [gpsStatus, setGpsStatus] = useState("waiting"); // waiting, active, error
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 17.4875, lng: 78.3953 }); // Dammaiguda default
  
  // Refs
  const timerRef = useRef(null);
  const gpsWatchRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastTickRef = useRef(null); // Track last tick time for accurate timing
  
  const headers = { Authorization: `Bearer ${token}` };

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate calories based on activity and time
  const calculateCalories = useCallback((seconds) => {
    const MET = { running: 9.8, walking: 3.5, cycling: 7.5, hiking: 6.0, football: 7.0, yoga: 2.5, gym: 6.0, swimming: 8.0, dancing: 5.0 };
    const weight = user?.health_profile?.weight_kg || 70;
    const hours = seconds / 3600;
    return Math.round((MET[activityType] || 5) * weight * hours);
  }, [activityType, user]);

  // Start GPS tracking
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newPos = { lat: latitude, lng: longitude };
        
        setCurrentPosition(newPos);
        setMapCenter(newPos);
        setGpsAccuracy(accuracy);
        setGpsStatus("active");

        // Calculate distance if we have a previous position and activity is running
        if (lastPositionRef.current && isRunning && !isPaused) {
          const dist = calculateDistance(
            lastPositionRef.current.lat, lastPositionRef.current.lng,
            latitude, longitude
          );
          
          // Only add if moved more than 3m and accuracy is good (filter GPS noise)
          if (dist > 3 && accuracy < 50) {
            setDistance(prev => {
              const newDistance = prev + dist;
              
              // Calculate steps based on ACTUAL distance (not time)
              // Average stride: ~0.75m for walking, ~1.0m for running
              if (["running", "walking", "hiking"].includes(activityType)) {
                const strideLength = activityType === "running" ? 1.0 : 0.75;
                const newSteps = Math.round(newDistance / strideLength);
                setSteps(newSteps);
              }
              
              // Calculate calories based on actual distance + time
              const weight = user?.health_profile?.weight_kg || 70;
              const distKm = newDistance / 1000;
              const MET = { running: 9.8, walking: 3.5, cycling: 7.5, hiking: 6.0, football: 7.0, yoga: 2.5, gym: 6.0, swimming: 8.0, dancing: 5.0 };
              // More accurate: calories = distance(km) * weight(kg) * factor
              const caloriesFactor = activityType === "running" ? 1.0 : 0.5;
              const newCalories = Math.round(distKm * weight * caloriesFactor);
              setCalories(newCalories);
              
              return newDistance;
            });
            setRoutePath(prev => [...prev, newPos]);
            
            // Calculate pace (min/km) and speed (km/h)
            if (elapsedSeconds > 0 && distance > 0) {
              const km = (distance + dist) / 1000;
              const mins = elapsedSeconds / 60;
              const hours = elapsedSeconds / 3600;
              setPace(Math.round((mins / km) * 10) / 10);
              setSpeed(Math.round((km / hours) * 10) / 10);
            }
          }
        }
        
        lastPositionRef.current = newPos;
      },
      (error) => {
        console.error("GPS Error:", error);
        setGpsStatus("error");
      },
      options
    );
  }, [isRunning, isPaused, elapsedSeconds, distance, activityType, user]);

  // Start activity
  const startActivity = async () => {
    try {
      const res = await axios.post(`${API}/fitness/live/start`, { activity_type: activityType }, { headers });
      const session = res.data.session;
      if (!session?.id) {
        toast.error(language === "te" ? "సెషన్ ప్రారంభించడం విఫలమైంది" : "Failed to start session");
        return;
      }
      setSessionId(session.id);
      setIsRunning(true);
      setIsPaused(false);
      
      // Clear any existing timer first
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Initialize timer with proper timestamp tracking
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.round((now - lastTickRef.current) / 1000);
        lastTickRef.current = now;
        
        setElapsedSeconds(prev => {
          const newSec = prev + 1; // Always increment by 1 for consistent timing
          
          // For non-GPS activities (yoga, gym, etc.), calculate calories based on time
          // GPS activities calculate calories based on actual distance moved
          if (!config.tracksGPS) {
            const weight = user?.health_profile?.weight_kg || 70;
            const MET = { yoga: 2.5, gym: 6.0, swimming: 8.0, dancing: 5.0 };
            const hours = newSec / 3600;
            const newCalories = Math.round((MET[activityType] || 4) * weight * hours);
            setCalories(newCalories);
          }
          
          return newSec;
        });
      }, 1000);

      // Start GPS for applicable activities
      if (config.tracksGPS) {
        startGPS();
      }

      toast.success(language === "te" ? "యాక్టివిటీ ప్రారంభమైంది!" : "Activity started!");
    } catch (error) {
      console.error("Start activity error:", error);
      toast.error(language === "te" ? "ప్రారంభించడం విఫలమైంది" : "Failed to start");
    }
  };

  // Pause/Resume
  const togglePause = () => {
    if (isPaused) {
      // Resume - restart timer
      setIsPaused(false);
      
      // Clear any existing timer first to prevent duplicates
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        lastTickRef.current = now;
        
        setElapsedSeconds(prev => {
          const newSec = prev + 1;
          
          // For non-GPS activities, calculate calories based on time
          if (!config.tracksGPS) {
            const weight = user?.health_profile?.weight_kg || 70;
            const MET = { yoga: 2.5, gym: 6.0, swimming: 8.0, dancing: 5.0 };
            const hours = newSec / 3600;
            const newCalories = Math.round((MET[activityType] || 4) * weight * hours);
            setCalories(newCalories);
          }
          
          return newSec;
        });
      }, 1000);
      toast.info(language === "te" ? "కొనసాగించబడింది" : "Resumed");
    } else {
      // Pause - stop timer
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast.info(language === "te" ? "విరామం" : "Paused");
    }
  };

  // Stop activity
  const stopActivity = async () => {
    if (!sessionId) {
      toast.error(language === "te" ? "సెషన్ కనుగొనబడలేదు" : "No active session found");
      return;
    }
    setSaving(true);

    // Stop timer and GPS immediately
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (gpsWatchRef.current) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }

    try {
      const payload = {
        session_id: sessionId,
        total_duration_seconds: elapsedSeconds,
        total_distance_meters: Math.round(distance),
        total_calories: calories,
        total_steps: steps,
        gps_points: routePath.map((p) => ({ 
          lat: p.lat, 
          lng: p.lng, 
          timestamp: new Date().toISOString() 
        }))
      };
      
      console.log("Saving activity:", payload);
      
      await axios.post(`${API}/fitness/live/end`, payload, { headers });

      // Check for new badges
      await axios.post(`${API}/fitness/badges/check`, {}, { headers }).catch(() => {});

      toast.success(language === "te" ? "యాక్టివిటీ సేవ్ అయింది!" : "Activity saved!");
      navigate("/fitness");
    } catch (error) {
      console.error("Save activity error:", error.response?.data || error.message);
      toast.error(
        error.response?.data?.detail || 
        (language === "te" ? "సేవ్ చేయడం విఫలమైంది" : "Failed to save activity")
      );
      // Reset state to allow retry
      setIsRunning(false);
      setIsPaused(false);
    } finally {
      setSaving(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current);
    };
  }, []);

  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format distance
  const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="live-activity-page">
      {/* Header */}
      <div className={`p-4 bg-gradient-to-r ${config.color} text-white`}>
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/fitness")} className="flex items-center gap-1">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">{language === "te" ? "వెనుకకు" : "Back"}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <span className="font-semibold">{language === "te" ? config.name_te : config.name}</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* GPS Status */}
      {config.tracksGPS && (
        <div className="px-4 py-2 bg-muted/50 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Navigation className={`h-4 w-4 ${gpsStatus === "active" ? "text-green-500" : gpsStatus === "error" ? "text-red-500" : "text-muted-foreground"}`} />
            <span className="text-muted-foreground">GPS</span>
          </div>
          {gpsStatus === "active" && gpsAccuracy && (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              ±{Math.round(gpsAccuracy)}m
            </span>
          )}
          {gpsStatus === "error" && (
            <span className="text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {language === "te" ? "లోపం" : "Error"}
            </span>
          )}
          {gpsStatus === "waiting" && (
            <span className="text-muted-foreground">{language === "te" ? "వేచి చూస్తోంది..." : "Waiting..."}</span>
          )}
        </div>
      )}

      {/* Map Section - Show for GPS activities */}
      {config.tracksGPS && (
        <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
          {process.env.REACT_APP_GOOGLE_MAPS_KEY ? (
            <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}>
              <Map
                defaultZoom={16}
                center={mapCenter}
                mapId="live-activity-map"
                disableDefaultUI={true}
                gestureHandling="greedy"
                style={{ width: "100%", height: "100%" }}
              >
                {currentPosition && (
                  <AdvancedMarker position={currentPosition}>
                    <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${config.color} border-2 border-white shadow-lg flex items-center justify-center`}>
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  </AdvancedMarker>
                )}
                <RoutePolyline path={routePath} color="#3B82F6" />
              </Map>
            </APIProvider>
          ) : (
            /* Placeholder map when no API key */
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
              <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center mb-2`}>
                <Navigation className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                {language === "te" ? "GPS ట్రాకింగ్ సక్రియం" : "GPS Tracking Active"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {currentPosition 
                  ? `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}`
                  : (language === "te" ? "స్థానం పొందుతోంది..." : "Getting location...")}
              </p>
              {routePath.length > 0 && (
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {routePath.length} {language === "te" ? "పాయింట్లు" : "points"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {formatDistance(distance)}
                  </Badge>
                </div>
              )}
            </div>
          )}
          
          {/* Overlay stats */}
          {process.env.REACT_APP_GOOGLE_MAPS_KEY && (
            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
              <Badge className="bg-black/70 text-white border-0 text-xs">
                {routePath.length} {language === "te" ? "పాయింట్లు" : "points"}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Timer Display */}
      <div className="p-6 text-center">
        <p className="text-muted-foreground text-sm mb-2">
          {isPaused ? (language === "te" ? "విరామంలో" : "Paused") : (language === "te" ? "సమయం" : "Duration")}
        </p>
        <p className={`text-5xl font-mono font-bold ${isPaused ? "text-yellow-500" : ""}`} data-testid="timer">
          {formatTime(elapsedSeconds)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="px-4 grid grid-cols-2 gap-3 flex-1">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold" data-testid="distance">{formatDistance(distance)}</p>
            <p className="text-xs text-muted-foreground">{language === "te" ? "దూరం" : "Distance"}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-cyan-100 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-cyan-600" />
            </div>
            <p className="text-2xl font-bold" data-testid="speed">{speed > 0 ? speed : "—"}</p>
            <p className="text-xs text-muted-foreground">{language === "te" ? "వేగం km/h" : "Speed km/h"}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
              <Footprints className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold" data-testid="steps">{steps.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{language === "te" ? "అడుగులు" : "Steps"}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-orange-100 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold" data-testid="calories">{calories}</p>
            <p className="text-xs text-muted-foreground">{language === "te" ? "కేలరీలు" : "Calories"}</p>
          </CardContent>
        </Card>

        {/* Pace - only for GPS activities */}
        {config.tracksGPS && (
          <Card className="border-0 shadow-md col-span-2">
            <CardContent className="p-4 text-center">
              <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{pace > 0 ? `${pace}'` : "—"}</p>
              <p className="text-xs text-muted-foreground">{language === "te" ? "పేస్ (నిమిషాలు/km)" : "Pace (min/km)"}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Control Buttons */}
      <div className="p-4 pb-8">
        {!isRunning ? (
          <Button
            onClick={startActivity}
            className={`w-full h-16 text-lg font-semibold bg-gradient-to-r ${config.color} rounded-2xl shadow-lg`}
            data-testid="start-btn"
          >
            <Play className="h-6 w-6 mr-2" />
            {language === "te" ? "ప్రారంభించు" : "Start"}
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={togglePause}
              variant="outline"
              className="flex-1 h-14 text-base rounded-xl border-2"
              data-testid="pause-btn"
            >
              {isPaused ? <Play className="h-5 w-5 mr-2" /> : <Pause className="h-5 w-5 mr-2" />}
              {isPaused ? (language === "te" ? "కొనసాగించు" : "Resume") : (language === "te" ? "విరామం" : "Pause")}
            </Button>
            <Button
              onClick={stopActivity}
              disabled={saving}
              className="flex-1 h-14 text-base rounded-xl bg-red-500 hover:bg-red-600"
              data-testid="stop-btn"
            >
              {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Square className="h-5 w-5 mr-2" />}
              {language === "te" ? "ఆపు" : "Stop"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
