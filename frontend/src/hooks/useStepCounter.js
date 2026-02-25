/**
 * Accelerometer-based Step Counter Hook
 * Uses device motion events to detect walking/running steps
 * Works on TWA/PWA apps that have access to device sensors
 */
import { useState, useEffect, useRef, useCallback } from 'react';

// Step detection configuration
const CONFIG = {
  // Minimum acceleration magnitude to consider as a step
  stepThreshold: 1.2,
  // Maximum acceleration magnitude (to filter out noise/shakes)
  maxThreshold: 8.0,
  // Minimum time between steps (in ms) - prevents double counting
  minStepInterval: 250,
  // Maximum time between steps to be in "walking mode" (in ms)
  maxStepInterval: 2000,
  // Window size for smoothing acceleration data
  smoothingWindow: 3,
  // Calibration samples needed
  calibrationSamples: 20,
};

export function useStepCounter(options = {}) {
  const {
    enabled = true,
    onStep = null,
    autoStart = false,
    targetSteps = 10000,
  } = options;

  // State
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown'); // unknown, granted, denied, requesting
  const [error, setError] = useState(null);
  const [pace, setPace] = useState(0); // steps per minute
  const [calories, setCalories] = useState(0);
  const [distance, setDistance] = useState(0); // in meters
  const [isWalking, setIsWalking] = useState(false);

  // Refs for tracking
  const lastStepTimeRef = useRef(0);
  const accelerationBufferRef = useRef([]);
  const calibrationRef = useRef({ samples: [], baseline: 0, calibrated: false });
  const stepsInLastMinuteRef = useRef([]);
  const sessionStartRef = useRef(null);
  const totalStepsRef = useRef(0);

  // Check if device motion is supported
  useEffect(() => {
    const checkSupport = () => {
      if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
        setIsSupported(true);
        
        // Check if permission API is available (iOS 13+)
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          setPermissionStatus('unknown');
        } else {
          // Android and older iOS - permission granted by default
          setPermissionStatus('granted');
        }
      } else {
        setIsSupported(false);
        setError('Device motion not supported on this device');
      }
    };

    checkSupport();
  }, []);

  // Calculate magnitude of acceleration vector
  const calculateMagnitude = useCallback((x, y, z) => {
    return Math.sqrt(x * x + y * y + z * z);
  }, []);

  // Smooth acceleration data using moving average
  const smoothAcceleration = useCallback((magnitude) => {
    accelerationBufferRef.current.push(magnitude);
    if (accelerationBufferRef.current.length > CONFIG.smoothingWindow) {
      accelerationBufferRef.current.shift();
    }
    const sum = accelerationBufferRef.current.reduce((a, b) => a + b, 0);
    return sum / accelerationBufferRef.current.length;
  }, []);

  // Detect step from acceleration data
  const detectStep = useCallback((event) => {
    const { accelerationIncludingGravity } = event;
    if (!accelerationIncludingGravity) return;

    const { x, y, z } = accelerationIncludingGravity;
    if (x === null || y === null || z === null) return;

    const magnitude = calculateMagnitude(x, y, z);
    const smoothedMagnitude = smoothAcceleration(magnitude);

    // Calibration phase - establish baseline
    if (!calibrationRef.current.calibrated) {
      calibrationRef.current.samples.push(smoothedMagnitude);
      if (calibrationRef.current.samples.length >= CONFIG.calibrationSamples) {
        const sum = calibrationRef.current.samples.reduce((a, b) => a + b, 0);
        calibrationRef.current.baseline = sum / calibrationRef.current.samples.length;
        calibrationRef.current.calibrated = true;
      }
      return;
    }

    // Calculate deviation from baseline (gravity-compensated)
    const deviation = Math.abs(smoothedMagnitude - calibrationRef.current.baseline);
    const now = Date.now();
    const timeSinceLastStep = now - lastStepTimeRef.current;

    // Step detection logic
    if (
      deviation > CONFIG.stepThreshold &&
      deviation < CONFIG.maxThreshold &&
      timeSinceLastStep > CONFIG.minStepInterval
    ) {
      lastStepTimeRef.current = now;
      totalStepsRef.current += 1;
      
      setSteps(totalStepsRef.current);
      setIsWalking(true);

      // Track steps for pace calculation
      stepsInLastMinuteRef.current.push(now);
      
      // Remove steps older than 1 minute
      const oneMinuteAgo = now - 60000;
      stepsInLastMinuteRef.current = stepsInLastMinuteRef.current.filter(t => t > oneMinuteAgo);
      
      // Calculate pace (steps per minute)
      setPace(stepsInLastMinuteRef.current.length);

      // Estimate distance (average stride length: 0.75m)
      const strideLength = 0.75; // meters
      setDistance(totalStepsRef.current * strideLength);

      // Estimate calories (rough: 0.04 cal per step for average person)
      setCalories(Math.round(totalStepsRef.current * 0.04));

      // Callback
      if (onStep) {
        onStep({
          steps: totalStepsRef.current,
          pace: stepsInLastMinuteRef.current.length,
          distance: totalStepsRef.current * strideLength,
          calories: Math.round(totalStepsRef.current * 0.04),
        });
      }
    }

    // Check if stopped walking (no step for maxStepInterval)
    if (timeSinceLastStep > CONFIG.maxStepInterval && isWalking) {
      setIsWalking(false);
    }
  }, [calculateMagnitude, smoothAcceleration, onStep, isWalking]);

  // Request permission (iOS 13+)
  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      setPermissionStatus('requesting');
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        setPermissionStatus(permission === 'granted' ? 'granted' : 'denied');
        return permission === 'granted';
      } catch (err) {
        setPermissionStatus('denied');
        setError('Permission denied for motion sensors');
        return false;
      }
    }
    return true;
  }, []);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!isSupported) {
      setError('Device motion not supported');
      return false;
    }

    // Request permission if needed
    if (permissionStatus !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    // Reset calibration for new session
    calibrationRef.current = { samples: [], baseline: 0, calibrated: false };
    accelerationBufferRef.current = [];
    sessionStartRef.current = Date.now();

    // Add event listener
    window.addEventListener('devicemotion', detectStep, true);
    setIsTracking(true);
    setError(null);
    return true;
  }, [isSupported, permissionStatus, requestPermission, detectStep]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    window.removeEventListener('devicemotion', detectStep, true);
    setIsTracking(false);
    setIsWalking(false);
  }, [detectStep]);

  // Reset counter
  const resetSteps = useCallback(() => {
    totalStepsRef.current = 0;
    stepsInLastMinuteRef.current = [];
    setSteps(0);
    setPace(0);
    setCalories(0);
    setDistance(0);
  }, []);

  // Set initial steps (for resuming from saved data)
  const setInitialSteps = useCallback((initialSteps) => {
    totalStepsRef.current = initialSteps;
    setSteps(initialSteps);
    setDistance(initialSteps * 0.75);
    setCalories(Math.round(initialSteps * 0.04));
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && enabled && isSupported && permissionStatus === 'granted') {
      startTracking();
    }
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [autoStart, enabled, isSupported, permissionStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', detectStep, true);
    };
  }, [detectStep]);

  return {
    // State
    steps,
    isTracking,
    isSupported,
    permissionStatus,
    error,
    pace,
    calories,
    distance,
    isWalking,
    progress: Math.min((steps / targetSteps) * 100, 100),
    
    // Actions
    startTracking,
    stopTracking,
    resetSteps,
    setInitialSteps,
    requestPermission,
  };
}

export default useStepCounter;
