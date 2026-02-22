import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Wind,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Heart,
  Activity,
  Baby,
  PersonStanding,
  Clock,
  Shield,
  ThermometerSun
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AQIReport() {
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

  const getAQIScale = () => [
    { range: "0-50", category: "Good", category_te: "మంచి", color: "#00B050", advice: "Ideal for outdoor activities", advice_te: "బయటి కార్యకలాపాలకు అనువైనది" },
    { range: "51-100", category: "Moderate", category_te: "మధ్యస్థం", color: "#92D050", advice: "Sensitive people should limit prolonged outdoor exertion", advice_te: "సున్నితమైన వ్యక్తులు దీర్ఘకాలిక బయటి శ్రమను పరిమితం చేయాలి" },
    { range: "101-200", category: "Poor", category_te: "చెడు", color: "#FFFF00", advice: "Avoid prolonged outdoor activities", advice_te: "దీర్ఘకాలిక బయటి కార్యకలాపాలను నివారించండి" },
    { range: "201-300", category: "Unhealthy", category_te: "అనారోగ్యకరమైన", color: "#FF9900", advice: "Limit outdoor activities, use masks", advice_te: "బయటి కార్యకలాపాలను పరిమితం చేయండి, మాస్కులు వాడండి" },
    { range: "301-400", category: "Severe", category_te: "తీవ్రమైన", color: "#FF0000", advice: "Stay indoors, avoid all outdoor activities", advice_te: "ఇంట్లోనే ఉండండి, అన్ని బయటి కార్యకలాపాలను నివారించండి" },
    { range: "401+", category: "Hazardous", category_te: "ప్రమాదకరమైన", color: "#800000", advice: "Emergency conditions - stay indoors with air purifier", advice_te: "అత్యవసర పరిస్థితులు - ఎయిర్ ప్యూరిఫైయర్‌తో ఇంట్లోనే ఉండండి" }
  ];

  const getHealthTips = (aqi) => {
    if (!aqi) return [];
    
    const tips = [
      {
        icon: <Baby className="h-5 w-5" />,
        group: language === "te" ? "పిల్లలు" : "Children",
        tip: aqi > 100 
          ? (language === "te" ? "పిల్లలను ఇంట్లోనే ఉంచండి" : "Keep children indoors")
          : (language === "te" ? "బయట ఆడడానికి సురక్షితం" : "Safe to play outside"),
        severity: aqi > 200 ? "high" : aqi > 100 ? "medium" : "low"
      },
      {
        icon: <Heart className="h-5 w-5" />,
        group: language === "te" ? "గుండె/ఊపిరితిత్తుల సమస్యలు" : "Heart/Lung Issues",
        tip: aqi > 100 
          ? (language === "te" ? "బయటి కార్యకలాపాలు నివారించండి" : "Avoid outdoor activities")
          : (language === "te" ? "తేలికపాటి వ్యాయామం చేయవచ్చు" : "Light exercise is fine"),
        severity: aqi > 150 ? "high" : aqi > 100 ? "medium" : "low"
      },
      {
        icon: <PersonStanding className="h-5 w-5" />,
        group: language === "te" ? "వృద్ధులు" : "Elderly",
        tip: aqi > 150 
          ? (language === "te" ? "మాస్కు లేకుండా బయటికి వెళ్ళకండి" : "Don't go out without mask")
          : (language === "te" ? "ఉదయం/సాయంత్రం నడక సురక్షితం" : "Morning/evening walks are safe"),
        severity: aqi > 200 ? "high" : aqi > 100 ? "medium" : "low"
      },
      {
        icon: <Activity className="h-5 w-5" />,
        group: language === "te" ? "ఫిట్‌నెస్ ఔత్సాహికులు" : "Fitness Enthusiasts",
        tip: aqi > 150 
          ? (language === "te" ? "ఇండోర్ వ్యాయామానికి మారండి" : "Switch to indoor workouts")
          : (language === "te" ? "ఉదయం 6-7 గంటలకు వ్యాయామం చేయండి" : "Exercise at 6-7 AM"),
        severity: aqi > 200 ? "high" : aqi > 100 ? "medium" : "low"
      }
    ];
    
    return tips;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high": return "bg-red-100 border-red-200 text-red-700";
      case "medium": return "bg-yellow-100 border-yellow-200 text-yellow-700";
      default: return "bg-green-100 border-green-200 text-green-700";
    }
  };

  const AQICard = ({ data, isPrimary = false }) => (
    <Card className={`border-border/50 overflow-hidden ${isPrimary ? "shadow-lg" : ""}`}>
      <div 
        className="px-4 py-3"
        style={{ backgroundColor: data.color, color: data.color === "#FFFF00" ? "#333" : "#fff" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">
              {language === "te" ? data.location_te : data.location}
            </p>
            <p className="font-bold text-lg">
              {language === "te" ? data.category_te : data.category}
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold">{data.aqi || "—"}</p>
            <p className="text-xs opacity-80">AQI</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        {/* Pollutants */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {data.pollutants?.map((p, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-text-muted mb-1">{p.name}</p>
              <p className="font-bold text-2xl text-text-primary">
                {p.value || "—"}
              </p>
              <p className="text-xs text-text-muted">{p.unit}</p>
            </div>
          ))}
        </div>

        {/* Health Impact */}
        <div className="flex items-start gap-2 bg-orange-50 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-orange-700 mb-1">
              {language === "te" ? "ఆరోగ్య ప్రభావం" : "Health Impact"}
            </p>
            <p className="text-xs text-orange-600">
              {language === "te" ? data.health_impact_te : data.health_impact}
            </p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
          <Clock className="h-3 w-3" />
          <span>
            {language === "te" ? "తాజా సమాచారం: " : "Last updated: "}
            {new Date(data.last_updated).toLocaleTimeString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout title={language === "te" ? "గాలి నాణ్యత నివేదిక" : "Air Quality Report"} showBackButton>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const dammaiguda = aqiData?.dammaiguda;
  const hyderabad = aqiData?.hyderabad;
  const healthTips = getHealthTips(dammaiguda?.aqi);

  return (
    <Layout title={language === "te" ? "గాలి నాణ్యత నివేదిక" : "Air Quality Report"} showBackButton>
      <div className="space-y-6" data-testid="aqi-report-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="h-6 w-6 text-blue-500" />
            <h1 className="font-heading text-xl font-bold text-text-primary">
              {language === "te" ? "లైవ్ AQI" : "Live AQI"}
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAQI}
            disabled={refreshing}
            data-testid="refresh-aqi-btn"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            {language === "te" ? "రిఫ్రెష్" : "Refresh"}
          </Button>
        </div>

        {/* Main AQI Cards */}
        {dammaiguda && <AQICard data={dammaiguda} isPrimary />}
        {hyderabad && <AQICard data={hyderabad} />}

        {/* Health Tips Based on Current AQI */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {language === "te" ? "ఆరోగ్య సూచనలు" : "Health Tips"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthTips.map((tip, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${getSeverityColor(tip.severity)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {tip.icon}
                  <span className="font-semibold text-sm">{tip.group}</span>
                </div>
                <p className="text-sm ml-7">{tip.tip}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AQI Scale Reference */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ThermometerSun className="h-5 w-5 text-primary" />
              {language === "te" ? "AQI స్కేల్" : "AQI Scale"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {getAQIScale().map((level, i) => (
              <div key={i} className="flex items-center gap-3">
                <div 
                  className="w-16 h-8 rounded flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: level.color,
                    color: level.color === "#FFFF00" ? "#333" : "#fff"
                  }}
                >
                  {level.range}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-text-primary">
                    {language === "te" ? level.category_te : level.category}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? level.advice_te : level.advice}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data Source */}
        <p className="text-center text-xs text-text-muted">
          {language === "te" 
            ? "డేటా సోర్స్: aqi.in | భారతీయ AQI ప్రమాణం" 
            : "Data source: aqi.in | Indian AQI Standard"}
        </p>
      </div>
    </Layout>
  );
}
