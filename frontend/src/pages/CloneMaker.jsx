import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
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
  GraduationCap,
  Shield,
  Rocket,
  FolderOpen,
  Settings,
  Globe,
  Package,
  Trash2,
  Plus,
  ChevronRight,
  Loader2,
  CheckCircle,
  MapPin,
  Github,
  Link,
  ExternalLink,
  Archive
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Gradient presets for themes
const GRADIENT_PRESETS = [
  { name: "Teal", colors: ["#0F766E", "#14B8A6"], id: "teal" },
  { name: "Purple", colors: ["#7C3AED", "#A855F7"], id: "purple" },
  { name: "Blue", colors: ["#2563EB", "#3B82F6"], id: "blue" },
  { name: "Orange", colors: ["#EA580C", "#F97316"], id: "orange" },
  { name: "Red", colors: ["#DC2626", "#EF4444"], id: "red" },
  { name: "Green", colors: ["#059669", "#10B981"], id: "green" },
  { name: "Pink", colors: ["#DB2777", "#EC4899"], id: "pink" },
  { name: "Indigo", colors: ["#4F46E5", "#6366F1"], id: "indigo" },
  { name: "Cyan", colors: ["#0891B2", "#06B6D4"], id: "cyan" },
  { name: "Amber", colors: ["#D97706", "#F59E0B"], id: "amber" },
  { name: "Emerald", colors: ["#047857", "#10B981"], id: "emerald" },
  { name: "Rose", colors: ["#E11D48", "#F43F5E"], id: "rose" },
];

// All 300 Hyderabad areas
const ALL_AREAS = [
  "Keesara", "Chandpuri Colony", "Jawahar Nagar", "Dammaiguda", "Nagaram", "Ghatkesar", "Edulabad", "Pocharam", "Medipally", "Peerzadi Guda",
  "Boduppal", "Changi Charla", "Kapra", "Vampuguda", "Dr. A.S. Rao Nagar", "Chakripuram", "Charla Pally", "Shakti Sai Nagar", "Meerpet HB Colony", "Mallapur",
  "Nacharam", "HMT Nagar", "Chilkanagar", "Beerappagadda", "Habshi Guda", "Ramantapur", "Venkat Reddy Nagar", "Uppal", "Nagole", "Kothapet",
  "Chaitanya Puri", "Gaddiannaram", "Saroor Nagar", "Doctors Colony", "R.K. Puram", "NTR Nagar", "Lingoji Guda", "Champapet", "Karman Ghat", "Biramal Guda",
  "Hastinapuram", "B.N. Reddy Nagar", "Vanatsalipuram", "Chittalkunta", "Mansoorabad", "Sai Nagar", "Lecturers Colony", "High Court Colony", "Sahib Nagar", "Hayath Nagar",
  "Pedda Ambarpet", "Thorur", "Kongara Kalan", "Adibatla", "Turkayamjal", "Balapur", "Nadargul", "Prashanti Hills", "Jalilguda", "Meerpet",
  "Badangpet", "Bandlaguda", "Shaheen Nagar", "Pahadi Sharif", "Jalpalli", "Thukuguda", "Imamguda", "Bandlaguda Jagir", "Noori Nagar", "Barkas",
  "Kanchanbagh", "Chandrayanagutta", "Riyasatnagar", "Eidi Bazaar", "Jangammet", "Kandikal Gate", "Quadri Chaman", "Gowlipura", "Aman Nagar", "Yakutpura",
  "Dabirpura", "Rain Bazaar", "Madanapet", "Banunagar", "Santosh Nagar", "IS Sadan", "Saraswati Nagar", "Saidabad", "Asmangarh", "Moosaram Bagh",
  "Old Malakpet", "MCH Colony", "Akbar Bagh", "Chawani", "Kala Dera", "Azampura", "Purani Haveli", "Pathergatti", "Hari Bowli", "Qazipura",
  "Ghansi Bazar", "Puranapul", "Bahadurpura", "Shah Ali Banda", "Falaknuma", "Jahanuma", "Nawab Sahab Kunta", "Teegal Kunta", "Chandu Lal Baradari", "Ramnastpura",
  "Kishanbagh", "Attapur", "Hydergowda", "Sulaiman Nagar", "Shastripuram", "Katedhan", "Melardevpalli", "Shamshabad", "Kotwalgowda", "Rajendranagar",
  "Bandlaguda Colony", "Kismatapur", "Hydershahkote", "Narsingi", "Gandipet", "Kokapet", "Manikonda", "Neknampur", "Nizam Colony", "Nanal Nagar",
  "Tolichowki", "Golconda", "Ibrahim Bagh", "Langar Houz", "Guddi Malkapur", "Karwan", "Tappachabutra", "Zia Guda", "Asif Nagar", "Padmanabha Nagar",
  "Mehdipatnam", "Syed Nagar", "Vijay Nagar Colony", "Ahmed Nagar", "Shanti Nagar", "Red Hills", "Mallepalli", "Dattatreya Nagar", "Manghalhat", "Goshamahal",
  "Begum Bazaar", "Jambagh", "Exhibition Ground", "Gun Foundry", "Kachiguda", "Tulsi Ramnagar", "Gol Naka", "Patel Nagar", "Amberpet", "DD Colony",
  "Tilak Nagar", "Nallakunta", "Adikmet", "Bagh Lingampally", "Gandhi Nagar", "Kavadiguda", "Bakaram", "Bholakpur", "Musheerabad", "Ram Nagar",
  "Bapuji Nagar", "Buddha Nagar", "Tarnaka", "Sitaphal Mandi", "Chilkal Guda", "Mettuguda", "Lalapet", "North Lalaguda", "Addagutta", "East Anandbagh",
  "Mirjal Guda", "Gautam Nagar", "Malkajgiri", "Balram Nagar", "Safil Guda", "Moula Ali", "Vinayak Nagar", "Neredmet", "Yapral", "Turkapally",
  "Macha Bollaram", "Temple Alwal", "Venkatapuram", "Bhudevi Nagar", "Kanaji Guda", "Monda Market", "Padmarao Nagar", "Bhansi Lalpet", "Ram Gopalpet", "Begumpet",
  "Ameerpet", "SR Nagar", "BK Guda", "Sanath Nagar", "Erragadda", "Madhura Nagar", "Srinagar Colony", "Yusuf Guda", "Vengal Rao Nagar", "Krishna Nagar",
  "Rehmat Nagar", "Karmika Nagar", "Rajiv Nagar", "Borabanda", "Jubilee Hills", "Venkateshwara Colony", "Iram Manzil", "Somajiguda", "Khairatabad", "Himayat Nagar",
  "Banjara Hills", "Film Nagar", "Sheikhpet", "OU Colony", "Gachibowli", "Nallagandla", "Serilingampally", "Masjid Banda", "Sri Ram Nagar", "Anjaiah Nagar",
  "Hi-Tech City", "Madhapur", "Izzath Nagar", "Kondapur", "Matrusri Nagar", "Hafeezpet", "Madeenaguda", "Chanda Nagar", "Deepthisri Nagar", "Miyapur",
  "BK Enclave", "Mayuri Nagar", "Hydernagar", "Bhagyanagar Colony", "Shamshiguda", "Allwyn Colony", "Vevikanand Nagar Colony", "Kamlaprasa Nagar", "Kukatpally", "Balaji Nagar",
  "Vasnath Nagar", "KPHB Colony", "Kaithalapur", "Gayatri Nagar", "Allapur", "Moti Nagar", "Moosapet", "Prashant Nagar", "Balanagar", "Fateh Nagar",
  "Prakash Nagar", "Old Bowenpally", "Tellapur", "Hashmatpet", "Muthangi", "Patancheru", "JP Colony", "Ramachandrapuram", "Bharathi Nagar", "Aminpur",
  "Sultanpur", "Bollaram", "Nizampet", "Bachupally", "Bandari Layout", "Pragathi Nagar", "Mahadevpuram", "Gajularamaram", "Rodsmestri Nagar", "Jagatgiri Gutta",
  "Rangareddy Nagar", "Chintal", "Giri Nagar", "Qutubullahpur", "Padma Nagar", "Suchitra", "Jeedimetla", "Kompally", "Doolapally", "Ram Reddy Nagar",
  "Shahpur Nagar", "Subhash Nagar", "Suraram", "Bahadurpally", "Bowrampet", "Dundigal", "Medchal", "Kistapur", "Gundlapochampally", "Thumkunta", "Secunderabad"
];

// Helper to generate area ID from name
const generateAreaId = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);

// Helper to generate sender name (max 6 chars)
const generateSenderName = (name) => {
  const words = name.split(' ');
  if (words.length === 1) return ('MY' + words[0].slice(0, 4)).toUpperCase();
  return ('MY' + words.map(w => w[0]).join('')).toUpperCase().slice(0, 6);
};

// Generate area presets dynamically
const AREA_PRESETS = {};
ALL_AREAS.forEach((name, index) => {
  const id = generateAreaId(name);
  const colorIndex = index % GRADIENT_PRESETS.length;
  AREA_PRESETS[id] = {
    id,
    name,
    name_te: "",
    primaryColor: GRADIENT_PRESETS[colorIndex].colors[0],
    gradientColors: GRADIENT_PRESETS[colorIndex].colors,
    domain: `my${id}.in`,
    packageName: `com.civic.my${id}`,
    senderName: generateSenderName(name),
    lat: 17.385 + (Math.random() * 0.2 - 0.1),
    lon: 78.486 + (Math.random() * 0.2 - 0.1),
    stats: { benefits: "₹5Cr+", problems: "50+", people: "25K+" }
  };
});

export default function CloneMaker() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [deployedClones, setDeployedClones] = useState([]);
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [copied, setCopied] = useState({});
  
  // GitHub state
  const [showGitHub, setShowGitHub] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [pushingToGithub, setPushingToGithub] = useState(false);
  
  // Area search state
  const [areaSearch, setAreaSearch] = useState("");
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  
  // Filter areas based on search
  const filteredAreas = Object.entries(AREA_PRESETS).filter(([key, preset]) =>
    preset.name.toLowerCase().includes(areaSearch.toLowerCase())
  ).slice(0, 20); // Limit to 20 results for performance
  
  // Form state
  const [config, setConfig] = useState({
    area_id: "",
    area_name: "",
    area_name_te: "",
    primary_color: "#0F766E",
    gradient_color_1: "#0F766E",
    gradient_color_2: "#14B8A6",
    use_gradient: false,
    domain: "",
    package_name: "",
    sender_name: "",
    tagline: "Track Issues. Protect Health. Claim Benefits.",
    tagline_te: "సమస్యలను ట్రాక్ చేయండి. ఆరోగ్యాన్ని కాపాడండి.",
    company_name: "Rohan Kulkarni",
    partner_name: "Kaizer News",
    education_partner: "Bose American Academy",
    stats_benefits: "₹5Cr+",
    stats_problems: "50+",
    stats_people: "25K+",
    lat: 17.4534,
    lon: 78.5674
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchDeployedClones();
    }
  }, [user]);

  const fetchDeployedClones = async () => {
    try {
      const res = await axios.get(`${API}/clone/list`, { headers });
      setDeployedClones(res.data.clones || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPreset = (presetId) => {
    const preset = AREA_PRESETS[presetId];
    if (preset) {
      setConfig({
        area_id: preset.id,
        area_name: preset.name,
        area_name_te: preset.name_te,
        primary_color: preset.primaryColor,
        domain: preset.domain,
        package_name: preset.packageName,
        sender_name: preset.senderName,
        tagline: "Track Issues. Protect Health. Claim Benefits.",
        tagline_te: "సమస్యలను ట్రాక్ చేయండి. ఆరోగ్యాన్ని కాపాడండి.",
        company_name: "Rohan Kulkarni",
        partner_name: "Kaizer News",
        education_partner: "Bose American Academy",
        stats_benefits: preset.stats.benefits,
        stats_problems: preset.stats.problems,
        stats_people: preset.stats.people,
        lat: preset.lat,
        lon: preset.lon
      });
      toast.success(`Loaded ${preset.name} preset`);
    }
  };

  const generateConfig = async () => {
    if (!config.area_id || !config.area_name) {
      toast.error("Please fill in area ID and name");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/clone/generate`, config, { headers });
      setGeneratedFiles(res.data.files);
      toast.success("Configuration generated!");
      setActiveTab("files");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const deployClone = async () => {
    if (!config.area_id) {
      toast.error("Please configure the clone first");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/clone/deploy`, {
        config,
        deploy_type: "production"
      }, { headers });
      
      setGeneratedFiles(res.data.files);
      toast.success(`${config.area_name} clone deployed!`);
      fetchDeployedClones();
      setActiveTab("files");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Deployment failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteClone = async (cloneId) => {
    if (!confirm("Delete this clone configuration?")) return;
    
    try {
      await axios.delete(`${API}/clone/${cloneId}`, { headers });
      toast.success("Clone deleted");
      fetchDeployedClones();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const copyToClipboard = (key, content) => {
    navigator.clipboard.writeText(content);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
    toast.success("Copied to clipboard!");
  };

  const downloadFile = (filename, content) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const downloadAllFiles = () => {
    if (!generatedFiles) return;
    
    Object.entries(generatedFiles).forEach(([filename, content]) => {
      setTimeout(() => downloadFile(filename, content), 100);
    });
    toast.success("All files downloaded!");
  };

  const downloadZip = async () => {
    if (!config.area_id) {
      toast.error("Please configure the clone first");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/clone/download-zip`, config, {
        headers,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my-${config.area_id}-clone.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("ZIP downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download ZIP");
    } finally {
      setLoading(false);
    }
  };

  const pushToGitHub = async () => {
    if (!githubToken) {
      toast.error("Please enter your GitHub token");
      return;
    }
    if (!config.area_id) {
      toast.error("Please configure the clone first");
      return;
    }
    
    setPushingToGithub(true);
    try {
      const res = await axios.post(`${API}/clone/push-to-github`, {
        config,
        github_token: githubToken,
        repo_name: repoName || `my-${config.area_id}`,
        is_private: isPrivate
      }, { headers });
      
      toast.success("Pushed to GitHub successfully!");
      setShowGitHub(false);
      
      // Open repo in new tab
      window.open(res.data.repo_url, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to push to GitHub");
    } finally {
      setPushingToGithub(false);
    }
  };

  const openGitHubTokenPage = () => {
    window.open("https://github.com/settings/tokens/new?scopes=repo&description=CloneMaker", "_blank");
  };

  if (user?.role !== "admin") {
    return (
      <Layout title="Clone Maker">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Clone Maker">
      <div className="space-y-6 pb-20" data-testid="clone-maker">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl">Clone Maker</h1>
            <p className="text-sm text-muted-foreground">
              Generate white-label apps for different areas
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="create">
              <Plus className="h-4 w-4 mr-1" /> Create
            </TabsTrigger>
            <TabsTrigger value="files">
              <FolderOpen className="h-4 w-4 mr-1" /> Files
            </TabsTrigger>
            <TabsTrigger value="deployed">
              <Globe className="h-4 w-4 mr-1" /> Deployed
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-4">
            {/* Preset Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Quick Presets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(AREA_PRESETS).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant={config.area_id === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => loadPreset(key)}
                      style={config.area_id === key ? { backgroundColor: preset.primaryColor } : {}}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Area ID</Label>
                    <Input
                      value={config.area_id}
                      onChange={(e) => setConfig({ ...config, area_id: e.target.value.toLowerCase().replace(/\s/g, '') })}
                      placeholder="e.g., dammaiguda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Area Name</Label>
                    <Input
                      value={config.area_name}
                      onChange={(e) => setConfig({ ...config, area_name: e.target.value })}
                      placeholder="e.g., Dammaiguda"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telugu Name</Label>
                    <Input
                      value={config.area_name_te}
                      onChange={(e) => setConfig({ ...config, area_name_te: e.target.value })}
                      placeholder="e.g., దమ్మాయిగూడ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.primary_color}
                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={config.primary_color}
                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                        placeholder="#0F766E"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Input
                      value={config.domain}
                      onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                      placeholder="e.g., mydammaiguda.in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Package Name</Label>
                    <Input
                      value={config.package_name}
                      onChange={(e) => setConfig({ ...config, package_name: e.target.value })}
                      placeholder="e.g., com.sharkify.mydammaiguda"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Benefits Amount</Label>
                    <Input
                      value={config.stats_benefits}
                      onChange={(e) => setConfig({ ...config, stats_benefits: e.target.value })}
                      placeholder="₹5Cr+"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Problems Solved</Label>
                    <Input
                      value={config.stats_problems}
                      onChange={(e) => setConfig({ ...config, stats_problems: e.target.value })}
                      placeholder="50+"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>People Benefited</Label>
                    <Input
                      value={config.stats_people}
                      onChange={(e) => setConfig({ ...config, stats_people: e.target.value })}
                      placeholder="25K+"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={generateConfig}
                      disabled={loading || !config.area_id}
                      className="flex-1"
                      variant="outline"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Code className="h-4 w-4 mr-2" />}
                      Generate Files
                    </Button>
                    <Button
                      onClick={deployClone}
                      disabled={loading || !config.area_id}
                      className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                      Deploy Clone
                    </Button>
                  </div>
                  
                  {/* GitHub & ZIP Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={downloadZip}
                      disabled={loading || !config.area_id}
                      className="flex-1"
                      variant="secondary"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Download ZIP
                    </Button>
                    <Button
                      onClick={() => setShowGitHub(true)}
                      disabled={!config.area_id}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      Push to GitHub
                    </Button>
                  </div>
                </div>
                
                {/* GitHub Modal */}
                {showGitHub && (
                  <Card className="mt-4 border-2 border-gray-800">
                    <CardHeader className="pb-3 bg-gray-900 text-white rounded-t-lg">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Github className="h-5 w-5" /> Push to GitHub
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Create a new repository with clone files
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>GitHub Personal Access Token</Label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxx"
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openGitHubTokenPage}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" /> Get Token
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Need 'repo' scope. <span className="text-blue-500 cursor-pointer" onClick={openGitHubTokenPage}>Create one here</span>
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Repository Name</Label>
                        <Input
                          value={repoName}
                          onChange={(e) => setRepoName(e.target.value)}
                          placeholder={`my-${config.area_id}`}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Private Repository</Label>
                        <Switch
                          checked={isPrivate}
                          onCheckedChange={setIsPrivate}
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowGitHub(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={pushToGitHub}
                          disabled={pushingToGithub || !githubToken}
                          className="flex-1 bg-gray-900 hover:bg-gray-800"
                        >
                          {pushingToGithub ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Github className="h-4 w-4 mr-2" />
                          )}
                          {pushingToGithub ? "Pushing..." : "Push to GitHub"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            {config.area_name && (
              <Card style={{ borderColor: config.primary_color }}>
                <CardHeader className="pb-3" style={{ backgroundColor: `${config.primary_color}15` }}>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: config.primary_color }}
                    >
                      {config.area_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">My {config.area_name}</h3>
                      <p className="text-sm text-muted-foreground">{config.tagline}</p>
                      <p className="text-xs text-muted-foreground mt-1">{config.domain}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            {generatedFiles ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Generated Files</h3>
                  <Button onClick={downloadAllFiles} size="sm">
                    <Download className="h-4 w-4 mr-2" /> Download All
                  </Button>
                </div>

                {Object.entries(generatedFiles).map(([filename, content]) => (
                  <Card key={filename}>
                    <CardHeader className="py-3 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-blue-500" />
                        <span className="font-mono text-sm">{filename}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(filename, content)}
                        >
                          {copied[filename] ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadFile(filename, content)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto">
                        {content.slice(0, 500)}{content.length > 500 ? "..." : ""}
                      </pre>
                    </CardContent>
                  </Card>
                ))}

                {/* Deployment Instructions */}
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" /> Deployment Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-green-600">1</Badge>
                      <span>Save <code>appConfig.js</code> to <code>src/config/</code></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-green-600">2</Badge>
                      <span>Replace <code>manifest.json</code> in <code>public/</code></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-green-600">3</Badge>
                      <span>Add <code>securityShield.js</code> to <code>src/utils/</code></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-green-600">4</Badge>
                      <span>Update <code>.env</code> with backend URL</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-green-600">5</Badge>
                      <span>Deploy to Railway & connect domain</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Generate files first from the Create tab</p>
              </div>
            )}
          </TabsContent>

          {/* Deployed Tab */}
          <TabsContent value="deployed" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Deployed Clones ({deployedClones.length})</h3>
              <Button size="sm" variant="outline" onClick={fetchDeployedClones}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>

            {deployedClones.length > 0 ? (
              <div className="space-y-3">
                {deployedClones.map((clone) => (
                  <Card key={clone.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: clone.primary_color }}
                          >
                            {clone.area_name?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold">My {clone.area_name}</h4>
                            <p className="text-xs text-muted-foreground">{clone.domain}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {clone.status || "deployed"}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => deleteClone(clone.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No clones deployed yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
