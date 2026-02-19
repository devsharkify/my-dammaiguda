import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  GraduationCap,
  BookOpen,
  Play,
  Clock,
  Users,
  Star,
  Search,
  Trophy,
  Award,
  Video,
  ChevronRight,
  Loader2,
  School,
  Briefcase,
  Wrench,
  Languages,
  Laptop,
  Calendar,
  Target,
  Flame
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AITEducation() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState("explore");

  const headers = { Authorization: `Bearer ${token}` };

  const categoryIcons = {
    professional: <Briefcase className="h-5 w-5" />,
    skill: <Wrench className="h-5 w-5" />,
    language: <Languages className="h-5 w-5" />,
    tech: <Laptop className="h-5 w-5" />
  };

  // Filter out disabled categories
  const enabledCategories = ["professional", "skill", "language", "tech"];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory || searchQuery) {
      fetchCourses();
    }
  }, [selectedCategory, searchQuery]);

  const fetchData = async () => {
    try {
      const [coursesRes, categoriesRes, myCoursesRes, liveRes, statsRes] = await Promise.all([
        axios.get(`${API}/education/courses?featured=true&limit=20`),
        axios.get(`${API}/education/courses/categories`),
        axios.get(`${API}/education/my-courses`, { headers }).catch(() => ({ data: { courses: [] } })),
        axios.get(`${API}/education/live-classes`).catch(() => ({ data: { live_classes: [] } })),
        axios.get(`${API}/education/my-stats`, { headers }).catch(() => ({ data: null }))
      ]);

      // Filter courses: only show published courses with price >= 1999 (premium courses)
      const allCourses = coursesRes.data.courses || [];
      const filteredCourses = allCourses.filter(c => 
        c.is_published !== false && 
        c.price >= 1999 &&
        ['professional', 'tech', 'skill', 'language'].includes(c.category)
      );
      
      // Remove duplicates by title
      const uniqueCourses = filteredCourses.reduce((acc, course) => {
        if (!acc.find(c => c.title === course.title)) {
          acc.push(course);
        }
        return acc;
      }, []);
      
      setCourses(uniqueCourses);
      
      setCategories(categoriesRes.data.categories || []);
      setMyCourses(myCoursesRes.data.courses || []);
      setLiveClasses(liveRes.data.live_classes || []);
      setMyStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching education data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await axios.get(`${API}/education/courses?${params.toString()}`);
      // Filter courses: only show published courses with price >= 1999 (premium courses)
      const allCourses = response.data.courses || [];
      const filteredCourses = allCourses.filter(c => 
        c.is_published !== false && 
        c.price >= 1999 &&
        ['professional', 'tech', 'skill', 'language'].includes(c.category)
      );
      
      // Remove duplicates by title
      const uniqueCourses = filteredCourses.reduce((acc, course) => {
        if (!acc.find(c => c.title === course.title)) {
          acc.push(course);
        }
        return acc;
      }, []);
      
      setCourses(uniqueCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const enrollCourse = async (courseId) => {
    try {
      await axios.post(`${API}/education/enroll`, { course_id: courseId }, { headers });
      toast.success(language === "te" ? "కోర్సులో చేరారు!" : "Enrolled successfully!");
      fetchData();
    } catch (error) {
      toast.error("Failed to enroll");
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-700";
      case "intermediate": return "bg-yellow-100 text-yellow-700";
      case "advanced": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "AIT విద్య" : "AIT Education"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "AIT విద్య" : "AIT Education"}>
      <div className="space-y-4 pb-20" data-testid="ait-education">
        
        {/* Hero Stats Card */}
        {myStats && (
          <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white border-0 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/80 text-sm">
                    {language === "te" ? "మీ నేర్చుకునే ప్రయాణం" : "Your Learning Journey"}
                  </p>
                  <h2 className="text-2xl font-bold">{myStats.total_xp} XP</h2>
                </div>
                <Link to="/leaderboard" className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Trophy className="h-7 w-7" />
                </Link>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-xl font-bold">{myStats.courses_completed}</p>
                  <p className="text-[10px] text-white/70">
                    {language === "te" ? "పూర్తి" : "Completed"}
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-xl font-bold">{myStats.courses_in_progress}</p>
                  <p className="text-[10px] text-white/70">
                    {language === "te" ? "కొనసాగుతోంది" : "In Progress"}
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-xl font-bold">{myStats.certificates_earned}</p>
                  <p className="text-[10px] text-white/70">
                    {language === "te" ? "సర్టిఫికెట్లు" : "Certificates"}
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-xl font-bold">{myStats.total_watch_time_hours}h</p>
                  <p className="text-[10px] text-white/70">
                    {language === "te" ? "చూసిన సమయం" : "Watch Time"}
                  </p>
                </div>
              </div>
              
              {/* Leaderboard Link */}
              <Link to="/leaderboard" className="flex items-center justify-between mt-3 pt-3 border-t border-white/20 text-sm hover:bg-white/10 rounded-lg px-2 py-1 transition-colors">
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  {language === "te" ? "లీడర్‌బోర్డ్ చూడండి" : "View Leaderboard"}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === "te" ? "కోర్సులు వెతకండి..." : "Search courses..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-full"
            data-testid="course-search"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-11">
            <TabsTrigger value="explore" className="text-xs">
              {language === "te" ? "అన్వేషించు" : "Explore"}
            </TabsTrigger>
            <TabsTrigger value="my-courses" className="text-xs">
              {language === "te" ? "నా కోర్సులు" : "My Courses"}
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs">
              {language === "te" ? "లైవ్" : "Live"}
            </TabsTrigger>
          </TabsList>

          {/* Explore Tab */}
          <TabsContent value="explore" className="mt-4 space-y-4">
            {/* Categories - Only show enabled ones */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory 
                    ? "bg-primary text-white" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {language === "te" ? "అన్నీ" : "All"}
              </button>
              {categories.filter(cat => enabledCategories.includes(cat.id)).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === cat.id 
                      ? "bg-primary text-white" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {categoryIcons[cat.id]}
                  {cat.id === "professional" 
                    ? (language === "te" ? "ప్రొఫెషనల్ జాబ్" : "Professional Job")
                    : (language === "te" ? cat.name_te : cat.name)}
                </button>
              ))}
            </div>

            {/* Course Grid */}
            <div className="space-y-3">
              {courses.map((course) => (
                <Link key={course.id} to={`/education/course/${course.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`course-card-${course.id}`}>
                    <div className="flex">
                      <div className="w-28 h-28 flex-shrink-0">
                        <img
                          src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="flex-1 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm line-clamp-2">
                            {language === "te" && course.title_te ? course.title_te : course.title}
                          </h3>
                          {course.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {course.instructor_name}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={`text-[10px] ${getDifficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.duration_hours}h
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {course.enrollment_count || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className={`font-bold ${course.price === 0 ? "text-green-600" : "text-primary"}`}>
                            {course.price === 0 ? (language === "te" ? "ఉచితం" : "FREE") : `₹${course.price?.toLocaleString()}`}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
              
              {courses.length === 0 && (
                <div className="text-center py-10">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    {language === "te" ? "కోర్సులు కనుగొనబడలేదు" : "No courses found"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Courses Tab */}
          <TabsContent value="my-courses" className="mt-4 space-y-3">
            {myCourses.length > 0 ? (
              myCourses.map((course) => (
                <Link key={course.id} to={`/education/course/${course.id}`}>
                  <Card className="overflow-hidden" data-testid={`my-course-${course.id}`}>
                    <div className="flex">
                      <div className="w-24 h-24 flex-shrink-0">
                        <img
                          src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200"}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="flex-1 p-3">
                        <h3 className="font-semibold text-sm line-clamp-1">
                          {language === "te" && course.title_te ? course.title_te : course.title}
                        </h3>
                        
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              {language === "te" ? "పురోగతి" : "Progress"}
                            </span>
                            <span className="font-medium">{course.progress?.percentage || 0}%</span>
                          </div>
                          <Progress value={course.progress?.percentage || 0} className="h-2" />
                        </div>
                        
                        {course.enrollment?.status === "completed" ? (
                          <Badge className="mt-2 bg-green-100 text-green-700">
                            <Award className="h-3 w-3 mr-1" />
                            {language === "te" ? "పూర్తయింది" : "Completed"}
                          </Badge>
                        ) : (
                          <Button size="sm" className="mt-2 h-7 text-xs">
                            <Play className="h-3 w-3 mr-1" />
                            {language === "te" ? "కొనసాగించు" : "Continue"}
                          </Button>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-10">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">
                  {language === "te" ? "మీరు ఇంకా కోర్సులో చేరలేదు" : "You haven't enrolled in any course yet"}
                </p>
                <Button onClick={() => setActiveTab("explore")}>
                  {language === "te" ? "కోర్సులు అన్వేషించు" : "Explore Courses"}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Live Classes Tab */}
          <TabsContent value="live" className="mt-4 space-y-3">
            {liveClasses.length > 0 ? (
              liveClasses.map((liveClass) => (
                <Card key={liveClass.id} className="overflow-hidden border-red-200" data-testid={`live-class-${liveClass.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                          <Badge className="bg-red-100 text-red-700">LIVE</Badge>
                        </div>
                        <h3 className="font-semibold">
                          {language === "te" && liveClass.title_te ? liveClass.title_te : liveClass.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {liveClass.description}
                        </p>
                      </div>
                      <Video className="h-8 w-8 text-red-500" />
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(liveClass.scheduled_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {liveClass.duration_minutes} min
                      </span>
                    </div>
                    
                    <Button className="w-full mt-3 bg-red-500 hover:bg-red-600">
                      {language === "te" ? "ఇప్పుడు చేరండి" : "Join Now"}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10">
                <Video className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {language === "te" ? "ఇప్పుడు లైవ్ క్లాసులు లేవు" : "No live classes scheduled"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
