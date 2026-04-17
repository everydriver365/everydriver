import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface UseVoiceAssistantOptions {
  instructorId: string | undefined;
}

export function useVoiceAssistant({ instructorId }: UseVoiceAssistantOptions) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const pupilNamesRef = useRef<string[]>([]);
  const conversationModeRef = useRef(false);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startListeningRef = useRef<() => void>(() => {});

  // Load pupil names for fuzzy matching
  useEffect(() => {
    if (!instructorId) return;
    supabase
      .from("pupils")
      .select("name")
      .eq("instructor_id", instructorId)
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => {
        if (data) pupilNamesRef.current = data.map((p) => p.name);
      });
  }, [instructorId]);

  const speak = useCallback(async (text: string) => {
    // Pre-create utterance in the current (possibly gesture) context so the
    // browser TTS fallback can speak even after the awaited fetch resolves.
    const fallbackUtterance = new SpeechSynthesisUtterance(text);
    fallbackUtterance.rate = 1.1;
    fallbackUtterance.lang = "en-GB";

    try {
      setState("speaking");

      // Create and unlock Audio element immediately (preserves user gesture context on mobile)
      const audio = new Audio();
      audio.preload = "auto";
      audio.play().catch(() => {});

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      const autoListenAfter = () => {
        if (conversationModeRef.current) {
          // Auto-listen for next command
          setTimeout(() => startListeningRef.current(), 300);
        } else {
          setState("idle");
        }
      };

      if (!response.ok) {
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.onend = () => autoListenAfter();
        speechSynthesis.speak(utterance);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audio.src = audioUrl;
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        autoListenAfter();
      };
      audio.onerror = () => {
        // Fallback to browser TTS if audio fails
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.onend = () => autoListenAfter();
        speechSynthesis.speak(utterance);
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      const autoListenAfter = () => {
        if (conversationModeRef.current) {
          setTimeout(() => startListeningRef.current(), 300);
        } else {
          setState("idle");
        }
      };
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.onend = () => autoListenAfter();
      speechSynthesis.speak(utterance);
    }
  }, []);

  const processCommand = useCallback(
    async (spokenText: string) => {
      if (!instructorId || !spokenText.trim()) {
        setState("idle");
        return;
      }

      setState("processing");
      setTranscript(spokenText);

      try {
        // Step 1: Parse intent
        const { data: intentData, error: intentError } = await supabase.functions.invoke(
          "voice-parse-intent",
          { body: { transcript: spokenText, pupilNames: pupilNamesRef.current } }
        );

        if (intentError) throw intentError;

        const { action, pupil_name, message, page, original_text, amount, note, date, new_date, delay_minutes, phone, todo_text, expense_category } = intentData;

        // Step 2: Execute command
        const { data: execData, error: execError } = await supabase.functions.invoke(
          "voice-execute",
          {
            body: {
              action,
              pupil_name,
              message,
              page,
              amount,
              note,
              date,
              new_date,
              delay_minutes,
              phone,
              todo_text,
              expense_category,
              original_text: original_text || spokenText,
              instructor_id: instructorId,
            },
          }
        );

        if (execError) throw execError;

        const responseMsg = execData.responseText || "Done.";
        setResponseText(responseMsg);

        // Handle navigation
        if (execData.navigate) {
          navigate(execData.navigate);
        }

        // Step 3: Speak the response
        await speak(responseMsg);
      } catch (err) {
        console.error("Voice command error:", err);
        const fallback = "Sorry, something went wrong. Please try again.";
        setResponseText(fallback);
        await speak(fallback);
      }
    },
    [instructorId, navigate, speak]
  );

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();

    // Clear any silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Enter conversation mode on first activation
    conversationModeRef.current = true;

    setTranscript("");
    setResponseText("");
    setState("listening");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let gotResult = false;

    recognition.onresult = (event: any) => {
      gotResult = true;
      const text = event.results[0]?.[0]?.transcript || "";
      processCommand(text);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please enable it in your browser settings.");
        conversationModeRef.current = false;
        setState("idle");
      } else if (event.error === "no-speech" || event.error === "aborted") {
        // No speech detected — end conversation after timeout
        silenceTimeoutRef.current = setTimeout(() => {
          conversationModeRef.current = false;
          setState("idle");
        }, 1500);
      } else {
        setState("idle");
      }
    };

    recognition.onend = () => {
      if (!gotResult && conversationModeRef.current) {
        // Recognition ended without a result (silence) — end conversation
        silenceTimeoutRef.current = setTimeout(() => {
          conversationModeRef.current = false;
          setState((s) => (s === "listening" ? "idle" : s));
        }, 1500);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processCommand]);

  // Keep startListeningRef in sync
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();
    conversationModeRef.current = false;
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    setState("idle");
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();
    conversationModeRef.current = false;
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    setState("idle");
    setTranscript("");
    setResponseText("");
  }, []);

  return {
    state,
    transcript,
    responseText,
    startListening,
    stopListening,
    cancel,
  };
}
