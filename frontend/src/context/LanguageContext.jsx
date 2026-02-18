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
    
    // Navigation
    home: "Home",
    dashboard: "Dashboard",
    issues: "Issues",
    reportIssue: "Report Issue",
    dumpYard: "Dump Yard",
    fitness: "Kaizer Fit",
    benefits: "Benefits",
    expenditure: "Expenditure",
    polls: "Polls",
    profile: "Profile",
    logout: "Logout",
    login: "Login",
    
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
    
    // Benefits
    citizenBenefits: "Citizen Benefits",
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
    // Common
    appName: "మై దమ్మాయిగూడ",
    loading: "లోడ్ అవుతోంది...",
    submit: "సమర్పించు",
    cancel: "రద్దు",
    save: "సేవ్",
    back: "వెనుకకు",
    next: "తదుపరి",
    close: "మూసివేయి",
    search: "వెతకండి",
    filter: "ఫిల్టర్",
    all: "అన్నీ",
    
    // Navigation
    home: "హోమ్",
    dashboard: "డాష్‌బోర్డ్",
    issues: "సమస్యలు",
    reportIssue: "సమస్య నివేదించు",
    dumpYard: "డంప్ యార్డ్",
    fitness: "కైజర్ ఫిట్",
    benefits: "ప్రయోజనాలు",
    expenditure: "ఖర్చులు",
    polls: "పోల్స్",
    profile: "ప్రొఫైల్",
    logout: "లాగ్అవుట్",
    login: "లాగిన్",
    
    // Auth
    phoneNumber: "ఫోన్ నంబర్",
    enterPhone: "మీ ఫోన్ నంబర్ నమోదు చేయండి",
    sendOTP: "OTP పంపండి",
    enterOTP: "OTP నమోదు చేయండి",
    verifyOTP: "OTP ధృవీకరించు",
    otpSent: "మీ ఫోన్‌కు OTP పంపబడింది",
    invalidOTP: "చెల్లని OTP",
    name: "పేరు",
    enterName: "మీ పేరు నమోదు చేయండి",
    colony: "కాలనీ/ప్రాంతం",
    selectColony: "మీ కాలనీ ఎంచుకోండి",
    ageRange: "వయస్సు పరిధి",
    selectAge: "వయస్సు ఎంచుకోండి",
    register: "నమోదు",
    
    // Issues
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
      escalated: "పెంచబడింది",
      closed: "మూసివేయబడింది"
    },
    reportNewIssue: "కొత్త సమస్య నివేదించు",
    selectCategory: "వర్గం ఎంచుకోండి",
    describeIssue: "సమస్యను వివరించండి",
    addPhoto: "ఫోటో/వీడియో జోడించండి",
    getCurrentLocation: "ప్రస్తుత స్థానం పొందండి",
    locationCaptured: "స్థానం సంగ్రహించబడింది",
    submitReport: "నివేదిక సమర్పించండి",
    issueReported: "సమస్య విజయవంతంగా నివేదించబడింది",
    
    // Dump Yard
    pollutionZones: "కాలుష్య ప్రమాద జోన్లు",
    healthRisks: "ఆరోగ్య ప్రమాదాలు",
    affectedGroups: "ప్రభావితమైన సమూహాలు",
    redZone: "రెడ్ జోన్ - అధిక ప్రమాదం",
    orangeZone: "ఆరంజ్ జోన్ - మధ్యస్థ ప్రమాదం",
    greenZone: "సురక్షిత జోన్",
    children: "పిల్లలు",
    pregnantWomen: "గర్భిణీ స్త్రీలు",
    elderly: "వృద్ధులు",
    
    // Fitness
    dailySteps: "రోజువారీ అడుగులు",
    weeklyProgress: "వారపు పురోగతి",
    fitnessScore: "ఫిట్‌నెస్ స్కోర్",
    logSteps: "అడుగులు నమోదు చేయండి",
    challenges: "ఛాలెంజ్‌లు",
    joinChallenge: "ఛాలెంజ్‌లో చేరండి",
    leaderboard: "లీడర్‌బోర్డ్",
    wardStats: "వార్డు గణాంకాలు",
    pollutionAlert: "కాలుష్య హెచ్చరిక",
    unsafeOutdoor: "బయటి వ్యాయామానికి అసురక్షితం",
    bestTimeExercise: "వ్యాయామానికి ఉత్తమ సమయం",
    
    // Benefits
    citizenBenefits: "పౌర ప్రయోజనాలు",
    healthCheckup: "ఉచిత ఆరోగ్య పరీక్ష",
    educationVoucher: "విద్యా వౌచర్",
    insurance: "ప్రమాద బీమా",
    healthInsurance: "ఆరోగ్య బీమా సహాయం",
    applyNow: "ఇప్పుడే దరఖాస్తు చేయండి",
    eligibility: "అర్హత",
    applicationStatus: "దరఖాస్తు స్థితి",
    pending: "పెండింగ్",
    approved: "ఆమోదించబడింది",
    rejected: "తిరస్కరించబడింది",
    
    // Expenditure
    wardExpenditure: "వార్డు ఖర్చులు",
    yearWise: "సంవత్సరం వారీగా",
    categoryWise: "వర్గం వారీగా",
    amountSpent: "ఖర్చు చేసిన మొత్తం",
    groundReality: "వాస్తవ పరిస్థితి",
    rtiDocuments: "RTI పత్రాలు",
    
    // Polls
    activePollsTitle: "సక్రియ పోల్స్",
    vote: "ఓటు వేయండి",
    voted: "ఓటు వేశారు",
    results: "ఫలితాలు",
    totalVotes: "మొత్తం ఓట్లు",
    
    // Admin/Volunteer
    volunteerDashboard: "వలంటీర్ డాష్‌బోర్డ్",
    adminDashboard: "అడ్మిన్ డాష్‌బోర్డ్",
    pendingVerification: "ధృవీకరణ పెండింగ్",
    verify: "ధృవీకరించు",
    escalate: "పెంచు",
    closeIssue: "సమస్య మూసివేయి",
    issueHeatmap: "సమస్య హీట్‌మ్యాప్",
    analytics: "విశ్లేషణలు"
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("dammaiguda_language");
    return saved || "te"; // Default to Telugu
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
