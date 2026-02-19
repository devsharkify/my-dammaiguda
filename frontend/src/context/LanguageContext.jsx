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
    analytics: "Analytics"
  },
  te: {
    // Common - సాధారణం
    appName: "మై దమ్మాయిగూడ",
    loading: "లోడ్ అవుతోంది...",
    submit: "సమర్పించు",
    cancel: "రద్దు",
    save: "సేవ్ చేయి",
    back: "వెనుకకు",
    next: "తదుపరి",
    close: "మూసివేయి",
    search: "వెతుకు",
    filter: "ఫిల్టర్",
    all: "అన్నీ",
    viewAll: "అన్నీ చూడు",
    today: "ఈ రోజు",
    yesterday: "నిన్న",
    
    // Navigation - నావిగేషన్
    home: "హోమ్",
    dashboard: "డాష్‌బోర్డ్",
    issues: "సమస్యలు",
    reportIssue: "సమస్య నివేదించు",
    dumpYard: "డంప్ యార్డ్",
    fitness: "ఫిట్‌నెస్",
    doctor: "డాక్టర్",
    benefits: "ప్రయోజనాలు",
    expenditure: "ఖర్చులు",
    polls: "పోల్స్",
    profile: "ప్రొఫైల్",
    logout: "లాగ్ అవుట్",
    login: "లాగిన్",
    education: "చదువు",
    news: "వార్తలు",
    family: "కుటుంబం",
    gifts: "బహుమతులు",
    courses: "కోర్సులు",
    wall: "సిటిజన్ వాల్",
    
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
    citizenBenefits: "పౌర ప్రయోజనాలు",
    recentIssues: "ఇటీవలి సమస్యలు",
    quickActions: "త్వరిత చర్యలు",
    
    // Auth - ప్రమాణీకరణ
    phoneNumber: "ఫోన్ నంబర్",
    enterPhone: "మీ ఫోన్ నంబర్ ఇవ్వండి",
    sendOTP: "OTP పంపు",
    enterOTP: "OTP ఇవ్వండి",
    verifyOTP: "OTP ధృవీకరించు",
    otpSent: "మీ ఫోన్‌కు OTP పంపబడింది",
    invalidOTP: "తప్పు OTP",
    name: "పేరు",
    enterName: "మీ పేరు ఇవ్వండి",
    colony: "కాలనీ/ఏరియా",
    selectColony: "మీ కాలనీ ఎంచుకోండి",
    ageRange: "వయసు",
    selectAge: "వయసు ఎంచుకోండి",
    register: "రిజిస్టర్",
    
    // Issues - సమస్యలు
    issueCategories: {
      dump_yard: "డంప్ యార్డ్",
      garbage: "చెత్త",
      drainage: "డ్రైనేజీ",
      water: "తాగునీరు",
      roads: "రోడ్లు",
      lights: "వీధి దీపాలు",
      parks: "పార్కులు"
    },
    issueStatus: {
      reported: "నివేదించబడింది",
      verified: "ధృవీకరించబడింది",
      escalated: "ఎస్కలేట్ చేయబడింది",
      closed: "పూర్తయింది"
    },
    reportNewIssue: "కొత్త సమస్య రిపోర్ట్ చేయి",
    selectCategory: "వర్గం ఎంచుకో",
    describeIssue: "సమస్య వివరించు",
    addPhoto: "ఫోటో/వీడియో జోడించు",
    getCurrentLocation: "లొకేషన్ తీసుకో",
    locationCaptured: "లొకేషన్ తీసుకున్నాం",
    submitReport: "సమర్పించు",
    issueReported: "సమస్య విజయవంతంగా నివేదించబడింది",
    
    // Dump Yard - డంప్ యార్డ్
    pollutionZones: "కాలుష్య ప్రమాద జోన్లు",
    healthRisks: "ఆరోగ్య ప్రమాదాలు",
    affectedGroups: "ప్రభావిత సమూహాలు",
    redZone: "రెడ్ జోన్ - అధిక ప్రమాదం",
    orangeZone: "ఆరంజ్ జోన్ - మధ్యస్థ ప్రమాదం",
    greenZone: "సేఫ్ జోన్",
    children: "పిల్లలు",
    pregnantWomen: "గర్భిణీలు",
    elderly: "వృద్ధులు",
    respiratory: "శ్వాసకోశం",
    waterToxic: "నీరు",
    cancer: "క్యాన్సర్",
    
    // Fitness - ఫిట్‌నెస్
    dailySteps: "రోజువారీ అడుగులు",
    weeklyProgress: "వారపు పురోగతి",
    fitnessScore: "ఫిట్‌నెస్ స్కోర్",
    logSteps: "అడుగులు నమోదు చేయి",
    challenges: "ఛాలెంజ్‌లు",
    joinChallenge: "ఛాలెంజ్‌లో చేరు",
    leaderboard: "లీడర్‌బోర్డ్",
    wardStats: "వార్డు గణాంకాలు",
    pollutionAlert: "కాలుష్య హెచ్చరిక",
    unsafeOutdoor: "బయట వ్యాయామం సేఫ్ కాదు",
    bestTimeExercise: "వ్యాయామానికి మంచి సమయం",
    water: "నీరు",
    glasses: "గ్లాసులు",
    calories: "కేలరీలు",
    steps: "అడుగులు",
    streak: "స్ట్రీక్",
    badges: "బ్యాడ్జ్‌లు",
    
    // Benefits - ప్రయోజనాలు
    healthCheckup: "ఉచిత ఆరోగ్య పరీక్ష",
    educationVoucher: "విద్యా వౌచర్",
    insurance: "ప్రమాద బీమా",
    healthInsurance: "ఆరోగ్య బీమా",
    applyNow: "ఇప్పుడే అప్లై చేయి",
    eligibility: "అర్హత",
    applicationStatus: "అప్లికేషన్ స్టేటస్",
    pending: "పెండింగ్",
    approved: "అప్రూవ్ అయింది",
    rejected: "రిజెక్ట్ అయింది",
    
    // Expenditure - ఖర్చులు
    wardExpenditure: "వార్డు ఖర్చులు",
    yearWise: "సంవత్సరం వారీగా",
    categoryWise: "వర్గం వారీగా",
    amountSpent: "ఖర్చు చేసిన మొత్తం",
    groundReality: "వాస్తవ పరిస్థితి",
    rtiDocuments: "RTI డాక్యుమెంట్లు",
    
    // Polls - పోల్స్
    activePollsTitle: "యాక్టివ్ పోల్స్",
    vote: "ఓటు వేయి",
    voted: "ఓటు వేశారు",
    results: "ఫలితాలు",
    totalVotes: "మొత్తం ఓట్లు",
    
    // Admin/Volunteer - అడ్మిన్/వాలంటీర్
    volunteerDashboard: "వాలంటీర్ డాష్‌బోర్డ్",
    adminDashboard: "అడ్మిన్ డాష్‌బోర్డ్",
    pendingVerification: "వెరిఫికేషన్ పెండింగ్",
    verify: "వెరిఫై చేయి",
    escalate: "ఎస్కలేట్ చేయి",
    closeIssue: "సమస్య క్లోజ్ చేయి",
    issueHeatmap: "ఇష్యూ హీట్‌మ్యాప్",
    analytics: "అనలిటిక్స్"
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
