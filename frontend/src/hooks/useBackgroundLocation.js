/**
 * Background Location Hook
 * Enables location sharing even when app is closed
 * Uses Service Worker + Background Sync API
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export function useBackgroundLocation() {
  const { token } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState('unknown'); // unknown, granted, denied, prompt
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Check support and current permission status
  useEffect(() => {
    checkSupport();
    checkPermission();
    checkBackgroundStatus();
  }, []);

  const checkSupport = () => {
    const supported = 
      'geolocation' in navigator &&
      'serviceWorker' in navigator &&
      'Notification' in window;
    setIsSupported(supported);
  };

  const checkPermission = async () => {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(result.state);
        
        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
        });
      }
    } catch (e) {
      console.log('Permission query not supported');
    }
  };

  const checkBackgroundStatus = () => {
    const enabled = localStorage.getItem('background_location_enabled') === 'true';
    setBackgroundEnabled(enabled);
  };

  // Request location permission with "always" option
  const requestPermission = useCallback(async () => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      // Request location - this triggers the permission prompt
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPermissionStatus('granted');
          resolve(position);
        },
        (error) => {
          if (error.code === 1) {
            setPermissionStatus('denied');
          }
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, []);

  // Enable background location sharing
  const enableBackgroundLocation = useCallback(async () => {
    try {
      // First, request location permission
      await requestPermission();

      // Request notification permission (needed for background sync on some platforms)
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Register for background sync
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Send token to service worker
        registration.active?.postMessage({
          type: 'ENABLE_BACKGROUND_LOCATION',
          token: token
        });

        // Try to register background sync
        if ('sync' in registration) {
          try {
            await registration.sync.register('sync-location');
            console.log('Background sync registered');
          } catch (e) {
            console.log('Background sync registration failed:', e);
          }
        }

        // Try periodic background sync (more reliable)
        if ('periodicSync' in registration) {
          try {
            const status = await navigator.permissions.query({
              name: 'periodic-background-sync'
            });
            
            if (status.state === 'granted') {
              await registration.periodicSync.register('sync-location', {
                minInterval: 15 * 60 * 1000 // 15 minutes
              });
              console.log('Periodic background sync registered');
            }
          } catch (e) {
            console.log('Periodic sync not available:', e);
          }
        }
      }

      // Save preference
      localStorage.setItem('background_location_enabled', 'true');
      setBackgroundEnabled(true);
      
      return true;
    } catch (error) {
      console.error('Failed to enable background location:', error);
      return false;
    }
  }, [token, requestPermission]);

  // Disable background location
  const disableBackgroundLocation = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: 'DISABLE_BACKGROUND_LOCATION'
        });

        // Unregister periodic sync
        if ('periodicSync' in registration) {
          try {
            await registration.periodicSync.unregister('sync-location');
          } catch (e) {
            console.log('Failed to unregister periodic sync');
          }
        }
      }

      localStorage.setItem('background_location_enabled', 'false');
      setBackgroundEnabled(false);
      return true;
    } catch (error) {
      console.error('Failed to disable background location:', error);
      return false;
    }
  }, []);

  // Request immediate location update
  const requestLocationNow = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: 'REQUEST_LOCATION_NOW'
      });
    }
  }, []);

  return {
    permissionStatus,
    backgroundEnabled,
    isSupported,
    requestPermission,
    enableBackgroundLocation,
    disableBackgroundLocation,
    requestLocationNow
  };
}

export default useBackgroundLocation;
