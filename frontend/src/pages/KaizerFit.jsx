import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import {
  Activity,
  Footprints,
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
  Plus,
  Play,
  Scale,
  Calendar,
  Award,
  Zap,
  Heart,
  Timer,
  ChevronRight,
  Sparkles,
  History,
  Goal
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Activity types for live tracking
const LIVE_ACTIVITIES = [
  { id: "running", name_en: "Running", name_te: "పరుగు", icon: "🏃", color: "from-orange-500 to-red-500" },
  { id: "walking", name_en: "Walking", name_te: "నడక", icon: "🚶", color: "from-green-500 to-emerald-500" },
  { id: "cycling", name_en: "Cycling", name_te: "సైక్లింగ్", icon: "🚴", color: "from-blue-500 to-cyan-500" },
  { id: "yoga", name_en: "Yoga", name_te: "యోగా", icon: "🧘", color: "from-purple-500 to-pink-500" },
  { id: "gym", name_en: "Gym", name_te: "జిమ్", icon: "💪", color: "from-red-500 to-rose-500" },
  { id: "swimming", name_en: "Swimming", name_te: "ఈత", icon: "🏊", color: "from-cyan-500 to-blue-500" },
];

export default function KaizerFit() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // Dashboard data
  const [todayStats, setTodayStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Streaks & Badges
  const [streakData, setStreakData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [badgesCount, setBadgesCount] = useState({ earned: 0, total: 10 });
  const [newBadges, setNewBadges] = useState([]);
  const [showBadgesDialog, setShowBadgesDialog] = useState(false);
  const [showNewBadgeDialog, setShowNewBadgeDialog] = useState(false);
  
  // Weight tracking
  const [weightHistory, setWeightHistory] = useState([]);
  const [weightStats, setWeightStats] = useState(null);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showSetGoal, setShowSetGoal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Live activity
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, weightRes, statsRes, streakRes, badgesRes] = await Promise.all([
        axios.get(`${API}/fitness/dashboard`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/fitness/weight/history?days=30`, { headers }).catch(() => ({ data: { records: [] } })),
        axios.get(`${API}/fitness/weight/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/fitness/streaks`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/fitness/badges`, { headers }).catch(() => ({ data: { badges: [] } }))
      ]);
      
      setTodayStats(dashRes.data);
      setWeightHistory(weightRes.data?.records || []);
      setWeightStats(statsRes.data);
      setStreakData(streakRes.data);
      setBadges(badgesRes.data?.badges || []);
      setBadgesCount({
        earned: badgesRes.data?.earned_count || 0,
        total: badgesRes.data?.total_count || 10
      });
      
      if (statsRes.data?.goal_weight) {
        setGoalWeight(statsRes.data.goal_weight.toString());
      }
      
      // Check for new badges
      const checkRes = await axios.post(`${API}/fitness/badges/check`, {}, { headers }).catch(() => ({ data: { new_badges: [] } }));
      if (checkRes.data?.new_badges?.length > 0) {
        setNewBadges(checkRes.data.new_badges);
        setShowNewBadgeDialog(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logWeight = async () => {
    if (!newWeight || parseFloat(newWeight) <= 0) {
      toast.error(language === "te" ? "సరైన బరువు నమోదు చేయండి" : "Enter valid weight");
      return;
    }
    
    setSubmitting(true);
    try {
      await axios.post(`${API}/fitness/weight`, { weight_kg: parseFloat(newWeight) }, { headers });
      toast.success(language === "te" ? "బరువు నమోదు అయింది!" : "Weight logged!");
      setShowAddWeight(false);
      setNewWeight("");
      fetchAllData();
    } catch (error) {
      toast.error(language === "te" ? "నమోదు విఫలమైంది" : "Failed to log");
    } finally {
      setSubmitting(false);
    }
  };

  const setWeightGoal = async () => {
    if (!goalWeight || parseFloat(goalWeight) <= 0) {
      toast.error(language === "te" ? "సరైన లక్ష్యం నమోదు చేయండి" : "Enter valid goal");
      return;
    }
    
    setSubmitting(true);
    try {
      await axios.post(`${API}/fitness/weight/goal`, { target_weight_kg: parseFloat(goalWeight) }, { headers });
      toast.success(language === "te" ? "లక్ష్యం సెట్ అయింది!" : "Goal set!");
      setShowSetGoal(false);
      fetchAllData();
    } catch (error) {
      toast.error(language === "te" ? "సెట్ చేయడం విఫలమైంది" : "Failed to set goal");
    } finally {
      setSubmitting(false);
    }
  };

  // Format weight chart data
  const chartData = weightHistory.map(w => ({
    date: new Date(w.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    weight: w.weight_kg,
    goal: weightStats?.goal_weight || null
  }));

  // Current stats
  const currentWeight = weightStats?.current_weight || user?.health_profile?.weight_kg || 0;
  const startWeight = weightStats?.starting_weight || currentWeight;
  const targetWeight = weightStats?.goal_weight;
  const weightChange = weightStats?.total_change || 0;
  const progressPercent = weightStats?.progress_to_goal || 0;

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "కైజర్ ఫిట్" : "Kaizer Fit"}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">{language === "te" ? "లోడ్ అవుతోంది..." : "Loading..."}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "కైజర్ ఫిట్" : "Kaizer Fit"}>
      <div className="space-y-5 pb-6" data-testid="kaizer-fit-page">
        
        {/* Hero Stats Card */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <CardContent className="p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-200 text-sm font-medium">
                  {language === "te" ? "ఈ రోజు" : "Today"}
                </p>
                <p className="text-3xl font-bold mt-1">
                  {todayStats?.steps?.toLocaleString() || "0"}
                </p>
                <p className="text-blue-200 text-sm">{language === "te" ? "అడుగులు" : "steps"}</p>
              </div>
              <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Footprints className="h-10 w-10 text-white/90" />
              </div>
            </div>
            
            {/* Mini stats row */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/20">
              <div className="text-center">
                <Flame className="h-5 w-5 mx-auto text-orange-300" />
                <p className="text-lg font-bold mt-1">{todayStats?.calories || 0}</p>
                <p className="text-[10px] text-blue-200">{language === "te" ? "కేలరీలు" : "Calories"}</p>
              </div>
              <div className="text-center">
                <Activity className="h-5 w-5 mx-auto text-green-300" />
                <p className="text-lg font-bold mt-1">{todayStats?.distance_km?.toFixed(1) || "0"}</p>
                <p className="text-[10px] text-blue-200">{language === "te" ? "కి.మీ" : "km"}</p>
              </div>
              <div className="text-center">
                <Timer className="h-5 w-5 mx-auto text-purple-300" />
                <p className="text-lg font-bold mt-1">{todayStats?.active_minutes || 0}</p>
                <p className="text-[10px] text-blue-200">{language === "te" ? "నిమిషాలు" : "min"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Live Activity Button */}
        <Button
          onClick={() => setShowActivityPicker(true)}
          className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl text-base font-semibold shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
          data-testid="start-live-activity-btn"
        >
          <Play className="h-5 w-5 mr-2" />
          {language === "te" ? "లైవ్ యాక్టివిటీ ప్రారంభించండి" : "Start Live Activity"}
        </Button>

        {/* Streak & Badges Section */}
        <div className="grid grid-cols-2 gap-3">
          {/* Streak Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white overflow-hidden">
            <CardContent className="p-4 relative">
              <div className="absolute -right-4 -top-4 text-6xl opacity-20">🔥</div>
              <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">
                {language === "te" ? "స్ట్రీక్" : "Streak"}
              </p>
              <p className="text-4xl font-bold mt-1">
                {streakData?.current_streak || 0}
              </p>
              <p className="text-orange-100 text-xs mt-1">
                {language === "te" ? "రోజులు" : "days"}
              </p>
              {streakData?.current_streak > 0 && (
                <div className="mt-2 text-[10px] text-orange-100">
                  🏆 {language === "te" ? "అత్యధిక" : "Best"}: {streakData?.longest_streak || 0}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Badges Card */}
          <Card 
            className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setShowBadgesDialog(true)}
            data-testid="badges-card"
          >
            <CardContent className="p-4 relative">
              <div className="absolute -right-4 -top-4 text-6xl opacity-20">🏅</div>
              <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">
                {language === "te" ? "బ్యాడ్జిలు" : "Badges"}
              </p>
              <p className="text-4xl font-bold mt-1">
                {badges.filter(b => b.earned).length}
              </p>
              <p className="text-purple-100 text-xs mt-1">
                / {badges.length} {language === "te" ? "సంపాదించారు" : "earned"}
              </p>
              <div className="mt-2 flex -space-x-2">
                {badges.filter(b => b.earned).slice(0, 4).map((badge, i) => (
                  <div key={badge.id} className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                    {badge.icon}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weight Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              {language === "te" ? "బరువు ట్రాకర్" : "Weight Tracker"}
            </h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSetGoal(true)}
                className="h-8 text-xs rounded-full"
              >
                <Target className="h-3.5 w-3.5 mr-1" />
                {language === "te" ? "లక్ష్యం" : "Goal"}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddWeight(true)}
                className="h-8 text-xs rounded-full bg-primary"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {language === "te" ? "నమోదు" : "Log"}
              </Button>
            </div>
          </div>

          {/* Weight Overview Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  {language === "te" ? "ప్రస్తుతం" : "Current"}
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {currentWeight || "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">kg</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  {language === "te" ? "లక్ష్యం" : "Goal"}
                </p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {targetWeight || "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">kg</p>
              </CardContent>
            </Card>
            
            <Card className={`border-0 shadow-md ${weightChange < 0 ? "bg-gradient-to-br from-green-50 to-emerald-50" : weightChange > 0 ? "bg-gradient-to-br from-orange-50 to-red-50" : "bg-gradient-to-br from-gray-50 to-slate-50"}`}>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  {language === "te" ? "మార్పు" : "Change"}
                </p>
                <p className={`text-2xl font-bold mt-1 flex items-center justify-center gap-1 ${weightChange < 0 ? "text-green-600" : weightChange > 0 ? "text-orange-600" : "text-slate-600"}`}>
                  {weightChange < 0 && <TrendingDown className="h-4 w-4" />}
                  {weightChange > 0 && <TrendingUp className="h-4 w-4" />}
                  {Math.abs(weightChange) || "0"}
                </p>
                <p className="text-[10px] text-muted-foreground">kg</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress to Goal */}
          {targetWeight && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {language === "te" ? "లక్ష్యం వైపు పురోగతి" : "Progress to Goal"}
                  </span>
                  <span className="text-sm font-bold text-primary">{progressPercent}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {currentWeight} kg → {targetWeight} kg
                </p>
              </CardContent>
            </Card>
          )}

          {/* Weight Chart */}
          {chartData.length > 1 && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    {language === "te" ? "30 రోజుల చరిత్ర" : "30-Day History"}
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    {chartData.length} {language === "te" ? "ఎంట్రీలు" : "entries"}
                  </Badge>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <YAxis 
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`${value} kg`, language === "te" ? "బరువు" : "Weight"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#3B82F6" 
                        strokeWidth={2.5}
                        fill="url(#weightGradient)"
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#3B82F6' }}
                      />
                      {targetWeight && (
                        <Line 
                          type="monotone" 
                          dataKey="goal" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {targetWeight && (
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-blue-500 rounded" />
                      <span className="text-muted-foreground">{language === "te" ? "బరువు" : "Weight"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-emerald-500 rounded" style={{ borderStyle: 'dashed' }} />
                      <span className="text-muted-foreground">{language === "te" ? "లక్ష్యం" : "Goal"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No data message */}
          {chartData.length <= 1 && (
            <Card className="border-dashed border-2">
              <CardContent className="p-6 text-center">
                <Scale className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="font-medium text-muted-foreground">
                  {language === "te" ? "బరువు చరిత్ర లేదు" : "No weight history yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "te" ? "పురోగతి చూడటానికి బరువు నమోదు చేయండి" : "Log your weight to see progress"}
                </p>
                <Button
                  onClick={() => setShowAddWeight(true)}
                  className="mt-4"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {language === "te" ? "మొదటి బరువు నమోదు" : "Log First Weight"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {language === "te" ? "ఈ వారం" : "This Week"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {todayStats?.weekly_steps?.toLocaleString() || "0"} {language === "te" ? "అడుగులు" : "steps"} • {todayStats?.weekly_calories || 0} {language === "te" ? "కేలరీలు" : "cal"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Add Weight Dialog */}
      <Dialog open={showAddWeight} onOpenChange={setShowAddWeight}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              {language === "te" ? "బరువు నమోదు చేయండి" : "Log Weight"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {language === "te" ? "బరువు (kg)" : "Weight (kg)"}
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="72.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="text-center text-2xl h-14 font-bold"
                data-testid="weight-input"
              />
            </div>
            <Button
              onClick={logWeight}
              disabled={submitting}
              className="w-full h-12 rounded-xl"
              data-testid="log-weight-btn"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {language === "te" ? "నమోదు చేస్తోంది..." : "Logging..."}
                </span>
              ) : (
                language === "te" ? "నమోదు చేయండి" : "Log Weight"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Goal Dialog */}
      <Dialog open={showSetGoal} onOpenChange={setShowSetGoal}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {language === "te" ? "లక్ష్య బరువు సెట్ చేయండి" : "Set Goal Weight"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {language === "te" ? "లక్ష్య బరువు (kg)" : "Target Weight (kg)"}
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="68.0"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                className="text-center text-2xl h-14 font-bold"
                data-testid="goal-weight-input"
              />
            </div>
            {currentWeight > 0 && goalWeight && (
              <p className="text-sm text-center text-muted-foreground">
                {currentWeight > parseFloat(goalWeight) 
                  ? `${(currentWeight - parseFloat(goalWeight)).toFixed(1)} kg ${language === "te" ? "తగ్గించాలి" : "to lose"}`
                  : `${(parseFloat(goalWeight) - currentWeight).toFixed(1)} kg ${language === "te" ? "పెరగాలి" : "to gain"}`
                }
              </p>
            )}
            <Button
              onClick={setWeightGoal}
              disabled={submitting}
              className="w-full h-12 rounded-xl"
              data-testid="set-goal-btn"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {language === "te" ? "సెట్ చేస్తోంది..." : "Setting..."}
                </span>
              ) : (
                language === "te" ? "లక్ష్యం సెట్ చేయండి" : "Set Goal"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Picker Dialog */}
      <Dialog open={showActivityPicker} onOpenChange={setShowActivityPicker}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              {language === "te" ? "యాక్టివిటీ ఎంచుకోండి" : "Select Activity"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {LIVE_ACTIVITIES.map((activity) => (
              <button
                key={activity.id}
                onClick={() => {
                  setShowActivityPicker(false);
                  navigate(`/live-activity/${activity.id}`);
                }}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 bg-gradient-to-br ${activity.color} text-white shadow-lg active:scale-95 transition-transform`}
                data-testid={`activity-${activity.id}`}
              >
                <span className="text-2xl">{activity.icon}</span>
                <span className="text-xs font-medium">
                  {language === "te" ? activity.name_te : activity.name_en}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* All Badges Dialog */}
      <Dialog open={showBadgesDialog} onOpenChange={setShowBadgesDialog}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {language === "te" ? "బ్యాడ్జిలు" : "Badges"}
              <Badge variant="secondary" className="ml-auto">
                {badges.filter(b => b.earned).length}/{badges.length}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className={`p-3 rounded-xl flex items-center gap-3 transition-all ${
                  badge.earned 
                    ? `bg-gradient-to-r ${badge.color} text-white shadow-lg` 
                    : "bg-muted/50 opacity-60"
                }`}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${
                  badge.earned ? "bg-white/20" : "bg-muted"
                }`}>
                  {badge.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${badge.earned ? "" : "text-muted-foreground"}`}>
                    {language === "te" ? badge.name_te : badge.name}
                  </p>
                  <p className={`text-xs ${badge.earned ? "text-white/80" : "text-muted-foreground"}`}>
                    {language === "te" ? badge.description_te : badge.description}
                  </p>
                </div>
                {badge.earned && (
                  <div className="text-2xl">✅</div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Badge Celebration Dialog */}
      <Dialog open={showNewBadgeDialog} onOpenChange={setShowNewBadgeDialog}>
        <DialogContent className="max-w-xs rounded-2xl text-center">
          <div className="py-4">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-xl font-bold mb-2">
              {language === "te" ? "అభినందనలు!" : "Congratulations!"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === "te" ? "మీరు కొత్త బ్యాడ్జి(లు) సంపాదించారు!" : "You've earned new badge(s)!"}
            </p>
            <div className="space-y-3">
              {newBadges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`p-4 rounded-xl bg-gradient-to-r ${badge.color} text-white shadow-lg`}
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-bold">
                    {language === "te" ? badge.name_te : badge.name}
                  </p>
                  <p className="text-xs text-white/80 mt-1">
                    {language === "te" ? badge.description_te : badge.description}
                  </p>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowNewBadgeDialog(false)}
              className="mt-4 w-full"
            >
              {language === "te" ? "అద్భుతం!" : "Awesome!"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
