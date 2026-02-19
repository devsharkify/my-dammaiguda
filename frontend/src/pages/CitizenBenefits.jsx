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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
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
  Info,
  Ticket,
  Copy,
  Share2,
  Tag,
  Loader2,
  Percent,
  Gift,
  ShoppingBag,
  Utensils,
  Sparkles
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CitizenBenefits() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
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
  
  // Vouchers state
  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [claimingVoucher, setClaimingVoucher] = useState(false);

  useEffect(() => {
    fetchMyApplications();
    fetchVouchers();
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

  const fetchVouchers = async () => {
    setVouchersLoading(true);
    try {
      const response = await axios.get(`${API}/vouchers`);
      setVouchers(response.data?.vouchers || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    } finally {
      setVouchersLoading(false);
    }
  };

  const openVoucherDetails = async (voucher) => {
    try {
      const response = await axios.get(`${API}/vouchers/${voucher.id}`);
      setSelectedVoucher(response.data);
      setShowVoucherDialog(true);
    } catch (error) {
      toast.error("Failed to load voucher details");
    }
  };

  const claimVoucher = async () => {
    if (!token) {
      toast.error(language === "te" ? "దయచేసి లాగిన్ అవ్వండి" : "Please login first");
      return;
    }
    
    setClaimingVoucher(true);
    try {
      const response = await axios.post(
        `${API}/vouchers/${selectedVoucher.id}/claim`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(language === "te" ? "వౌచర్ క్లెయిమ్ చేయబడింది!" : "Voucher claimed!");
      setSelectedVoucher(response.data.voucher);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to claim voucher");
    } finally {
      setClaimingVoucher(false);
    }
  };

  const copyVoucherCode = () => {
    if (selectedVoucher?.code) {
      navigator.clipboard.writeText(selectedVoucher.code);
      toast.success(language === "te" ? "కోడ్ కాపీ అయింది!" : "Code copied!");
    }
  };

  const shareVoucher = () => {
    const text = `${selectedVoucher.title} - Use code: ${selectedVoucher.code} at ${selectedVoucher.partner_name}. Get ${selectedVoucher.discount_type === 'percentage' ? selectedVoucher.discount_value + '%' : '₹' + selectedVoucher.discount_value} off!`;
    
    if (navigator.share) {
      navigator.share({
        title: selectedVoucher.title,
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success(language === "te" ? "షేర్ టెక్స్ట్ కాపీ అయింది!" : "Share text copied!");
    }
  };

  const getVoucherCategoryIcon = (category) => {
    switch (category) {
      case "food": return <Utensils className="h-5 w-5" />;
      case "shopping": return <ShoppingBag className="h-5 w-5" />;
      case "health": return <Heart className="h-5 w-5" />;
      case "education": return <GraduationCap className="h-5 w-5" />;
      case "entertainment": return <Sparkles className="h-5 w-5" />;
      default: return <Tag className="h-5 w-5" />;
    }
  };

  const getVoucherCategoryColor = (category) => {
    switch (category) {
      case "food": return "bg-orange-100 text-orange-600";
      case "shopping": return "bg-pink-100 text-pink-600";
      case "health": return "bg-red-100 text-red-600";
      case "education": return "bg-blue-100 text-blue-600";
      case "entertainment": return "bg-purple-100 text-purple-600";
      default: return "bg-gray-100 text-gray-600";
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
      <div className="space-y-6 pb-20" data-testid="citizen-benefits">
        <Tabs defaultValue="vouchers" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="vouchers" className="text-xs">
              <Ticket className="h-3.5 w-3.5 mr-1" />
              {language === "te" ? "వౌచర్లు" : "Vouchers"}
            </TabsTrigger>
            <TabsTrigger value="benefits" className="text-xs">
              <Heart className="h-3.5 w-3.5 mr-1" />
              {language === "te" ? "ప్రయోజనాలు" : "Benefits"}
            </TabsTrigger>
            <TabsTrigger value="applications" className="text-xs">
              <FileText className="h-3.5 w-3.5 mr-1" />
              {language === "te" ? "దరఖాస్తులు" : "Applications"}
            </TabsTrigger>
          </TabsList>

          {/* Vouchers Tab */}
          <TabsContent value="vouchers" className="mt-4 space-y-4">
            {vouchersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : vouchers.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {language === "te" ? "వౌచర్లు అందుబాటులో లేవు" : "No vouchers available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {vouchers.map((voucher) => (
                  <Card 
                    key={voucher.id} 
                    className="border-border/50 cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                    onClick={() => openVoucherDetails(voucher)}
                    data-testid={`voucher-${voucher.id}`}
                  >
                    <div className="flex">
                      {/* Left side - discount badge */}
                      <div className={`w-24 ${getVoucherCategoryColor(voucher.category)} flex flex-col items-center justify-center p-3`}>
                        {getVoucherCategoryIcon(voucher.category)}
                        <div className="mt-2 text-center">
                          <p className="text-2xl font-bold">
                            {voucher.discount_type === "percentage" ? voucher.discount_value : voucher.discount_value}
                          </p>
                          <p className="text-xs font-medium">
                            {voucher.discount_type === "percentage" ? "% OFF" : "₹ OFF"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Right side - details */}
                      <CardContent className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-sm line-clamp-1">
                              {language === "te" && voucher.title_te ? voucher.title_te : voucher.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{voucher.partner_name}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {voucher.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {language === "te" && voucher.description_te ? voucher.description_te : voucher.description}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-muted-foreground">
                            {voucher.valid_until ? `${language === "te" ? "వరకు:" : "Valid till:"} ${new Date(voucher.valid_until).toLocaleDateString()}` : (language === "te" ? "పరిమిత సమయం" : "Limited time")}
                          </span>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            {language === "te" ? "కోడ్ చూడండి" : "View Code"}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

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

        {/* Voucher Details Dialog */}
        <Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
          <DialogContent className="max-w-md">
            {selectedVoucher && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className={`h-10 w-10 rounded-lg ${getVoucherCategoryColor(selectedVoucher.category)} flex items-center justify-center`}>
                      {getVoucherCategoryIcon(selectedVoucher.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {language === "te" && selectedVoucher.title_te ? selectedVoucher.title_te : selectedVoucher.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-normal">{selectedVoucher.partner_name}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  {/* Discount Display */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 text-center">
                    <p className="text-4xl font-bold text-primary">
                      {selectedVoucher.discount_type === "percentage" 
                        ? `${selectedVoucher.discount_value}%` 
                        : `₹${selectedVoucher.discount_value}`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedVoucher.discount_type === "percentage" ? "Discount" : "Flat Off"}
                    </p>
                  </div>

                  {/* Voucher Code */}
                  <div className="bg-muted rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-2 text-center">
                      {language === "te" ? "వౌచర్ కోడ్" : "Voucher Code"}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg border-2 border-dashed border-primary">
                        <p className="text-xl font-mono font-bold tracking-widest text-primary">
                          {selectedVoucher.code}
                        </p>
                      </div>
                      <Button size="icon" variant="outline" onClick={copyVoucherCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground">
                    {language === "te" && selectedVoucher.description_te ? selectedVoucher.description_te : selectedVoucher.description}
                  </p>

                  {/* Terms & Conditions */}
                  {selectedVoucher.terms_conditions && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium mb-1">{language === "te" ? "నిబంధనలు:" : "Terms & Conditions:"}</p>
                      <p>{selectedVoucher.terms_conditions}</p>
                    </div>
                  )}

                  {/* Validity */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {selectedVoucher.min_order_value && (
                      <span>Min order: ₹{selectedVoucher.min_order_value}</span>
                    )}
                    {selectedVoucher.valid_until && (
                      <span>Valid till: {new Date(selectedVoucher.valid_until).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <DialogFooter className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1" onClick={shareVoucher}>
                    <Share2 className="h-4 w-4 mr-2" />
                    {language === "te" ? "షేర్" : "Share"}
                  </Button>
                  <Button className="flex-1" onClick={claimVoucher} disabled={claimingVoucher}>
                    {claimingVoucher ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Gift className="h-4 w-4 mr-2" />
                    )}
                    {language === "te" ? "క్లెయిమ్" : "Claim"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
