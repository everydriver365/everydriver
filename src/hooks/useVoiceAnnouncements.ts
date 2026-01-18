import { useCallback, useRef, useState } from 'react';

interface VoiceAnnouncementsOptions {
  enabled?: boolean;
  volume?: number;
}

export const useVoiceAnnouncements = (options: VoiceAnnouncementsOptions = {}) => {
  const { enabled = true, volume = 1 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);

  const speak = useCallback((text: string, priority: 'normal' | 'high' = 'normal') => {
    if (!enabled || !('speechSynthesis' in window)) {
      console.log('[Voice] Speech synthesis not available');
      return;
    }

    if (priority === 'high') {
      // Cancel current speech for high priority
      window.speechSynthesis.cancel();
      utteranceQueue.current = [text];
    } else {
      utteranceQueue.current.push(text);
    }

    processQueue();
  }, [enabled]);

  const processQueue = useCallback(() => {
    if (isProcessing.current || utteranceQueue.current.length === 0) return;

    isProcessing.current = true;
    const text = utteranceQueue.current.shift();

    if (!text) {
      isProcessing.current = false;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = 1.1; // Slightly faster for announcements
    utterance.pitch = 1;
    
    // Try to use a British English voice
    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(v => v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en'));
    if (britishVoice) {
      utterance.voice = britishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      isProcessing.current = false;
      processQueue(); // Process next in queue
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      isProcessing.current = false;
      processQueue();
    };

    window.speechSynthesis.speak(utterance);
  }, [volume]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
    utteranceQueue.current = [];
    isProcessing.current = false;
    setIsSpeaking(false);
  }, []);

  // Pre-defined announcements for driving events
  const announceEvent = useCallback((eventType: string, severity: string) => {
    const announcements: Record<string, string> = {
      'harsh_brake': 'Harsh braking detected',
      'harsh_acceleration': 'Harsh acceleration',
      'sharp_turn': 'Sharp turn detected',
      'speeding': 'Speed limit exceeded',
      'hard_impact': 'Hard impact detected',
      'smooth_stop': 'Nice smooth stop',
      'good_acceleration': 'Smooth acceleration',
      'smooth_cornering': 'Good cornering',
    };

    const message = announcements[eventType];
    if (message) {
      speak(message, severity === 'high' ? 'high' : 'normal');
    }
  }, [speak]);

  const announceStart = useCallback(() => {
    speak('Tracking started. Drive safely.', 'high');
  }, [speak]);

  const announceStop = useCallback((score: number) => {
    const quality = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs improvement';
    speak(`Tracking complete. Score: ${score}. ${quality} driving.`, 'high');
  }, [speak]);

  return {
    speak,
    cancel,
    isSpeaking,
    announceEvent,
    announceStart,
    announceStop,
    isSupported: 'speechSynthesis' in window
  };
};
