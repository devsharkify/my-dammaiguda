import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

// Translations
const translations = {
  en: {
    // Common
    appName: "My Dammaiguda",
    loading: "Loading...",
    submit: "Submit",
    cancel: "Cancel",
    save: "Save",
    back: "Back",
    next: "Next",
    close: "Close",
    search: "Search",
    filter: "Filter",
    all: "All",
    viewAll: "View All",
    today: "Today",
    yesterday: "Yesterday",
    welcome: "Welcome",
    success: "Success",
    error: "Error",
    
    // Navigation
    home: "Home",
    dashboard: "Dashboard",
    issues: "Issues",
    reportIssue: "Report Issue",
    dumpYard: "Dump Yard",
    fitness: "Fitness",
    doctor: "Doctor",
    benefits: "Benefits",
    expenditure: "Expenditure",
    polls: "Polls",
    profile: "Profile",
    logout: "Logout",
    login: "Login",
    education: "Education",
    news: "News",
    family: "Family",
    gifts: "Gifts",
    courses: "Courses",
    wall: "Citizen Wall",
    helpline: "Helpline",
    chat: "Chat",
    devices: "Devices",
    
    // Dashboard
    airQuality: "Air Quality",
    veryUnhealthy: "Very Unhealthy",
    unhealthy: "Unhealthy",
    moderate: "Moderate",
    good: "Good",
    severe: "Severe",
    hazardous: "Hazardous",
    tonnesPerDay: "tonnes/day",
    citizenWall: "Citizen Wall",
    citizenBenefits: "Citizen Benefits",
    recentIssues: "Recent Issues",
    quickActions: "Quick Actions",
    
    // Auth
    phoneNumber: "Phone Number",
    enterPhone: "Enter your phone number",
    sendOTP: "Send OTP",
    enterOTP: "Enter OTP",
    verifyOTP: "Verify OTP",
    otpSent: "OTP sent to your phone",
    invalidOTP: "Invalid OTP",
    name: "Name",
    enterName: "Enter your name",
    colony: "Colony/Area",
    selectColony: "Select your colony",
    ageRange: "Age Range",
    selectAge: "Select age range",
    register: "Register",
    
    // Issues
    issueCategories: {
      dump_yard: "Dump Yard",
      garbage: "Garbage",
      drainage: "Drainage",
      water: "Drinking Water",
      roads: "Roads",
      lights: "Street Lights",
      parks: "Parks"
    },
    issueStatus: {
      reported: "Reported",
      verified: "Verified",
      escalated: "Escalated",
      closed: "Closed"
    },
    reportNewIssue: "Report New Issue",
    selectCategory: "Select Category",
    describeIssue: "Describe the issue",
    addPhoto: "Add Photo/Video",
    getCurrentLocation: "Get Current Location",
    locationCaptured: "Location captured",
    submitReport: "Submit Report",
    issueReported: "Issue reported successfully",
    
    // Dump Yard
    pollutionZones: "Pollution Risk Zones",
    healthRisks: "Health Risks",
    affectedGroups: "Affected Groups",
    redZone: "Red Zone - High Risk",
    orangeZone: "Orange Zone - Medium Risk",
    greenZone: "Safer Zone",
    children: "Children",
    pregnantWomen: "Pregnant Women",
    elderly: "Elderly",
    respiratory: "Respiratory",
    waterToxic: "Water",
    cancer: "Cancer",
    
    // Fitness
    dailySteps: "Daily Steps",
    weeklyProgress: "Weekly Progress",
    fitnessScore: "Fitness Score",
    logSteps: "Log Steps",
    challenges: "Challenges",
    joinChallenge: "Join Challenge",
    leaderboard: "Leaderboard",
    wardStats: "Ward Statistics",
    pollutionAlert: "Pollution Alert",
    unsafeOutdoor: "Unsafe for outdoor exercise",
    bestTimeExercise: "Best time for exercise",
    water: "Water",
    glasses: "glasses",
    calories: "Calories",
    steps: "Steps",
    streak: "Streak",
    badges: "Badges",
    weightTracker: "Weight Tracker",
    currentWeight: "Current",
    goalWeight: "Goal",
    logWeight: "Log Weight",
    setGoal: "Set Goal",
    startLive: "Start Live",
    recordFitness: "Record Fitness",
    connectSmartwatch: "Connect Smartwatch",
    
    // Benefits
    healthCheckup: "Free Health Checkup",
    educationVoucher: "Education Voucher",
    insurance: "Accidental Insurance",
    healthInsurance: "Health Insurance Support",
    applyNow: "Apply Now",
    eligibility: "Eligibility",
    applicationStatus: "Application Status",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    
    // Expenditure
    wardExpenditure: "Ward Expenditure",
    yearWise: "Year-wise",
    categoryWise: "Category-wise",
    amountSpent: "Amount Spent",
    groundReality: "Ground Reality",
    rtiDocuments: "RTI Documents",
    
    // Polls
    activePollsTitle: "Active Polls",
    vote: "Vote",
    voted: "Voted",
    results: "Results",
    totalVotes: "Total Votes",
    
    // Admin/Volunteer
    volunteerDashboard: "Volunteer Dashboard",
    adminDashboard: "Admin Dashboard",
    pendingVerification: "Pending Verification",
    verify: "Verify",
    escalate: "Escalate",
    closeIssue: "Close Issue",
    issueHeatmap: "Issue Heatmap",
    analytics: "Analytics",
    
    // Education
    scholarship: "Scholarship",
    applyScholarship: "Apply for Scholarship",
    freeCourse: "Free",
    enrollNow: "Enroll Now",
    
    // Meals
    breakfast: "Breakfast",
    lunch: "Lunch",
    snacks: "Snacks",
    dinner: "Dinner",
    logMeal: "Log Meal",
    quickAddCalories: "Quick add calories",
    commonFoods: "Common foods"
  },
  te: {
    // Common - సాధారణం
    appName: "మై దమ్మాయిగూడ",
    loading: "లోడ్ అవుతోంది...",
    submit: "సమర్పించు",
    cancel: "రద్దు చేయి",
    save: "సేవ్ చేయి",
    back: "వెనుకకు",
    next: "తర్వాత",
    close: "మూసివేయి",
    search: "వెతకండి",
    filter: "ఫిల్టర్",
    all: "అన్నీ",
    viewAll: "అన్నీ చూడండి",
    today: "ఈ రోజు",
    yesterday: "నిన్న",
    welcome: "స్వాగతం",
    success: "విజయం",
    error: "లోపం",
    
    // Navigation - మెనూ
    home: "హోమ్",
    dashboard: "డాష్‌బోర్డ్",
    issues: "సమస్యలు",
    reportIssue: "సమస్య చెప్పండి",
    dumpYard: "డంప్ యార్డ్",
    fitness: "ఆరోగ్యం",
    doctor: "డాక్టర్",
    benefits: "సహాయాలు",
    expenditure: "ఖర్చులు",
    polls: "ఓటింగ్",
    profile: "ప్రొఫైల్",
    logout: "బయటకు",
    login: "లాగిన్",
    education: "చదువు",
    news: "వార్తలు",
    family: "కుటుంబం",
    gifts: "బహుమతులు",
    courses: "కోర్సులు",
    wall: "సిటిజన్ వాల్",
    helpline: "హెల్ప్‌లైన్",
    chat: "చాట్",
    devices: "పరికరాలు",
    
    // Dashboard - డాష్‌బోర్డ్
    airQuality: "గాలి నాణ్యత",
    veryUnhealthy: "చాలా హానికరం",
    unhealthy: "హానికరం",
    moderate: "మధ్యస్థం",
    good: "మంచిది",
    severe: "తీవ్రం",
    hazardous: "ప్రమాదకరం",
    tonnesPerDay: "టన్నులు/రోజు",
    citizenWall: "సిటిజన్ వాల్",
    citizenBenefits: "పౌర సహాయాలు",
    recentIssues: "ఇటీవలి సమస్యలు",
    quickActions: "త్వరిత చర్యలు",
    
    // Auth - లాగిన్
    phoneNumber: "ఫోన్ నంబర్",
    enterPhone: "మీ ఫోన్ నంబర్ ఇవ్వండి",
    sendOTP: "OTP పంపండి",
    enterOTP: "OTP టైప్ చేయండి",
    verifyOTP: "OTP నిర్ధారించండి",
    otpSent: "మీ ఫోన్‌కు OTP పంపబడింది",
    invalidOTP: "తప్పు OTP",
    name: "పేరు",
    enterName: "మీ పేరు టైప్ చేయండి",
    colony: "కాలనీ/ఏరియా",
    selectColony: "మీ కాలనీ ఎంచుకోండి",
    ageRange: "వయస్సు",
    selectAge: "వయస్సు ఎంచుకోండి",
    register: "రిజిస్టర్ చేయండి",
    
    // Issues - సమస్యలు
    issueCategories: {
      dump_yard: "డంప్ యార్డ్",
      garbage: "చెత్త",
      drainage: "మురుగు నీరు",
      water: "తాగునీరు",
      roads: "రోడ్లు",
      lights: "వీధి దీపాలు",
      parks: "పార్కులు"
    },
    issueStatus: {
      reported: "రిపోర్ట్ చేయబడింది",
      verified: "నిర్ధారించబడింది",
      escalated: "పైకి పంపబడింది",
      closed: "పరిష్కరించబడింది"
    },
    reportNewIssue: "కొత్త సమస్య చెప్పండి",
    selectCategory: "రకం ఎంచుకోండి",
    describeIssue: "సమస్యను వివరించండి",
    addPhoto: "ఫోటో/వీడియో జోడించండి",
    getCurrentLocation: "లొకేషన్ తీసుకోండి",
    locationCaptured: "లొకేషన్ తీసుకోబడింది",
    submitReport: "పంపండి",
    issueReported: "మీ సమస్య రిపోర్ట్ చేయబడింది",
    
    // Dump Yard - డంప్ యార్డ్
    pollutionZones: "కాలుష్య ప్రమాద ప్రాంతాలు",
    healthRisks: "ఆరోగ్య ప్రమాదాలు",
    affectedGroups: "ప్రభావితమయ్యేవారు",
    redZone: "రెడ్ జోన్ - ఎక్కువ ప్రమాదం",
    orangeZone: "ఆరెంజ్ జోన్ - మధ్యస్థ ప్రమాదం",
    greenZone: "సేఫ్ జోన్",
    children: "పిల్లలు",
    pregnantWomen: "గర్భిణీ స్త్రీలు",
    elderly: "వృద్ధులు",
    respiratory: "ఊపిరితిత్తులు",
    waterToxic: "నీరు",
    cancer: "క్యాన్సర్",
    
    // Fitness - ఫిట్‌నెస్
    dailySteps: "రోజువారీ అడుగులు",
    weeklyProgress: "వారం పురోగతి",
    fitnessScore: "ఫిట్‌నెస్ స్కోర్",
    logSteps: "అడుగులు నమోదు చేయండి",
    challenges: "ఛాలెంజ్‌లు",
    joinChallenge: "ఛాలెంజ్‌లో చేరండి",
    leaderboard: "లీడర్‌బోర్డ్",
    wardStats: "వార్డు గణాంకాలు",
    pollutionAlert: "కాలుష్య హెచ్చరిక",
    unsafeOutdoor: "బయట వ్యాయామం చేయవద్దు",
    bestTimeExercise: "వ్యాయామానికి మంచి సమయం",
    water: "నీరు",
    glasses: "గ్లాసులు",
    calories: "కేలరీలు",
    steps: "అడుగులు",
    streak: "స్ట్రీక్",
    badges: "బ్యాడ్జ్‌లు",
    weightTracker: "బరువు ట్రాకర్",
    currentWeight: "ప్రస్తుత బరువు",
    goalWeight: "లక్ష్య బరువు",
    logWeight: "బరువు నమోదు",
    setGoal: "లక్ష్యం పెట్టండి",
    startLive: "లైవ్ ట్రాకింగ్",
    recordFitness: "వ్యాయామం నమోదు",
    connectSmartwatch: "స్మార్ట్ వాచ్ కనెక్ట్ చేయండి",
    
    // Benefits - సహాయాలు
    healthCheckup: "ఉచిత ఆరోగ్య పరీక్ష",
    educationVoucher: "విద్యా వౌచర్",
    insurance: "యాక్సిడెంట్ బీమా",
    healthInsurance: "ఆరోగ్య బీమా సహాయం",
    applyNow: "ఇప్పుడే అప్లై చేయండి",
    eligibility: "అర్హత",
    applicationStatus: "అప్లికేషన్ స్థితి",
    pending: "వేచి ఉంది",
    approved: "ఆమోదించబడింది",
    rejected: "తిరస్కరించబడింది",
    
    // Expenditure - ఖర్చులు
    wardExpenditure: "వార్డు ఖర్చులు",
    yearWise: "సంవత్సరం వారీగా",
    categoryWise: "రకం వారీగా",
    amountSpent: "ఖర్చు చేసిన మొత్తం",
    groundReality: "నిజమైన పరిస్థితి",
    rtiDocuments: "RTI పత్రాలు",
    
    // Polls - ఓటింగ్
    activePollsTitle: "చురుకైన ఓటింగ్‌లు",
    vote: "ఓటు వేయండి",
    voted: "ఓటు వేశారు",
    results: "ఫలితాలు",
    totalVotes: "మొత్తం ఓట్లు",
    
    // Admin/Volunteer - అడ్మిన్
    volunteerDashboard: "వాలంటీర్ డాష్‌బోర్డ్",
    adminDashboard: "అడ్మిన్ డాష్‌బోర్డ్",
    pendingVerification: "నిర్ధారణ పెండింగ్",
    verify: "నిర్ధారించండి",
    escalate: "పైకి పంపండి",
    closeIssue: "సమస్య మూసివేయండి",
    issueHeatmap: "సమస్య హీట్‌మ్యాప్",
    analytics: "విశ్లేషణలు",
    
    // Education - చదువు
    scholarship: "స్కాలర్‌షిప్",
    applyScholarship: "స్కాలర్‌షిప్ కోసం అప్లై చేయండి",
    freeCourse: "ఉచితం",
    enrollNow: "ఇప్పుడే చేరండి",
    
    // Meals - భోజనం
    breakfast: "అల్పాహారం",
    lunch: "మధ్యాహ్నం భోజనం",
    snacks: "స్నాక్స్",
    dinner: "రాత్రి భోజనం",
    logMeal: "భోజనం నమోదు చేయండి",
    quickAddCalories: "త్వరగా కేలరీలు జోడించండి",
    commonFoods: "సాధారణ ఆహారాలు"
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("dammaiguda_language");
    return saved || "en"; // Default to English
  });

  useEffect(() => {
    localStorage.setItem("dammaiguda_language", language);
  }, [language]);

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || translations.en[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "te" : "en");
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, translations: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
