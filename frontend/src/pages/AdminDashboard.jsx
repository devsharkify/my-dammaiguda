import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Heart,
  MapPin,
  ArrowUpRight,
  Shield,
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Video,
  Loader2,
  Gift,
  Package,
  Coins,
  Truck,
  Star,
  Newspaper,
  Ticket,
  Image as ImageIcon,
  Settings,
  FileText,
  RefreshCw,
  Search,
  Filter,
  Download,
  Phone,
  Calendar,
  X,
  Check,
  ChevronRight,
  Send,
  Copy
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Overview stats
  const [stats, setStats] = useState({});
  const [heatmap, setHeatmap] = useState([]);
  
  // Users
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  
  // Issues
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueStatusForm, setIssueStatusForm] = useState({ status: "", notes: "" });
  
  // Education
  const [courses, setCourses] = useState([]);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: "", title_te: "", description: "", description_te: "",
    category: "tech", price: 0, duration_hours: 10, difficulty: "beginner",
    thumbnail_url: "", instructor_name: "", is_featured: false
  });
  
  // Gift Shop
  const [giftProducts, setGiftProducts] = useState([]);
  const [giftOrders, setGiftOrders] = useState([]);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "", description: "", category: "Fitness",
    image_url: "", mrp: 0, points_required: 100,
    privilege_points_required: 0, point_type: "normal",
    delivery_fee: 0, stock_quantity: 10, is_active: true
  });
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [pointsForm, setPointsForm] = useState({
    user_id: "", points: 0, reason: "", point_type: "normal"
  });
  const [showBulkPrivilegeDialog, setShowBulkPrivilegeDialog] = useState(false);
  const [bulkPrivilegeForm, setBulkPrivilegeForm] = useState({
    selectAll: false, user_ids: [], points: 0, reason: ""
  });
  
  // News
  const [news, setNews] = useState([]);
  const [showNewsDialog, setShowNewsDialog] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newsForm, setNewsForm] = useState({
    title: "", title_te: "", content: "", content_te: "",
    category: "local", image_url: "", is_pinned: false, is_breaking: false
  });
  
  // Vouchers
  const [vouchers, setVouchers] = useState([]);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherForm, setVoucherForm] = useState({
    title: "", title_te: "", description: "", description_te: "",
    discount_type: "percentage", discount_value: 10, code: "", code_type: "random",
    partner_name: "", category: "food", terms_conditions: "",
    min_order_value: 0, max_uses_per_user: 1
  });
  
  // Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    title: "", title_te: "", category: "festival",
    background_url: "", photo_position: { x: 150, y: 100, width: 120, height: 120 },
    name_position: { x: 210, y: 280, fontSize: 24, color: "#ffffff" }
  });
  
  // Content Management (CMS)
  const [banners, setBanners] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [dumpyardConfig, setDumpyardConfig] = useState({
    daily_waste_tons: 1200, area_acres: 350, red_zone_km: 2, status: "Active",
    historical_data: "", health_risks: [], affected_groups: []
  });
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: "", subtitle: "", image_url: "", link_url: "", is_active: true, order: 0
  });
  const [showBenefitDialog, setShowBenefitDialog] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [benefitForm, setBenefitForm] = useState({
    title: "", description: "", image_url: "", category: "government", link_url: "", is_active: true
  });
  const [showDumpyardDialog, setShowDumpyardDialog] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      // Fetch based on active tab to reduce load
      if (activeTab === "overview" || !stats.users) {
        const [statsRes, heatmapRes, usersRes] = await Promise.all([
          axios.get(`${API}/admin/stats`).catch(() => ({ data: {} })),
          axios.get(`${API}/admin/issues-heatmap`).catch(() => ({ data: [] })),
          axios.get(`${API}/admin/users`).catch(() => ({ data: [] }))
        ]);
        setStats(statsRes.data || {});
        setHeatmap(heatmapRes.data || []);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      }
      
      if (activeTab === "issues") {
        const res = await axios.get(`${API}/issues?limit=100`);
        setIssues(res.data?.issues || []);
      }
      
      if (activeTab === "education") {
        const res = await axios.get(`${API}/education/courses?limit=50`);
        setCourses(res.data?.courses || []);
      }
      
      if (activeTab === "shop") {
        const [productsRes, ordersRes] = await Promise.all([
          axios.get(`${API}/shop/admin/products?include_inactive=true`, { headers }).catch(() => ({ data: { products: [] } })),
          axios.get(`${API}/shop/admin/orders`, { headers }).catch(() => ({ data: { orders: [] } }))
        ]);
        setGiftProducts(productsRes.data?.products || []);
        setGiftOrders(ordersRes.data?.orders || []);
      }
      
      if (activeTab === "news") {
        const res = await axios.get(`${API}/news/admin/all`, { headers }).catch(() => ({ data: { news: [] } }));
        setNews(res.data?.news || []);
      }
      
      if (activeTab === "vouchers") {
        const res = await axios.get(`${API}/vouchers/admin/all`, { headers }).catch(() => ({ data: { vouchers: [] } }));
        setVouchers(res.data?.vouchers || []);
      }
      
      if (activeTab === "templates") {
        const res = await axios.get(`${API}/templates/admin/all`, { headers }).catch(() => ({ data: { templates: [] } }));
        setTemplates(res.data?.templates || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = () => {
    setRefreshing(true);
    fetchData();
  };

  // ============== ISSUE MANAGEMENT ==============
  const updateIssueStatus = async () => {
    if (!selectedIssue || !issueStatusForm.status) return;
    
    setSaving(true);
    try {
      await axios.put(`${API}/issues/${selectedIssue.id}/status`, {
        status: issueStatusForm.status,
        notes: issueStatusForm.notes
      }, { headers });
      toast.success("Issue status updated");
      setShowIssueDialog(false);
      setSelectedIssue(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  // ============== COURSE MANAGEMENT ==============
  const saveCourse = async () => {
    if (!courseForm.title) {
      toast.error("Title is required");
      return;
    }
    
    setSaving(true);
    try {
      if (editingCourse) {
        await axios.put(`${API}/education/courses/${editingCourse.id}`, courseForm, { headers });
        toast.success("Course updated!");
      } else {
        await axios.post(`${API}/education/courses`, courseForm, { headers });
        toast.success("Course created!");
      }
      setShowCourseDialog(false);
      setEditingCourse(null);
      setCourseForm({ title: "", title_te: "", description: "", description_te: "", category: "tech", price: 0, duration_hours: 10, difficulty: "beginner", thumbnail_url: "", instructor_name: "", is_featured: false });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const publishCourse = async (courseId) => {
    try {
      await axios.put(`${API}/education/courses/${courseId}/publish`, {}, { headers });
      toast.success("Course published!");
      fetchData();
    } catch (error) {
      toast.error("Failed to publish");
    }
  };

  // ============== PRODUCT MANAGEMENT ==============
  const saveProduct = async () => {
    if (!productForm.name) {
      toast.error("Name is required");
      return;
    }
    
    setSaving(true);
    try {
      if (editingProduct) {
        await axios.put(`${API}/shop/admin/products/${editingProduct.id}`, productForm, { headers });
        toast.success("Product updated!");
      } else {
        await axios.post(`${API}/shop/admin/products`, productForm, { headers });
        toast.success("Product created!");
      }
      setShowProductDialog(false);
      setEditingProduct(null);
      setProductForm({ name: "", description: "", category: "Fitness", image_url: "", mrp: 0, points_required: 100, privilege_points_required: 0, point_type: "normal", delivery_fee: 0, stock_quantity: 10, is_active: true });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API}/shop/admin/products/${productId}`, { headers });
      toast.success("Product deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/shop/admin/orders/${orderId}`, { status }, { headers });
      toast.success("Order updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const adjustUserPoints = async () => {
    if (!pointsForm.user_id || !pointsForm.points || !pointsForm.reason) {
      toast.error("All fields required");
      return;
    }
    
    setSaving(true);
    try {
      await axios.post(`${API}/shop/admin/points/adjust`, {
        user_id: pointsForm.user_id,
        points: parseInt(pointsForm.points),
        reason: pointsForm.reason,
        point_type: pointsForm.point_type
      }, { headers });
      toast.success(`Points adjusted: ${pointsForm.points > 0 ? '+' : ''}${pointsForm.points}`);
      setShowPointsDialog(false);
      setPointsForm({ user_id: "", points: 0, reason: "", point_type: "normal" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const assignBulkPrivilegePoints = async () => {
    if (!bulkPrivilegeForm.points || !bulkPrivilegeForm.reason) {
      toast.error("Points and reason required");
      return;
    }
    
    setSaving(true);
    try {
      const user_ids = bulkPrivilegeForm.selectAll ? ["ALL"] : bulkPrivilegeForm.user_ids;
      await axios.post(`${API}/shop/admin/points/bulk-privilege`, {
        user_ids,
        points: parseInt(bulkPrivilegeForm.points),
        reason: bulkPrivilegeForm.reason
      }, { headers });
      toast.success("Privilege points assigned!");
      setShowBulkPrivilegeDialog(false);
      setBulkPrivilegeForm({ selectAll: false, user_ids: [], points: 0, reason: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed");
    } finally {
      setSaving(false);
    }
  };

  // ============== NEWS MANAGEMENT ==============
  const saveNews = async () => {
    if (!newsForm.title || !newsForm.content) {
      toast.error("Title and content required");
      return;
    }
    
    setSaving(true);
    try {
      if (editingNews) {
        await axios.put(`${API}/news/admin/${editingNews.id}`, newsForm, { headers });
        toast.success("News updated!");
      } else {
        await axios.post(`${API}/news/admin/create`, newsForm, { headers });
        toast.success("News created!");
      }
      setShowNewsDialog(false);
      setEditingNews(null);
      setNewsForm({ title: "", title_te: "", content: "", content_te: "", category: "local", image_url: "", is_pinned: false, is_breaking: false });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteNews = async (newsId) => {
    if (!confirm("Delete this news?")) return;
    try {
      await axios.delete(`${API}/news/admin/${newsId}`, { headers });
      toast.success("News deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // ============== VOUCHER MANAGEMENT ==============
  const saveVoucher = async () => {
    if (!voucherForm.title || !voucherForm.partner_name) {
      toast.error("Title and partner required");
      return;
    }
    
    setSaving(true);
    try {
      if (editingVoucher) {
        await axios.put(`${API}/vouchers/admin/${editingVoucher.id}`, voucherForm, { headers });
        toast.success("Voucher updated!");
      } else {
        await axios.post(`${API}/vouchers/admin/create`, voucherForm, { headers });
        toast.success("Voucher created!");
      }
      setShowVoucherDialog(false);
      setEditingVoucher(null);
      setVoucherForm({ title: "", title_te: "", description: "", description_te: "", discount_type: "percentage", discount_value: 10, code: "", code_type: "random", partner_name: "", category: "food", terms_conditions: "", min_order_value: 0, max_uses_per_user: 1 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteVoucher = async (voucherId) => {
    if (!confirm("Delete this voucher?")) return;
    try {
      await axios.delete(`${API}/vouchers/admin/${voucherId}`, { headers });
      toast.success("Voucher deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // ============== TEMPLATE MANAGEMENT ==============
  const saveTemplate = async () => {
    if (!templateForm.title || !templateForm.background_url) {
      toast.error("Title and background image required");
      return;
    }
    
    setSaving(true);
    try {
      await axios.post(`${API}/templates/admin/create`, templateForm, { headers });
      toast.success("Template created!");
      setShowTemplateDialog(false);
      setTemplateForm({ title: "", title_te: "", category: "festival", background_url: "", photo_position: { x: 150, y: 100, width: 120, height: 120 }, name_position: { x: 210, y: 280, fontSize: 24, color: "#ffffff" } });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!confirm("Delete this template?")) return;
    try {
      await axios.delete(`${API}/templates/admin/${templateId}`, { headers });
      toast.success("Template deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // ============== HELPER FUNCTIONS ==============
  const getStatusColor = (status) => {
    const colors = {
      reported: "bg-orange-100 text-orange-700",
      verified: "bg-blue-100 text-blue-700",
      action_taken: "bg-purple-100 text-purple-700",
      filed_with_authority: "bg-indigo-100 text-indigo-700",
      resolved_by_authority: "bg-green-100 text-green-700",
      resolved_by_us: "bg-emerald-100 text-emerald-700",
      issue_not_found: "bg-gray-100 text-gray-700",
      closed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      shipped: "bg-blue-100 text-blue-700",
      delivered: "bg-green-100 text-green-700"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <Layout showBackButton title="Admin Dashboard">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "అడ్మిన్ డ్యాష్‌బోర్డ్" : "Admin Dashboard"}>
      <div className="space-y-4 pb-20" data-testid="admin-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">Admin Panel</span>
          </div>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <TabsList className="inline-flex w-max min-w-full h-10 gap-1 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="overview" className="text-xs px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                <Users className="h-3.5 w-3.5 mr-1" />
                Users
              </TabsTrigger>
              <TabsTrigger value="issues" className="text-xs px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Issues
              </TabsTrigger>
              <TabsTrigger value="education" className="text-xs px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                <GraduationCap className="h-3.5 w-3.5 mr-1" />
                Edu
              </TabsTrigger>
              <TabsTrigger value="shop" className="text-xs px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                <Gift className="h-3.5 w-3.5 mr-1" />
                Shop
              </TabsTrigger>
              <TabsTrigger value="news" className="text-xs px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                <Newspaper className="h-3.5 w-3.5 mr-1" />
                News
              </TabsTrigger>
              <TabsTrigger value="vouchers" className="text-xs px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                <Ticket className="h-3.5 w-3.5 mr-1" />
                Vouchers
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                <ImageIcon className="h-3.5 w-3.5 mr-1" />
                Templates
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ============== OVERVIEW TAB ============== */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.users?.total || users.length}</p>
                      <p className="text-xs text-muted-foreground">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.issues?.pending || 0}</p>
                      <p className="text-xs text-muted-foreground">Pending Issues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.fitness?.participants || 0}</p>
                      <p className="text-xs text-muted-foreground">Fitness Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{courses.length}</p>
                      <p className="text-xs text-muted-foreground">Courses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-10 justify-start" onClick={() => setActiveTab("shop")}>
                    <Gift className="h-4 w-4 mr-2 text-pink-500" />
                    <span className="text-xs">Add Gift</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-10 justify-start" onClick={() => setActiveTab("news")}>
                    <Newspaper className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-xs">Post News</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-10 justify-start" onClick={() => setActiveTab("vouchers")}>
                    <Ticket className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-xs">Add Voucher</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-10 justify-start" onClick={() => { setActiveTab("shop"); setTimeout(() => setShowBulkPrivilegeDialog(true), 100); }}>
                    <Star className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-xs">Bulk Points</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Issues by Category */}
            {stats.issues?.by_category && Object.keys(stats.issues.by_category).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Issues by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.issues.by_category).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{category}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Issues Heatmap */}
            {Array.isArray(heatmap) && heatmap.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Issues by Area
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {heatmap.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{item._id || "Unknown"}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============== USERS TAB ============== */}
          <TabsContent value="users" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">All Users ({users.length})</h3>
              <Button size="sm" variant="outline" onClick={() => setShowPointsDialog(true)}>
                <Coins className="h-4 w-4 mr-1" />
                Adjust Points
              </Button>
            </div>
            
            <div className="space-y-2">
              {users.slice(0, 20).map((u) => (
                <Card key={u.id} className="border-border/50 hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {u.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.name || "No name"}</p>
                          <p className="text-xs text-muted-foreground">{u.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                          {u.role || "citizen"}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {u.colony || u.created_at ? new Date(u.created_at).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ============== ISSUES TAB ============== */}
          <TabsContent value="issues" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Issues ({issues.length})</h3>
            </div>
            
            <div className="space-y-2">
              {issues.map((issue) => (
                <Card 
                  key={issue.id} 
                  className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => { setSelectedIssue(issue); setIssueStatusForm({ status: issue.status, notes: "" }); setShowIssueDialog(true); }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px]">{issue.category}</Badge>
                          <Badge className={`text-[10px] ${getStatusColor(issue.status)}`}>{issue.status}</Badge>
                        </div>
                        <p className="text-sm line-clamp-2">{issue.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{issue.reporter_name}</span>
                          <span>•</span>
                          <span>{issue.colony}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ============== EDUCATION TAB ============== */}
          <TabsContent value="education" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Courses ({courses.length})</h3>
              <Button size="sm" onClick={() => { setEditingCourse(null); setShowCourseDialog(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                Add Course
              </Button>
            </div>
            
            <div className="space-y-2">
              {courses.map((course) => (
                <Card key={course.id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <img
                        src={course.thumbnail_url || "https://via.placeholder.com/80?text=Course"}
                        alt={course.title}
                        className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">{course.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">{course.category}</Badge>
                          <Badge variant={course.is_published ? "default" : "outline"} className="text-[10px]">
                            {course.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {!course.is_published && (
                            <Button size="sm" variant="outline" className="h-7" onClick={() => publishCourse(course.id)}>
                              Publish
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => { setEditingCourse(course); setCourseForm(course); setShowCourseDialog(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ============== SHOP TAB ============== */}
          <TabsContent value="shop" className="space-y-4 mt-4">
            {/* Products Section */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Products ({giftProducts.length})</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowBulkPrivilegeDialog(true)}>
                  <Star className="h-4 w-4 mr-1" />
                  Bulk Privilege
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPointsDialog(true)}>
                  <Coins className="h-4 w-4 mr-1" />
                  Points
                </Button>
                <Button size="sm" onClick={() => { setEditingProduct(null); setShowProductDialog(true); }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {giftProducts.map((product) => (
                <Card key={product.id} className={`border-border/50 ${!product.is_active ? 'opacity-50' : ''}`}>
                  <CardContent className="p-2">
                    <img
                      src={product.image_url || "https://via.placeholder.com/100?text=Gift"}
                      alt={product.name}
                      className="h-20 w-full rounded-lg object-cover mb-2"
                    />
                    <h4 className="font-medium text-xs line-clamp-1">{product.name}</h4>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[9px]">
                        <Coins className="h-2.5 w-2.5 mr-0.5" />
                        {product.points_required}
                      </Badge>
                      {product.point_type !== "normal" && (
                        <Badge className="bg-purple-100 text-purple-700 text-[9px]">
                          P:{product.privilege_points_required}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="ghost" className="h-6 flex-1 text-xs" onClick={() => { setEditingProduct(product); setProductForm(product); setShowProductDialog(true); }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-destructive" onClick={() => deleteProduct(product.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Orders Section */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Orders ({giftOrders.length})</h3>
              <div className="space-y-2">
                {giftOrders.slice(0, 10).map((order) => (
                  <Card key={order.id} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{order.product_name}</p>
                          <p className="text-xs text-muted-foreground">{order.user_name} • {order.points_spent} pts</p>
                        </div>
                        <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ============== NEWS TAB ============== */}
          <TabsContent value="news" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">News ({news.length})</h3>
              <Button size="sm" onClick={() => { setEditingNews(null); setShowNewsDialog(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                Add News
              </Button>
            </div>
            
            <div className="space-y-2">
              {news.map((item) => (
                <Card key={item.id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                          {item.is_pinned && <Badge className="bg-amber-100 text-amber-700 text-[10px]">Pinned</Badge>}
                          {item.is_breaking && <Badge className="bg-red-100 text-red-700 text-[10px]">Breaking</Badge>}
                        </div>
                        <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.content}</p>
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="ghost" className="h-6" onClick={() => { setEditingNews(item); setNewsForm(item); setShowNewsDialog(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-destructive" onClick={() => deleteNews(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {news.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Newspaper className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No news articles yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ============== VOUCHERS TAB ============== */}
          <TabsContent value="vouchers" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Vouchers ({vouchers.length})</h3>
              <Button size="sm" onClick={() => { setEditingVoucher(null); setShowVoucherDialog(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                Add Voucher
              </Button>
            </div>
            
            <div className="space-y-2">
              {vouchers.map((voucher) => (
                <Card key={voucher.id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px]">{voucher.category}</Badge>
                          <Badge className={voucher.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"} style={{fontSize: "10px"}}>
                            {voucher.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm">{voucher.title}</h4>
                        <p className="text-xs text-muted-foreground">{voucher.partner_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-primary">
                            {voucher.discount_type === "percentage" ? `${voucher.discount_value}%` : `₹${voucher.discount_value}`} OFF
                          </span>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">{voucher.code}</code>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => { setEditingVoucher(voucher); setVoucherForm(voucher); setShowVoucherDialog(true); }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => deleteVoucher(voucher.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {vouchers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No vouchers yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ============== TEMPLATES TAB ============== */}
          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Status Templates ({templates.length})</h3>
              <Button size="sm" onClick={() => setShowTemplateDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Template
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <Card key={template.id} className="border-border/50 overflow-hidden">
                  <div className="aspect-square relative">
                    <img src={template.background_url || template.thumbnail_url} alt={template.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <Badge variant="secondary" className="text-[9px] mb-1">{template.category}</Badge>
                      <h4 className="text-white text-xs font-medium line-clamp-1">{template.title}</h4>
                    </div>
                  </div>
                  <CardContent className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 flex-1 text-xs">
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-destructive" onClick={() => deleteTemplate(template.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {templates.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No templates yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ============== DIALOGS ============== */}

        {/* Issue Status Dialog */}
        <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Issue Status</DialogTitle>
            </DialogHeader>
            {selectedIssue && (
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium">{selectedIssue.category}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{selectedIssue.description}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={issueStatusForm.status} onValueChange={(v) => setIssueStatusForm({...issueStatusForm, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reported">Reported</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="action_taken">Action Taken</SelectItem>
                      <SelectItem value="filed_with_authority">Filed with Authority</SelectItem>
                      <SelectItem value="resolved_by_authority">Resolved by Authority</SelectItem>
                      <SelectItem value="resolved_by_us">Resolved by Us</SelectItem>
                      <SelectItem value="issue_not_found">Issue Not Found</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={issueStatusForm.notes}
                    onChange={(e) => setIssueStatusForm({...issueStatusForm, notes: e.target.value})}
                    placeholder="Add notes about this update..."
                    rows={2}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowIssueDialog(false)}>Cancel</Button>
              <Button onClick={updateIssueStatus} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Course Dialog */}
        <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Add Course"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title: e.target.value})} />
              </div>
              <div>
                <Label>Title (Telugu)</Label>
                <Input value={courseForm.title_te} onChange={(e) => setCourseForm({...courseForm, title_te: e.target.value})} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={courseForm.description} onChange={(e) => setCourseForm({...courseForm, description: e.target.value})} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={courseForm.category} onValueChange={(v) => setCourseForm({...courseForm, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tech">Tech</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="arts">Arts</SelectItem>
                      <SelectItem value="language">Language</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={courseForm.difficulty} onValueChange={(v) => setCourseForm({...courseForm, difficulty: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input value={courseForm.thumbnail_url} onChange={(e) => setCourseForm({...courseForm, thumbnail_url: e.target.value})} placeholder="https://..." />
              </div>
              <div>
                <Label>Instructor Name</Label>
                <Input value={courseForm.instructor_name} onChange={(e) => setCourseForm({...courseForm, instructor_name: e.target.value})} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={courseForm.is_featured} onCheckedChange={(v) => setCourseForm({...courseForm, is_featured: v})} />
                <Label>Featured Course</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCourseDialog(false)}>Cancel</Button>
              <Button onClick={saveCourse} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCourse ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Dialog */}
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={productForm.category} onValueChange={(v) => setProductForm({...productForm, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fitness">Fitness</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>MRP (₹)</Label>
                  <Input type="number" value={productForm.mrp} onChange={(e) => setProductForm({...productForm, mrp: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div>
                <Label>Point Type *</Label>
                <Select value={productForm.point_type} onValueChange={(v) => setProductForm({...productForm, point_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal Only</SelectItem>
                    <SelectItem value="privilege">Privilege Only</SelectItem>
                    <SelectItem value="both">Both Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Normal Points</Label>
                  <Input type="number" value={productForm.points_required} onChange={(e) => setProductForm({...productForm, points_required: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <Label>Privilege Points</Label>
                  <Input type="number" value={productForm.privilege_points_required} onChange={(e) => setProductForm({...productForm, privilege_points_required: parseInt(e.target.value) || 0})} disabled={productForm.point_type === "normal"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Delivery Fee (₹)</Label>
                  <Input type="number" value={productForm.delivery_fee} onChange={(e) => setProductForm({...productForm, delivery_fee: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input type="number" value={productForm.stock_quantity} onChange={(e) => setProductForm({...productForm, stock_quantity: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={productForm.image_url} onChange={(e) => setProductForm({...productForm, image_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={productForm.is_active} onCheckedChange={(v) => setProductForm({...productForm, is_active: v})} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProductDialog(false)}>Cancel</Button>
              <Button onClick={saveProduct} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingProduct ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Points Dialog */}
        <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Adjust User Points</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User</Label>
                <Select value={pointsForm.user_id} onValueChange={(v) => setPointsForm({...pointsForm, user_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name || u.phone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Point Type</Label>
                <Select value={pointsForm.point_type} onValueChange={(v) => setPointsForm({...pointsForm, point_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="privilege">Privilege</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Points (+/-)</Label>
                <Input type="number" value={pointsForm.points} onChange={(e) => setPointsForm({...pointsForm, points: e.target.value})} placeholder="100 or -50" />
              </div>
              <div>
                <Label>Reason *</Label>
                <Input value={pointsForm.reason} onChange={(e) => setPointsForm({...pointsForm, reason: e.target.value})} placeholder="Bonus for..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPointsDialog(false)}>Cancel</Button>
              <Button onClick={adjustUserPoints} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Adjust
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Privilege Dialog */}
        <Dialog open={showBulkPrivilegeDialog} onOpenChange={setShowBulkPrivilegeDialog}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                Bulk Privilege Points
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <input type="checkbox" id="selectAll" checked={bulkPrivilegeForm.selectAll} onChange={(e) => setBulkPrivilegeForm({...bulkPrivilegeForm, selectAll: e.target.checked, user_ids: []})} className="h-4 w-4" />
                <Label htmlFor="selectAll" className="font-semibold text-purple-700 dark:text-purple-300">Select ALL Users</Label>
              </div>
              {!bulkPrivilegeForm.selectAll && (
                <div>
                  <Label>Select Users</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {users.map((u) => (
                      <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkPrivilegeForm.user_ids.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkPrivilegeForm({...bulkPrivilegeForm, user_ids: [...bulkPrivilegeForm.user_ids, u.id]});
                            } else {
                              setBulkPrivilegeForm({...bulkPrivilegeForm, user_ids: bulkPrivilegeForm.user_ids.filter(id => id !== u.id)});
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{u.name || u.phone}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label>Points *</Label>
                <Input type="number" value={bulkPrivilegeForm.points} onChange={(e) => setBulkPrivilegeForm({...bulkPrivilegeForm, points: e.target.value})} min="1" />
              </div>
              <div>
                <Label>Reason *</Label>
                <Input value={bulkPrivilegeForm.reason} onChange={(e) => setBulkPrivilegeForm({...bulkPrivilegeForm, reason: e.target.value})} placeholder="Special reward..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkPrivilegeDialog(false)}>Cancel</Button>
              <Button onClick={assignBulkPrivilegePoints} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* News Dialog */}
        <Dialog open={showNewsDialog} onOpenChange={setShowNewsDialog}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNews ? "Edit News" : "Add News"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={newsForm.title} onChange={(e) => setNewsForm({...newsForm, title: e.target.value})} />
              </div>
              <div>
                <Label>Title (Telugu)</Label>
                <Input value={newsForm.title_te} onChange={(e) => setNewsForm({...newsForm, title_te: e.target.value})} />
              </div>
              <div>
                <Label>Content *</Label>
                <Textarea value={newsForm.content} onChange={(e) => setNewsForm({...newsForm, content: e.target.value})} rows={3} />
              </div>
              <div>
                <Label>Content (Telugu)</Label>
                <Textarea value={newsForm.content_te} onChange={(e) => setNewsForm({...newsForm, content_te: e.target.value})} rows={2} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newsForm.category} onValueChange={(v) => setNewsForm({...newsForm, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={newsForm.image_url} onChange={(e) => setNewsForm({...newsForm, image_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={newsForm.is_pinned} onCheckedChange={(v) => setNewsForm({...newsForm, is_pinned: v})} />
                  <Label>Pinned</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newsForm.is_breaking} onCheckedChange={(v) => setNewsForm({...newsForm, is_breaking: v})} />
                  <Label>Breaking</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewsDialog(false)}>Cancel</Button>
              <Button onClick={saveNews} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingNews ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Voucher Dialog */}
        <Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVoucher ? "Edit Voucher" : "Add Voucher"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={voucherForm.title} onChange={(e) => setVoucherForm({...voucherForm, title: e.target.value})} placeholder="20% Off at Pizza Hut" />
              </div>
              <div>
                <Label>Partner Name *</Label>
                <Input value={voucherForm.partner_name} onChange={(e) => setVoucherForm({...voucherForm, partner_name: e.target.value})} placeholder="Pizza Hut" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={voucherForm.description} onChange={(e) => setVoucherForm({...voucherForm, description: e.target.value})} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={voucherForm.discount_type} onValueChange={(v) => setVoucherForm({...voucherForm, discount_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value</Label>
                  <Input type="number" value={voucherForm.discount_value} onChange={(e) => setVoucherForm({...voucherForm, discount_value: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Code Type</Label>
                  <Select value={voucherForm.code_type} onValueChange={(v) => setVoucherForm({...voucherForm, code_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Auto Generate</SelectItem>
                      <SelectItem value="specific">Custom Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {voucherForm.code_type === "specific" && (
                  <div>
                    <Label>Custom Code</Label>
                    <Input value={voucherForm.code} onChange={(e) => setVoucherForm({...voucherForm, code: e.target.value.toUpperCase()})} placeholder="SAVE20" />
                  </div>
                )}
              </div>
              <div>
                <Label>Category</Label>
                <Select value={voucherForm.category} onValueChange={(v) => setVoucherForm({...voucherForm, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea value={voucherForm.terms_conditions} onChange={(e) => setVoucherForm({...voucherForm, terms_conditions: e.target.value})} rows={2} placeholder="Valid on orders above..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Order (₹)</Label>
                  <Input type="number" value={voucherForm.min_order_value} onChange={(e) => setVoucherForm({...voucherForm, min_order_value: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <Label>Max Uses/User</Label>
                  <Input type="number" value={voucherForm.max_uses_per_user} onChange={(e) => setVoucherForm({...voucherForm, max_uses_per_user: parseInt(e.target.value) || 1})} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVoucherDialog(false)}>Cancel</Button>
              <Button onClick={saveVoucher} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingVoucher ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Status Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={templateForm.title} onChange={(e) => setTemplateForm({...templateForm, title: e.target.value})} placeholder="Ugadi Wishes" />
              </div>
              <div>
                <Label>Title (Telugu)</Label>
                <Input value={templateForm.title_te} onChange={(e) => setTemplateForm({...templateForm, title_te: e.target.value})} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={templateForm.category} onValueChange={(v) => setTemplateForm({...templateForm, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="greeting">Greeting</SelectItem>
                    <SelectItem value="civic">Civic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Background Image URL *</Label>
                <Input value={templateForm.background_url} onChange={(e) => setTemplateForm({...templateForm, background_url: e.target.value})} placeholder="https://..." />
              </div>
              {templateForm.background_url && (
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={templateForm.background_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Photo and name positions are set to defaults. Users can place their photo and name on the template.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
              <Button onClick={saveTemplate} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
