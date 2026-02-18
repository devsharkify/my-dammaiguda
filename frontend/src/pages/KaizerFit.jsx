import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Activity,
  Footprints,
  Trophy,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  Medal,
  ChevronRight
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function KaizerFit() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [myStats, setMyStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [wardStats, setWardStats] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState("");
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, leaderRes, wardRes, challengesRes] = await Promise.all([
        axios.get(`${API}/fitness/my-stats?days=7`).catch(() => ({ data: null })),
        axios.get(`${API}/fitness/leaderboard`).catch(() => ({ data: [] })),
        axios.get(`${API}/fitness/ward-stats`).catch(() => ({ data: null })),
        axios.get(`${API}/challenges`).catch(() => ({ data: [] }))
      ]);
      
      setMyStats(statsRes.data);
      setLeaderboard(leaderRes.data);
      setWardStats(wardRes.data);
      setChallenges(challengesRes.data);
    } catch (error) {
      console.error("Error fetching fitness data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logSteps = async () => {
    if (!steps || parseInt(steps) <= 0) {
      toast.error(language === "te" ? "చెల్లుబాటు అయ్యే అడుగులు నమోదు చేయండి" : "Enter valid steps");
      return;
    }

    setLogLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await axios.post(`${API}/fitness/log`, {
        steps: parseInt(steps),
        date: today
      });
      
      toast.success(language === "te" ? "అడుగులు నమోదు చేయబడ్డాయి!" : "Steps logged!");
      setSteps("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to log steps");
    } finally {
      setLogLoading(false);
    }
  };

  const joinChallenge = async (challengeId) => {
    try {
      await axios.post(`${API}/challenges/${challengeId}/join`);
      toast.success(language === "te" ? "ఛాలెంజ్‌లో చేరారు!" : "Joined challenge!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to join challenge");
    }
  };

  // Calculate fitness score color
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "కైజర్ ఫిట్" : "Kaizer Fit"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "కైజర్ ఫిట్" : "Kaizer Fit"}>
      <div className="space-y-6" data-testid="kaizer-fit">
        {/* Header Stats */}
        <Card className="bg-gradient-to-br from-primary to-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Activity className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">
                    {language === "te" ? "ఈ వారం" : "This Week"}
                  </p>
                  <p className="text-3xl font-bold">
                    {myStats?.total_steps?.toLocaleString() || 0}
                  </p>
                  <p className="text-white/80 text-sm">
                    {language === "te" ? "అడుగులు" : "steps"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold ${getScoreColor(myStats?.average_score || 0)}`}>
                  {myStats?.average_score || 0}
                </p>
                <p className="text-white/80 text-sm">
                  {language === "te" ? "ఫిట్‌నెస్ స్కోర్" : "Fitness Score"}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-white/80">
                <span>{language === "te" ? "వారపు లక్ష్యం (70,000)" : "Weekly Goal (70,000)"}</span>
                <span>{Math.min(100, Math.round((myStats?.total_steps || 0) / 70000 * 100))}%</span>
              </div>
              <Progress 
                value={Math.min(100, Math.round((myStats?.total_steps || 0) / 70000 * 100))} 
                className="h-2 bg-white/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Log Steps */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-text-primary mb-3">
              {language === "te" ? "ఈ రోజు అడుగులు నమోదు చేయండి" : "Log Today's Steps"}
            </h3>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={language === "te" ? "అడుగులు" : "Steps"}
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="h-12"
                data-testid="steps-input"
              />
              <Button
                onClick={logSteps}
                disabled={logLoading}
                className="h-12 px-6 bg-primary text-white rounded-full"
                data-testid="log-steps-btn"
              >
                {logLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pollution Alert */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">
                {language === "te" ? "కాలుష్య హెచ్చరిక" : "Pollution Alert"}
              </p>
              <p className="text-sm text-orange-700 mt-1">
                {language === "te"
                  ? "డంప్ యార్డ్ దగ్గర బయటి వ్యాయామం నివారించండి. ఉదయం 6-7 మధ్య వ్యాయామం చేయడం మంచిది."
                  : "Avoid outdoor exercise near dump yard. Best time for exercise is 6-7 AM."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="leaderboard" className="text-sm">
              {language === "te" ? "టాప్ 10" : "Top 10"}
            </TabsTrigger>
            <TabsTrigger value="challenges" className="text-sm">
              {language === "te" ? "ఛాలెంజ్‌లు" : "Challenges"}
            </TabsTrigger>
            <TabsTrigger value="ward" className="text-sm">
              {language === "te" ? "వార్డు" : "Ward"}
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-4 space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-text-muted">
                  {language === "te" ? "లీడర్‌బోర్డ్ ఇంకా లేదు" : "No leaderboard data yet"}
                </p>
              </div>
            ) : (
              leaderboard.map((entry, idx) => (
                <Card 
                  key={idx} 
                  className={`border-border/50 ${idx < 3 ? "bg-gradient-to-r from-amber-50 to-white" : ""}`}
                  data-testid={`leaderboard-${idx}`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? "bg-yellow-400 text-yellow-900" :
                      idx === 1 ? "bg-gray-300 text-gray-700" :
                      idx === 2 ? "bg-amber-600 text-amber-100" :
                      "bg-muted text-text-muted"
                    }`}>
                      {idx < 3 ? <Medal className="h-5 w-5" /> : entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{entry.name}</p>
                      {entry.colony && (
                        <p className="text-xs text-text-muted">{entry.colony}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {entry.total_steps.toLocaleString()}
                      </p>
                      <p className="text-xs text-text-muted">
                        {entry.days_active} {language === "te" ? "రోజులు" : "days"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="mt-4 space-y-3">
            {challenges.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-text-muted">
                  {language === "te" ? "ఛాలెంజ్‌లు ఇంకా లేవు" : "No challenges yet"}
                </p>
              </div>
            ) : (
              challenges.map((challenge) => (
                <Card key={challenge.id} className="border-border/50" data-testid={`challenge-${challenge.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary">
                          {language === "te" ? challenge.name_te : challenge.name}
                        </h3>
                        <p className="text-sm text-text-muted mt-1">
                          {language === "te" ? challenge.description_te : challenge.description}
                        </p>
                      </div>
                      <Badge className="bg-primary/10 text-primary">
                        {challenge.participants} {language === "te" ? "మంది" : "joined"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Target className="h-4 w-4" />
                        {challenge.target_steps.toLocaleString()} {language === "te" ? "అడుగులు" : "steps"}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => joinChallenge(challenge.id)}
                        className="bg-secondary text-white rounded-full"
                        data-testid={`join-challenge-${challenge.id}`}
                      >
                        {language === "te" ? "చేరండి" : "Join"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Ward Stats Tab */}
          <TabsContent value="ward" className="mt-4 space-y-3">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-text-primary mb-4 text-center">
                  {language === "te" ? "దమ్మాయిగూడ వార్డు గణాంకాలు" : "Dammaiguda Ward Statistics"}
                </h3>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="h-14 w-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {wardStats?.participants || 0}
                    </p>
                    <p className="text-xs text-text-muted">
                      {language === "te" ? "భాగస్వాములు" : "Participants"}
                    </p>
                  </div>
                  
                  <div>
                    <div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                      <Footprints className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {wardStats?.total_steps?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-text-muted">
                      {language === "te" ? "మొత్తం అడుగులు" : "Total Steps"}
                    </p>
                  </div>
                  
                  <div>
                    <div className="h-14 w-14 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {wardStats?.average_steps_per_person?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-text-muted">
                      {language === "te" ? "సగటు అడుగులు" : "Avg Steps"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
