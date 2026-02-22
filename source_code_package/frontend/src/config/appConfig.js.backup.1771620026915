/**
 * WHITE-LABEL APP CONFIGURATION
 * 
 * Change these values to rebrand the app for different areas.
 * This single file controls all branding, colors, and area-specific content.
 * 
 * HOW TO USE:
 * 1. Copy this file
 * 2. Change values for new area
 * 3. Build and deploy
 * 
 * OR use the clone generator: node scripts/create-area.js <area-id>
 */

const APP_CONFIG = {
  // ============== AREA IDENTITY ==============
  area: {
    id: "dammaiguda",
    name: "Dammaiguda",
    name_te: "దమ్మాయిగూడ",
    tagline: "Track Issues. Protect Health. Claim Benefits.",
    tagline_te: "సమస్యలను ట్రాక్ చేయండి. ఆరోగ్యాన్ని రక్షించండి. ప్రయోజనాలు పొందండి.",
    
    // Location details
    zone: "Medchal-Malkajgiri",
    district: "Medchal-Malkajgiri",
    state: "Telangana",
    pincode: "500083",
    
    // Political info
    ward_number: 15,
    mla: "MLA Name",
    corporator: "Corporator Name",
    mp: "MP Name",
  },

  // ============== APP BRANDING ==============
  branding: {
    appName: "My Dammaiguda",
    appNameShort: "My Dammaiguda",
    
    // Colors (change these for different area themes)
    primaryColor: "#0F766E",      // Teal
    primaryColorLight: "#14B8A6",
    primaryColorDark: "#0D5D56",
    accentColor: "#F59E0B",       // Amber
    backgroundColor: "#0a0a0a",
    
    // Logo URLs - update for each area
    logo: "https://static.prod-images.emergentagent.com/jobs/b415d412-3e65-4362-a62f-f8bab1368136/images/fd09263f1ffaceb3dad575cd85696c5fbff1a43edc5d0829bc8e76785518ca64.png",
    logoSmall: "/logo192.png",
    favicon: "/favicon.ico",
    
    // Partner logos
    partnerLogo: "https://customer-assets.emergentagent.com/job_b415d412-3e65-4362-a62f-f8bab1368136/artifacts/zoaa3k1e_Untitled%20design%20%2823%29.png",
    partnerName: "Kaizer News",
  },

  // ============== COMPANY INFO ==============
  company: {
    name: "Sharkify Technology Pvt. Ltd.",
    name_te: "షార్కిఫై టెక్నాలజీ ప్రైవేట్ లిమిటెడ్",
    email: "support@sharkify.in",
    phone: "+91 9876543210",
    website: "https://sharkify.in",
    address: "Hyderabad, Telangana",
  },

  // ============== DOMAIN & URLS ==============
  urls: {
    domain: "mydammaiguda.in",
    playStore: "https://play.google.com/store/apps/details?id=com.sharkify.mydammaiguda",
    privacyPolicy: "/privacy-policy",
    termsOfService: "/terms-of-service",
    deleteAccount: "/delete-account",
  },

  // ============== PLAY STORE INFO ==============
  playStore: {
    packageName: "com.sharkify.mydammaiguda",
    appId: "my-dammaiguda-app",
    developerName: "Sharkify Technology Pvt. Ltd.",
    category: "Social",
  },

  // ============== FEATURES TOGGLE ==============
  features: {
    news: true,
    fitness: true,
    astrology: true,
    issues: true,
    aqi: true,
    dumpYard: true,        // Only Dammaiguda has dump yard
    polls: true,
    wardExpenditure: true,
    chat: true,
    volunteers: true,
    education: true,
    shop: true,
    wall: true,
    stories: true,
    benefits: true,
    family: true,
    doctor: true,
  },

  // ============== DUMP YARD CONFIG (Dammaiguda specific) ==============
  dumpYard: {
    enabled: true,
    name: "Jawahar Nagar Dump Yard",
    name_te: "జవహర్ నగర్ డంప్ యార్డ్",
    dailyWasteTons: 10000,
    areaAcres: 350,
    redZoneKm: 2,
  },

  // ============== AQI CONFIGURATION ==============
  aqi: {
    primaryStation: "dammaiguda",
    secondaryStation: "hyderabad",
    stations: {
      primary: {
        id: "dammaiguda",
        name: "Dammaiguda",
        name_te: "దమ్మాయిగూడ",
        lat: 17.4534,
        lon: 78.5674,
      },
      secondary: {
        id: "hyderabad",
        name: "Hyderabad",
        name_te: "హైదరాబాద్",
        lat: 17.385,
        lon: 78.4867,
      }
    }
  },

  // ============== NEWS SOURCES ==============
  news: {
    localCategory: "local",
    defaultSources: ["sakshi", "eenadu", "tv9"],
    enableVideoNews: true,
  },

  // ============== STATS (Landing Page) ==============
  stats: {
    benefitsAmount: "₹10Cr+",
    benefitsLabel: "Benefits to be Availed",
    benefitsLabel_te: "ప్రయోజనాలు పొందబడతాయి",
    problemsSolved: "100+",
    problemsLabel: "Local Problems to be Solved",
    problemsLabel_te: "స్థానిక సమస్యలు పరిష్కరించబడతాయి",
    peopleBenefited: "50K+",
    peopleLabel: "People to be Benefited",
    peopleLabel_te: "ప్రజలు ప్రయోజనం పొందుతారు",
  },

  // ============== SMS/OTP CONFIG ==============
  sms: {
    senderName: "MYDAMM",  // 6 char sender ID
    templatePrefix: "My Dammaiguda",
  },

  // ============== SOCIAL LINKS ==============
  social: {
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
    whatsapp: "",
  },
};

// ============== AREA PRESETS ==============
// Use these to quickly create new area clones
// Run: node scripts/create-area.js <area-id>

const AREA_PRESETS = {
  dammaiguda: {
    id: "dammaiguda",
    name: "Dammaiguda",
    name_te: "దమ్మాయిగూడ",
    primaryColor: "#0F766E",  // Teal
    domain: "mydammaiguda.in",
    packageName: "com.sharkify.mydammaiguda",
    senderName: "MYDAMM",
    features: {
      dumpYard: true,  // Only Dammaiguda has dump yard
    },
    dumpYard: {
      enabled: true,
      name: "Jawahar Nagar Dump Yard",
      name_te: "జవహర్ నగర్ డంప్ యార్డ్",
      dailyWasteTons: 10000,
    },
    aqi: {
      primaryStation: { id: "dammaiguda", name: "Dammaiguda", name_te: "దమ్మాయిగూడ", lat: 17.4534, lon: 78.5674 },
      secondaryStation: { id: "hyderabad", name: "Hyderabad", name_te: "హైదరాబాద్", lat: 17.385, lon: 78.4867 },
    },
    stats: { benefitsAmount: "₹10Cr+", problemsSolved: "100+", peopleBenefited: "50K+" },
  },
  asraonagar: {
    id: "asraonagar",
    name: "AS Rao Nagar",
    name_te: "ఏఎస్ రావు నగర్",
    primaryColor: "#2563EB",  // Blue
    domain: "myasraonagar.in",
    packageName: "com.sharkify.myasraonagar",
    senderName: "MYASRN",
    features: {
      dumpYard: false,  // No dump yard
    },
    dumpYard: { enabled: false },
    aqi: {
      primaryStation: { id: "asraonagar", name: "AS Rao Nagar", name_te: "ఏఎస్ రావు నగర్", lat: 17.4456, lon: 78.5563 },
      secondaryStation: { id: "hyderabad", name: "Hyderabad", name_te: "హైదరాబాద్", lat: 17.385, lon: 78.4867 },
    },
    stats: { benefitsAmount: "₹8Cr+", problemsSolved: "80+", peopleBenefited: "40K+" },
  },
  kapra: {
    id: "kapra",
    name: "Kapra",
    name_te: "కాప్ర",
    primaryColor: "#7C3AED",  // Purple
    domain: "mykapra.in",
    packageName: "com.sharkify.mykapra",
    senderName: "MYKAPR",
    features: {
      dumpYard: false,
    },
    dumpYard: { enabled: false },
    aqi: {
      primaryStation: { id: "kapra", name: "Kapra", name_te: "కాప్ర", lat: 17.4789, lon: 78.5321 },
      secondaryStation: { id: "hyderabad", name: "Hyderabad", name_te: "హైదరాబాద్", lat: 17.385, lon: 78.4867 },
    },
    stats: { benefitsAmount: "₹7Cr+", problemsSolved: "60+", peopleBenefited: "35K+" },
  },
  bachupally: {
    id: "bachupally",
    name: "Bachupally",
    name_te: "బాచుపల్లి",
    primaryColor: "#DC2626",  // Red
    domain: "mybachupally.in",
    packageName: "com.sharkify.mybachupally",
    senderName: "MYBCPL",
    features: {
      dumpYard: false,
    },
    dumpYard: { enabled: false },
    aqi: {
      primaryStation: { id: "bachupally", name: "Bachupally", name_te: "బాచుపల్లి", lat: 17.5234, lon: 78.3876 },
      secondaryStation: { id: "hyderabad", name: "Hyderabad", name_te: "హైదరాబాద్", lat: 17.385, lon: 78.4867 },
    },
    stats: { benefitsAmount: "₹6Cr+", problemsSolved: "50+", peopleBenefited: "30K+" },
  },
  kukatpally: {
    id: "kukatpally",
    name: "Kukatpally",
    name_te: "కూకట్‌పల్లి",
    primaryColor: "#EA580C",  // Orange
    domain: "mykukatpally.in",
    packageName: "com.sharkify.mykukatpally",
    senderName: "MYKKTL",
    features: {
      dumpYard: false,
    },
    dumpYard: { enabled: false },
    aqi: {
      primaryStation: { id: "kukatpally", name: "Kukatpally", name_te: "కూకట్‌పల్లి", lat: 17.4947, lon: 78.3996 },
      secondaryStation: { id: "hyderabad", name: "Hyderabad", name_te: "హైదరాబాద్", lat: 17.385, lon: 78.4867 },
    },
    stats: { benefitsAmount: "₹12Cr+", problemsSolved: "120+", peopleBenefited: "60K+" },
  },
  malkajgiri: {
    id: "malkajgiri",
    name: "Malkajgiri",
    name_te: "మల్కాజ్‌గిరి",
    primaryColor: "#059669",  // Emerald
    domain: "mymalkajgiri.in",
    packageName: "com.sharkify.mymalkajgiri",
    senderName: "MYMLKJ",
    features: {
      dumpYard: false,
    },
    dumpYard: { enabled: false },
    aqi: {
      primaryStation: { id: "malkajgiri", name: "Malkajgiri", name_te: "మల్కాజ్‌గిరి", lat: 17.4589, lon: 78.5234 },
      secondaryStation: { id: "hyderabad", name: "Hyderabad", name_te: "హైదరాబాద్", lat: 17.385, lon: 78.4867 },
    },
    stats: { benefitsAmount: "₹9Cr+", problemsSolved: "90+", peopleBenefited: "45K+" },
  },
  uppal: {
    id: "uppal",
    name: "Uppal",
    name_te: "ఉప్పల్",
    primaryColor: "#0891B2",  // Cyan
    domain: "myuppal.in",
    packageName: "com.sharkify.myuppal",
    senderName: "MYUPPL",
    features: {
      dumpYard: false,
    },
    dumpYard: { enabled: false },
    aqi: {
      primaryStation: { id: "uppal", name: "Uppal", name_te: "ఉప్పల్", lat: 17.4012, lon: 78.5567 },
      secondaryStation: { id: "hyderabad", name: "Hyderabad", name_te: "హైదరాబాద్", lat: 17.385, lon: 78.4867 },
    },
    stats: { benefitsAmount: "₹8Cr+", problemsSolved: "70+", peopleBenefited: "38K+" },
  },
};

// Helper function to generate full config from preset
const generateConfigFromPreset = (presetId) => {
  const preset = AREA_PRESETS[presetId];
  if (!preset) return null;
  
  return {
    ...APP_CONFIG,
    area: {
      ...APP_CONFIG.area,
      id: preset.id,
      name: preset.name,
      name_te: preset.name_te,
    },
    branding: {
      ...APP_CONFIG.branding,
      appName: `My ${preset.name}`,
      appNameShort: `My ${preset.name}`,
      primaryColor: preset.primaryColor,
    },
    urls: {
      ...APP_CONFIG.urls,
      domain: preset.domain,
      playStore: `https://play.google.com/store/apps/details?id=${preset.packageName}`,
    },
    playStore: {
      ...APP_CONFIG.playStore,
      packageName: preset.packageName,
      appId: `my-${preset.id}-app`,
    },
    features: {
      ...APP_CONFIG.features,
      ...preset.features,
    },
    dumpYard: preset.dumpYard,
    aqi: {
      primaryStation: preset.aqi.primaryStation.id,
      secondaryStation: preset.aqi.secondaryStation.id,
      stations: {
        primary: preset.aqi.primaryStation,
        secondary: preset.aqi.secondaryStation,
      },
    },
    stats: {
      ...APP_CONFIG.stats,
      ...preset.stats,
    },
    sms: {
      ...APP_CONFIG.sms,
      senderName: preset.senderName,
      templatePrefix: `My ${preset.name}`,
    },
  };
};

export { APP_CONFIG, AREA_PRESETS, generateConfigFromPreset };
export default APP_CONFIG;
