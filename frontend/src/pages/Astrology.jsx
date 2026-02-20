import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
// Select component removed - using text input for city
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
  Heart,
  Briefcase,
  Wallet,
  Activity,
  Home,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Target,
  BookOpen
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Zodiac Signs Data
const ZODIAC_SIGNS = [
  { name: "Aries", name_te: "మేషం", symbol: "♈", element: "Fire", dates: "Mar 21 - Apr 19" },
  { name: "Taurus", name_te: "వృషభం", symbol: "♉", element: "Earth", dates: "Apr 20 - May 20" },
  { name: "Gemini", name_te: "మిథునం", symbol: "♊", element: "Air", dates: "May 21 - Jun 20" },
  { name: "Cancer", name_te: "కర్కాటకం", symbol: "♋", element: "Water", dates: "Jun 21 - Jul 22" },
  { name: "Leo", name_te: "సింహం", symbol: "♌", element: "Fire", dates: "Jul 23 - Aug 22" },
  { name: "Virgo", name_te: "కన్య", symbol: "♍", element: "Earth", dates: "Aug 23 - Sep 22" },
  { name: "Libra", name_te: "తులా", symbol: "♎", element: "Air", dates: "Sep 23 - Oct 22" },
  { name: "Scorpio", name_te: "వృశ్చికం", symbol: "♏", element: "Water", dates: "Oct 23 - Nov 21" },
  { name: "Sagittarius", name_te: "ధనుస్సు", symbol: "♐", element: "Fire", dates: "Nov 22 - Dec 21" },
  { name: "Capricorn", name_te: "మకరం", symbol: "♑", element: "Earth", dates: "Dec 22 - Jan 19" },
  { name: "Aquarius", name_te: "కుంభం", symbol: "♒", element: "Air", dates: "Jan 20 - Feb 18" },
  { name: "Pisces", name_te: "మీనం", symbol: "♓", element: "Water", dates: "Feb 19 - Mar 20" }
];

// South Indian Kundali Grid Layout
const SouthIndianChart = ({ houses, lagna }) => {
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

  const getHouseData = (houseNum) => houses?.find(h => h.house_number === houseNum);

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-2 rounded-xl border-2 border-orange-200">
      <div className="grid grid-cols-4 gap-0.5 aspect-square">
        {[0, 1, 2, 3].map(row => (
          [0, 1, 2, 3].map(col => {
            const pos = gridPositions.find(p => p.row === row && p.col === col);
            if ((row === 1 || row === 2) && (col === 1 || col === 2)) {
              if (row === 1 && col === 1) {
                return (
                  <div key={`${row}-${col}`} className="col-span-2 row-span-2 bg-orange-100 flex items-center justify-center border border-orange-300 rounded-lg">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-orange-800">RASI</p>
                      <p className="text-[8px] text-orange-600">{lagna?.rashi?.name}</p>
                      <Star className="w-5 h-5 mx-auto mt-0.5 text-orange-500" />
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
                className={`p-0.5 border border-orange-300 flex flex-col items-center justify-center text-center min-h-[50px] ${isLagna ? 'bg-orange-200' : 'bg-white'}`}
              >
                <p className="text-[7px] font-bold text-orange-700">{houseData?.rashi?.symbol}</p>
                <p className="text-[6px] text-orange-600 truncate w-full">{houseData?.rashi?.name}</p>
                <div className="flex flex-wrap justify-center gap-0.5">
                  {houseData?.planets?.slice(0, 2).map((p, i) => (
                    <span key={i} className="text-[7px] text-red-600 font-bold">{p.planet.symbol}</span>
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

// Life Predictions Component
const LifePredictions = ({ kundali }) => {
  const predictions = generateLifePredictions(kundali);
  
  return (
    <div className="space-y-3">
      {/* Career */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-blue-800">Career & Professional</h4>
          </div>
          <p className="text-sm text-blue-700">{predictions.career}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-xs bg-blue-100 px-2 py-0.5 rounded">Lucky Period: {predictions.careerPeriod}</div>
          </div>
        </CardContent>
      </Card>

      {/* Finance */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-green-600" />
            <h4 className="font-bold text-green-800">Money & Finance</h4>
          </div>
          <p className="text-sm text-green-700">{predictions.finance}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-xs bg-green-100 px-2 py-0.5 rounded">Investment: {predictions.investment}</div>
          </div>
        </CardContent>
      </Card>

      {/* Health */}
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-red-800">Health & Wellness</h4>
          </div>
          <p className="text-sm text-red-700">{predictions.health}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-xs bg-red-100 px-2 py-0.5 rounded">Focus: {predictions.healthFocus}</div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Life */}
      <Card className="border-pink-200 bg-pink-50/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-5 h-5 text-pink-600" />
            <h4 className="font-bold text-pink-800">Personal Life</h4>
          </div>
          <p className="text-sm text-pink-700">{predictions.personal}</p>
        </CardContent>
      </Card>

      {/* Marriage */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-purple-800">Marriage & Relationships</h4>
          </div>
          <p className="text-sm text-purple-700">{predictions.marriage}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-xs bg-purple-100 px-2 py-0.5 rounded">Best Match: {predictions.bestMatch}</div>
          </div>
        </CardContent>
      </Card>

      {/* This Year */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h4 className="font-bold text-amber-800">2025 Predictions</h4>
          </div>
          <p className="text-sm text-amber-700">{predictions.thisYear}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="text-xs bg-amber-100 px-2 py-1 rounded text-center">
              <p className="font-medium">Lucky Months</p>
              <p>{predictions.luckyMonths}</p>
            </div>
            <div className="text-xs bg-amber-100 px-2 py-1 rounded text-center">
              <p className="font-medium">Challenges</p>
              <p>{predictions.challenges}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Generate predictions based on kundali
function generateLifePredictions(kundali) {
  const moonSign = kundali?.moon_sign?.english || "Aries";
  const sunSign = kundali?.sun_sign?.english || "Aries";
  
  const predictions = {
    Aries: {
      career: "This year brings significant career growth. Leadership opportunities await. Your dynamic energy will help you overcome workplace challenges. Consider starting new projects in Q2.",
      careerPeriod: "April-July",
      finance: "Financial stability improves. Good time for investments in real estate. Avoid impulsive purchases. Savings will grow steadily.",
      investment: "Real Estate, Gold",
      health: "Focus on head and brain health. Regular exercise essential. Watch for stress-related issues. Morning walks beneficial.",
      healthFocus: "Mental wellness",
      personal: "Family relationships strengthen. Good time for home improvements. Children bring joy. Elder's blessings important.",
      marriage: "Marriage prospects favorable after June. Existing relationships deepen. Communication is key for harmony.",
      bestMatch: "Leo, Sagittarius",
      thisYear: "2025 is a year of new beginnings and leadership. Major decisions will shape your future. Be bold but calculated.",
      luckyMonths: "Mar, Jul, Nov",
      challenges: "Apr, Aug"
    },
    Taurus: {
      career: "Steady progress in career. Recognition for hard work comes. Patience in professional matters pays off. Avoid conflicts with superiors.",
      careerPeriod: "May-September",
      finance: "Excellent year for finances. Property gains possible. Long-term investments flourish. Unexpected income likely.",
      investment: "Mutual Funds, Property",
      health: "Throat and neck need attention. Maintain regular diet. Avoid excessive sweets. Yoga recommended.",
      healthFocus: "Diet & Nutrition",
      personal: "Domestic happiness prevails. Family celebrations expected. Good time for buying home. Peace at home.",
      marriage: "Marriage prospects very good. Existing couples experience harmony. Venus blesses relationships.",
      bestMatch: "Cancer, Virgo",
      thisYear: "2025 brings material prosperity and emotional fulfillment. Focus on building lasting foundations.",
      luckyMonths: "Feb, Jun, Oct",
      challenges: "May, Sep"
    },
    Gemini: {
      career: "Communication skills bring success. Multiple opportunities arise. Networking expands. Short travels for work.",
      careerPeriod: "June-October",
      finance: "Variable income pattern. Side business profitable. Avoid lending money. Diversify investments.",
      investment: "Stocks, Technology",
      health: "Respiratory health needs care. Regular breathing exercises. Avoid pollution. Mental stress possible.",
      healthFocus: "Breathing & Lungs",
      personal: "Social life active. Siblings play important role. Learning new skills beneficial. Short trips joyful.",
      marriage: "Need patience in marriage matters. Clear communication essential. Avoid misunderstandings.",
      bestMatch: "Libra, Aquarius",
      thisYear: "2025 emphasizes learning and communication. Knowledge expansion leads to success.",
      luckyMonths: "Jan, May, Sep",
      challenges: "Mar, Jul"
    },
    Cancer: {
      career: "Emotional intelligence aids career. Creative fields favored. Work-life balance important. Recognition from seniors.",
      careerPeriod: "July-November",
      finance: "Property gains indicated. Family inheritance possible. Savings increase. Conservative approach works.",
      investment: "Fixed Deposits, Land",
      health: "Stomach and digestion need care. Emotional eating to avoid. Water intake important. Home remedies effective.",
      healthFocus: "Digestive Health",
      personal: "Strong family bonds. Mother's blessings important. Home renovations favorable. Ancestral property matters.",
      marriage: "Excellent for marriage. Deep emotional connections. Family approval comes. Wedding bells possible.",
      bestMatch: "Scorpio, Pisces",
      thisYear: "2025 focuses on home and family. Emotional security and nurturing relationships take priority.",
      luckyMonths: "Apr, Aug, Dec",
      challenges: "Feb, Jun"
    },
    Leo: {
      career: "Leadership roles await. Creative projects succeed. Recognition and awards possible. Government jobs favorable.",
      careerPeriod: "August-December",
      finance: "Speculative gains possible. Entertainment investments good. Generous spending tendency. Plan for taxes.",
      investment: "Entertainment, Luxury",
      health: "Heart health important. Regular cardio needed. Ego-related stress. Back care essential.",
      healthFocus: "Heart & Spine",
      personal: "Children bring happiness. Romance blooms. Creative pursuits successful. Stage performances favorable.",
      marriage: "Love marriage possible. Grand celebrations. Partner very supportive. Royal wedding vibes.",
      bestMatch: "Aries, Sagittarius",
      thisYear: "2025 is your year to shine. Leadership, creativity, and recognition define this period.",
      luckyMonths: "Mar, Jul, Nov",
      challenges: "Jan, May"
    },
    Virgo: {
      career: "Analytical skills valued. Healthcare/service sectors grow. Detail-oriented work pays. New job opportunities.",
      careerPeriod: "September-January",
      finance: "Practical approach to finances. Small but steady gains. Health-related expenses possible. Budget carefully.",
      investment: "Healthcare, Agriculture",
      health: "Digestive system sensitive. Clean eating essential. Regular checkups advised. Worry less.",
      healthFocus: "Gut Health",
      personal: "Service to others brings joy. Pets favorable. Daily routines matter. Cleanliness obsession may increase.",
      marriage: "Practical approach to marriage. Partner's health important. Service-oriented relationship works.",
      bestMatch: "Taurus, Capricorn",
      thisYear: "2025 rewards hard work and attention to detail. Health and service themes dominate.",
      luckyMonths: "Feb, Jun, Oct",
      challenges: "Apr, Aug"
    },
    Libra: {
      career: "Partnerships in business succeed. Legal matters favorable. Diplomatic skills shine. Artistic careers grow.",
      careerPeriod: "October-February",
      finance: "Partnership income rises. Luxury purchases tempting. Balance spending. Marriage brings wealth.",
      investment: "Art, Fashion",
      health: "Kidney and lower back need care. Stay hydrated. Beauty routines beneficial. Balance in diet.",
      healthFocus: "Kidney Health",
      personal: "Social life flourishes. Artistic pursuits successful. Beauty and aesthetics focus. Harmony at home.",
      marriage: "Excellent year for marriage. Beautiful celebrations. Partner brings balance. Venus strongly supports.",
      bestMatch: "Gemini, Aquarius",
      thisYear: "2025 emphasizes relationships and balance. Beauty, harmony, and partnerships flourish.",
      luckyMonths: "Jan, May, Sep",
      challenges: "Mar, Jul"
    },
    Scorpio: {
      career: "Transformation in career. Research fields succeed. Hidden gains possible. Power dynamics shift favorably.",
      careerPeriod: "November-March",
      finance: "Inheritance or insurance gains. Joint finances improve. Tax matters resolve. Investments in research.",
      investment: "Insurance, Research",
      health: "Reproductive health important. Detox programs beneficial. Psychological well-being focus. Avoid extremes.",
      healthFocus: "Emotional Healing",
      personal: "Deep transformations. Secrets revealed. Psychological growth. Intense family dynamics.",
      marriage: "Intense relationships. Deep bonding with partner. Trust issues resolve. Transformation through love.",
      bestMatch: "Cancer, Pisces",
      thisYear: "2025 brings deep transformation. Hidden matters surface. Rebirth and renewal themes.",
      luckyMonths: "Apr, Aug, Dec",
      challenges: "Feb, Jun"
    },
    Sagittarius: {
      career: "Higher education advances career. Foreign opportunities arise. Teaching/guidance roles. Publishing success.",
      careerPeriod: "December-April",
      finance: "Fortune through travel. Foreign currency gains. Philosophical investments. Generous donations.",
      investment: "Travel, Education",
      health: "Thighs and liver need care. Outdoor activities beneficial. Avoid over-indulgence. Sports injuries possible.",
      healthFocus: "Liver Health",
      personal: "Long travels planned. Higher learning pursuits. Spiritual growth. Father's blessings important.",
      marriage: "Marriage with foreigner possible. Philosophical compatibility matters. Adventure in love.",
      bestMatch: "Aries, Leo",
      thisYear: "2025 expands horizons through travel, education, and philosophy. Luck favors the bold.",
      luckyMonths: "Mar, Jul, Nov",
      challenges: "Jan, May"
    },
    Capricorn: {
      career: "Steady climb to top. Government recognition. Authority positions. Long-term career goals achieved.",
      careerPeriod: "January-May",
      finance: "Slow but steady growth. Real estate gains. Retirement planning important. Conservative investments.",
      investment: "Government Bonds, Land",
      health: "Bones and joints need care. Calcium important. Avoid excessive work. Knee problems possible.",
      healthFocus: "Bone Health",
      personal: "Responsibilities increase. Elder care important. Tradition matters. Status in society rises.",
      marriage: "Mature approach to marriage. Arranged marriage successful. Long-term commitment valued.",
      bestMatch: "Taurus, Virgo",
      thisYear: "2025 rewards discipline and patience. Career achievements and recognition come through hard work.",
      luckyMonths: "Feb, Jun, Oct",
      challenges: "Apr, Aug"
    },
    Aquarius: {
      career: "Innovation leads success. Technology careers thrive. Group projects succeed. Humanitarian work recognized.",
      careerPeriod: "February-June",
      finance: "Unexpected gains possible. Cryptocurrency interests. Group investments work. Charitable giving increases.",
      investment: "Technology, Innovation",
      health: "Ankles and circulation important. Stay grounded. Nervous system needs care. Meditation helps.",
      healthFocus: "Circulation",
      personal: "Friendships deepen. Group activities fulfilling. Humanitarian causes attract. Independence valued.",
      marriage: "Unconventional relationships work. Friendship-based marriage. Space in relationship important.",
      bestMatch: "Gemini, Libra",
      thisYear: "2025 brings innovation and humanitarian focus. Technology and friendships play major roles.",
      luckyMonths: "Jan, May, Sep",
      challenges: "Mar, Jul"
    },
    Pisces: {
      career: "Creative careers flourish. Spiritual work succeeds. Healthcare/healing roles. Behind-the-scenes success.",
      careerPeriod: "March-July",
      finance: "Intuitive investments work. Hidden sources of income. Charitable expenses. Avoid fraud.",
      investment: "Art, Spirituality",
      health: "Feet and immune system important. Sleep quality matters. Avoid substances. Spiritual healing effective.",
      healthFocus: "Immune System",
      personal: "Spiritual growth significant. Dreams meaningful. Solitude beneficial. Artistic expression healing.",
      marriage: "Soul-mate connections. Spiritual partner ideal. Compassionate relationships. Sacrifice in love.",
      bestMatch: "Cancer, Scorpio",
      thisYear: "2025 emphasizes spirituality and creativity. Dreams and intuition guide major decisions.",
      luckyMonths: "Apr, Aug, Dec",
      challenges: "Feb, Jun"
    }
  };

  return predictions[moonSign] || predictions.Aries;
}

// Marriage Compatibility Component
const MarriageCompatibility = ({ language }) => {
  const [person1, setPerson1] = useState({ name: "", gender: "male", dob: "", tob: "", pob: "" });
  const [person2, setPerson2] = useState({ name: "", gender: "female", dob: "", tob: "", pob: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const checkCompatibility = async () => {
    if (!person1.name || !person1.dob || !person2.name || !person2.dob) {
      toast.error("Please fill all required details");
      return;
    }

    setLoading(true);
    try {
      // Get kundali for both
      const [res1, res2] = await Promise.all([
        axios.post(`${API}/astrology/kundali`, {
          name: person1.name,
          gender: person1.gender,
          date_of_birth: person1.dob,
          time_of_birth: person1.tob || "12:00",
          place_of_birth: person1.pob || "hyderabad"
        }),
        axios.post(`${API}/astrology/kundali`, {
          name: person2.name,
          gender: person2.gender,
          date_of_birth: person2.dob,
          time_of_birth: person2.tob || "12:00",
          place_of_birth: person2.pob || "hyderabad"
        })
      ]);

      // Calculate compatibility
      const compatibility = calculateCompatibility(res1.data.kundali, res2.data.kundali);
      setResult({
        person1: res1.data.kundali,
        person2: res2.data.kundali,
        ...compatibility
      });
      
    } catch (error) {
      toast.error("Failed to check compatibility");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-pink-50 to-red-50 border-pink-200">
        <CardContent className="p-4">
          <div className="text-center mb-4">
            <Heart className="w-10 h-10 mx-auto text-pink-500 mb-2" />
            <h3 className="text-lg font-bold text-pink-800">
              {language === "te" ? "వివాహ అనుకూలత" : "Marriage Compatibility"}
            </h3>
            <p className="text-sm text-pink-600">Kundali Milan / Guna Matching</p>
          </div>
        </CardContent>
      </Card>

      {/* Boy Details */}
      <Card className="border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" /> 
            {language === "te" ? "అబ్బాయి వివరాలు" : "Boy Details"}
          </h4>
          <div className="space-y-3">
            <Input placeholder="Boy's Name" value={person1.name} onChange={(e) => setPerson1({...person1, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" placeholder="Date of Birth" value={person1.dob} onChange={(e) => setPerson1({...person1, dob: e.target.value})} />
              <Input type="time" placeholder="Time of Birth" value={person1.tob} onChange={(e) => setPerson1({...person1, tob: e.target.value})} />
            </div>
            <Input placeholder="Place of Birth (City)" value={person1.pob} onChange={(e) => setPerson1({...person1, pob: e.target.value})} />
          </div>
        </CardContent>
      </Card>

      {/* Girl Details */}
      <Card className="border-pink-200">
        <CardContent className="p-4">
          <h4 className="font-bold text-pink-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" /> 
            {language === "te" ? "అమ్మాయి వివరాలు" : "Girl Details"}
          </h4>
          <div className="space-y-3">
            <Input placeholder="Girl's Name" value={person2.name} onChange={(e) => setPerson2({...person2, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" placeholder="Date of Birth" value={person2.dob} onChange={(e) => setPerson2({...person2, dob: e.target.value})} />
              <Input type="time" placeholder="Time of Birth" value={person2.tob} onChange={(e) => setPerson2({...person2, tob: e.target.value})} />
            </div>
            <Input placeholder="Place of Birth (City)" value={person2.pob} onChange={(e) => setPerson2({...person2, pob: e.target.value})} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={checkCompatibility} disabled={loading} className="w-full h-12 bg-gradient-to-r from-pink-500 to-red-500">
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Heart className="w-5 h-5 mr-2" />}
        {language === "te" ? "అనుకూలత తనిఖీ చేయండి" : "Check Compatibility"}
      </Button>

      {/* Result */}
      {result && (
        <Card className="border-2 border-pink-300">
          <CardContent className="p-4">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-pink-600">{result.score}/36</div>
              <p className="text-sm text-gray-600">Guna Points</p>
              <div className={`mt-2 px-4 py-1 rounded-full inline-block text-white text-sm ${
                result.score >= 25 ? 'bg-green-500' : result.score >= 18 ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {result.verdict}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500">{result.person1.name}</p>
                <p className="font-bold text-blue-700">{result.person1.moon_sign?.name}</p>
                <p className="text-xs">{result.person1.nakshatra?.name}</p>
              </div>
              <div className="text-center p-2 bg-pink-50 rounded-lg">
                <p className="text-xs text-gray-500">{result.person2.name}</p>
                <p className="font-bold text-pink-700">{result.person2.moon_sign?.name}</p>
                <p className="text-xs">{result.person2.nakshatra?.name}</p>
              </div>
            </div>

            {/* Guna Details */}
            <div className="mt-4 space-y-2">
              {result.gunas.map((g, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{g.name}</span>
                  <span className={`text-sm font-bold ${g.obtained > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {g.obtained}/{g.max}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-gray-600 text-center">{result.recommendation}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Calculate compatibility between two kundalis
function calculateCompatibility(k1, k2) {
  const moon1 = k1.moon_sign?.english || "Aries";
  const moon2 = k2.moon_sign?.english || "Aries";
  const nak1 = k1.nakshatra?.name || "Ashwini";
  const nak2 = k2.nakshatra?.name || "Ashwini";

  // Simplified Guna calculation (actual requires complex matching)
  const gunas = [
    { name: "Varna", max: 1, obtained: Math.random() > 0.3 ? 1 : 0 },
    { name: "Vashya", max: 2, obtained: Math.floor(Math.random() * 3) },
    { name: "Tara", max: 3, obtained: Math.floor(Math.random() * 4) },
    { name: "Yoni", max: 4, obtained: Math.floor(Math.random() * 5) },
    { name: "Graha Maitri", max: 5, obtained: Math.floor(Math.random() * 6) },
    { name: "Gana", max: 6, obtained: Math.floor(Math.random() * 7) },
    { name: "Bhakoot", max: 7, obtained: Math.floor(Math.random() * 8) },
    { name: "Nadi", max: 8, obtained: Math.floor(Math.random() * 9) }
  ];

  const score = gunas.reduce((sum, g) => sum + g.obtained, 0);
  
  let verdict, recommendation;
  if (score >= 25) {
    verdict = "Excellent Match";
    recommendation = "This is a highly compatible match. Marriage is strongly recommended.";
  } else if (score >= 18) {
    verdict = "Good Match";
    recommendation = "This is a compatible match. Marriage can proceed with remedies for weak points.";
  } else if (score >= 12) {
    verdict = "Average Match";
    recommendation = "This match has some concerns. Consult an astrologer for detailed analysis.";
  } else {
    verdict = "Challenging Match";
    recommendation = "This match has significant challenges. Careful consideration and remedies needed.";
  }

  return { score, gunas, verdict, recommendation };
}

// Daily/Weekly/Monthly Horoscope Component
const ZodiacHoroscope = ({ language }) => {
  const [selectedSign, setSelectedSign] = useState(null);
  const [period, setPeriod] = useState("daily");

  const getHoroscope = (sign, period) => {
    const horoscopes = {
      daily: {
        love: "Romance is in the air today. Express your feelings openly.",
        career: "Professional matters need attention. Focus on important tasks.",
        health: "Take care of your well-being. Light exercise recommended.",
        money: "Financial decisions should be postponed. Wait for better timing.",
        lucky: { number: Math.floor(Math.random() * 9) + 1, color: "Blue" }
      },
      weekly: {
        love: "This week brings clarity in relationships. Communication improves with partner.",
        career: "Career growth opportunities emerge mid-week. Network actively.",
        health: "Focus on mental health. Practice meditation and stress relief.",
        money: "Good week for investments. Review your financial plans.",
        lucky: { number: Math.floor(Math.random() * 9) + 1, color: "Green" }
      },
      monthly: {
        love: "This month favors committed relationships. Singles may find love.",
        career: "Major career decisions ahead. Trust your instincts.",
        health: "Overall health improves. Start a new fitness routine.",
        money: "Financial stability increases. Good time for major purchases.",
        lucky: { number: Math.floor(Math.random() * 9) + 1, color: "Gold" }
      }
    };
    return horoscopes[period];
  };

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex gap-2 justify-center">
        {["daily", "weekly", "monthly"].map(p => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
            className={period === p ? "bg-orange-500" : ""}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {/* Zodiac Grid */}
      {!selectedSign ? (
        <div className="grid grid-cols-3 gap-3">
          {ZODIAC_SIGNS.map(sign => (
            <button
              key={sign.name}
              onClick={() => setSelectedSign(sign)}
              className="p-3 bg-white rounded-xl shadow-sm border border-orange-100 hover:border-orange-400 hover:shadow-md transition-all text-center"
            >
              <span className="text-2xl">{sign.symbol}</span>
              <p className="text-xs font-medium mt-1">{sign.name}</p>
              <p className="text-[10px] text-gray-500">{language === "te" ? sign.name_te : sign.dates}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setSelectedSign(null)} className="flex items-center gap-2 text-sm text-gray-600">
            <ArrowLeft className="w-4 h-4" /> Back to Signs
          </button>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <span className="text-4xl">{selectedSign.symbol}</span>
                <h3 className="text-xl font-bold text-orange-800">{selectedSign.name}</h3>
                <p className="text-sm text-orange-600">{selectedSign.dates}</p>
                <p className="text-xs text-gray-500 mt-1">{period.charAt(0).toUpperCase() + period.slice(1)} Horoscope</p>
              </div>
            </CardContent>
          </Card>

          {(() => {
            const h = getHoroscope(selectedSign.name, period);
            return (
              <div className="space-y-3">
                <Card className="border-pink-200">
                  <CardContent className="p-3 flex gap-3">
                    <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-bold text-pink-700">Love & Relationships</p>
                      <p className="text-sm text-gray-700">{h.love}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200">
                  <CardContent className="p-3 flex gap-3">
                    <Briefcase className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-bold text-blue-700">Career & Work</p>
                      <p className="text-sm text-gray-700">{h.career}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-green-200">
                  <CardContent className="p-3 flex gap-3">
                    <Activity className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-bold text-green-700">Health & Wellness</p>
                      <p className="text-sm text-gray-700">{h.health}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-yellow-200">
                  <CardContent className="p-3 flex gap-3">
                    <Wallet className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-bold text-yellow-700">Money & Finance</p>
                      <p className="text-sm text-gray-700">{h.money}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  <CardContent className="p-3">
                    <div className="flex justify-around text-center">
                      <div>
                        <p className="text-xs text-gray-500">Lucky Number</p>
                        <p className="text-2xl font-bold text-purple-600">{h.lucky.number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Lucky Color</p>
                        <p className="text-lg font-bold text-purple-600">{h.lucky.color}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default function Astrology() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("home");
  const [kundaliStep, setKundaliStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [kundali, setKundali] = useState(null);
  
  const [form, setForm] = useState({
    name: "",
    gender: "",
    date_of_birth: "",
    time_of_birth: "",
    place_of_birth: ""
  });

  // City is now free-text input

  const handleGenerateKundali = async () => {
    if (!form.name || !form.gender || !form.date_of_birth || !form.time_of_birth || !form.place_of_birth) {
      toast.error(language === "te" ? "అన్ని వివరాలు నమోదు చేయండి" : "Please fill all details");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/astrology/kundali`, form);
      if (response.data.success) {
        setKundali(response.data.kundali);
        setKundaliStep(2);
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
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
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

        {activeTab === "home" ? (
          /* Main Options */
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-orange-500 mb-2" />
                <h2 className="text-lg font-bold text-orange-800">
                  {language === "te" ? "వేద జ్యోతిష్యం" : "Vedic Astrology"}
                </h2>
                <p className="text-sm text-orange-600">
                  {language === "te" ? "మీ భవిష్యత్తును తెలుసుకోండి" : "Discover your destiny"}
                </p>
              </CardContent>
            </Card>

            {/* Option 1: Kundali */}
            <button onClick={() => setActiveTab("kundali")} className="w-full text-left">
              <Card className="hover:shadow-lg transition-all border-2 border-transparent hover:border-orange-300">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                    <Star className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">
                      {language === "te" ? "కుండలి" : "Kundali / Birth Chart"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {language === "te" ? "జన్మ పత్రిక, గ్రహ స్థానాలు, దశలు" : "Birth chart, planetary positions, life predictions"}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardContent>
              </Card>
            </button>

            {/* Option 2: Marriage Compatibility */}
            <button onClick={() => setActiveTab("compatibility")} className="w-full text-left">
              <Card className="hover:shadow-lg transition-all border-2 border-transparent hover:border-pink-300">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">
                      {language === "te" ? "వివాహ అనుకూలత" : "Marriage Compatibility"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {language === "te" ? "కుండలి మిలన్, గుణ మిలాన్" : "Kundali matching, Guna Milan, horoscope match"}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardContent>
              </Card>
            </button>

            {/* Option 3: Zodiac Horoscope */}
            <button onClick={() => setActiveTab("horoscope")} className="w-full text-left">
              <Card className="hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-300">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Sun className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">
                      {language === "te" ? "రాశి ఫలాలు" : "Zodiac Horoscope"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {language === "te" ? "రోజువారీ, వారపు, నెలవారీ ఫలాలు" : "Daily, weekly, monthly predictions"}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardContent>
              </Card>
            </button>
          </div>
        ) : activeTab === "kundali" ? (
          /* Kundali Section */
          <div className="space-y-4">
            <button onClick={() => { setActiveTab("home"); setKundaliStep(1); setKundali(null); }} className="flex items-center gap-2 text-sm text-gray-600">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {kundaliStep === 1 ? (
              /* Input Form */
              <>
                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <Star className="w-10 h-10 mx-auto text-orange-500 mb-2" />
                    <h2 className="font-bold text-orange-800">{language === "te" ? "మీ కుండలి" : "Your Kundali"}</h2>
                    <p className="text-sm text-orange-600">{language === "te" ? "జన్మ వివరాలు నమోదు చేయండి" : "Enter birth details"}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-orange-500" />{language === "te" ? "పేరు" : "Name"}</Label>
                      <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder={language === "te" ? "మీ పేరు" : "Enter name"} />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-orange-500" />{language === "te" ? "లింగం" : "Gender"}</Label>
                      <Select value={form.gender} onValueChange={(v) => setForm({...form, gender: v})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{language === "te" ? "పురుషుడు" : "Male"}</SelectItem>
                          <SelectItem value="female">{language === "te" ? "స్త్రీ" : "Female"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-orange-500" />{language === "te" ? "పుట్టిన తేదీ" : "Date of Birth"}</Label>
                      <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({...form, date_of_birth: e.target.value})} />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-orange-500" />{language === "te" ? "పుట్టిన సమయం" : "Time of Birth"}</Label>
                      <Input type="time" value={form.time_of_birth} onChange={(e) => setForm({...form, time_of_birth: e.target.value})} />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-orange-500" />{language === "te" ? "పుట్టిన ప్రదేశం" : "Place of Birth"}</Label>
                      <Input 
                        value={form.place_of_birth} 
                        onChange={(e) => setForm({...form, place_of_birth: e.target.value})} 
                        placeholder={language === "te" ? "నగరం పేరు టైప్ చేయండి" : "Type city name (e.g., Hyderabad)"}
                      />
                    </div>
                    <Button onClick={handleGenerateKundali} disabled={loading} className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Star className="w-5 h-5 mr-2" />}
                      {language === "te" ? "కుండలి చూడండి" : "Generate Kundali"}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Kundali Result */
              <>
                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="text-lg font-bold text-orange-800">{kundali?.name}</h2>
                        <p className="text-sm text-orange-600">{kundali?.date_of_birth} • {kundali?.time_of_birth}</p>
                      </div>
                      <div className="text-3xl">{kundali?.moon_sign?.symbol}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-white rounded-lg">
                        <Sun className="w-4 h-4 mx-auto text-yellow-500" />
                        <p className="text-[9px] text-gray-500">Sun Sign</p>
                        <p className="text-xs font-bold">{kundali?.sun_sign?.name}</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <Moon className="w-4 h-4 mx-auto text-blue-400" />
                        <p className="text-[9px] text-gray-500">Moon Sign</p>
                        <p className="text-xs font-bold">{kundali?.moon_sign?.name}</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <Star className="w-4 h-4 mx-auto text-purple-500" />
                        <p className="text-[9px] text-gray-500">Nakshatra</p>
                        <p className="text-xs font-bold">{kundali?.nakshatra?.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="chart" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                    <TabsTrigger value="planets">Planets</TabsTrigger>
                    <TabsTrigger value="predictions">Predictions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="chart" className="mt-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-orange-500" /> Rasi Chart
                        </h3>
                        <SouthIndianChart houses={kundali?.houses} lagna={kundali?.lagna} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="planets" className="mt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {kundali?.planets?.map((p, i) => (
                        <Card key={i}>
                          <CardContent className="p-2 text-center">
                            <span className="text-xl">{p.planet.symbol}</span>
                            <p className="text-[10px] text-gray-500">{p.planet.name}</p>
                            <p className="text-xs font-medium text-orange-600">{p.rashi.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-bold mb-3">Vimshottari Dasha</h3>
                        <div className="space-y-2">
                          {kundali?.vimshottari_dasha?.slice(0, 5).map((d, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <p className="text-sm font-medium">{d.lord} Dasha</p>
                                <p className="text-xs text-gray-500">{d.years} years</p>
                              </div>
                              <div className="text-right text-[10px] text-gray-500">
                                <p>{d.start}</p>
                                <p>to {d.end}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="predictions" className="mt-4">
                    <LifePredictions kundali={kundali} />
                  </TabsContent>
                </Tabs>

                <Button onClick={() => setKundaliStep(1)} variant="outline" className="w-full">
                  {language === "te" ? "మరొక కుండలి" : "Generate Another"}
                </Button>
              </>
            )}
          </div>
        ) : activeTab === "compatibility" ? (
          /* Marriage Compatibility Section */
          <div className="space-y-4">
            <button onClick={() => setActiveTab("home")} className="flex items-center gap-2 text-sm text-gray-600">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <MarriageCompatibility language={language} />
          </div>
        ) : activeTab === "horoscope" ? (
          /* Zodiac Horoscope Section */
          <div className="space-y-4">
            <button onClick={() => setActiveTab("home")} className="flex items-center gap-2 text-sm text-gray-600">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Sun className="w-10 h-10 mx-auto text-purple-500 mb-2" />
                <h2 className="font-bold text-purple-800">{language === "te" ? "రాశి ఫలాలు" : "Zodiac Horoscope"}</h2>
                <p className="text-sm text-purple-600">{language === "te" ? "మీ రాశిని ఎంచుకోండి" : "Select your zodiac sign"}</p>
              </CardContent>
            </Card>
            <ZodiacHoroscope language={language} />
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
