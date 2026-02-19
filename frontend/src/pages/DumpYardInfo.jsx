import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import Layout from "../components/Layout";
import {
  AlertTriangle,
  MapPin,
  Baby,
  Heart,
  Users,
  Clock,
  Wind,
  Skull,
  Info
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DumpYardInfo() {
  const { language } = useLanguage();
  const [info, setInfo] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [infoRes, updatesRes, contentRes] = await Promise.all([
        axios.get(`${API}/dumpyard/info`),
        axios.get(`${API}/dumpyard/updates`).catch(() => ({ data: [] })),
        axios.get(`${API}/content/dumpyard`).catch(() => ({ data: null }))
      ]);
      
      // Merge content config with dumpyard info
      const dumpyardConfig = contentRes.data;
      const mergedInfo = {
        ...infoRes.data,
        ...(dumpyardConfig && {
          daily_waste_tons: dumpyardConfig.daily_waste_tons,
          area_acres: dumpyardConfig.area_acres,
          red_zone_km: dumpyardConfig.red_zone_km,
          status: dumpyardConfig.status,
          historical_note: dumpyardConfig.historical_data,
          health_risks: dumpyardConfig.health_risks,
          affected_groups: dumpyardConfig.affected_groups
        })
      };
      
      setInfo(mergedInfo);
      setUpdates(updatesRes.data);
    } catch (error) {
      console.error("Error fetching dump yard info:", error);
    } finally {
      setLoading(false);
    }
  };

  const zoneColors = {
    red: "bg-red-500",
    orange: "bg-orange-500",
    green: "bg-green-500"
  };

  const groupIcons = {
    children: <Baby className="h-6 w-6" />,
    pregnant_women: <Heart className="h-6 w-6" />,
    elderly: <Users className="h-6 w-6" />
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "డంప్ యార్డ్" : "Dump Yard"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "డంప్ యార్డ్" : "Dump Yard"}>
      <div className="space-y-6" data-testid="dumpyard-info">
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
                <MapPin className="h-7 w-7" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold">
                  {language === "te" ? info?.name_te : info?.name}
                </h1>
                <p className="text-white/80 mt-1">
                  {language === "te" 
                    ? `${info?.area_acres} ఎకరాలు | రోజువారీ వ్యర్థాలు: ${info?.daily_waste_tons} టన్నులు`
                    : `${info?.area_acres} acres | Daily waste: ${info?.daily_waste_tons} tons`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="zones" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="zones" className="text-sm">
              {language === "te" ? "జోన్లు" : "Zones"}
            </TabsTrigger>
            <TabsTrigger value="risks" className="text-sm">
              {language === "te" ? "ప్రమాదాలు" : "Risks"}
            </TabsTrigger>
            <TabsTrigger value="updates" className="text-sm">
              {language === "te" ? "అప్‌డేట్స్" : "Updates"}
            </TabsTrigger>
          </TabsList>

          {/* Pollution Zones Tab */}
          <TabsContent value="zones" className="mt-4 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              {language === "te" ? "కాలుష్య ప్రమాద జోన్లు" : "Pollution Risk Zones"}
            </h2>
            
            <div className="space-y-3">
              {info?.pollution_zones?.map((zone, idx) => (
                <Card 
                  key={idx} 
                  className={`border-l-4 ${
                    zone.zone === "red" ? "border-l-red-500" : 
                    zone.zone === "orange" ? "border-l-orange-500" : "border-l-green-500"
                  }`}
                  data-testid={`zone-${zone.zone}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${zoneColors[zone.zone]} flex items-center justify-center`}>
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">
                            {language === "te" 
                              ? `${zone.zone === "red" ? "రెడ్" : zone.zone === "orange" ? "ఆరెంజ్" : "గ్రీన్"} జోన్`
                              : `${zone.zone.charAt(0).toUpperCase() + zone.zone.slice(1)} Zone`}
                          </p>
                          <p className="text-sm text-text-muted">
                            {language === "te" 
                              ? `${zone.radius_km} కి.మీ. వ్యాసార్థం`
                              : `${zone.radius_km} km radius`}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${
                        zone.risk === "high" ? "bg-red-100 text-red-700" :
                        zone.risk === "medium" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {language === "te" ? zone.risk_te : zone.risk}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Map Placeholder */}
            <Card className="border-border/50 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {language === "te" ? "మ్యాప్ త్వరలో" : "Map coming soon"}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Health Risks Tab */}
          <TabsContent value="risks" className="mt-4 space-y-4">
            {/* Toxic Exposure Info */}
            <div className="space-y-3">
              {info?.health_risks && Object.entries(info.health_risks).map(([key, risk]) => (
                <Card key={key} className="border-border/50" data-testid={`risk-${key}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        {key === "cadmium" ? <Skull className="h-5 w-5 text-red-600" /> : <Wind className="h-5 w-5 text-red-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">
                          {language === "te" ? risk.title_te : risk.title}
                        </h3>
                        <p className="text-sm text-text-muted mt-1">
                          {language === "te" ? risk.description_te : risk.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Affected Groups */}
            <h2 className="font-heading text-lg font-semibold text-text-primary mt-6">
              {language === "te" ? "ప్రభావితమైన సమూహాలు" : "Affected Groups"}
            </h2>
            
            <div className="space-y-3">
              {info?.affected_groups?.map((group, idx) => (
                <Card 
                  key={idx} 
                  className="border-border/50"
                  data-testid={`affected-group-${group.group}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        group.risk_level === "very_high" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                      }`}>
                        {groupIcons[group.group]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-text-primary">
                            {language === "te" ? group.group_te : group.group}
                          </h3>
                          <Badge className={`${
                            group.risk_level === "very_high" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                          }`}>
                            {group.risk_level === "very_high" 
                              ? (language === "te" ? "చాలా అధికం" : "Very High")
                              : (language === "te" ? "అధికం" : "High")}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-muted mt-2">
                          {language === "te" ? group.advice_te : group.advice}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="mt-4 space-y-4">
            {updates.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-text-muted">
                  {language === "te" ? "అప్‌డేట్స్ ఇంకా లేవు" : "No updates yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {updates.map((update) => (
                  <Card key={update.id} className="border-border/50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-text-primary">
                        {language === "te" ? update.title_te : update.title}
                      </h3>
                      <p className="text-sm text-text-muted mt-2">
                        {language === "te" ? update.content_te : update.content}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />
                        {new Date(update.date).toLocaleDateString(language === "te" ? "te-IN" : "en-IN")}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Warning Banner */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              {language === "te"
                ? "ఈ సమాచారం అవగాహన కోసం మాత్రమే. వైద్య సలహా కోసం దయచేసి వైద్యుడిని సంప్రదించండి."
                : "This information is for awareness only. Please consult a doctor for medical advice."}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
