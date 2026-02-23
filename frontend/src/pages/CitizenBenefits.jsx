import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Heart,
  GraduationCap,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  FileText,
  Gift,
  Sparkles
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CitizenBenefits() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyApplications();
  }, [token]);

  const fetchMyApplications = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API}/benefits/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyApplications(response.data?.applications || response.data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setMyApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-orange-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-orange-100 text-orange-700";
    }
  };

  const statusLabels = {
    pending: { en: "Pending", te: "పెండింగ్" },
    approved: { en: "Approved", te: "ఆమోదించబడింది" },
    rejected: { en: "Rejected", te: "తిరస్కరించబడింది" }
  };

  const benefitLabels = {
    accidental_insurance: { en: "Accidental Insurance", te: "ప్రమాద బీమా" },
    health_insurance: { en: "Health Insurance", te: "ఆరోగ్య బీమా" },
    education_voucher: { en: "Education Voucher", te: "విద్యా వౌచర్" },
    health_checkup: { en: "Health Checkup", te: "ఆరోగ్య పరీక్ష" },
    insurance: { en: "Insurance", te: "బీమా" }
  };

  return (
    <Layout showBackButton title={language === "te" ? "పౌర ప్రయోజనాలు" : "Citizen Benefits"}>
      <div className="space-y-6 pb-20" data-testid="citizen-benefits">
        {/* Special Benefits Card */}
        <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl">
                  {language === "te" ? "ప్రత్యేక ప్రయోజనాలు" : "Special Benefits"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "te" 
                    ? "రోహన్ కులకర్ణి మరియు భాగస్వాములు అందించారు" 
                    : "Provided by Rohan Kulkarni & Partners"}
                </p>
              </div>
            </div>

            {/* 3 Benefits List */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg" data-testid="benefit-accidental-insurance">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">{language === "te" ? "ఉచిత ప్రమాద బీమా" : "Free Accidental Insurance"}</p>
                  <p className="text-xs text-muted-foreground">{language === "te" ? "₹2 లక్షల కవరేజ్" : "₹2 Lakhs coverage"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg" data-testid="benefit-health-insurance">
                <Heart className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-sm">{language === "te" ? "25% ఆరోగ్య బీమా" : "Health Insurance 25% off"}</p>
                  <p className="text-xs text-muted-foreground">{language === "te" ? "ప్రీమియం రీయింబర్స్‌మెంట్" : "Premium reimbursement"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg" data-testid="benefit-education-voucher">
                <GraduationCap className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="font-medium text-sm">{language === "te" ? "విద్యా వౌచర్లు" : "Education Vouchers"}</p>
                  <p className="text-xs text-muted-foreground">{language === "te" ? "₹54,999 విలువ" : "Worth ₹54,999"}</p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground mb-4">
              {language === "te" 
                ? "దరఖాస్తు చేయడం ఆమోదానికి హామీ ఇవ్వదు. అన్ని దరఖాస్తులు ధృవీకరణ మరియు T&C కి లోబడి ఉంటాయి."
                : "Applying does not guarantee approval. All applications are subject to verification and T&C."}
            </p>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
              onClick={() => navigate('/claim-benefits')}
              data-testid="apply-now-btn"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {language === "te" ? "ఇప్పుడే దరఖాస్తు చేయండి" : "Apply Now"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* My Applications Section */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {language === "te" ? "నా దరఖాస్తులు" : "My Applications"}
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : myApplications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {language === "te" ? "దరఖాస్తులు ఇంకా లేవు" : "No applications yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "te" ? "పై ప్రయోజనాల కోసం దరఖాస్తు చేయండి" : "Apply for the benefits above to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            myApplications.map((app) => (
              <Card key={app.id} className="border-border/50" data-testid={`application-${app.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        {benefitLabels[app.benefit_type]?.[language] || benefitLabels[app.type]?.[language] || app.benefit_type || app.type}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(app.created_at).toLocaleDateString(language === "te" ? "te-IN" : "en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(app.status)}
                      <Badge className={getStatusColor(app.status)}>
                        {statusLabels[app.status]?.[language] || app.status}
                      </Badge>
                    </div>
                  </div>
                  {app.notes && (
                    <p className="text-sm text-muted-foreground mt-3 p-2 bg-muted/50 rounded">
                      {app.notes}
                    </p>
                  )}
                  {app.voucher_code && (
                    <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
                      <p className="text-xs text-muted-foreground">Voucher Code:</p>
                      <code className="text-sm font-mono font-bold text-purple-600">{app.voucher_code}</code>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
