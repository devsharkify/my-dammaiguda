import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import {
  Star,
  Sun,
  Moon,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  User,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Heart
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// South Indian Kundali Grid Layout
const SouthIndianChart = ({ houses, lagna }) => {
  // South Indian chart layout - 4x4 grid with specific house positions
  // Houses are arranged as:
  // [12] [1]  [2]  [3]
  // [11] [--] [--] [4]
  // [10] [--] [--] [5]
  // [9]  [8]  [7]  [6]
  
  const gridPositions = [
    { row: 0, col: 0, house: 12 },
    { row: 0, col: 1, house: 1 },
    { row: 0, col: 2, house: 2 },
    { row: 0, col: 3, house: 3 },
    { row: 1, col: 0, house: 11 },
    { row: 1, col: 3, house: 4 },
    { row: 2, col: 0, house: 10 },
    { row: 2, col: 3, house: 5 },
    { row: 3, col: 0, house: 9 },
    { row: 3, col: 1, house: 8 },
    { row: 3, col: 2, house: 7 },
    { row: 3, col: 3, house: 6 },
  ];

  const getHouseData = (houseNum) => {
    return houses?.find(h => h.house_number === houseNum);
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-xl border-2 border-orange-200">
      <div className="grid grid-cols-4 gap-0.5 aspect-square">
        {[0, 1, 2, 3].map(row => (
          [0, 1, 2, 3].map(col => {
            const pos = gridPositions.find(p => p.row === row && p.col === col);
            
            // Center cells
            if ((row === 1 || row === 2) && (col === 1 || col === 2)) {
              if (row === 1 && col === 1) {
                return (
                  <div key={`${row}-${col}`} className="col-span-2 row-span-2 bg-orange-100 flex items-center justify-center border border-orange-300 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs font-bold text-orange-800">RASI</p>
                      <p className="text-[10px] text-orange-600">{lagna?.rashi?.name}</p>
                      <Star className="w-6 h-6 mx-auto mt-1 text-orange-500" />
                    </div>
                  </div>
                );
              }
              return null;
            }
            
            if (!pos) return null;
            
            const houseData = getHouseData(pos.house);
            const isLagna = pos.house === 1;
            
            return (
              <div 
                key={`${row}-${col}`}
                className={`p-1 border border-orange-300 flex flex-col items-center justify-center text-center min-h-[60px] ${
                  isLagna ? 'bg-orange-200' : 'bg-white'
                }`}
              >
                <p className="text-[8px] font-bold text-orange-700">{houseData?.rashi?.symbol}</p>
                <p className="text-[7px] text-orange-600 truncate w-full">{houseData?.rashi?.name}</p>
                <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
                  {houseData?.planets?.slice(0, 3).map((p, i) => (
                    <span key={i} className="text-[8px] text-red-600 font-bold">
                      {p.planet.symbol}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export default function Astrology() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [kundali, setKundali] = useState(null);
  
  const [form, setForm] = useState({
    name: "",
    gender: "",
    date_of_birth: "",
    time_of_birth: "",
    place_of_birth: ""
  });

  const cities = [
    "Dammaiguda", "Hyderabad", "Secunderabad", "Vijayawada", "Visakhapatnam",
    "Chennai", "Bangalore", "Mumbai", "Delhi", "Kolkata", "Tirupati", "Warangal"
  ];

  const handleSubmit = async () => {
    if (!form.name || !form.gender || !form.date_of_birth || !form.time_of_birth || !form.place_of_birth) {
      toast.error(language === "te" ? "అన్ని వివరాలు నమోదు చేయండి" : "Please fill all details");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/astrology/kundali`, form);
      if (response.data.success) {
        setKundali(response.data.kundali);
        setStep(2);
        toast.success(language === "te" ? "కుండలి రూపొందించబడింది" : "Kundali generated!");
      }
    } catch (error) {
      toast.error("Failed to generate Kundali");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 pb-24 space-y-4" data-testid="astrology-page">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {language === "te" ? "జ్యోతిష్యం" : "Astrology"}
              </h1>
              <p className="text-xs text-gray-500">
                {language === "te" ? "వేద జ్యోతిష్యం" : "Vedic Astrology"}
              </p>
            </div>
          </div>
        </div>

        {step === 1 ? (
          /* Input Form */
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <Sparkles className="w-12 h-12 mx-auto text-orange-500 mb-2" />
                  <h2 className="text-lg font-bold text-orange-800">
                    {language === "te" ? "మీ కుండలి" : "Your Kundali"}
                  </h2>
                  <p className="text-sm text-orange-600">
                    {language === "te" ? "జన్మ వివరాలు నమోదు చేయండి" : "Enter your birth details"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Name */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-orange-500" />
                    {language === "te" ? "పేరు" : "Name"}
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder={language === "te" ? "మీ పేరు" : "Enter your name"}
                    className="border-orange-200 focus:ring-orange-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-orange-500" />
                    {language === "te" ? "లింగం" : "Gender"}
                  </Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({...form, gender: v})}>
                    <SelectTrigger className="border-orange-200">
                      <SelectValue placeholder={language === "te" ? "ఎంచుకోండి" : "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{language === "te" ? "పురుషుడు" : "Male"}</SelectItem>
                      <SelectItem value="female">{language === "te" ? "స్త్రీ" : "Female"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date of Birth */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    {language === "te" ? "పుట్టిన తేదీ" : "Date of Birth"}
                  </Label>
                  <Input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm({...form, date_of_birth: e.target.value})}
                    className="border-orange-200 focus:ring-orange-500"
                  />
                </div>

                {/* Time of Birth */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    {language === "te" ? "పుట్టిన సమయం" : "Time of Birth"}
                  </Label>
                  <Input
                    type="time"
                    value={form.time_of_birth}
                    onChange={(e) => setForm({...form, time_of_birth: e.target.value})}
                    className="border-orange-200 focus:ring-orange-500"
                  />
                </div>

                {/* Place of Birth */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    {language === "te" ? "పుట్టిన ప్రదేశం" : "Place of Birth"}
                  </Label>
                  <Select value={form.place_of_birth} onValueChange={(v) => setForm({...form, place_of_birth: v})}>
                    <SelectTrigger className="border-orange-200">
                      <SelectValue placeholder={language === "te" ? "నగరం ఎంచుకోండి" : "Select city"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city.toLowerCase()}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Star className="w-5 h-5 mr-2" />
                  )}
                  {language === "te" ? "కుండలి చూడండి" : "Generate Kundali"}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Kundali Result */
          <div className="space-y-4">
            {/* Basic Info Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-orange-800">{kundali?.name}</h2>
                    <p className="text-sm text-orange-600">
                      {kundali?.date_of_birth} • {kundali?.time_of_birth} • {kundali?.place_of_birth}
                    </p>
                  </div>
                  <div className="text-3xl">{kundali?.moon_sign?.symbol}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center p-2 bg-white rounded-lg">
                    <Sun className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
                    <p className="text-[10px] text-gray-500">{language === "te" ? "సూర్య రాశి" : "Sun Sign"}</p>
                    <p className="text-xs font-bold">{kundali?.sun_sign?.name}</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <Moon className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                    <p className="text-[10px] text-gray-500">{language === "te" ? "చంద్ర రాశి" : "Moon Sign"}</p>
                    <p className="text-xs font-bold">{kundali?.moon_sign?.name}</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <Star className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                    <p className="text-[10px] text-gray-500">{language === "te" ? "నక్షత్రం" : "Nakshatra"}</p>
                    <p className="text-xs font-bold">{kundali?.nakshatra?.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kundali Chart */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  {language === "te" ? "రాశి చక్రం" : "Rasi Chart"}
                </h3>
                <SouthIndianChart houses={kundali?.houses} lagna={kundali?.lagna} />
              </CardContent>
            </Card>

            {/* Planetary Positions */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-bold mb-3">
                  {language === "te" ? "గ్రహ స్థానాలు" : "Planetary Positions"}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {kundali?.planets?.map((p, i) => (
                    <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-lg">{p.planet.symbol}</span>
                      <p className="text-[10px] text-gray-500">{p.planet.name}</p>
                      <p className="text-xs font-medium text-orange-600">{p.rashi.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Personality Traits */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-bold mb-3">
                  {language === "te" ? "వ్యక్తిత్వ లక్షణాలు" : "Personality Traits"}
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{language === "te" ? "సానుకూల" : "Positive"}</p>
                    <div className="flex flex-wrap gap-1">
                      {kundali?.general_traits?.positive?.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{language === "te" ? "సవాళ్లు" : "Challenges"}</p>
                    <div className="flex flex-wrap gap-1">
                      {kundali?.general_traits?.negative?.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compatible Signs */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  {language === "te" ? "అనుకూల రాశులు" : "Compatible Signs"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {kundali?.compatibility?.map((sign, i) => (
                    <span key={i} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                      {sign}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dasha Periods */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-bold mb-3">
                  {language === "te" ? "విమ్శోత్తరి దశ" : "Vimshottari Dasha"}
                </h3>
                <div className="space-y-2">
                  {kundali?.vimshottari_dasha?.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{d.lord} Dasha</p>
                        <p className="text-xs text-gray-500">{d.years} years</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{d.start}</p>
                        <p>to {d.end}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => setStep(1)}
              variant="outline"
              className="w-full"
            >
              {language === "te" ? "మరొక కుండలి" : "Generate Another"}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
