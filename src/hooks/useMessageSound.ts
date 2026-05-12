import { useEffect, useRef } from "react";
import { useInstructorNotificationSettings, type MessageSoundChoice } from "./useInstructorNotificationSettings";

const SOUND_URLS: Record<Exclude<MessageSoundChoice, "none">, string> = {
  chime: "/sounds/chime.mp3",
  ding: "/sounds/ding.mp3",
  pop: "/sounds/pop.mp3",
};

const audioCache = new Map<string, HTMLAudioElement>();

export function getNotificationAudio(choice: MessageSoundChoice): HTMLAudioElement | null {
  if (choice === "none" || typeof window === "undefined") return null;
  let el = audioCache.get(choice);
  if (!el) {
    el = new Audio(SOUND_URLS[choice]);
    el.preload = "auto";
    el.volume = 0.35;
    audioCache.set(choice, el);
  }
  return el;
}

export function playNotificationSound(choice: MessageSoundChoice) {
  const el = getNotificationAudio(choice);
  if (!el) return;
  try {
    el.currentTime = 0;
    void el.play().catch(() => {/* ignored: needs user gesture first */});
  } catch {/* noop */}
}

function isInQuietHours(start: string, end: string): boolean {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  // Handle overnight window (e.g. 22:00 → 07:00)
  if (s === e) return false;
  if (s < e) return mins >= s && mins < e;
  return mins >= s || mins < e;
}

/**
 * Plays a subtle sound when `unread` increases. Respects:
 * - message_sound_enabled toggle
 * - message_sound_choice
 * - quiet hours
 * - "message" category mute
 * Skips the very first render so it doesn't fire on initial load.
 * Throttles to once per 2 seconds.
 */
export function useMessageSound(instructorId: string | undefined, unread: number) {
  const { settings, loading } = useInstructorNotificationSettings(instructorId);
  const previousRef = useRef<number | null>(null);
  const lastPlayedRef = useRef<number>(0);

  useEffect(() => {
    if (loading) return;
    const previous = previousRef.current;
    previousRef.current = unread;

    if (previous === null) return; // skip first run
    if (unread <= previous) return;

    if (!settings.message_sound_enabled) return;
    if (settings.message_sound_choice === "none") return;
    if (settings.category_mutes?.message) return;
    if (settings.quiet_hours_enabled && isInQuietHours(settings.quiet_hours_start, settings.quiet_hours_end)) return;

    const now = Date.now();
    if (now - lastPlayedRef.current < 2000) return;
    lastPlayedRef.current = now;

    playNotificationSound(settings.message_sound_choice);
  }, [unread, loading, settings]);
}
