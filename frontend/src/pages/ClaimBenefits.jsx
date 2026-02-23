import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import {
  Shield,
  Heart,
  GraduationCap,
  ChevronLeft,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertTriangle,
  FileText,
  Users,
  IndianRupee
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Dropdown options
const GENDER_OPTIONS = ["Male", "Female", "Other"];
const RELATION_OPTIONS = ["Father's Name", "Husband's Name"];
const OCCUPATION_OPTIONS = ["Student", "Private Job", "Housewife", "Business", "Self-employed"];
const MONTHLY_EARNING_OPTIONS = [
  "Below ₹10,000",
  "₹10,000 - ₹25,000",
  "₹25,000 - ₹50,000",
  "₹50,000 - ₹1,00,000",
  "Above ₹1,00,000"
];
const EDUCATION_OPTIONS = ["10th", "12th", "Undergraduate", "Graduate", "Post Graduate"];
const FAMILY_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Empty member template
const EMPTY_MEMBER = {
  name: "",
  gender: "",
  relation: "",
  relation_name: "",
  dob: "",
  aadhar_number: "",
  voter_id: "",
  whatsapp_number: "",
  address: "",
  occupation: "",
  monthly_earning: ""
};

export default function ClaimBenefits() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [showModal, setShowModal] = useState(null); // 'accidental', 'health', 'education'
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [voucherCode, setVoucherCode] = useState(null);
  
  // Accidental Insurance Form
  const [primaryApplicant, setPrimaryApplicant] = useState({ ...EMPTY_MEMBER });
  const [familyMembers, setFamilyMembers] = useState([]);
  
  // Health Insurance Form
  const [healthForm, setHealthForm] = useState({
    name: "",
    mobile_number: "",
    family_count: 1
  });
  
  // Education Voucher Form
  const [educationForm, setEducationForm] = useState({
    name: "",
    education: "",
    occupation: "",
    dob: "",
    aadhar_number: "",
    voter_id: "",
    address: ""
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) {
      fetchMyApplications();
    }
  }, [token]);

  const fetchMyApplications = async () => {
    try {
      const res = await axios.get(`${API}/benefits/my-applications`, { headers });
      setMyApplications(res.data.applications || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  // Calculate age from DOB
  const calculateAge = (dobStr) => {
    if (!dobStr) return 0;
    const dob = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Add family member
  const addFamilyMember = () => {
    if (familyMembers.length >= 4) {
      toast.error("Maximum 4 additional family members allowed");
      return;
    }
    setFamilyMembers([...familyMembers, { ...EMPTY_MEMBER }]);
  };

  // Remove family member
  const removeFamilyMember = (index) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  // Update family member
  const updateFamilyMember = (index, field, value) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  // Submit Accidental Insurance
  const submitAccidentalInsurance = async () => {
    if (!termsAccepted) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }
    
    // Validate primary applicant
    const requiredFields = ['name', 'gender', 'relation', 'relation_name', 'dob', 'aadhar_number', 'voter_id', 'whatsapp_number', 'address', 'occupation', 'monthly_earning'];
    for (const field of requiredFields) {
      if (!primaryApplicant[field]) {
        toast.error(`Please fill ${field.replace(/_/g, ' ')} for primary applicant`);
        return;
      }
    }
    
    // Validate age
    if (calculateAge(primaryApplicant.dob) < 18) {
      toast.error("Primary applicant must be at least 18 years old");
      return;
    }
    
    // Validate family members
    for (let i = 0; i < familyMembers.length; i++) {
      for (const field of requiredFields) {
        if (!familyMembers[i][field]) {
          toast.error(`Please fill ${field.replace(/_/g, ' ')} for family member ${i + 1}`);
          return;
        }
      }
      if (calculateAge(familyMembers[i].dob) < 18) {
        toast.error(`Family member ${i + 1} must be at least 18 years old`);
        return;
      }
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/benefits/accidental-insurance`, {
        primary_applicant: primaryApplicant,
        family_members: familyMembers,
        terms_accepted: true
      }, { headers });
      
      toast.success(res.data.message);
      setShowModal(null);
      resetForms();
      fetchMyApplications();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  // Submit Health Insurance
  const submitHealthInsurance = async () => {
    if (!termsAccepted) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }
    
    if (!healthForm.name || !healthForm.mobile_number) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/benefits/health-insurance`, {
        ...healthForm,
        terms_accepted: true
      }, { headers });
      
      toast.success(res.data.message);
      setShowModal(null);
      resetForms();
      fetchMyApplications();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  // Submit Education Voucher
  const submitEducationVoucher = async () => {
    if (!termsAccepted) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }
    
    const requiredFields = ['name', 'education', 'occupation', 'dob', 'aadhar_number', 'address'];
    for (const field of requiredFields) {
      if (!educationForm[field]) {
        toast.error(`Please fill ${field.replace(/_/g, ' ')}`);
        return;
      }
    }
    
    // Voter ID required if 18+
    const age = calculateAge(educationForm.dob);
    if (age >= 18 && !educationForm.voter_id) {
      toast.error("Voter ID is required for applicants 18 years and above");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/benefits/education-voucher`, {
        ...educationForm,
        terms_accepted: true
      }, { headers });
      
      setVoucherCode(res.data.voucher_code);
      toast.success("Voucher generated successfully!");
      fetchMyApplications();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate voucher");
    } finally {
      setLoading(false);
    }
  };

  // Reset forms
  const resetForms = () => {
    setPrimaryApplicant({ ...EMPTY_MEMBER });
    setFamilyMembers([]);
    setHealthForm({ name: "", mobile_number: "", family_count: 1 });
    setEducationForm({ name: "", education: "", occupation: "", dob: "", aadhar_number: "", voter_id: "", address: "" });
    setTermsAccepted(false);
    setVoucherCode(null);
  };

  // Copy voucher code
  const copyVoucherCode = () => {
    navigator.clipboard.writeText(voucherCode);
    toast.success("Voucher code copied!");
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  // Get benefit type label
  const getBenefitLabel = (type) => {
    switch (type) {
      case 'accidental_insurance': return '₹2 Lakhs Accidental Insurance';
      case 'health_insurance': return '25% Health Insurance Reimbursement';
      case 'education_voucher': return 'Education Voucher ₹54,999';
      default: return type;
    }
  };

  // Member Form Component
  const MemberForm = ({ member, onChange, title, showRemove, onRemove }) => (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        {showRemove && (
          <Button size="sm" variant="ghost" onClick={onRemove} className="text-red-500">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Full Name *</Label>
          <Input value={member.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Enter full name" />
        </div>
        <div>
          <Label>Gender *</Label>
          <Select value={member.gender} onValueChange={(v) => onChange('gender', v)}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Relation Type *</Label>
          <Select value={member.relation} onValueChange={(v) => onChange('relation', v)}>
            <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
            <SelectContent>
              {RELATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{member.relation || "Father's/Husband's"} Name *</Label>
          <Input value={member.relation_name} onChange={(e) => onChange('relation_name', e.target.value)} placeholder="Enter name" />
        </div>
        <div>
          <Label>Date of Birth * (Min 18 years)</Label>
          <Input type="date" value={member.dob} onChange={(e) => onChange('dob', e.target.value)} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
        </div>
        <div>
          <Label>Aadhar Number *</Label>
          <Input value={member.aadhar_number} onChange={(e) => onChange('aadhar_number', e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit Aadhar" maxLength={12} />
        </div>
        <div>
          <Label>Voter ID *</Label>
          <Input value={member.voter_id} onChange={(e) => onChange('voter_id', e.target.value.toUpperCase())} placeholder="Voter ID" />
        </div>
        <div>
          <Label>WhatsApp Number * (Unique)</Label>
          <Input value={member.whatsapp_number} onChange={(e) => onChange('whatsapp_number', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" maxLength={10} />
        </div>
        <div>
          <Label>Occupation *</Label>
          <Select value={member.occupation} onValueChange={(v) => onChange('occupation', v)}>
            <SelectTrigger><SelectValue placeholder="Select occupation" /></SelectTrigger>
            <SelectContent>
              {OCCUPATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Monthly Earning *</Label>
          <Select value={member.monthly_earning} onValueChange={(v) => onChange('monthly_earning', v)}>
            <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
            <SelectContent>
              {MONTHLY_EARNING_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Address *</Label>
          <Textarea value={member.address} onChange={(e) => onChange('address', e.target.value)} placeholder="Full address" rows={2} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">Claim Benefits</h1>
            <p className="text-xs text-muted-foreground">Apply for government schemes</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Benefit Cards */}
        <div className="space-y-4">
          {/* Accidental Insurance */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">₹2 Lakhs Accidental Insurance</h3>
                  <p className="text-sm text-muted-foreground mt-1">Free accidental insurance coverage for you and your family</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                    <Users className="w-3 h-3" />
                    <span>Up to 5 family members</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600" onClick={() => { setShowModal('accidental'); setTermsAccepted(false); }}>
                Apply Now
              </Button>
            </CardContent>
          </Card>

          {/* Health Insurance */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-background">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-green-500 flex items-center justify-center shrink-0">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">25% Monthly Health Insurance</h3>
                  <p className="text-sm text-muted-foreground mt-1">Get 25% reimbursement on your monthly health insurance premium</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                    <IndianRupee className="w-3 h-3" />
                    <span>Save on premiums</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4 bg-green-500 hover:bg-green-600" onClick={() => { setShowModal('health'); setTermsAccepted(false); }}>
                Apply Now
              </Button>
            </CardContent>
          </Card>

          {/* Education Voucher */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-background">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-500 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Education Voucher ₹54,999</h3>
                  <p className="text-sm text-muted-foreground mt-1">Bose American Academy education voucher for skill courses</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-purple-600">
                    <FileText className="w-3 h-3" />
                    <span>Instant voucher code</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4 bg-purple-500 hover:bg-purple-600" onClick={() => { setShowModal('education'); setTermsAccepted(false); setVoucherCode(null); }}>
                Apply Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* My Applications */}
        {myApplications.length > 0 && (
          <div className="mt-8">
            <h2 className="font-bold text-lg mb-3">My Applications</h2>
            <div className="space-y-3">
              {myApplications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{getBenefitLabel(app.type)}</p>
                        <p className="text-xs text-muted-foreground">
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                        {app.voucher_code && (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{app.voucher_code}</code>
                            <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => { navigator.clipboard.writeText(app.voucher_code); toast.success("Copied!"); }}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Accidental Insurance Modal */}
      <Dialog open={showModal === 'accidental'} onOpenChange={(open) => { if (!open) { setShowModal(null); resetForms(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              ₹2 Lakhs Accidental Insurance
            </DialogTitle>
            <DialogDescription>
              Fill in the details for yourself and up to 4 family members
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Primary Applicant */}
            <MemberForm
              member={primaryApplicant}
              onChange={(field, value) => setPrimaryApplicant({ ...primaryApplicant, [field]: value })}
              title="Primary Applicant (You)"
              showRemove={false}
            />
            
            {/* Family Members */}
            {familyMembers.map((member, index) => (
              <MemberForm
                key={index}
                member={member}
                onChange={(field, value) => updateFamilyMember(index, field, value)}
                title={`Family Member ${index + 1}`}
                showRemove={true}
                onRemove={() => removeFamilyMember(index)}
              />
            ))}
            
            {/* Add Family Member Button */}
            {familyMembers.length < 4 && (
              <Button variant="outline" className="w-full" onClick={addFamilyMember}>
                <Plus className="w-4 h-4 mr-2" />
                Add Family Member ({familyMembers.length}/4)
              </Button>
            )}
            
            {/* Provider Info */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Provided by Rohan Kulkarni in association with partner organizations.</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Applying does not guarantee approval. All applications are subject to verification and T&C.</p>
            </div>

            {/* Confirmation */}
            <div className="flex items-start gap-2">
              <Checkbox id="terms-accidental" checked={termsAccepted} onCheckedChange={setTermsAccepted} />
              <label htmlFor="terms-accidental" className="text-sm">
                I confirm all information provided is accurate.
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(null); resetForms(); }}>Cancel</Button>
            <Button onClick={submitAccidentalInsurance} disabled={loading || !termsAccepted} className="bg-blue-500 hover:bg-blue-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Apply Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Health Insurance Modal */}
      <Dialog open={showModal === 'health'} onOpenChange={(open) => { if (!open) { setShowModal(null); resetForms(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-green-500" />
              25% Health Insurance Reimbursement
            </DialogTitle>
            <DialogDescription>
              Our team will contact you after application
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={healthForm.name} onChange={(e) => setHealthForm({ ...healthForm, name: e.target.value })} placeholder="Enter your full name" />
            </div>
            <div>
              <Label>Mobile Number *</Label>
              <Input value={healthForm.mobile_number} onChange={(e) => setHealthForm({ ...healthForm, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit mobile number" maxLength={10} />
            </div>
            <div>
              <Label>How many in family? *</Label>
              <Select value={healthForm.family_count.toString()} onValueChange={(v) => setHealthForm({ ...healthForm, family_count: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FAMILY_COUNT_OPTIONS.map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {/* Provider Info */}
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 text-sm text-green-800 dark:text-green-200">
              <p className="font-medium mb-1">Provided by Rohan Kulkarni in association with partner organizations.</p>
              <p className="text-xs text-green-600 dark:text-green-400">Applying does not guarantee approval. All applications are subject to verification and T&C.</p>
            </div>

            {/* Confirmation */}
            <div className="flex items-start gap-2">
              <Checkbox id="terms-health" checked={termsAccepted} onCheckedChange={setTermsAccepted} />
              <label htmlFor="terms-health" className="text-sm">
                I confirm all information provided is accurate.
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(null); resetForms(); }}>Cancel</Button>
            <Button onClick={submitHealthInsurance} disabled={loading || !termsAccepted} className="bg-green-500 hover:bg-green-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Apply Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Voucher Modal */}
      <Dialog open={showModal === 'education'} onOpenChange={(open) => { if (!open) { setShowModal(null); resetForms(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              Education Voucher ₹54,999
            </DialogTitle>
            <DialogDescription>
              Bose American Academy - Digital Marketing Course
            </DialogDescription>
          </DialogHeader>
          
          {!voucherCode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Full Name *</Label>
                  <Input value={educationForm.name} onChange={(e) => setEducationForm({ ...educationForm, name: e.target.value })} placeholder="Enter your full name" />
                </div>
                <div>
                  <Label>Education *</Label>
                  <Select value={educationForm.education} onValueChange={(v) => setEducationForm({ ...educationForm, education: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {EDUCATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Occupation *</Label>
                  <Select value={educationForm.occupation} onValueChange={(v) => setEducationForm({ ...educationForm, occupation: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {OCCUPATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date of Birth *</Label>
                  <Input type="date" value={educationForm.dob} onChange={(e) => setEducationForm({ ...educationForm, dob: e.target.value })} />
                </div>
                <div>
                  <Label>Aadhar Number *</Label>
                  <Input value={educationForm.aadhar_number} onChange={(e) => setEducationForm({ ...educationForm, aadhar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="12-digit Aadhar" maxLength={12} />
                </div>
                {calculateAge(educationForm.dob) >= 18 && (
                  <div className="col-span-2">
                    <Label>Voter ID * (Required for 18+)</Label>
                    <Input value={educationForm.voter_id} onChange={(e) => setEducationForm({ ...educationForm, voter_id: e.target.value.toUpperCase() })} placeholder="Voter ID" />
                  </div>
                )}
                <div className="col-span-2">
                  <Label>Address *</Label>
                  <Textarea value={educationForm.address} onChange={(e) => setEducationForm({ ...educationForm, address: e.target.value })} placeholder="Full address" rows={2} />
                </div>
              </div>
              
              {/* T&C */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200">
                <Checkbox id="terms-education" checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                <label htmlFor="terms-education" className="text-sm">
                  I understand my application will be processed and the voucher will be generated for eligible users.
                </label>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowModal(null); resetForms(); }}>Cancel</Button>
                <Button onClick={submitEducationVoucher} disabled={loading} className="bg-purple-500 hover:bg-purple-600">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Generate Voucher
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-bold text-xl">Voucher Generated!</h3>
              <p className="text-sm text-muted-foreground">Use this code to enroll in courses</p>
              
              <div className="flex items-center justify-center gap-2 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <code className="text-2xl font-mono font-bold text-purple-600">{voucherCode}</code>
                <Button size="sm" variant="ghost" onClick={copyVoucherCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Use this code in the Education section to access course videos
              </p>
              
              <Button onClick={() => { setShowModal(null); resetForms(); }} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
