import { useEffect } from 'react';

/**
 * Minimal zoom prevention - ONLY blocks iOS gesture zoom
 * Does NOT interfere with scrolling or touch events
 */
export function usePreventZoom() {
  useEffect(() => {
    // Only prevent iOS Safari gesture-based zoom
    const preventGesture = (e) => {
      e.preventDefault();
    };

    document.addEventListener('gesturestart', preventGesture);
    document.addEventListener('gesturechange', preventGesture);
    document.addEventListener('gestureend', preventGesture);

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
    };
  }, []);
}

export default usePreventZoom;
