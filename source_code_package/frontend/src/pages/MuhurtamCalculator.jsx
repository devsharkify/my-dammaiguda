import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  ArrowLeft, 
  Heart, 
  Home, 
  Car, 
  Briefcase, 
  Baby,
  Star,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

// Event icons mapping
const EVENT_ICONS = {
  marriage: Heart,
  griha_pravesham: Home,
  vehicle_purchase: Car,
  business_start: Briefcase,
  naming_ceremony: Baby
};

// Event colors
const EVENT_COLORS = {
  marriage: "from-pink-500 to-red-500",
  griha_pravesham: "from-orange-500 to-amber-500",
  vehicle_purchase: "from-blue-500 to-indigo-500",
  business_start: "from-green-500 to-emerald-500",
  naming_ceremony: "from-purple-500 to-violet-500"
};

export default function MuhurtamCalculator() {
  const { language } = useLanguage();
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [result, setResult] = useState(null);
  const [suggestedDates, setSuggestedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("events"); // events, calculate, results, suggestions

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const response = await axios.get(`${API}/muhurtam/event-types`);
      setEventTypes(response.data.events || []);
    } catch (error) {
      toast.error("Failed to load event types");
    }
  };

  const calculateMuhurtam = async () => {
    if (!selectedEvent || !selectedDate) {
      toast.error(language === "te" ? "దయచేసి తేదీని ఎంచుకోండి" : "Please select a date");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/muhurtam/calculate/${selectedEvent.id}?date=${selectedDate}`);
      setResult(response.data);
      setView("results");
    } catch (error) {
      toast.error("Failed to calculate muhurtam");
    } finally {
      setLoading(false);
    }
  };

  const findSuggestedDates = async () => {
    if (!selectedEvent) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await axios.get(`${API}/muhurtam/find-dates/${selectedEvent.id}?start_date=${today}&num_days=60`);
      setSuggestedDates(response.data.auspicious_dates || []);
      setView("suggestions");
    } catch (error) {
      toast.error("Failed to find auspicious dates");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getRatingBadge = (rating) => {
    const colors = {
      excellent: "bg-green-500",
      good: "bg-blue-500",
      average: "bg-yellow-500",
      poor: "bg-red-500"
    };
    return colors[rating?.level] || "bg-gray-500";
  };

  return (
    <Layout title={language === "te" ? "ముహూర్త కాలిక్యులేటర్" : "Muhurtam Calculator"}>
      <div className="max-w-lg mx-auto pb-24">
        {/* Header */}
        {view !== "events" && (
          <Button
            variant="ghost"
            onClick={() => {
              if (view === "results" || view === "suggestions") setView("calculate");
              else setView("events");
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === "te" ? "వెనుకకు" : "Back"}
          </Button>
        )}

        {/* Event Selection View */}
        {view === "events" && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-purple-500 mb-2" />
                <h2 className="text-lg font-bold text-purple-800">
                  {language === "te" ? "ముహూర్త కాలిక్యులేటర్" : "Muhurtam Calculator"}
                </h2>
                <p className="text-sm text-purple-600">
                  {language === "te" ? "శుభ సమయాలను కనుగొనండి" : "Find auspicious times for your events"}
                </p>
              </CardContent>
            </Card>

            <p className="text-sm text-gray-600 px-1">
              {language === "te" ? "కార్యక్రమాన్ని ఎంచుకోండి:" : "Select an event:"}
            </p>

            {eventTypes.map((event) => {
              const Icon = EVENT_ICONS[event.id] || Star;
              const colorClass = EVENT_COLORS[event.id] || "from-gray-500 to-gray-600";
              
              return (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event);
                    setView("calculate");
                  }}
                  className="w-full text-left"
                >
                  <Card className="hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-300">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">
                          {language === "te" ? event.name_te : event.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {language === "te" ? event.description_te : event.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {/* Calculate View */}
        {view === "calculate" && selectedEvent && (
          <div className="space-y-4">
            <Card className={`bg-gradient-to-br ${EVENT_COLORS[selectedEvent.id]} text-white border-0`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = EVENT_ICONS[selectedEvent.id] || Star;
                    return <Icon className="w-8 h-8" />;
                  })()}
                  <div>
                    <h2 className="text-xl font-bold">
                      {language === "te" ? selectedEvent.name_te : selectedEvent.name}
                    </h2>
                    <p className="text-sm opacity-90">
                      {language === "te" ? selectedEvent.description_te : selectedEvent.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  {language === "te" ? "తేదీని ఎంచుకోండి" : "Select Date"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="text-lg h-12"
                />

                <Button 
                  onClick={calculateMuhurtam} 
                  disabled={loading || !selectedDate}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-violet-600"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Clock className="w-5 h-5 mr-2" />
                  )}
                  {language === "te" ? "ముహూర్తం చూడండి" : "Check Muhurtam"}
                </Button>
              </CardContent>
            </Card>

            {/* Find Suggested Dates */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  onClick={findSuggestedDates}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {language === "te" ? "శుభ తేదీలు సూచించండి" : "Suggest Auspicious Dates"}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  {language === "te" ? "తదుపరి 60 రోజులలో అత్యుత్తమ తేదీలు" : "Best dates in next 60 days"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results View */}
        {view === "results" && result && (
          <div className="space-y-4">
            {/* Score Card */}
            <Card className={`border-2 ${result.score >= 60 ? "border-green-300 bg-green-50/50" : "border-yellow-300 bg-yellow-50/50"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">{result.date_formatted}</p>
                    <h2 className="text-lg font-bold">
                      {language === "te" ? result.day.name_te : result.day.name}
                    </h2>
                  </div>
                  <div className="text-center">
                    <div className={`text-4xl font-bold px-4 py-2 rounded-xl ${getScoreColor(result.score)}`}>
                      {result.score}
                    </div>
                    <Badge className={`mt-1 ${getRatingBadge(result.rating)}`}>
                      {language === "te" ? result.rating.label_te : result.rating.label}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{language === "te" ? "తిథి" : "Tithi"}</p>
                    <p className="font-bold">{language === "te" ? result.tithi.name_te : result.tithi.name}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{language === "te" ? "నక్షత్రం" : "Nakshatra"}</p>
                    <p className="font-bold">{language === "te" ? result.nakshatra.name_te : result.nakshatra.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auspicious Times */}
            {result.auspicious_times?.length > 0 && (
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-green-700">
                    <Clock className="w-4 h-4" />
                    {language === "te" ? "శుభ సమయాలు" : "Auspicious Times"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.auspicious_times.map((time, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div>
                        <p className="font-bold text-green-700">{language === "te" ? time.name_te : time.name}</p>
                        <p className="text-xs text-gray-500">{language === "te" ? time.description_te : time.description}</p>
                      </div>
                      <p className="font-mono font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                        {time.start} - {time.end}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Rahu Kalam Warning */}
            <Card className="border-red-200 bg-red-50/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <div className="flex-1">
                    <p className="font-bold text-red-700">{result.rahu_kalam.name_te}</p>
                    <p className="text-sm text-gray-600">{language === "te" ? result.rahu_kalam.warning_te : result.rahu_kalam.warning}</p>
                  </div>
                  <p className="font-mono font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                    {result.rahu_kalam.start} - {result.rahu_kalam.end}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Factors */}
            {result.factors?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {language === "te" ? "అంచనా కారకాలు" : "Assessment Factors"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.factors.map((factor, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {factor.status === "good" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : factor.status === "bad" ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Star className="w-4 h-4 text-gray-400" />
                      )}
                      <span>{language === "te" ? factor.message_te : factor.message}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-yellow-700">
                    {language === "te" ? "హెచ్చరికలు" : "Warnings"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.warnings.map((warning, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-yellow-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{language === "te" ? warning.message_te : warning.message}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Try Another Date */}
            <Button
              variant="outline"
              onClick={() => setView("calculate")}
              className="w-full"
            >
              {language === "te" ? "మరొక తేదీ చూడండి" : "Try Another Date"}
            </Button>
          </div>
        )}

        {/* Suggested Dates View */}
        {view === "suggestions" && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0">
              <CardContent className="p-4">
                <h2 className="text-lg font-bold">
                  {language === "te" ? "సూచించిన శుభ తేదీలు" : "Suggested Auspicious Dates"}
                </h2>
                <p className="text-sm opacity-90">
                  {language === "te" 
                    ? `${selectedEvent?.name_te} కోసం తదుపరి 60 రోజులలో` 
                    : `For ${selectedEvent?.name} in next 60 days`}
                </p>
              </CardContent>
            </Card>

            {suggestedDates.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>{language === "te" ? "శుభ తేదీలు కనుగొనబడలేదు" : "No auspicious dates found"}</p>
                </CardContent>
              </Card>
            ) : (
              suggestedDates.map((date, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDate(date.date);
                    calculateMuhurtam();
                  }}
                  className="w-full text-left"
                >
                  <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{date.date_formatted}</p>
                          <p className="text-sm text-gray-500">
                            {language === "te" ? date.day.name_te : date.day.name}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {language === "te" ? date.tithi.name_te : date.tithi.name}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {language === "te" ? date.nakshatra.name_te : date.nakshatra.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(date.score)}`}>
                            {date.score}
                          </div>
                          <Badge className={`mt-1 text-xs ${getRatingBadge(date.rating)}`}>
                            {language === "te" ? date.rating.label_te : date.rating.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
