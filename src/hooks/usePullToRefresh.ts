import { useState, useCallback, useRef, type RefObject } from 'react';
import { hapticFeedback } from './useHaptics';

interface UsePullToRefreshOptions {
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void>;
  /** Distance to pull before triggering refresh (px) */
  threshold?: number;
  /** Maximum pull distance (px) */
  maxPull?: number;
}

interface UsePullToRefreshReturn {
  /** Ref to attach to the scrollable container */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Current pull distance (for visual feedback) */
  pullDistance: number;
  /** Whether refresh is in progress */
  isRefreshing: boolean;
  /** Whether threshold has been reached */
  isReady: boolean;
  /** Touch handlers to spread on the container */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

/**
 * Hook for pull-to-refresh functionality
 * Provides native-feeling refresh gesture for mobile
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start pull if at top of scroll
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    if (startY.current === 0) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Only allow pull down (positive diff) when at top
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance for natural feel
      const resistance = 0.4;
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
      
      // Check if ready to refresh
      const ready = distance >= threshold;
      if (ready !== isReady) {
        setIsReady(ready);
        if (ready) {
          hapticFeedback('medium');
        }
      }
    }
  }, [isRefreshing, threshold, maxPull, isReady]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      hapticFeedback('heavy');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    // Reset
    setPullDistance(0);
    setIsReady(false);
    startY.current = 0;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isReady,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}


