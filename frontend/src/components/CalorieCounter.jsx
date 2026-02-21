import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import {
  Apple,
  Plus,
  Search,
  Flame,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Trash2,
  ChevronRight,
  Loader2,
  Scale,
  Droplets,
  Info
} from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

// Meal types with icons and Telugu translations
const MEAL_TYPES = [
  { id: "breakfast", name: "Breakfast", name_te: "అల్పాహారం", icon: Coffee, color: "from-orange-400 to-amber-500", emoji: "🌅" },
  { id: "lunch", name: "Lunch", name_te: "భోజనం", icon: Sun, color: "from-yellow-400 to-orange-500", emoji: "☀️" },
  { id: "snacks", name: "Snacks", name_te: "స్నాక్స్", icon: Cookie, color: "from-pink-400 to-rose-500", emoji: "🍿" },
  { id: "evening_snacks", name: "Evening Snacks", name_te: "సాయంత్రం స్నాక్స్", icon: Cookie, color: "from-purple-400 to-violet-500", emoji: "🫖" },
  { id: "dinner", name: "Dinner", name_te: "రాత్రి భోజనం", icon: Moon, color: "from-indigo-400 to-blue-500", emoji: "🌙" }
];

// Quantity units
const QUANTITY_UNITS = [
  { id: "serving", name: "Serving", name_te: "సర్వింగ్", multiplier: 1 },
  { id: "grams", name: "Grams (g)", name_te: "గ్రాములు", multiplier: 0.01 }, // Per 100g base
  { id: "spoon", name: "Spoon", name_te: "స్పూన్", multiplier: 0.15 },
  { id: "tablespoon", name: "Tablespoon", name_te: "టేబుల్ స్పూన్", multiplier: 0.25 },
  { id: "piece", name: "Piece", name_te: "ముక్క", multiplier: 1 },
  { id: "cup", name: "Cup", name_te: "కప్పు", multiplier: 1.5 },
  { id: "bowl", name: "Bowl", name_te: "బౌల్", multiplier: 2 },
  { id: "plate", name: "Plate", name_te: "ప్లేట్", multiplier: 2.5 }
];

// Popular foods with calories per serving
const POPULAR_FOODS = {
  breakfast: [
    { id: "idli", name: "Idli (2 pcs)", name_te: "ఇడ్లీ (2)", calories: 78, protein: 2, carbs: 16, fat: 0.5 },
    { id: "dosa", name: "Plain Dosa", name_te: "దోస", calories: 168, protein: 4, carbs: 28, fat: 5 },
    { id: "upma", name: "Upma", name_te: "ఉప్మా", calories: 210, protein: 6, carbs: 32, fat: 8 },
    { id: "poha", name: "Poha", name_te: "పోహా", calories: 180, protein: 4, carbs: 30, fat: 5 },
    { id: "paratha", name: "Paratha", name_te: "పరాఠా", calories: 260, protein: 6, carbs: 35, fat: 12 },
    { id: "toast_butter", name: "Toast with Butter", name_te: "టోస్ట్ బటర్", calories: 150, protein: 3, carbs: 20, fat: 7 },
    { id: "oats", name: "Oats", name_te: "ఓట్స్", calories: 150, protein: 5, carbs: 27, fat: 3 },
    { id: "egg_omelette", name: "Egg Omelette", name_te: "ఎగ్ ఆమ్లెట్", calories: 154, protein: 11, carbs: 1, fat: 12 }
  ],
  lunch: [
    { id: "rice_sambar", name: "Rice + Sambar", name_te: "అన్నం + సాంబార్", calories: 350, protein: 10, carbs: 65, fat: 5 },
    { id: "rice_dal", name: "Rice + Dal", name_te: "అన్నం + పప్పు", calories: 380, protein: 12, carbs: 70, fat: 4 },
    { id: "chicken_biryani", name: "Chicken Biryani", name_te: "చికెన్ బిర్యానీ", calories: 450, protein: 22, carbs: 55, fat: 15 },
    { id: "veg_biryani", name: "Veg Biryani", name_te: "వెజ్ బిర్యానీ", calories: 380, protein: 10, carbs: 60, fat: 10 },
    { id: "curd_rice", name: "Curd Rice", name_te: "పెరుగు అన్నం", calories: 250, protein: 8, carbs: 45, fat: 4 },
    { id: "chapati_curry", name: "2 Chapati + Curry", name_te: "2 చపాతీ + కూర", calories: 320, protein: 10, carbs: 50, fat: 8 },
    { id: "fish_curry_rice", name: "Fish Curry + Rice", name_te: "చేప కూర + అన్నం", calories: 420, protein: 25, carbs: 55, fat: 12 }
  ],
  snacks: [
    { id: "samosa", name: "Samosa", name_te: "సమోసా", calories: 262, protein: 4, carbs: 25, fat: 17 },
    { id: "pakora", name: "Pakora (5 pcs)", name_te: "పకోడీ", calories: 180, protein: 4, carbs: 18, fat: 10 },
    { id: "banana", name: "Banana", name_te: "అరటిపండు", calories: 105, protein: 1, carbs: 27, fat: 0.4 },
    { id: "apple", name: "Apple", name_te: "ఆపిల్", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { id: "biscuits", name: "Biscuits (4 pcs)", name_te: "బిస్కెట్లు", calories: 140, protein: 2, carbs: 20, fat: 6 },
    { id: "peanuts", name: "Peanuts (handful)", name_te: "వేరుశెనగ", calories: 160, protein: 7, carbs: 5, fat: 14 },
    { id: "murukku", name: "Murukku", name_te: "ముర్కులు", calories: 150, protein: 3, carbs: 18, fat: 8 }
  ],
  evening_snacks: [
    { id: "chai", name: "Chai (Tea)", name_te: "చాయ్", calories: 80, protein: 2, carbs: 12, fat: 2 },
    { id: "coffee", name: "Coffee", name_te: "కాఫీ", calories: 70, protein: 2, carbs: 10, fat: 2 },
    { id: "vada", name: "Medu Vada", name_te: "వడ", calories: 180, protein: 6, carbs: 20, fat: 9 },
    { id: "bajji", name: "Bajji (3 pcs)", name_te: "బజ్జి", calories: 200, protein: 4, carbs: 22, fat: 11 },
    { id: "mixture", name: "Mixture", name_te: "మిక్స్చర్", calories: 170, protein: 5, carbs: 15, fat: 11 },
    { id: "fruits_bowl", name: "Fruits Bowl", name_te: "పండ్ల బౌల్", calories: 120, protein: 1, carbs: 30, fat: 0.5 }
  ],
  dinner: [
    { id: "roti_sabzi", name: "2 Roti + Sabzi", name_te: "2 రోటీ + కూర", calories: 280, protein: 9, carbs: 45, fat: 7 },
    { id: "rice_rasam", name: "Rice + Rasam", name_te: "అన్నం + రసం", calories: 220, protein: 5, carbs: 45, fat: 2 },
    { id: "khichdi", name: "Khichdi", name_te: "కిచిడి", calories: 230, protein: 8, carbs: 40, fat: 4 },
    { id: "dal_rice", name: "Dal Rice", name_te: "పప్పు అన్నం", calories: 350, protein: 12, carbs: 60, fat: 5 },
    { id: "paneer_curry_roti", name: "Paneer Curry + Roti", name_te: "పన్నీర్ కూర + రోటీ", calories: 400, protein: 18, carbs: 40, fat: 18 },
    { id: "egg_curry_rice", name: "Egg Curry + Rice", name_te: "ఎగ్ కూర + అన్నం", calories: 380, protein: 15, carbs: 50, fat: 12 }
  ]
};

export default function CalorieCounter({ onMealsUpdated }) {
  const { language } = useLanguage();
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("breakfast");
  const [todayMeals, setTodayMeals] = useState([]);
  const [caloriesSummary, setCaloriesSummary] = useState({ total: 0, protein: 0, carbs: 0, fat: 0 });
  const [caloriesGoal] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Add food form
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [quantityUnit, setQuantityUnit] = useState("serving");
  const [customFood, setCustomFood] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchTodayMeals();
  }, []);

  const fetchTodayMeals = async () => {
    try {
      const res = await axios.get(`${API}/doctor/meals`, { headers });
      setTodayMeals(res.data.meals || []);
      setCaloriesSummary({
        total: res.data.summary?.total_calories || 0,
        protein: res.data.summary?.total_protein || 0,
        carbs: res.data.summary?.total_carbs || 0,
        fat: res.data.summary?.total_fat || 0
      });
      if (onMealsUpdated) onMealsUpdated(res.data.summary?.total_calories || 0);
    } catch (err) {
      console.error("Error fetching meals:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search foods
  const searchFoods = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const res = await axios.get(`${API}/doctor/foods/search?q=${encodeURIComponent(query)}&limit=10`, { headers });
      setSearchResults(res.data.foods || []);
    } catch (err) {
      // Fallback to local search
      const results = [];
      Object.values(POPULAR_FOODS).flat().forEach(food => {
        if (food.name.toLowerCase().includes(query.toLowerCase()) || 
            food.name_te.includes(query)) {
          results.push(food);
        }
      });
      setSearchResults(results.slice(0, 10));
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchFoods(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate calories based on quantity and unit
  const calculateCalories = (food, qty, unit) => {
    const qtyNum = parseFloat(qty) || 1;
    const unitData = QUANTITY_UNITS.find(u => u.id === unit);
    const multiplier = unitData?.multiplier || 1;
    
    // For grams, we calculate per 100g base
    if (unit === "grams") {
      return Math.round((food.calories / 100) * qtyNum);
    }
    
    return Math.round(food.calories * qtyNum * multiplier);
  };

  // Add meal
  const addMeal = async () => {
    if (!selectedFood && !customFood) {
      toast.error(language === "te" ? "ఆహారాన్ని ఎంచుకోండి" : "Select a food item");
      return;
    }

    setSaving(true);
    try {
      let calories, protein, carbs, fat, foodName, foodNameTe;
      
      if (selectedFood) {
        const qtyNum = parseFloat(quantity) || 1;
        const unitData = QUANTITY_UNITS.find(u => u.id === quantityUnit);
        const multiplier = unitData?.multiplier || 1;
        
        if (quantityUnit === "grams") {
          const factor = qtyNum / 100;
          calories = Math.round(selectedFood.calories * factor);
          protein = Math.round((selectedFood.protein || 0) * factor);
          carbs = Math.round((selectedFood.carbs || 0) * factor);
          fat = Math.round((selectedFood.fat || 0) * factor);
        } else {
          calories = Math.round(selectedFood.calories * qtyNum * multiplier);
          protein = Math.round((selectedFood.protein || 0) * qtyNum * multiplier);
          carbs = Math.round((selectedFood.carbs || 0) * qtyNum * multiplier);
          fat = Math.round((selectedFood.fat || 0) * qtyNum * multiplier);
        }
        foodName = selectedFood.name;
        foodNameTe = selectedFood.name_te;
      } else {
        calories = parseInt(customCalories) || 100;
        protein = 0;
        carbs = 0;
        fat = 0;
        foodName = customFood;
        foodNameTe = customFood;
      }

      await axios.post(`${API}/doctor/meal`, {
        food_item: selectedFood?.id || "custom",
        meal_type: selectedMealType,
        quantity: parseFloat(quantity) || 1,
        custom_calories: !selectedFood ? parseInt(customCalories) : null
      }, { headers });

      toast.success(`${foodName} ${language === "te" ? "జోడించబడింది" : "added"} (+${calories} cal)`);
      
      // Reset form
      setSelectedFood(null);
      setQuantity("1");
      setQuantityUnit("serving");
      setCustomFood("");
      setCustomCalories("");
      setSearchQuery("");
      setSearchResults([]);
      setShowAddMeal(false);
      
      // Refresh meals
      fetchTodayMeals();
    } catch (err) {
      toast.error(language === "te" ? "జోడించడం విఫలమైంది" : "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  // Delete meal
  const deleteMeal = async (mealId) => {
    try {
      await axios.delete(`${API}/doctor/meal/${mealId}`, { headers });
      toast.success(language === "te" ? "తొలగించబడింది" : "Removed");
      fetchTodayMeals();
    } catch (err) {
      toast.error(language === "te" ? "తొలగించడం విఫలమైంది" : "Failed to remove");
    }
  };

  // Group meals by type
  const mealsByType = MEAL_TYPES.reduce((acc, type) => {
    acc[type.id] = todayMeals.filter(m => m.meal_type === type.id);
    return acc;
  }, {});

  // Calculate calories per meal type
  const caloriesByType = MEAL_TYPES.reduce((acc, type) => {
    acc[type.id] = mealsByType[type.id].reduce((sum, m) => sum + (m.calories || 0), 0);
    return acc;
  }, {});

  const progressPercent = Math.min(100, (caloriesSummary.total / caloriesGoal) * 100);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white overflow-hidden">
        <CardContent className="p-4 relative">
          <div className="absolute -right-8 -top-8 text-8xl opacity-10">🍎</div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">
                {language === "te" ? "ఈ రోజు కేలరీలు" : "Today's Calories"}
              </p>
              <p className="text-4xl font-bold mt-1">{caloriesSummary.total}</p>
              <p className="text-orange-100 text-sm">/ {caloriesGoal} kcal</p>
            </div>
            <Button
              onClick={() => setShowAddMeal(true)}
              className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30"
              data-testid="add-meal-btn"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-white/70 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {/* Macros */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/20">
            <div className="text-center">
              <p className="text-lg font-bold">{caloriesSummary.protein}g</p>
              <p className="text-[10px] text-orange-100">{language === "te" ? "ప్రోటీన్" : "Protein"}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{caloriesSummary.carbs}g</p>
              <p className="text-[10px] text-orange-100">{language === "te" ? "కార్బ్స్" : "Carbs"}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{caloriesSummary.fat}g</p>
              <p className="text-[10px] text-orange-100">{language === "te" ? "ఫ్యాట్" : "Fat"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Type Cards */}
      <div className="space-y-3">
        {MEAL_TYPES.map((type) => {
          const Icon = type.icon;
          const meals = mealsByType[type.id] || [];
          const totalCal = caloriesByType[type.id] || 0;
          
          return (
            <Card key={type.id} className="border-0 shadow-md">
              <CardContent className="p-3">
                <button
                  onClick={() => {
                    setSelectedMealType(type.id);
                    setShowAddMeal(true);
                  }}
                  className="w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-white`}>
                        <span className="text-lg">{type.emoji}</span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">
                          {language === "te" ? type.name_te : type.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {meals.length} {language === "te" ? "ఐటెమ్స్" : "items"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{totalCal}</p>
                      <p className="text-[10px] text-muted-foreground">kcal</p>
                    </div>
                  </div>
                </button>
                
                {/* Meal items */}
                {meals.length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    {meals.map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between py-1 px-2 bg-muted/30 rounded">
                        <div className="flex-1">
                          <p className="text-sm">{meal.food_name_te || meal.food_item}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {meal.quantity > 1 && `x${meal.quantity} • `}{meal.calories} cal
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMeal(meal.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Meal Dialog */}
      <Dialog open={showAddMeal} onOpenChange={(open) => {
        setShowAddMeal(open);
        if (!open) {
          setSelectedFood(null);
          setSearchQuery("");
          setSearchResults([]);
          setCustomFood("");
          setCustomCalories("");
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-orange-500" />
              {language === "te" ? "ఆహారం జోడించండి" : "Add Food"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {/* Meal Type Selection */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {MEAL_TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedMealType === type.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMealType(type.id)}
                  className="flex-shrink-0"
                >
                  {type.emoji} {language === "te" ? type.name_te : type.name}
                </Button>
              ))}
            </div>

            {/* Food Search */}
            <div>
              <Label className="text-sm font-medium">
                {language === "te" ? "ఆహారం వెతకండి" : "Search Food"}
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "te" ? "దోస, బిర్యానీ, ఆపిల్..." : "dosa, biryani, apple..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Search Results */}
              {searchLoading && (
                <div className="text-center py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  {language === "te" ? "వెతుకుతోంది..." : "Searching..."}
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg divide-y">
                  {searchResults.map((food) => (
                    <button
                      key={food.id}
                      className={`w-full p-2 text-left hover:bg-accent transition-colors ${selectedFood?.id === food.id ? "bg-accent" : ""}`}
                      onClick={() => {
                        setSelectedFood(food);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <p className="font-medium text-sm">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {food.name_te} • {food.calories} cal
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Foods for Selected Meal Type */}
            {!searchQuery && !selectedFood && (
              <div>
                <Label className="text-sm font-medium">
                  {language === "te" ? "ప్రసిద్ధ ఆహారాలు" : "Popular Foods"}
                </Label>
                <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg divide-y">
                  {(POPULAR_FOODS[selectedMealType] || []).map((food) => (
                    <button
                      key={food.id}
                      className="w-full p-2 text-left hover:bg-accent transition-colors flex justify-between items-center"
                      onClick={() => setSelectedFood(food)}
                    >
                      <div>
                        <p className="font-medium text-sm">{food.name}</p>
                        <p className="text-xs text-muted-foreground">{food.name_te}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-orange-600">{food.calories}</p>
                        <p className="text-[10px] text-muted-foreground">cal</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Food Details */}
            {selectedFood && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold">{selectedFood.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedFood.name_te}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFood(null)}
                      className="h-6 w-6 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                  
                  {/* Quantity & Unit */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-xs">{language === "te" ? "పరిమాణం" : "Quantity"}</Label>
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{language === "te" ? "యూనిట్" : "Unit"}</Label>
                      <Select value={quantityUnit} onValueChange={setQuantityUnit}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUANTITY_UNITS.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {language === "te" ? unit.name_te : unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Calculated Calories */}
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {calculateCalories(selectedFood, quantity, quantityUnit)} cal
                    </p>
                    <p className="text-xs text-muted-foreground">
                      P: {Math.round((selectedFood.protein || 0) * (parseFloat(quantity) || 1) * (QUANTITY_UNITS.find(u => u.id === quantityUnit)?.multiplier || 1))}g • 
                      C: {Math.round((selectedFood.carbs || 0) * (parseFloat(quantity) || 1) * (QUANTITY_UNITS.find(u => u.id === quantityUnit)?.multiplier || 1))}g • 
                      F: {Math.round((selectedFood.fat || 0) * (parseFloat(quantity) || 1) * (QUANTITY_UNITS.find(u => u.id === quantityUnit)?.multiplier || 1))}g
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Custom Food Entry */}
            {!selectedFood && (
              <div className="border-t pt-3">
                <Label className="text-sm font-medium">
                  {language === "te" ? "కస్టమ్ ఆహారం" : "Custom Food Entry"}
                </Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Input
                    placeholder={language === "te" ? "ఆహారం పేరు" : "Food name"}
                    value={customFood}
                    onChange={(e) => setCustomFood(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder={language === "te" ? "కేలరీలు" : "Calories"}
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Add Button */}
            <Button
              onClick={addMeal}
              disabled={saving || (!selectedFood && (!customFood || !customCalories))}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {language === "te" ? "జోడించండి" : "Add Food"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
