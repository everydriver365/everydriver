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
        fallbackUtterance.onend = () => autoListenAfter();
        speechSynthesis.speak(fallbackUtterance);
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
        fallbackUtterance.onend = () => autoListenAfter();
        speechSynthesis.speak(fallbackUtterance);
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
      fallbackUtterance.onend = () => autoListenAfter();
      speechSynthesis.speak(fallbackUtterance);
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

  // MediaRecorder-based capture (replaces unreliable Web Speech API which fails
  // inside iframes / Capacitor WebView with "service-not-allowed"). Audio is
  // posted to the voice-stt edge function which uses ElevenLabs Scribe.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceMonitorRef = useRef<{ stop: () => void } | null>(null);

  const transcribeBlob = useCallback(async (blob: Blob) => {
    setState("processing");
    try {
      // Convert to base64 to call the edge function
      const arrayBuf = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("voice-stt", {
        body: { audio_base64: base64, mime_type: blob.type || "audio/webm" },
      });
      if (error) throw error;
      const text = (data as any)?.text?.trim?.() || "";
      if (!text) {
        // Nothing transcribed — go back to idle / next listen
        if (conversationModeRef.current) {
          setTimeout(() => startListeningRef.current(), 200);
        } else {
          setState("idle");
        }
        return;
      }
      processCommand(text);
    } catch (err) {
      console.error("Transcription error:", err);
      toast.error("Couldn't understand that. Try again.");
      setState("idle");
    }
  }, [processCommand]);

  const stopMediaCapture = useCallback(() => {
    try { mediaRecorderRef.current?.state !== "inactive" && mediaRecorderRef.current?.stop(); } catch {}
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    silenceMonitorRef.current?.stop();
    silenceMonitorRef.current = null;
  }, []);

  const startListening = useCallback(async () => {
    // Stop any playing audio (user-gesture safe)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone is not supported in this browser.");
      return;
    }

    conversationModeRef.current = true;
    setTranscript("");
    setResponseText("");
    setState("listening");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err: any) {
      console.error("Microphone access error:", err);
      conversationModeRef.current = false;
      setState("idle");
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        toast.error("Microphone access denied. Please enable it in your settings.");
      } else if (err?.name === "NotFoundError") {
        toast.error("No microphone found on this device.");
      } else {
        toast.error("Couldn't start the microphone.");
      }
      return;
    }

    mediaStreamRef.current = stream;
    audioChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : undefined;

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      if (blob.size > 1500) {
        transcribeBlob(blob);
      } else {
        // Too short — likely silence
        if (conversationModeRef.current) {
          setTimeout(() => startListeningRef.current(), 200);
        } else {
          setState("idle");
        }
      }
    };

    recorder.start(250);

    // Voice-activity stopper: end recording after ~1.4s of trailing silence.
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx: AudioContext = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        let lastVoiceAt = Date.now();
        let stopped = false;
        const startedAt = Date.now();
        const SILENCE_MS = 1400;
        const MAX_MS = 12000;
        const THRESHOLD = 0.012;
        const tick = () => {
          if (stopped) return;
          analyser.getByteTimeDomainData(data);
          // RMS
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          if (rms > THRESHOLD) lastVoiceAt = Date.now();
          const elapsed = Date.now() - startedAt;
          if (elapsed > 600 && (Date.now() - lastVoiceAt > SILENCE_MS || elapsed > MAX_MS)) {
            stopped = true;
            try { recorder.state === "recording" && recorder.stop(); } catch {}
            try { audioCtx.close(); } catch {}
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        silenceMonitorRef.current = {
          stop: () => {
            stopped = true;
            try { audioCtx.close(); } catch {}
          },
        };
      } else {
        // Fallback: hard cap at 8s
        setTimeout(() => {
          try { recorder.state === "recording" && recorder.stop(); } catch {}
        }, 8000);
      }
    } catch (err) {
      console.warn("VAD setup failed; falling back to fixed timer", err);
      setTimeout(() => {
        try { recorder.state === "recording" && recorder.stop(); } catch {}
      }, 8000);
    }
  }, [transcribeBlob]);

  // Keep startListeningRef in sync
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const stopListening = useCallback(() => {
    stopMediaCapture();
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
  }, [stopMediaCapture]);

  const cancel = useCallback(() => {
    stopMediaCapture();
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
  }, [stopMediaCapture]);

  return {
    state,
    transcript,
    responseText,
    startListening,
    stopListening,
    cancel,
  };
}
