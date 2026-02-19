import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import Layout from "../components/Layout";
import {
  Phone,
  Ambulance,
  Shield,
  Flame,
  AlertTriangle,
  Users,
  Heart,
  Building2,
  Droplets,
  Zap,
  MessageCircle,
  ExternalLink
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Helpline() {
  const { language } = useLanguage();

  const emergencyNumbers = [
    {
      id: "police",
      icon: <Shield className="h-6 w-6" />,
      name: language === "te" ? "పోలీసులు" : "Police",
      number: "100",
      color: "bg-blue-500",
      description: language === "te" ? "అత్యవసర పోలీస్ సహాయం" : "Emergency Police Help"
    },
    {
      id: "ambulance",
      icon: <Ambulance className="h-6 w-6" />,
      name: language === "te" ? "అంబులెన్స్" : "Ambulance",
      number: "108",
      color: "bg-red-500",
      description: language === "te" ? "వైద్య అత్యవసర సేవలు" : "Medical Emergency Services"
    },
    {
      id: "fire",
      icon: <Flame className="h-6 w-6" />,
      name: language === "te" ? "అగ్నిమాపక" : "Fire Station",
      number: "101",
      color: "bg-orange-500",
      description: language === "te" ? "అగ్ని ప్రమాదాలకు" : "Fire Emergencies"
    },
    {
      id: "women",
      icon: <Users className="h-6 w-6" />,
      name: language === "te" ? "మహిళా హెల్ప్‌లైన్" : "Women Helpline",
      number: "181",
      color: "bg-pink-500",
      description: language === "te" ? "మహిళల భద్రత కోసం" : "Women Safety Helpline"
    },
    {
      id: "child",
      icon: <Heart className="h-6 w-6" />,
      name: language === "te" ? "చైల్డ్ హెల్ప్‌లైన్" : "Child Helpline",
      number: "1098",
      color: "bg-purple-500",
      description: language === "te" ? "పిల్లల సహాయం కోసం" : "Child Protection Services"
    },
    {
      id: "disaster",
      icon: <AlertTriangle className="h-6 w-6" />,
      name: language === "te" ? "విపత్తు నిర్వహణ" : "Disaster Management",
      number: "1078",
      color: "bg-amber-500",
      description: language === "te" ? "ప్రకృతి విపత్తులకు" : "Natural Disasters"
    }
  ];

  const localNumbers = [
    {
      id: "ghmc",
      icon: <Building2 className="h-5 w-5" />,
      name: "GHMC",
      number: "040-21111111",
      description: language === "te" ? "పురపాలక సేవలు" : "Municipal Services"
    },
    {
      id: "water",
      icon: <Droplets className="h-5 w-5" />,
      name: language === "te" ? "నీటి సరఫరా" : "Water Board",
      number: "155313",
      description: language === "te" ? "నీటి సమస్యలు" : "Water Supply Issues"
    },
    {
      id: "electricity",
      icon: <Zap className="h-5 w-5" />,
      name: language === "te" ? "విద్యుత్" : "Electricity",
      number: "1912",
      description: language === "te" ? "విద్యుత్ సమస్యలు" : "Power Issues"
    },
    {
      id: "corporator",
      icon: <Users className="h-5 w-5" />,
      name: language === "te" ? "కార్పొరేటర్" : "Corporator Office",
      number: "9876543210",
      description: language === "te" ? "స్థానిక సమస్యలు" : "Local Issues"
    }
  ];

  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <Layout title={language === "te" ? "హెల్ప్‌లైన్" : "Helpline"}>
      <div className="space-y-6 pb-20" data-testid="helpline-page">
        {/* Emergency Header */}
        <div className="text-center py-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
            <Phone className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold">
            {language === "te" ? "అత్యవసర హెల్ప్‌లైన్ నంబర్లు" : "Emergency Helpline Numbers"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {language === "te" ? "ఒక్క టచ్‌తో కాల్ చేయండి" : "One touch to call"}
          </p>
        </div>

        {/* Emergency Numbers - Grid */}
        <div className="grid grid-cols-2 gap-3">
          {emergencyNumbers.map((item) => (
            <Card 
              key={item.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
              onClick={() => handleCall(item.number)}
              data-testid={`helpline-${item.id}`}
            >
              <CardContent className="p-4">
                <div className={`h-12 w-12 rounded-xl ${item.color} text-white flex items-center justify-center mb-3`}>
                  {item.icon}
                </div>
                <h3 className="font-semibold text-sm">{item.name}</h3>
                <p className="text-2xl font-bold text-primary mt-1">{item.number}</p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Local Numbers Section */}
        <div>
          <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {language === "te" ? "స్థానిక సేవలు" : "Local Services"}
          </h2>
          <div className="space-y-2">
            {localNumbers.map((item) => (
              <Card 
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => handleCall(item.number)}
                data-testid={`local-${item.id}`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{item.number}</p>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {language === "te" ? "కాల్" : "Call"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* WhatsApp Support */}
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {language === "te" ? "WhatsApp సపోర్ట్" : "WhatsApp Support"}
                </h3>
                <p className="text-white/80 text-sm">
                  {language === "te" ? "మా టీమ్‌తో చాట్ చేయండి" : "Chat with our team"}
                </p>
              </div>
              <Button 
                variant="secondary" 
                className="bg-white text-green-600 hover:bg-white/90"
                onClick={() => window.open("https://wa.me/919876543210", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {language === "te" ? "చాట్" : "Chat"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground px-4">
          {language === "te" 
            ? "అత్యవసర పరిస్థితుల్లో మాత్రమే ఈ నంబర్లను ఉపయోగించండి. దుర్వినియోగం శిక్షార్హం."
            : "Use these numbers only in genuine emergencies. Misuse is punishable by law."}
        </p>
      </div>
    </Layout>
  );
}
