/**
 * WHITE-LABEL APP CONFIGURATION - Dammaiguda
 * Generated: 2026-02-20T20:40:59.392Z
 * 
 * To switch areas, replace this file with another area's config.
 */

const APP_CONFIG = {
  // ============== AREA IDENTITY ==============
  area: {
    id: "dammaiguda",
    name: "Dammaiguda",
    name_te: "దమ్మాయిగూడ",
    tagline: "Track Issues. Protect Health. Claim Benefits.",
    tagline_te: "సమస్యలను ట్రాక్ చేయండి. ఆరోగ్యాన్ని రక్షించండి. ప్రయోజనాలు పొందండి.",
    zone: "Medchal-Malkajgiri",
    district: "Medchal-Malkajgiri",
    state: "Telangana",
    pincode: "500000",
    ward_number: 1,
    mla: "MLA Name",
    corporator: "Corporator Name",
    mp: "MP Name",
  },

  // ============== APP BRANDING ==============
  branding: {
    appName: "My Dammaiguda",
    appNameShort: "My Dammaiguda",
    primaryColor: "#0F766E",
    primaryColorLight: "#379e96",
    primaryColorDark: "#005850",
    accentColor: "#F59E0B",
    backgroundColor: "#0a0a0a",
    logo: "https://static.prod-images.emergentagent.com/jobs/b415d412-3e65-4362-a62f-f8bab1368136/images/fd09263f1ffaceb3dad575cd85696c5fbff1a43edc5d0829bc8e76785518ca64.png",
    logoSmall: "/logo192.png",
    favicon: "/favicon.ico",
    partnerLogo: "https://customer-assets.emergentagent.com/job_b415d412-3e65-4362-a62f-f8bab1368136/artifacts/zoaa3k1e_Untitled%20design%20%2823%29.png",
    partnerName: "Kaizer News",
  },

  // ============== COMPANY INFO ==============
  company: {
    name: "Rohan Kulkarni",
    name_te: "రోహన్ కుల్కర్ణి",
    email: "support@mydammaiguda.in",
    phone: "+91 9876543210",
    website: "https://mydammaiguda.in",
    address: "Hyderabad, Telangana",
  },

  // ============== DOMAIN & URLS ==============
  urls: {
    domain: "mydammaiguda.in",
    playStore: "https://play.google.com/store/apps/details?id=com.mydammaiguda.app",
    privacyPolicy: "/privacy-policy",
    termsOfService: "/terms-of-service",
    deleteAccount: "/delete-account",
  },

  // ============== PLAY STORE INFO ==============
  playStore: {
    packageName: "com.mydammaiguda.app",
    appId: "my-dammaiguda-app",
    developerName: "Rohan Kulkarni",
    category: "Social",
  },

  // ============== FEATURES TOGGLE ==============
  features: {
    news: true,
    fitness: true,
    astrology: true,
    issues: true,
    aqi: true,
    dumpYard: true,
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

  // ============== DUMP YARD CONFIG ==============
  dumpYard: {
    enabled: true,
    name: "Jawaharnagar Dump Yard",
    name_te: "జవహర్‌నగర్ డంప్ యార్డ్",
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
    senderName: "MYDAMM",
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

// Keep AREA_PRESETS for reference
const AREA_PRESETS = {
  "dammaiguda": {
    "id": "dammaiguda",
    "name": "Dammaiguda",
    "name_te": "దమ్మాయిగూడ",
    "primaryColor": "#0F766E",
    "domain": "mydammaiguda.in",
    "packageName": "com.sharkify.mydammaiguda",
    "senderName": "MYDAMM",
    "dumpYard": true,
    "lat": 17.4534,
    "lon": 78.5674,
    "stats": {
      "benefitsAmount": "₹10Cr+",
      "problemsSolved": "100+",
      "peopleBenefited": "50K+"
    }
  },
  "asraonagar": {
    "id": "asraonagar",
    "name": "AS Rao Nagar",
    "name_te": "ఏఎస్ రావు నగర్",
    "primaryColor": "#2563EB",
    "domain": "myasraonagar.in",
    "packageName": "com.sharkify.myasraonagar",
    "senderName": "MYASRN",
    "dumpYard": false,
    "lat": 17.4456,
    "lon": 78.5563,
    "stats": {
      "benefitsAmount": "₹8Cr+",
      "problemsSolved": "80+",
      "peopleBenefited": "40K+"
    }
  },
  "kapra": {
    "id": "kapra",
    "name": "Kapra",
    "name_te": "కాప్ర",
    "primaryColor": "#7C3AED",
    "domain": "mykapra.in",
    "packageName": "com.sharkify.mykapra",
    "senderName": "MYKAPR",
    "dumpYard": false,
    "lat": 17.4789,
    "lon": 78.5321,
    "stats": {
      "benefitsAmount": "₹7Cr+",
      "problemsSolved": "60+",
      "peopleBenefited": "35K+"
    }
  },
  "bachupally": {
    "id": "bachupally",
    "name": "Bachupally",
    "name_te": "బాచుపల్లి",
    "primaryColor": "#DC2626",
    "domain": "mybachupally.in",
    "packageName": "com.sharkify.mybachupally",
    "senderName": "MYBCPL",
    "dumpYard": false,
    "lat": 17.5234,
    "lon": 78.3876,
    "stats": {
      "benefitsAmount": "₹6Cr+",
      "problemsSolved": "50+",
      "peopleBenefited": "30K+"
    }
  },
  "kukatpally": {
    "id": "kukatpally",
    "name": "Kukatpally",
    "name_te": "కూకట్‌పల్లి",
    "primaryColor": "#EA580C",
    "domain": "mykukatpally.in",
    "packageName": "com.sharkify.mykukatpally",
    "senderName": "MYKKTL",
    "dumpYard": false,
    "lat": 17.4947,
    "lon": 78.3996,
    "stats": {
      "benefitsAmount": "₹12Cr+",
      "problemsSolved": "120+",
      "peopleBenefited": "60K+"
    }
  },
  "malkajgiri": {
    "id": "malkajgiri",
    "name": "Malkajgiri",
    "name_te": "మల్కాజ్‌గిరి",
    "primaryColor": "#059669",
    "domain": "mymalkajgiri.in",
    "packageName": "com.sharkify.mymalkajgiri",
    "senderName": "MYMLKJ",
    "dumpYard": false,
    "lat": 17.4589,
    "lon": 78.5234,
    "stats": {
      "benefitsAmount": "₹9Cr+",
      "problemsSolved": "90+",
      "peopleBenefited": "45K+"
    }
  },
  "uppal": {
    "id": "uppal",
    "name": "Uppal",
    "name_te": "ఉప్పల్",
    "primaryColor": "#0891B2",
    "domain": "myuppal.in",
    "packageName": "com.sharkify.myuppal",
    "senderName": "MYUPPL",
    "dumpYard": false,
    "lat": 17.4012,
    "lon": 78.5567,
    "stats": {
      "benefitsAmount": "₹8Cr+",
      "problemsSolved": "70+",
      "peopleBenefited": "38K+"
    }
  }
};

const generateConfigFromPreset = (presetId) => {
  const preset = AREA_PRESETS[presetId];
  if (!preset) return null;
  return { ...APP_CONFIG, area: { ...APP_CONFIG.area, id: preset.id, name: preset.name } };
};

export { APP_CONFIG, AREA_PRESETS, generateConfigFromPreset };
export default APP_CONFIG;
