import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Watch,
  Timer,
  ChevronRight,
  Sparkles,
  History,
  Goal,
  PenSquare,
  User,
  Ruler,
  PersonStanding,
  Droplets,
  Apple,
  Utensils
} from "lucide-react";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import CalorieCounter from "../components/CalorieCounter";
import StepTracker from "../components/fitness/StepTracker";

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
  
  // Fitness Profile (Onboarding)
  const [hasProfile, setHasProfile] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    height_cm: "",
    weight_kg: "",
    gender: "",
    age: "",
    fitness_goal: "general_fitness"
  });
  
  // Manual Recording
  const [showManualRecord, setShowManualRecord] = useState(false);
  const [manualRecord, setManualRecord] = useState({
    activity_type: "walking",
    duration_minutes: "",
    date: new Date().toISOString().split("T")[0],
    distance_km: "",
    calories_burned: "",
    notes: ""
  });
  
  // Streaks & Badges
  const [streakData, setStreakData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [badgesCount, setBadgesCount] = useState({ earned: 0, total: 10 });
  const [newBadges, setNewBadges] = useState([]);
  const [showBadgesDialog, setShowBadgesDialog] = useState(false);
  const [showNewBadgeDialog, setShowNewBadgeDialog] = useState(false);
  
  // Live Activity Coming Soon
  const [showLiveComingSoon, setShowLiveComingSoon] = useState(false);
  
  // Weight tracking
  const [weightHistory, setWeightHistory] = useState([]);
  const [weightStats, setWeightStats] = useState(null);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showSetGoal, setShowSetGoal] = useState(false);
  const [showWeightDetails, setShowWeightDetails] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [weightNotes, setWeightNotes] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Water & Nutrition tracking
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [waterGoal] = useState(8);
  const [showMealDialog, setShowMealDialog] = useState(false);
  const [showCalorieCounter, setShowCalorieCounter] = useState(false);
  const [mealType, setMealType] = useState("breakfast");
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [caloriesGoal] = useState(2000);
  const [todayMeals, setTodayMeals] = useState([]);
  
  // Food search
  const [foodSearch, setFoodSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [foodCategories, setFoodCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Step tracker data (replaces deprecated Google Fit)
  const [stepTrackerData, setStepTrackerData] = useState(null);
  
  // Live activity
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    checkProfile();
  }, []);
  
  const checkProfile = async () => {
    try {
      const res = await axios.get(`${API}/fitness/profile`, { headers });
      setHasProfile(res.data.has_profile);
      if (!res.data.has_profile) {
        setShowOnboarding(true);
        setLoading(false);
      } else {
        fetchAllData();
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      fetchAllData();
    }
  };

  const submitProfile = async () => {
    if (!onboardingData.height_cm || !onboardingData.weight_kg || !onboardingData.gender || !onboardingData.age) {
      toast.error(language === "te" ? "అన్ని ఫీల్డ్‌లు అవసరం" : "All fields are required");
      return;
    }
    
    setSubmitting(true);
    try {
      await axios.post(`${API}/fitness/profile`, {
        height_cm: parseFloat(onboardingData.height_cm),
        weight_kg: parseFloat(onboardingData.weight_kg),
        gender: onboardingData.gender,
        age: parseInt(onboardingData.age),
        fitness_goal: onboardingData.fitness_goal
      }, { headers });
      
      toast.success(language === "te" ? "ప్రొఫైల్ సృష్టించబడింది!" : "Profile created!");
      setShowOnboarding(false);
      setHasProfile(true);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  };

  const submitManualRecord = async () => {
    if (!manualRecord.duration_minutes || !manualRecord.date) {
      toast.error(language === "te" ? "వ్యవధి మరియు తేదీ అవసరం" : "Duration and date are required");
      return;
    }
    
    setSubmitting(true);
    try {
      await axios.post(`${API}/fitness/record`, {
        activity_type: manualRecord.activity_type,
        duration_minutes: parseInt(manualRecord.duration_minutes),
        date: manualRecord.date,
        distance_km: manualRecord.distance_km ? parseFloat(manualRecord.distance_km) : null,
        calories_burned: manualRecord.calories_burned ? parseInt(manualRecord.calories_burned) : null,
        notes: manualRecord.notes || null
      }, { headers });
      
      toast.success(language === "te" ? "యాక్టివిటీ రికార్డ్ అయింది!" : "Activity recorded!");
      setShowManualRecord(false);
      setManualRecord({
        activity_type: "walking",
        duration_minutes: "",
        date: new Date().toISOString().split("T")[0],
        distance_km: "",
        calories_burned: "",
        notes: ""
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to record activity");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, weightRes, statsRes, streakRes, badgesRes, waterRes, mealsRes] = await Promise.all([
        axios.get(`${API}/fitness/dashboard`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/fitness/weight/history?days=30`, { headers }).catch(() => ({ data: { records: [] } })),
        axios.get(`${API}/fitness/weight/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/fitness/streaks`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/fitness/badges`, { headers }).catch(() => ({ data: { badges: [] } })),
        axios.get(`${API}/doctor/water`, { headers }).catch(() => ({ data: { glasses: 0 } })),
        axios.get(`${API}/doctor/meals`, { headers }).catch(() => ({ data: { meals: [], summary: { total_calories: 0 } } }))
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
      
      // Set water and meals data
      setWaterGlasses(waterRes.data?.glasses || 0);
      setTodayMeals(mealsRes.data?.meals || []);
      setCaloriesConsumed(mealsRes.data?.summary?.total_calories || 0);
      
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

  // Food search function
  const searchFoods = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({ q: query, limit: "15" });
      if (selectedCategory) params.append("category", selectedCategory);
      
      const res = await axios.get(`${API}/doctor/foods/search?${params}`, { headers });
      setSearchResults(res.data.foods || []);
    } catch (error) {
      console.error("Food search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (foodSearch) searchFoods(foodSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [foodSearch, selectedCategory]);

  // Fetch food categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API}/doctor/foods/categories`, { headers });
        setFoodCategories(res.data.categories || []);
      } catch (err) {
        console.error("Categories fetch error:", err);
      }
    };
    fetchCategories();
  }, []);

  // Log food from search
  const logFoodFromSearch = async (food) => {
    try {
      await axios.post(`${API}/doctor/meal`, {
        food_item: food.id,
        meal_type: mealType,
        quantity: 1
      }, { headers });
      setCaloriesConsumed(prev => prev + food.calories);
      toast.success(`${food.name} ${language === "te" ? "జోడించబడింది" : "added"} (+${food.calories} cal)`);
      setFoodSearch("");
      setSearchResults([]);
    } catch (err) {
      console.error("Food log error:", err);
      toast.error(language === "te" ? "నమోదు విఫలం" : "Failed to log");
    }
  };

  // Handle step tracker data updates
  const handleStepDataUpdate = (data) => {
    setStepTrackerData(data);
  };

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
        <div className="grid grid-cols-2 gap-3">
          {/* Live Tracking - Coming Soon */}
          <div className="relative">
            <Button
              onClick={() => setShowLiveComingSoon(true)}
              className="w-full h-14 bg-gradient-to-r from-emerald-500/70 to-teal-500/70 hover:from-emerald-500/80 hover:to-teal-500/80 text-white rounded-2xl text-sm font-semibold shadow-lg transition-all active:scale-[0.98] border-2 border-dashed border-emerald-300"
              data-testid="start-live-activity-btn"
            >
              <Play className="h-5 w-5 mr-2" />
              {language === "te" ? "లైవ్ ట్రాకింగ్" : "Start Live"}
            </Button>
            {/* Coming Soon Badge */}
            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg">
              <span className="text-[9px] font-bold text-white">SOON</span>
            </div>
          </div>
          <Button
            onClick={() => setShowManualRecord(true)}
            variant="outline"
            className="h-14 rounded-2xl text-sm font-semibold border-2 hover:bg-primary/5"
            data-testid="record-fitness-btn"
          >
            <PenSquare className="h-5 w-5 mr-2" />
            {language === "te" ? "నమోదు చేయండి" : "Record Fitness"}
          </Button>
        </div>

        {/* Step Counter - Coming Soon Notice */}
        <div className="relative mt-2">
          <div 
            onClick={() => setShowLiveComingSoon(true)}
            className="cursor-pointer"
          >
            <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Footprints className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-blue-400">0</p>
                      <p className="text-xs text-blue-300">
                        {language === 'te' ? 'అడుగులు' : 'steps today'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                    {language === "te" ? "త్వరలో" : "Coming Soon"}
                  </Badge>
                </div>
                <p className="text-xs text-center text-blue-400 mt-3">
                  {language === "te" 
                    ? "స్టెప్ కౌంటర్ ఏప్రిల్ 7న లాంచ్ అవుతుంది" 
                    : "Step counter launching April 7th"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

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
                {badgesCount.earned}
              </p>
              <p className="text-purple-100 text-xs mt-1">
                / {badgesCount.total} {language === "te" ? "సంపాదించారు" : "earned"}
              </p>
              <div className="mt-2 flex -space-x-2">
                {badges.filter(b => b.earned).slice(0, 4).map((badge, i) => (
                  <div key={badge.id || i} className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                    {badge.icon}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Water & Nutrition Tracking */}
        <div className="grid grid-cols-2 gap-3">
          {/* Water Tracking */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white overflow-hidden">
            <CardContent className="p-4 relative">
              <div className="absolute -right-4 -top-4 text-6xl opacity-20 pointer-events-none">💧</div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-cyan-100 text-xs font-medium uppercase tracking-wide">
                  {language === "te" ? "నీరు" : "Water"}
                </p>
                <button 
                  onClick={async () => {
                    try {
                      const res = await axios.post(`${API}/doctor/water`, { glasses: 1 }, { headers });
                      setWaterGlasses(res.data.glasses);
                      toast.success(language === "te" ? "నీరు నమోదు అయింది!" : "Water logged!");
                    } catch (err) {
                      console.error("Water log error:", err);
                      toast.error(language === "te" ? "నమోదు విఫలం" : "Failed to log");
                    }
                  }}
                  className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  data-testid="log-water-btn"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-3xl font-bold">{waterGlasses}/{waterGoal}</p>
              <p className="text-cyan-100 text-xs">{language === "te" ? "గ్లాసులు" : "glasses"}</p>
              <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/70 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (waterGlasses / waterGoal) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Calories Tracking */}
          <Card 
            className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setShowCalorieCounter(true)}
          >
            <CardContent className="p-4 relative">
              <div className="absolute -right-4 -top-4 text-6xl opacity-20 pointer-events-none">🍎</div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">
                  {language === "te" ? "కేలరీలు" : "Calories"}
                </p>
                <div 
                  className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"
                  data-testid="log-meal-btn"
                >
                  <Plus className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-bold">{caloriesConsumed}</p>
              <p className="text-orange-100 text-xs">/ {caloriesGoal} {language === "te" ? "కేల్" : "kcal"}</p>
              <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/70 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (caloriesConsumed / caloriesGoal) * 100)}%` }}
                />
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
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* BMI & Change Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* BMI Card */}
            <Card className={`border-0 shadow-md ${
              weightStats?.bmi_category === "Normal" ? "bg-gradient-to-br from-green-50 to-emerald-50" :
              weightStats?.bmi_category === "Underweight" ? "bg-gradient-to-br from-yellow-50 to-amber-50" :
              "bg-gradient-to-br from-orange-50 to-red-50"
            }`}>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  BMI
                </p>
                <p className={`text-2xl font-bold mt-1 ${
                  weightStats?.bmi_category === "Normal" ? "text-green-600" :
                  weightStats?.bmi_category === "Underweight" ? "text-yellow-600" :
                  "text-orange-600"
                }`}>
                  {weightStats?.bmi || "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">{weightStats?.bmi_category || ""}</p>
              </CardContent>
            </Card>
            
            {/* Change Card */}
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
                <p className="text-[10px] text-muted-foreground">kg total</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Stats */}
          {(weightStats?.weekly_avg || weightStats?.weekly_change !== null) && (
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Weekly Avg</p>
                    <p className="text-lg font-bold">{weightStats?.weekly_avg || "—"} kg</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200" />
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase">This Week</p>
                    <p className={`text-lg font-bold ${
                      weightStats?.weekly_change < 0 ? "text-green-600" :
                      weightStats?.weekly_change > 0 ? "text-orange-600" : ""
                    }`}>
                      {weightStats?.weekly_change > 0 ? "+" : ""}{weightStats?.weekly_change || "0"} kg
                    </p>
                  </div>
                  <div className="h-8 w-px bg-gray-200" />
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Trend</p>
                    <Badge variant={weightStats?.trend === "losing" ? "success" : weightStats?.trend === "gaining" ? "destructive" : "secondary"} className="text-[10px]">
                      {weightStats?.trend === "losing" ? "↓ Losing" : 
                       weightStats?.trend === "gaining" ? "↑ Gaining" : "→ Stable"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

      {/* Fitness Profile Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={(open) => { if(hasProfile) setShowOnboarding(open); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {language === "te" ? "ఫిట్‌నెస్ ప్రొఫైల్ సెటప్" : "Fitness Profile Setup"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {language === "te" 
                ? "ఫిట్‌నెస్ ఫీచర్‌లను ఉపయోగించడానికి మీ వివరాలను నమోదు చేయండి"
                : "Please enter your details to use fitness features"}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{language === "te" ? "ఎత్తు (సెం.మీ)" : "Height (cm)"} *</Label>
                <Input
                  type="number"
                  placeholder="170"
                  value={onboardingData.height_cm}
                  onChange={(e) => setOnboardingData({...onboardingData, height_cm: e.target.value})}
                  className="h-11"
                  data-testid="onboard-height"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{language === "te" ? "బరువు (కిలోలు)" : "Weight (kg)"} *</Label>
                <Input
                  type="number"
                  placeholder="70"
                  value={onboardingData.weight_kg}
                  onChange={(e) => setOnboardingData({...onboardingData, weight_kg: e.target.value})}
                  className="h-11"
                  data-testid="onboard-weight"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{language === "te" ? "లింగం" : "Gender"} *</Label>
                <Select value={onboardingData.gender} onValueChange={(v) => setOnboardingData({...onboardingData, gender: v})}>
                  <SelectTrigger className="h-11" data-testid="onboard-gender">
                    <SelectValue placeholder={language === "te" ? "ఎంచుకోండి" : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{language === "te" ? "పురుషుడు" : "Male"}</SelectItem>
                    <SelectItem value="female">{language === "te" ? "స్త్రీ" : "Female"}</SelectItem>
                    <SelectItem value="other">{language === "te" ? "ఇతర" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{language === "te" ? "వయస్సు" : "Age"} *</Label>
                <Input
                  type="number"
                  placeholder="25"
                  value={onboardingData.age}
                  onChange={(e) => setOnboardingData({...onboardingData, age: e.target.value})}
                  className="h-11"
                  data-testid="onboard-age"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">{language === "te" ? "ఫిట్‌నెస్ లక్ష్యం" : "Fitness Goal"}</Label>
              <Select value={onboardingData.fitness_goal} onValueChange={(v) => setOnboardingData({...onboardingData, fitness_goal: v})}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">{language === "te" ? "బరువు తగ్గడం" : "Weight Loss"}</SelectItem>
                  <SelectItem value="muscle_gain">{language === "te" ? "కండరాల పెంపు" : "Muscle Gain"}</SelectItem>
                  <SelectItem value="maintain">{language === "te" ? "నిర్వహించడం" : "Maintain Weight"}</SelectItem>
                  <SelectItem value="general_fitness">{language === "te" ? "సాధారణ ఫిట్‌నెస్" : "General Fitness"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={submitProfile}
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-purple-600"
              data-testid="submit-profile-btn"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {language === "te" ? "సేవ్ చేస్తోంది..." : "Saving..."}
                </span>
              ) : (
                language === "te" ? "ప్రారంభించండి" : "Get Started"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Record Dialog */}
      <Dialog open={showManualRecord} onOpenChange={setShowManualRecord}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenSquare className="h-5 w-5 text-primary" />
              {language === "te" ? "యాక్టివిటీ రికార్డ్ చేయండి" : "Record Activity"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">{language === "te" ? "యాక్టివిటీ రకం" : "Activity Type"} *</Label>
              <Select value={manualRecord.activity_type} onValueChange={(v) => setManualRecord({...manualRecord, activity_type: v})}>
                <SelectTrigger className="h-11" data-testid="record-activity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIVE_ACTIVITIES.map((act) => (
                    <SelectItem key={act.id} value={act.id}>
                      {act.icon} {language === "te" ? act.name_te : act.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{language === "te" ? "వ్యవధి (నిమిషాలు)" : "Duration (min)"} *</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={manualRecord.duration_minutes}
                  onChange={(e) => setManualRecord({...manualRecord, duration_minutes: e.target.value})}
                  className="h-11"
                  data-testid="record-duration"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{language === "te" ? "తేదీ" : "Date"} *</Label>
                <Input
                  type="date"
                  value={manualRecord.date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setManualRecord({...manualRecord, date: e.target.value})}
                  className="h-11"
                  data-testid="record-date"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{language === "te" ? "దూరం (కి.మీ)" : "Distance (km)"}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="5.0"
                  value={manualRecord.distance_km}
                  onChange={(e) => setManualRecord({...manualRecord, distance_km: e.target.value})}
                  className="h-11"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{language === "te" ? "కేలరీలు" : "Calories"}</Label>
                <Input
                  type="number"
                  placeholder="Auto"
                  value={manualRecord.calories_burned}
                  onChange={(e) => setManualRecord({...manualRecord, calories_burned: e.target.value})}
                  className="h-11"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">{language === "te" ? "నోట్స్" : "Notes"}</Label>
              <Input
                placeholder={language === "te" ? "ఐచ్ఛిక నోట్స్..." : "Optional notes..."}
                value={manualRecord.notes}
                onChange={(e) => setManualRecord({...manualRecord, notes: e.target.value})}
                className="h-11"
              />
            </div>
            
            <Button
              onClick={submitManualRecord}
              disabled={submitting}
              className="w-full h-12 rounded-xl"
              data-testid="submit-record-btn"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {language === "te" ? "సేవ్ చేస్తోంది..." : "Saving..."}
                </span>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "te" ? "రికార్డ్ చేయండి" : "Record Activity"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meal Logging Dialog with Food Search */}
      <Dialog open={showMealDialog} onOpenChange={(open) => {
        setShowMealDialog(open);
        if (!open) {
          setFoodSearch("");
          setSearchResults([]);
        }
      }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-orange-500" />
              {language === "te" ? "భోజనం నమోదు" : "Log Meal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Meal Type Selection */}
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">{language === "te" ? "🌅 అల్పాహారం" : "🌅 Breakfast"}</SelectItem>
                <SelectItem value="lunch">{language === "te" ? "☀️ భోజనం" : "☀️ Lunch"}</SelectItem>
                <SelectItem value="snacks">{language === "te" ? "🍿 స్నాక్స్" : "🍿 Snacks"}</SelectItem>
                <SelectItem value="dinner">{language === "te" ? "🌙 రాత్రి భోజనం" : "🌙 Dinner"}</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Food Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === "te" ? "🔍 ఆహారం వెతకండి (500+ ఆహారాలు)" : "🔍 Search Food (500+ foods)"}
              </Label>
              <Input
                type="text"
                placeholder={language === "te" ? "బిర్యానీ, దోస, ఆపిల్..." : "biryani, dosa, apple..."}
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                className="h-11"
                data-testid="food-search-input"
              />
              
              {/* Category Filter */}
              {foodCategories.length > 0 && (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={language === "te" ? "అన్ని రకాలు" : "All categories"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{language === "te" ? "అన్ని రకాలు" : "All categories"}</SelectItem>
                    {foodCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Search Results */}
              {searchLoading && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {language === "te" ? "వెతుకుతోంది..." : "Searching..."}
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2 bg-muted/30">
                  {searchResults.map(food => (
                    <button
                      key={food.id}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors text-left"
                      onClick={() => logFoodFromSearch(food)}
                    >
                      <div>
                        <p className="font-medium text-sm">{food.name}</p>
                        <p className="text-xs text-muted-foreground">{food.name_te} • {food.serving}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-orange-600">{food.calories} cal</p>
                        <p className="text-[10px] text-muted-foreground">
                          P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {foodSearch && !searchLoading && searchResults.length === 0 && (
                <p className="text-center py-2 text-muted-foreground text-sm">
                  {language === "te" ? "ఫలితాలు లేవు" : "No results found"}
                </p>
              )}
            </div>
            
            {/* Quick Add Calories */}
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">
                {language === "te" ? "త్వరిత కేలరీ జోడించండి:" : "Quick add calories:"}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[100, 200, 300, 500].map(cal => (
                  <Button
                    key={cal}
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={async () => {
                      try {
                        await axios.post(`${API}/doctor/meal`, {
                          food_item: "custom",
                          meal_type: mealType,
                          quantity: 1,
                          custom_calories: cal
                        }, { headers });
                        setCaloriesConsumed(prev => prev + cal);
                        toast.success(`+${cal} cal`);
                        setShowMealDialog(false);
                      } catch (err) {
                        toast.error(language === "te" ? "నమోదు విఫలం" : "Failed");
                      }
                    }}
                  >
                    +{cal}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Popular Foods */}
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">
                {language === "te" ? "ప్రసిద్ధ ఆహారాలు:" : "Popular foods:"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "idli", name: language === "te" ? "ఇడ్లీ (2)" : "Idli (2)", cal: 78 },
                  { id: "dosa", name: language === "te" ? "దోస" : "Dosa", cal: 168 },
                  { id: "rice", name: language === "te" ? "అన్నం" : "Rice", cal: 130 },
                  { id: "chicken_biryani", name: language === "te" ? "చికెన్ బిర్యానీ" : "Chicken Biryani", cal: 350 },
                  { id: "roti", name: language === "te" ? "రోటీ (2)" : "Roti (2)", cal: 142 },
                  { id: "samosa", name: language === "te" ? "సమోసా" : "Samosa", cal: 150 },
                  { id: "chai", name: language === "te" ? "చాయ్" : "Tea", cal: 40 },
                  { id: "banana", name: language === "te" ? "అరటిపండు" : "Banana", cal: 105 }
                ].map(food => (
                  <Button
                    key={food.id}
                    variant="outline"
                    size="sm"
                    className="h-9 justify-between text-xs"
                    onClick={async () => {
                      try {
                        await axios.post(`${API}/doctor/meal`, {
                          food_item: food.id,
                          meal_type: mealType,
                          quantity: food.id === "idli" || food.id === "roti" ? 2 : 1
                        }, { headers });
                        setCaloriesConsumed(prev => prev + food.cal);
                        toast.success(`${food.name} (+${food.cal})`);
                        setShowMealDialog(false);
                      } catch (err) {
                        toast.error(language === "te" ? "నమోదు విఫలం" : "Failed");
                      }
                    }}
                  >
                    <span className="truncate">{food.name}</span>
                    <span className="text-orange-600 ml-1">{food.cal}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Calorie Counter Full Dialog */}
      <Dialog open={showCalorieCounter} onOpenChange={setShowCalorieCounter}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <CalorieCounter 
            onClose={() => {
              setShowCalorieCounter(false);
              fetchNutritionData(); // Refresh data
            }}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
