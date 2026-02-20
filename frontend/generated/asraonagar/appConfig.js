/**
 * WHITE-LABEL APP CONFIGURATION for AS Rao Nagar
 * Generated: 2026-02-20T20:27:07.499Z
 */

const APP_CONFIG = {
  area: {
    id: "asraonagar",
    name: "AS Rao Nagar",
    name_te: "ఏఎస్ రావు నగర్",
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

  branding: {
    appName: "My AS Rao Nagar",
    appNameShort: "My AS Rao Nagar",
    primaryColor: "#2563EB",
    primaryColorLight: "#4d8bff",
    primaryColorDark: "#0745cd",
    accentColor: "#F59E0B",
    backgroundColor: "#0a0a0a",
    logo: "/logo512.png",
    logoSmall: "/logo192.png",
    favicon: "/favicon.ico",
    partnerLogo: "",
    partnerName: "",
  },

  company: {
    name: "Sharkify Technology Pvt. Ltd.",
    name_te: "షార్కిఫై టెక్నాలజీ ప్రైవేట్ లిమిటెడ్",
    email: "support@sharkify.in",
    phone: "+91 9876543210",
    website: "https://sharkify.in",
    address: "Hyderabad, Telangana",
  },

  urls: {
    domain: "myasraonagar.in",
    playStore: "https://play.google.com/store/apps/details?id=com.sharkify.myasraonagar",
    privacyPolicy: "/privacy-policy",
    termsOfService: "/terms-of-service",
    deleteAccount: "/delete-account",
  },

  playStore: {
    packageName: "com.sharkify.myasraonagar",
    appId: "my-asraonagar-app",
    developerName: "Sharkify Technology Pvt. Ltd.",
    category: "Social",
  },

  features: {
    news: true,
    fitness: true,
    astrology: true,
    issues: true,
    aqi: true,
    dumpYard: false,
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

  dumpYard: {
    enabled: false,
    
  },

  aqi: {
    primaryStation: "asraonagar",
    secondaryStation: "hyderabad",
    stations: {
      primary: {
        id: "asraonagar",
        name: "AS Rao Nagar",
        name_te: "ఏఎస్ రావు నగర్",
        lat: 17.45,
        lon: 78.5,
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

  news: {
    localCategory: "local",
    defaultSources: ["sakshi", "eenadu", "tv9"],
    enableVideoNews: true,
  },

  stats: {
    benefitsAmount: "₹5Cr+",
    benefitsLabel: "Benefits to be Availed",
    benefitsLabel_te: "ప్రయోజనాలు పొందబడతాయి",
    problemsSolved: "50+",
    problemsLabel: "Local Problems to be Solved",
    problemsLabel_te: "స్థానిక సమస్యలు పరిష్కరించబడతాయి",
    peopleBenefited: "25K+",
    peopleLabel: "People to be Benefited",
    peopleLabel_te: "ప్రజలు ప్రయోజనం పొందుతారు",
  },

  sms: {
    senderName: "MYASRN",
    templatePrefix: "My AS Rao Nagar",
  },

  social: {
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
    whatsapp: "",
  },
};

export default APP_CONFIG;
