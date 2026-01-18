import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
        return true;
      } catch (e) {
        console.log('[Haptic] Vibration failed:', e);
        return false;
      }
    }
    return false;
  }, []);

  const trigger = useCallback((type: HapticPattern = 'medium') => {
    const patterns: Record<HapticPattern, number | number[]> = {
      light: 10,
      medium: 25,
      heavy: 50,
      success: [10, 50, 10],
      warning: [50, 30, 50],
      error: [100, 50, 100, 50, 100],
      selection: 5,
    };

    return vibrate(patterns[type]);
  }, [vibrate]);

  // Specific haptic patterns for driving events
  const triggerEvent = useCallback((eventType: string, severity: string) => {
    if (severity === 'high') {
      trigger('error');
    } else if (severity === 'medium') {
      trigger('warning');
    } else if (eventType.includes('smooth') || eventType.includes('good')) {
      trigger('success');
    } else {
      trigger('light');
    }
  }, [trigger]);

  const triggerStart = useCallback(() => {
    trigger('success');
  }, [trigger]);

  const triggerStop = useCallback(() => {
    trigger('heavy');
  }, [trigger]);

  return {
    trigger,
    vibrate,
    triggerEvent,
    triggerStart,
    triggerStop,
    isSupported: 'vibrate' in navigator
  };
};
