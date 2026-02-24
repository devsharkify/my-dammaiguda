import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { toast } from "sonner";
import {
  Image,
  Type,
  Save,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Upload,
  Link,
  Eye,
  EyeOff,
  GripVertical,
  Palette,
  FileText,
  LayoutGrid,
  Settings,
  Gift,
  Newspaper,
  Heart,
  GraduationCap,
  AlertTriangle,
  Users,
  BarChart3,
  RefreshCw,
  X,
  Check
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ContentManager({ areaId = "dammaiguda" }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("banners");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Content states
  const [banners, setBanners] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [headlines, setHeadlines] = useState({});
  const [sections, setSections] = useState({});
  const [dumpyard, setDumpyard] = useState({});
  
  // Dialog states
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showBenefitDialog, setShowBenefitDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [editingBenefit, setEditingBenefit] = useState(null);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchContent();
  }, [areaId]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Fetch banners
      const bannersRes = await axios.get(`${API}/content/banners?area_id=${areaId}`, { headers });
      setBanners(bannersRes.data?.banners || []);
      
      // Fetch benefits
      const benefitsRes = await axios.get(`${API}/content/benefits?area_id=${areaId}`, { headers });
      setBenefits(benefitsRes.data?.benefits || []);
      
      // Fetch headlines/text content
      const headlinesRes = await axios.get(`${API}/content/category/headlines`, { headers });
      const headlinesMap = {};
      (headlinesRes.data?.content || []).forEach(item => {
        headlinesMap[item.key] = item.value;
      });
      setHeadlines(headlinesMap);
      
      // Fetch sections config
      const sectionsRes = await axios.get(`${API}/settings/config/${areaId}`, { headers });
      setSections(sectionsRes.data?.sections || {
        benefits: true,
        education: true,
        news: true,
        fitness: true,
        issues: true,
        polls: true,
        volunteer: true,
        dumpyard: true,
        astrology: true
      });
      
      // Fetch dumpyard info
      const dumpyardRes = await axios.get(`${API}/content/dumpyard`, { headers });
      setDumpyard(dumpyardRes.data || {});
      
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  // Image upload handler
  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await axios.post(`${API}/upload/image`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" }
      });
      
      toast.success("Image uploaded!");
      return res.data.url;
    } catch (err) {
      toast.error("Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Banner Management
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    is_active: true,
    order: 0
  });

  const openBannerDialog = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        image_url: banner.image_url || "",
        link_url: banner.link_url || "",
        is_active: banner.is_active !== false,
        order: banner.order || 0
      });
    } else {
      setEditingBanner(null);
      setBannerForm({
        title: "",
        subtitle: "",
        image_url: "",
        link_url: "",
        is_active: true,
        order: banners.length
      });
    }
    setShowBannerDialog(true);
  };

  const saveBanner = async () => {
    if (!bannerForm.title || !bannerForm.image_url) {
      toast.error("Title and image are required");
      return;
    }
    
    setSaving(true);
    try {
      const data = { ...bannerForm, area_id: areaId };
      
      if (editingBanner) {
        await axios.put(`${API}/content/banners/${editingBanner.id}`, data, { headers });
        toast.success("Banner updated!");
      } else {
        await axios.post(`${API}/content/banners`, data, { headers });
        toast.success("Banner created!");
      }
      
      setShowBannerDialog(false);
      fetchContent();
    } catch (err) {
      toast.error("Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return;
    
    try {
      await axios.delete(`${API}/content/banners/${id}`, { headers });
      toast.success("Banner deleted");
      fetchContent();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  // Benefit Management
  const [benefitForm, setBenefitForm] = useState({
    title: "",
    description: "",
    image_url: "",
    category: "general",
    link_url: "",
    is_active: true
  });

  const openBenefitDialog = (benefit = null) => {
    if (benefit) {
      setEditingBenefit(benefit);
      setBenefitForm({
        title: benefit.title || "",
        description: benefit.description || "",
        image_url: benefit.image_url || "",
        category: benefit.category || "general",
        link_url: benefit.link_url || "",
        is_active: benefit.is_active !== false
      });
    } else {
      setEditingBenefit(null);
      setBenefitForm({
        title: "",
        description: "",
        image_url: "",
        category: "general",
        link_url: "",
        is_active: true
      });
    }
    setShowBenefitDialog(true);
  };

  const saveBenefit = async () => {
    if (!benefitForm.title) {
      toast.error("Title is required");
      return;
    }
    
    setSaving(true);
    try {
      const data = { ...benefitForm, area_id: areaId };
      
      if (editingBenefit) {
        await axios.put(`${API}/content/benefits/${editingBenefit.id}`, data, { headers });
        toast.success("Benefit updated!");
      } else {
        await axios.post(`${API}/content/benefits`, data, { headers });
        toast.success("Benefit created!");
      }
      
      setShowBenefitDialog(false);
      fetchContent();
    } catch (err) {
      toast.error("Failed to save benefit");
    } finally {
      setSaving(false);
    }
  };

  const deleteBenefit = async (id) => {
    if (!confirm("Delete this benefit?")) return;
    
    try {
      await axios.delete(`${API}/content/benefits/${id}`, { headers });
      toast.success("Benefit deleted");
      fetchContent();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  // Headlines/Text Content
  const saveHeadline = async (key, value) => {
    try {
      await axios.put(`${API}/content/headlines/${key}`, { value }, { headers });
      setHeadlines({ ...headlines, [key]: value });
      toast.success("Saved!");
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  // Section Toggle
  const toggleSection = async (sectionKey) => {
    const newSections = { ...sections, [sectionKey]: !sections[sectionKey] };
    setSections(newSections);
    
    try {
      await axios.put(`${API}/settings/config/${areaId}`, { sections: newSections }, { headers });
      toast.success(`${sectionKey} ${newSections[sectionKey] ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  // Dumpyard Info
  const saveDumpyard = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/content/dumpyard`, { ...dumpyard, area_id: areaId }, { headers });
      toast.success("Dumpyard info saved!");
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Image Upload Component
  const ImageUploader = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or upload"
          className="flex-1"
        />
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = await uploadImage(file);
                if (url) onChange(url);
              }
            }}
          />
          <Button type="button" variant="outline" size="icon" disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
        </label>
      </div>
      {value && (
        <img src={value} alt="Preview" className="h-20 w-auto rounded border object-cover" />
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Content Manager</h2>
          <p className="text-sm text-muted-foreground">Edit all app content, banners, and sections</p>
        </div>
        <Button variant="outline" onClick={fetchContent}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="banners"><Image className="h-4 w-4 mr-1" /> Banners</TabsTrigger>
          <TabsTrigger value="benefits"><Gift className="h-4 w-4 mr-1" /> Benefits</TabsTrigger>
          <TabsTrigger value="text"><Type className="h-4 w-4 mr-1" /> Text</TabsTrigger>
          <TabsTrigger value="sections"><LayoutGrid className="h-4 w-4 mr-1" /> Sections</TabsTrigger>
          <TabsTrigger value="dumpyard"><AlertTriangle className="h-4 w-4 mr-1" /> Dumpyard</TabsTrigger>
        </TabsList>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Manage hero banners and promotional images</p>
            <Button onClick={() => openBannerDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Add Banner
            </Button>
          </div>

          <div className="grid gap-4">
            {banners.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No banners yet. Add your first banner!</p>
              </Card>
            ) : (
              banners.map((banner, index) => (
                <Card key={banner.id} className={!banner.is_active ? "opacity-50" : ""}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <img 
                      src={banner.image_url} 
                      alt={banner.title} 
                      className="h-16 w-28 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{banner.title}</h4>
                      <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                      {banner.link_url && (
                        <span className="text-xs text-blue-500">{banner.link_url}</span>
                      )}
                    </div>
                    <Badge variant={banner.is_active ? "default" : "secondary"}>
                      {banner.is_active ? "Active" : "Hidden"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openBannerDialog(banner)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteBanner(banner.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Manage citizen benefits and programs</p>
            <Button onClick={() => openBenefitDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Add Benefit
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {benefits.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground col-span-2">
                <Gift className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No benefits yet. Add your first benefit!</p>
              </Card>
            ) : (
              benefits.map((benefit) => (
                <Card key={benefit.id} className={!benefit.is_active ? "opacity-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {benefit.image_url ? (
                        <img src={benefit.image_url} alt={benefit.title} className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                          <Gift className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{benefit.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{benefit.description}</p>
                        <Badge variant="outline" className="mt-1">{benefit.category}</Badge>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openBenefitDialog(benefit)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteBenefit(benefit.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Text/Headlines Tab */}
        <TabsContent value="text" className="space-y-4">
          <p className="text-sm text-muted-foreground">Edit app text content and headlines</p>
          
          <div className="grid gap-4">
            {[
              { key: "landing_title", label: "Landing Page Title", placeholder: "My Dammaiguda" },
              { key: "landing_subtitle", label: "Landing Subtitle", placeholder: "Your Civic Engagement Platform" },
              { key: "tagline", label: "Tagline", placeholder: "Track Issues. Protect Health. Claim Benefits." },
              { key: "benefits_title", label: "Benefits Section Title", placeholder: "Citizen Benefits" },
              { key: "news_title", label: "News Section Title", placeholder: "Local News" },
              { key: "contact_email", label: "Contact Email", placeholder: "support@mydammaiguda.in" },
              { key: "contact_phone", label: "Contact Phone", placeholder: "+91 98765 43210" },
              { key: "footer_text", label: "Footer Text", placeholder: "Powered by Rohan Kulkarni" },
            ].map((field) => (
              <Card key={field.key}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label>{field.label}</Label>
                      <Input
                        value={headlines[field.key] || ""}
                        onChange={(e) => setHeadlines({ ...headlines, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => saveHeadline(field.key, headlines[field.key])}
                    >
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <p className="text-sm text-muted-foreground">Enable or disable app sections</p>
          
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { key: "benefits", label: "Citizen Benefits", icon: Gift, description: "Government schemes and benefits" },
              { key: "education", label: "Education", icon: GraduationCap, description: "Courses and learning" },
              { key: "news", label: "News Feed", icon: Newspaper, description: "Local news and updates" },
              { key: "fitness", label: "Health & Fitness", icon: Heart, description: "Health tracking features" },
              { key: "issues", label: "Issue Reporting", icon: AlertTriangle, description: "Report civic issues" },
              { key: "polls", label: "Polls", icon: BarChart3, description: "Community polls" },
              { key: "volunteer", label: "Volunteer", icon: Users, description: "Volunteer registration" },
              { key: "dumpyard", label: "Dumpyard Info", icon: AlertTriangle, description: "Environmental data" },
              { key: "astrology", label: "Astrology", icon: Settings, description: "Panchangam & horoscope" },
            ].map((section) => (
              <Card key={section.key} className={!sections[section.key] ? "opacity-60" : ""}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      sections[section.key] ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      <section.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{section.label}</h4>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={sections[section.key] !== false}
                    onCheckedChange={() => toggleSection(section.key)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Dumpyard Tab */}
        <TabsContent value="dumpyard" className="space-y-4">
          <p className="text-sm text-muted-foreground">Edit dumpyard/environment information</p>
          
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Daily Waste (Tonnes)</Label>
                  <Input
                    type="number"
                    value={dumpyard.daily_waste_tons || ""}
                    onChange={(e) => setDumpyard({ ...dumpyard, daily_waste_tons: e.target.value })}
                    placeholder="1200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Area (Acres)</Label>
                  <Input
                    type="number"
                    value={dumpyard.area_acres || ""}
                    onChange={(e) => setDumpyard({ ...dumpyard, area_acres: e.target.value })}
                    placeholder="350"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Red Zone Radius (KM)</Label>
                  <Input
                    type="number"
                    value={dumpyard.red_zone_km || ""}
                    onChange={(e) => setDumpyard({ ...dumpyard, red_zone_km: e.target.value })}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input
                    value={dumpyard.status || ""}
                    onChange={(e) => setDumpyard({ ...dumpyard, status: e.target.value })}
                    placeholder="Active"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Historical Data</Label>
                <Textarea
                  value={dumpyard.historical_data || ""}
                  onChange={(e) => setDumpyard({ ...dumpyard, historical_data: e.target.value })}
                  placeholder="Till 2025: 5500 tons, IIT-B recommends: 19000 tons"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Health Risks (comma separated)</Label>
                <Input
                  value={dumpyard.health_risks?.join(", ") || ""}
                  onChange={(e) => setDumpyard({ ...dumpyard, health_risks: e.target.value.split(",").map(s => s.trim()) })}
                  placeholder="Respiratory issues, Skin problems, Cancer risk"
                />
              </div>
              
              <Button onClick={saveDumpyard} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Dumpyard Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Banner Dialog */}
      <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                placeholder="Banner title"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={bannerForm.subtitle}
                onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                placeholder="Optional subtitle"
              />
            </div>
            <ImageUploader
              label="Banner Image *"
              value={bannerForm.image_url}
              onChange={(url) => setBannerForm({ ...bannerForm, image_url: url })}
            />
            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input
                value={bannerForm.link_url}
                onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={bannerForm.is_active}
                onCheckedChange={(checked) => setBannerForm({ ...bannerForm, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBannerDialog(false)}>Cancel</Button>
            <Button onClick={saveBanner} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Benefit Dialog */}
      <Dialog open={showBenefitDialog} onOpenChange={setShowBenefitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBenefit ? "Edit Benefit" : "Add Benefit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={benefitForm.title}
                onChange={(e) => setBenefitForm({ ...benefitForm, title: e.target.value })}
                placeholder="Benefit title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={benefitForm.description}
                onChange={(e) => setBenefitForm({ ...benefitForm, description: e.target.value })}
                placeholder="Describe the benefit..."
                rows={3}
              />
            </div>
            <ImageUploader
              label="Image (optional)"
              value={benefitForm.image_url}
              onChange={(url) => setBenefitForm({ ...benefitForm, image_url: url })}
            />
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={benefitForm.category}
                onChange={(e) => setBenefitForm({ ...benefitForm, category: e.target.value })}
                placeholder="e.g., health, education, financial"
              />
            </div>
            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input
                value={benefitForm.link_url}
                onChange={(e) => setBenefitForm({ ...benefitForm, link_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={benefitForm.is_active}
                onCheckedChange={(checked) => setBenefitForm({ ...benefitForm, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBenefitDialog(false)}>Cancel</Button>
            <Button onClick={saveBenefit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
