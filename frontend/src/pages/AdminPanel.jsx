import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { toast } from "sonner";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import AlertsPanel from "../components/AlertsPanel";
import ReportsPanel from "../components/ReportsPanel";
import {
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Shield,
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Newspaper,
  FileText,
  Filter,
  ExternalLink,
  Copy,
  Building,
  LayoutDashboard,
  Megaphone,
  Link as LinkIcon,
  Home,
  UserPlus,
  Phone,
  Settings,
  Palette,
  Image,
  Type,
  Save,
  Activity,
  Bell,
  Download
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Area configurations
const AREAS = {
  all: { id: "all", name: "All Areas", name_te: "అన్ని ప్రాంతాలు", color: "#6B7280" },
  dammaiguda: { id: "dammaiguda", name: "Dammaiguda", name_te: "దమ్మాయిగూడ", color: "#0F766E", domain: "mydammaiguda.in" },
  asraonagar: { id: "asraonagar", name: "AS Rao Nagar", name_te: "ఏఎస్ రావు నగర్", color: "#2563EB", domain: "myasraonagar.in" },
  kapra: { id: "kapra", name: "Kapra", name_te: "కాప్ర", color: "#7C3AED", domain: "mykapra.in" },
  bachupally: { id: "bachupally", name: "Bachupally", name_te: "బాచుపల్లి", color: "#DC2626", domain: "mybachupally.in" },
  kukatpally: { id: "kukatpally", name: "Kukatpally", name_te: "కూకట్‌పల్లి", color: "#EA580C", domain: "mykukatpally.in" },
  malkajgiri: { id: "malkajgiri", name: "Malkajgiri", name_te: "మల్కాజ్‌గిరి", color: "#059669", domain: "mymalkajgiri.in" },
  uppal: { id: "uppal", name: "Uppal", name_te: "ఉప్పల్", color: "#0891B2", domain: "myuppal.in" },
};

// Quick Links for Admin
const ADMIN_LINKS = [
  { name: "User App", icon: Home, url: "/dashboard", description: "Main user-facing app" },
  { name: "Admin Panel", icon: LayoutDashboard, url: "/admin/panel", description: "Multi-area management" },
  { name: "Manager Portal", icon: Shield, url: "/manager", description: "Manager login", external: true },
  { name: "Clone Maker", icon: Copy, url: "/admin/clone", description: "Generate area configs" },
  { name: "News Manager", icon: Newspaper, url: "/admin-dashboard?tab=news", description: "Manage news content" },
  { name: "Course Manager", icon: GraduationCap, url: "/admin-dashboard?tab=courses", description: "Manage courses" },
  { name: "User Manager", icon: Users, url: "/admin-dashboard?tab=users", description: "Manage users" },
  { name: "Analytics", icon: BarChart3, url: "/admin-dashboard?tab=overview", description: "View analytics" },
  { name: "Issues", icon: AlertTriangle, url: "/admin-dashboard?tab=issues", description: "Manage issues" },
];

export default function AdminPanel() {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Area filter state
  const [selectedArea, setSelectedArea] = useState(searchParams.get("area") || "all");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [courses, setCourses] = useState([]);
  const [news, setNews] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // Dialog states
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showNewsDialog, setShowNewsDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showManagerDialog, setShowManagerDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [managers, setManagers] = useState([]);
  
  // Form states
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    instructor: "",
    thumbnail: "",
    video_url: "",
    areas: ["all"], // Which areas this applies to
  });
  
  const [newsForm, setNewsForm] = useState({
    title: "",
    content: "",
    image_url: "",
    category: "local",
    areas: ["all"],
  });
  
  const [templateForm, setTemplateForm] = useState({
    name: "",
    content: "",
    type: "notification",
    areas: ["all"],
  });
  
  const [managerForm, setManagerForm] = useState({
    phone: "",
    name: "",
    assigned_area: "",
  });
  
  // Site Settings states
  const [siteSettings, setSiteSettings] = useState({
    app_name: "",
    app_name_short: "",
    tagline: "",
    tagline_te: "",
    primary_color: "#0F766E",
    logo_url: "",
    partner_logo: "",
    partner_name: "",
    company_name: "",
    benefits_amount: "",
    problems_solved: "",
    people_benefited: "",
    banner_url: ""
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Update URL when area or tab changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedArea !== "all") params.set("area", selectedArea);
    if (activeTab !== "overview") params.set("tab", activeTab);
    setSearchParams(params);
  }, [selectedArea, activeTab, setSearchParams]);

  // Fetch data based on selected area
  useEffect(() => {
    fetchData();
  }, [selectedArea, token]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const areaParam = selectedArea !== "all" ? `?area=${selectedArea}` : "";
      
      // Fetch stats
      const statsRes = await axios.get(`${API}/admin/analytics${areaParam}`, { headers });
      setStats(statsRes.data);
      
      // Fetch courses
      const coursesRes = await axios.get(`${API}/education/courses${areaParam}`, { headers });
      setCourses(coursesRes.data?.courses || []);
      
      // Fetch news
      const newsRes = await axios.get(`${API}/news/admin${areaParam}`, { headers });
      setNews(newsRes.data?.items || []);
      
      // Fetch managers
      try {
        const managersRes = await axios.get(`${API}/manager/list`, { headers });
        setManagers(managersRes.data?.managers || []);
      } catch (e) {
        // Manager API might not be available
      }
      
      // Fetch site settings for selected area
      if (selectedArea !== "all") {
        try {
          const settingsRes = await axios.get(`${API}/settings/branding?area_id=${selectedArea}`, { headers });
          const data = settingsRes.data;
          setSiteSettings({
            app_name: data.branding?.app_name || "",
            app_name_short: data.branding?.app_name_short || "",
            tagline: data.branding?.tagline || "",
            tagline_te: data.branding?.tagline_te || "",
            primary_color: data.branding?.primary_color || "#0F766E",
            logo_url: data.branding?.logo_url || "",
            partner_logo: data.branding?.partner_logo || "",
            partner_name: data.branding?.partner_name || "",
            company_name: data.branding?.company_name || "",
            benefits_amount: data.stats?.benefits_amount || "",
            problems_solved: data.stats?.problems_solved || "",
            people_benefited: data.stats?.people_benefited || "",
            banner_url: data.banner_url || ""
          });
        } catch (e) {
          // Settings API might not have data yet
        }
      }
      
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const createManager = async () => {
    if (!managerForm.phone || !managerForm.name || !managerForm.assigned_area) {
      toast.error("Please fill all fields");
      return;
    }
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/manager/create`, managerForm, { headers });
      toast.success("Manager created successfully");
      setShowManagerDialog(false);
      setManagerForm({ phone: "", name: "", assigned_area: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create manager");
    }
  };
  
  const removeManager = async (managerId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API}/manager/${managerId}`, { headers });
      toast.success("Manager removed");
      fetchData();
    } catch (err) {
      toast.error("Failed to remove manager");
    }
  };
  
  const saveSiteSettings = async () => {
    if (selectedArea === "all") {
      toast.error("Please select a specific area to update settings");
      return;
    }
    
    setSavingSettings(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/settings/branding`, {
        area_id: selectedArea,
        branding: {
          app_name: siteSettings.app_name,
          app_name_short: siteSettings.app_name_short,
          tagline: siteSettings.tagline,
          tagline_te: siteSettings.tagline_te,
          primary_color: siteSettings.primary_color,
          logo_url: siteSettings.logo_url,
          partner_logo: siteSettings.partner_logo,
          partner_name: siteSettings.partner_name,
          company_name: siteSettings.company_name
        },
        stats: {
          benefits_amount: siteSettings.benefits_amount,
          problems_solved: siteSettings.problems_solved,
          people_benefited: siteSettings.people_benefited
        },
        banner_url: siteSettings.banner_url
      }, { headers });
      
      toast.success(`Settings saved for ${AREAS[selectedArea]?.name}`);
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAreaChange = (areaId) => {
    setSelectedArea(areaId);
  };

  // Area Selection Component for Forms
  const AreaSelector = ({ value, onChange, label = "Apply to Areas" }) => {
    const toggleArea = (areaId) => {
      if (areaId === "all") {
        onChange(["all"]);
      } else {
        const newAreas = value.filter(a => a !== "all");
        if (newAreas.includes(areaId)) {
          onChange(newAreas.filter(a => a !== areaId));
        } else {
          onChange([...newAreas, areaId]);
        }
      }
    };

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(AREAS).map(([id, area]) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleArea(id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                value.includes(id) || (id === "all" && value.includes("all"))
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: area.color }}
              />
              {area.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Filter data by selected area
  const filterByArea = (items) => {
    if (selectedArea === "all") return items;
    return items.filter(item => 
      item.areas?.includes("all") || 
      item.areas?.includes(selectedArea) ||
      item.area === selectedArea
    );
  };

  // Check admin access
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">
              Please login with admin credentials to access this panel.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = "/admin"}>
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" data-testid="admin-panel">
      {/* Top Header Bar */}
      <header className="bg-gray-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Panel</h1>
                <p className="text-xs text-gray-400">Multi-Area Management</p>
              </div>
            </div>

            {/* Area Filter - Primary Control */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={selectedArea} onValueChange={handleAreaChange}>
                  <SelectTrigger className="border-0 bg-transparent text-white w-[180px] focus:ring-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: AREAS[selectedArea]?.color }}
                      />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AREAS).map(([id, area]) => (
                      <SelectItem key={id} value={id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: area.color }}
                          />
                          {area.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2 text-sm">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-gray-300">{user?.name || "Admin"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Area Indicator Banner */}
        {selectedArea !== "all" && (
          <div 
            className="py-1.5 text-center text-sm font-medium"
            style={{ backgroundColor: AREAS[selectedArea]?.color }}
          >
            Viewing: {AREAS[selectedArea]?.name} ({AREAS[selectedArea]?.name_te})
            {AREAS[selectedArea]?.domain && (
              <span className="ml-2 opacity-80">• {AREAS[selectedArea]?.domain}</span>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Links Section */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Quick Links</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {ADMIN_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg border hover:border-primary hover:shadow-sm transition-all group"
              >
                <link.icon className="h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                <span className="text-xs text-center font-medium">{link.name}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border p-1 h-auto flex-wrap">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Download className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Site Settings
            </TabsTrigger>
            <TabsTrigger value="managers" className="gap-2">
              <Shield className="h-4 w-4" />
              Managers
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="h-4 w-4" />
              News
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <AlertsPanel />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportsPanel userRole="admin" />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold">{stats.total_users || 0}</p>
                    </div>
                    <Users className="h-10 w-10 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Issues</p>
                      <p className="text-3xl font-bold">{stats.pending_issues || 0}</p>
                    </div>
                    <AlertTriangle className="h-10 w-10 text-orange-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Courses</p>
                      <p className="text-3xl font-bold">{courses.length}</p>
                    </div>
                    <GraduationCap className="h-10 w-10 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">News Items</p>
                      <p className="text-3xl font-bold">{news.length}</p>
                    </div>
                    <Newspaper className="h-10 w-10 text-purple-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Area Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Area Distribution</CardTitle>
                <CardDescription>Content available in each area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(AREAS).filter(([id]) => id !== "all").map(([id, area]) => (
                    <div key={id} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="w-32 font-medium">{area.name}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ 
                            backgroundColor: area.color,
                            width: `${Math.random() * 60 + 40}%` // Placeholder
                          }}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {area.domain || "Not deployed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Site Settings Tab */}
          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Branding Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Branding Settings
                  </CardTitle>
                  <CardDescription>
                    {selectedArea === "all" 
                      ? "Select a specific area to edit branding" 
                      : `Edit branding for ${AREAS[selectedArea]?.name}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedArea === "all" ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Select a specific area from the filter above</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>App Name</Label>
                          <Input
                            value={siteSettings.app_name}
                            onChange={(e) => setSiteSettings(s => ({ ...s, app_name: e.target.value }))}
                            placeholder="My Dammaiguda"
                          />
                        </div>
                        <div>
                          <Label>Short Name</Label>
                          <Input
                            value={siteSettings.app_name_short}
                            onChange={(e) => setSiteSettings(s => ({ ...s, app_name_short: e.target.value }))}
                            placeholder="My Dammaiguda"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Tagline (English)</Label>
                        <Input
                          value={siteSettings.tagline}
                          onChange={(e) => setSiteSettings(s => ({ ...s, tagline: e.target.value }))}
                          placeholder="Track Issues. Protect Health. Claim Benefits."
                        />
                      </div>
                      
                      <div>
                        <Label>Tagline (Telugu)</Label>
                        <Input
                          value={siteSettings.tagline_te}
                          onChange={(e) => setSiteSettings(s => ({ ...s, tagline_te: e.target.value }))}
                          placeholder="సమస్యలను ట్రాక్ చేయండి..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={siteSettings.primary_color}
                              onChange={(e) => setSiteSettings(s => ({ ...s, primary_color: e.target.value }))}
                              className="w-14 h-10 p-1"
                            />
                            <Input
                              value={siteSettings.primary_color}
                              onChange={(e) => setSiteSettings(s => ({ ...s, primary_color: e.target.value }))}
                              placeholder="#0F766E"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Company Name</Label>
                          <Input
                            value={siteSettings.company_name}
                            onChange={(e) => setSiteSettings(s => ({ ...s, company_name: e.target.value }))}
                            placeholder="Sharkify Technology Pvt. Ltd."
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Logo URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={siteSettings.logo_url}
                            onChange={(e) => setSiteSettings(s => ({ ...s, logo_url: e.target.value }))}
                            placeholder="https://..."
                            className="flex-1"
                          />
                          {siteSettings.logo_url && (
                            <img src={siteSettings.logo_url} alt="Logo" className="h-10 w-10 rounded object-cover" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Partner Name</Label>
                          <Input
                            value={siteSettings.partner_name}
                            onChange={(e) => setSiteSettings(s => ({ ...s, partner_name: e.target.value }))}
                            placeholder="Kaizer News"
                          />
                        </div>
                        <div>
                          <Label>Partner Logo URL</Label>
                          <Input
                            value={siteSettings.partner_logo}
                            onChange={(e) => setSiteSettings(s => ({ ...s, partner_logo: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Stats & Banner Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Stats & Banner
                  </CardTitle>
                  <CardDescription>
                    Configure landing page stats and banner image
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedArea === "all" ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Select a specific area from the filter above</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Benefits Amount</Label>
                          <Input
                            value={siteSettings.benefits_amount}
                            onChange={(e) => setSiteSettings(s => ({ ...s, benefits_amount: e.target.value }))}
                            placeholder="₹10Cr+"
                          />
                        </div>
                        <div>
                          <Label>Problems Solved</Label>
                          <Input
                            value={siteSettings.problems_solved}
                            onChange={(e) => setSiteSettings(s => ({ ...s, problems_solved: e.target.value }))}
                            placeholder="100+"
                          />
                        </div>
                        <div>
                          <Label>People Benefited</Label>
                          <Input
                            value={siteSettings.people_benefited}
                            onChange={(e) => setSiteSettings(s => ({ ...s, people_benefited: e.target.value }))}
                            placeholder="50K+"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Banner Image URL</Label>
                        <Input
                          value={siteSettings.banner_url}
                          onChange={(e) => setSiteSettings(s => ({ ...s, banner_url: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                      
                      {siteSettings.banner_url && (
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                          <img 
                            src={siteSettings.banner_url} 
                            alt="Banner preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <Button 
                        className="w-full" 
                        onClick={saveSiteSettings}
                        disabled={savingSettings}
                      >
                        {savingSettings ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Settings for {AREAS[selectedArea]?.name}
                      </Button>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        <strong>Note:</strong> Changes will be stored in the database and can be loaded dynamically by the app.
                        For static config file changes, use the Clone Maker tool.
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Managers Tab */}
          <TabsContent value="managers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Area Managers</CardTitle>
                  <CardDescription>Assign managers to each area</CardDescription>
                </div>
                <Button onClick={() => setShowManagerDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manager
                </Button>
              </CardHeader>
              <CardContent>
                {managers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No managers assigned yet</p>
                    <p className="text-sm">Add managers to help manage specific areas</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {managers.map((manager) => (
                      <div key={manager.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{manager.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {manager.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: AREAS[manager.assigned_area]?.color }}
                            />
                            <span className="text-sm font-medium">
                              {AREAS[manager.assigned_area]?.name || manager.assigned_area}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => removeManager(manager.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Courses {selectedArea !== "all" && `for ${AREAS[selectedArea]?.name}`}
                  </CardTitle>
                  <CardDescription>Manage educational content</CardDescription>
                </div>
                <Button onClick={() => {
                  setCourseForm({ title: "", description: "", instructor: "", thumbnail: "", video_url: "", areas: selectedArea !== "all" ? [selectedArea] : ["all"] });
                  setEditingItem(null);
                  setShowCourseDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filterByArea(courses).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No courses found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filterByArea(courses).map((course) => (
                      <div key={course._id || course.id} className="py-3 flex items-center gap-4">
                        <img
                          src={course.thumbnail || "https://via.placeholder.com/80x60"}
                          alt={course.title}
                          className="w-20 h-14 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{course.title}</h4>
                          <p className="text-sm text-muted-foreground">{course.instructor}</p>
                        </div>
                        <div className="flex gap-1">
                          {(course.areas || ["all"]).map((areaId) => (
                            <div
                              key={areaId}
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: AREAS[areaId]?.color }}
                              title={AREAS[areaId]?.name}
                            />
                          ))}
                        </div>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    News {selectedArea !== "all" && `for ${AREAS[selectedArea]?.name}`}
                  </CardTitle>
                  <CardDescription>Manage news content</CardDescription>
                </div>
                <Button onClick={() => {
                  setNewsForm({ title: "", content: "", image_url: "", category: "local", areas: selectedArea !== "all" ? [selectedArea] : ["all"] });
                  setEditingItem(null);
                  setShowNewsDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add News
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filterByArea(news).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Newspaper className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No news items found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filterByArea(news).map((item) => (
                      <div key={item._id || item.id} className="py-3 flex items-center gap-4">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-20 h-14 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">{item.content}</p>
                        </div>
                        <div className="flex gap-1">
                          {(item.areas || ["all"]).map((areaId) => (
                            <div
                              key={areaId}
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: AREAS[areaId]?.color }}
                              title={AREAS[areaId]?.name}
                            />
                          ))}
                        </div>
                        <Badge variant="outline">{item.category}</Badge>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Templates</CardTitle>
                  <CardDescription>Notification and message templates</CardDescription>
                </div>
                <Button onClick={() => {
                  setTemplateForm({ name: "", content: "", type: "notification", areas: selectedArea !== "all" ? [selectedArea] : ["all"] });
                  setShowTemplateDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No templates yet</p>
                  <p className="text-sm">Create reusable templates for notifications and messages</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Announcements</CardTitle>
                  <CardDescription>Broadcast messages to users</CardDescription>
                </div>
                <Button>
                  <Megaphone className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Tip:</strong> Select specific areas above to send targeted announcements, 
                    or keep "All Areas" to broadcast to everyone.
                  </p>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No announcements yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Course" : "Add New Course"}</DialogTitle>
            <DialogDescription>
              Create educational content for your users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={courseForm.title}
                onChange={(e) => setCourseForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Course title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Course description"
              />
            </div>
            <div>
              <Label>Instructor</Label>
              <Input
                value={courseForm.instructor}
                onChange={(e) => setCourseForm(f => ({ ...f, instructor: e.target.value }))}
                placeholder="Instructor name"
              />
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input
                value={courseForm.thumbnail}
                onChange={(e) => setCourseForm(f => ({ ...f, thumbnail: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Video URL</Label>
              <Input
                value={courseForm.video_url}
                onChange={(e) => setCourseForm(f => ({ ...f, video_url: e.target.value }))}
                placeholder="YouTube or video URL"
              />
            </div>
            <AreaSelector
              value={courseForm.areas}
              onChange={(areas) => setCourseForm(f => ({ ...f, areas }))}
              label="Apply to Areas"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Course saved!");
              setShowCourseDialog(false);
            }}>
              Save Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* News Dialog */}
      <Dialog open={showNewsDialog} onOpenChange={setShowNewsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit News" : "Add News Item"}</DialogTitle>
            <DialogDescription>
              Create news content for your users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newsForm.title}
                onChange={(e) => setNewsForm(f => ({ ...f, title: e.target.value }))}
                placeholder="News title"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={newsForm.content}
                onChange={(e) => setNewsForm(f => ({ ...f, content: e.target.value }))}
                placeholder="News content"
                rows={4}
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={newsForm.image_url}
                onChange={(e) => setNewsForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={newsForm.category} onValueChange={(v) => setNewsForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AreaSelector
              value={newsForm.areas}
              onChange={(areas) => setNewsForm(f => ({ ...f, areas }))}
              label="Apply to Areas"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("News saved!");
              setShowNewsDialog(false);
            }}>
              Save News
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Template</DialogTitle>
            <DialogDescription>
              Create reusable message templates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Welcome Message"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={templateForm.type} onValueChange={(v) => setTemplateForm(f => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">Push Notification</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="in-app">In-App Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={templateForm.content}
                onChange={(e) => setTemplateForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Template content... Use {{name}} for variables"
                rows={4}
              />
            </div>
            <AreaSelector
              value={templateForm.areas}
              onChange={(areas) => setTemplateForm(f => ({ ...f, areas }))}
              label="Apply to Areas"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Template saved!");
              setShowTemplateDialog(false);
            }}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Dialog */}
      <Dialog open={showManagerDialog} onOpenChange={setShowManagerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Area Manager</DialogTitle>
            <DialogDescription>
              Assign a manager to handle a specific area
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Manager Name</Label>
              <Input
                value={managerForm.name}
                onChange={(e) => setManagerForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted rounded-l-lg border border-r-0">
                  <span className="text-sm text-muted-foreground">+91</span>
                </div>
                <Input
                  value={managerForm.phone}
                  onChange={(e) => setManagerForm(f => ({ ...f, phone: `+91${e.target.value.replace(/\D/g, '').slice(0, 10)}` }))}
                  placeholder="10-digit number"
                  className="rounded-l-none"
                />
              </div>
            </div>
            <div>
              <Label>Assigned Area</Label>
              <Select value={managerForm.assigned_area} onValueChange={(v) => setManagerForm(f => ({ ...f, assigned_area: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AREAS).filter(([id]) => id !== "all").map(([id, area]) => (
                    <SelectItem key={id} value={id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: area.color }}
                        />
                        {area.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManagerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createManager}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
