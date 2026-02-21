import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { 
  Bell, 
  BellOff, 
  AlertTriangle, 
  Newspaper, 
  Calendar, 
  Megaphone, 
  Heart,
  Shield,
  Activity,
  Loader2,
  CheckCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

export default function NotificationSettings({ token }) {
  const { language } = useLanguage();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    sos_alerts: true,
    geofence_alerts: true,
    news_updates: true,
    community_updates: true,
    health_reminders: true,
    challenge_updates: true,
    grievance_updates: true,
    panchangam_reminder: true,
    announcements: true
  });

  useEffect(() => {
    checkSupport();
    loadPreferences();
  }, []);

  const checkSupport = async () => {
    // Check if push notifications are supported
    const supported = 'Notification' in window && 
                     'serviceWorker' in navigator && 
                     'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      // Check if already subscribed
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    }
    setLoading(false);
  };

  const loadPreferences = async () => {
    try {
      const response = await axios.get(`${API}/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setPreferences(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      // Preferences might not exist yet
    }
  };

  const subscribe = async () => {
    if (!isSupported) {
      toast.error(language === "te" 
        ? "మీ బ్రౌజర్ నోటిఫికేషన్లకు మద్దతు ఇవ్వదు" 
        : "Your browser doesn't support notifications");
      return;
    }

    setSaving(true);
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(language === "te" 
          ? "నోటిఫికేషన్ అనుమతి తిరస్కరించబడింది" 
          : "Notification permission denied");
        setSaving(false);
        return;
      }

      // Get VAPID public key
      const keyResponse = await axios.get(`${API}/notifications/vapid-public-key`);
      const vapidPublicKey = keyResponse.data.publicKey;

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to backend
      await axios.post(`${API}/notifications/subscribe`, {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth'))
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSubscribed(true);
      toast.success(language === "te" 
        ? "నోటిఫికేషన్లు ఆన్ చేయబడ్డాయి!" 
        : "Notifications enabled!");
    } catch (error) {
      console.error("Error subscribing:", error);
      toast.error(language === "te" 
        ? "నోటిఫికేషన్లను ఆన్ చేయడం విఫలమైంది" 
        : "Failed to enable notifications");
    } finally {
      setSaving(false);
    }
  };

  const unsubscribe = async () => {
    setSaving(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await axios.delete(`${API}/notifications/unsubscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setIsSubscribed(false);
      toast.success(language === "te" 
        ? "నోటిఫికేషన్లు ఆఫ్ చేయబడ్డాయి" 
        : "Notifications disabled");
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("Failed to disable notifications");
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/notifications/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(language === "te" 
        ? "ప్రాధాన్యతలు సేవ్ చేయబడ్డాయి" 
        : "Preferences saved");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/notifications/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(language === "te" 
        ? "టెస్ట్ నోటిఫికేషన్ పంపబడింది" 
        : "Test notification sent");
    } catch (error) {
      toast.error("Failed to send test notification");
    } finally {
      setSaving(false);
    }
  };

  // Helper functions
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const NOTIFICATION_TYPES = [
    {
      key: "grievance_updates",
      icon: AlertTriangle,
      label: language === "te" ? "సమస్య నవీకరణలు" : "Grievance Updates",
      description: language === "te" ? "మీ సమస్యల స్థితి నవీకరణలు" : "Updates on your reported issues"
    },
    {
      key: "news_updates",
      icon: Newspaper,
      label: language === "te" ? "వార్తా హెచ్చరికలు" : "News Alerts",
      description: language === "te" ? "స్థానిక వార్తలు మరియు నవీకరణలు" : "Local news and updates"
    },
    {
      key: "panchangam_reminder",
      icon: Calendar,
      label: language === "te" ? "పంచాంగ రిమైండర్" : "Panchangam Reminder",
      description: language === "te" ? "రోజువారీ పంచాంగ నోటిఫికేషన్" : "Daily panchangam notification"
    },
    {
      key: "announcements",
      icon: Megaphone,
      label: language === "te" ? "ప్రకటనలు" : "Announcements",
      description: language === "te" ? "అడ్మిన్ ప్రకటనలు" : "Admin announcements"
    },
    {
      key: "sos_alerts",
      icon: Shield,
      label: language === "te" ? "SOS హెచ్చరికలు" : "SOS Alerts",
      description: language === "te" ? "అత్యవసర హెచ్చరికలు" : "Emergency alerts"
    },
    {
      key: "health_reminders",
      icon: Activity,
      label: language === "te" ? "ఆరోగ్య రిమైండర్లు" : "Health Reminders",
      description: language === "te" ? "ఫిట్నెస్ మరియు ఆరోగ్య గమనికలు" : "Fitness and health tips"
    },
    {
      key: "community_updates",
      icon: Heart,
      label: language === "te" ? "కమ్యూనిటీ అప్‌డేట్‌లు" : "Community Updates",
      description: language === "te" ? "సిటిజన్ వాల్ కార్యకలాపాలు" : "Citizen wall activities"
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Toggle */}
      <Card className={isSubscribed ? "border-green-200 bg-green-50/30" : "border-gray-200"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <BellOff className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="font-bold">
                  {language === "te" ? "పుష్ నోటిఫికేషన్లు" : "Push Notifications"}
                </h3>
                <p className="text-sm text-gray-500">
                  {isSubscribed 
                    ? (language === "te" ? "నోటిఫికేషన్లు ఆన్ చేయబడ్డాయి" : "Notifications are enabled")
                    : (language === "te" ? "నోటిఫికేషన్లు ఆఫ్ చేయబడ్డాయి" : "Notifications are disabled")}
                </p>
              </div>
            </div>
            <Button
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={saving || !isSupported}
              variant={isSubscribed ? "outline" : "default"}
              className={isSubscribed ? "" : "bg-green-600 hover:bg-green-700"}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isSubscribed 
                ? (language === "te" ? "ఆఫ్ చేయండి" : "Turn Off")
                : (language === "te" ? "ఆన్ చేయండి" : "Turn On")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Browser Support Warning */}
      {!isSupported && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Info className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              {language === "te" 
                ? "మీ బ్రౌజర్ పుష్ నోటిఫికేషన్లకు మద్దతు ఇవ్వదు" 
                : "Your browser doesn't support push notifications"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notification Type Preferences */}
      {isSubscribed && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {language === "te" ? "నోటిఫికేషన్ రకాలు" : "Notification Types"}
              </CardTitle>
              <CardDescription>
                {language === "te" 
                  ? "మీరు ఏ నోటిఫికేషన్లు అందుకోవాలో ఎంచుకోండి" 
                  : "Choose which notifications you want to receive"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIFICATION_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-500" />
                      <div>
                        <Label className="font-medium">{type.label}</Label>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences[type.key]}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, [type.key]: checked }))
                      }
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={savePreferences} disabled={saving} className="flex-1">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {language === "te" ? "ప్రాధాన్యతలు సేవ్ చేయండి" : "Save Preferences"}
            </Button>
            <Button onClick={testNotification} disabled={saving} variant="outline">
              {language === "te" ? "టెస్ట్" : "Test"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
