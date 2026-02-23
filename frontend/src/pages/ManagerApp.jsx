import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import ReportsPanel from "../components/ReportsPanel";
import {
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  GraduationCap,
  Heart,
  Image,
  Trash2,
  Send,
  Eye,
  Loader2,
  LogOut,
  RefreshCw,
  Phone,
  User,
  Calendar,
  FileText,
  PenSquare,
  BarChart3,
  Download
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Manager Login Component
function ManagerLogin({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      toast.error("Please enter valid 10-digit phone number");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/send-otp`, { 
        phone: `+91${phone}` 
      });
      if (res.data.success) {
        setOtpSent(true);
        toast.success("OTP sent successfully");
      }
    } catch (err) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/verify-otp`, {
        phone: `+91${phone}`,
        otp: otp
      });
      
      if (res.data.success) {
        // Check if user is a manager
        if (res.data.user?.role === 'manager') {
          onLogin(res.data.user, res.data.access_token);
          toast.success(`Welcome, ${res.data.user.name}!`);
        } else {
          toast.error("Access denied. Manager credentials required.");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Manager Portal</CardTitle>
          <CardDescription>Login to manage your area</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpSent ? (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-muted rounded-l-lg border border-r-0">
                    <span className="text-sm text-muted-foreground">+91</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleSendOtp}
                disabled={loading || phone.length !== 10}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Enter OTP</label>
                <Input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  OTP sent to +91 {phone}
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify & Login
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setOtpSent(false)}
              >
                Change Number
              </Button>
            </>
          )}
          
          {/* Quick Access for Testing */}
          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground mb-2">Quick Access</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setPhone("7386917770");
                toast.info("Manager: 7386917770 | OTP: 123456");
              }}
              disabled={loading}
            >
              <Shield className="w-4 h-4 mr-2" />
              Manager Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Manager Dashboard Component
function ManagerDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingGrievances: 0,
    courseEnrollments: 0,
    wallPosts: 0,
  });
  const [grievances, setGrievances] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [wallPosts, setWallPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [bannerUrl, setBannerUrl] = useState("");
  
  // Dialog states
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  
  // Manager's assigned area
  const managerArea = user?.assigned_area || "dammaiguda";
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      // Fetch stats
      const statsRes = await axios.get(`${API}/manager/stats`, { headers });
      setStats({
        totalMembers: statsRes.data.total_members || 0,
        activeMembers: statsRes.data.active_members || 0,
        pendingGrievances: statsRes.data.pending_grievances || 0,
        courseEnrollments: statsRes.data.course_enrollments || 0,
        wallPosts: statsRes.data.wall_posts || 0,
      });
      
      // Fetch grievances
      const grievancesRes = await axios.get(`${API}/manager/grievances`, { headers });
      setGrievances(grievancesRes.data.grievances || []);
      
      // Fetch enrollments
      const enrollmentsRes = await axios.get(`${API}/manager/enrollments`, { headers });
      setEnrollments(enrollmentsRes.data.enrollments || []);
      
      // Fetch wall posts
      const wallRes = await axios.get(`${API}/manager/wall`, { headers });
      setWallPosts(wallRes.data.posts || []);
      
      // Fetch members
      const membersRes = await axios.get(`${API}/manager/members`, { headers });
      setMembers(membersRes.data.members || []);
      
      // Fetch banner
      const bannerRes = await axios.get(`${API}/manager/banner`, { headers });
      setBannerUrl(bannerRes.data.banner_url || "");
      
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response?.status === 403) {
        toast.error("Access denied. Manager privileges required.");
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGrievanceAction = async (id, action) => {
    try {
      await axios.put(`${API}/manager/grievances/${id}`, { action }, { headers });
      toast.success(`Grievance ${action} successfully`);
      // Refresh data
      fetchData();
    } catch (err) {
      toast.error(`Failed to ${action} grievance`);
    }
  };

  const handlePostToWall = async () => {
    if (!newPost.trim()) {
      toast.error("Please enter message");
      return;
    }
    
    try {
      const res = await axios.post(`${API}/manager/wall`, { content: newPost }, { headers });
      toast.success("Posted to wall successfully");
      setWallPosts(prev => [res.data.post, ...prev]);
      setNewPost("");
      setShowPostDialog(false);
    } catch (err) {
      toast.error("Failed to post");
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await axios.delete(`${API}/manager/wall/${id}`, { headers });
      toast.success("Post deleted");
      setWallPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error("Failed to delete post");
    }
  };

  const handleUpdateBanner = async () => {
    if (!bannerImage.trim()) {
      toast.error("Please enter banner image URL");
      return;
    }
    
    try {
      await axios.put(`${API}/manager/banner`, { banner_url: bannerImage }, { headers });
      toast.success("Banner updated successfully");
      setBannerUrl(bannerImage);
      setShowBannerDialog(false);
      setBannerImage("");
    } catch (err) {
      toast.error("Failed to update banner");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Manager Portal</h1>
                <p className="text-xs text-blue-100 capitalize">{managerArea} Division</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
                onClick={() => setShowBannerDialog(true)}
              >
                <Image className="h-4 w-4 mr-2" />
                Change Banner
              </Button>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-full">
                <User className="h-4 w-4" />
                <span>{user?.name || "Manager"}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Members</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeMembers}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Issues</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingGrievances}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Course Enrollments</p>
                  <p className="text-2xl font-bold">{stats.courseEnrollments}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Wall Posts</p>
                  <p className="text-2xl font-bold">{stats.wallPosts}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-cyan-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border p-1 h-auto">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="grievances" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Grievances
              {stats.pendingGrievances > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {stats.pendingGrievances}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Enrollments
            </TabsTrigger>
            <TabsTrigger value="wall" className="gap-2">
              <PenSquare className="h-4 w-4" />
              Wall
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Download className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Grievances</CardTitle>
                </CardHeader>
                <CardContent>
                  {grievances.slice(0, 3).map((g) => (
                    <div key={g.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{g.title}</p>
                        <p className="text-xs text-muted-foreground">{g.user} • {g.date}</p>
                      </div>
                      <Badge variant={g.status === 'pending' ? 'secondary' : 'default'}>
                        {g.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Enrollments</CardTitle>
                </CardHeader>
                <CardContent>
                  {enrollments.slice(0, 3).map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{e.course}</p>
                        <p className="text-xs text-muted-foreground">{e.user} • {e.date}</p>
                      </div>
                      <Badge variant={e.status === 'active' ? 'default' : 'secondary'}>
                        {e.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Grievances Tab */}
          <TabsContent value="grievances">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manage Grievances</CardTitle>
                <CardDescription>Accept, reject, or resolve citizen issues</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : grievances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No pending grievances!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {grievances.map((grievance) => (
                      <div key={grievance.id} className="py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{grievance.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {grievance.user} • {grievance.date}
                            </p>
                            <Badge variant="outline" className="mt-1">{grievance.category}</Badge>
                          </div>
                          <div className="flex gap-2">
                            {grievance.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleGrievanceAction(grievance.id, 'approved')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleGrievanceAction(grievance.id, 'rejected')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {grievance.status !== 'pending' && (
                              <Badge variant={grievance.status === 'approved' ? 'default' : 'destructive'}>
                                {grievance.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enrollments Tab */}
          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Enrollments</CardTitle>
                <CardDescription>View who enrolled in courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{enrollment.course}</p>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.user} • Enrolled: {enrollment.date}
                        </p>
                      </div>
                      <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                        {enrollment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wall Tab */}
          <TabsContent value="wall">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Division Wall</CardTitle>
                  <CardDescription>Post announcements and view messages</CardDescription>
                </div>
                <Button onClick={() => setShowPostDialog(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Post Message
                </Button>
              </CardHeader>
              <CardContent>
                {wallPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No posts yet</p>
                    <p className="text-sm">Be the first to post an announcement!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wallPosts.map((post) => (
                      <div key={post.id} className="p-4 bg-muted/50 rounded-lg border">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Shield className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{post.author_name || post.author || "Manager"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {post.created_at ? new Date(post.created_at).toLocaleDateString() : post.date}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" /> {post.likes || 0} likes
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" /> {post.comments?.length || 0} comments
                              </span>
                            </div>
                          </div>
                          {(post.author_role === 'manager' || post.author_id === user?.id) && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-600 shrink-0"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registered Members</CardTitle>
                <CardDescription>View members in your division</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {members.map((member) => (
                    <div key={member.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 inline mr-1" />
                            {member.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {member.joined}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportsPanel userRole="manager" />
          </TabsContent>
        </Tabs>
      </main>

      {/* Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post to Wall</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Write your message..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePostToWall}>
              <Send className="h-4 w-4 mr-2" />
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banner Dialog */}
      <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Change Banner Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {bannerUrl && (
              <div>
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Current Banner</label>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img src={bannerUrl} alt="Current banner" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">New Banner Image URL</label>
              <Input
                placeholder="https://example.com/banner.jpg"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended size: 1920x600 pixels. Use high-quality images for best results.
              </p>
            </div>
            {bannerImage && (
              <div>
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Preview</label>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-dashed border-blue-300">
                  <img 
                    src={bannerImage} 
                    alt="Banner preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      toast.error("Invalid image URL");
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBannerDialog(false); setBannerImage(""); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBanner} disabled={!bannerImage.trim()}>
              <Image className="h-4 w-4 mr-2" />
              Update Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main Manager App Component
export default function ManagerApp() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Check for existing session
  useEffect(() => {
    const savedToken = localStorage.getItem('manager_token');
    const savedUser = localStorage.getItem('manager_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('manager_token', accessToken);
    localStorage.setItem('manager_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('manager_token');
    localStorage.removeItem('manager_user');
    toast.success("Logged out successfully");
  };

  if (!user || !token) {
    return <ManagerLogin onLogin={handleLogin} />;
  }

  return <ManagerDashboard user={user} token={token} onLogout={handleLogout} />;
}
