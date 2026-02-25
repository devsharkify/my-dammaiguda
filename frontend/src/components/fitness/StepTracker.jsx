/**
 * Step Tracker Component
 * Real-time step counting using device accelerometer
 * Replaces Google Fit integration for TWA/PWA apps
 */
import { useState, useEffect } from 'react';
import { useStepCounter } from '../../hooks/useStepCounter';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Footprints,
  Play,
  Pause,
  RotateCcw,
  Flame,
  MapPin,
  Activity,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Loader2,
  TrendingUp,
  Target,
  Settings
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Predefined step goals
const STEP_GOALS = [
  { value: 5000, label: '5,000', labelTe: '5,000', description: 'Light activity', descTe: 'తేలికపాటి' },
  { value: 8000, label: '8,000', labelTe: '8,000', description: 'Moderate', descTe: 'మధ్యస్థం' },
  { value: 10000, label: '10,000', labelTe: '10,000', description: 'Recommended', descTe: 'సిఫార్సు' },
  { value: 12000, label: '12,000', labelTe: '12,000', description: 'Active', descTe: 'యాక్టివ్' },
  { value: 15000, label: '15,000', labelTe: '15,000', description: 'Very Active', descTe: 'చాలా యాక్టివ్' },
];

export default function StepTracker({ onDataUpdate, compact = false }) {
  const { language } = useLanguage();
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [todaySteps, setTodaySteps] = useState(0);
  const [stepGoal, setStepGoal] = useState(10000);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState(false);

  const {
    steps,
    isTracking,
    isSupported,
    permissionStatus,
    error,
    pace,
    calories,
    distance,
    isWalking,
    progress,
    startTracking,
    stopTracking,
    resetSteps,
    setInitialSteps,
    requestPermission,
  } = useStepCounter({
    targetSteps: 10000,
    onStep: (data) => {
      if (onDataUpdate) {
        onDataUpdate(data);
      }
    },
  });

  const headers = { Authorization: `Bearer ${token}` };

  // Load today's steps on mount
  useEffect(() => {
    loadTodaySteps();
  }, []);

  const loadTodaySteps = async () => {
    try {
      const res = await axios.get(`${API}/fitness/dashboard`, { headers });
      if (res.data?.today?.steps) {
        setTodaySteps(res.data.today.steps);
        setInitialSteps(res.data.today.steps);
      }
    } catch (err) {
      console.log('Could not load today steps');
    }
  };

  // Auto-save every 100 steps
  useEffect(() => {
    if (steps > 0 && steps % 100 === 0 && isTracking) {
      saveSteps();
    }
  }, [steps]);

  const saveSteps = async () => {
    if (saving || steps === 0) return;
    
    setSaving(true);
    try {
      await axios.post(`${API}/fitness/steps/sync`, {
        steps: steps,
        source: 'phone_pedometer',
        date: new Date().toISOString().split('T')[0]
      }, { headers });
      
      setLastSaved(new Date());
      setTodaySteps(steps);
    } catch (err) {
      console.error('Failed to save steps:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTracking = async () => {
    if (isTracking) {
      stopTracking();
      await saveSteps();
      toast.success(language === 'te' ? 'ట్రాకింగ్ ఆపివేయబడింది' : 'Tracking paused');
    } else {
      const started = await startTracking();
      if (started) {
        toast.success(language === 'te' ? 'స్టెప్ కౌంటర్ ప్రారంభమైంది' : 'Step counter started');
      } else if (permissionStatus === 'denied') {
        toast.error(language === 'te' ? 'సెన్సర్ అనుమతి తిరస్కరించబడింది' : 'Sensor permission denied');
      }
    }
  };

  const handleReset = () => {
    resetSteps();
    setTodaySteps(0);
    toast.info(language === 'te' ? 'స్టెప్స్ రీసెట్ చేయబడ్డాయి' : 'Steps reset');
  };

  // Compact version for dashboard
  if (compact) {
    return (
      <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                isTracking 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse' 
                  : 'bg-gradient-to-br from-blue-500 to-cyan-600'
              }`}>
                <Footprints className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg">{steps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'te' ? 'అడుగులు' : 'steps today'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={isTracking ? "destructive" : "default"}
              onClick={handleToggleTracking}
              disabled={!isSupported}
              className="rounded-full"
            >
              {isTracking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
          <Progress value={progress} className="h-2 mt-3" />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {Math.round(progress)}% {language === 'te' ? 'లక్ష్యం' : 'of 10,000 goal'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className={`h-2 ${isTracking ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} />
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">
              {language === 'te' ? 'స్టెప్ కౌంటర్' : 'Step Counter'}
            </h3>
            {isTracking && (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-xs">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                {language === 'te' ? 'యాక్టివ్' : 'Active'}
              </Badge>
            )}
          </div>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Support Check */}
        {!isSupported ? (
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {language === 'te' 
                ? 'మీ పరికరం మోషన్ సెన్సర్‌లకు మద్దతు ఇవ్వదు' 
                : 'Your device does not support motion sensors'}
            </p>
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              {language === 'te' 
                ? 'సెన్సర్ అనుమతి తిరస్కరించబడింది' 
                : 'Sensor permission denied'}
            </p>
            <Button size="sm" onClick={requestPermission}>
              {language === 'te' ? 'మళ్ళీ ప్రయత్నించండి' : 'Try Again'}
            </Button>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center h-28 w-28 rounded-full ${
                isWalking 
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100 ring-4 ring-green-200 animate-pulse' 
                  : 'bg-gradient-to-br from-blue-100 to-cyan-100'
              }`}>
                <div>
                  <p className="text-3xl font-bold text-gray-800">{steps.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{language === 'te' ? 'అడుగులు' : 'steps'}</p>
                </div>
              </div>

              {isWalking && (
                <div className="mt-2">
                  <Badge className="bg-green-500 text-white animate-bounce">
                    {language === 'te' ? 'నడుస్తున్నారు...' : 'Walking...'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{language === 'te' ? 'రోజువారీ లక్ష్యం' : 'Daily Goal'}</span>
                <span className="font-medium">{steps.toLocaleString()} / 10,000</span>
              </div>
              <Progress value={progress} className="h-3" />
              {progress >= 100 && (
                <p className="text-center text-sm text-green-600 mt-2 font-medium">
                  🎉 {language === 'te' ? 'లక్ష్యం చేరుకున్నారు!' : 'Goal reached!'}
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-3 rounded-xl bg-orange-50">
                <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-orange-600">{calories}</p>
                <p className="text-xs text-orange-400">{language === 'te' ? 'కేలరీలు' : 'calories'}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-blue-50">
                <MapPin className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-blue-600">{(distance / 1000).toFixed(2)}</p>
                <p className="text-xs text-blue-400">km</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-purple-50">
                <TrendingUp className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-purple-600">{pace}</p>
                <p className="text-xs text-purple-400">{language === 'te' ? 'పేస్/నిమి' : 'steps/min'}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button
                className={`flex-1 h-12 rounded-xl font-semibold ${
                  isTracking 
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                } text-white`}
                onClick={handleToggleTracking}
              >
                {isTracking ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    {language === 'te' ? 'ఆపివేయి' : 'Pause'}
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    {language === 'te' ? 'ప్రారంభించు' : 'Start'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={handleReset}
                disabled={steps === 0}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            {/* Last saved indicator */}
            {lastSaved && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
                {language === 'te' ? 'సేవ్ చేయబడింది' : 'Saved'} {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </>
        )}

        {/* Info */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-700">
            💡 {language === 'te' 
              ? 'మీ ఫోన్ సెన్సర్‌లను ఉపయోగించి అడుగులు లెక్కించబడతాయి. ఉత్తమ ఫలితాల కోసం ఫోన్‌ను మీ జేబులో ఉంచండి.' 
              : 'Steps are counted using your phone sensors. Keep phone in your pocket for best results.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
