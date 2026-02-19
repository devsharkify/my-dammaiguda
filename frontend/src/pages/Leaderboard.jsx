import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import {
  Trophy,
  Medal,
  Award,
  Star,
  Zap,
  Target,
  Flame,
  Crown,
  ChevronUp,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle,
  Sparkles,
  Loader2
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Leaderboard() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leaderRes, statsRes] = await Promise.all([
        axios.get(`${API}/education/leaderboard?limit=50`),
        axios.get(`${API}/education/my-stats`, { headers }).catch(() => ({ data: null }))
      ]);
      
      setLeaderboard(leaderRes.data.leaderboard || []);
      setMyStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case "Expert": return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "Advanced": return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      case "Intermediate": return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
      default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getLevelProgress = () => {
    if (!myStats) return 0;
    return (myStats.xp_progress / 200) * 100;
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "లీడర్‌బోర్డ్" : "Leaderboard"}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "లీడర్‌బోర్డ్" : "Leaderboard"}>
      <div className="space-y-4 pb-20" data-testid="leaderboard-page">
        
        {/* My Stats Card */}
        {myStats && (
          <Card className="border-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden">
            <CardContent className="p-5 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
              
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      {language === "te" ? "మీ స్టాటస్" : "Your Status"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-bold">Level {myStats.level}</span>
                      <Badge className={`${getBadgeColor(myStats.badge)} text-xs`}>
                        {myStats.badge}
                      </Badge>
                    </div>
                    <p className="text-white/80 text-sm mt-1">
                      Rank #{myStats.rank} • {myStats.total_xp} XP
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Trophy className="h-8 w-8" />
                  </div>
                </div>
                
                {/* XP Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-white/80 mb-1">
                    <span>Level {myStats.level}</span>
                    <span>{myStats.xp_progress}/200 XP to Level {myStats.level + 1}</span>
                  </div>
                  <Progress value={getLevelProgress()} className="h-2 bg-white/20 [&>div]:bg-white" />
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="text-center p-2 rounded-lg bg-white/10">
                    <BookOpen className="h-4 w-4 mx-auto mb-1" />
                    <p className="text-lg font-bold">{myStats.courses_completed}</p>
                    <p className="text-[10px] text-white/70">Courses</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/10">
                    <CheckCircle className="h-4 w-4 mx-auto mb-1" />
                    <p className="text-lg font-bold">{myStats.quizzes_passed}</p>
                    <p className="text-[10px] text-white/70">Quizzes</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/10">
                    <Award className="h-4 w-4 mx-auto mb-1" />
                    <p className="text-lg font-bold">{myStats.certificates_earned}</p>
                    <p className="text-[10px] text-white/70">Certs</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/10">
                    <Clock className="h-4 w-4 mx-auto mb-1" />
                    <p className="text-lg font-bold">{myStats.total_watch_time_hours}h</p>
                    <p className="text-[10px] text-white/70">Watch</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* XP Guide */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-amber-500" />
              {language === "te" ? "XP ఎలా సంపాదించాలి" : "How to Earn XP"}
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-muted/50">
                <GraduationCap className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="font-bold text-blue-600">+100 XP</p>
                <p className="text-muted-foreground">Complete Course</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="font-bold text-green-600">+20 XP</p>
                <p className="text-muted-foreground">Pass Quiz</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Award className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <p className="font-bold text-purple-600">+50 XP</p>
                <p className="text-muted-foreground">Get Certificate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              {language === "te" ? "టాప్ లర్నర్స్" : "Top Learners"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                <p>{language === "te" ? "ఇంకా రికార్డులు లేవు" : "No records yet"}</p>
                <p className="text-xs mt-1">Start learning to appear on the leaderboard!</p>
              </div>
            ) : (
              <div className="divide-y">
                {/* Top 3 Special Display */}
                <div className="grid grid-cols-3 gap-2 p-4 bg-gradient-to-b from-amber-50 to-transparent dark:from-amber-900/10">
                  {[1, 0, 2].map((idx) => {
                    const entry = leaderboard[idx];
                    if (!entry) return <div key={idx} />;
                    const isFirst = idx === 0;
                    return (
                      <div 
                        key={entry.user_id} 
                        className={`text-center ${isFirst ? 'order-first col-span-1 -mt-2' : ''}`}
                      >
                        <div className={`mx-auto mb-2 rounded-full flex items-center justify-center ${
                          isFirst ? 'h-16 w-16 bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg' :
                          idx === 1 ? 'h-12 w-12 bg-gradient-to-br from-gray-300 to-gray-400' :
                          'h-12 w-12 bg-gradient-to-br from-amber-600 to-orange-600'
                        }`}>
                          {getRankIcon(entry.rank)}
                        </div>
                        <p className={`font-semibold truncate ${isFirst ? 'text-sm' : 'text-xs'}`}>
                          {entry.user_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.xp} XP</p>
                        <Badge className={`mt-1 text-[10px] ${getBadgeColor(entry.badge)}`}>
                          {entry.badge}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                {/* Rest of Leaderboard */}
                {leaderboard.slice(3).map((entry) => (
                  <div 
                    key={entry.user_id}
                    className={`flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors ${
                      entry.user_id === user?.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                    data-testid={`leaderboard-entry-${entry.rank}`}
                  >
                    <div className="w-8 text-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary">
                      {entry.user_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {entry.user_name}
                          {entry.user_id === user?.id && (
                            <span className="text-primary ml-1">(You)</span>
                          )}
                        </p>
                        <Badge className={`text-[10px] ${getBadgeColor(entry.badge)}`}>
                          {entry.badge}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <GraduationCap className="h-3 w-3" />
                          {entry.courses_completed} courses
                        </span>
                        <span className="flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3" />
                          {entry.quizzes_passed} quizzes
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-primary">{entry.xp}</p>
                      <p className="text-[10px] text-muted-foreground">XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievement Badges */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              {language === "te" ? "బ్యాడ్జ్ స్థాయిలు" : "Badge Levels"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { badge: "Expert", xp: "1000+", color: "from-purple-500 to-pink-500" },
                { badge: "Advanced", xp: "500-999", color: "from-blue-500 to-cyan-500" },
                { badge: "Intermediate", xp: "200-499", color: "from-green-500 to-emerald-500" },
                { badge: "Beginner", xp: "0-199", color: "from-gray-400 to-gray-500" }
              ].map((level) => (
                <div key={level.badge} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center`}>
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{level.badge}</p>
                    <p className="text-xs text-muted-foreground">{level.xp} XP</p>
                  </div>
                  {myStats?.badge === level.badge && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
