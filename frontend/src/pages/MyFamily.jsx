import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  MapPin,
  Clock,
  Battery,
  Check,
  X,
  RefreshCw,
  Phone,
  Navigation,
  Loader2,
  Heart,
  Send,
  Trash2,
  AlertCircle,
  Shield,
  AlertTriangle,
  Target,
  Siren,
  Plus,
  Settings,
  GraduationCap
} from "lucide-react";
import PhoneInput from "../components/PhoneInput";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MyFamily() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [sosContacts, setSosContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSOSSetup, setShowSOSSetup] = useState(false);
  const [showGeofenceDialog, setShowGeofenceDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newMember, setNewMember] = useState({ phone: "", relationship: "spouse" });
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" });
  const [newGeofence, setNewGeofence] = useState({ name: "", radius_meters: 500 });
  const [sending, setSending] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [triggeringSOS, setTriggeringSOS] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, requestsRes, sosRes] = await Promise.all([
        axios.get(`${API}/family/members`, { headers }),
        axios.get(`${API}/family/requests`, { headers }),
        axios.get(`${API}/sos/contacts`, { headers }).catch(() => ({ data: [] }))
      ]);
      setMembers(membersRes.data);
      setRequests(requestsRes.data);
      setSosContacts(sosRes.data || []);
    } catch (error) {
      console.error("Error fetching family data:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update location periodically
  useEffect(() => {
    const updateLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await axios.post(`${API}/family/update-location`, {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                battery_level: null
              }, { headers });
            } catch (error) {
              console.error("Error updating location:", error);
            }
          },
          (error) => console.error("Geolocation error:", error),
          { enableHighAccuracy: true }
        );
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  const updateMyLocation = async () => {
    if (!("geolocation" in navigator)) {
      toast.error(language === "te" ? "లొకేషన్ అందుబాటులో లేదు" : "Location not available");
      return;
    }

    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await axios.post(`${API}/family/update-location`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }, { headers });
          toast.success(language === "te" ? "లొకేషన్ అప్డేట్ అయింది" : "Location updated");
        } catch (error) {
          toast.error(language === "te" ? "లొకేషన్ అప్డేట్ విఫలమైంది" : "Failed to update location");
        } finally {
          setUpdatingLocation(false);
        }
      },
      (error) => {
        toast.error(language === "te" ? "లొకేషన్ పొందడం విఫలమైంది" : "Failed to get location");
        setUpdatingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // SOS Functions
  const triggerSOS = async () => {
    if (sosContacts.length === 0) {
      toast.error(language === "te" ? "ముందుగా SOS కాంటాక్ట్‌లను సెట్ చేయండి" : "Set up SOS contacts first");
      setShowSOSSetup(true);
      return;
    }

    setTriggeringSOS(true);
    
    // Get current location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await axios.post(`${API}/sos/trigger`, {
              message: language === "te" ? "అత్యవసర పరిస్థితి! నాకు సహాయం కావాలి!" : "EMERGENCY! I need help!",
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }, { headers });
            
            toast.success(
              language === "te" 
                ? `SOS అలర్ట్ ${response.data.contacts_notified.length} మందికి పంపబడింది!` 
                : `SOS alert sent to ${response.data.contacts_notified.length} contacts!`
            );
          } catch (error) {
            toast.error(language === "te" ? "SOS పంపడంలో విఫలమైంది" : "Failed to send SOS");
          } finally {
            setTriggeringSOS(false);
          }
        },
        async () => {
          // Send without location
          try {
            const response = await axios.post(`${API}/sos/trigger`, {
              message: language === "te" ? "అత్యవసర పరిస్థితి! నాకు సహాయం కావాలి!" : "EMERGENCY! I need help!"
            }, { headers });
            toast.success(language === "te" ? "SOS అలర్ట్ పంపబడింది!" : "SOS alert sent!");
          } catch (error) {
            toast.error(language === "te" ? "SOS పంపడంలో విఫలమైంది" : "Failed to send SOS");
          } finally {
            setTriggeringSOS(false);
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setTriggeringSOS(false);
      toast.error(language === "te" ? "లొకేషన్ అందుబాటులో లేదు" : "Location not available");
    }
  };

  const saveSosContacts = async () => {
    if (sosContacts.length === 0 && !newContact.phone) {
      toast.error(language === "te" ? "కనీసం ఒక కాంటాక్ట్ జోడించండి" : "Add at least one contact");
      return;
    }

    try {
      const contacts = [...sosContacts];
      if (newContact.phone && newContact.name) {
        contacts.push(newContact);
      }
      
      await axios.post(`${API}/sos/contacts`, contacts, { headers });
      toast.success(language === "te" ? "SOS కాంటాక్ట్‌లు సేవ్ అయ్యాయి" : "SOS contacts saved");
      setSosContacts(contacts);
      setNewContact({ name: "", phone: "", relationship: "" });
      setShowSOSSetup(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save contacts");
    }
  };

  const addSosContact = () => {
    if (sosContacts.length >= 3) {
      toast.error(language === "te" ? "గరిష్టంగా 3 కాంటాక్ట్‌లు మాత్రమే" : "Maximum 3 contacts allowed");
      return;
    }
    if (!newContact.name || !newContact.phone) {
      toast.error(language === "te" ? "పేరు మరియు ఫోన్ అవసరం" : "Name and phone required");
      return;
    }
    setSosContacts([...sosContacts, { ...newContact }]);
    setNewContact({ name: "", phone: "", relationship: "" });
  };

  const removeSosContact = (index) => {
    const updated = sosContacts.filter((_, i) => i !== index);
    setSosContacts(updated);
  };

  // Geofence Functions
  const addGeofence = async () => {
    if (!selectedMember || !newGeofence.name) {
      toast.error(language === "te" ? "పేరు అవసరం" : "Name required");
      return;
    }

    // Get current location for the geofence center
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await axios.post(`${API}/family/geofence`, {
              name: newGeofence.name,
              member_id: selectedMember.family_member_id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              radius_meters: newGeofence.radius_meters
            }, { headers });
            
            toast.success(language === "te" ? "సేఫ్ జోన్ జోడించబడింది" : "Safe zone added");
            setShowGeofenceDialog(false);
            setNewGeofence({ name: "", radius_meters: 500 });
          } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to add safe zone");
          }
        },
        () => {
          toast.error(language === "te" ? "లొకేషన్ పొందడం విఫలమైంది" : "Failed to get location");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Family member functions
  const sendRequest = async () => {
    if (!newMember.phone || newMember.phone.length < 10) {
      toast.error(language === "te" ? "చెల్లుబాటు అయ్యే ఫోన్ నంబర్ నమోదు చేయండి" : "Enter a valid phone number");
      return;
    }

    setSending(true);
    try {
      await axios.post(`${API}/family/send-request`, newMember, { headers });
      toast.success(language === "te" ? "అభ్యర్థన పంపబడింది" : "Request sent successfully");
      setShowAddForm(false);
      setNewMember({ phone: "", relationship: "spouse" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      await axios.post(`${API}/family/respond`, { request_id: requestId, action }, { headers });
      toast.success(
        action === "accept"
          ? (language === "te" ? "అభ్యర్థన అంగీకరించబడింది" : "Request accepted")
          : (language === "te" ? "అభ్యర్థన తిరస్కరించబడింది" : "Request declined")
      );
      fetchData();
    } catch (error) {
      toast.error("Failed to respond to request");
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm(language === "te" ? "ఈ సభ్యుడిని తొలగించాలా?" : "Remove this family member?")) {
      return;
    }

    try {
      await axios.delete(`${API}/family/member/${memberId}`, { headers });
      toast.success(language === "te" ? "సభ్యుడు తొలగించబడ్డారు" : "Member removed");
      fetchData();
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const openInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  const relationshipLabels = {
    spouse: { en: "Spouse", te: "భార్య/భర్త" },
    child: { en: "Child", te: "పిల్లలు" },
    parent: { en: "Parent", te: "తల్లిదండ్రులు" },
    sibling: { en: "Sibling", te: "సోదరి/సోదరుడు" },
    other: { en: "Other", te: "ఇతరులు" }
  };

  const formatTime = (isoString) => {
    if (!isoString) return language === "te" ? "అందుబాటులో లేదు" : "Not available";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return language === "te" ? "ఇప్పుడే" : "Just now";
    if (diffMins < 60) return `${diffMins} ${language === "te" ? "నిమిషాల క్రితం" : "min ago"}`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ${language === "te" ? "గంటల క్రితం" : "hr ago"}`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout title={language === "te" ? "నా కుటుంబం" : "My Family"} showBackButton>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={language === "te" ? "నా కుటుంబం" : "My Family"} showBackButton>
      <div className="space-y-5" data-testid="my-family-page">
        {/* SOS Emergency Button */}
        <Button
          onClick={triggerSOS}
          disabled={triggeringSOS}
          className="w-full h-20 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xl font-bold rounded-2xl shadow-lg animate-pulse-slow"
          data-testid="sos-trigger-btn"
        >
          {triggeringSOS ? (
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
          ) : (
            <Siren className="h-8 w-8 mr-3" />
          )}
          {language === "te" ? "🚨 SOS అత్యవసర సహాయం" : "🚨 SOS EMERGENCY"}
        </Button>

        {/* Header with Update Location & SOS Setup */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-xl font-bold">
                {language === "te" ? "కుటుంబ ట్రాకింగ్" : "Family Tracking"}
              </h1>
              <p className="text-white/80 text-sm">
                {language === "te" ? "మీ ప్రియమైన వారిని సురక్షితంగా ఉంచండి" : "Keep your loved ones safe"}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button
              onClick={updateMyLocation}
              disabled={updatingLocation}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
              data-testid="update-location-btn"
            >
              {updatingLocation ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {language === "te" ? "లొకేషన్ అప్డేట్" : "Update Location"}
            </Button>
            
            <Button
              onClick={() => setShowSOSSetup(true)}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Settings className="h-4 w-4 mr-1" />
              SOS
            </Button>
          </div>
        </div>

        {/* SOS Setup Dialog */}
        <Dialog open={showSOSSetup} onOpenChange={setShowSOSSetup}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <Siren className="h-5 w-5" />
                {language === "te" ? "SOS అత్యవసర కాంటాక్ట్‌లు" : "SOS Emergency Contacts"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                {language === "te" 
                  ? "అత్యవసర సమయంలో అలర్ట్ పంపడానికి 1-3 కాంటాక్ట్‌లను జోడించండి" 
                  : "Add 1-3 contacts who will receive alerts in emergency"}
              </p>
              
              {/* Existing contacts */}
              {sosContacts.map((contact, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-text-muted">{contact.phone}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSosContact(idx)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {/* Add new contact */}
              {sosContacts.length < 3 && (
                <div className="space-y-2 border-t pt-3">
                  <Input
                    placeholder={language === "te" ? "పేరు" : "Name"}
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                  <PhoneInput
                    value={newContact.phone}
                    onChange={(phone) => setNewContact({ ...newContact, phone })}
                    placeholder={language === "te" ? "10 అంకెల నంబర్" : "10-digit number"}
                  />
                  <select
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{language === "te" ? "సంబంధం ఎంచుకోండి" : "Select Relationship"}</option>
                    {Object.entries(relationshipLabels).map(([key, val]) => (
                      <option key={key} value={key}>{val[language]}</option>
                    ))}
                  </select>
                  <Button
                    onClick={addSosContact}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {language === "te" ? "కాంటాక్ట్ జోడించు" : "Add Contact"}
                  </Button>
                </div>
              )}
              
              <Button onClick={saveSosContacts} className="w-full bg-red-500 hover:bg-red-600">
                {language === "te" ? "SOS కాంటాక్ట్‌లు సేవ్ చేయండి" : "Save SOS Contacts"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending Requests */}
        {requests.incoming.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-5 w-5" />
                {language === "te" ? "పెండింగ్ అభ్యర్థనలు" : "Pending Requests"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.incoming.map((req) => (
                <div key={req.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-text-primary">{req.from_user_name}</p>
                      <p className="text-sm text-text-muted">{req.from_user_phone}</p>
                    </div>
                    <Badge variant="secondary">
                      {relationshipLabels[req.relationship]?.[language] || req.relationship}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => respondToRequest(req.id, "accept")}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {language === "te" ? "అంగీకరించు" : "Accept"}
                    </Button>
                    <Button
                      onClick={() => respondToRequest(req.id, "decline")}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-500"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {language === "te" ? "తిరస్కరించు" : "Decline"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Family Members */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {language === "te" ? "కుటుంబ సభ్యులు" : "Family Members"}
                <Badge variant="secondary" className="ml-2">{members.length}</Badge>
              </CardTitle>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant="outline"
                size="sm"
                className="text-primary"
                data-testid="add-member-btn"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {language === "te" ? "జోడించు" : "Add"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Member Form */}
            {showAddForm && (
              <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3">
                <h3 className="font-semibold text-sm">
                  {language === "te" ? "కుటుంబ సభ్యుడిని జోడించండి" : "Add Family Member"}
                </h3>
                <PhoneInput
                  value={newMember.phone}
                  onChange={(phone) => setNewMember({ ...newMember, phone })}
                  placeholder={language === "te" ? "10 అంకెల నంబర్" : "10-digit number"}
                  data-testid="family-phone-input"
                />
                <select
                  value={newMember.relationship}
                  onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(relationshipLabels).map(([key, val]) => (
                    <option key={key} value={key}>{val[language]}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button onClick={sendRequest} disabled={sending} className="flex-1 bg-primary">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    {language === "te" ? "అభ్యర్థన పంపండి" : "Send Request"}
                  </Button>
                  <Button onClick={() => setShowAddForm(false)} variant="outline">
                    {language === "te" ? "రద్దు" : "Cancel"}
                  </Button>
                </div>
              </div>
            )}

            {/* Members List */}
            {members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-text-muted opacity-30 mb-4" />
                <p className="text-text-muted">
                  {language === "te" 
                    ? "కుటుంబ సభ్యులు లేరు. ఎవరినైనా జోడించండి!" 
                    : "No family members yet. Add someone!"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-muted/30 rounded-xl p-4 border border-border/30"
                    data-testid={`family-member-${member.family_member_id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg">
                          {member.family_member_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">
                            {member.family_member_name}
                          </p>
                          <Badge variant="secondary" className="mt-1">
                            {relationshipLabels[member.relationship]?.[language] || member.relationship}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowGeofenceDialog(true);
                          }}
                          className="text-blue-500 hover:bg-blue-50 h-8 w-8 p-0"
                          title={language === "te" ? "సేఫ్ జోన్ జోడించు" : "Add Safe Zone"}
                        >
                          <Target className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.family_member_id)}
                          className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Location Info */}
                    {member.last_location ? (
                      <div className="bg-white rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-text-muted text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(member.last_location.updated_at)}</span>
                          </div>
                          {member.last_location.battery_level && (
                            <div className="flex items-center gap-1 text-sm">
                              <Battery className="h-4 w-4" />
                              <span>{member.last_location.battery_level}%</span>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => openInMaps(member.last_location.latitude, member.last_location.longitude)}
                          className="w-full bg-blue-500 hover:bg-blue-600"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          {language === "te" ? "మ్యాప్‌లో చూడండి" : "View on Map"}
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <p className="text-sm text-yellow-700">
                          {language === "te" 
                            ? "లొకేషన్ అందుబాటులో లేదు" 
                            : "Location not available yet"}
                        </p>
                      </div>
                    )}

                    {/* Course Progress (for children) */}
                    {member.course_summary && member.course_summary.total_courses > 0 && (
                      <div className="mt-3 bg-indigo-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="h-4 w-4 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-700">
                            {language === "te" ? "కోర్సు పురోగతి" : "Course Progress"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white rounded-lg p-2">
                            <p className="text-lg font-bold text-indigo-600">{member.course_summary.total_courses}</p>
                            <p className="text-[10px] text-muted-foreground">{language === "te" ? "మొత్తం" : "Total"}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <p className="text-lg font-bold text-green-600">{member.course_summary.completed}</p>
                            <p className="text-[10px] text-muted-foreground">{language === "te" ? "పూర్తి" : "Done"}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <p className="text-lg font-bold text-amber-600">{member.course_summary.certificates}</p>
                            <p className="text-[10px] text-muted-foreground">{language === "te" ? "సర్టిఫికెట్లు" : "Certs"}</p>
                          </div>
                        </div>
                        {member.course_summary.in_progress > 0 && (
                          <p className="text-xs text-indigo-600 mt-2 text-center">
                            {member.course_summary.in_progress} {language === "te" ? "కోర్సులు కొనసాగుతున్నాయి" : "courses in progress"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geofence Dialog */}
        <Dialog open={showGeofenceDialog} onOpenChange={setShowGeofenceDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                {language === "te" ? "సేఫ్ జోన్ జోడించండి" : "Add Safe Zone"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                {language === "te" 
                  ? `${selectedMember?.family_member_name} కోసం సేఫ్ జోన్ సెట్ చేయండి. వారు ఈ జోన్ నుండి బయటికి వెళ్తే అలర్ట్ వస్తుంది.`
                  : `Set a safe zone for ${selectedMember?.family_member_name}. You'll get an alert when they leave this zone.`}
              </p>
              
              <Input
                placeholder={language === "te" ? "జోన్ పేరు (ఉదా: ఇల్లు, స్కూల్)" : "Zone name (e.g., Home, School)"}
                value={newGeofence.name}
                onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
              />
              
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  {language === "te" ? "వ్యాసార్థం (మీటర్లు)" : "Radius (meters)"}
                </label>
                <select
                  value={newGeofence.radius_meters}
                  onChange={(e) => setNewGeofence({ ...newGeofence, radius_meters: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={100}>100m</option>
                  <option value={250}>250m</option>
                  <option value={500}>500m</option>
                  <option value={1000}>1km</option>
                  <option value={2000}>2km</option>
                </select>
              </div>
              
              <p className="text-xs text-text-muted bg-muted/50 p-3 rounded-lg">
                {language === "te" 
                  ? "మీ ప్రస్తుత లొకేషన్ సేఫ్ జోన్ సెంటర్‌గా ఉపయోగించబడుతుంది"
                  : "Your current location will be used as the safe zone center"}
              </p>
              
              <Button onClick={addGeofence} className="w-full bg-blue-500 hover:bg-blue-600">
                <Shield className="h-4 w-4 mr-2" />
                {language === "te" ? "సేఫ్ జోన్ సృష్టించండి" : "Create Safe Zone"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
