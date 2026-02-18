import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  BarChart2,
  CheckCircle,
  Users,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Minus
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Polls() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingPoll, setVotingPoll] = useState(null);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await axios.get(`${API}/polls`);
      setPolls(response.data);
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    if (!user) {
      toast.error(language === "te" ? "ఓటు వేయడానికి లాగిన్ అవ్వండి" : "Login to vote");
      return;
    }

    setVotingPoll(pollId);
    try {
      await axios.post(`${API}/polls/${pollId}/vote`, {
        option_index: optionIndex
      });
      toast.success(language === "te" ? "మీ ఓటు నమోదు అయింది!" : "Your vote has been recorded!");
      fetchPolls();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to vote");
    } finally {
      setVotingPoll(null);
    }
  };

  const getOptionIcon = (index, pollType) => {
    if (pollType === "yes_no") {
      if (index === 0) return <ThumbsUp className="h-5 w-5" />;
      if (index === 1) return <ThumbsDown className="h-5 w-5" />;
      return <Minus className="h-5 w-5" />;
    }
    return null;
  };

  const getOptionColor = (index, pollType) => {
    if (pollType === "yes_no") {
      if (index === 0) return "bg-green-500";
      if (index === 1) return "bg-red-500";
      return "bg-gray-500";
    }
    const colors = ["bg-primary", "bg-secondary", "bg-blue-500", "bg-purple-500", "bg-yellow-500"];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "పోల్స్" : "Polls"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "పోల్స్ & సర్వేలు" : "Polls & Surveys"}>
      <div className="space-y-6" data-testid="polls">
        {/* Info Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 className="h-8 w-8" />
            <h1 className="font-heading text-2xl font-bold">
              {language === "te" ? "మీ అభిప్రాయం ముఖ్యం" : "Your Opinion Matters"}
            </h1>
          </div>
          <p className="text-white/80">
            {language === "te"
              ? "పోల్స్‌లో పాల్గొని మీ వార్డు గురించి నిర్ణయాలలో భాగస్వామి అవ్వండి"
              : "Participate in polls and be part of decisions about your ward"}
          </p>
        </div>

        {/* Polls List */}
        {polls.length === 0 ? (
          <div className="text-center py-12">
            <BarChart2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-text-muted">
              {language === "te" ? "ప్రస్తుతం పోల్స్ లేవు" : "No active polls right now"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => (
              <Card key={poll.id} className="border-border/50" data-testid={`poll-${poll.id}`}>
                <CardContent className="p-5">
                  {/* Question */}
                  <h2 className="font-heading text-lg font-semibold text-text-primary mb-1">
                    {language === "te" ? poll.question_te : poll.question}
                  </h2>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {poll.poll_type === "yes_no" 
                        ? (language === "te" ? "అవును/కాదు" : "Yes/No")
                        : poll.poll_type === "rating"
                        ? (language === "te" ? "రేటింగ్" : "Rating")
                        : (language === "te" ? "ఎంపిక" : "Choice")}
                    </Badge>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {poll.total_votes} {language === "te" ? "ఓట్లు" : "votes"}
                    </span>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {(language === "te" ? poll.options_te : poll.options).map((option, idx) => {
                      const voteCount = poll.votes?.[idx.toString()] || 0;
                      const percentage = poll.total_votes > 0 
                        ? Math.round((voteCount / poll.total_votes) * 100) 
                        : 0;
                      
                      return (
                        <div key={idx} className="space-y-2">
                          <Button
                            variant="outline"
                            onClick={() => handleVote(poll.id, idx)}
                            disabled={votingPoll === poll.id}
                            className="w-full h-auto py-3 px-4 justify-start text-left relative overflow-hidden"
                            data-testid={`poll-option-${poll.id}-${idx}`}
                          >
                            {/* Background progress */}
                            <div 
                              className={`absolute inset-0 ${getOptionColor(idx, poll.poll_type)} opacity-20 transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                            
                            <div className="relative flex items-center justify-between w-full gap-3">
                              <div className="flex items-center gap-3">
                                {poll.poll_type === "yes_no" && (
                                  <div className={`h-8 w-8 rounded-full ${
                                    idx === 0 ? "bg-green-100 text-green-600" :
                                    idx === 1 ? "bg-red-100 text-red-600" :
                                    "bg-gray-100 text-gray-600"
                                  } flex items-center justify-center`}>
                                    {getOptionIcon(idx, poll.poll_type)}
                                  </div>
                                )}
                                <span className="font-medium">{option}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-text-muted">
                                  {voteCount}
                                </span>
                                <span className="font-bold text-primary">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Poll Info */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {poll.end_date 
                        ? `${language === "te" ? "ముగుస్తుంది:" : "Ends:"} ${new Date(poll.end_date).toLocaleDateString()}`
                        : (language === "te" ? "ఓపెన్ పోల్" : "Open poll")}
                    </span>
                    {poll.is_active && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {language === "te" ? "యాక్టివ్" : "Active"}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Anonymous voting note */}
        <Card className="bg-muted/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-text-muted">
              {language === "te"
                ? "🔒 మీ ఓటు అనామకంగా నమోదు చేయబడుతుంది"
                : "🔒 Your vote is recorded anonymously"}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
