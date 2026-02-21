import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Eye,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  Loader2,
  Trash2,
  Check,
  X,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const METRIC_ICONS = {
  active_users: Users,
  page_views: Eye,
  login_attempts: Activity,
  feature_usage: Zap,
  errors: AlertCircle
};

const SEVERITY_COLORS = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-blue-500 text-white"
};

const SEVERITY_BORDER = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-blue-500"
};

export default function AlertsPanel() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [unackCount, setUnackCount] = useState(0);
  const [config, setConfig] = useState(null);
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [selectedTab, setSelectedTab] = useState("alerts");
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [checking, setChecking] = useState(false);
  
  const wsRef = useRef(null);
  const audioRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
    connectWebSocket();
    
    // Create audio element for alert sound
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQAAAAA=");
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      const [alertsRes, configRes, metricsRes] = await Promise.all([
        axios.get(`${API}/analytics/alerts/?limit=50`, { headers }),
        axios.get(`${API}/analytics/alerts/config`, { headers }),
        axios.get(`${API}/analytics/alerts/metrics/current`, { headers })
      ]);
      
      setAlerts(alertsRes.data.alerts || []);
      setUnackCount(alertsRes.data.unacknowledged_count || 0);
      setConfig(configRes.data);
      setCurrentMetrics(metricsRes.data.metrics);
    } catch (err) {
      console.error("Failed to fetch alerts data:", err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const wsUrl = `${API.replace('https://', 'wss://').replace('http://', 'ws://')}/analytics/alerts/ws?token=${token}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setConnected(true);
        console.log("Alerts WebSocket connected");
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "new_alert") {
          setAlerts(prev => [data.alert, ...prev]);
          setUnackCount(prev => prev + 1);
          
          // Play sound
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          
          // Show toast
          toast.warning(data.alert.message, {
            description: `Severity: ${data.alert.severity.toUpperCase()}`,
            duration: 10000
          });
        } else if (data.type === "alert_acknowledged") {
          setAlerts(prev => prev.map(a => 
            a.id === data.alert_id ? { ...a, acknowledged: true } : a
          ));
          setUnackCount(prev => Math.max(0, prev - 1));
        } else if (data.type === "connected") {
          setUnackCount(data.unacknowledged_count || 0);
        }
      };
      
      wsRef.current.onclose = () => {
        setConnected(false);
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current.onerror = () => {
        setConnected(false);
      };
    } catch (err) {
      console.error("WebSocket error:", err);
    }
  };

  const triggerCheck = async () => {
    setChecking(true);
    try {
      const res = await axios.post(`${API}/analytics/alerts/check`, {}, { headers });
      toast.success(`Check complete: ${res.data.alerts_generated} alerts generated`);
      fetchData();
    } catch (err) {
      toast.error("Failed to trigger check");
    } finally {
      setChecking(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await axios.post(`${API}/analytics/alerts/${alertId}/acknowledge`, {}, { headers });
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, acknowledged: true } : a
      ));
      setUnackCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error("Failed to acknowledge alert");
    }
  };

  const acknowledgeAll = async () => {
    try {
      const res = await axios.post(`${API}/analytics/alerts/acknowledge-all`, {}, { headers });
      toast.success(`${res.data.acknowledged_count} alerts acknowledged`);
      setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
      setUnackCount(0);
    } catch (err) {
      toast.error("Failed to acknowledge alerts");
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await axios.delete(`${API}/analytics/alerts/${alertId}`, { headers });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success("Alert deleted");
    } catch (err) {
      toast.error("Failed to delete alert");
    }
  };

  const updateConfig = async () => {
    try {
      await axios.put(`${API}/analytics/alerts/config`, config, { headers });
      toast.success("Configuration saved");
    } catch (err) {
      toast.error("Failed to save configuration");
    }
  };

  const updateThreshold = (index, field, value) => {
    const updated = { ...config };
    updated.thresholds[index][field] = value;
    setConfig(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="alerts-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-primary" />
            {unackCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unackCount > 9 ? "9+" : unackCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">Real-Time Alerts</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {connected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">Disconnected</span>
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute alerts" : "Unmute alerts"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={triggerCheck} disabled={checking}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Check Now</span>
          </Button>
          {unackCount > 0 && (
            <Button variant="outline" size="sm" onClick={acknowledgeAll}>
              <Check className="h-4 w-4 mr-2" />
              Acknowledge All
            </Button>
          )}
        </div>
      </div>

      {/* Current Metrics Overview */}
      {currentMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(currentMetrics).map(([metric, data]) => {
            const Icon = METRIC_ICONS[metric] || Activity;
            const isElevated = data.status === "elevated";
            const isReduced = data.status === "reduced";
            
            return (
              <Card key={metric} className={`${isElevated ? 'border-orange-300' : isReduced ? 'border-blue-300' : ''}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {metric.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xl font-bold">{data.current}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${isElevated ? 'text-orange-500' : isReduced ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    {data.change_percentage > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : data.change_percentage < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : null}
                    <span className={data.change_percentage > 0 ? 'text-green-600' : data.change_percentage < 0 ? 'text-red-600' : ''}>
                      {data.change_percentage > 0 ? '+' : ''}{data.change_percentage}%
                    </span>
                    <span className="text-muted-foreground">vs baseline ({data.baseline_avg})</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="font-semibold text-lg">All Clear!</h3>
                <p className="text-muted-foreground">No alerts at this time. System is operating normally.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alert.alert_type === "spike" ? TrendingUp : 
                           alert.alert_type === "drop" ? TrendingDown : AlertCircle;
                
                return (
                  <Card key={alert.id} className={`border-l-4 ${SEVERITY_BORDER[alert.severity]} ${alert.acknowledged ? 'opacity-60' : ''}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${SEVERITY_COLORS[alert.severity]}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={SEVERITY_COLORS[alert.severity]}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {alert.metric.replace(/_/g, ' ')}
                              </Badge>
                              {alert.acknowledged && (
                                <Badge variant="secondary">
                                  <Check className="h-3 w-3 mr-1" />
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">{alert.message}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(alert.created_at).toLocaleString()}
                              </span>
                              <span>
                                Current: <strong>{alert.current_value}</strong> | 
                                Baseline: <strong>{alert.baseline_value.toFixed(1)}</strong> | 
                                Change: <strong className={alert.change_percentage > 0 ? 'text-red-600' : 'text-blue-600'}>
                                  {alert.change_percentage > 0 ? '+' : ''}{alert.change_percentage}%
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!alert.acknowledged && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => acknowledgeAlert(alert.id)}
                              title="Acknowledge"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAlert(alert.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>
                Configure when alerts should be triggered based on metric changes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {config?.thresholds?.map((threshold, idx) => {
                const Icon = METRIC_ICONS[threshold.metric] || Activity;
                
                return (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    
                    <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                      <div>
                        <Label className="text-xs text-muted-foreground">Metric</Label>
                        <p className="font-medium capitalize">{threshold.metric.replace(/_/g, ' ')}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <Select
                          value={threshold.threshold_type}
                          onValueChange={(v) => updateThreshold(idx, 'threshold_type', v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spike">Spike (% increase)</SelectItem>
                            <SelectItem value="drop">Drop (% decrease)</SelectItem>
                            <SelectItem value="absolute">Absolute (count)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {threshold.threshold_type === 'absolute' ? 'Count' : 'Percentage'}
                        </Label>
                        <Input
                          type="number"
                          value={threshold.value}
                          onChange={(e) => updateThreshold(idx, 'value', parseFloat(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Time Window</Label>
                        <Select
                          value={threshold.time_window_minutes.toString()}
                          onValueChange={(v) => updateThreshold(idx, 'time_window_minutes', parseInt(v))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Switch
                      checked={threshold.enabled}
                      onCheckedChange={(v) => updateThreshold(idx, 'enabled', v)}
                    />
                  </div>
                );
              })}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Notification Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">WebSocket (Real-time)</p>
                      <p className="text-sm text-muted-foreground">Get instant alerts in this dashboard</p>
                    </div>
                    <Switch
                      checked={config?.notify_websocket}
                      onCheckedChange={(v) => setConfig({ ...config, notify_websocket: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                    </div>
                    <Switch
                      checked={config?.notify_push}
                      onCheckedChange={(v) => setConfig({ ...config, notify_push: v })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={updateConfig} className="w-full">
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
