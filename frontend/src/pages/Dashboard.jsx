import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import Layout from "../components/Layout";
import {
  AlertTriangle,
  Activity,
  Heart,
  BarChart3,
  Plus,
  ChevronRight,
  TrendingUp,
  Users,
  MapPin
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [fitnessStats, setFitnessStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [issuesRes, fitnessRes] = await Promise.all([
        axios.get(`${API}/issues?limit=5`),
        axios.get(`${API}/fitness/my-stats?days=7`).catch(() => ({ data: null }))
      ]);
      
      setRecentIssues(issuesRes.data);
      setFitnessStats(fitnessRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: language === "te" ? "సమస్య నివేదించు" : "Report Issue",
      description: language === "te" ? "చెత్త, డ్రైనేజీ మొదలైనవి" : "Garbage, drainage etc.",
      link: "/report",
      color: "bg-secondary text-white"
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: language === "te" ? "కైజర్ ఫిట్" : "Kaizer Fit",
      description: language === "te" ? "ఫిట్‌నెస్ ట్రాక్ చేయండి" : "Track your fitness",
      link: "/fitness",
      color: "bg-primary text-white"
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: language === "te" ? "ప్రయోజనాలు" : "Benefits",
      description: language === "te" ? "ఉచిత ఆరోగ్య సేవలు" : "Free health services",
      link: "/benefits",
      color: "bg-emerald-500 text-white"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: language === "te" ? "డంప్ యార్డ్" : "Dump Yard",
      description: language === "te" ? "కాలుష్య సమాచారం" : "Pollution info",
      link: "/dumpyard",
      color: "bg-red-500 text-white"
    }
  ];

  const categoryLabels = {
    dump_yard: { en: "Dump Yard", te: "డంప్ యార్డ్" },
    garbage: { en: "Garbage", te: "చెత్త" },
    drainage: { en: "Drainage", te: "డ్రైనేజీ" },
    water: { en: "Drinking Water", te: "తాగునీరు" },
    roads: { en: "Roads", te: "రోడ్లు" },
    lights: { en: "Street Lights", te: "వీధి దీపాలు" },
    parks: { en: "Parks", te: "పార్కులు" }
  };

  const statusColors = {
    reported: "bg-orange-100 text-orange-700",
    verified: "bg-blue-100 text-blue-700",
    escalated: "bg-red-100 text-red-700",
    closed: "bg-green-100 text-green-700"
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-white">
          <h1 className="font-heading text-2xl font-bold mb-1">
            {language === "te" ? `స్వాగతం, ${user?.name}!` : `Welcome, ${user?.name}!`}
          </h1>
          <p className="text-white/80">
            {language === "te" 
              ? "మీ వార్డును మెరుగుపరచడంలో సహాయం చేయండి"
              : "Help improve your ward today"}
          </p>
          {user?.colony && (
            <div className="flex items-center gap-2 mt-3 text-white/90">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{user.colony}</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              data-testid={`quick-action-${index}`}
            >
              <Card className="h-full hover:shadow-md transition-shadow border-border/50">
                <CardContent className="p-4">
                  <div className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-text-primary text-sm">
                    {action.title}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Fitness Stats Card */}
        {fitnessStats && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  {language === "te" ? "ఈ వారం ఫిట్‌నెస్" : "This Week's Fitness"}
                </CardTitle>
                <Link to="/fitness">
                  <Button variant="ghost" size="sm" className="text-primary">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {fitnessStats.total_steps?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? "మొత్తం అడుగులు" : "Total Steps"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {fitnessStats.average_score || 0}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? "ఫిట్‌నెస్ స్కోర్" : "Fitness Score"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {fitnessStats.days_logged || 0}
                  </p>
                  <p className="text-xs text-text-muted">
                    {language === "te" ? "రోజులు" : "Days"}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">
                    {language === "te" ? "వారపు లక్ష్యం" : "Weekly Goal"}
                  </span>
                  <span className="font-medium">
                    {Math.min(100, Math.round((fitnessStats.total_steps / 70000) * 100))}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, Math.round((fitnessStats.total_steps / 70000) * 100))} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Issues */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                {language === "te" ? "ఇటీవలి సమస్యలు" : "Recent Issues"}
              </CardTitle>
              <Link to="/issues">
                <Button variant="ghost" size="sm" className="text-primary">
                  {language === "te" ? "అన్నీ చూడండి" : "View All"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentIssues.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{language === "te" ? "సమస్యలు ఇంకా నివేదించబడలేదు" : "No issues reported yet"}</p>
                <Link to="/report">
                  <Button className="mt-4 bg-secondary text-white rounded-full" data-testid="report-first-issue-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "te" ? "మొదటి సమస్య నివేదించు" : "Report First Issue"}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`issue-item-${issue.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[issue.category]?.[language] || issue.category}
                        </Badge>
                        <Badge className={`text-xs ${statusColors[issue.status]}`}>
                          {language === "te" 
                            ? { reported: "నివేదించబడింది", verified: "ధృవీకరించబడింది", escalated: "పెంచబడింది", closed: "మూసివేయబడింది" }[issue.status]
                            : issue.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-primary truncate">
                        {issue.description}
                      </p>
                      {issue.colony && (
                        <p className="text-xs text-text-muted mt-0.5">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {issue.colony}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Issue FAB */}
        <Link to="/report" className="fixed bottom-20 right-4 z-40">
          <Button 
            className="h-14 w-14 rounded-full bg-secondary text-white shadow-lg hover:bg-secondary/90"
            data-testid="fab-report-issue"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
