import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Heart,
  GraduationCap,
  Shield,
  Stethoscope,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  FileText,
  Info
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CitizenBenefits() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicant_name: "",
    phone: "",
    age: "",
    address: ""
  });

  useEffect(() => {
    fetchMyApplications();
    if (user) {
      setFormData({
        applicant_name: user.name || "",
        phone: user.phone || "",
        age: "",
        address: ""
      });
    }
  }, [user]);

  const fetchMyApplications = async () => {
    try {
      const response = await axios.get(`${API}/benefits/my-applications`);
      setMyApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      type: "health_checkup",
      icon: <Stethoscope className="h-7 w-7" />,
      title: { en: "Free Health Checkup", te: "ఉచిత ఆరోగ్య పరీక్ష" },
      description: { 
        en: "Free comprehensive health checkup at partner hospitals and health camps",
        te: "భాగస్వామ్య ఆసుపత్రులు మరియు ఆరోగ్య శిబిరాల్లో ఉచిత సమగ్ర ఆరోగ్య పరీక్ష"
      },
      eligibility: {
        en: ["Dammaiguda resident", "Valid Aadhaar card", "Age 18+"],
        te: ["దమ్మాయిగూడ నివాసి", "చెల్లుబాటు అయ్యే ఆధార్ కార్డు", "వయస్సు 18+"]
      },
      color: "bg-red-100 text-red-600"
    },
    {
      type: "education_voucher",
      icon: <GraduationCap className="h-7 w-7" />,
      title: { en: "Education Voucher", te: "విద్యా వౌచర్" },
      description: { 
        en: "₹50,000 learning voucher in partnership with Emeritus for online courses",
        te: "ఆన్‌లైన్ కోర్సుల కోసం Emeritus భాగస్వామ్యంతో ₹50,000 లెర్నింగ్ వౌచర్"
      },
      eligibility: {
        en: ["Dammaiguda resident", "Age 18-45", "Valid ID proof"],
        te: ["దమ్మాయిగూడ నివాసి", "వయస్సు 18-45", "చెల్లుబాటు అయ్యే ID రుజువు"]
      },
      color: "bg-blue-100 text-blue-600"
    },
    {
      type: "insurance",
      icon: <Shield className="h-7 w-7" />,
      title: { en: "Accidental Insurance", te: "ప్రమాద బీమా" },
      description: { 
        en: "Free basic accidental insurance coverage for eligible citizens",
        te: "అర్హత గల పౌరులకు ఉచిత ప్రాథమిక ప్రమాద బీమా కవరేజ్"
      },
      eligibility: {
        en: ["Dammaiguda resident", "Age 18-65", "Valid Aadhaar"],
        te: ["దమ్మాయిగూడ నివాసి", "వయస్సు 18-65", "చెల్లుబాటు అయ్యే ఆధార్"]
      },
      color: "bg-green-100 text-green-600"
    },
    {
      type: "health_insurance",
      icon: <Heart className="h-7 w-7" />,
      title: { en: "Health Insurance Support", te: "ఆరోగ్య బీమా సహాయం" },
      description: { 
        en: "25% reimbursement/cashback support on health insurance premiums",
        te: "ఆరోగ్య బీమా ప్రీమియంలపై 25% రీయింబర్స్‌మెంట్/క్యాష్‌బ్యాక్ సహాయం"
      },
      eligibility: {
        en: ["Dammaiguda resident", "Existing health insurance", "Income < ₹5 LPA"],
        te: ["దమ్మాయిగూడ నివాసి", "ఇప్పటికే ఉన్న ఆరోగ్య బీమా", "ఆదాయం < ₹5 LPA"]
      },
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const handleApply = async () => {
    if (!formData.applicant_name || !formData.phone) {
      toast.error(language === "te" ? "పేరు మరియు ఫోన్ అవసరం" : "Name and phone required");
      return;
    }

    setApplyLoading(true);
    try {
      await axios.post(`${API}/benefits/apply`, {
        benefit_type: selectedBenefit.type,
        applicant_name: formData.applicant_name,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : null,
        address: formData.address || null
      });
      
      toast.success(language === "te" ? "దరఖాస్తు సమర్పించబడింది!" : "Application submitted!");
      setSelectedBenefit(null);
      fetchMyApplications();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit application");
    } finally {
      setApplyLoading(false);
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
    health_checkup: { en: "Health Checkup", te: "ఆరోగ్య పరీక్ష" },
    education_voucher: { en: "Education Voucher", te: "విద్యా వౌచర్" },
    insurance: { en: "Accidental Insurance", te: "ప్రమాద బీమా" },
    health_insurance: { en: "Health Insurance", te: "ఆరోగ్య బీమా" }
  };

  return (
    <Layout showBackButton title={language === "te" ? "పౌర ప్రయోజనాలు" : "Citizen Benefits"}>
      <div className="space-y-6" data-testid="citizen-benefits">
        <Tabs defaultValue="benefits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="benefits" className="text-sm">
              {language === "te" ? "ప్రయోజనాలు" : "Benefits"}
            </TabsTrigger>
            <TabsTrigger value="applications" className="text-sm">
              {language === "te" ? "నా దరఖాస్తులు" : "My Applications"}
            </TabsTrigger>
          </TabsList>

          {/* Benefits Tab */}
          <TabsContent value="benefits" className="mt-4 space-y-4">
            {benefits.map((benefit) => (
              <Card key={benefit.type} className="border-border/50" data-testid={`benefit-${benefit.type}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-14 w-14 rounded-xl ${benefit.color} flex items-center justify-center flex-shrink-0`}>
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary">
                        {benefit.title[language]}
                      </h3>
                      <p className="text-sm text-text-muted mt-1">
                        {benefit.description[language]}
                      </p>
                    </div>
                  </div>

                  {/* Eligibility */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-text-secondary mb-2">
                      {language === "te" ? "అర్హత:" : "Eligibility:"}
                    </p>
                    <ul className="space-y-1">
                      {benefit.eligibility[language].map((item, idx) => (
                        <li key={idx} className="text-xs text-text-muted flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full mt-4 bg-primary text-white rounded-full"
                        onClick={() => setSelectedBenefit(benefit)}
                        data-testid={`apply-${benefit.type}`}
                      >
                        {language === "te" ? "దరఖాస్తు చేయండి" : "Apply Now"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {language === "te" ? "దరఖాస్తు" : "Application"} - {benefit.title[language]}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>{language === "te" ? "పేరు" : "Name"} *</Label>
                          <Input
                            value={formData.applicant_name}
                            onChange={(e) => setFormData({...formData, applicant_name: e.target.value})}
                            className="h-12"
                            data-testid="apply-name-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === "te" ? "ఫోన్" : "Phone"} *</Label>
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="h-12"
                            data-testid="apply-phone-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === "te" ? "వయస్సు" : "Age"}</Label>
                          <Input
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({...formData, age: e.target.value})}
                            className="h-12"
                            data-testid="apply-age-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === "te" ? "చిరునామా" : "Address"}</Label>
                          <Input
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="h-12"
                            data-testid="apply-address-input"
                          />
                        </div>
                        <Button
                          onClick={handleApply}
                          disabled={applyLoading}
                          className="w-full h-12 bg-primary text-white rounded-full"
                          data-testid="submit-application-btn"
                        >
                          {applyLoading 
                            ? (language === "te" ? "సమర్పిస్తోంది..." : "Submitting...")
                            : (language === "te" ? "సమర్పించు" : "Submit")}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}

            {/* Disclaimer */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  {language === "te"
                    ? "అన్ని ప్రయోజనాలు అర్హత ధృవీకరణకు లోబడి ఉంటాయి. నిబంధనలు వర్తిస్తాయి."
                    : "All benefits are subject to eligibility verification. Terms and conditions apply."}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value="applications" className="mt-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : myApplications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-text-muted">
                  {language === "te" ? "దరఖాస్తులు ఇంకా లేవు" : "No applications yet"}
                </p>
              </div>
            ) : (
              myApplications.map((app) => (
                <Card key={app.id} className="border-border/50" data-testid={`application-${app.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary">
                          {benefitLabels[app.benefit_type]?.[language] || app.benefit_type}
                        </h3>
                        <p className="text-sm text-text-muted mt-1">
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
                      <p className="text-sm text-text-secondary mt-3 p-2 bg-muted/50 rounded">
                        {app.notes}
                      </p>
                    )}
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
