import { useRef, useEffect, type RefObject } from "react";

const MIN_SWIPE_DISTANCE = 50;
const MAX_SWIPE_TIME = 500;
const DIRECTION_LOCK_THRESHOLD = 8;

interface UseSwipeNavigationOptions<T extends string> {
  views: readonly T[];
  currentView: T;
  onViewChange: (view: T) => void;
  minDistance?: number;
}

interface SwipeHandlers {
  ref: RefObject<HTMLElement | null>;
}

export function useSwipeNavigation<T extends string>({
  views,
  currentView,
  onViewChange,
  minDistance = MIN_SWIPE_DISTANCE,
}: UseSwipeNavigationOptions<T>): SwipeHandlers {
  const containerRef = useRef<HTMLElement | null>(null);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const hasLockedDirection = useRef<boolean>(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

      if (
        !hasLockedDirection.current &&
        (absDeltaX > DIRECTION_LOCK_THRESHOLD || absDeltaY > DIRECTION_LOCK_THRESHOLD)
      ) {
        isHorizontalSwipe.current = absDeltaX > absDeltaY * 1.2;
        hasLockedDirection.current = true;
      }

      if (isHorizontalSwipe.current) {
        touchCurrentX.current = touch.clientX;
      }
    };

    const handleTouchEnd = () => {
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
        onViewChange(views[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        onViewChange(views[currentIndex - 1]);
      }
    };

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
  }, [views, currentView, onViewChange, minDistance]);

  return {
    ref: containerRef,
  };
}
