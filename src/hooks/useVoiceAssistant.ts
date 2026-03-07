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
    try {
      setState("speaking");
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

      if (!response.ok) {
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.onend = () => setState("idle");
        speechSynthesis.speak(utterance);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.onend = () => setState("idle");
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

        const { action, pupil_name, message, page, original_text, amount, note, date } = intentData;

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

    setTranscript("");
    setResponseText("");
    setState("listening");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const text = event.results[0]?.[0]?.transcript || "";
      processCommand(text);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please enable it in your browser settings.");
      }
      setState("idle");
    };

    recognition.onend = () => {
      if (state === "listening") {
        // If still in listening state and no result, reset
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processCommand, state]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();
    setState("idle");
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();
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
