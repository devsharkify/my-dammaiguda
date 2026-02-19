import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import Layout from "../components/Layout";
import {
  AlertTriangle,
  Filter,
  MapPin,
  Clock,
  Plus,
  Image as ImageIcon,
  ChevronDown,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock3,
  Send,
  Phone
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function IssueFeed() {
  const { language } = useLanguage();
  const { user, token, isAdmin } = useAuth();
  const [issues, setIssues] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchIssues();
    if (user) fetchMyIssues();
  }, [categoryFilter, statusFilter, user]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      let url = `${API}/issues?limit=50`;
      if (categoryFilter !== "all") url += `&category=${categoryFilter}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      
      const response = await axios.get(url);
      setIssues(response.data?.issues || []);
    } catch (error) {
      console.error("Error fetching issues:", error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyIssues = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/issues/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyIssues(response.data?.issues || response.data || []);
    } catch (error) {
      console.error("Error fetching my issues:", error);
      setMyIssues([]);
    }
  };

  const categories = [
    { value: "all", label: language === "te" ? "అన్నీ" : "All" },
    { value: "dump_yard", label: language === "te" ? "డంప్ యార్డ్" : "Dump Yard" },
    { value: "garbage", label: language === "te" ? "చెత్త" : "Garbage" },
    { value: "drainage", label: language === "te" ? "డ్రైనేజీ" : "Drainage" },
    { value: "water", label: language === "te" ? "తాగునీరు" : "Drinking Water" },
    { value: "roads", label: language === "te" ? "రోడ్లు" : "Roads" },
    { value: "lights", label: language === "te" ? "వీధి దీపాలు" : "Street Lights" },
    { value: "parks", label: language === "te" ? "పార్కులు" : "Parks" }
  ];

  const statuses = [
    { value: "all", label: language === "te" ? "అన్నీ" : "All" },
    { value: "reported", label: language === "te" ? "నివేదించబడింది" : "Reported" },
    { value: "verified", label: language === "te" ? "ధృవీకరించబడింది" : "Verified" },
    { value: "escalated", label: language === "te" ? "పెంచబడింది" : "Escalated" },
    { value: "closed", label: language === "te" ? "మూసివేయబడింది" : "Closed" }
  ];

  const categoryLabels = {
    dump_yard: { en: "Dump Yard", te: "డంప్ యార్డ్", icon: "🏭" },
    garbage: { en: "Garbage", te: "చెత్త", icon: "🗑️" },
    drainage: { en: "Drainage", te: "డ్రైనేజీ", icon: "🚿" },
    water: { en: "Drinking Water", te: "తాగునీరు", icon: "💧" },
    roads: { en: "Roads", te: "రోడ్లు", icon: "🛣️" },
    lights: { en: "Street Lights", te: "వీధి దీపాలు", icon: "💡" },
    parks: { en: "Parks", te: "పార్కులు", icon: "🌳" }
  };

  const statusColors = {
    reported: "bg-orange-100 text-orange-700 border-orange-200",
    verified: "bg-blue-100 text-blue-700 border-blue-200",
    escalated: "bg-red-100 text-red-700 border-red-200",
    closed: "bg-green-100 text-green-700 border-green-200"
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return language === "te" ? "ఈ రోజు" : "Today";
    if (days === 1) return language === "te" ? "నిన్న" : "Yesterday";
    if (days < 7) return language === "te" ? `${days} రోజుల క్రితం` : `${days} days ago`;
    return date.toLocaleDateString(language === "te" ? "te-IN" : "en-IN");
  };

  return (
    <Layout showBackButton title={language === "te" ? "సమస్యలు" : "Issues"}>
      <div className="space-y-4" data-testid="issue-feed">
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="flex-1 h-10" data-testid="category-filter">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 h-10" data-testid="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-text-muted mb-4">
              {language === "te" ? "సమస్యలు కనుగొనబడలేదు" : "No issues found"}
            </p>
            {user && (
              <Link to="/report">
                <Button className="bg-secondary text-white rounded-full" data-testid="report-issue-cta">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "te" ? "సమస్య నివేదించు" : "Report Issue"}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <Card 
                key={issue.id} 
                className="border-border/50 hover:shadow-md transition-shadow"
                data-testid={`issue-card-${issue.id}`}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {categoryLabels[issue.category]?.icon}
                      </span>
                      <Badge variant="secondary" className="font-medium">
                        {categoryLabels[issue.category]?.[language] || issue.category}
                      </Badge>
                    </div>
                    <Badge className={`text-xs ${statusColors[issue.status]}`}>
                      {statuses.find(s => s.value === issue.status)?.label || issue.status}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-text-primary mb-3 line-clamp-2">
                    {issue.description}
                  </p>

                  {/* Media Preview */}
                  {issue.media_urls && issue.media_urls.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {issue.media_urls.slice(0, 3).map((url, idx) => (
                        <div
                          key={idx}
                          className="h-16 w-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden"
                        >
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="h-full w-full flex items-center justify-center"><svg class="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                            }}
                          />
                        </div>
                      ))}
                      {issue.media_urls.length > 3 && (
                        <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-text-muted text-sm font-medium">
                          +{issue.media_urls.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-3">
                      {issue.colony && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {issue.colony}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(issue.created_at)}
                      </span>
                    </div>
                    <span className="text-text-secondary">
                      {issue.reporter_name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Report Issue FAB */}
        {user && (
          <Link to="/report" className="fixed bottom-20 right-4 z-40">
            <Button 
              className="h-14 w-14 rounded-full bg-secondary text-white shadow-lg hover:bg-secondary/90"
              data-testid="fab-report-issue"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        )}
      </div>
    </Layout>
  );
}
