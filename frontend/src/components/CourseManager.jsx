import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, Save, X, BookOpen, Video, FileText, Image,
  GraduationCap, Loader2, ChevronRight, Upload, Eye, EyeOff,
  Layers, PlayCircle, ClipboardList, Award, FolderOpen, Settings
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { id: "k12", name: "School (K-12)" },
  { id: "college", name: "College" },
  { id: "professional", name: "Professional" },
  { id: "skill", name: "Skill Development" },
  { id: "competitive", name: "Competitive Exams" },
  { id: "tech", name: "Technology" }
];

const DIFFICULTIES = [
  { id: "beginner", name: "Beginner" },
  { id: "intermediate", name: "Intermediate" },
  { id: "advanced", name: "Advanced" }
];

export default function CourseManager() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  
  // Dialog states
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  
  // Edit states
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  
  // Form states
  const [courseForm, setCourseForm] = useState({
    title: "", description: "", category: "professional", 
    difficulty: "beginner", price: 0, thumbnail_url: "",
    quiz_frequency: 3, has_certificate: true
  });
  
  const [subjectForm, setSubjectForm] = useState({
    title: "", description: "", thumbnail_url: "", order_index: 0
  });
  
  const [lessonForm, setLessonForm] = useState({
    title: "", description: "", video_url: "", duration_minutes: 0,
    pre_lesson_material: "", study_materials: [], order_index: 0,
    subject_id: "", is_free_preview: false
  });
  
  const [quizForm, setQuizForm] = useState({
    title: "", passing_score: 70, time_limit_minutes: 30,
    subject_id: "", lesson_id: "", quiz_type: "lesson", questions: []
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseDetails(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API}/education/courses?limit=100`);
      setCourses(res.data.courses || []);
    } catch (err) {
      toast.error("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId) => {
    try {
      const [subjectsRes, lessonsRes, quizzesRes] = await Promise.all([
        axios.get(`${API}/education/courses/${courseId}/subjects`),
        axios.get(`${API}/education/courses/${courseId}`, { headers }),
        axios.get(`${API}/education/quizzes?course_id=${courseId}`, { headers }).catch(() => ({ data: { quizzes: [] } }))
      ]);
      setSubjects(subjectsRes.data.subjects || []);
      setLessons(lessonsRes.data.lessons || []);
      setQuizzes(quizzesRes.data.quizzes || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Course CRUD
  const saveCourse = async () => {
    try {
      if (editingCourse) {
        await axios.put(`${API}/education/courses/${editingCourse.id}`, courseForm, { headers });
        toast.success("Course updated");
      } else {
        const res = await axios.post(`${API}/education/courses`, courseForm, { headers });
        toast.success("Course created");
      }
      fetchCourses();
      setShowCourseDialog(false);
      resetCourseForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save course");
    }
  };

  const deleteCourse = async (courseId) => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/education/courses/${courseId}`, { headers });
      toast.success("Course deleted");
      fetchCourses();
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
    } catch (err) {
      toast.error("Failed to delete course");
    }
  };

  const publishCourse = async (courseId, isPublished) => {
    try {
      await axios.put(`${API}/education/courses/${courseId}`, 
        { is_published: !isPublished }, { headers });
      toast.success(isPublished ? "Course unpublished" : "Course published");
      fetchCourses();
    } catch (err) {
      toast.error("Failed to update course");
    }
  };

  // Subject CRUD
  const saveSubject = async () => {
    try {
      const data = { ...subjectForm, course_id: selectedCourse.id };
      if (editingSubject) {
        await axios.put(`${API}/education/subjects/${editingSubject.id}`, data, { headers });
        toast.success("Subject updated");
      } else {
        await axios.post(`${API}/education/subjects`, data, { headers });
        toast.success("Subject created");
      }
      fetchCourseDetails(selectedCourse.id);
      setShowSubjectDialog(false);
      resetSubjectForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save subject");
    }
  };

  const deleteSubject = async (subjectId) => {
    if (!confirm("Delete this subject and all its lessons?")) return;
    try {
      await axios.delete(`${API}/education/subjects/${subjectId}`, { headers });
      toast.success("Subject deleted");
      fetchCourseDetails(selectedCourse.id);
    } catch (err) {
      toast.error("Failed to delete subject");
    }
  };

  // Lesson CRUD
  const saveLesson = async () => {
    try {
      const data = { ...lessonForm, course_id: selectedCourse.id };
      if (editingLesson) {
        await axios.put(`${API}/education/lessons/${editingLesson.id}`, data, { headers });
        toast.success("Lesson updated");
      } else {
        await axios.post(`${API}/education/lessons`, data, { headers });
        toast.success("Lesson created");
      }
      fetchCourseDetails(selectedCourse.id);
      setShowLessonDialog(false);
      resetLessonForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save lesson");
    }
  };

  const deleteLesson = async (lessonId) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await axios.delete(`${API}/education/lessons/${lessonId}`, { headers });
      toast.success("Lesson deleted");
      fetchCourseDetails(selectedCourse.id);
    } catch (err) {
      toast.error("Failed to delete lesson");
    }
  };

  // Quiz CRUD
  const saveQuiz = async () => {
    try {
      const data = { ...quizForm, course_id: selectedCourse.id };
      await axios.post(`${API}/education/quizzes`, data, { headers });
      toast.success("Quiz created");
      fetchCourseDetails(selectedCourse.id);
      setShowQuizDialog(false);
      resetQuizForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save quiz");
    }
  };

  // Reset forms
  const resetCourseForm = () => {
    setCourseForm({
      title: "", description: "", category: "professional",
      difficulty: "beginner", price: 0, thumbnail_url: "",
      quiz_frequency: 3, has_certificate: true
    });
    setEditingCourse(null);
  };

  const resetSubjectForm = () => {
    setSubjectForm({ title: "", description: "", thumbnail_url: "", order_index: subjects.length });
    setEditingSubject(null);
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: "", description: "", video_url: "", duration_minutes: 0,
      pre_lesson_material: "", study_materials: [], order_index: 0,
      subject_id: "", is_free_preview: false
    });
    setEditingLesson(null);
  };

  const resetQuizForm = () => {
    setQuizForm({
      title: "", passing_score: 70, time_limit_minutes: 30,
      subject_id: "", lesson_id: "", quiz_type: "lesson", questions: []
    });
  };

  // Add study material to lesson form
  const addStudyMaterial = () => {
    setLessonForm(f => ({
      ...f,
      study_materials: [...f.study_materials, { type: "pdf", url: "", title: "" }]
    }));
  };

  const updateStudyMaterial = (index, field, value) => {
    setLessonForm(f => ({
      ...f,
      study_materials: f.study_materials.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const removeStudyMaterial = (index) => {
    setLessonForm(f => ({
      ...f,
      study_materials: f.study_materials.filter((_, i) => i !== index)
    }));
  };

  // Add question to quiz
  const addQuestion = () => {
    setQuizForm(f => ({
      ...f,
      questions: [...f.questions, {
        id: Date.now().toString(),
        question: "",
        options: ["", "", "", ""],
        correct_answer: 0,
        explanation: ""
      }]
    }));
  };

  const updateQuestion = (index, field, value) => {
    setQuizForm(f => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateQuestionOption = (qIndex, oIndex, value) => {
    setQuizForm(f => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => j === oIndex ? value : o) } : q
      )
    }));
  };

  const removeQuestion = (index) => {
    setQuizForm(f => ({
      ...f,
      questions: f.questions.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Manager</h2>
          <p className="text-muted-foreground">Create and manage courses, subjects, lessons, and quizzes</p>
        </div>
        <Button onClick={() => { resetCourseForm(); setShowCourseDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Course
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Courses ({courses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {courses.map(course => (
              <div
                key={course.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCourse?.id === course.id 
                    ? "border-primary bg-primary/5" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedCourse(course)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{course.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIES.find(c => c.id === course.category)?.name || course.category}
                      </Badge>
                      {course.is_published ? (
                        <Badge className="bg-green-500 text-xs">Published</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Draft</Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No courses yet. Create your first course!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Course Details / Editor */}
        <Card className="lg:col-span-2">
          {selectedCourse ? (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedCourse.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCourse.description?.slice(0, 100)}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => publishCourse(selectedCourse.id, selectedCourse.is_published)}
                    >
                      {selectedCourse.is_published ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                      {selectedCourse.is_published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCourse(selectedCourse);
                        setCourseForm({
                          title: selectedCourse.title || "",
                          description: selectedCourse.description || "",
                          category: selectedCourse.category || "professional",
                          difficulty: selectedCourse.difficulty || "beginner",
                          price: selectedCourse.price || 0,
                          thumbnail_url: selectedCourse.thumbnail_url || "",
                          quiz_frequency: selectedCourse.quiz_frequency || 3,
                          has_certificate: selectedCourse.has_certificate !== false
                        });
                        setShowCourseDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCourse(selectedCourse.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="subjects">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="subjects">
                      <Layers className="h-4 w-4 mr-1" /> Subjects
                    </TabsTrigger>
                    <TabsTrigger value="lessons">
                      <PlayCircle className="h-4 w-4 mr-1" /> Lessons
                    </TabsTrigger>
                    <TabsTrigger value="quizzes">
                      <ClipboardList className="h-4 w-4 mr-1" /> Quizzes
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                      <Settings className="h-4 w-4 mr-1" /> Settings
                    </TabsTrigger>
                  </TabsList>

                  {/* Subjects Tab */}
                  <TabsContent value="subjects" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Organize your course into subjects (e.g., History, Geography)
                      </p>
                      <Button size="sm" onClick={() => { resetSubjectForm(); setShowSubjectDialog(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Subject
                      </Button>
                    </div>
                    
                    {subjects.length > 0 ? (
                      <Accordion type="multiple" className="space-y-2">
                        {subjects.map((subject, idx) => (
                          <AccordionItem key={subject.id} value={subject.id} className="border rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                  {idx + 1}
                                </div>
                                <div className="text-left">
                                  <p className="font-medium">{subject.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {subject.lesson_count || 0} lessons
                                  </p>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pl-11 pb-2 space-y-2">
                                <p className="text-sm text-muted-foreground">{subject.description}</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingSubject(subject);
                                      setSubjectForm({
                                        title: subject.title,
                                        description: subject.description || "",
                                        thumbnail_url: subject.thumbnail_url || "",
                                        order_index: subject.order_index || idx
                                      });
                                      setShowSubjectDialog(true);
                                    }}
                                  >
                                    <Edit className="h-3 w-3 mr-1" /> Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      resetLessonForm();
                                      setLessonForm(f => ({ ...f, subject_id: subject.id }));
                                      setShowLessonDialog(true);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add Lesson
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteSubject(subject.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                {/* Lessons under this subject */}
                                <div className="mt-3 space-y-2">
                                  {lessons.filter(l => l.subject_id === subject.id).map((lesson, lIdx) => (
                                    <div key={lesson.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{lIdx + 1}.</span>
                                        <Video className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm">{lesson.title}</span>
                                        {lesson.is_free_preview && (
                                          <Badge variant="secondary" className="text-xs">Preview</Badge>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-6 w-6"
                                          onClick={() => {
                                            setEditingLesson(lesson);
                                            setLessonForm({
                                              title: lesson.title,
                                              description: lesson.description || "",
                                              video_url: lesson.video_url || "",
                                              duration_minutes: lesson.duration_minutes || 0,
                                              pre_lesson_material: lesson.pre_lesson_material || "",
                                              study_materials: lesson.study_materials || [],
                                              order_index: lesson.order_index || lIdx,
                                              subject_id: lesson.subject_id || "",
                                              is_free_preview: lesson.is_free_preview || false
                                            });
                                            setShowLessonDialog(true);
                                          }}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                                          onClick={() => deleteLesson(lesson.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No subjects yet. Add your first subject!</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Lessons Tab - All lessons */}
                  <TabsContent value="lessons" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {lessons.length} lessons • Sequential learning enforced (no skipping)
                      </p>
                      <Button size="sm" onClick={() => { resetLessonForm(); setShowLessonDialog(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Lesson
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {lessons.map((lesson, idx) => (
                        <div key={lesson.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium">{lesson.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {lesson.video_url && <Video className="h-3 w-3" />}
                                {lesson.study_materials?.length > 0 && (
                                  <span><FileText className="h-3 w-3 inline" /> {lesson.study_materials.length} files</span>
                                )}
                                <span>{lesson.duration_minutes || 0} min</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lesson.is_free_preview && <Badge variant="secondary">Preview</Badge>}
                            <Button size="icon" variant="ghost"
                              onClick={() => {
                                setEditingLesson(lesson);
                                setLessonForm({
                                  title: lesson.title,
                                  description: lesson.description || "",
                                  video_url: lesson.video_url || "",
                                  duration_minutes: lesson.duration_minutes || 0,
                                  pre_lesson_material: lesson.pre_lesson_material || "",
                                  study_materials: lesson.study_materials || [],
                                  order_index: lesson.order_index || idx,
                                  subject_id: lesson.subject_id || "",
                                  is_free_preview: lesson.is_free_preview || false
                                });
                                setShowLessonDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive"
                              onClick={() => deleteLesson(lesson.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Quizzes Tab */}
                  <TabsContent value="quizzes" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {quizzes.length} quizzes • Quiz after every {selectedCourse.quiz_frequency || 3} lessons
                      </p>
                      <Button size="sm" onClick={() => { resetQuizForm(); setShowQuizDialog(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Quiz
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {quizzes.map(quiz => (
                        <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <ClipboardList className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="font-medium">{quiz.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {quiz.questions?.length || 0} questions • Pass: {quiz.passing_score}%
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{quiz.quiz_type}</Badge>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Certificate</p>
                          <p className="text-sm text-muted-foreground">Award certificate on completion</p>
                        </div>
                        <Badge variant={selectedCourse.has_certificate ? "default" : "secondary"}>
                          {selectedCourse.has_certificate ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Quiz Frequency</p>
                          <p className="text-sm text-muted-foreground">Quiz after every X lessons</p>
                        </div>
                        <Badge variant="outline">{selectedCourse.quiz_frequency || 3} lessons</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Price</p>
                          <p className="text-sm text-muted-foreground">Course enrollment fee</p>
                        </div>
                        <Badge variant="outline">
                          {selectedCourse.price > 0 ? `₹${selectedCourse.price}` : "Free"}
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <GraduationCap className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">Select a course to manage</p>
              <p className="text-sm">Or create a new course to get started</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
            <DialogDescription>
              {editingCourse ? "Update course details" : "Fill in the course information"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Course Title *</Label>
              <Input
                value={courseForm.title}
                onChange={(e) => setCourseForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g., UPSC Civil Services Preparation"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what students will learn..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={courseForm.category} onValueChange={(v) => setCourseForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select value={courseForm.difficulty} onValueChange={(v) => setCourseForm(f => ({ ...f, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={courseForm.price}
                  onChange={(e) => setCourseForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0 for free"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Quiz after every X lessons</Label>
                <Input
                  type="number"
                  value={courseForm.quiz_frequency}
                  onChange={(e) => setCourseForm(f => ({ ...f, quiz_frequency: parseInt(e.target.value) || 3 }))}
                  min={1}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Thumbnail URL</Label>
              <Input
                value={courseForm.thumbnail_url}
                onChange={(e) => setCourseForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)}>Cancel</Button>
            <Button onClick={saveCourse} disabled={!courseForm.title || !courseForm.description}>
              <Save className="h-4 w-4 mr-2" /> {editingCourse ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Subject Title *</Label>
              <Input
                value={subjectForm.title}
                onChange={(e) => setSubjectForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Indian History"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={subjectForm.description}
                onChange={(e) => setSubjectForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this subject..."
                rows={2}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={subjectForm.order_index}
                onChange={(e) => setSubjectForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubjectDialog(false)}>Cancel</Button>
            <Button onClick={saveSubject} disabled={!subjectForm.title}>
              <Save className="h-4 w-4 mr-2" /> {editingSubject ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
            <DialogDescription>
              Add video, study materials, and pre-lesson content
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Lesson Title *</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Introduction to Ancient India"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Select value={lessonForm.subject_id} onValueChange={(v) => setLessonForm(f => ({ ...f, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={lessonForm.duration_minutes}
                  onChange={(e) => setLessonForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" /> Video URL
              </Label>
              <Input
                value={lessonForm.video_url}
                onChange={(e) => setLessonForm(f => ({ ...f, video_url: e.target.value }))}
                placeholder="YouTube/Vimeo URL or direct video link"
              />
            </div>
            
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Pre-Lesson Material (Optional)
              </Label>
              <Input
                value={lessonForm.pre_lesson_material}
                onChange={(e) => setLessonForm(f => ({ ...f, pre_lesson_material: e.target.value }))}
                placeholder="PDF or document URL to read before the lesson"
              />
            </div>
            
            {/* Study Materials */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Study Materials (PDFs, Images)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addStudyMaterial}>
                  <Plus className="h-3 w-3 mr-1" /> Add Material
                </Button>
              </div>
              
              {lessonForm.study_materials.map((material, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={material.title}
                      onChange={(e) => updateStudyMaterial(idx, "title", e.target.value)}
                      placeholder="Material name"
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Type</Label>
                    <Select value={material.type} onValueChange={(v) => updateStudyMaterial(idx, "type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">URL</Label>
                    <Input
                      value={material.url}
                      onChange={(e) => updateStudyMaterial(idx, "url", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeStudyMaterial(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="freePreview"
                checked={lessonForm.is_free_preview}
                onChange={(e) => setLessonForm(f => ({ ...f, is_free_preview: e.target.checked }))}
              />
              <Label htmlFor="freePreview">Free Preview (accessible without enrollment)</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)}>Cancel</Button>
            <Button onClick={saveLesson} disabled={!lessonForm.title}>
              <Save className="h-4 w-4 mr-2" /> {editingLesson ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Quiz</DialogTitle>
            <DialogDescription>
              Add multiple choice questions
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quiz Title *</Label>
                <Input
                  value={quizForm.title}
                  onChange={(e) => setQuizForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Chapter 1 Quiz"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Quiz Type</Label>
                <Select value={quizForm.quiz_type} onValueChange={(v) => setQuizForm(f => ({ ...f, quiz_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">After Lesson</SelectItem>
                    <SelectItem value="subject">Subject Test</SelectItem>
                    <SelectItem value="final">Final Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Passing Score (%)</Label>
                <Input
                  type="number"
                  value={quizForm.passing_score}
                  onChange={(e) => setQuizForm(f => ({ ...f, passing_score: parseInt(e.target.value) || 70 }))}
                  min={0}
                  max={100}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Time Limit (minutes)</Label>
                <Input
                  type="number"
                  value={quizForm.time_limit_minutes}
                  onChange={(e) => setQuizForm(f => ({ ...f, time_limit_minutes: parseInt(e.target.value) || 30 }))}
                />
              </div>
            </div>
            
            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Questions ({quizForm.questions.length})</Label>
                <Button type="button" size="sm" onClick={addQuestion}>
                  <Plus className="h-3 w-3 mr-1" /> Add Question
                </Button>
              </div>
              
              {quizForm.questions.map((question, qIdx) => (
                <Card key={question.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Label>Question {qIdx + 1}</Label>
                      <Button size="icon" variant="ghost" onClick={() => removeQuestion(qIdx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <Textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                      placeholder="Enter the question..."
                      rows={2}
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      {question.options.map((option, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={question.correct_answer === oIdx}
                            onChange={() => updateQuestion(qIdx, "correct_answer", oIdx)}
                          />
                          <Input
                            value={option}
                            onChange={(e) => updateQuestionOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                            className={question.correct_answer === oIdx ? "border-green-500" : ""}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <Input
                      value={question.explanation}
                      onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                      placeholder="Explanation (shown after answer)"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuizDialog(false)}>Cancel</Button>
            <Button onClick={saveQuiz} disabled={!quizForm.title || quizForm.questions.length === 0}>
              <Save className="h-4 w-4 mr-2" /> Create Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
