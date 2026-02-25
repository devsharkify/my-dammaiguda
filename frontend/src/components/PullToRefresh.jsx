import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";

export default function PullToRefresh({ children, onRefresh, disabled = false }) {
  const [refreshing, setRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  
  const opacity = useTransform(pullDistance, [0, 60], [0, 1]);
  const scale = useTransform(pullDistance, [0, 60], [0.5, 1]);
  const rotate = useTransform(pullDistance, [0, 60, 120], [0, 180, 360]);
  
  const handleTouchStart = useCallback((e) => {
    if (disabled || refreshing) return;
    const scrollTop = containerRef.current?.scrollTop || 0;
    // Only start pull tracking if already at top of scroll
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = 0;
    }
    setIsPulling(false);
  }, [disabled, refreshing]);
  
  const handleTouchMove = useCallback((e) => {
    if (disabled || refreshing || startY.current === 0) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    
    // If user has scrolled down, disable pull-to-refresh
    if (scrollTop > 0) {
      startY.current = 0;
      pullDistance.set(0);
      setIsPulling(false);
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const diff = (currentY - startY.current) * 0.5;
    
    // Only activate pull-to-refresh when pulling DOWN (positive diff)
    // and only after a significant threshold to avoid interfering with scroll
    if (diff > 10) {
      setIsPulling(true);
      pullDistance.set(Math.min(diff, 120));
      // ONLY prevent default when actively pulling to refresh
      // This allows normal scrolling to work on Android
      if (diff > 20) {
        e.preventDefault();
      }
    } else {
      // Allow normal scroll - don't prevent default
      setIsPulling(false);
      pullDistance.set(0);
    }
  }, [disabled, refreshing, pullDistance]);
  
  const handleTouchEnd = useCallback(async () => {
    if (disabled || refreshing) return;
    
    const distance = pullDistance.get();
    
    if (distance >= 60 && onRefresh && isPulling) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    
    pullDistance.set(0);
    startY.current = 0;
    setIsPulling(false);
  }, [disabled, refreshing, pullDistance, onRefresh, isPulling]);
  
  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }} /* Allow vertical scrolling */
    >
      {/* Pull indicator */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        style={{ 
          y: useTransform(pullDistance, [0, 120], [-40, 20]),
          opacity 
        }}
      >
        <motion.div 
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg"
          style={{ scale }}
        >
          {refreshing ? (
            <RefreshCw className="w-5 h-5 text-white animate-spin" />
          ) : (
            <motion.div style={{ rotate }}>
              <RefreshCw className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
      
      {/* Content */}
      <motion.div
        style={{ 
          y: useTransform(pullDistance, [0, 120], [0, 40]) 
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
