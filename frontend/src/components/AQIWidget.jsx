import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Wind, AlertTriangle, ChevronRight, RefreshCw, Loader2, Clock, Info } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Helper to get today's date key for localStorage
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Helper to check if it's past 8 PM (reset time)
const isPastResetTime = () => {
  const now = new Date();
  return now.getHours() >= 20; // 8 PM = 20:00
};

export default function AQIWidget({ onViewFullReport }) {
  const { language } = useLanguage();
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dailyMaxAqi, setDailyMaxAqi] = useState({ dammaiguda: null, hyderabad: null });

  useEffect(() => {
    // Load stored daily max from localStorage
    const storedData = localStorage.getItem('dailyMaxAqi');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      // Check if it's from today and not past reset time
      if (parsed.date === getTodayKey() && !isPastResetTime()) {
        setDailyMaxAqi(parsed.values);
      } else {
        // Reset for new day or past 8 PM
        localStorage.removeItem('dailyMaxAqi');
      }
    }
    fetchAQI();
  }, []);

  const fetchAQI = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API}/aqi/both`);
      const data = response.data;
      
      // Update daily max values
      const currentMax = { ...dailyMaxAqi };
      const todayKey = getTodayKey();
      
      // Only track max if before 8 PM
      if (!isPastResetTime()) {
        if (data.dammaiguda?.aqi) {
          if (!currentMax.dammaiguda || data.dammaiguda.aqi > currentMax.dammaiguda) {
            currentMax.dammaiguda = data.dammaiguda.aqi;
          }
        }
        if (data.hyderabad?.aqi) {
          if (!currentMax.hyderabad || data.hyderabad.aqi > currentMax.hyderabad) {
            currentMax.hyderabad = data.hyderabad.aqi;
          }
        }
        
        // Store to localStorage
        localStorage.setItem('dailyMaxAqi', JSON.stringify({
          date: todayKey,
          values: currentMax
        }));
        setDailyMaxAqi(currentMax);
      }
      
      setAqiData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching AQI:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Get display AQI value (show higher of current or daily max before 8 PM)
  const getDisplayAqi = (location, currentAqi) => {
    if (isPastResetTime()) {
      return currentAqi; // After 8 PM, show live value
    }
    const maxAqi = dailyMaxAqi[location];
    if (maxAqi && maxAqi > currentAqi) {
      return maxAqi;
    }
    return currentAqi;
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000); // seconds
    
    if (diff < 60) {
      return language === "te" ? "ఇప్పుడే" : "Just now";
    } else if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return language === "te" ? `${mins} ని. క్రితం` : `${mins}m ago`;
    } else {
      const hours = Math.floor(diff / 3600);
      return language === "te" ? `${hours} గం. క్రితం` : `${hours}h ago`;
    }
  };

  const getAQIBgClass = (category) => {
    const classes = {
      "Good": "bg-green-500",
      "Moderate": "bg-lime-500",
      "Poor": "bg-yellow-500",
      "Unhealthy": "bg-orange-500",
      "Severe": "bg-red-500",
      "Hazardous": "bg-red-900"
    };
    return classes[category] || "bg-gray-500";
  };

  const getAQIEmoji = (category) => {
    const emojis = {
      "Good": "😊",
      "Moderate": "😐",
      "Poor": "😷",
      "Unhealthy": "🤢",
      "Severe": "⚠️",
      "Hazardous": "☠️"
    };
    return emojis[category] || "❓";
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-gradient-to-br from-sky-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!aqiData) {
    return null;
  }

  const dammaiguda = aqiData.dammaiguda;
  const hyderabad = aqiData.hyderabad;

  return (
    <Card className="border-border/50 overflow-hidden" data-testid="aqi-widget">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Wind className="h-5 w-5" />
            <span className="font-semibold">
              {language === "te" ? "గాలి నాణ్యత" : "Air Quality"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAQI}
            disabled={refreshing}
            className="text-white hover:bg-white/20 h-8 px-2 gap-1"
            data-testid="aqi-refresh-btn"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="text-xs">{language === "te" ? "రిఫ్రెష్" : "Refresh"}</span>
          </Button>
        </div>
        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center gap-1 mt-1 text-white/70 text-xs">
            <Clock className="h-3 w-3" />
            <span>{language === "te" ? "చివరిగా నవీకరించబడింది" : "Last updated"}: {formatLastUpdated()}</span>
          </div>
        )}
      </div>

      <CardContent className="p-0">
        {/* Info Banner - AQI Display Logic */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <Info className="h-3 w-3 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            {language === "te" 
              ? "రాత్రి 8 గంటల వరకు రోజంతా అత్యధిక AQI చూపిస్తుంది. 8 గంటల తర్వాత ప్రస్తుత విలువ చూపిస్తుంది."
              : "Shows day's highest AQI until 8 PM, then shows live value."}
          </p>
        </div>
        
        {/* Dammaiguda AQI - Main */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-text-muted">
                {language === "te" ? dammaiguda.location_te : dammaiguda.location}
              </p>
              <p className="text-xs text-text-muted opacity-70">
                {language === "te" ? "మీ ప్రాంతం" : "Your Area"}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold" style={{ color: dammaiguda.color }}>
                  {getDisplayAqi('dammaiguda', dammaiguda.aqi) || "—"}
                </span>
                <span className="text-2xl">{getAQIEmoji(dammaiguda.category)}</span>
              </div>
              <Badge 
                className="mt-1"
                style={{ backgroundColor: dammaiguda.color, color: dammaiguda.color === "#FFFF00" ? "#333" : "#fff" }}
              >
                {language === "te" ? dammaiguda.category_te : dammaiguda.category}
              </Badge>
              {dailyMaxAqi.dammaiguda && dailyMaxAqi.dammaiguda !== dammaiguda.aqi && !isPastResetTime() && (
                <p className="text-xs text-gray-400 mt-1">Live: {dammaiguda.aqi}</p>
              )}
            </div>
          </div>
          
          {/* Pollutants */}
          <div className="flex gap-4 mb-3">
            {dammaiguda.pollutants?.map((p, i) => (
              <div key={i} className="bg-muted/50 rounded-lg px-3 py-2 flex-1 text-center">
                <p className="text-xs text-text-muted">{p.name}</p>
                <p className="font-bold text-lg text-text-primary">
                  {p.value || "—"} <span className="text-xs font-normal">{p.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Health Impact */}
          <div className="flex items-start gap-2 bg-orange-50 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-700">
              {language === "te" ? dammaiguda.health_impact_te : dammaiguda.health_impact}
            </p>
          </div>
        </div>

        {/* Hyderabad AQI - Secondary */}
        <div className="px-4 py-3 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${getAQIBgClass(hyderabad.category)}`}
            >
              {hyderabad.aqi || "—"}
            </div>
            <div>
              <p className="font-medium text-sm text-text-primary">
                {language === "te" ? hyderabad.location_te : hyderabad.location}
              </p>
              <p className="text-xs text-text-muted">
                {language === "te" ? hyderabad.category_te : hyderabad.category}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewFullReport}
            className="text-blue-600 hover:bg-blue-50"
            data-testid="aqi-full-report-btn"
          >
            {language === "te" ? "వివరాలు" : "Details"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
