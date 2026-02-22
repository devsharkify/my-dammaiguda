import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import {
  Shield,
  Heart,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  FileText,
  Users,
  Upload,
  Download
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BenefitsAdmin({ token }) {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [documentUrl, setDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== "all") {
        if (["pending", "approved", "rejected"].includes(activeTab)) {
          params.status = activeTab;
        } else {
          params.benefit_type = activeTab;
        }
      }
      
      const res = await axios.get(`${API}/benefits/admin/applications`, { headers, params });
      setApplications(res.data.applications || []);
      setStats(res.data.stats || {});
    } catch (err) {
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await axios.put(`${API}/benefits/admin/applications/${selectedApp.id}`, {
        status: "approved",
        notes: notes,
        document_url: documentUrl || null
      }, { headers });
      
      toast.success("Application approved!");
      setShowApproveDialog(false);
      setShowDetailDialog(false);
      setSelectedApp(null);
      setDocumentUrl("");
      setNotes("");
      fetchApplications();
    } catch (err) {
      toast.error("Failed to approve application");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (app) => {
    if (!confirm("Are you sure you want to reject this application?")) return;
    
    try {
      await axios.put(`${API}/benefits/admin/applications/${app.id}`, {
        status: "rejected",
        notes: "Application rejected by admin"
      }, { headers });
      
      toast.success("Application rejected");
      fetchApplications();
    } catch (err) {
      toast.error("Failed to reject application");
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'accidental_insurance': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'health_insurance': return <Heart className="w-4 h-4 text-green-500" />;
      case 'education_voucher': return <GraduationCap className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'accidental_insurance': return 'Accidental Insurance';
      case 'health_insurance': return 'Health Insurance';
      case 'education_voucher': return 'Education Voucher';
      default: return type;
    }
  };

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

  const renderApplicationDetails = () => {
    if (!selectedApp) return null;
    
    if (selectedApp.type === 'accidental_insurance') {
      return (
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Primary Applicant</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {selectedApp.primary_applicant?.name}</div>
              <div><span className="text-muted-foreground">Gender:</span> {selectedApp.primary_applicant?.gender}</div>
              <div><span className="text-muted-foreground">DOB:</span> {selectedApp.primary_applicant?.dob}</div>
              <div><span className="text-muted-foreground">Aadhar:</span> {selectedApp.primary_applicant?.aadhar_number}</div>
              <div><span className="text-muted-foreground">Voter ID:</span> {selectedApp.primary_applicant?.voter_id}</div>
              <div><span className="text-muted-foreground">WhatsApp:</span> {selectedApp.primary_applicant?.whatsapp_number}</div>
              <div><span className="text-muted-foreground">Occupation:</span> {selectedApp.primary_applicant?.occupation}</div>
              <div><span className="text-muted-foreground">Monthly Earning:</span> {selectedApp.primary_applicant?.monthly_earning}</div>
              <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {selectedApp.primary_applicant?.address}</div>
            </div>
          </div>
          
          {selectedApp.family_members?.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Family Members ({selectedApp.family_members.length})</h4>
              {selectedApp.family_members.map((member, idx) => (
                <div key={idx} className="bg-muted/30 rounded-lg p-3 mb-2 text-sm">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-muted-foreground">
                    {member.gender} | {member.relation}: {member.relation_name} | WhatsApp: {member.whatsapp_number}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    if (selectedApp.type === 'health_insurance') {
      return (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div><span className="text-muted-foreground">Name:</span> {selectedApp.name}</div>
          <div><span className="text-muted-foreground">Mobile:</span> {selectedApp.mobile_number}</div>
          <div><span className="text-muted-foreground">Family Members:</span> {selectedApp.family_count}</div>
        </div>
      );
    }
    
    if (selectedApp.type === 'education_voucher') {
      return (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div><span className="text-muted-foreground">Name:</span> {selectedApp.name}</div>
          <div><span className="text-muted-foreground">Education:</span> {selectedApp.education}</div>
          <div><span className="text-muted-foreground">Occupation:</span> {selectedApp.occupation}</div>
          <div><span className="text-muted-foreground">DOB:</span> {selectedApp.dob} (Age: {selectedApp.age})</div>
          <div><span className="text-muted-foreground">Aadhar:</span> {selectedApp.aadhar_number}</div>
          {selectedApp.voter_id && <div><span className="text-muted-foreground">Voter ID:</span> {selectedApp.voter_id}</div>}
          <div><span className="text-muted-foreground">Address:</span> {selectedApp.address}</div>
          {selectedApp.voucher_code && (
            <div className="pt-2 border-t">
              <span className="text-muted-foreground">Voucher Code:</span>{" "}
              <code className="bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded font-mono">{selectedApp.voucher_code}</code>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accidental Insurance</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.accidental_insurance?.pending || 0}</span>
                  <Badge variant="outline" className="text-xs">pending</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Heart className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health Insurance</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.health_insurance?.pending || 0}</span>
                  <Badge variant="outline" className="text-xs">pending</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Education Vouchers</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.education_voucher?.approved || 0}</span>
                  <Badge variant="outline" className="text-xs">issued</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accidental_insurance">Accidental</TabsTrigger>
          <TabsTrigger value="health_insurance">Health</TabsTrigger>
          <TabsTrigger value="education_voucher">Education</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Benefit Applications</CardTitle>
          <CardDescription>Review and approve citizen benefit applications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No applications found</p>
            </div>
          ) : (
            <div className="divide-y">
              {applications.map((app) => (
                <div key={app.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {getTypeIcon(app.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{getTypeLabel(app.type)}</p>
                        {getStatusBadge(app.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {app.primary_applicant?.name || app.name} • {new Date(app.created_at).toLocaleDateString()}
                        {app.total_members > 1 && (
                          <span className="ml-2">
                            <Users className="w-3 h-3 inline mr-1" />
                            {app.total_members} members
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setShowDetailDialog(true); }}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {app.status === 'pending' && (
                      <>
                        <Button size="sm" variant="default" className="bg-green-500 hover:bg-green-600" onClick={() => { setSelectedApp(app); setShowApproveDialog(true); }}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(app)}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedApp && getTypeIcon(selectedApp.type)}
              {selectedApp && getTypeLabel(selectedApp.type)}
            </DialogTitle>
            <DialogDescription>
              Application ID: {selectedApp?.id?.slice(0, 8)}... • {selectedApp && getStatusBadge(selectedApp.status)}
            </DialogDescription>
          </DialogHeader>
          
          {renderApplicationDetails()}
          
          {selectedApp?.document_url && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-sm font-medium text-green-700">Document Attached</p>
              <a href={selectedApp.document_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
                View Document
              </a>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedApp?.status === 'pending' && (
              <Button className="bg-green-500 hover:bg-green-600" onClick={() => { setShowDetailDialog(false); setShowApproveDialog(true); }}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              {selectedApp?.type === 'accidental_insurance' && "Upload insurance document (PDF/JPG) to send to the applicant"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedApp?.type === 'accidental_insurance' && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Insurance Document URL (Optional)</label>
                <Input 
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload the insurance PDF/JPG to Cloudinary and paste the URL here
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes (Optional)</label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowApproveDialog(false); setDocumentUrl(""); setNotes(""); }}>Cancel</Button>
            <Button onClick={handleApprove} disabled={actionLoading} className="bg-green-500 hover:bg-green-600">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
