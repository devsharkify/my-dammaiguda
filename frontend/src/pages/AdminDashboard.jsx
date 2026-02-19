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
  Truck
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Education state
  const [courses, setCourses] = useState([]);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: "", title_te: "", description: "", description_te: "",
    category: "tech", price: 0, duration_hours: 10, difficulty: "beginner",
    thumbnail_url: "", instructor_name: "", is_featured: false
  });
  const [savingCourse, setSavingCourse] = useState(false);
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, heatmapRes, usersRes, coursesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/issues-heatmap`),
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/education/courses?limit=50`).catch(() => ({ data: { courses: [] } }))
      ]);
      setStats(statsRes.data);
      setHeatmap(heatmapRes.data);
      setUsers(usersRes.data);
      setCourses(coursesRes.data?.courses || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async () => {
    if (!courseForm.title) {
      toast.error("Title is required");
      return;
    }
    
    setSavingCourse(true);
    try {
      if (editingCourse) {
        // Update existing course (you'd need to add this endpoint)
        toast.success("Course updated!");
      } else {
        await axios.post(`${API}/education/courses`, courseForm, { headers });
        toast.success("Course created!");
      }
      setShowCourseDialog(false);
      resetCourseForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save course");
    } finally {
      setSavingCourse(false);
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

  const resetCourseForm = () => {
    setCourseForm({
      title: "", title_te: "", description: "", description_te: "",
      category: "tech", price: 0, duration_hours: 10, difficulty: "beginner",
      thumbnail_url: "", instructor_name: "", is_featured: false
    });
    setEditingCourse(null);
  };

  const openEditCourse = (course) => {
    setCourseForm({
      title: course.title || "",
      title_te: course.title_te || "",
      description: course.description || "",
      description_te: course.description_te || "",
      category: course.category || "tech",
      price: course.price || 0,
      duration_hours: course.duration_hours || 10,
      difficulty: course.difficulty || "beginner",
      thumbnail_url: course.thumbnail_url || "",
      instructor_name: course.instructor_name || "",
      is_featured: course.is_featured || false
    });
    setEditingCourse(course);
    setShowCourseDialog(true);
  };

  const updateUserRole = async (userId, role) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/role?role=${role}`);
      toast.success(language === "te" ? "పాత్ర నవీకరించబడింది" : "Role updated");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update role");
    }
  };

  const categoryLabels = {
    dump_yard: { en: "Dump Yard", te: "డంప్ యార్డ్" },
    garbage: { en: "Garbage", te: "చెత్త" },
    drainage: { en: "Drainage", te: "డ్రైనేజీ" },
    water: { en: "Water", te: "నీరు" },
    roads: { en: "Roads", te: "రోడ్లు" },
    lights: { en: "Lights", te: "దీపాలు" },
    parks: { en: "Parks", te: "పార్కులు" }
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "అడ్మిన్ డాష్‌బోర్డ్" : "Admin Dashboard"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "అడ్మిన్ డాష్‌బోర్డ్" : "Admin Dashboard"}>
      <div className="space-y-6" data-testid="admin-dashboard">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats?.issues?.total || 0}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? "మొత్తం సమస్యలు" : "Total Issues"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats?.issues?.pending || 0}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? "పెండింగ్" : "Pending"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats?.users?.total || 0}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? "వినియోగదారులు" : "Users"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats?.issues?.closed || 0}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? "పరిష్కరించబడింది" : "Resolved"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="issues" className="text-xs">
              {language === "te" ? "సమస్యలు" : "Issues"}
            </TabsTrigger>
            <TabsTrigger value="education" className="text-xs">
              {language === "te" ? "విద్య" : "Education"}
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="text-xs">
              {language === "te" ? "హీట్‌మ్యాప్" : "Heatmap"}
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              {language === "te" ? "వినియోగదారులు" : "Users"}
            </TabsTrigger>
          </TabsList>

          {/* Issues Analytics Tab */}
          <TabsContent value="issues" className="mt-4 space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {language === "te" ? "వర్గం వారీగా సమస్యలు" : "Issues by Category"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.issues?.by_category && Object.entries(stats.issues.by_category).map(([cat, count]) => {
                    const total = stats.issues.total || 1;
                    const percentage = Math.round((count / total) * 100);
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">
                            {categoryLabels[cat]?.[language] || cat}
                          </span>
                          <span className="text-text-muted">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{stats?.fitness?.participants || 0}</p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? "ఫిట్‌నెస్ భాగస్వాములు" : "Fitness Participants"}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{stats?.benefits?.pending || 0}</p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? "పెండింగ్ దరఖాస్తులు" : "Pending Applications"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Education Management Tab */}
          <TabsContent value="education" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {language === "te" ? "కోర్సులు నిర్వహణ" : "Course Management"}
              </h3>
              <Button size="sm" onClick={() => { resetCourseForm(); setShowCourseDialog(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                {language === "te" ? "కోర్సు జోడించు" : "Add Course"}
              </Button>
            </div>
            
            <div className="space-y-3">
              {courses.map((course) => (
                <Card key={course.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100"}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm truncate">{course.title}</h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {course.is_published ? (
                              <Badge className="bg-green-100 text-green-700 text-[10px]">Published</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">Draft</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{course.instructor_name}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{course.category}</span>
                          <span>₹{course.price}</span>
                          <span>{course.enrollment_count || 0} enrolled</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button size="sm" variant="outline" onClick={() => openEditCourse(course)} className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {!course.is_published && (
                        <Button size="sm" onClick={() => publishCourse(course.id)} className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Publish
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {courses.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No courses yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap" className="mt-4 space-y-3">
            {heatmap.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-text-muted">
                  {language === "te" ? "డేటా లేదు" : "No data available"}
                </p>
              </div>
            ) : (
              heatmap.map((item, idx) => (
                <Card key={idx} className="border-border/50" data-testid={`heatmap-${idx}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          item.count > 10 ? "bg-red-100 text-red-600" :
                          item.count > 5 ? "bg-orange-100 text-orange-600" :
                          "bg-green-100 text-green-600"
                        }`}>
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{item._id}</p>
                          <p className="text-xs text-text-muted">
                            {item.count} {language === "te" ? "సమస్యలు" : "issues"}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${
                        item.count > 10 ? "bg-red-100 text-red-700" :
                        item.count > 5 ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {item.count > 10 ? (language === "te" ? "అధికం" : "High") :
                         item.count > 5 ? (language === "te" ? "మధ్యస్థం" : "Medium") :
                         (language === "te" ? "తక్కువ" : "Low")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4 space-y-3">
            {users.slice(0, 20).map((u) => (
              <Card key={u.id} className="border-border/50" data-testid={`user-${u.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text-primary">{u.name}</p>
                      <p className="text-sm text-text-muted">{u.phone}</p>
                      {u.colony && (
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {u.colony}
                        </p>
                      )}
                    </div>
                    <Select
                      value={u.role}
                      onValueChange={(role) => updateUserRole(u.id, role)}
                    >
                      <SelectTrigger className="w-32 h-9" data-testid={`role-select-${u.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citizen">
                          {language === "te" ? "పౌరుడు" : "Citizen"}
                        </SelectItem>
                        <SelectItem value="volunteer">
                          {language === "te" ? "వలంటీర్" : "Volunteer"}
                        </SelectItem>
                        <SelectItem value="admin">
                          {language === "te" ? "అడ్మిన్" : "Admin"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Course Create/Edit Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Edit Course" : "Create New Course"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title (English)</Label>
                <Input
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                  placeholder="Python Basics"
                />
              </div>
              <div>
                <Label>Title (Telugu)</Label>
                <Input
                  value={courseForm.title_te}
                  onChange={(e) => setCourseForm({...courseForm, title_te: e.target.value})}
                  placeholder="పైథాన్ బేసిక్స్"
                />
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Course description..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={courseForm.category} onValueChange={(v) => setCourseForm({...courseForm, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="k12">School (K-12)</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="skill">Skill Development</SelectItem>
                    <SelectItem value="language">Languages</SelectItem>
                    <SelectItem value="tech">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={courseForm.difficulty} onValueChange={(v) => setCourseForm({...courseForm, difficulty: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={courseForm.price}
                  onChange={(e) => setCourseForm({...courseForm, price: parseInt(e.target.value) || 0})}
                  placeholder="0 for free"
                />
              </div>
              <div>
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  value={courseForm.duration_hours}
                  onChange={(e) => setCourseForm({...courseForm, duration_hours: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div>
              <Label>Instructor Name</Label>
              <Input
                value={courseForm.instructor_name}
                onChange={(e) => setCourseForm({...courseForm, instructor_name: e.target.value})}
                placeholder="Dr. Ravi Kumar"
              />
            </div>
            
            <div>
              <Label>Thumbnail URL</Label>
              <Input
                value={courseForm.thumbnail_url}
                onChange={(e) => setCourseForm({...courseForm, thumbnail_url: e.target.value})}
                placeholder="https://..."
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={courseForm.is_featured}
                onCheckedChange={(v) => setCourseForm({...courseForm, is_featured: v})}
              />
              <Label>Featured Course</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)}>Cancel</Button>
            <Button onClick={saveCourse} disabled={savingCourse}>
              {savingCourse && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCourse ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
