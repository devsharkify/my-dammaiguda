import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Convert a base64 string to Uint8Array for push subscription
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Custom hook for managing push notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 
                        'PushManager' in window && 
                        'Notification' in window;
    setSupported(isSupported);
    
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check existing subscription
  useEffect(() => {
    if (!supported) return;
    
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        setSubscription(existingSub);
      } catch (err) {
        console.error('Error checking subscription:', err);
      }
    };
    
    checkSubscription();
  }, [supported]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (token) => {
    if (!supported) {
      setError('Push notifications not supported');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== 'granted') {
        setError('Notification permission denied');
        setLoading(false);
        return false;
      }

      // Get VAPID public key from backend
      const vapidResponse = await axios.get(`${API}/api/notifications/vapid-public-key`);
      const vapidPublicKey = vapidResponse.data.public_key;

      if (!vapidPublicKey) {
        setError('Push notifications not configured on server');
        setLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to backend
      const subscriptionData = {
        endpoint: newSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(newSubscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(newSubscription.getKey('auth'))))
        },
        user_agent: navigator.userAgent
      };

      await axios.post(`${API}/api/notifications/subscribe`, subscriptionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubscription(newSubscription);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Push subscription error:', err);
      setError(err.message || 'Failed to subscribe');
      setLoading(false);
      return false;
    }
  }, [supported]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (token) => {
    if (!subscription) return true;

    setLoading(true);
    setError(null);

    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Notify backend
      await axios.delete(`${API}/api/notifications/subscribe`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubscription(null);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      setError(err.message || 'Failed to unsubscribe');
      setLoading(false);
      return false;
    }
  }, [subscription]);

  /**
   * Send a test notification
   */
  const sendTestNotification = useCallback(async (token) => {
    try {
      const response = await axios.post(`${API}/api/notifications/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (err) {
      console.error('Test notification error:', err);
      throw err;
    }
  }, []);

  return {
    permission,
    subscription,
    loading,
    error,
    supported,
    isSubscribed: !!subscription,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
}

export default usePushNotifications;
