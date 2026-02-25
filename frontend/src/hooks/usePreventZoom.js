import { useEffect } from 'react';

export function usePreventZoom() {
  useEffect(() => {
    // Prevent pinch zoom (only when 2+ fingers AND zooming)
    const preventZoom = (e) => {
      // Only prevent if it's a pinch gesture (2+ touches)
      // Allow single finger scrolling
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent gesture zoom (iOS Safari)
    const preventGesture = (e) => {
      e.preventDefault();
    };

    // Prevent double-tap zoom on buttons and links only
    let lastTouchEnd = 0;
    const preventDoubleTap = (e) => {
      const target = e.target;
      // Only prevent on interactive elements, not during scroll
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }
    };

    // touchstart - only prevent pinch, not scroll
    document.addEventListener('touchstart', preventZoom, { passive: false });
    
    // touchmove - allow scrolling, only prevent pinch zoom
    // Using passive: true to allow smooth scrolling
    const preventPinchOnly = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventPinchOnly, { passive: false });
    
    // Gesture events (iOS)
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    
    // Double tap
    document.addEventListener('touchend', preventDoubleTap, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventPinchOnly);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchend', preventDoubleTap);
    };
  }, []);
}

export default usePreventZoom;
