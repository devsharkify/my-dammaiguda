import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
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
  CheckCircle,
  Bell,
  BellOff,
  AlertTriangle,
  Newspaper,
  Users,
  Heart,
  Trophy,
  MapPinned,
  Loader2
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
  const { user, token, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || "");
  const [colony, setColony] = useState(user?.colony || "");
  const [ageRange, setAgeRange] = useState(user?.age_range || "");
  const [saving, setSaving] = useState(false);
  
  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    sos_alerts: true,
    geofence_alerts: true,
    news_updates: true,
    community_updates: true,
    health_reminders: true,
    challenge_updates: true
  });
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchNotificationPrefs();
  }, []);

  const fetchNotificationPrefs = async () => {
    try {
      const response = await axios.get(`${API}/notifications/preferences`, { headers });
      if (response.data) {
        setNotifPrefs({
          sos_alerts: response.data.sos_alerts ?? true,
          geofence_alerts: response.data.geofence_alerts ?? true,
          news_updates: response.data.news_updates ?? true,
          community_updates: response.data.community_updates ?? true,
          health_reminders: response.data.health_reminders ?? true,
          challenge_updates: response.data.challenge_updates ?? true
        });
        setPushSubscribed(true);
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    } finally {
      setLoadingPrefs(false);
    }
  };

  const updateNotifPref = async (key, value) => {
    const newPrefs = { ...notifPrefs, [key]: value };
    setNotifPrefs(newPrefs);
    
    setSavingPrefs(true);
    try {
      await axios.put(`${API}/notifications/preferences`, newPrefs, { headers });
      toast.success(language === "te" ? "నోటిఫికేషన్ సెట్టింగ్స్ నవీకరించబడ్డాయి" : "Notification settings updated");
    } catch (error) {
      // Revert on error
      setNotifPrefs({ ...notifPrefs, [key]: !value });
      toast.error("Failed to update preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      // In a real PWA, we would request notification permission and get the subscription
      // For now, we'll just register with a mock subscription
      const mockSubscription = {
        endpoint: `https://push.example.com/${user.id}/${Date.now()}`,
        keys: {
          p256dh: "mock_p256dh_key",
          auth: "mock_auth_key"
        }
      };
      
      await axios.post(`${API}/notifications/subscribe`, mockSubscription, { headers });
      setPushSubscribed(true);
      toast.success(language === "te" ? "నోటిఫికేషన్లు ఎనేబుల్ చేయబడ్డాయి!" : "Notifications enabled!");
    } catch (error) {
      toast.error("Failed to enable notifications");
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      await axios.delete(`${API}/notifications/subscribe`, { headers });
      setPushSubscribed(false);
      toast.success(language === "te" ? "నోటిఫికేషన్లు డిసేబుల్ చేయబడ్డాయి" : "Notifications disabled");
    } catch (error) {
      toast.error("Failed to disable notifications");
    }
  };

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

        {/* Notification Preferences */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {language === "te" ? "నోటిఫికేషన్లు" : "Notifications"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPrefs ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Master Push Toggle */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-teal-500/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    {pushSubscribed ? (
                      <Bell className="h-6 w-6 text-primary" />
                    ) : (
                      <BellOff className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {language === "te" ? "పుష్ నోటిఫికేషన్లు" : "Push Notifications"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pushSubscribed 
                          ? (language === "te" ? "ఎనేబుల్ చేయబడింది" : "Enabled")
                          : (language === "te" ? "డిసేబుల్ చేయబడింది" : "Disabled")
                        }
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={pushSubscribed}
                    onCheckedChange={(checked) => checked ? subscribeToPush() : unsubscribeFromPush()}
                    data-testid="push-toggle"
                  />
                </div>

                {pushSubscribed && (
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-muted-foreground">
                      {language === "te" ? "నోటిఫికేషన్ రకాలను నిర్వహించండి:" : "Manage notification types:"}
                    </p>
                    
                    {/* SOS Alerts */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {language === "te" ? "SOS అలర్ట్‌లు" : "SOS Alerts"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "te" ? "అత్యవసర అలర్ట్‌లు" : "Emergency alerts"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifPrefs.sos_alerts}
                        onCheckedChange={(checked) => updateNotifPref("sos_alerts", checked)}
                        disabled={savingPrefs}
                      />
                    </div>

                    {/* Geofence Alerts */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <MapPinned className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {language === "te" ? "జియో-ఫెన్స్ అలర్ట్‌లు" : "Geo-fence Alerts"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "te" ? "సేఫ్ జోన్ నోటిఫికేషన్లు" : "Safe zone notifications"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifPrefs.geofence_alerts}
                        onCheckedChange={(checked) => updateNotifPref("geofence_alerts", checked)}
                        disabled={savingPrefs}
                      />
                    </div>

                    {/* News Updates */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Newspaper className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {language === "te" ? "వార్తా నవీకరణలు" : "News Updates"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "te" ? "ముఖ్యమైన వార్తలు" : "Important news"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifPrefs.news_updates}
                        onCheckedChange={(checked) => updateNotifPref("news_updates", checked)}
                        disabled={savingPrefs}
                      />
                    </div>

                    {/* Community Updates */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {language === "te" ? "కమ్యూనిటీ నవీకరణలు" : "Community Updates"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "te" ? "సిటిజన్ వాల్ యాక్టివిటీ" : "Citizen Wall activity"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifPrefs.community_updates}
                        onCheckedChange={(checked) => updateNotifPref("community_updates", checked)}
                        disabled={savingPrefs}
                      />
                    </div>

                    {/* Health Reminders */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Heart className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {language === "te" ? "ఆరోగ్య రిమైండర్లు" : "Health Reminders"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "te" ? "నీరు, నిద్ర గుర్తులు" : "Water, sleep reminders"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifPrefs.health_reminders}
                        onCheckedChange={(checked) => updateNotifPref("health_reminders", checked)}
                        disabled={savingPrefs}
                      />
                    </div>

                    {/* Challenge Updates */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {language === "te" ? "ఛాలెంజ్ అప్‌డేట్‌లు" : "Challenge Updates"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "te" ? "ఫిట్‌నెస్ ఛాలెంజ్‌లు" : "Fitness challenges"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifPrefs.challenge_updates}
                        onCheckedChange={(checked) => updateNotifPref("challenge_updates", checked)}
                        disabled={savingPrefs}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
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
