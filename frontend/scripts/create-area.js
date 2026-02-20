#!/usr/bin/env node

/**
 * White-Label Area Clone Generator
 * 
 * Creates a new area configuration from existing presets
 * or generates a new custom configuration.
 * 
 * Usage:
 *   node scripts/create-area.js <area-id>        # Use existing preset
 *   node scripts/create-area.js <area-id> --new  # Create new custom area
 * 
 * Examples:
 *   node scripts/create-area.js asraonagar
 *   node scripts/create-area.js kompally --new
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Available presets
const AREA_PRESETS = {
  dammaiguda: {
    id: "dammaiguda",
    name: "Dammaiguda",
    name_te: "దమ్మాయిగూడ",
    primaryColor: "#0F766E",
    domain: "mydammaiguda.in",
    packageName: "com.sharkify.mydammaiguda",
    senderName: "MYDAMM",
    dumpYard: true,
  },
  asraonagar: {
    id: "asraonagar",
    name: "AS Rao Nagar",
    name_te: "ఏఎస్ రావు నగర్",
    primaryColor: "#2563EB",
    domain: "myasraonagar.in",
    packageName: "com.sharkify.myasraonagar",
    senderName: "MYASRN",
    dumpYard: false,
  },
  kapra: {
    id: "kapra",
    name: "Kapra",
    name_te: "కాప్ర",
    primaryColor: "#7C3AED",
    domain: "mykapra.in",
    packageName: "com.sharkify.mykapra",
    senderName: "MYKAPR",
    dumpYard: false,
  },
  bachupally: {
    id: "bachupally",
    name: "Bachupally",
    name_te: "బాచుపల్లి",
    primaryColor: "#DC2626",
    domain: "mybachupally.in",
    packageName: "com.sharkify.mybachupally",
    senderName: "MYBCPL",
    dumpYard: false,
  },
  kukatpally: {
    id: "kukatpally",
    name: "Kukatpally",
    name_te: "కూకట్‌పల్లి",
    primaryColor: "#EA580C",
    domain: "mykukatpally.in",
    packageName: "com.sharkify.mykukatpally",
    senderName: "MYKKTL",
    dumpYard: false,
  },
  malkajgiri: {
    id: "malkajgiri",
    name: "Malkajgiri",
    name_te: "మల్కాజ్‌గిరి",
    primaryColor: "#059669",
    domain: "mymalkajgiri.in",
    packageName: "com.sharkify.mymalkajgiri",
    senderName: "MYMLKJ",
    dumpYard: false,
  },
  uppal: {
    id: "uppal",
    name: "Uppal",
    name_te: "ఉప్పల్",
    primaryColor: "#0891B2",
    domain: "myuppal.in",
    packageName: "com.sharkify.myuppal",
    senderName: "MYUPPL",
    dumpYard: false,
  },
};

// Color options for new areas
const COLOR_OPTIONS = [
  { name: "Teal", value: "#0F766E" },
  { name: "Blue", value: "#2563EB" },
  { name: "Purple", value: "#7C3AED" },
  { name: "Red", value: "#DC2626" },
  { name: "Orange", value: "#EA580C" },
  { name: "Emerald", value: "#059669" },
  { name: "Cyan", value: "#0891B2" },
  { name: "Pink", value: "#DB2777" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Amber", value: "#D97706" },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

// Generate config file content
function generateConfigContent(areaConfig) {
  const configTemplate = `/**
 * WHITE-LABEL APP CONFIGURATION for ${areaConfig.name}
 * Generated: ${new Date().toISOString()}
 */

const APP_CONFIG = {
  area: {
    id: "${areaConfig.id}",
    name: "${areaConfig.name}",
    name_te: "${areaConfig.name_te}",
    tagline: "Track Issues. Protect Health. Claim Benefits.",
    tagline_te: "సమస్యలను ట్రాక్ చేయండి. ఆరోగ్యాన్ని రక్షించండి. ప్రయోజనాలు పొందండి.",
    zone: "Medchal-Malkajgiri",
    district: "Medchal-Malkajgiri",
    state: "Telangana",
    pincode: "${areaConfig.pincode || '500000'}",
    ward_number: ${areaConfig.wardNumber || 1},
    mla: "${areaConfig.mla || 'MLA Name'}",
    corporator: "${areaConfig.corporator || 'Corporator Name'}",
    mp: "${areaConfig.mp || 'MP Name'}",
  },

  branding: {
    appName: "My ${areaConfig.name}",
    appNameShort: "My ${areaConfig.name}",
    primaryColor: "${areaConfig.primaryColor}",
    primaryColorLight: "${lightenColor(areaConfig.primaryColor)}",
    primaryColorDark: "${darkenColor(areaConfig.primaryColor)}",
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
    domain: "${areaConfig.domain}",
    playStore: "https://play.google.com/store/apps/details?id=${areaConfig.packageName}",
    privacyPolicy: "/privacy-policy",
    termsOfService: "/terms-of-service",
    deleteAccount: "/delete-account",
  },

  playStore: {
    packageName: "${areaConfig.packageName}",
    appId: "my-${areaConfig.id}-app",
    developerName: "Sharkify Technology Pvt. Ltd.",
    category: "Social",
  },

  features: {
    news: true,
    fitness: true,
    astrology: true,
    issues: true,
    aqi: true,
    dumpYard: ${areaConfig.dumpYard},
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
    enabled: ${areaConfig.dumpYard},
    ${areaConfig.dumpYard ? `name: "Dump Yard",
    name_te: "డంప్ యార్డ్",
    dailyWasteTons: 5000,
    areaAcres: 100,
    redZoneKm: 2,` : ''}
  },

  aqi: {
    primaryStation: "${areaConfig.id}",
    secondaryStation: "hyderabad",
    stations: {
      primary: {
        id: "${areaConfig.id}",
        name: "${areaConfig.name}",
        name_te: "${areaConfig.name_te}",
        lat: ${areaConfig.lat || 17.45},
        lon: ${areaConfig.lon || 78.50},
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
    benefitsAmount: "${areaConfig.benefitsAmount || '₹5Cr+'}",
    benefitsLabel: "Benefits to be Availed",
    benefitsLabel_te: "ప్రయోజనాలు పొందబడతాయి",
    problemsSolved: "${areaConfig.problemsSolved || '50+'}",
    problemsLabel: "Local Problems to be Solved",
    problemsLabel_te: "స్థానిక సమస్యలు పరిష్కరించబడతాయి",
    peopleBenefited: "${areaConfig.peopleBenefited || '25K+'}",
    peopleLabel: "People to be Benefited",
    peopleLabel_te: "ప్రజలు ప్రయోజనం పొందుతారు",
  },

  sms: {
    senderName: "${areaConfig.senderName}",
    templatePrefix: "My ${areaConfig.name}",
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
`;

  return configTemplate;
}

// Generate manifest.json content
function generateManifestContent(areaConfig) {
  return JSON.stringify({
    name: `My ${areaConfig.name} - Civic Engagement Platform`,
    short_name: `My ${areaConfig.name}`,
    version: "1.0.0",
    description: `Track Issues. Protect Health. Claim Benefits. Your civic engagement platform for ${areaConfig.name}, Telangana.`,
    icons: [
      { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "any" },
      { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "any" },
      { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "any" },
      { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "any" },
      { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    start_url: "/",
    display: "standalone",
    theme_color: areaConfig.primaryColor,
    background_color: "#0a0a0a",
    orientation: "portrait",
    scope: "/",
    lang: "en",
    dir: "ltr",
    id: `my-${areaConfig.id}-app`,
    categories: ["government", "utilities", "lifestyle", "health"],
    prefer_related_applications: false,
  }, null, 2);
}

// Helper functions for color manipulation
function lightenColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const lighter = {
    r: Math.min(255, rgb.r + 40),
    g: Math.min(255, rgb.g + 40),
    b: Math.min(255, rgb.b + 40),
  };
  return rgbToHex(lighter.r, lighter.g, lighter.b);
}

function darkenColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const darker = {
    r: Math.max(0, rgb.r - 30),
    g: Math.max(0, rgb.g - 30),
    b: Math.max(0, rgb.b - 30),
  };
  return rgbToHex(darker.r, darker.g, darker.b);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Interactive area creation
async function createNewArea(areaId) {
  console.log('\n🏗️  Creating new area configuration...\n');
  
  const name = await question('Area name (e.g., "Kompally"): ');
  const name_te = await question('Area name in Telugu (e.g., "కొంపల్లి"): ');
  
  console.log('\nAvailable colors:');
  COLOR_OPTIONS.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} (${c.value})`));
  const colorChoice = await question('Choose color (1-10): ');
  const primaryColor = COLOR_OPTIONS[parseInt(colorChoice) - 1]?.value || '#0F766E';
  
  const hasDumpYard = (await question('Has dump yard nearby? (y/n): ')).toLowerCase() === 'y';
  
  const lat = parseFloat(await question('Latitude (e.g., 17.45): ')) || 17.45;
  const lon = parseFloat(await question('Longitude (e.g., 78.50): ')) || 78.50;
  
  return {
    id: areaId,
    name,
    name_te,
    primaryColor,
    domain: `my${areaId}.in`,
    packageName: `com.sharkify.my${areaId}`,
    senderName: `MY${areaId.substring(0, 4).toUpperCase()}`,
    dumpYard: hasDumpYard,
    lat,
    lon,
  };
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n🏘️  White-Label Area Clone Generator\n');
    console.log('Usage:');
    console.log('  node scripts/create-area.js <area-id>        # Use existing preset');
    console.log('  node scripts/create-area.js <area-id> --new  # Create new custom area\n');
    console.log('Available presets:');
    Object.keys(AREA_PRESETS).forEach(id => {
      const preset = AREA_PRESETS[id];
      console.log(`  • ${id} - ${preset.name} (${preset.name_te})`);
    });
    rl.close();
    return;
  }
  
  const areaId = args[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const isNew = args.includes('--new');
  
  let areaConfig;
  
  if (isNew || !AREA_PRESETS[areaId]) {
    if (!isNew && !AREA_PRESETS[areaId]) {
      console.log(`\n⚠️  Preset "${areaId}" not found. Creating new area...\n`);
    }
    areaConfig = await createNewArea(areaId);
  } else {
    areaConfig = AREA_PRESETS[areaId];
    console.log(`\n✅ Using preset for ${areaConfig.name}\n`);
  }
  
  // Generate output directory
  const outputDir = path.join(__dirname, '..', 'generated', areaId);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate files
  const configContent = generateConfigContent(areaConfig);
  const manifestContent = generateManifestContent(areaConfig);
  
  fs.writeFileSync(path.join(outputDir, 'appConfig.js'), configContent);
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), manifestContent);
  
  console.log('📁 Generated files:');
  console.log(`   • ${outputDir}/appConfig.js`);
  console.log(`   • ${outputDir}/manifest.json`);
  
  console.log('\n📋 Next steps:');
  console.log(`   1. Copy appConfig.js to /src/config/appConfig.js`);
  console.log(`   2. Copy manifest.json to /public/manifest.json`);
  console.log(`   3. Update logo files in /public/icons/`);
  console.log(`   4. Update .env files with new domain`);
  console.log(`   5. Build and deploy!\n`);
  
  console.log(`🎉 Area "${areaConfig.name}" configuration ready!\n`);
  
  rl.close();
}

main().catch(console.error);
