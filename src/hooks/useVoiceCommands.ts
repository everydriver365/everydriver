import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface VoiceCommand {
  patterns: string[];
  action: string;
  callback: () => void;
}

interface UseVoiceCommandsProps {
  commands: VoiceCommand[];
  enabled?: boolean;
  onCommandRecognized?: (command: string) => void;
  onListeningChange?: (isListening: boolean) => void;
}

interface UseVoiceCommandsReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  error: string | null;
}

// Fuzzy match score (0-1) for comparing spoken text to command patterns
function fuzzyMatch(spoken: string, pattern: string): number {
  const spokenLower = spoken.toLowerCase().trim();
  const patternLower = pattern.toLowerCase().trim();
  
  // Exact match
  if (spokenLower === patternLower) return 1;
  
  // Contains match
  if (spokenLower.includes(patternLower)) return 0.9;
  if (patternLower.includes(spokenLower)) return 0.8;
  
  // Word-based match
  const spokenWords = spokenLower.split(/\s+/);
  const patternWords = patternLower.split(/\s+/);
  
  let matchedWords = 0;
  for (const patternWord of patternWords) {
    if (spokenWords.some(sw => 
      sw === patternWord || 
      sw.includes(patternWord) || 
      patternWord.includes(sw)
    )) {
      matchedWords++;
    }
  }
  
  return matchedWords / patternWords.length * 0.7;
}

export function useVoiceCommands({
  commands,
  enabled = true,
  onCommandRecognized,
  onListeningChange,
}: UseVoiceCommandsProps): UseVoiceCommandsReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check for browser support
  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const processTranscript = useCallback((text: string) => {
    if (!text.trim()) return;
    
    let bestMatch: { command: VoiceCommand; score: number } | null = null;
    
    for (const command of commands) {
      for (const pattern of command.patterns) {
        const score = fuzzyMatch(text, pattern);
        if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { command, score };
        }
      }
    }
    
    if (bestMatch) {
      onCommandRecognized?.(bestMatch.command.action);
      bestMatch.command.callback();
      
      // Speak confirmation
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(`${bestMatch.command.action}`);
        utterance.volume = 0.5;
        utterance.rate = 1.2;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [commands, onCommandRecognized]);

  const startListening = useCallback(() => {
    if (!isSupported || !enabled) return;
    
    try {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-GB";
      
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        onListeningChange?.(true);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          processTranscript(finalTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(event.error);
        setIsListening(false);
        onListeningChange?.(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        onListeningChange?.(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start voice recognition");
    }
  }, [isSupported, enabled, processTranscript, onListeningChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    error,
  };
}

// Text-to-speech utility
export function speak(text: string, options?: { rate?: number; volume?: number }) {
  if (!("speechSynthesis" in window)) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 1;
  utterance.volume = options?.volume ?? 0.8;
  utterance.lang = "en-GB";
  
  window.speechSynthesis.speak(utterance);
}
