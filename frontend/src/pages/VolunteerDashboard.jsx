import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  CheckCircle,
  Clock,
  MapPin,
  Image as ImageIcon,
  AlertTriangle,
  TrendingUp,
  FileCheck
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VolunteerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [myVerifications, setMyVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [queueRes, myRes] = await Promise.all([
        axios.get(`${API}/volunteer/queue`),
        axios.get(`${API}/volunteer/my-verifications`)
      ]);
      setQueue(queueRes.data);
      setMyVerifications(myRes.data);
    } catch (error) {
      console.error("Error fetching volunteer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (issueId) => {
    setVerifying(issueId);
    try {
      await axios.put(`${API}/issues/${issueId}/verify`);
      toast.success(language === "te" ? "సమస్య ధృవీకరించబడింది!" : "Issue verified!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Verification failed");
    } finally {
      setVerifying(null);
    }
  };

  const categoryLabels = {
    dump_yard: { en: "Dump Yard", te: "డంప్ యార్డ్" },
    garbage: { en: "Garbage", te: "చెత్త" },
    drainage: { en: "Drainage", te: "డ్రైనేజీ" },
    water: { en: "Drinking Water", te: "తాగునీరు" },
    roads: { en: "Roads", te: "రోడ్లు" },
    lights: { en: "Street Lights", te: "వీధి దీపాలు" },
    parks: { en: "Parks", te: "పార్కులు" }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(language === "te" ? "te-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "వలంటీర్ డాష్‌బోర్డ్" : "Volunteer Dashboard"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "వలంటీర్ డాష్‌బోర్డ్" : "Volunteer Dashboard"}>
      <div className="space-y-6" data-testid="volunteer-dashboard">
        {/* Stats Header */}
        <Card className="bg-gradient-to-br from-primary to-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
                <FileCheck className="h-7 w-7" />
              </div>
              <div>
                <p className="text-white/80 text-sm">
                  {language === "te" ? "మీ ధృవీకరణలు" : "Your Verifications"}
                </p>
                <p className="text-3xl font-bold">{myVerifications.length}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-white/70 text-xs">
                  {language === "te" ? "పెండింగ్" : "Pending"}
                </p>
                <p className="text-xl font-bold mt-1">{queue.length}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-white/70 text-xs">
                  {language === "te" ? "ఈ నెల" : "This Month"}
                </p>
                <p className="text-xl font-bold mt-1">
                  {myVerifications.filter(v => {
                    const date = new Date(v.verified_at);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="queue" className="text-sm">
              {language === "te" ? "ధృవీకరణ క్యూ" : "Verification Queue"}
              {queue.length > 0 && (
                <Badge className="ml-2 bg-teal-500 text-white">{queue.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm">
              {language === "te" ? "చరిత్ర" : "History"}
            </TabsTrigger>
          </TabsList>

          {/* Queue Tab */}
          <TabsContent value="queue" className="mt-4 space-y-3">
            {queue.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500/50" />
                <p className="text-text-muted">
                  {language === "te" ? "ధృవీకరణ కోసం సమస్యలు లేవు" : "No issues pending verification"}
                </p>
              </div>
            ) : (
              queue.map((issue) => (
                <Card key={issue.id} className="border-border/50" data-testid={`queue-issue-${issue.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {categoryLabels[issue.category]?.[language] || issue.category}
                        </Badge>
                        <Badge className="bg-orange-100 text-orange-700">
                          <Clock className="h-3 w-3 mr-1" />
                          {language === "te" ? "పెండింగ్" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-text-primary mb-3">{issue.description}</p>
                    
                    {issue.media_urls && issue.media_urls.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {issue.media_urls.slice(0, 3).map((url, idx) => (
                          <div key={idx} className="h-16 w-16 rounded-lg bg-muted overflow-hidden">
                            <img src={url} alt="" className="h-full w-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-text-muted mb-4">
                      {issue.colony && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {issue.colony}
                        </span>
                      )}
                      <span>{formatDate(issue.created_at)}</span>
                    </div>
                    
                    <Button
                      onClick={() => handleVerify(issue.id)}
                      disabled={verifying === issue.id}
                      className="w-full bg-primary text-white rounded-full"
                      data-testid={`verify-btn-${issue.id}`}
                    >
                      {verifying === issue.id ? (
                        <span className="animate-spin mr-2">⏳</span>
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {language === "te" ? "ధృవీకరించు" : "Verify Issue"}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4 space-y-3">
            {myVerifications.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-text-muted">
                  {language === "te" ? "ధృవీకరణలు ఇంకా లేవు" : "No verifications yet"}
                </p>
              </div>
            ) : (
              myVerifications.map((issue) => (
                <Card key={issue.id} className="border-border/50" data-testid={`verified-issue-${issue.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">
                        {categoryLabels[issue.category]?.[language] || issue.category}
                      </Badge>
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {language === "te" ? "ధృవీకరించబడింది" : "Verified"}
                      </Badge>
                    </div>
                    <p className="text-text-primary text-sm line-clamp-2">{issue.description}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
                      {issue.colony && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {issue.colony}
                        </span>
                      )}
                      <span>{formatDate(issue.verified_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
