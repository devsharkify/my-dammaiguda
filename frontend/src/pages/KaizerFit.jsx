import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Activity,
  Footprints,
  Trophy,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  Medal,
  Bike,
  PersonStanding,
  Flame,
  Heart,
  Timer,
  MapPin,
  Zap,
  Award,
  Calendar,
  Sparkles,
  Crown,
  Star,
  ChevronRight,
  Watch
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Motivational quotes
const MOTIVATIONAL_QUOTES = {
  en: [
    "Your only limit is you. Push harder! 💪",
    "Champions train, losers complain. Be a champion!",
    "Every step counts. Keep moving forward! 🏃",
    "Sweat now, shine later! ✨",
    "Make yourself proud today!",
    "The body achieves what the mind believes!",
    "Strong body, strong mind, strong life!",
    "Your future self will thank you!"
  ],
  te: [
    "మీ పరిమితి మీరే. మరింత కష్టపడండి! 💪",
    "ఛాంపియన్లు శిక్షణ పొందుతారు. ఛాంపియన్ అవ్వండి!",
    "ప్రతి అడుగు ముఖ్యం. ముందుకు నడవండి! 🏃",
    "ఇప్పుడు చెమట, తర్వాత వెలుగు! ✨",
    "ఈ రోజు మిమ్మల్ని మీరు గర్వపడేలా చేసుకోండి!",
    "మనసు నమ్మేది శరీరం సాధిస్తుంది!",
    "బలమైన శరీరం, బలమైన మనసు, బలమైన జీవితం!",
    "మీ భవిష్యత్ మీకు ధన్యవాదాలు చెప్తుంది!"
  ]
};

const ACTIVITY_TYPES = [
  { value: "walking", label: { en: "Walking", te: "నడక" }, icon: <Footprints className="h-5 w-5" />, color: "bg-green-100 text-green-600", gradient: "from-green-400 to-emerald-500" },
  { value: "running", label: { en: "Running", te: "పరుగు" }, icon: <PersonStanding className="h-5 w-5" />, color: "bg-orange-100 text-orange-600", gradient: "from-orange-400 to-red-500" },
  { value: "cycling", label: { en: "Cycling", te: "సైక్లింగ్" }, icon: <Bike className="h-5 w-5" />, color: "bg-blue-100 text-blue-600", gradient: "from-blue-400 to-cyan-500" },
  { value: "yoga", label: { en: "Yoga", te: "యోగా" }, icon: <Heart className="h-5 w-5" />, color: "bg-purple-100 text-purple-600", gradient: "from-purple-400 to-pink-500" },
  { value: "gym", label: { en: "Gym", te: "జిమ్" }, icon: <Zap className="h-5 w-5" />, color: "bg-red-100 text-red-600", gradient: "from-red-400 to-rose-500" },
  { value: "swimming", label: { en: "Swimming", te: "ఈత" }, icon: <Activity className="h-5 w-5" />, color: "bg-cyan-100 text-cyan-600", gradient: "from-cyan-400 to-blue-500" },
  { value: "sports", label: { en: "Sports", te: "క్రీడలు" }, icon: <Trophy className="h-5 w-5" />, color: "bg-yellow-100 text-yellow-600", gradient: "from-yellow-400 to-orange-500" },
  { value: "dancing", label: { en: "Dancing", te: "నృత్యం" }, icon: <Sparkles className="h-5 w-5" />, color: "bg-pink-100 text-pink-600", gradient: "from-pink-400 to-rose-500" },
  { value: "hiking", label: { en: "Hiking", te: "హైకింగ్" }, icon: <MapPin className="h-5 w-5" />, color: "bg-emerald-100 text-emerald-600", gradient: "from-emerald-400 to-green-500" }
];

export default function KaizerFit() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Activity logging
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [activityType, setActivityType] = useState("walking");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [steps, setSteps] = useState("");
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, leaderRes, challengesRes, activitiesRes] = await Promise.all([
        axios.get(`${API}/fitness/dashboard`).catch(() => ({ data: null })),
        axios.get(`${API}/fitness/leaderboard`).catch(() => ({ data: [] })),
        axios.get(`${API}/fitness/challenges`).catch(() => ({ data: [] })),
        axios.get(`${API}/fitness/activities?days=7`).catch(() => ({ data: [] }))
      ]);
      
      setDashboard(dashRes.data);
      setLeaderboard(leaderRes.data);
      setChallenges(challengesRes.data);
      setActivities(activitiesRes.data);
    } catch (error) {
      console.error("Error fetching fitness data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async () => {
    if (!duration || parseInt(duration) <= 0) {
      toast.error(language === "te" ? "సమయం నమోదు చేయండి" : "Enter duration");
      return;
    }

    setLogLoading(true);
    try {
      await axios.post(`${API}/fitness/activity`, {
        activity_type: activityType,
        duration_minutes: parseInt(duration),
        distance_km: distance ? parseFloat(distance) : null,
        steps: steps ? parseInt(steps) : null,
        source: "manual"
      });
      
      toast.success(language === "te" ? "యాక్టివిటీ నమోదు చేయబడింది!" : "Activity logged!");
      setShowActivityDialog(false);
      setDuration("");
      setDistance("");
      setSteps("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to log activity");
    } finally {
      setLogLoading(false);
    }
  };

  const joinChallenge = async (challengeId) => {
    try {
      await axios.post(`${API}/fitness/challenges/${challengeId}/join`);
      toast.success(language === "te" ? "ఛాలెంజ్‌లో చేరారు!" : "Joined challenge!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to join");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "కైజర్ ఫిట్" : "Kaizer Fit"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const today = dashboard?.today || { total_steps: 0, total_calories: 0, fitness_score: 0 };

  return (
    <Layout showBackButton title={language === "te" ? "కైజర్ ఫిట్" : "Kaizer Fit"}>
      <div className="space-y-6" data-testid="kaizer-fit-expanded">
        {/* Stats Header */}
        <Card className="bg-gradient-to-br from-primary to-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Activity className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">
                    {language === "te" ? "ఈ రోజు" : "Today"}
                  </p>
                  <p className="text-3xl font-bold">
                    {today.total_steps?.toLocaleString() || 0}
                  </p>
                  <p className="text-white/80 text-sm">
                    {language === "te" ? "అడుగులు" : "steps"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold ${getScoreColor(today.fitness_score || 0)}`}>
                  {today.fitness_score || 0}
                </p>
                <p className="text-white/80 text-sm">
                  {language === "te" ? "ఫిట్‌నెస్ స్కోర్" : "Fitness Score"}
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Flame className="h-5 w-5 mx-auto mb-1" />
                <p className="font-bold">{today.total_calories || 0}</p>
                <p className="text-xs text-white/70">{language === "te" ? "కేలరీలు" : "Calories"}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Award className="h-5 w-5 mx-auto mb-1" />
                <p className="font-bold">{dashboard?.streak?.current || 0}</p>
                <p className="text-xs text-white/70">{language === "te" ? "స్ట్రీక్" : "Streak"}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Timer className="h-5 w-5 mx-auto mb-1" />
                <p className="font-bold">{today.total_duration_minutes || 0}</p>
                <p className="text-xs text-white/70">{language === "te" ? "నిమిషాలు" : "Minutes"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Log Activity Button */}
        <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
          <DialogTrigger asChild>
            <Button 
              className="w-full h-14 bg-secondary text-white rounded-xl text-lg"
              data-testid="log-activity-btn"
            >
              <Plus className="h-6 w-6 mr-2" />
              {language === "te" ? "యాక్టివిటీ నమోదు చేయండి" : "Log Activity"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {language === "te" ? "యాక్టివిటీ నమోదు" : "Log Activity"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Activity Type Selection */}
              <div className="grid grid-cols-4 gap-2">
                {ACTIVITY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setActivityType(type.value)}
                    className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                      activityType === type.value 
                        ? `${type.color} ring-2 ring-primary`
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    data-testid={`activity-type-${type.value}`}
                  >
                    {type.icon}
                    <span className="text-xs">{type.label[language]}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    {language === "te" ? "సమయం (నిమిషాలు)" : "Duration (minutes)"} *
                  </label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    className="h-12 mt-1"
                    data-testid="duration-input"
                  />
                </div>
                
                {["walking", "running", "cycling"].includes(activityType) && (
                  <>
                    <div>
                      <label className="text-sm font-medium">
                        {language === "te" ? "దూరం (కి.మీ.)" : "Distance (km)"}
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        placeholder="5.0"
                        className="h-12 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {language === "te" ? "అడుగులు" : "Steps"}
                      </label>
                      <Input
                        type="number"
                        value={steps}
                        onChange={(e) => setSteps(e.target.value)}
                        placeholder="5000"
                        className="h-12 mt-1"
                      />
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={logActivity}
                disabled={logLoading}
                className="w-full h-12 bg-primary text-white rounded-full"
                data-testid="submit-activity-btn"
              >
                {logLoading ? "..." : (language === "te" ? "నమోదు చేయండి" : "Log Activity")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pollution Alert */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">
                {language === "te" ? "కాలుష్య హెచ్చరిక" : "Pollution Alert"}
              </p>
              <p className="text-sm text-orange-700 mt-1">
                {language === "te"
                  ? "డంప్ యార్డ్ దగ్గర బయటి వ్యాయామం నివారించండి. ఉదయం 6-7 మధ్య వ్యాయామం చేయడం మంచిది."
                  : "Avoid outdoor exercise near dump yard. Best time: 6-7 AM."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="activities" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="activities" className="text-xs">
              {language === "te" ? "యాక్టివిటీ" : "Activity"}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs">
              {language === "te" ? "టాప్ 10" : "Top 10"}
            </TabsTrigger>
            <TabsTrigger value="challenges" className="text-xs">
              {language === "te" ? "ఛాలెంజ్" : "Challenge"}
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">
              {language === "te" ? "గణాంకాలు" : "Stats"}
            </TabsTrigger>
          </TabsList>

          {/* Activities Tab */}
          <TabsContent value="activities" className="mt-4 space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-text-muted">
                  {language === "te" ? "యాక్టివిటీలు ఇంకా లేవు" : "No activities yet"}
                </p>
              </div>
            ) : (
              activities.slice(0, 10).map((activity) => {
                const actType = ACTIVITY_TYPES.find(t => t.value === activity.activity_type);
                return (
                  <Card key={activity.id} className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl ${actType?.color || "bg-gray-100"} flex items-center justify-center`}>
                        {actType?.icon || <Activity className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-text-primary">
                          {actType?.label[language] || activity.activity_type}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                          <span><Timer className="h-3 w-3 inline mr-1" />{activity.duration_minutes} min</span>
                          {activity.distance_km && <span><MapPin className="h-3 w-3 inline mr-1" />{activity.distance_km} km</span>}
                          {activity.steps && <span><Footprints className="h-3 w-3 inline mr-1" />{activity.steps}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-secondary">{activity.calories_burned}</p>
                        <p className="text-xs text-text-muted">{language === "te" ? "కేలరీలు" : "cal"}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-4 space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-text-muted">{language === "te" ? "లీడర్‌బోర్డ్ ఇంకా లేదు" : "No leaderboard data"}</p>
              </div>
            ) : (
              leaderboard.map((entry, idx) => (
                <Card key={idx} className={`border-border/50 ${idx < 3 ? "bg-gradient-to-r from-amber-50 to-white" : ""}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? "bg-yellow-400 text-yellow-900" :
                      idx === 1 ? "bg-gray-300 text-gray-700" :
                      idx === 2 ? "bg-amber-600 text-amber-100" :
                      "bg-muted text-text-muted"
                    }`}>
                      {idx < 3 ? <Medal className="h-5 w-5" /> : entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{entry.name}</p>
                      {entry.colony && <p className="text-xs text-text-muted">{entry.colony}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{entry.total.toLocaleString()}</p>
                      <p className="text-xs text-text-muted">{entry.days_active} {language === "te" ? "రోజులు" : "days"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="mt-4 space-y-3">
            {challenges.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-text-muted">{language === "te" ? "ఛాలెంజ్‌లు ఇంకా లేవు" : "No challenges yet"}</p>
              </div>
            ) : (
              challenges.map((challenge) => (
                <Card key={challenge.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary">
                          {language === "te" ? challenge.name_te : challenge.name}
                        </h3>
                        <p className="text-sm text-text-muted mt-1">
                          {language === "te" ? challenge.description_te : challenge.description}
                        </p>
                      </div>
                      <Badge className="bg-primary/10 text-primary">
                        {challenge.participants} {language === "te" ? "మంది" : "joined"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Target className="h-4 w-4" />
                        {challenge.target_steps?.toLocaleString()} {language === "te" ? "అడుగులు" : "steps"}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => joinChallenge(challenge.id)}
                        className="bg-secondary text-white rounded-full"
                      >
                        {language === "te" ? "చేరండి" : "Join"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-4 space-y-4">
            {/* Monthly Stats */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {language === "te" ? "నెలవారీ గణాంకాలు" : "Monthly Stats"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {dashboard?.monthly_stats?.total_steps?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-text-muted">{language === "te" ? "మొత్తం అడుగులు" : "Total Steps"}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-secondary">
                      {dashboard?.monthly_stats?.total_calories?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-text-muted">{language === "te" ? "కేలరీలు కాల్చారు" : "Calories Burned"}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {dashboard?.monthly_stats?.total_distance_km || 0} km
                    </p>
                    <p className="text-xs text-text-muted">{language === "te" ? "దూరం" : "Distance"}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">
                      {dashboard?.monthly_stats?.total_activities || 0}
                    </p>
                    <p className="text-xs text-text-muted">{language === "te" ? "యాక్టివిటీలు" : "Activities"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Breakdown */}
            {dashboard?.activity_breakdown && Object.keys(dashboard.activity_breakdown).length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {language === "te" ? "యాక్టివిటీ విభజన" : "Activity Breakdown"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(dashboard.activity_breakdown).map(([type, data]) => {
                      const actType = ACTIVITY_TYPES.find(t => t.value === type);
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded ${actType?.color || "bg-gray-100"} flex items-center justify-center`}>
                            {actType?.icon || <Activity className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{actType?.label[language] || type}</p>
                          </div>
                          <div className="text-right text-sm">
                            <span className="font-medium">{data.count}</span>
                            <span className="text-text-muted"> | {data.calories} cal</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
