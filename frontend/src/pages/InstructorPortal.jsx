import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import {
  BookOpen,
  Users,
  IndianRupee,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  GraduationCap,
  Video,
  FileQuestion,
  ChevronRight,
  Loader2,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function InstructorPortal() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Dialogs
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  
  // Form states
  const [courseForm, setCourseForm] = useState({
    title: "", description: "", category: "tech", difficulty: "beginner",
    price: 0, duration_hours: 10, is_featured: false
  });
  const [lessonForm, setLessonForm] = useState({
    title: "", description: "", video_url: "", order_index: 1, duration_minutes: 10, is_free_preview: false
  });
  const [quizForm, setQuizForm] = useState({
    title: "", passing_score: 70, time_limit_minutes: 30, questions: []
  });
  const [editingId, setEditingId] = useState(null);
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (user?.role !== "admin" && user?.role !== "instructor") {
      toast.error("Instructor access required");
      navigate("/education");
      return;
    }
    fetchDashboard();
    fetchCourses();
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API}/education/instructor/dashboard`, { headers });
      setDashboard(res.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API}/education/instructor/courses`, { headers });
      setCourses(res.data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseAnalytics = async (courseId) => {
    try {
      const res = await axios.get(`${API}/education/instructor/course/${courseId}/analytics`, { headers });
      setCourseAnalytics(res.data);
      setShowAnalyticsDialog(true);
    } catch (error) {
      toast.error("Failed to load analytics");
    }
  };

  const fetchCourseStudents = async (courseId) => {
    try {
      const res = await axios.get(`${API}/education/instructor/course/${courseId}/students`, { headers });
      setStudents(res.data.students || []);
      setShowStudentsDialog(true);
    } catch (error) {
      toast.error("Failed to load students");
    }
  };

  const saveCourse = async () => {
    try {
      if (editingId) {
        await axios.put(`${API}/education/courses/${editingId}`, courseForm, { headers });
        toast.success("Course updated!");
      } else {
        await axios.post(`${API}/education/courses`, courseForm, { headers });
        toast.success("Course created!");
      }
      setShowCourseDialog(false);
      resetForms();
      fetchCourses();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save course");
    }
  };

  const deleteCourse = async (courseId) => {
    if (!confirm("Delete this course and all its content?")) return;
    try {
      await axios.delete(`${API}/education/instructor/courses/${courseId}`, { headers });
      toast.success("Course deleted");
      fetchCourses();
      fetchDashboard();
    } catch (error) {
      toast.error("Failed to delete course");
    }
  };

  const publishCourse = async (courseId) => {
    try {
      await axios.put(`${API}/education/courses/${courseId}/publish`, {}, { headers });
      toast.success("Course published!");
      fetchCourses();
    } catch (error) {
      toast.error("Failed to publish course");
    }
  };

  const saveLesson = async () => {
    if (!selectedCourse) return;
    try {
      const data = { ...lessonForm, course_id: selectedCourse.id };
      if (editingId) {
        await axios.put(`${API}/education/instructor/lessons/${editingId}`, data, { headers });
        toast.success("Lesson updated!");
      } else {
        await axios.post(`${API}/education/lessons`, data, { headers });
        toast.success("Lesson created!");
      }
      setShowLessonDialog(false);
      resetForms();
      fetchCourses();
    } catch (error) {
      toast.error("Failed to save lesson");
    }
  };

  const deleteLesson = async (lessonId) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await axios.delete(`${API}/education/instructor/lessons/${lessonId}`, { headers });
      toast.success("Lesson deleted");
      fetchCourses();
    } catch (error) {
      toast.error("Failed to delete lesson");
    }
  };

  const saveQuiz = async () => {
    if (!selectedCourse) return;
    try {
      const data = { ...quizForm, course_id: selectedCourse.id };
      if (editingId) {
        await axios.put(`${API}/education/instructor/quizzes/${editingId}`, data, { headers });
        toast.success("Quiz updated!");
      } else {
        await axios.post(`${API}/education/quizzes`, data, { headers });
        toast.success("Quiz created!");
      }
      setShowQuizDialog(false);
      resetForms();
      fetchCourses();
    } catch (error) {
      toast.error("Failed to save quiz");
    }
  };

  const resetForms = () => {
    setCourseForm({ title: "", description: "", category: "tech", difficulty: "beginner", price: 0, duration_hours: 10, is_featured: false });
    setLessonForm({ title: "", description: "", video_url: "", order_index: 1, duration_minutes: 10, is_free_preview: false });
    setQuizForm({ title: "", passing_score: 70, time_limit_minutes: 30, questions: [] });
    setEditingId(null);
    setSelectedCourse(null);
  };

  const openEditCourse = (course) => {
    setCourseForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "tech",
      difficulty: course.difficulty || "beginner",
      price: course.price || 0,
      duration_hours: course.duration_hours || 10,
      is_featured: course.is_featured || false
    });
    setEditingId(course.id);
    setShowCourseDialog(true);
  };

  const categories = [
    { id: "tech", name: "Technology" },
    { id: "language", name: "Languages" },
    { id: "k12", name: "School (K-12)" },
    { id: "college", name: "College" },
    { id: "professional", name: "Professional" },
    { id: "skill", name: "Skill Development" }
  ];

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "ఇన్‌స్ట్రక్టర్ పోర్టల్" : "Instructor Portal"}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "ఇన్‌స్ట్రక్టర్ పోర్టల్" : "Instructor Portal"}>
      <div className="space-y-4 pb-20" data-testid="instructor-portal">
        
        {/* Dashboard Stats */}
        {dashboard && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboard.total_courses}</p>
                    <p className="text-xs text-muted-foreground">Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboard.total_students}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹{dashboard.total_revenue}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboard.avg_completion_rate}%</p>
                    <p className="text-xs text-muted-foreground">Completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => { resetForms(); setShowCourseDialog(true); }} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Button>
          <Button variant="outline" onClick={() => { fetchCourses(); fetchDashboard(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Courses List */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            {language === "te" ? "మీ కోర్సులు" : "Your Courses"} ({courses.length})
          </h3>
          
          {courses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No courses yet. Create your first course!</p>
              </CardContent>
            </Card>
          ) : (
            courses.map((course) => (
              <Card key={course.id} className="overflow-hidden" data-testid={`course-${course.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm line-clamp-1">{course.title}</h4>
                        {course.is_published ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 text-[10px]">
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                            Live
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{course.description}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.enrollments} students
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          {course.lessons_count} lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <FileQuestion className="h-3 w-3" />
                          {course.quizzes_count} quizzes
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {!course.is_published && (
                        <Button size="sm" variant="default" onClick={() => publishCourse(course.id)}>
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mt-3 pt-3 border-t flex-wrap">
                    <Button size="sm" variant="ghost" onClick={() => openEditCourse(course)}>
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedCourse(course); setShowLessonDialog(true); }}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Lesson
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedCourse(course); setShowQuizDialog(true); }}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Quiz
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => fetchCourseAnalytics(course.id)}>
                      <BarChart3 className="h-3.5 w-3.5 mr-1" />
                      Analytics
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedCourse(course); fetchCourseStudents(course.id); }}>
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Students
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCourse(course.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Course Dialog */}
        <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Course" : "Create Course"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="Course title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Course description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={courseForm.category} onValueChange={(v) => setCourseForm({ ...courseForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={courseForm.difficulty} onValueChange={(v) => setCourseForm({ ...courseForm, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div>
                  <Label>Duration (hours)</Label>
                  <Input
                    type="number"
                    value={courseForm.duration_hours}
                    onChange={(e) => setCourseForm({ ...courseForm, duration_hours: Number(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Featured Course</Label>
                <Switch
                  checked={courseForm.is_featured}
                  onCheckedChange={(v) => setCourseForm({ ...courseForm, is_featured: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCourseDialog(false)}>Cancel</Button>
              <Button onClick={saveCourse}>{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lesson Dialog */}
        <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Lesson to "{selectedCourse?.title}"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Lesson title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  placeholder="Lesson description"
                  rows={2}
                />
              </div>
              <div>
                <Label>Video URL (YouTube/Vimeo)</Label>
                <Input
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={lessonForm.order_index}
                    onChange={(e) => setLessonForm({ ...lessonForm, order_index: Number(e.target.value) })}
                    min={1}
                  />
                </div>
                <div>
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: Number(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Free Preview</Label>
                <Switch
                  checked={lessonForm.is_free_preview}
                  onCheckedChange={(v) => setLessonForm({ ...lessonForm, is_free_preview: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLessonDialog(false)}>Cancel</Button>
              <Button onClick={saveLesson}>Add Lesson</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quiz Dialog */}
        <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Quiz to "{selectedCourse?.title}"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Quiz Title</Label>
                <Input
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="Quiz title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    value={quizForm.passing_score}
                    onChange={(e) => setQuizForm({ ...quizForm, passing_score: Number(e.target.value) })}
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <Label>Time Limit (min)</Label>
                  <Input
                    type="number"
                    value={quizForm.time_limit_minutes}
                    onChange={(e) => setQuizForm({ ...quizForm, time_limit_minutes: Number(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                After creating the quiz, you can add questions from the quiz editor.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuizDialog(false)}>Cancel</Button>
              <Button onClick={saveQuiz}>Create Quiz</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Analytics Dialog */}
        <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Course Analytics</DialogTitle>
            </DialogHeader>
            {courseAnalytics && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-xl font-bold text-blue-600">{courseAnalytics.summary.total_enrollments}</p>
                    <p className="text-xs text-muted-foreground">Enrollments</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <p className="text-xl font-bold text-green-600">{courseAnalytics.summary.completions}</p>
                    <p className="text-xs text-muted-foreground">Completions</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <p className="text-xl font-bold text-purple-600">{courseAnalytics.summary.completion_rate}%</p>
                    <p className="text-xs text-muted-foreground">Rate</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Lesson Engagement</h4>
                  <div className="space-y-2">
                    {courseAnalytics.lessons.map((lesson, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{lesson.title}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{lesson.views} views</span>
                          <span>{lesson.completion_rate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {courseAnalytics.quizzes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Quiz Performance</h4>
                    <div className="space-y-2">
                      {courseAnalytics.quizzes.map((quiz, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1">{quiz.title}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="secondary">{quiz.attempts} attempts</Badge>
                            <span className="text-muted-foreground">Avg: {quiz.avg_score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Students Dialog */}
        <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Students - {selectedCourse?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {students.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No students enrolled yet</p>
              ) : (
                students.map((student, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.phone}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={student.status === "completed" ? "default" : "secondary"}>
                        {student.progress}%
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(student.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
