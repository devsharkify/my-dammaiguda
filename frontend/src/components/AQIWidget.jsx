import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Wind, AlertTriangle, ChevronRight, RefreshCw, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AQIWidget({ onViewFullReport }) {
  const { language } = useLanguage();
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAQI();
  }, []);

  const fetchAQI = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API}/aqi/both`);
      setAqiData(response.data);
    } catch (error) {
      console.error("Error fetching AQI:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 flex items-center justify-between">
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
          className="text-white hover:bg-white/20 h-8 w-8 p-0"
          data-testid="aqi-refresh-btn"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <CardContent className="p-0">
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
                  {dammaiguda.aqi || "—"}
                </span>
                <span className="text-2xl">{getAQIEmoji(dammaiguda.category)}</span>
              </div>
              <Badge 
                className="mt-1"
                style={{ backgroundColor: dammaiguda.color, color: dammaiguda.color === "#FFFF00" ? "#333" : "#fff" }}
              >
                {language === "te" ? dammaiguda.category_te : dammaiguda.category}
              </Badge>
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
