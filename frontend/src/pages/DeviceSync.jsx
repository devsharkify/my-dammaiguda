import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import {
  Watch,
  Smartphone,
  Bluetooth,
  Heart,
  Footprints,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Wifi,
  Settings,
  Loader2,
  Link as LinkIcon,
  Unlink
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Supported device types
const DEVICE_TYPES = [
  {
    id: "apple_watch",
    name: "Apple Watch",
    icon: "⌚",
    platform: "ios",
    description: "Sync via Apple Health on iPhone",
    color: "from-gray-800 to-gray-900"
  },
  {
    id: "fitbit",
    name: "Fitbit",
    icon: "💙",
    platform: "all",
    description: "Connect your Fitbit account",
    color: "from-teal-500 to-cyan-600"
  },
  {
    id: "samsung_galaxy",
    name: "Samsung Galaxy Watch",
    icon: "⌚",
    platform: "android",
    description: "Sync via Samsung Health",
    color: "from-blue-600 to-indigo-700"
  },
  {
    id: "noise",
    name: "Noise/boAt",
    icon: "🎧",
    platform: "all",
    description: "Connect via Bluetooth",
    color: "from-red-500 to-orange-600"
  },
  {
    id: "google_fit",
    name: "Google Fit",
    icon: "🏃",
    platform: "android",
    description: "Sync via Health Connect",
    color: "from-green-500 to-emerald-600"
  },
  {
    id: "mi_band",
    name: "Mi Band / Amazfit",
    icon: "📱",
    platform: "all",
    description: "Connect via Zepp app",
    color: "from-orange-500 to-yellow-600"
  }
];

export default function DeviceSync() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    // Check Bluetooth support
    if (navigator.bluetooth) {
      setBluetoothSupported(true);
    }
    fetchConnectedDevices();
  }, []);

  const fetchConnectedDevices = async () => {
    try {
      const res = await axios.get(`${API}/fitness/devices`, { headers });
      setConnectedDevices(res.data.devices || []);
      setLastSyncTime(res.data.last_sync);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectDevice = async (deviceType) => {
    // Platform-specific connection logic
    const device = DEVICE_TYPES.find(d => d.id === deviceType);
    
    if (device.platform === "ios" && !isIOS()) {
      toast.info(language === "te" 
        ? "ఈ పరికరానికి iPhone అవసరం" 
        : "This device requires an iPhone");
      return;
    }
    
    if (device.platform === "android" && !isAndroid()) {
      toast.info(language === "te" 
        ? "ఈ పరికరానికి Android అవసరం" 
        : "This device requires an Android phone");
      return;
    }

    // Try Web Bluetooth for compatible devices
    if (bluetoothSupported && ["noise", "mi_band"].includes(deviceType)) {
      try {
        await connectViaBluetooth(deviceType);
        return;
      } catch (error) {
        console.log("Bluetooth connection failed, trying alternative method");
      }
    }

    // For other devices, show instructions
    toast.info(language === "te" 
      ? `${device.name} యాప్‌లో మీ ఖాతాను కనెక్ట్ చేయండి` 
      : `Please connect your account in the ${device.name} app first, then sync here`);
    
    // Register device connection intent
    try {
      await axios.post(`${API}/fitness/devices/connect`, {
        device_type: deviceType,
        device_name: device.name
      }, { headers });
      
      // Simulate connection for demo
      setConnectedDevices(prev => [...prev, {
        id: Date.now().toString(),
        device_type: deviceType,
        device_name: device.name,
        connected_at: new Date().toISOString(),
        status: "connected"
      }]);
      
      toast.success(language === "te" 
        ? `${device.name} కనెక్ట్ అయింది!` 
        : `${device.name} connected!`);
    } catch (error) {
      toast.error("Failed to connect device");
    }
  };

  const connectViaBluetooth = async (deviceType) => {
    try {
      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: ['battery_service'] },
          { namePrefix: 'Mi' },
          { namePrefix: 'Noise' },
          { namePrefix: 'boAt' }
        ],
        optionalServices: ['heart_rate', 'battery_service']
      });
      
      toast.success(`Connected to ${device.name}`);
      
      // Connect to GATT server
      const server = await device.gatt.connect();
      
      // Try to get heart rate service
      try {
        const heartRateService = await server.getPrimaryService('heart_rate');
        const heartRateChar = await heartRateService.getCharacteristic('heart_rate_measurement');
        
        // Listen for heart rate notifications
        await heartRateChar.startNotifications();
        heartRateChar.addEventListener('characteristicvaluechanged', handleHeartRateChange);
        
        toast.success(language === "te" 
          ? "హృదయ స్పందన మానిటరింగ్ ప్రారంభమైంది" 
          : "Heart rate monitoring started");
      } catch (e) {
        console.log("Heart rate service not available");
      }
      
      // Register device
      await axios.post(`${API}/fitness/devices/connect`, {
        device_type: deviceType,
        device_name: device.name,
        bluetooth_id: device.id
      }, { headers });
      
      fetchConnectedDevices();
      
    } catch (error) {
      if (error.name === 'NotFoundError') {
        toast.error(language === "te" 
          ? "పరికరం కనుగొనబడలేదు" 
          : "No device found");
      } else {
        throw error;
      }
    }
  };

  const handleHeartRateChange = (event) => {
    const value = event.target.value;
    const heartRate = value.getUint8(1);
    
    // Send to backend
    axios.post(`${API}/fitness/sync`, {
      heart_rate: heartRate,
      timestamp: new Date().toISOString(),
      source: "bluetooth"
    }, { headers }).catch(console.error);
  };

  const disconnectDevice = async (deviceId) => {
    try {
      await axios.delete(`${API}/fitness/devices/${deviceId}`, { headers });
      setConnectedDevices(prev => prev.filter(d => d.id !== deviceId));
      toast.success(language === "te" ? "పరికరం డిస్‌కనెక్ట్ అయింది" : "Device disconnected");
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  const syncAllDevices = async () => {
    setSyncing(true);
    try {
      const res = await axios.post(`${API}/fitness/sync-all`, {}, { headers });
      setLastSyncTime(new Date().toISOString());
      toast.success(language === "te" 
        ? `${res.data.synced_count || 0} పరికరాలు సింక్ అయ్యాయి` 
        : `Synced ${res.data.synced_count || 0} devices`);
      fetchConnectedDevices();
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = () => /Android/.test(navigator.userAgent);

  const getDeviceStatus = (deviceType) => {
    const connected = connectedDevices.find(d => d.device_type === deviceType);
    return connected ? "connected" : "disconnected";
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "పరికరాలు" : "Devices"}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">{language === "te" ? "లోడ్ అవుతోంది..." : "Loading..."}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "పరికరాలు & సింక్" : "Devices & Sync"}>
      <div className="space-y-4 pb-6" data-testid="device-sync-page">
        
        {/* Sync Status Card */}
        <Card className="border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  {language === "te" ? "సింక్ స్థితి" : "Sync Status"}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {connectedDevices.length} {language === "te" ? "కనెక్ట్ అయ్యాయి" : "Connected"}
                </p>
                {lastSyncTime && (
                  <p className="text-violet-200 text-xs mt-1">
                    {language === "te" ? "చివరి సింక్:" : "Last sync:"} {new Date(lastSyncTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <Button
                onClick={syncAllDevices}
                disabled={syncing || connectedDevices.length === 0}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                data-testid="sync-all-btn"
              >
                {syncing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            {/* Auto-sync toggle */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
              <span className="text-sm">{language === "te" ? "ఆటో సింక్" : "Auto Sync"}</span>
              <Switch
                checked={autoSync}
                onCheckedChange={setAutoSync}
                className="data-[state=checked]:bg-white/30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bluetooth Status */}
        {bluetoothSupported && (
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Bluetooth className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {language === "te" ? "బ్లూటూత్ అందుబాటులో ఉంది" : "Bluetooth Available"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "te" ? "పరికరాలను నేరుగా కనెక్ట్ చేయవచ్చు" : "Can connect devices directly"}
                </p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Connected Devices */}
        {connectedDevices.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              {language === "te" ? "కనెక్ట్ అయిన పరికరాలు" : "Connected Devices"}
            </h3>
            <div className="space-y-2">
              {connectedDevices.map((device) => {
                const deviceInfo = DEVICE_TYPES.find(d => d.id === device.device_type);
                return (
                  <Card key={device.id} className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${deviceInfo?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-2xl`}>
                        {deviceInfo?.icon || "📱"}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{device.device_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === "te" ? "కనెక్ట్ అయింది" : "Connected"} • {new Date(device.connected_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => disconnectDevice(device.id)}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Devices */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Watch className="h-4 w-4" />
            {language === "te" ? "పరికరాలు కనెక్ట్ చేయండి" : "Connect a Device"}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {DEVICE_TYPES.map((device) => {
              const isConnected = getDeviceStatus(device.id) === "connected";
              return (
                <Card 
                  key={device.id}
                  className={`border-border/50 cursor-pointer hover:shadow-md transition-all ${isConnected ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                  onClick={() => !isConnected && connectDevice(device.id)}
                  data-testid={`device-${device.id}`}
                >
                  <CardContent className="p-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${device.color} flex items-center justify-center text-2xl mb-3`}>
                      {device.icon}
                    </div>
                    <p className="font-medium text-sm">{device.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {device.description}
                    </p>
                    {isConnected ? (
                      <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {language === "te" ? "కనెక్ట్" : "Connected"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-2">
                        {language === "te" ? "కనెక్ట్ చేయండి" : "Tap to Connect"}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <Card className="border-border/50 bg-muted/50">
          <CardContent className="p-4">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              {language === "te" ? "సింక్ ఎలా పని చేస్తుంది" : "How Sync Works"}
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• {language === "te" ? "మీ వాచ్/బ్యాండ్ యాప్‌ను మొదట సెటప్ చేయండి" : "First set up your watch/band app on phone"}</li>
              <li>• {language === "te" ? "హెల్త్ డేటా షేరింగ్ ఎనేబుల్ చేయండి" : "Enable health data sharing in the app"}</li>
              <li>• {language === "te" ? "ఇక్కడ పరికరాన్ని కనెక్ట్ చేసి సింక్ చేయండి" : "Connect device here and sync regularly"}</li>
              <li>• {language === "te" ? "స్టెప్స్, హార్ట్ రేట్, స్లీప్ డేటా సింక్ అవుతుంది" : "Steps, heart rate, sleep data will sync"}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
