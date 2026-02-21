import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  BarChart3,
  Users,
  Activity,
  TrendingUp,
  Eye,
  Clock,
  MapPin,
  Smartphone,
  Globe,
  RefreshCw,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Zap,
  Target,
  Download
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AnalyticsDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("7");
  const [analytics, setAnalytics] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedTab, setSelectedTab] = useState("overview");
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, activeRes] = await Promise.all([
        axios.get(`${API}/analytics/admin/summary?days=${period}`, { headers }),
        axios.get(`${API}/analytics/admin/active-users?hours=24`, { headers })
      ]);
      
      setAnalytics(summaryRes.data);
      setActiveUsers(activeRes.data?.active_users || []);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const exportData = async () => {
    try {
      const res = await axios.get(`${API}/analytics/admin/export?days=${period}`, { headers });
      
      // Create downloadable JSON
      const dataStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-export-${period}days.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTrendIcon = (current, previous) => {
    if (!previous || current === previous) return <Minus className="h-4 w-4 text-gray-400" />;
    if (current > previous) return <ArrowUp className="h-4 w-4 text-green-500" />;
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Track user behavior, feature usage, and engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold">{analytics?.unique_active_users || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last {period} days
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold">{analytics?.total_events?.toLocaleString() || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Page views + Actions + Features
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Page Views</p>
                <p className="text-3xl font-bold">
                  {analytics?.event_breakdown?.page_view?.toLocaleString() || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Unique page visits
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Feature Uses</p>
                <p className="text-3xl font-bold">
                  {analytics?.event_breakdown?.feature_usage?.toLocaleString() || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Feature interactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Target className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2">
            <Eye className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Active Users
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Daily Active Users Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Active Users</CardTitle>
              <CardDescription>User engagement over time</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.daily_active_users?.length > 0 ? (
                <div className="space-y-2">
                  {analytics.daily_active_users.slice(-7).map((day, idx) => {
                    const maxUsers = Math.max(...analytics.daily_active_users.map(d => d.active_users));
                    const percentage = (day.active_users / maxUsers) * 100;
                    
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-24 text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-12 text-sm font-medium text-right">{day.active_users}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No data available for this period
                </p>
              )}
            </CardContent>
          </Card>

          {/* Event Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {analytics?.event_breakdown && Object.entries(analytics.event_breakdown).map(([type, count]) => (
                  <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {type.replace(/_/g, ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feature Popularity</CardTitle>
              <CardDescription>Most used app features</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.feature_popularity?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.feature_popularity.map((feature, idx) => {
                    const maxCount = analytics.feature_popularity[0]?.usage_count || 1;
                    const percentage = (feature.usage_count / maxCount) * 100;
                    
                    const colors = [
                      'from-blue-500 to-blue-400',
                      'from-green-500 to-green-400',
                      'from-purple-500 to-purple-400',
                      'from-orange-500 to-orange-400',
                      'from-pink-500 to-pink-400',
                      'from-cyan-500 to-cyan-400',
                      'from-red-500 to-red-400',
                      'from-yellow-500 to-yellow-400',
                    ];
                    
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-6 text-sm font-medium text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <span className="w-32 text-sm font-medium capitalize truncate">
                          {feature.feature?.replace(/_/g, ' ')}
                        </span>
                        <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full transition-all flex items-center justify-end pr-3`}
                            style={{ width: `${Math.max(percentage, 10)}%` }}
                          >
                            <span className="text-xs text-white font-medium">
                              {feature.usage_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No feature usage data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Pages</CardTitle>
              <CardDescription>Most visited pages and average time spent</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.top_pages?.length > 0 ? (
                <div className="divide-y">
                  {analytics.top_pages.map((page, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{page.page || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">
                            Avg. {page.avg_duration_seconds || 0}s per visit
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{page.views?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No page view data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Users Tab */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recently Active Users</CardTitle>
              <CardDescription>Users active in the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {activeUsers.length > 0 ? (
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {activeUsers.map((user, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{user.name || 'No name'}</p>
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role || 'user'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.last_active ? new Date(user.last_active).toLocaleTimeString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recently active users
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
