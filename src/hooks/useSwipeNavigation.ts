import { useRef, useCallback, useEffect, RefObject } from "react";
import { useViewTransition } from "./useViewTransition";

const MIN_SWIPE_DISTANCE = 50; // Reduced for easier swiping
const MAX_SWIPE_TIME = 500; // Increased for more forgiving swipe detection
const DIRECTION_LOCK_THRESHOLD = 8; // Reduced threshold for faster direction detection

interface UseSwipeNavigationOptions<T extends string> {
  views: readonly T[];
  currentView: T;
  onViewChange: (view: T) => void;
  /** Minimum swipe distance in pixels (default: 50) */
  minDistance?: number;
  /** Use View Transitions API for swipe navigation (default: true) */
  useViewTransitions?: boolean;
}

interface SwipeHandlers {
  ref: RefObject<HTMLElement | null>;
}

export function useSwipeNavigation<T extends string>({
  views,
  currentView,
  onViewChange,
  minDistance = MIN_SWIPE_DISTANCE,
  useViewTransitions = true,
}: UseSwipeNavigationOptions<T>): SwipeHandlers {
  const { startTransition } = useViewTransition();
  const containerRef = useRef<HTMLElement | null>(null);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const hasLockedDirection = useRef<boolean>(false);

  // Use native event listeners with passive: false to properly capture touch events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Skip if only one view (nothing to swipe to)
    if (views.length <= 1) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchCurrentX.current = touch.clientX;
      touchStartTime.current = Date.now();
      isHorizontalSwipe.current = null;
      hasLockedDirection.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine direction on first significant movement
      if (
        !hasLockedDirection.current &&
        (absDeltaX > DIRECTION_LOCK_THRESHOLD ||
          absDeltaY > DIRECTION_LOCK_THRESHOLD)
      ) {
        // Use angle-based detection: horizontal if angle < 30 degrees from horizontal axis
        // tan(30°) ≈ 0.577, so it's horizontal if deltaY/deltaX < 0.577
        // Or simply: if horizontal distance is significantly greater than vertical
        isHorizontalSwipe.current = absDeltaX > absDeltaY * 1.2;
        hasLockedDirection.current = true;
      }

      // Track horizontal movement
      if (isHorizontalSwipe.current) {
        touchCurrentX.current = touch.clientX;

        // Check if we're at an edge and trying to swipe further
        const currentIndex = views.indexOf(currentView);
        const isAtStart = currentIndex === 0 && deltaX > 0;
        const isAtEnd = currentIndex === views.length - 1 && deltaX < 0;

        // Only prevent default if we can actually navigate
        // This prevents scroll jank when at edges
        if (!isAtStart && !isAtEnd) {
          // Note: We're not calling preventDefault() to allow scroll to continue
          // The swipe will be evaluated on touchEnd
        }
      }
    };

    const handleTouchEnd = () => {
      // Check if this was a valid horizontal swipe
      if (!isHorizontalSwipe.current || !hasLockedDirection.current) {
        return;
      }

      // Check swipe timing
      const swipeTime = Date.now() - touchStartTime.current;
      if (swipeTime > MAX_SWIPE_TIME) {
        return;
      }

      const distance = touchStartX.current - touchCurrentX.current;
      const velocity = Math.abs(distance) / swipeTime;

      // Accept swipe if:
      // 1. Distance is greater than minimum, OR
      // 2. Velocity is high enough (fast flick)
      const isValidDistance = Math.abs(distance) > minDistance;
      const isValidVelocity = velocity > 0.3; // 0.3 px/ms = 300 px/s

      if (!isValidDistance && !isValidVelocity) {
        return;
      }

      const isLeftSwipe = distance > 0;
      const isRightSwipe = distance < 0;
      const currentIndex = views.indexOf(currentView);

      if (isLeftSwipe && currentIndex < views.length - 1) {
        if (useViewTransitions) {
          startTransition(() => onViewChange(views[currentIndex + 1]));
        } else {
          onViewChange(views[currentIndex + 1]);
        }
      } else if (isRightSwipe && currentIndex > 0) {
        if (useViewTransitions) {
          startTransition(() => onViewChange(views[currentIndex - 1]));
        } else {
          onViewChange(views[currentIndex - 1]);
        }
      }
    };

    // Add event listeners with passive: false to allow preventDefault if needed
    // Though we're not using preventDefault currently to avoid scroll issues
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    views,
    currentView,
    onViewChange,
    startTransition,
    minDistance,
    useViewTransitions,
  ]);

  return {
    ref: containerRef,
  };
}

// Legacy export for backwards compatibility - returns empty handlers
// Components should migrate to using the ref-based approach
interface LegacySwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useSwipeNavigationLegacy<T extends string>({
  views,
  currentView,
  onViewChange,
  minDistance = MIN_SWIPE_DISTANCE,
  useViewTransitions = true,
}: UseSwipeNavigationOptions<T>): LegacySwipeHandlers {
  const { startTransition } = useViewTransition();

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const hasLockedDirection = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchCurrentX.current = touch.clientX;
    touchStartTime.current = Date.now();
    isHorizontalSwipe.current = null;
    hasLockedDirection.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (
      !hasLockedDirection.current &&
      (absDeltaX > DIRECTION_LOCK_THRESHOLD ||
        absDeltaY > DIRECTION_LOCK_THRESHOLD)
    ) {
      isHorizontalSwipe.current = absDeltaX > absDeltaY * 1.2;
      hasLockedDirection.current = true;
    }

    if (isHorizontalSwipe.current) {
      touchCurrentX.current = touch.clientX;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isHorizontalSwipe.current || !hasLockedDirection.current) {
      return;
    }

    const swipeTime = Date.now() - touchStartTime.current;
    if (swipeTime > MAX_SWIPE_TIME) {
      return;
    }

    const distance = touchStartX.current - touchCurrentX.current;
    const velocity = Math.abs(distance) / swipeTime;
    const isValidDistance = Math.abs(distance) > minDistance;
    const isValidVelocity = velocity > 0.3;

    if (!isValidDistance && !isValidVelocity) {
      return;
    }

    const isLeftSwipe = distance > 0;
    const isRightSwipe = distance < 0;
    const currentIndex = views.indexOf(currentView);

    if (isLeftSwipe && currentIndex < views.length - 1) {
      if (useViewTransitions) {
        startTransition(() => onViewChange(views[currentIndex + 1]));
      } else {
        onViewChange(views[currentIndex + 1]);
      }
    } else if (isRightSwipe && currentIndex > 0) {
      if (useViewTransitions) {
        startTransition(() => onViewChange(views[currentIndex - 1]));
      } else {
        onViewChange(views[currentIndex - 1]);
      }
    }
  }, [
    views,
    currentView,
    onViewChange,
    startTransition,
    minDistance,
    useViewTransitions,
  ]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}
