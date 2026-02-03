import { useState, useEffect, useRef } from "react";

interface UseSkeletonMorphOptions {
  /** Duration of the morph transition in ms */
  duration?: number;
  /** Delay before starting the transition */
  delay?: number;
}

interface SkeletonMorphState {
  /** Whether the skeleton should be shown */
  showSkeleton: boolean;
  /** Whether we're in the morphing transition */
  isMorphing: boolean;
  /** Opacity for the skeleton (0-1) */
  skeletonOpacity: number;
  /** Opacity for the content (0-1) */
  contentOpacity: number;
  /** Blur amount for the content during morph */
  contentBlur: number;
}

/**
 * Hook for smooth skeleton-to-content morphing transitions
 * Instead of abrupt content swaps, this provides a smooth fade-blur effect
 */
export function useSkeletonMorph(
  isLoading: boolean,
  options: UseSkeletonMorphOptions = {}
): SkeletonMorphState {
  const { duration = 300, delay = 50 } = options;
  
  const [state, setState] = useState<SkeletonMorphState>({
    showSkeleton: isLoading,
    isMorphing: false,
    skeletonOpacity: isLoading ? 1 : 0,
    contentOpacity: isLoading ? 0 : 1,
    contentBlur: isLoading ? 4 : 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasLoadingRef = useRef(isLoading);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Instant transition for reduced motion
      setState({
        showSkeleton: isLoading,
        isMorphing: false,
        skeletonOpacity: isLoading ? 1 : 0,
        contentOpacity: isLoading ? 0 : 1,
        contentBlur: 0,
      });
      return;
    }

    // Loading -> Not Loading (content arrived)
    if (wasLoadingRef.current && !isLoading) {
      // Start morphing
      setState((prev) => ({
        ...prev,
        isMorphing: true,
      }));

      // Small delay before starting fade
      timeoutRef.current = setTimeout(() => {
        setState({
          showSkeleton: true, // Keep skeleton visible during morph
          isMorphing: true,
          skeletonOpacity: 0,
          contentOpacity: 1,
          contentBlur: 0,
        });

        // Complete morph after duration
        timeoutRef.current = setTimeout(() => {
          setState({
            showSkeleton: false,
            isMorphing: false,
            skeletonOpacity: 0,
            contentOpacity: 1,
            contentBlur: 0,
          });
        }, duration);
      }, delay);
    }

    // Not Loading -> Loading (refetching)
    if (!wasLoadingRef.current && isLoading) {
      setState({
        showSkeleton: true,
        isMorphing: false,
        skeletonOpacity: 1,
        contentOpacity: 0.5,
        contentBlur: 2,
      });
    }

    wasLoadingRef.current = isLoading;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, duration, delay]);

  return state;
}

/**
 * Simple fade transition helper
 */
export function useFadeTransition(show: boolean, duration = 200) {
  const [shouldRender, setShouldRender] = useState(show);
  const [opacity, setOpacity] = useState(show ? 1 : 0);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setOpacity(1);
      });
    } else {
      setOpacity(0);
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [show, duration]);

  return { shouldRender, opacity };
}
