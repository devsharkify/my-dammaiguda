import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Copy,
  Download,
  Check,
  Palette,
  Building,
  Eye,
  Code,
  FileJson,
  Smartphone,
  RefreshCw,
  GraduationCap
} from "lucide-react";

// Area presets matching the CLI tool
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

export default function CloneMaker() {
  const { user } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isCustom, setIsCustom] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState(null);
  
  // Custom area form
  const [customArea, setCustomArea] = useState({
    id: "",
    name: "",
    name_te: "",
    primaryColor: "#0F766E",
    domain: "",
    dumpYard: false,
    lat: "17.45",
    lon: "78.50",
    benefitsAmount: "₹5Cr+",
    problemsSolved: "50+",
    peopleBenefited: "25K+",
  });

  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    setIsCustom(false);
    setGeneratedConfig(null);
  };

  const handleCustomChange = (field, value) => {
    setCustomArea(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && !prev.id ? { id: value.toLowerCase().replace(/\s+/g, '') } : {}),
      ...(field === 'id' ? { domain: `my${value}.in` } : {}),
    }));
  };

  const generateConfig = () => {
    const config = isCustom ? {
      ...customArea,
      packageName: `com.sharkify.my${customArea.id}`,
      senderName: `MY${customArea.id.substring(0, 4).toUpperCase()}`,
      stats: {
        benefitsAmount: customArea.benefitsAmount,
        problemsSolved: customArea.problemsSolved,
        peopleBenefited: customArea.peopleBenefited,
      }
    } : AREA_PRESETS[selectedPreset];

    if (!config) {
      toast.error("Please select a preset or fill custom area details");
      return;
    }

    // Generate appConfig.js content
    const configContent = generateConfigContent(config);
    const manifestContent = generateManifestContent(config);
    
    setGeneratedConfig({
      config: configContent,
      manifest: manifestContent,
      area: config,
    });
    
    toast.success(`Configuration generated for ${config.name}!`);
  };

  const generateConfigContent = (cfg) => {
    return `// White-Label Config for ${cfg.name}
// Generated: ${new Date().toISOString()}

const APP_CONFIG = {
  area: {
    id: "${cfg.id}",
    name: "${cfg.name}",
    name_te: "${cfg.name_te}",
    tagline: "Track Issues. Protect Health. Claim Benefits.",
  },
  branding: {
    appName: "My ${cfg.name}",
    primaryColor: "${cfg.primaryColor}",
  },
  features: {
    dumpYard: ${cfg.dumpYard},
    // ... all other features: true
  },
  stats: {
    benefitsAmount: "${cfg.stats?.benefitsAmount || '₹5Cr+'}",
    problemsSolved: "${cfg.stats?.problemsSolved || '50+'}",
    peopleBenefited: "${cfg.stats?.peopleBenefited || '25K+'}",
  },
  urls: {
    domain: "${cfg.domain}",
    packageName: "${cfg.packageName}",
  },
};

export default APP_CONFIG;`;
  };

  const generateManifestContent = (cfg) => {
    return JSON.stringify({
      name: `My ${cfg.name} - Civic Engagement Platform`,
      short_name: `My ${cfg.name}`,
      theme_color: cfg.primaryColor,
      background_color: "#0a0a0a",
      display: "standalone",
      start_url: "/",
    }, null, 2);
  };

  const downloadConfig = (type) => {
    if (!generatedConfig) return;
    
    const content = type === 'config' ? generatedConfig.config : generatedConfig.manifest;
    const filename = type === 'config' ? 'appConfig.js' : 'manifest.json';
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${filename}`);
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  // Check admin access
  if (user?.role !== 'admin') {
    return (
      <Layout showBackButton title="Clone Maker">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
          <Building className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground">
            Only administrators can access the Clone Maker tool.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title="Clone Maker">
      <div className="space-y-6 pb-20" data-testid="clone-maker">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">🏘️ White-Label Clone Maker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate app configurations for different areas
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={!isCustom ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsCustom(false)}
          >
            Use Preset
          </Button>
          <Button
            variant={isCustom ? "default" : "outline"}
            className="flex-1"
            onClick={() => { setIsCustom(true); setSelectedPreset(null); }}
          >
            Custom Area
          </Button>
        </div>

        {/* Preset Selection */}
        {!isCustom && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Area Preset</CardTitle>
              <CardDescription>Choose from pre-configured areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(AREA_PRESETS).map(([id, preset]) => (
                  <button
                    key={id}
                    onClick={() => handlePresetSelect(id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedPreset === id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <span className="font-medium text-sm">{preset.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{preset.name_te}</p>
                    <div className="flex gap-1 mt-2">
                      {preset.dumpYard && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Trash2 className="w-3 h-3 mr-1" />
                          Dump Yard
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Area Form */}
        {isCustom && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Custom Area Details</CardTitle>
              <CardDescription>Configure a new area from scratch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Area Name</Label>
                  <Input
                    placeholder="Kompally"
                    value={customArea.name}
                    onChange={(e) => handleCustomChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Telugu Name</Label>
                  <Input
                    placeholder="కొంపల్లి"
                    value={customArea.name_te}
                    onChange={(e) => handleCustomChange('name_te', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Area ID (no spaces)</Label>
                <Input
                  placeholder="kompally"
                  value={customArea.id}
                  onChange={(e) => handleCustomChange('id', e.target.value.toLowerCase().replace(/\s+/g, ''))}
                />
              </div>

              <div>
                <Label className="text-xs">Primary Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleCustomChange('primaryColor', color.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        customArea.primaryColor === color.value
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Has Dump Yard?</span>
                </div>
                <Switch
                  checked={customArea.dumpYard}
                  onCheckedChange={(checked) => handleCustomChange('dumpYard', checked)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Benefits</Label>
                  <Input
                    placeholder="₹5Cr+"
                    value={customArea.benefitsAmount}
                    onChange={(e) => handleCustomChange('benefitsAmount', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Problems</Label>
                  <Input
                    placeholder="50+"
                    value={customArea.problemsSolved}
                    onChange={(e) => handleCustomChange('problemsSolved', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">People</Label>
                  <Input
                    placeholder="25K+"
                    value={customArea.peopleBenefited}
                    onChange={(e) => handleCustomChange('peopleBenefited', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        <Button
          className="w-full h-12"
          onClick={generateConfig}
          disabled={!selectedPreset && !customArea.name}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate Configuration
        </Button>

        {/* Generated Config Preview */}
        {generatedConfig && (
          <Card className="border-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Configuration Ready
                </CardTitle>
                <Badge style={{ backgroundColor: generatedConfig.area.primaryColor }}>
                  {generatedConfig.area.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Preview Card */}
              <div
                className="p-4 rounded-xl text-white"
                style={{ backgroundColor: generatedConfig.area.primaryColor }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">My {generatedConfig.area.name}</h3>
                    <p className="text-sm opacity-80">{generatedConfig.area.name_te}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {generatedConfig.area.dumpYard ? (
                    <Badge className="bg-white/20 text-white">🏭 Has Dump Yard</Badge>
                  ) : (
                    <Badge className="bg-white/20 text-white">✅ No Dump Yard</Badge>
                  )}
                </div>
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadConfig('config')}
                  className="h-12"
                >
                  <Code className="w-4 h-4 mr-2" />
                  appConfig.js
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadConfig('manifest')}
                  className="h-12"
                >
                  <FileJson className="w-4 h-4 mr-2" />
                  manifest.json
                </Button>
              </div>

              {/* Copy Config */}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => copyToClipboard(generatedConfig.config)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Config to Clipboard
              </Button>

              {/* Code Preview */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {showPreview && (
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto max-h-48">
                    {generatedConfig.config}
                  </pre>
                )}
              </div>

              {/* Instructions */}
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-800 mb-1">📋 Deployment Steps:</p>
                <ol className="text-blue-700 space-y-1 text-xs list-decimal pl-4">
                  <li>Download both files above</li>
                  <li>Replace <code>src/config/appConfig.js</code></li>
                  <li>Replace <code>public/manifest.json</code></li>
                  <li>Update logo files in <code>/public/icons/</code></li>
                  <li>Run <code>yarn build</code> and deploy!</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CLI Instructions */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">💻 For developers - use CLI:</p>
            <code className="text-xs bg-background p-2 rounded block">
              node scripts/create-area.js {selectedPreset || 'asraonagar'} --deploy
            </code>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
