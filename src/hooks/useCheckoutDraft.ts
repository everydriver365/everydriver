import { useCallback } from "react";

export interface CheckoutDraftSlot {
  date: string; // ISO
  startTime: string;
  endTime: string;
  duration: number;
}

export interface CheckoutDraft {
  pupilName: string;
  pupilEmail: string;
  pupilPhone: string;
  pupilAddress: string;
  pupilPostcode: string;
  differentPickup: boolean;
  pickupAddress: string;
  pickupPostcode: string;
  pickupWhat3words: string;
  hasSpecialNeeds: boolean;
  specialNeeds: string;
  selectedSlots: CheckoutDraftSlot[];
  selectedUpsells: string[];
  paymentOption: "full" | "deposit";
  savedAt: number;
}

const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Persist a pupil's in-progress checkout (form fields + selected lesson slots)
 * to localStorage so that returning from a cancelled external payment redirect
 * doesn't force them to re-enter everything.
 */
export function useCheckoutDraft(prefix: string, instructorId: string | undefined, hours: number) {
  const key = instructorId ? `${prefix}:${instructorId}:${hours}` : null;

  const saveDraft = useCallback(
    (draft: Omit<CheckoutDraft, "savedAt">) => {
      if (!key) return;
      try {
        const payload: CheckoutDraft = { ...draft, savedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(payload));
      } catch (e) {
        console.warn("Failed to save checkout draft", e);
      }
    },
    [key]
  );

  const loadDraft = useCallback((): CheckoutDraft | null => {
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CheckoutDraft;
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed;
    } catch (e) {
      console.warn("Failed to load checkout draft", e);
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  }, [key]);

  return { saveDraft, loadDraft, clearDraft };
}
