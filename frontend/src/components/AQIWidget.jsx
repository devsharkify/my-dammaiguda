import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Wind, AlertTriangle, ChevronRight, RefreshCw, Loader2, Clock, TrendingUp, ArrowUp, ExternalLink } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AQIWidget({ onViewFullReport }) {
  const { language } = useLanguage();
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchAQI();
    
    // Auto-refresh at 6 AM and 8 PM IST
    const checkRefreshTimes = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      // Refresh at 6:00 AM and 8:00 PM
      if ((hours === 6 || hours === 20) && minutes === 0) {
        fetchAQI();
      }
    };
    
    const interval = setInterval(checkRefreshTimes, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAQI = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API}/aqi/dammaiguda`);
      const data = response.data;
      setAqiData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching AQI:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const dailyPeak = aqiData.daily_peak;

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
        {/* Current AQI */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-text-muted">
                {language === "te" ? aqiData.location_te || "దమ్మాయిగూడ" : aqiData.location || "Dammaiguda"}
              </p>
              <p className="text-xs text-text-muted opacity-70">
                {language === "te" ? "ప్రస్తుత AQI" : "Current AQI"}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold" style={{ color: aqiData.color }}>
                  {aqiData.aqi || "—"}
                </span>
                <span className="text-2xl">{getAQIEmoji(aqiData.category)}</span>
              </div>
              <Badge 
                className="mt-1"
                style={{ backgroundColor: aqiData.color, color: aqiData.color === "#FFFF00" ? "#333" : "#fff" }}
              >
                {language === "te" ? aqiData.category_te : aqiData.category}
              </Badge>
            </div>
          </div>
          
          {/* Pollutants */}
          <div className="flex gap-4 mb-3">
            {aqiData.pollutants?.map((p, i) => (
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
              {language === "te" ? aqiData.health_impact_te : aqiData.health_impact}
            </p>
          </div>
        </div>

        {/* Today's Peak AQI */}
        {dailyPeak && (
          <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: dailyPeak.color }}>
                  <ArrowUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {language === "te" ? "నేటి అత్యధిక AQI" : "Today's Peak AQI"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? `సమయం: ${dailyPeak.time}` : `at ${dailyPeak.time}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold" style={{ color: dailyPeak.color }}>
                  {dailyPeak.aqi}
                </span>
                <Badge 
                  className="ml-2"
                  style={{ backgroundColor: dailyPeak.color, color: dailyPeak.color === "#FFFF00" ? "#333" : "#fff" }}
                >
                  {language === "te" ? dailyPeak.category_te : dailyPeak.category}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* View Full Report Button */}
        <div className="px-4 py-3 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-text-muted">
              {language === "te" ? "24 గంటల ట్రెండ్ చూడండి" : "View 24hr Trend"}
            </span>
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
