import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";

export default function PullToRefresh({ children, onRefresh, disabled = false }) {
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  
  const opacity = useTransform(pullDistance, [0, 60], [0, 1]);
  const scale = useTransform(pullDistance, [0, 60], [0.5, 1]);
  const rotate = useTransform(pullDistance, [0, 60, 120], [0, 180, 360]);
  
  const handleTouchStart = useCallback((e) => {
    if (disabled || refreshing) return;
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [disabled, refreshing]);
  
  const handleTouchMove = useCallback((e) => {
    if (disabled || refreshing || startY.current === 0) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) {
      startY.current = 0;
      pullDistance.set(0);
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, (currentY - startY.current) * 0.5);
    
    if (diff > 0) {
      e.preventDefault();
      pullDistance.set(Math.min(diff, 120));
    }
  }, [disabled, refreshing, pullDistance]);
  
  const handleTouchEnd = useCallback(async () => {
    if (disabled || refreshing) return;
    
    const distance = pullDistance.get();
    
    if (distance >= 60 && onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    
    pullDistance.set(0);
    startY.current = 0;
  }, [disabled, refreshing, pullDistance, onRefresh]);
  
  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
