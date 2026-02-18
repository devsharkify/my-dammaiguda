import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Stethoscope,
  Apple,
  Droplets,
  Moon,
  Heart,
  Brain,
  Scale,
  Ruler,
  Activity,
  Plus,
  TrendingUp,
  AlertCircle,
  Smile,
  Frown,
  Meh,
  Zap,
  Clock,
  Utensils,
  Search
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MOODS = [
  { value: "happy", label: { en: "Happy", te: "సంతోషం" }, icon: <Smile className="h-5 w-5" />, color: "bg-green-100 text-green-600" },
  { value: "calm", label: { en: "Calm", te: "శాంతం" }, icon: <Meh className="h-5 w-5" />, color: "bg-blue-100 text-blue-600" },
  { value: "energetic", label: { en: "Energetic", te: "శక్తివంతం" }, icon: <Zap className="h-5 w-5" />, color: "bg-yellow-100 text-yellow-600" },
  { value: "stressed", label: { en: "Stressed", te: "ఒత్తిడి" }, icon: <AlertCircle className="h-5 w-5" />, color: "bg-orange-100 text-orange-600" },
  { value: "anxious", label: { en: "Anxious", te: "ఆందోళన" }, icon: <Heart className="h-5 w-5" />, color: "bg-red-100 text-red-600" },
  { value: "sad", label: { en: "Sad", te: "విచారం" }, icon: <Frown className="h-5 w-5" />, color: "bg-purple-100 text-purple-600" }
];

export default function KaizerDoctor() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [foods, setFoods] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Water tracking
  const [waterGlasses, setWaterGlasses] = useState(0);
  
  // Meal logging
  const [showMealDialog, setShowMealDialog] = useState(false);
  const [mealType, setMealType] = useState("breakfast");
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [foodSearch, setFoodSearch] = useState("");
  
  // Health metrics
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  
  // Mood logging
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState(5);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, metricsRes, nutritionRes, foodsRes, plansRes, waterRes] = await Promise.all([
        axios.get(`${API}/doctor/dashboard`).catch(() => ({ data: null })),
        axios.get(`${API}/doctor/health-metrics`).catch(() => ({ data: null })),
        axios.get(`${API}/doctor/nutrition-summary`).catch(() => ({ data: null })),
        axios.get(`${API}/doctor/food-database`).catch(() => ({ data: [] })),
        axios.get(`${API}/doctor/diet-plans`).catch(() => ({ data: [] })),
        axios.get(`${API}/doctor/water`).catch(() => ({ data: { glasses: 0 } }))
      ]);
      
      setDashboard(dashRes.data);
      setHealthMetrics(metricsRes.data);
      setNutritionSummary(nutritionRes.data);
      setFoods(foodsRes.data);
      setDietPlans(plansRes.data);
      setWaterGlasses(waterRes.data?.glasses || 0);
    } catch (error) {
      console.error("Error fetching doctor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logWater = async () => {
    try {
      const res = await axios.post(`${API}/doctor/water`, { glasses: 1 });
      setWaterGlasses(res.data.glasses);
      toast.success(language === "te" ? "నీరు నమోదు చేయబడింది!" : "Water logged!");
    } catch (error) {
      toast.error("Failed to log water");
    }
  };

  const logMeal = async () => {
    if (selectedFoods.length === 0) {
      toast.error(language === "te" ? "ఆహారం ఎంచుకోండి" : "Select food items");
      return;
    }

    try {
      const totalCalories = selectedFoods.reduce((sum, f) => sum + f.calories, 0);
      await axios.post(`${API}/doctor/meal`, {
        meal_type: mealType,
        food_items: selectedFoods,
        total_calories: totalCalories
      });
      
      toast.success(language === "te" ? "భోజనం నమోదు చేయబడింది!" : "Meal logged!");
      setShowMealDialog(false);
      setSelectedFoods([]);
      fetchData();
    } catch (error) {
      toast.error("Failed to log meal");
    }
  };

  const updateHealthMetrics = async () => {
    try {
      await axios.post(`${API}/doctor/health-metrics`, {
        weight_kg: weight ? parseFloat(weight) : null,
        height_cm: height ? parseFloat(height) : null,
        blood_sugar: bloodSugar ? parseFloat(bloodSugar) : null
      });
      
      toast.success(language === "te" ? "ఆరోగ్య వివరాలు నవీకరించబడ్డాయి!" : "Health metrics updated!");
      setShowMetricsDialog(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const logMood = async () => {
    if (!selectedMood) {
      toast.error(language === "te" ? "మూడ్ ఎంచుకోండి" : "Select mood");
      return;
    }

    try {
      await axios.post(`${API}/doctor/mood`, {
        mood: selectedMood,
        energy_level: energyLevel
      });
      
      toast.success(language === "te" ? "మూడ్ నమోదు చేయబడింది!" : "Mood logged!");
      setShowMoodDialog(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to log mood");
    }
  };

  const filteredFoods = foodSearch 
    ? foods.filter(f => 
        f.name.toLowerCase().includes(foodSearch.toLowerCase()) ||
        (f.name_te && f.name_te.includes(foodSearch))
      )
    : foods.filter(f => f.meal_type === mealType || !f.meal_type);

  const toggleFoodSelection = (food) => {
    if (selectedFoods.find(f => f.name === food.name)) {
      setSelectedFoods(selectedFoods.filter(f => f.name !== food.name));
    } else {
      setSelectedFoods([...selectedFoods, food]);
    }
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "కైజర్ డాక్టర్" : "Kaizer Doctor"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const healthScore = dashboard?.health_score || 0;
  const today = dashboard?.today || {};

  return (
    <Layout showBackButton title={language === "te" ? "కైజర్ డాక్టర్" : "Kaizer Doctor"}>
      <div className="space-y-6" data-testid="kaizer-doctor">
        {/* Health Score Header */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Stethoscope className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">
                    {language === "te" ? "ఆరోగ్య స్కోర్" : "Health Score"}
                  </p>
                  <p className="text-4xl font-bold">{healthScore}</p>
                  <p className="text-white/80 text-xs">/100</p>
                </div>
              </div>
              
              {healthMetrics?.bmi && (
                <div className="text-right">
                  <p className="text-white/80 text-sm">BMI</p>
                  <p className="text-2xl font-bold">{healthMetrics.bmi}</p>
                  <Badge className={`mt-1 ${
                    healthMetrics.bmi_category === "normal" ? "bg-green-200 text-green-800" :
                    healthMetrics.bmi_category === "overweight" ? "bg-yellow-200 text-yellow-800" :
                    "bg-red-200 text-red-800"
                  }`}>
                    {healthMetrics.bmi_category}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {/* Water */}
          <button
            onClick={logWater}
            className="p-3 bg-blue-50 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-transform"
            data-testid="log-water-btn"
          >
            <Droplets className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-bold text-blue-600">{waterGlasses}/8</span>
            <span className="text-xs text-blue-600">{language === "te" ? "నీరు" : "Water"}</span>
          </button>

          {/* Meal */}
          <Dialog open={showMealDialog} onOpenChange={setShowMealDialog}>
            <DialogTrigger asChild>
              <button className="p-3 bg-orange-50 rounded-xl flex flex-col items-center gap-1" data-testid="log-meal-btn">
                <Apple className="h-6 w-6 text-orange-500" />
                <span className="text-lg font-bold text-orange-600">+</span>
                <span className="text-xs text-orange-600">{language === "te" ? "భోజనం" : "Meal"}</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{language === "te" ? "భోజనం నమోదు" : "Log Meal"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">{language === "te" ? "అల్పాహారం" : "Breakfast"}</SelectItem>
                    <SelectItem value="lunch">{language === "te" ? "భోజనం" : "Lunch"}</SelectItem>
                    <SelectItem value="dinner">{language === "te" ? "రాత్రి భోజనం" : "Dinner"}</SelectItem>
                    <SelectItem value="snacks">{language === "te" ? "స్నాక్స్" : "Snacks"}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "te" ? "ఆహారం వెతకండి..." : "Search food..."}
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2">
                  {filteredFoods.slice(0, 15).map((food, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleFoodSelection(food)}
                      className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                        selectedFoods.find(f => f.name === food.name)
                          ? "bg-primary/10 border-primary border"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-sm">{language === "te" ? food.name_te : food.name}</p>
                        <p className="text-xs text-muted-foreground">
                          P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                        </p>
                      </div>
                      <Badge>{food.calories} cal</Badge>
                    </button>
                  ))}
                </div>

                {selectedFoods.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">{language === "te" ? "ఎంచుకున్నవి" : "Selected"}:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedFoods.map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{f.name}</Badge>
                      ))}
                    </div>
                    <p className="text-right font-bold mt-2">
                      {language === "te" ? "మొత్తం" : "Total"}: {selectedFoods.reduce((s, f) => s + f.calories, 0)} cal
                    </p>
                  </div>
                )}

                <Button onClick={logMeal} className="w-full bg-primary text-white rounded-full">
                  {language === "te" ? "నమోదు చేయండి" : "Log Meal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Health Metrics */}
          <Dialog open={showMetricsDialog} onOpenChange={setShowMetricsDialog}>
            <DialogTrigger asChild>
              <button className="p-3 bg-purple-50 rounded-xl flex flex-col items-center gap-1" data-testid="health-metrics-btn">
                <Scale className="h-6 w-6 text-purple-500" />
                <span className="text-lg font-bold text-purple-600">{healthMetrics?.current?.weight_kg || "—"}</span>
                <span className="text-xs text-purple-600">{language === "te" ? "బరువు" : "Weight"}</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === "te" ? "ఆరోగ్య వివరాలు" : "Health Metrics"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">{language === "te" ? "బరువు (kg)" : "Weight (kg)"}</label>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={healthMetrics?.current?.weight_kg || "70"}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{language === "te" ? "ఎత్తు (cm)" : "Height (cm)"}</label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder={healthMetrics?.current?.height_cm || "170"}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{language === "te" ? "బ్లడ్ షుగర్" : "Blood Sugar"}</label>
                  <Input
                    type="number"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    placeholder="100"
                    className="mt-1"
                  />
                </div>
                <Button onClick={updateHealthMetrics} className="w-full bg-primary text-white rounded-full">
                  {language === "te" ? "నవీకరించు" : "Update"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Mood */}
          <Dialog open={showMoodDialog} onOpenChange={setShowMoodDialog}>
            <DialogTrigger asChild>
              <button className="p-3 bg-pink-50 rounded-xl flex flex-col items-center gap-1" data-testid="log-mood-btn">
                <Brain className="h-6 w-6 text-pink-500" />
                <span className="text-lg font-bold text-pink-600">
                  {today.mood ? MOODS.find(m => m.value === today.mood?.mood)?.icon : "😊"}
                </span>
                <span className="text-xs text-pink-600">{language === "te" ? "మూడ్" : "Mood"}</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === "te" ? "మూడ్ నమోదు" : "Log Mood"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-2">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`p-4 rounded-lg flex flex-col items-center gap-2 ${
                        selectedMood === mood.value ? `${mood.color} ring-2 ring-primary` : "bg-muted"
                      }`}
                    >
                      {mood.icon}
                      <span className="text-xs">{mood.label[language]}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium">{language === "te" ? "శక్తి స్థాయి" : "Energy Level"}: {energyLevel}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
                <Button onClick={logMood} className="w-full bg-primary text-white rounded-full">
                  {language === "te" ? "నమోదు చేయండి" : "Log Mood"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Recommendations */}
        {dashboard?.recommendations && dashboard.recommendations.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {language === "te" ? "సిఫార్సులు" : "Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboard.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg flex items-start gap-3 ${
                    rec.priority === "high" ? "bg-red-50" :
                    rec.priority === "medium" ? "bg-yellow-50" : "bg-blue-50"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    rec.type === "water" ? "bg-blue-100 text-blue-600" :
                    rec.type === "fitness" ? "bg-green-100 text-green-600" :
                    rec.type === "sleep" ? "bg-purple-100 text-purple-600" :
                    "bg-orange-100 text-orange-600"
                  }`}>
                    {rec.type === "water" ? <Droplets className="h-4 w-4" /> :
                     rec.type === "fitness" ? <Activity className="h-4 w-4" /> :
                     rec.type === "sleep" ? <Moon className="h-4 w-4" /> :
                     <AlertCircle className="h-4 w-4" />}
                  </div>
                  <p className="text-sm flex-1">
                    {language === "te" ? rec.message_te : rec.message}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="nutrition" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="nutrition">
              {language === "te" ? "పోషణ" : "Nutrition"}
            </TabsTrigger>
            <TabsTrigger value="sleep">
              {language === "te" ? "నిద్ర" : "Sleep"}
            </TabsTrigger>
            <TabsTrigger value="plans">
              {language === "te" ? "ప్రణాళికలు" : "Plans"}
            </TabsTrigger>
          </TabsList>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="mt-4 space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-orange-500" />
                  {language === "te" ? "ఈ రోజు పోషణ" : "Today's Nutrition"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{language === "te" ? "కేలరీలు" : "Calories"}</span>
                      <span>{today.nutrition?.total_calories || 0} / 2000</span>
                    </div>
                    <Progress value={((today.nutrition?.total_calories || 0) / 2000) * 100} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{nutritionSummary?.average_protein || 0}g</p>
                      <p className="text-xs text-muted-foreground">{language === "te" ? "ప్రోటీన్" : "Protein"}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-orange-600">{nutritionSummary?.average_calories || 0}</p>
                      <p className="text-xs text-muted-foreground">{language === "te" ? "సగటు కేలరీలు" : "Avg Cal"}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">{waterGlasses * 250}ml</p>
                      <p className="text-xs text-muted-foreground">{language === "te" ? "నీరు" : "Water"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sleep Tab */}
          <TabsContent value="sleep" className="mt-4 space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-6 text-center">
                <Moon className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <p className="text-2xl font-bold">
                  {today.sleep?.duration_hours || "—"} {language === "te" ? "గంటలు" : "hours"}
                </p>
                <p className="text-muted-foreground">
                  {language === "te" ? "చివరి నిద్ర" : "Last sleep"}
                </p>
                {today.sleep?.quality && (
                  <div className="mt-4 flex justify-center gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <span key={star} className={`text-xl ${star <= today.sleep.quality ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diet Plans Tab */}
          <TabsContent value="plans" className="mt-4 space-y-3">
            {dietPlans.map((plan) => (
              <Card key={plan.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{language === "te" ? plan.name_te : plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === "te" ? plan.description_te : plan.description}
                      </p>
                    </div>
                    <Badge className="bg-primary/10 text-primary">
                      {plan.calories_target} cal
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
