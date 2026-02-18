import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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
  Shield
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, heatmapRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/issues-heatmap`),
        axios.get(`${API}/admin/users`)
      ]);
      setStats(statsRes.data);
      setHeatmap(heatmapRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
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
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="issues" className="text-sm">
              {language === "te" ? "సమస్యలు" : "Issues"}
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="text-sm">
              {language === "te" ? "హీట్‌మ్యాప్" : "Heatmap"}
            </TabsTrigger>
            <TabsTrigger value="users" className="text-sm">
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
    </Layout>
  );
}
