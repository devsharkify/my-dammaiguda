import { useState, useEffect, useRef } from "react";
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
  Heart,
  Brain,
  Activity,
  Plus,
  TrendingUp,
  AlertCircle,
  Smile,
  Frown,
  Meh,
  Zap,
  Search,
  Sparkles,
  Star,
  Award,
  Target,
  Pill,
  Thermometer,
  HeartPulse,
  Timer,
  Calendar,
  ChevronRight,
  Crown,
  MessageCircle,
  Send,
  Loader2,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle,
  XCircle,
  Syringe,
  FileText,
  BookOpen
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Medicine Database - Common medicines with information
const MEDICINE_DATABASE = [
  {
    name: "Paracetamol",
    name_te: "పారాసెటమాల్",
    brand_names: ["Crocin", "Dolo 650", "Calpol", "Panadol"],
    category: "Pain & Fever",
    category_te: "నొప్పి & జ్వరం",
    uses: ["Fever", "Headache", "Body Pain", "Cold"],
    uses_te: ["జ్వరం", "తలనొప్పి", "శరీర నొప్పి", "జలుబు"],
    dosage: "500mg-1000mg every 4-6 hours. Max 4g/day",
    dosage_te: "500mg-1000mg ప్రతి 4-6 గంటలకు. గరిష్టం 4g/రోజు",
    side_effects: ["Nausea", "Allergic reaction (rare)", "Liver damage (overdose)"],
    side_effects_te: ["వికారం", "అలెర్జీ (అరుదు)", "కాలేయ నష్టం (అధిక మోతాదు)"],
    warnings: ["Avoid alcohol", "Don't exceed recommended dose", "Consult if liver problems"],
    warnings_te: ["మద్యం నివారించండి", "సిఫార్సు చేసిన మోతాదు మించకూడదు", "కాలేయ సమస్యలు ఉంటే వైద్యుడిని సంప్రదించండి"],
    interactions: ["Warfarin", "Alcohol", "Other paracetamol products"],
    otc: true
  },
  {
    name: "Ibuprofen",
    name_te: "ఐబుప్రోఫెన్",
    brand_names: ["Brufen", "Advil", "Combiflam"],
    category: "NSAID / Pain Relief",
    category_te: "ఎన్‌ఎస్‌ఏఐడి / నొప్పి నివారణ",
    uses: ["Pain", "Inflammation", "Arthritis", "Menstrual cramps"],
    uses_te: ["నొప్పి", "వాపు", "ఆర్థరైటిస్", "రుతుక్రమ నొప్పులు"],
    dosage: "200-400mg every 4-6 hours. Max 1200mg/day (OTC)",
    dosage_te: "200-400mg ప్రతి 4-6 గంటలకు. గరిష్టం 1200mg/రోజు",
    side_effects: ["Stomach upset", "Heartburn", "Dizziness", "Kidney issues (long-term)"],
    side_effects_te: ["కడుపు నొప్పి", "గుండె మంట", "తల తిరుగుట", "మూత్రపిండ సమస్యలు"],
    warnings: ["Take with food", "Avoid if pregnant", "Not for children under 12"],
    warnings_te: ["ఆహారంతో తీసుకోండి", "గర్భిణీలు వినియోగించకూడదు", "12 ఏళ్ల లోపు పిల్లలకు కాదు"],
    interactions: ["Aspirin", "Blood thinners", "Blood pressure meds"],
    otc: true
  },
  {
    name: "Azithromycin",
    name_te: "అజిత్రోమైసిన్",
    brand_names: ["Azithral", "Zithromax", "Azee"],
    category: "Antibiotic",
    category_te: "యాంటీబయోటిక్",
    uses: ["Respiratory infections", "Skin infections", "Ear infections", "STIs"],
    uses_te: ["శ్వాసకోశ ఇన్ఫెక్షన్లు", "చర్మ ఇన్ఫెక్షన్లు", "చెవి ఇన్ఫెక్షన్లు"],
    dosage: "500mg once daily for 3 days OR 500mg day 1, then 250mg for 4 days",
    dosage_te: "500mg రోజుకు ఒకసారి 3 రోజులు",
    side_effects: ["Diarrhea", "Nausea", "Abdominal pain", "Headache"],
    side_effects_te: ["అతిసారం", "వికారం", "కడుపు నొప్పి", "తలనొప్పి"],
    warnings: ["Complete full course", "May cause sun sensitivity", "Inform doctor of heart conditions"],
    warnings_te: ["పూర్తి కోర్సు పూర్తి చేయండి", "ఎండకు సెన్సిటివిటీ కలిగించవచ్చు"],
    interactions: ["Antacids", "Blood thinners", "Digoxin"],
    otc: false
  },
  {
    name: "Omeprazole",
    name_te: "ఓమెప్రజోల్",
    brand_names: ["Omez", "Prilosec", "Ocid"],
    category: "Antacid / PPI",
    category_te: "యాంటాసిడ్ / పీపీఐ",
    uses: ["Acidity", "GERD", "Ulcers", "Heartburn"],
    uses_te: ["ఆసిడిటీ", "జీఈఆర్‌డి", "అల్సర్లు", "గుండె మంట"],
    dosage: "20mg once daily before breakfast",
    dosage_te: "20mg రోజుకు ఒకసారి అల్పాహారానికి ముందు",
    side_effects: ["Headache", "Stomach pain", "Vitamin B12 deficiency (long-term)"],
    side_effects_te: ["తలనొప్పి", "కడుపు నొప్పి", "విటమిన్ B12 లోపం (దీర్ఘకాలిక)"],
    warnings: ["Don't use long-term without supervision", "May mask serious conditions"],
    warnings_te: ["పర్యవేక్షణ లేకుండా దీర్ఘకాలికంగా వినియోగించవద్దు"],
    interactions: ["Clopidogrel", "Methotrexate", "HIV medications"],
    otc: true
  },
  {
    name: "Cetirizine",
    name_te: "సెటిరిజిన్",
    brand_names: ["Zyrtec", "Cetzine", "Alerid"],
    category: "Antihistamine / Allergy",
    category_te: "యాంటీహిస్టమిన్ / అలెర్జీ",
    uses: ["Allergies", "Hay fever", "Hives", "Itching"],
    uses_te: ["అలెర్జీలు", "గడ్డి జ్వరం", "దద్దుర్లు", "దురద"],
    dosage: "10mg once daily",
    dosage_te: "10mg రోజుకు ఒకసారి",
    side_effects: ["Drowsiness", "Dry mouth", "Fatigue"],
    side_effects_te: ["మగత", "నోరు ఎండిపోవడం", "అలసట"],
    warnings: ["May cause drowsiness - avoid driving", "Avoid alcohol"],
    warnings_te: ["మగత కలిగించవచ్చు - డ్రైవింగ్ చేయకండి", "మద్యం నివారించండి"],
    interactions: ["Alcohol", "Other antihistamines", "Sedatives"],
    otc: true
  },
  {
    name: "Metformin",
    name_te: "మెట్‌ఫార్మిన్",
    brand_names: ["Glycomet", "Glucophage", "Obimet"],
    category: "Diabetes",
    category_te: "డయాబెటిస్",
    uses: ["Type 2 Diabetes", "Blood sugar control", "PCOS"],
    uses_te: ["టైప్ 2 డయాబెటిస్", "రక్తంలో చక్కెర నియంత్రణ", "పీసీఓఎస్"],
    dosage: "500mg-1000mg twice daily with meals",
    dosage_te: "500mg-1000mg రోజుకు రెండుసార్లు భోజనంతో",
    side_effects: ["Diarrhea", "Nausea", "Stomach upset", "Vitamin B12 deficiency"],
    side_effects_te: ["అతిసారం", "వికారం", "కడుపు నొప్పి", "విటమిన్ B12 లోపం"],
    warnings: ["Take with food", "Monitor kidney function", "Avoid excess alcohol"],
    warnings_te: ["ఆహారంతో తీసుకోండి", "మూత్రపిండ పనితీరు పర్యవేక్షించండి"],
    interactions: ["Alcohol", "Contrast dye (CT scans)", "Some diabetes medications"],
    otc: false
  },
  {
    name: "Amlodipine",
    name_te: "అమ్లోడిపిన్",
    brand_names: ["Norvasc", "Amlong", "Amlip"],
    category: "Blood Pressure",
    category_te: "రక్తపోటు",
    uses: ["High blood pressure", "Chest pain (angina)", "Heart disease prevention"],
    uses_te: ["అధిక రక్తపోటు", "ఛాతీ నొప్పి", "గుండె జబ్బు నివారణ"],
    dosage: "5-10mg once daily",
    dosage_te: "5-10mg రోజుకు ఒకసారి",
    side_effects: ["Swelling in ankles", "Headache", "Flushing", "Dizziness"],
    side_effects_te: ["చీలమండల వాపు", "తలనొప్పి", "ముఖం ఎర్రబడడం", "తల తిరుగుట"],
    warnings: ["Don't stop suddenly", "Avoid grapefruit", "May cause low BP"],
    warnings_te: ["హఠాత్తుగా ఆపకూడదు", "గ్రేప్‌ఫ్రూట్ నివారించండి"],
    interactions: ["Grapefruit", "Other BP medications", "Simvastatin (high doses)"],
    otc: false
  },
  {
    name: "Pantoprazole",
    name_te: "పాంటోప్రజోల్",
    brand_names: ["Pan D", "Pantop", "Protonix"],
    category: "Antacid / PPI",
    category_te: "యాంటాసిడ్ / పీపీఐ",
    uses: ["GERD", "Acidity", "Stomach ulcers", "H. pylori infection"],
    uses_te: ["జీఈఆర్‌డి", "ఆసిడిటీ", "కడుపు పూతలు"],
    dosage: "40mg once daily before breakfast",
    dosage_te: "40mg రోజుకు ఒకసారి అల్పాహారానికి ముందు",
    side_effects: ["Headache", "Diarrhea", "Nausea", "Abdominal pain"],
    side_effects_te: ["తలనొప్పి", "అతిసారం", "వికారం", "కడుపు నొప్పి"],
    warnings: ["Not for long-term use without doctor", "May affect bone health"],
    warnings_te: ["వైద్యుడి సలహా లేకుండా దీర్ఘకాలికంగా వినియోగించవద్దు"],
    interactions: ["Methotrexate", "HIV medications", "Warfarin"],
    otc: true
  },
  {
    name: "Montelukast",
    name_te: "మాంటెలుకాస్ట్",
    brand_names: ["Montair", "Singulair", "Montek LC"],
    category: "Asthma / Allergy",
    category_te: "ఆస్తమా / అలెర్జీ",
    uses: ["Asthma prevention", "Allergic rhinitis", "Exercise-induced asthma"],
    uses_te: ["ఆస్తమా నివారణ", "అలెర్జిక్ రినైటిస్"],
    dosage: "10mg once daily in evening",
    dosage_te: "10mg సాయంత్రం రోజుకు ఒకసారి",
    side_effects: ["Headache", "Stomach pain", "Mood changes (rare)"],
    side_effects_te: ["తలనొప్పి", "కడుపు నొప్పి", "మానసిక మార్పులు (అరుదు)"],
    warnings: ["Not for acute asthma attacks", "Report mood changes immediately"],
    warnings_te: ["తీవ్రమైన ఆస్తమా దాడులకు కాదు", "మానసిక మార్పులు వెంటనే రిపోర్ట్ చేయండి"],
    interactions: ["Phenobarbital", "Rifampicin"],
    otc: false
  },
  {
    name: "Amoxicillin",
    name_te: "అమాక్సిసిలిన్",
    brand_names: ["Mox", "Amoxil", "Novamox"],
    category: "Antibiotic",
    category_te: "యాంటీబయోటిక్",
    uses: ["Bacterial infections", "Ear infections", "Throat infections", "UTI"],
    uses_te: ["బ్యాక్టీరియల్ ఇన్ఫెక్షన్లు", "చెవి ఇన్ఫెక్షన్లు", "గొంతు ఇన్ఫెక్షన్లు"],
    dosage: "250-500mg three times daily for 7-10 days",
    dosage_te: "250-500mg రోజుకు మూడుసార్లు 7-10 రోజులు",
    side_effects: ["Diarrhea", "Nausea", "Rash", "Allergic reactions"],
    side_effects_te: ["అతిసారం", "వికారం", "దద్దుర్లు", "అలెర్జీ ప్రతిచర్యలు"],
    warnings: ["Complete full course", "Inform if allergic to penicillin"],
    warnings_te: ["పూర్తి కోర్సు పూర్తి చేయండి", "పెన్సిలిన్ అలెర్జీ ఉంటే చెప్పండి"],
    interactions: ["Methotrexate", "Blood thinners", "Birth control pills"],
    otc: false
  }
];

// Symptom checker data
const SYMPTOM_CHECKER = {
  fever: {
    name: { en: "Fever", te: "జ్వరం" },
    common_causes: ["Viral infection", "Bacterial infection", "Flu"],
    common_causes_te: ["వైరల్ ఇన్ఫెక్షన్", "బ్యాక్టీరియల్ ఇన్ఫెక్షన్", "ఫ్లూ"],
    otc_medicines: ["Paracetamol", "Ibuprofen"],
    when_to_see_doctor: ["Fever above 103°F", "Fever lasting more than 3 days", "Difficulty breathing"],
    home_remedies: ["Rest", "Stay hydrated", "Cool compress"]
  },
  headache: {
    name: { en: "Headache", te: "తలనొప్పి" },
    common_causes: ["Tension", "Dehydration", "Eye strain", "Migraine"],
    common_causes_te: ["టెన్షన్", "నీటి లోపం", "కంటి అలసట", "మైగ్రేన్"],
    otc_medicines: ["Paracetamol", "Ibuprofen", "Aspirin"],
    when_to_see_doctor: ["Severe sudden headache", "With vision changes", "After head injury"],
    home_remedies: ["Rest in dark room", "Stay hydrated", "Cold compress"]
  },
  cough: {
    name: { en: "Cough", te: "దగ్గు" },
    common_causes: ["Common cold", "Allergies", "Asthma", "Acid reflux"],
    common_causes_te: ["సాధారణ జలుబు", "అలెర్జీలు", "ఆస్తమా", "ఆసిడ్ రిఫ్లక్స్"],
    otc_medicines: ["Cetirizine", "Cough syrup", "Honey"],
    when_to_see_doctor: ["Cough with blood", "Lasting more than 3 weeks", "With chest pain"],
    home_remedies: ["Warm water with honey", "Steam inhalation", "Ginger tea"]
  },
  stomach_pain: {
    name: { en: "Stomach Pain", te: "కడుపు నొప్పి" },
    common_causes: ["Indigestion", "Gas", "Acidity", "Food poisoning"],
    common_causes_te: ["అజీర్ణం", "గ్యాస్", "ఆసిడిటీ", "ఫుడ్ పాయిజనింగ్"],
    otc_medicines: ["Omeprazole", "Pantoprazole", "Antacids"],
    when_to_see_doctor: ["Severe pain", "With vomiting blood", "Pain lasting days"],
    home_remedies: ["Light food", "Ginger tea", "Avoid spicy food"]
  }
};

// Health motivation quotes
const HEALTH_QUOTES = {
  en: [
    "Health is wealth. Invest wisely today! 💪",
    "Your body is a temple. Take care of it! 🏛️",
    "Small healthy choices lead to big results! ✨",
    "Sleep well, eat well, live well! 🌟",
    "Mental health matters as much as physical! 🧠",
    "Prevention is better than cure! 💚"
  ],
  te: [
    "ఆరోగ్యమే మహాభాగ్యం. ఈ రోజు పెట్టుబడి పెట్టండి! 💪",
    "మీ శరీరం ఒక ఆలయం. దానిని జాగ్రత్తగా చూసుకోండి! 🏛️",
    "చిన్న ఆరోగ్య ఎంపికలు పెద్ద ఫలితాలను ఇస్తాయి! ✨",
    "బాగా నిద్రపోండి, బాగా తినండి, బాగా జీవించండి! 🌟",
    "మానసిక ఆరోగ్యం శారీరక ఆరోగ్యం అంతే ముఖ్యం! 🧠",
    "నివారణ నయం కంటే మంచిది! 💚"
  ]
};

const MOODS = [
  { value: "happy", label: { en: "Happy", te: "సంతోషం" }, icon: <Smile className="h-6 w-6" />, color: "bg-green-100 text-green-600", gradient: "from-green-400 to-emerald-500" },
  { value: "calm", label: { en: "Calm", te: "శాంతం" }, icon: <Meh className="h-6 w-6" />, color: "bg-blue-100 text-blue-600", gradient: "from-blue-400 to-cyan-500" },
  { value: "energetic", label: { en: "Energetic", te: "శక్తివంతం" }, icon: <Zap className="h-6 w-6" />, color: "bg-yellow-100 text-yellow-600", gradient: "from-yellow-400 to-orange-500" },
  { value: "stressed", label: { en: "Stressed", te: "ఒత్తిడి" }, icon: <AlertCircle className="h-6 w-6" />, color: "bg-orange-100 text-orange-600", gradient: "from-orange-400 to-red-500" },
  { value: "anxious", label: { en: "Anxious", te: "ఆందోళన" }, icon: <Heart className="h-6 w-6" />, color: "bg-red-100 text-red-600", gradient: "from-red-400 to-rose-500" },
  { value: "sad", label: { en: "Sad", te: "విచారం" }, icon: <Frown className="h-6 w-6" />, color: "bg-purple-100 text-purple-600", gradient: "from-purple-400 to-pink-500" }
];

export default function KaizerDoctor() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Medicine search
  const [medicineSearch, setMedicineSearch] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showMedicineDialog, setShowMedicineDialog] = useState(false);
  
  // Symptom checker
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [showSymptomDialog, setShowSymptomDialog] = useState(false);
  
  // Health metrics
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [bloodPressure, setBloodPressure] = useState({ systolic: "", diastolic: "" });
  
  // Mood logging
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState(5);
  
  // Sleep logging
  const [showSleepDialog, setShowSleepDialog] = useState(false);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState(3);
  
  // Psychologist AI state
  const [psychMessages, setPsychMessages] = useState([]);
  const [psychInput, setPsychInput] = useState("");
  const [psychLoading, setPsychLoading] = useState(false);
  const [psychSessionId, setPsychSessionId] = useState(null);
  const psychChatRef = useRef(null);
  
  // Quote
  const [quote] = useState(() => {
    const quotes = HEALTH_QUOTES["en"];
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  // Scroll to bottom of psychologist chat
  useEffect(() => {
    psychChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [psychMessages]);

  const fetchData = async () => {
    try {
      const [dashRes, metricsRes] = await Promise.all([
        axios.get(`${API}/doctor/dashboard`).catch(() => ({ data: null })),
        axios.get(`${API}/doctor/health-metrics`).catch(() => ({ data: null }))
      ]);
      
      setDashboard(dashRes.data);
      setHealthMetrics(metricsRes.data);
    } catch (error) {
      console.error("Error fetching doctor data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter medicines based on search
  const filteredMedicines = medicineSearch.length >= 2
    ? MEDICINE_DATABASE.filter(med => 
        med.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
        med.brand_names.some(b => b.toLowerCase().includes(medicineSearch.toLowerCase())) ||
        med.category.toLowerCase().includes(medicineSearch.toLowerCase())
      )
    : [];
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
        blood_sugar: bloodSugar ? parseFloat(bloodSugar) : null,
        blood_pressure_systolic: bloodPressure.systolic ? parseInt(bloodPressure.systolic) : null,
        blood_pressure_diastolic: bloodPressure.diastolic ? parseInt(bloodPressure.diastolic) : null
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

  const logSleep = async () => {
    if (!sleepHours) {
      toast.error(language === "te" ? "నిద్ర గంటలు నమోదు చేయండి" : "Enter sleep hours");
      return;
    }

    try {
      await axios.post(`${API}/doctor/sleep`, {
        duration_hours: parseFloat(sleepHours),
        quality: sleepQuality
      });
      
      toast.success(language === "te" ? "నిద్ర నమోదు చేయబడింది!" : "Sleep logged!");
      setShowSleepDialog(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to log sleep");
    }
  };

  // Psychologist AI Chat
  const sendPsychMessage = async () => {
    if (!psychInput.trim()) return;
    
    const userMsg = { role: "user", content: psychInput.trim(), timestamp: new Date().toISOString() };
    setPsychMessages(prev => [...prev, userMsg]);
    setPsychInput("");
    setPsychLoading(true);
    
    try {
      const response = await axios.post(`${API}/doctor/psychologist/chat`, {
        message: userMsg.content,
        session_id: psychSessionId
      }, { headers });
      
      setPsychSessionId(response.data.session_id);
      const aiMsg = { 
        role: "assistant", 
        content: response.data.response, 
        timestamp: response.data.timestamp 
      };
      setPsychMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      toast.error(language === "te" ? "సందేశం పంపడంలో విఫలమైంది" : "Failed to send message");
      // Remove the user message on error
      setPsychMessages(prev => prev.slice(0, -1));
    } finally {
      setPsychLoading(false);
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

  // Get localized quote
  const localizedQuote = HEALTH_QUOTES[language]?.[HEALTH_QUOTES["en"].indexOf(quote)] || quote;

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
  const waterGoal = 8;
  const waterProgress = Math.min(100, Math.round((waterGlasses / waterGoal) * 100));
  const caloriesGoal = 2000;
  const caloriesConsumed = today.nutrition?.total_calories || 0;
  const caloriesProgress = Math.min(100, Math.round((caloriesConsumed / caloriesGoal) * 100));

  return (
    <Layout showBackButton title={language === "te" ? "కైజర్ డాక్టర్" : "Kaizer Doctor"}>
      <div className="space-y-5" data-testid="kaizer-doctor">
        {/* Motivational Health Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-5 text-white">
          <div className="absolute top-0 right-0 opacity-10">
            <HeartPulse className="h-32 w-32 -mt-8 -mr-8" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
              <span className="text-sm font-medium text-white/90">
                {language === "te" ? "ఈ రోజు ఆరోగ్య సూచన" : "Today's Health Tip"}
              </span>
            </div>
            <p className="text-lg font-semibold leading-relaxed">{localizedQuote}</p>
          </div>
        </div>

        {/* Premium Health Score Card */}
        <Card className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white border-0 shadow-lg overflow-hidden relative">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Stethoscope className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">
                    {language === "te" ? "మీ ఆరోగ్య స్కోర్" : "Your Health Score"}
                  </p>
                  <p className="text-4xl font-bold tracking-tight">{healthScore}</p>
                  <p className="text-white/70 text-sm">/100</p>
                </div>
              </div>
              <div className="text-right">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-white/30 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{healthMetrics?.bmi || "—"}</p>
                      <p className="text-xs text-white/70">BMI</p>
                    </div>
                  </div>
                  {healthScore >= 80 && (
                    <Crown className="absolute -top-2 -right-1 h-6 w-6 text-yellow-300 fill-yellow-300" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Water Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/80 flex items-center gap-1">
                  <Droplets className="h-4 w-4" />
                  {language === "te" ? "నీరు" : "Water"}
                </span>
                <span className="font-bold">{waterGlasses}/{waterGoal} {language === "te" ? "గ్లాసులు" : "glasses"}</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-300 to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${waterProgress}%` }}
                />
              </div>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                <Utensils className="h-5 w-5 mx-auto mb-1 text-orange-300" />
                <p className="font-bold text-lg">{caloriesConsumed}</p>
                <p className="text-[10px] text-white/70">{language === "te" ? "కేలరీలు" : "Kcal"}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                <Moon className="h-5 w-5 mx-auto mb-1 text-purple-300" />
                <p className="font-bold text-lg">{today.sleep?.duration_hours || "—"}</p>
                <p className="text-[10px] text-white/70">{language === "te" ? "నిద్ర గం" : "Sleep h"}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                <Brain className="h-5 w-5 mx-auto mb-1 text-pink-300" />
                <p className="font-bold text-lg">{today.mood ? "😊" : "—"}</p>
                <p className="text-[10px] text-white/70">{language === "te" ? "మూడ్" : "Mood"}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                <Scale className="h-5 w-5 mx-auto mb-1 text-green-300" />
                <p className="font-bold text-lg">{healthMetrics?.current?.weight_kg || "—"}</p>
                <p className="text-[10px] text-white/70">{language === "te" ? "కిలో" : "kg"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Doctor Features */}
        <div className="grid grid-cols-2 gap-3">
          {/* Medicine Search */}
          <Button
            onClick={() => {
              const tabs = document.querySelector('[data-testid="kaizer-doctor"]');
              if (tabs) tabs.scrollIntoView({ behavior: 'smooth' });
            }}
            className="h-16 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            data-testid="medicine-search-btn"
          >
            <Pill className="h-6 w-6 mr-2" />
            {language === "te" ? "మందుల వెతుకు" : "Medicine Search"}
          </Button>
          
          {/* Symptom Checker */}
          <Button
            onClick={() => {
              const tabs = document.querySelector('[data-testid="kaizer-doctor"]');
              if (tabs) tabs.scrollIntoView({ behavior: 'smooth' });
            }}
            className="h-16 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            data-testid="symptom-checker-btn"
          >
            <Stethoscope className="h-6 w-6 mr-2" />
            {language === "te" ? "లక్షణాల తనిఖీ" : "Symptom Check"}
          </Button>
        </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "te" ? "ఆహారం వెతకండి..." : "Search food..."}
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2">
                  {filteredFoods.slice(0, 15).map((food, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleFoodSelection(food)}
                      className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all ${
                        selectedFoods.find(f => f.name === food.name)
                          ? "bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-400"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-sm">{language === "te" ? food.name_te : food.name}</p>
                        <p className="text-xs text-muted-foreground">
                          P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                        </p>
                      </div>
                      <Badge className="bg-orange-500">{food.calories} cal</Badge>
                    </button>
                  ))}
                </div>

                {selectedFoods.length > 0 && (
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                    <p className="text-sm font-medium mb-2">{language === "te" ? "ఎంచుకున్నవి" : "Selected"}:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedFoods.map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-orange-100">{f.name}</Badge>
                      ))}
                    </div>
                    <p className="text-right font-bold mt-2 text-orange-600">
                      {language === "te" ? "మొత్తం" : "Total"}: {selectedFoods.reduce((s, f) => s + f.calories, 0)} cal
                    </p>
                  </div>
                )}

                <Button onClick={logMeal} className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold">
                  {language === "te" ? "నమోదు చేయండి" : "Log Meal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Second Row of Actions */}
        <div className="grid grid-cols-3 gap-2">
          {/* Health Metrics */}
          <Dialog open={showMetricsDialog} onOpenChange={setShowMetricsDialog}>
            <DialogTrigger asChild>
              <button className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-all border border-purple-100" data-testid="health-metrics-btn">
                <Scale className="h-7 w-7 text-purple-500" />
                <span className="text-xl font-bold text-purple-600">{healthMetrics?.current?.weight_kg || "—"}</span>
                <span className="text-xs text-purple-600/80">{language === "te" ? "బరువు kg" : "Weight kg"}</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-purple-500" />
                  {language === "te" ? "ఆరోగ్య వివరాలు" : "Health Metrics"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Scale className="h-4 w-4 text-purple-500" />
                    {language === "te" ? "బరువు (kg)" : "Weight (kg)"}
                  </label>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={healthMetrics?.current?.weight_kg || "70"}
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    {language === "te" ? "ఎత్తు (cm)" : "Height (cm)"}
                  </label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder={healthMetrics?.current?.height_cm || "170"}
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    {language === "te" ? "బ్లడ్ షుగర్ (mg/dL)" : "Blood Sugar (mg/dL)"}
                  </label>
                  <Input
                    type="number"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    placeholder="100"
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-pink-500" />
                    {language === "te" ? "బ్లడ్ ప్రెషర్" : "Blood Pressure"}
                  </label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      value={bloodPressure.systolic}
                      onChange={(e) => setBloodPressure({ ...bloodPressure, systolic: e.target.value })}
                      placeholder="120"
                      className="h-12"
                    />
                    <span className="flex items-center text-xl">/</span>
                    <Input
                      type="number"
                      value={bloodPressure.diastolic}
                      onChange={(e) => setBloodPressure({ ...bloodPressure, diastolic: e.target.value })}
                      placeholder="80"
                      className="h-12"
                    />
                  </div>
                </div>
                <Button onClick={updateHealthMetrics} className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold">
                  {language === "te" ? "నవీకరించు" : "Update"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Mood */}
          <Dialog open={showMoodDialog} onOpenChange={setShowMoodDialog}>
            <DialogTrigger asChild>
              <button className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-all border border-pink-100" data-testid="log-mood-btn">
                <Brain className="h-7 w-7 text-pink-500" />
                <span className="text-xl font-bold text-pink-600">
                  {today.mood ? MOODS.find(m => m.value === today.mood?.mood)?.icon : "😊"}
                </span>
                <span className="text-xs text-pink-600/80">{language === "te" ? "మూడ్" : "Mood"}</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-pink-500" />
                  {language === "te" ? "మూడ్ నమోదు" : "Log Mood"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-3">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                        selectedMood === mood.value 
                          ? `bg-gradient-to-br ${mood.gradient} text-white shadow-lg scale-105` 
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {mood.icon}
                      <span className="text-xs font-medium">{mood.label[language]}</span>
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
                    className="w-full mt-2 accent-pink-500"
                  />
                </div>
                <Button onClick={logMood} className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold">
                  {language === "te" ? "నమోదు చేయండి" : "Log Mood"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Sleep */}
          <Dialog open={showSleepDialog} onOpenChange={setShowSleepDialog}>
            <DialogTrigger asChild>
              <button className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-all border border-indigo-100" data-testid="log-sleep-btn">
                <Moon className="h-7 w-7 text-indigo-500" />
                <span className="text-xl font-bold text-indigo-600">{today.sleep?.duration_hours || "—"}</span>
                <span className="text-xs text-indigo-600/80">{language === "te" ? "నిద్ర గం" : "Sleep h"}</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-500" />
                  {language === "te" ? "నిద్ర నమోదు" : "Log Sleep"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">{language === "te" ? "నిద్ర గంటలు" : "Sleep Hours"}</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="7.5"
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{language === "te" ? "నిద్ర నాణ్యత" : "Sleep Quality"}</label>
                  <div className="flex justify-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSleepQuality(star)}
                        className={`text-3xl transition-all ${star <= sleepQuality ? "text-yellow-400 scale-110" : "text-gray-300"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={logSleep} className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-semibold">
                  {language === "te" ? "నమోదు చేయండి" : "Log Sleep"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Health Alert/Recommendation Card */}
        {dashboard?.recommendations && dashboard.recommendations.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                {language === "te" ? "ఆరోగ్య సిఫార్సులు" : "Health Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboard.recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl flex items-start gap-3 ${
                    rec.priority === "high" ? "bg-red-100/50" :
                    rec.priority === "medium" ? "bg-amber-100/50" : "bg-blue-100/50"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    rec.type === "water" ? "bg-blue-200 text-blue-600" :
                    rec.type === "fitness" ? "bg-green-200 text-green-600" :
                    rec.type === "sleep" ? "bg-purple-200 text-purple-600" :
                    "bg-orange-200 text-orange-600"
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

        {/* Tabs for Detailed Views */}
        <Tabs defaultValue="medicines" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="medicines" className="text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Pill className="h-4 w-4 mr-1" />
              {language === "te" ? "మందులు" : "Medicines"}
            </TabsTrigger>
            <TabsTrigger value="symptoms" className="text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Stethoscope className="h-4 w-4 mr-1" />
              {language === "te" ? "లక్షణాలు" : "Symptoms"}
            </TabsTrigger>
            <TabsTrigger value="mind" className="text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="mind-tab">
              <Brain className="h-4 w-4 mr-1" />
              {language === "te" ? "మైండ్" : "Mind"}
            </TabsTrigger>
            <TabsTrigger value="vitals" className="text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <HeartPulse className="h-4 w-4 mr-1" />
              {language === "te" ? "వైటల్స్" : "Vitals"}
            </TabsTrigger>
          </TabsList>

          {/* Medicines Tab - Medicine Lookup */}
          <TabsContent value="medicines" className="mt-4 space-y-4">
            <Card className="border-border/50 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-teal-50 to-cyan-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="h-5 w-5 text-teal-600" />
                  {language === "te" ? "మందుల వివరాలు చూడండి" : "Medicine Information Lookup"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "te" ? "మందు పేరు లేదా బ్రాండ్ వెతకండి..." : "Search medicine name or brand..."}
                    value={medicineSearch}
                    onChange={(e) => setMedicineSearch(e.target.value)}
                    className="pl-10 h-12"
                    data-testid="medicine-search"
                  />
                </div>
                
                {filteredMedicines.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredMedicines.map((med, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedMedicine(med);
                          setShowMedicineDialog(true);
                        }}
                        className="w-full p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 text-left flex items-center justify-between border border-teal-100"
                        data-testid={`medicine-${med.name}`}
                      >
                        <div>
                          <p className="font-semibold text-teal-800">
                            {language === "te" ? med.name_te : med.name}
                          </p>
                          <p className="text-xs text-teal-600">
                            {med.brand_names.slice(0, 3).join(", ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={med.otc ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                            {med.otc ? (language === "te" ? "OTC" : "OTC") : (language === "te" ? "Rx" : "Prescription")}
                          </Badge>
                          <p className="text-[10px] text-teal-600 mt-1">
                            {language === "te" ? med.category_te : med.category}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : medicineSearch.length >= 2 ? (
                  <div className="text-center py-8">
                    <Pill className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">
                      {language === "te" ? "మందు కనుగొనబడలేదు" : "No medicine found"}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">
                      {language === "te" ? "మందు పేరు టైప్ చేయండి (కనీసం 2 అక్షరాలు)" : "Type medicine name (min 2 characters)"}
                    </p>
                    
                    {/* Popular Medicines */}
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {language === "te" ? "ప్రసిద్ధ మందులు:" : "Popular Medicines:"}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {["Paracetamol", "Ibuprofen", "Cetirizine", "Omeprazole"].map(med => (
                          <Button 
                            key={med}
                            variant="outline" 
                            size="sm"
                            onClick={() => setMedicineSearch(med)}
                            className="text-xs"
                          >
                            {med}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Important Notice */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold">{language === "te" ? "ముఖ్యమైన గమనిక:" : "Important Notice:"}</p>
                  <p>
                    {language === "te" 
                      ? "ఈ సమాచారం విద్యా ప్రయోజనాల కోసం మాత్రమే. మందులు తీసుకునే ముందు వైద్యుడిని సంప్రదించండి." 
                      : "This information is for educational purposes only. Always consult a doctor before taking any medicine."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Symptoms Tab - Symptom Checker */}
          <TabsContent value="symptoms" className="mt-4 space-y-4">
            <Card className="border-border/50 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  {language === "te" ? "లక్షణాల తనిఖీ" : "Symptom Checker"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {language === "te" 
                    ? "సాధారణ లక్షణాల గురించి సమాచారం పొందండి:" 
                    : "Get information about common symptoms:"}
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(SYMPTOM_CHECKER).map(([key, symptom]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedSymptom({ key, ...symptom });
                        setShowSymptomDialog(true);
                      }}
                      className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-center border border-blue-100 transition-all"
                      data-testid={`symptom-${key}`}
                    >
                      {key === "fever" && <Thermometer className="h-8 w-8 mx-auto mb-2 text-red-500" />}
                      {key === "headache" && <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500" />}
                      {key === "cough" && <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />}
                      {key === "stomach_pain" && <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                      <p className="font-semibold text-sm">
                        {language === "te" ? symptom.name.te : symptom.name.en}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Emergency Numbers */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-3">
                  <Phone className="h-4 w-4" />
                  {language === "te" ? "అత్యవసర నంబర్లు" : "Emergency Numbers"}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <a href="tel:108" className="p-2 bg-white rounded-lg flex items-center gap-2 text-red-700 font-medium">
                    <Phone className="h-4 w-4" /> 108 - {language === "te" ? "అంబులెన్స్" : "Ambulance"}
                  </a>
                  <a href="tel:104" className="p-2 bg-white rounded-lg flex items-center gap-2 text-red-700 font-medium">
                    <Phone className="h-4 w-4" /> 104 - {language === "te" ? "ఆరోగ్య" : "Health"}
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vitals Tab */}
          <TabsContent value="vitals" className="mt-4 space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center">
                    <Scale className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold text-purple-600">
                      {healthMetrics?.current?.weight_kg || "—"} kg
                    </p>
                    <p className="text-xs text-text-muted">{language === "te" ? "బరువు" : "Weight"}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold text-blue-600">
                      {healthMetrics?.current?.height_cm || "—"} cm
                    </p>
                    <p className="text-xs text-text-muted">{language === "te" ? "ఎత్తు" : "Height"}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl text-center">
                    <Thermometer className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold text-red-600">
                      {healthMetrics?.current?.blood_sugar || "—"}
                    </p>
                    <p className="text-xs text-text-muted">{language === "te" ? "షుగర్ mg/dL" : "Sugar mg/dL"}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl text-center">
                    <HeartPulse className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-2xl font-bold text-emerald-600">
                      {healthMetrics?.bmi || "—"}
                    </p>
                    <p className="text-xs text-text-muted">BMI</p>
                    {healthMetrics?.bmi_category && (
                      <Badge className={`mt-1 ${
                        healthMetrics.bmi_category === "normal" ? "bg-green-100 text-green-700" :
                        healthMetrics.bmi_category === "overweight" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {healthMetrics.bmi_category}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mind/Psychologist Tab */}
          <TabsContent value="mind" className="mt-4 space-y-4">
            <Card className="border-border/50 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-violet-50 to-purple-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-600" />
                  {language === "te" ? "కైజర్ మైండ్ - AI మానసిక సహాయకుడు" : "Kaizer Mind - AI Counselor"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Chat Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-violet-50/30 to-white">
                  {psychMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mb-4">
                        <Brain className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        {language === "te" ? "కైజర్ మైండ్‌కు స్వాగతం" : "Welcome to Kaizer Mind"}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        {language === "te" 
                          ? "మీ మానసిక ఆరోగ్యం గురించి మాట్లాడండి. నేను వినడానికి మరియు సహాయం చేయడానికి ఇక్కడ ఉన్నాను."
                          : "Talk about your mental well-being. I'm here to listen and help."}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {[
                          { en: "I feel stressed", te: "నేను ఒత్తిడిలో ఉన్నాను" },
                          { en: "Help me relax", te: "రిలాక్స్ చేయడంలో సహాయం చేయండి" },
                          { en: "I can't sleep", te: "నాకు నిద్ర రావడం లేదు" }
                        ].map((prompt, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setPsychInput(language === "te" ? prompt.te : prompt.en);
                            }}
                          >
                            {language === "te" ? prompt.te : prompt.en}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    psychMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-br-sm"
                            : "bg-white border border-violet-100 rounded-bl-sm shadow-sm"
                        }`}>
                          {msg.role === "assistant" && (
                            <div className="flex items-center gap-2 mb-1">
                              <Brain className="h-4 w-4 text-violet-600" />
                              <span className="text-xs font-semibold text-violet-600">Kaizer Mind</span>
                            </div>
                          )}
                          <p className={`text-sm whitespace-pre-wrap ${msg.role === "user" ? "text-white" : "text-text-primary"}`}>
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {psychLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-violet-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                          <span className="text-sm text-muted-foreground">
                            {language === "te" ? "ఆలోచిస్తోంది..." : "Thinking..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={psychChatRef} />
                </div>
                
                {/* Chat Input */}
                <div className="p-3 border-t border-violet-100 bg-white flex gap-2">
                  <Input
                    placeholder={language === "te" ? "మీ ఆలోచనలు షేర్ చేయండి..." : "Share your thoughts..."}
                    value={psychInput}
                    onChange={(e) => setPsychInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !psychLoading && sendPsychMessage()}
                    className="flex-1 border-violet-200 focus:border-violet-400"
                    disabled={psychLoading}
                    data-testid="psych-input"
                  />
                  <Button
                    onClick={sendPsychMessage}
                    disabled={psychLoading || !psychInput.trim()}
                    className="bg-gradient-to-r from-violet-500 to-purple-500"
                    data-testid="psych-send-btn"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Emergency Helplines Card */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">
                      {language === "te" ? "అత్యవసర సహాయం అవసరమా?" : "Need immediate help?"}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      iCall: <span className="font-mono font-bold">9152987821</span>
                    </p>
                    <p className="text-xs text-amber-700">
                      Vandrevala Foundation: <span className="font-mono font-bold">1860-2662-345</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Medicine Detail Dialog */}
        <Dialog open={showMedicineDialog} onOpenChange={setShowMedicineDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            {selectedMedicine && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-teal-600" />
                    {language === "te" ? selectedMedicine.name_te : selectedMedicine.name}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  {/* Brand Names */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                      {language === "te" ? "బ్రాండ్ పేర్లు" : "Brand Names"}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedMedicine.brand_names.map((brand, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{brand}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Category & OTC Status */}
                  <div className="flex items-center gap-2">
                    <Badge className={selectedMedicine.otc ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                      {selectedMedicine.otc 
                        ? (language === "te" ? "ప్రిస్క్రిప్షన్ అవసరం లేదు" : "OTC - No prescription needed")
                        : (language === "te" ? "ప్రిస్క్రిప్షన్ అవసరం" : "Prescription Required")}
                    </Badge>
                  </div>
                  
                  {/* Uses */}
                  <div className="bg-teal-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-teal-700 flex items-center gap-1 mb-2">
                      <CheckCircle className="h-3 w-3" />
                      {language === "te" ? "ఉపయోగాలు" : "Uses"}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {(language === "te" ? selectedMedicine.uses_te : selectedMedicine.uses).map((use, idx) => (
                        <Badge key={idx} className="bg-teal-100 text-teal-700 text-xs">{use}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Dosage */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3" />
                      {language === "te" ? "మోతాదు" : "Dosage"}
                    </h4>
                    <p className="text-sm text-blue-800">
                      {language === "te" ? selectedMedicine.dosage_te : selectedMedicine.dosage}
                    </p>
                  </div>
                  
                  {/* Side Effects */}
                  <div className="bg-orange-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-orange-700 flex items-center gap-1 mb-2">
                      <AlertCircle className="h-3 w-3" />
                      {language === "te" ? "దుష్ప్రభావాలు" : "Side Effects"}
                    </h4>
                    <ul className="text-xs text-orange-800 space-y-0.5">
                      {(language === "te" ? selectedMedicine.side_effects_te : selectedMedicine.side_effects).map((effect, idx) => (
                        <li key={idx}>• {effect}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Warnings */}
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-2">
                      <AlertTriangle className="h-3 w-3" />
                      {language === "te" ? "హెచ్చరికలు" : "Warnings"}
                    </h4>
                    <ul className="text-xs text-red-800 space-y-0.5">
                      {(language === "te" ? selectedMedicine.warnings_te : selectedMedicine.warnings).map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Drug Interactions */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-purple-700 flex items-center gap-1 mb-2">
                      <XCircle className="h-3 w-3" />
                      {language === "te" ? "ఇతర మందులతో సంబంధం" : "Drug Interactions"}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedMedicine.interactions.map((interaction, idx) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-700 text-xs">{interaction}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Symptom Detail Dialog */}
        <Dialog open={showSymptomDialog} onOpenChange={setShowSymptomDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            {selectedSymptom && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                    {language === "te" ? selectedSymptom.name.te : selectedSymptom.name.en}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  {/* Common Causes */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-2">
                      <Info className="h-3 w-3" />
                      {language === "te" ? "సాధారణ కారణాలు" : "Common Causes"}
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-0.5">
                      {(language === "te" ? selectedSymptom.common_causes_te : selectedSymptom.common_causes).map((cause, idx) => (
                        <li key={idx}>• {cause}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* OTC Medicines */}
                  <div className="bg-teal-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-teal-700 flex items-center gap-1 mb-2">
                      <Pill className="h-3 w-3" />
                      {language === "te" ? "OTC మందులు" : "OTC Medicines"}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedSymptom.otc_medicines.map((med, idx) => (
                        <Button 
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            setShowSymptomDialog(false);
                            setMedicineSearch(med);
                          }}
                        >
                          {med}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Home Remedies */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-2">
                      <CheckCircle className="h-3 w-3" />
                      {language === "te" ? "ఇంటి నివారణలు" : "Home Remedies"}
                    </h4>
                    <ul className="text-xs text-green-800 space-y-0.5">
                      {selectedSymptom.home_remedies.map((remedy, idx) => (
                        <li key={idx}>• {remedy}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* When to See Doctor */}
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-2">
                      <AlertTriangle className="h-3 w-3" />
                      {language === "te" ? "వైద్యుడిని ఎప్పుడు చూడాలి" : "When to See a Doctor"}
                    </h4>
                    <ul className="text-xs text-red-800 space-y-0.5">
                      {selectedSymptom.when_to_see_doctor.map((reason, idx) => (
                        <li key={idx}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
