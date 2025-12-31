import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
  animateOnMount?: boolean;
}

export function AnimatedNumber({
  value,
  duration = 800,
  formatFn = (v) => v.toFixed(0),
  className,
  animateOnMount = false,
}: AnimatedNumberProps) {
  // Initialize with 0 if animating on mount, otherwise start at the actual value
  const [displayValue, setDisplayValue] = useState(animateOnMount ? 0 : value);
  const previousValue = useRef(animateOnMount ? 0 : value);
  const animationRef = useRef<number | undefined>(undefined);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Skip if value hasn't changed and we've already animated
    if (previousValue.current === value && hasAnimated.current) {
      return;
    }

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = startValue + (endValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
        hasAnimated.current = true;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span className={className}>{formatFn(displayValue)}</span>;
}
