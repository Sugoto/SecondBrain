import { useRef, useCallback } from "react";
import { useViewTransition } from "./useViewTransition";

const MIN_SWIPE_DISTANCE = 80;
const MAX_SWIPE_TIME = 300; // Max time in ms for a valid swipe

interface UseSwipeNavigationOptions<T extends string> {
  views: readonly T[];
  currentView: T;
  onViewChange: (view: T) => void;
  /** Minimum swipe distance in pixels (default: 80) */
  minDistance?: number;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useSwipeNavigation<T extends string>({
  views,
  currentView,
  onViewChange,
  minDistance = MIN_SWIPE_DISTANCE,
}: UseSwipeNavigationOptions<T>): SwipeHandlers {
  const { startTransition } = useViewTransition();
  
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null;
    isHorizontalSwipe.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    
    // Determine if this is a horizontal or vertical swipe on first significant movement
    if (isHorizontalSwipe.current === null && touchStartX.current !== null && touchStartY.current !== null) {
      const deltaX = Math.abs(currentX - touchStartX.current);
      const deltaY = Math.abs(currentY - touchStartY.current);
      
      // Only decide after some movement threshold
      if (deltaX > 10 || deltaY > 10) {
        isHorizontalSwipe.current = deltaX > deltaY;
      }
    }
    
    // Only track horizontal swipes
    if (isHorizontalSwipe.current) {
      touchEndX.current = currentX;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current || !isHorizontalSwipe.current) {
      // Reset refs
      touchStartX.current = null;
      touchStartY.current = null;
      touchEndX.current = null;
      touchStartTime.current = null;
      isHorizontalSwipe.current = null;
      return;
    }

    // Check if swipe was fast enough
    const swipeTime = Date.now() - (touchStartTime.current || 0);
    if (swipeTime > MAX_SWIPE_TIME) {
      touchStartX.current = null;
      touchStartY.current = null;
      touchEndX.current = null;
      touchStartTime.current = null;
      isHorizontalSwipe.current = null;
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minDistance;
    const isRightSwipe = distance < -minDistance;

    const currentIndex = views.indexOf(currentView);

    if (isLeftSwipe && currentIndex < views.length - 1) {
      startTransition(() => onViewChange(views[currentIndex + 1]));
    } else if (isRightSwipe && currentIndex > 0) {
      startTransition(() => onViewChange(views[currentIndex - 1]));
    }

    // Reset refs
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchStartTime.current = null;
    isHorizontalSwipe.current = null;
  }, [views, currentView, onViewChange, startTransition, minDistance]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

