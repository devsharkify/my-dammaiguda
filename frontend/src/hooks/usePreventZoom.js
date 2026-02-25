import { useEffect } from 'react';

export function usePreventZoom() {
  useEffect(() => {
    // Prevent pinch zoom
    const preventZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent gesture zoom (iOS)
    const preventGesture = (e) => {
      e.preventDefault();
    };

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    const preventDoubleTap = (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Add listeners
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    document.addEventListener('touchend', preventDoubleTap, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchend', preventDoubleTap);
    };
  }, []);
}

export default usePreventZoom;
