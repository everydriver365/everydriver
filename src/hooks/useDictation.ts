import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UseDictationOptions {
  onTranscript?: (text: string) => void;
}

export interface UseDictationReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  isSupported: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  toggle: () => Promise<void>;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/mpeg",
  ];
  for (const t of candidates) {
    // @ts-ignore - older TS lib types
    if (MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return undefined;
}

export function useDictation(options: UseDictationOptions = {}): UseDictationReturn {
  const { onTranscript } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeRef = useRef<string | undefined>(undefined);

  const isSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      toast.error("Dictation isn't supported on this device");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const mime = pickMimeType();
      mimeRef.current = mime;
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start();
      recorderRef.current = rec;
      setIsRecording(true);
    } catch (e: any) {
      cleanup();
      setIsRecording(false);
      if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
        toast.error("Microphone permission denied");
      } else {
        toast.error("Couldn't start microphone");
      }
    }
  }, [isSupported, cleanup]);

  const stop = useCallback(async () => {
    const rec = recorderRef.current;
    if (!rec) {
      setIsRecording(false);
      return;
    }
    const mime = mimeRef.current ?? rec.mimeType ?? "audio/webm";
    const done: Promise<Blob> = new Promise((resolve) => {
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        resolve(blob);
      };
    });
    try {
      rec.stop();
    } catch {
      // ignore
    }
    const blob = await done;
    cleanup();
    setIsRecording(false);

    if (blob.size === 0) {
      toast.error("No audio captured");
      return;
    }

    setIsTranscribing(true);
    try {
      const ext = mime.includes("mp4") ? "mp4" : mime.includes("mpeg") ? "mp3" : "webm";
      const form = new FormData();
      form.append("audio", blob, `dictation.${ext}`);
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: form,
      });
      if (error) throw error;
      const text = (data as { text?: string } | null)?.text?.trim() ?? "";
      if (!text) {
        toast.error("Couldn't hear anything");
        return;
      }
      onTranscript?.(text);
    } catch (e: any) {
      console.error("Dictation transcription failed", e);
      toast.error(e?.message ?? "Transcription failed");
    } finally {
      setIsTranscribing(false);
    }
  }, [cleanup, onTranscript]);

  const toggle = useCallback(async () => {
    if (isRecording) await stop();
    else await start();
  }, [isRecording, start, stop]);

  return { isRecording, isTranscribing, isSupported, start, stop, toggle };
}
