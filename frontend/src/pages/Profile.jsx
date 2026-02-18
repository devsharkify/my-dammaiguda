import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Globe,
  LogOut,
  Save,
  Shield,
  CheckCircle
} from "lucide-react";

const colonies = [
  "Dammaiguda",
  "Nagaram",
  "Rampally",
  "Jawaharnagar",
  "Alkapuri Colony",
  "Sai Nagar",
  "Sri Sai Colony",
  "Vinayak Nagar",
  "Other"
];

const ageRanges = ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"];

export default function Profile() {
  const { language, setLanguage } = useLanguage();
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || "");
  const [colony, setColony] = useState(user?.colony || "");
  const [ageRange, setAgeRange] = useState(user?.age_range || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(language === "te" ? "పేరు అవసరం" : "Name is required");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        colony: colony || null,
        age_range: ageRange || null,
        language
      });
      toast.success(language === "te" ? "ప్రొఫైల్ నవీకరించబడింది!" : "Profile updated!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roleLabels = {
    citizen: { en: "Citizen", te: "పౌరుడు" },
    volunteer: { en: "Volunteer", te: "వలంటీర్" },
    admin: { en: "Admin", te: "అడ్మిన్" }
  };

  const roleColors = {
    citizen: "bg-blue-100 text-blue-700",
    volunteer: "bg-green-100 text-green-700",
    admin: "bg-purple-100 text-purple-700"
  };

  return (
    <Layout showBackButton title={language === "te" ? "ప్రొఫైల్" : "Profile"}>
      <div className="space-y-6" data-testid="profile">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-primary to-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-10 w-10" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold">{user?.name}</h1>
                <p className="text-white/80 flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4" />
                  {user?.phone}
                </p>
                <Badge className={`mt-2 ${roleColors[user?.role] || "bg-gray-100 text-gray-700"}`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {roleLabels[user?.role]?.[language] || user?.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {language === "te" ? "ప్రొఫైల్ సవరించు" : "Edit Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {language === "te" ? "పేరు" : "Name"}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
                data-testid="profile-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {language === "te" ? "కాలనీ/ప్రాంతం" : "Colony/Area"}
              </Label>
              <Select value={colony} onValueChange={setColony}>
                <SelectTrigger className="h-12" data-testid="profile-colony-select">
                  <SelectValue placeholder={language === "te" ? "ఎంచుకోండి" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  {colonies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {language === "te" ? "వయస్సు పరిధి" : "Age Range"}
              </Label>
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger className="h-12" data-testid="profile-age-select">
                  <SelectValue placeholder={language === "te" ? "ఎంచుకోండి" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  {ageRanges.map((age) => (
                    <SelectItem key={age} value={age}>{age}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 bg-primary text-white rounded-full"
              data-testid="save-profile-btn"
            >
              {saving ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {language === "te" ? "సేవ్ చేయండి" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {language === "te" ? "భాష" : "Language"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={language === "te" ? "default" : "outline"}
                onClick={() => setLanguage("te")}
                className={`h-14 ${language === "te" ? "bg-primary text-white" : ""}`}
                data-testid="lang-telugu-btn"
              >
                {language === "te" && <CheckCircle className="h-4 w-4 mr-2" />}
                తెలుగు
              </Button>
              <Button
                variant={language === "en" ? "default" : "outline"}
                onClick={() => setLanguage("en")}
                className={`h-14 ${language === "en" ? "bg-primary text-white" : ""}`}
                data-testid="lang-english-btn"
              >
                {language === "en" && <CheckCircle className="h-4 w-4 mr-2" />}
                English
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50 rounded-full"
          data-testid="logout-btn"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {language === "te" ? "లాగ్అవుట్" : "Logout"}
        </Button>

        {/* App Info */}
        <div className="text-center text-sm text-text-muted py-4">
          <p className="font-heading font-semibold text-primary">My Dammaiguda</p>
          <p className="text-xs mt-1">Version 1.0.0</p>
        </div>
      </div>
    </Layout>
  );
}
