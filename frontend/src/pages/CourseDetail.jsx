import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  CheckCircle,
  Lock,
  Award,
  FileText,
  ChevronRight,
  Loader2,
  PlayCircle,
  Trophy,
  Download,
  Share2,
  MessageSquare,
  ThumbsUp,
  Edit,
  Trash2
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CourseDetail() {
  const { courseId } = useParams();
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myReviewText, setMyReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCourseData();
    fetchReviews();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const response = await axios.get(`${API}/education/courses/${courseId}`, { headers });
      setCourse(response.data.course);
      setLessons(response.data.lessons || []);
      setQuizzes(response.data.quizzes || []);
      setIsEnrolled(response.data.is_enrolled);
      setProgress(response.data.progress);
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/education/courses/${courseId}/reviews`);
      setReviews(response.data.reviews || []);
      setReviewStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const submitReview = async () => {
    if (myRating === 0) {
      toast.error(language === "te" ? "దయచేసి రేటింగ్ ఇవ్వండి" : "Please select a rating");
      return;
    }
    
    setSubmittingReview(true);
    try {
      await axios.post(`${API}/education/courses/${courseId}/reviews`, {
        course_id: courseId,
        rating: myRating,
        review_text: myReviewText
      }, { headers });
      
      toast.success(language === "te" ? "రివ్యూ సమర్పించబడింది!" : "Review submitted!");
      setShowReviewDialog(false);
      setMyRating(0);
      setMyReviewText("");
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const markHelpful = async (reviewId) => {
    try {
      await axios.post(`${API}/education/reviews/${reviewId}/helpful`, {}, { headers });
      fetchReviews();
    } catch (error) {
      toast.error("Failed to mark helpful");
    }
  };

  const enrollCourse = async () => {
    setEnrolling(true);
    try {
      await axios.post(`${API}/education/enroll`, { course_id: courseId }, { headers });
      toast.success(language === "te" ? "కోర్సులో విజయవంతంగా చేరారు!" : "Enrolled successfully!");
      setIsEnrolled(true);
      fetchCourseData();
    } catch (error) {
      toast.error("Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  const openLesson = async (lesson) => {
    if (!isEnrolled && !lesson.is_free_preview) {
      toast.error(language === "te" ? "దయచేసి మొదట చేరండి" : "Please enroll first");
      return;
    }
    
    try {
      const response = await axios.get(`${API}/education/lessons/${lesson.id}`, { headers });
      setActiveLesson(response.data);
    } catch (error) {
      toast.error("Failed to load lesson");
    }
  };

  const markLessonComplete = async () => {
    if (!activeLesson) return;
    
    try {
      await axios.post(`${API}/education/lessons/${activeLesson.id}/progress`, {
        course_id: courseId,
        lesson_id: activeLesson.id,
        completed: true,
        watch_time_seconds: activeLesson.duration_minutes * 60
      }, { headers });
      
      toast.success(language === "te" ? "పాఠం పూర్తయింది!" : "Lesson completed!");
      fetchCourseData();
      setActiveLesson(null);
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const openQuiz = async (quiz) => {
    if (!isEnrolled) {
      toast.error(language === "te" ? "దయచేసి మొదట చేరండి" : "Please enroll first");
      return;
    }
    
    try {
      const response = await axios.get(`${API}/education/quizzes/${quiz.id}`, { headers });
      setActiveQuiz(response.data);
      setQuizAnswers({});
      setQuizResult(null);
    } catch (error) {
      toast.error("Failed to load quiz");
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    
    const answers = activeQuiz.questions.map(q => ({
      question_id: q.id,
      selected_option: quizAnswers[q.id]
    }));
    
    setSubmittingQuiz(true);
    try {
      const response = await axios.post(`${API}/education/quizzes/${activeQuiz.id}/submit`, {
        quiz_id: activeQuiz.id,
        answers
      }, { headers });
      
      setQuizResult(response.data);
      
      if (response.data.passed) {
        toast.success(language === "te" ? "అభినందనలు! మీరు పాస్ అయ్యారు!" : "Congratulations! You passed!");
      } else {
        toast.error(language === "te" ? "మీరు పాస్ కాలేదు. మళ్ళీ ప్రయత్నించండి!" : "You didn't pass. Try again!");
      }
    } catch (error) {
      toast.error("Failed to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const generateCertificate = async () => {
    try {
      const response = await axios.post(`${API}/education/certificates/generate/${courseId}`, {}, { headers });
      toast.success(language === "te" ? "సర్టిఫికెట్ సృష్టించబడింది!" : "Certificate generated!");
      navigate(`/education/certificate/${response.data.certificate.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to generate certificate");
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
      <Layout showBackButton title={language === "te" ? "కోర్సు" : "Course"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout showBackButton title={language === "te" ? "కోర్సు" : "Course"}>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Course not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "కోర్సు" : "Course"}>
      <div className="space-y-4 pb-20" data-testid="course-detail">
        
        {/* Course Hero */}
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600"}
            alt={course.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Badge className={getDifficultyColor(course.difficulty)}>
              {course.difficulty}
            </Badge>
            <h1 className="text-white font-bold text-xl mt-2">
              {language === "te" && course.title_te ? course.title_te : course.title}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {course.instructor_name}
            </p>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-muted rounded-lg p-2 text-center">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
            <p className="text-xs mt-1 font-medium">{course.duration_hours}h</p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <BookOpen className="h-4 w-4 mx-auto text-muted-foreground" />
            <p className="text-xs mt-1 font-medium">{lessons.length} {language === "te" ? "పాఠాలు" : "Lessons"}</p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <Users className="h-4 w-4 mx-auto text-muted-foreground" />
            <p className="text-xs mt-1 font-medium">{course.enrollment_count || 0}</p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <Star className="h-4 w-4 mx-auto text-yellow-500" />
            <p className="text-xs mt-1 font-medium">{reviewStats?.average_rating || course.average_rating || "—"}</p>
          </div>
        </div>

        {/* Progress (if enrolled) */}
        {isEnrolled && progress && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {language === "te" ? "మీ పురోగతి" : "Your Progress"}
                </span>
                <span className="text-sm font-bold text-primary">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {progress.completed}/{progress.total} {language === "te" ? "పాఠాలు పూర్తయ్యాయి" : "lessons completed"}
              </p>
              
              {progress.percentage === 100 && (
                <Button onClick={generateCertificate} className="w-full mt-3" variant="outline">
                  <Award className="h-4 w-4 mr-2" />
                  {language === "te" ? "సర్టిఫికెట్ పొందండి" : "Get Certificate"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enroll Button (if not enrolled) */}
        {!isEnrolled && (
          <Card className="border-0 bg-gradient-to-r from-primary to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">
                    {language === "te" ? "కోర్సు ఫీజు" : "Course Fee"}
                  </p>
                  <p className="text-2xl font-bold">
                    {course.price === 0 ? (language === "te" ? "ఉచితం" : "FREE") : `₹${course.price}`}
                  </p>
                </div>
                <Button 
                  onClick={enrollCourse} 
                  disabled={enrolling}
                  className="bg-white text-primary hover:bg-white/90"
                >
                  {enrolling ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <PlayCircle className="h-4 w-4 mr-2" />
                  )}
                  {language === "te" ? "ఇప్పుడు చేరండి" : "Enroll Now"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: About, Curriculum, Reviews */}
        <Tabs defaultValue="curriculum" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-10">
            <TabsTrigger value="about" className="text-xs">
              {language === "te" ? "గురించి" : "About"}
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="text-xs">
              {language === "te" ? "పాఠాలు" : "Lessons"}
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="text-xs">
              {language === "te" ? "క్విజ్" : "Quiz"}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs">
              {language === "te" ? "రివ్యూలు" : "Reviews"}
            </TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">
                  {language === "te" ? "కోర్సు వివరణ" : "Course Description"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === "te" && course.description_te ? course.description_te : course.description}
                </p>
                
                {course.tags && course.tags.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="mt-4 space-y-2">
            {lessons.map((lesson, idx) => (
              <Card 
                key={lesson.id} 
                className={`cursor-pointer transition-colors ${
                  isEnrolled || lesson.is_free_preview 
                    ? "hover:bg-muted/50" 
                    : "opacity-60"
                }`}
                onClick={() => openLesson(lesson)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    isEnrolled || lesson.is_free_preview 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isEnrolled || lesson.is_free_preview ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {language === "te" ? `పాఠం ${idx + 1}` : `Lesson ${idx + 1}`}
                      </span>
                      {lesson.is_free_preview && (
                        <Badge className="text-[10px] bg-green-100 text-green-700">
                          {language === "te" ? "ఉచిత ప్రీవ్యూ" : "Free Preview"}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-sm">
                      {language === "te" && lesson.title_te ? lesson.title_te : lesson.title}
                    </h4>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      {lesson.duration_minutes} min
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="mt-4 space-y-2">
            {quizzes.length > 0 ? (
              quizzes.map((quiz, idx) => (
                <Card 
                  key={quiz.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => openQuiz(quiz)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {language === "te" && quiz.title_te ? quiz.title_te : quiz.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {language === "te" ? "పాసింగ్ స్కోర్:" : "Passing:"} {quiz.passing_score}%
                      </p>
                    </div>
                    
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === "te" ? "క్విజ్‌లు లేవు" : "No quizzes available"}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-4 space-y-4">
            {/* Rating Summary */}
            {reviewStats && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">
                        {reviewStats.average_rating || "—"}
                      </p>
                      <div className="flex justify-center mt-1">
                        {[1,2,3,4,5].map(star => (
                          <Star 
                            key={star} 
                            className={`h-3 w-3 ${star <= Math.round(reviewStats.average_rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reviewStats.total_reviews} {language === "te" ? "రివ్యూలు" : "reviews"}
                      </p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5,4,3,2,1].map(rating => (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-xs w-3">{rating}</span>
                          <Progress 
                            value={reviewStats.total_reviews > 0 
                              ? (reviewStats.rating_breakdown[rating] / reviewStats.total_reviews) * 100 
                              : 0} 
                            className="h-1.5 flex-1" 
                          />
                          <span className="text-xs text-muted-foreground w-6">
                            {reviewStats.rating_breakdown[rating] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Write Review Button */}
            {isEnrolled && (
              <Button onClick={() => setShowReviewDialog(true)} className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                {language === "te" ? "రివ్యూ రాయండి" : "Write a Review"}
              </Button>
            )}

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{review.user_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1,2,3,4,5].map(star => (
                            <Star 
                              key={star} 
                              className={`h-3 w-3 ${star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {review.review_text}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs"
                        onClick={() => markHelpful(review.id)}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {language === "te" ? "ఉపయోగకరం" : "Helpful"} ({review.helpful_count || 0})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {reviews.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === "te" ? "రివ్యూలు లేవు" : "No reviews yet"}
                  </p>
                  {isEnrolled && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === "te" ? "మొదటి రివ్యూ రాయండి!" : "Be the first to review!"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "te" ? "మీ రివ్యూ రాయండి" : "Write Your Review"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>{language === "te" ? "రేటింగ్" : "Rating"}</Label>
              <div className="flex gap-2 mt-2">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    onClick={() => setMyRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star 
                      className={`h-8 w-8 ${star <= myRating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label>{language === "te" ? "మీ రివ్యూ (ఐచ్ఛికం)" : "Your Review (Optional)"}</Label>
              <Textarea
                value={myReviewText}
                onChange={(e) => setMyReviewText(e.target.value)}
                placeholder={language === "te" ? "మీ అనుభవాన్ని షేర్ చేయండి..." : "Share your experience..."}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              {language === "te" ? "రద్దు చేయి" : "Cancel"}
            </Button>
            <Button onClick={submitReview} disabled={submittingReview}>
              {submittingReview && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "te" ? "సమర్పించు" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Viewer Dialog */}
      <Dialog open={!!activeLesson} onOpenChange={() => setActiveLesson(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {activeLesson && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {language === "te" && activeLesson.title_te ? activeLesson.title_te : activeLesson.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {activeLesson.video_url && (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={activeLesson.video_url}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                )}
                
                {activeLesson.content_html && (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: activeLesson.content_html }}
                  />
                )}
                
                {!activeLesson.video_url && !activeLesson.content_html && (
                  <div className="text-center py-8 bg-muted rounded-lg">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {language === "te" ? "కంటెంట్ త్వరలో వస్తుంది" : "Content coming soon"}
                    </p>
                  </div>
                )}
                
                <Button onClick={markLessonComplete} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {language === "te" ? "పూర్తయినట్టు గుర్తించు" : "Mark as Complete"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={!!activeQuiz} onOpenChange={() => { setActiveQuiz(null); setQuizResult(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {activeQuiz && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {language === "te" && activeQuiz.title_te ? activeQuiz.title_te : activeQuiz.title}
                </DialogTitle>
              </DialogHeader>
              
              {!quizResult ? (
                <div className="space-y-6">
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="space-y-3">
                      <p className="font-medium">
                        {idx + 1}. {language === "te" && q.question_te ? q.question_te : q.question}
                      </p>
                      
                      <RadioGroup
                        value={quizAnswers[q.id] || ""}
                        onValueChange={(value) => setQuizAnswers({...quizAnswers, [q.id]: value})}
                      >
                        {q.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`q${idx}-opt${optIdx}`} />
                            <Label htmlFor={`q${idx}-opt${optIdx}`} className="text-sm">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                  
                  <Button 
                    onClick={submitQuiz} 
                    disabled={submittingQuiz || Object.keys(quizAnswers).length < activeQuiz.questions.length}
                    className="w-full"
                  >
                    {submittingQuiz ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {language === "te" ? "సమర్పించు" : "Submit Quiz"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-6 rounded-xl text-center ${
                    quizResult.passed 
                      ? "bg-green-50 border border-green-200" 
                      : "bg-red-50 border border-red-200"
                  }`}>
                    {quizResult.passed ? (
                      <Trophy className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    ) : (
                      <FileText className="h-12 w-12 mx-auto text-red-500 mb-2" />
                    )}
                    <h3 className={`text-xl font-bold ${quizResult.passed ? "text-green-700" : "text-red-700"}`}>
                      {quizResult.score}%
                    </h3>
                    <p className={`text-sm ${quizResult.passed ? "text-green-600" : "text-red-600"}`}>
                      {quizResult.correct}/{quizResult.total} {language === "te" ? "సరైనవి" : "correct"}
                    </p>
                    <Badge className={`mt-2 ${quizResult.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {quizResult.passed 
                        ? (language === "te" ? "పాస్ అయ్యారు!" : "PASSED!") 
                        : (language === "te" ? "పాస్ కాలేదు" : "NOT PASSED")}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {quizResult.results.map((r, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${r.is_correct ? "bg-green-50" : "bg-red-50"}`}>
                        <div className="flex items-start gap-2">
                          {r.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center mt-0.5">✗</div>
                          )}
                          <div>
                            <p className="text-sm">
                              {language === "te" ? "మీ సమాధానం:" : "Your answer:"} {r.user_answer || "—"}
                            </p>
                            {!r.is_correct && (
                              <p className="text-sm text-green-600">
                                {language === "te" ? "సరైన సమాధానం:" : "Correct:"} {r.correct_answer}
                              </p>
                            )}
                            {r.explanation && (
                              <p className="text-xs text-muted-foreground mt-1">{r.explanation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={() => { setQuizResult(null); setQuizAnswers({}); }} 
                    variant="outline"
                    className="w-full"
                  >
                    {language === "te" ? "మళ్ళీ ప్రయత్నించు" : "Try Again"}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
