import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
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
  AlertCircle
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MyFamily() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({ phone: "", relationship: "spouse" });
  const [sending, setSending] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, requestsRes] = await Promise.all([
        axios.get(`${API}/family/members`, { headers }),
        axios.get(`${API}/family/requests`, { headers })
      ]);
      setMembers(membersRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error("Error fetching family data:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update own location periodically
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
                battery_level: null // Browser doesn't expose battery reliably
              }, { headers });
            } catch (error) {
              console.error("Error updating location:", error);
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
          },
          { enableHighAccuracy: true }
        );
      }
    };

    // Update location on load and every 5 minutes
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
      <div className="space-y-6" data-testid="my-family-page">
        {/* Header with Update Location */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">
                {language === "te" ? "కుటుంబ ట్రాకింగ్" : "Family Tracking"}
              </h1>
              <p className="text-white/80 text-sm">
                {language === "te" ? "మీ ప్రియమైన వారిని ట్రాక్ చేయండి" : "Keep your loved ones safe"}
              </p>
            </div>
          </div>
          <Button
            onClick={updateMyLocation}
            disabled={updatingLocation}
            className="w-full mt-3 bg-white/20 hover:bg-white/30 text-white border-0"
            data-testid="update-location-btn"
          >
            {updatingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            {language === "te" ? "నా లొకేషన్ అప్డేట్ చేయండి" : "Update My Location"}
          </Button>
        </div>

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
                  <p className="text-sm text-text-muted mb-3">
                    {language === "te" 
                      ? "మిమ్మల్ని కుటుంబ సభ్యుడిగా జోడించాలనుకుంటున్నారు" 
                      : "wants to add you as a family member"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => respondToRequest(req.id, "accept")}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      data-testid={`accept-request-${req.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {language === "te" ? "అంగీకరించు" : "Accept"}
                    </Button>
                    <Button
                      onClick={() => respondToRequest(req.id, "decline")}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-500 hover:bg-red-50"
                      data-testid={`decline-request-${req.id}`}
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
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    type="tel"
                    placeholder={language === "te" ? "ఫోన్ నంబర్" : "Phone Number"}
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="pl-10"
                    data-testid="family-phone-input"
                  />
                </div>
                <select
                  value={newMember.relationship}
                  onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  data-testid="family-relationship-select"
                >
                  <option value="spouse">{relationshipLabels.spouse[language]}</option>
                  <option value="child">{relationshipLabels.child[language]}</option>
                  <option value="parent">{relationshipLabels.parent[language]}</option>
                  <option value="sibling">{relationshipLabels.sibling[language]}</option>
                  <option value="other">{relationshipLabels.other[language]}</option>
                </select>
                <div className="flex gap-2">
                  <Button
                    onClick={sendRequest}
                    disabled={sending}
                    className="flex-1 bg-primary"
                    data-testid="send-request-btn"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    {language === "te" ? "అభ్యర్థన పంపండి" : "Send Request"}
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(false)}
                    variant="outline"
                  >
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.family_member_id)}
                        className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                        data-testid={`remove-member-${member.family_member_id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                          data-testid={`view-location-${member.family_member_id}`}
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
                  </div>
                ))}
              </div>
            )}

            {/* Outgoing Requests */}
            {requests.outgoing.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-sm text-text-muted mb-3">
                  {language === "te" ? "పంపిన అభ్యర్థనలు" : "Sent Requests"}
                </h3>
                {requests.outgoing.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{req.to_user_name}</p>
                      <p className="text-xs text-text-muted">{req.to_user_phone}</p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                      {language === "te" ? "పెండింగ్" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
