#!/usr/bin/env node

/**
 * White-Label Area Clone Generator v2.0
 * 
 * Features:
 *   - Use presets for quick cloning
 *   - Create custom areas interactively
 *   - Auto-deploy with --deploy flag
 * 
 * Usage:
 *   node scripts/create-area.js                    # Show help
 *   node scripts/create-area.js asraonagar         # Generate config only
 *   node scripts/create-area.js asraonagar --deploy # Generate + auto-copy files
 *   node scripts/create-area.js kompally --new     # Create new custom area
 *   node scripts/create-area.js --list             # List all presets
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============== AREA PRESETS ==============
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
    lat: 17.4534,
    lon: 78.5674,
    stats: { benefitsAmount: "₹10Cr+", problemsSolved: "100+", peopleBenefited: "50K+" },
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
    lat: 17.4456,
    lon: 78.5563,
    stats: { benefitsAmount: "₹8Cr+", problemsSolved: "80+", peopleBenefited: "40K+" },
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
    lat: 17.4789,
    lon: 78.5321,
    stats: { benefitsAmount: "₹7Cr+", problemsSolved: "60+", peopleBenefited: "35K+" },
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
    lat: 17.5234,
    lon: 78.3876,
    stats: { benefitsAmount: "₹6Cr+", problemsSolved: "50+", peopleBenefited: "30K+" },
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
    lat: 17.4947,
    lon: 78.3996,
    stats: { benefitsAmount: "₹12Cr+", problemsSolved: "120+", peopleBenefited: "60K+" },
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
    lat: 17.4589,
    lon: 78.5234,
    stats: { benefitsAmount: "₹9Cr+", problemsSolved: "90+", peopleBenefited: "45K+" },
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
    lat: 17.4012,
    lon: 78.5567,
    stats: { benefitsAmount: "₹8Cr+", problemsSolved: "70+", peopleBenefited: "38K+" },
  },
};

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

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

// ============== COLOR HELPERS ==============
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

function lightenColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    Math.min(255, rgb.r + 40),
    Math.min(255, rgb.g + 40),
    Math.min(255, rgb.b + 40)
  );
}

function darkenColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    Math.max(0, rgb.r - 30),
    Math.max(0, rgb.g - 30),
    Math.max(0, rgb.b - 30)
  );
}

// ============== GENERATE CONFIG CONTENT ==============
function generateConfigContent(cfg) {
  return `/**
 * WHITE-LABEL APP CONFIGURATION - ${cfg.name}
 * Generated: ${new Date().toISOString()}
 * 
 * To switch areas, replace this file with another area's config.
 */

const APP_CONFIG = {
  // ============== AREA IDENTITY ==============
  area: {
    id: "${cfg.id}",
    name: "${cfg.name}",
    name_te: "${cfg.name_te}",
    tagline: "Track Issues. Protect Health. Claim Benefits.",
    tagline_te: "సమస్యలను ట్రాక్ చేయండి. ఆరోగ్యాన్ని రక్షించండి. ప్రయోజనాలు పొందండి.",
    zone: "Medchal-Malkajgiri",
    district: "Medchal-Malkajgiri",
    state: "Telangana",
    pincode: "${cfg.pincode || '500000'}",
    ward_number: ${cfg.wardNumber || 1},
    mla: "${cfg.mla || 'MLA Name'}",
    corporator: "${cfg.corporator || 'Corporator Name'}",
    mp: "${cfg.mp || 'MP Name'}",
  },

  // ============== APP BRANDING ==============
  branding: {
    appName: "My ${cfg.name}",
    appNameShort: "My ${cfg.name}",
    primaryColor: "${cfg.primaryColor}",
    primaryColorLight: "${lightenColor(cfg.primaryColor)}",
    primaryColorDark: "${darkenColor(cfg.primaryColor)}",
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
    name: "Sharkify Technology Pvt. Ltd.",
    name_te: "షార్కిఫై టెక్నాలజీ ప్రైవేట్ లిమిటెడ్",
    email: "support@sharkify.in",
    phone: "+91 9876543210",
    website: "https://sharkify.in",
    address: "Hyderabad, Telangana",
  },

  // ============== DOMAIN & URLS ==============
  urls: {
    domain: "${cfg.domain}",
    playStore: "https://play.google.com/store/apps/details?id=${cfg.packageName}",
    privacyPolicy: "/privacy-policy",
    termsOfService: "/terms-of-service",
    deleteAccount: "/delete-account",
  },

  // ============== PLAY STORE INFO ==============
  playStore: {
    packageName: "${cfg.packageName}",
    appId: "my-${cfg.id}-app",
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
    dumpYard: ${cfg.dumpYard},
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
    enabled: ${cfg.dumpYard},
    ${cfg.dumpYard ? `name: "Local Dump Yard",
    name_te: "డంప్ యార్డ్",
    dailyWasteTons: 5000,
    areaAcres: 100,
    redZoneKm: 2,` : ''}
  },

  // ============== AQI CONFIGURATION ==============
  aqi: {
    primaryStation: "${cfg.id}",
    secondaryStation: "hyderabad",
    stations: {
      primary: {
        id: "${cfg.id}",
        name: "${cfg.name}",
        name_te: "${cfg.name_te}",
        lat: ${cfg.lat || 17.45},
        lon: ${cfg.lon || 78.50},
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
    benefitsAmount: "${cfg.stats?.benefitsAmount || '₹5Cr+'}",
    benefitsLabel: "Benefits to be Availed",
    benefitsLabel_te: "ప్రయోజనాలు పొందబడతాయి",
    problemsSolved: "${cfg.stats?.problemsSolved || '50+'}",
    problemsLabel: "Local Problems to be Solved",
    problemsLabel_te: "స్థానిక సమస్యలు పరిష్కరించబడతాయి",
    peopleBenefited: "${cfg.stats?.peopleBenefited || '25K+'}",
    peopleLabel: "People to be Benefited",
    peopleLabel_te: "ప్రజలు ప్రయోజనం పొందుతారు",
  },

  // ============== SMS/OTP CONFIG ==============
  sms: {
    senderName: "${cfg.senderName}",
    templatePrefix: "My ${cfg.name}",
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
const AREA_PRESETS = ${JSON.stringify(AREA_PRESETS, null, 2)};

const generateConfigFromPreset = (presetId) => {
  const preset = AREA_PRESETS[presetId];
  if (!preset) return null;
  return { ...APP_CONFIG, area: { ...APP_CONFIG.area, id: preset.id, name: preset.name } };
};

export { APP_CONFIG, AREA_PRESETS, generateConfigFromPreset };
export default APP_CONFIG;
`;
}

// ============== GENERATE MANIFEST ==============
function generateManifestContent(cfg) {
  return JSON.stringify({
    name: `My ${cfg.name} - Civic Engagement Platform`,
    short_name: `My ${cfg.name}`,
    version: "1.0.0",
    description: `Track Issues. Protect Health. Claim Benefits. Your civic engagement platform for ${cfg.name}, Telangana.`,
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
    theme_color: cfg.primaryColor,
    background_color: "#0a0a0a",
    orientation: "portrait",
    scope: "/",
    lang: "en",
    id: `my-${cfg.id}-app`,
    categories: ["government", "utilities", "lifestyle", "health"],
    prefer_related_applications: false,
  }, null, 2);
}

// ============== INTERACTIVE NEW AREA ==============
async function createNewArea(areaId) {
  console.log('\n🏗️  Creating new area configuration...\n');
  
  const name = await question('  Area name (e.g., "Kompally"): ');
  const name_te = await question('  Area name in Telugu (e.g., "కొంపల్లి"): ');
  
  console.log('\n  Available colors:');
  COLOR_OPTIONS.forEach((c, i) => console.log(`    ${i + 1}. ${c.name} (${c.value})`));
  const colorChoice = await question('  Choose color (1-10): ');
  const primaryColor = COLOR_OPTIONS[parseInt(colorChoice) - 1]?.value || '#0F766E';
  
  const hasDumpYard = (await question('  Has dump yard nearby? (y/n): ')).toLowerCase() === 'y';
  
  const lat = parseFloat(await question('  Latitude (e.g., 17.45): ')) || 17.45;
  const lon = parseFloat(await question('  Longitude (e.g., 78.50): ')) || 78.50;
  
  const benefitsAmount = await question('  Benefits amount (e.g., ₹5Cr+): ') || '₹5Cr+';
  const problemsSolved = await question('  Problems to solve (e.g., 50+): ') || '50+';
  const peopleBenefited = await question('  People to benefit (e.g., 25K+): ') || '25K+';
  
  return {
    id: areaId,
    name: name || areaId,
    name_te: name_te || areaId,
    primaryColor,
    domain: `my${areaId}.in`,
    packageName: `com.sharkify.my${areaId}`,
    senderName: `MY${areaId.substring(0, 4).toUpperCase()}`,
    dumpYard: hasDumpYard,
    lat,
    lon,
    stats: { benefitsAmount, problemsSolved, peopleBenefited },
  };
}

// ============== DEPLOY FILES ==============
function deployFiles(areaConfig, outputDir) {
  const srcDir = path.join(__dirname, '..');
  const configDest = path.join(srcDir, 'src', 'config', 'appConfig.js');
  const manifestDest = path.join(srcDir, 'public', 'manifest.json');
  
  // Backup existing files
  const timestamp = Date.now();
  if (fs.existsSync(configDest)) {
    fs.copyFileSync(configDest, `${configDest}.backup.${timestamp}`);
  }
  if (fs.existsSync(manifestDest)) {
    fs.copyFileSync(manifestDest, `${manifestDest}.backup.${timestamp}`);
  }
  
  // Copy new files
  fs.copyFileSync(path.join(outputDir, 'appConfig.js'), configDest);
  fs.copyFileSync(path.join(outputDir, 'manifest.json'), manifestDest);
  
  console.log('\n✅ Files deployed:');
  console.log(`   • ${configDest}`);
  console.log(`   • ${manifestDest}`);
  console.log(`\n💾 Backups saved with timestamp: ${timestamp}`);
  
  return { configDest, manifestDest, timestamp };
}

// ============== SHOW HELP ==============
function showHelp() {
  console.log(`
🏘️  White-Label Area Clone Generator v2.0

Usage:
  node scripts/create-area.js <area-id>            Generate config files only
  node scripts/create-area.js <area-id> --deploy   Generate and auto-deploy
  node scripts/create-area.js <area-id> --new      Create new custom area
  node scripts/create-area.js --list               List all available presets

Examples:
  node scripts/create-area.js asraonagar           # Use AS Rao Nagar preset
  node scripts/create-area.js kapra --deploy       # Deploy Kapra config
  node scripts/create-area.js kompally --new       # Create custom Kompally

Available Presets:`);
  
  Object.entries(AREA_PRESETS).forEach(([id, preset]) => {
    const dumpIcon = preset.dumpYard ? '🏭' : '✅';
    console.log(`  • ${id.padEnd(12)} ${preset.name.padEnd(15)} ${preset.name_te.padEnd(12)} ${dumpIcon} ${preset.primaryColor}`);
  });
  
  console.log(`
Legend: 🏭 = Has Dump Yard, ✅ = No Dump Yard
`);
}

// ============== MAIN ==============
async function main() {
  const args = process.argv.slice(2);
  
  // Show help
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    rl.close();
    return;
  }
  
  // List presets
  if (args.includes('--list')) {
    console.log('\n📋 Available Area Presets:\n');
    console.log('ID           | Name            | Telugu          | Dump Yard | Color');
    console.log('-------------|-----------------|-----------------|-----------|--------');
    Object.entries(AREA_PRESETS).forEach(([id, p]) => {
      console.log(`${id.padEnd(12)} | ${p.name.padEnd(15)} | ${p.name_te.padEnd(15)} | ${p.dumpYard ? 'Yes' : 'No '.padEnd(9)} | ${p.primaryColor}`);
    });
    rl.close();
    return;
  }
  
  const areaId = args[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const isNew = args.includes('--new');
  const shouldDeploy = args.includes('--deploy');
  
  let areaConfig;
  
  if (isNew || !AREA_PRESETS[areaId]) {
    if (!isNew && !AREA_PRESETS[areaId]) {
      console.log(`\n⚠️  Preset "${areaId}" not found. Creating new area...\n`);
    }
    areaConfig = await createNewArea(areaId);
  } else {
    areaConfig = AREA_PRESETS[areaId];
    console.log(`\n✅ Using preset: ${areaConfig.name} (${areaConfig.name_te})`);
    console.log(`   Primary Color: ${areaConfig.primaryColor}`);
    console.log(`   Dump Yard: ${areaConfig.dumpYard ? 'Yes' : 'No'}`);
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
  
  console.log('\n📁 Generated files:');
  console.log(`   • ${outputDir}/appConfig.js`);
  console.log(`   • ${outputDir}/manifest.json`);
  
  // Deploy if requested
  if (shouldDeploy) {
    console.log('\n🚀 Deploying files...');
    deployFiles(areaConfig, outputDir);
    
    console.log('\n📦 Ready to build! Run:');
    console.log('   cd /app/frontend && yarn build');
  } else {
    console.log('\n📋 To deploy manually:');
    console.log(`   1. cp ${outputDir}/appConfig.js src/config/appConfig.js`);
    console.log(`   2. cp ${outputDir}/manifest.json public/manifest.json`);
    console.log('   3. Update logo files in /public/icons/');
    console.log('   4. yarn build');
    
    console.log('\n⚡ Or use --deploy flag:');
    console.log(`   node scripts/create-area.js ${areaId} --deploy`);
  }
  
  console.log(`\n🎉 "${areaConfig.name}" configuration ready!\n`);
  
  rl.close();
}

main().catch(console.error);
