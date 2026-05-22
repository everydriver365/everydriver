/**
 * Shared notification type & category constants.
 *
 * Single source of truth for `data.type` values inside push notification
 * payloads, the `notify-pupil` request `type` field, and the gate
 * `category` / `importance` enums. Mirrored on the edge-function side in
 * `supabase/functions/_shared/notification-types.ts` (keep both in sync).
 */

// ---------------------------------------------------------------------------
// Push payload data.type values
// ---------------------------------------------------------------------------
export const PushDataType = {
  // Lesson lifecycle
  NEW_BOOKING: "new_booking",
  BOOKING_CONFIRMED: "booking_confirmed",
  TEST_BOOKING_CONFIRMED: "test_booking_confirmed",
  LESSON_CANCELLED: "lesson_cancelled",
  LESSON_RESCHEDULED: "lesson_rescheduled",
  LESSON_REMINDER: "lesson_reminder",
  LESSON_EOL: "lesson_eol",
  LESSON_CHECKIN: "lesson_checkin",
  CALENDAR_SYNC_FAILED: "calendar_sync_failed",
  GAP_FILLED: "gap_filled",

  // Payments
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_CONFIRMED: "payment_confirmed",
  PAYMENT_FAILED: "payment_failed",
  REFUND: "refund",
  PAYMENT_REMINDER: "payment_reminder",

  // Jobs / enquiries
  JOB_OFFER: "job_offer", // unified — was previously "new_job" in create-enquiry

  // Messaging
  MESSAGE: "message",
  ADMIN_MESSAGE: "admin_message",
  WHATSAPP_HANDOFF: "whatsapp_handoff",

  // Live tracking
  EN_ROUTE: "en_route",
  ARRIVED: "arrived",
  RUNNING_LATE: "running_late",

  // System
  SYSTEM: "system",
  TEST_SWAP: "test_swap",
  TEST_SWAP_MATCH: "test_swap_match",
  WAITLIST_MATCH: "waitlist_match",
  SLOT_OFFER: "slot_offer",
  SLOT_OFFER_CANCELLED: "slot_offer_cancelled",
  DAILY_SUMMARY: "daily_summary",
  DIGEST: "digest",
  COURSE_BONUS: "course_bonus",
  MTD_DEADLINE_REMINDER: "mtd_deadline_reminder",
} as const;

export type PushDataTypeValue = (typeof PushDataType)[keyof typeof PushDataType];

// ---------------------------------------------------------------------------
// Gate categories (must mirror supabase/functions/_shared/notify-gate.ts)
// ---------------------------------------------------------------------------
export const NotifyCategory = {
  JOB: "job",
  PAYMENT: "payment",
  LESSON: "lesson",
  REMINDER: "reminder",
  MESSAGE: "message",
  TEST_SWAP: "test_swap",
  SYSTEM: "system",
  MTD: "mtd",
} as const;

export type NotifyCategoryValue = (typeof NotifyCategory)[keyof typeof NotifyCategory];

// ---------------------------------------------------------------------------
// Importance levels
// ---------------------------------------------------------------------------
export const NotifyImportance = {
  NORMAL: "normal",
  IMPORTANT: "important",
} as const;

export type NotifyImportanceValue = (typeof NotifyImportance)[keyof typeof NotifyImportance];

// ---------------------------------------------------------------------------
// notify-pupil request types
// ---------------------------------------------------------------------------
export const PupilNotifyType = {
  SLOT_OFFER: "slot_offer",
  SLOT_OFFER_CANCELLED: "slot_offer_cancelled",
  LESSON_REMINDER: "lesson_reminder",
  LESSON_CANCELLED: "lesson_cancelled",
  LESSON_RESCHEDULED: "lesson_rescheduled",
  RESCHEDULE_DECLINED: "reschedule_declined",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_DECLINED: "booking_declined",
  TEST_BOOKING_CONFIRMED: "test_booking_confirmed",
  PAYMENT_CONFIRMED: "payment_confirmed",
  WAITLIST_MATCH: "waitlist_match",
  EN_ROUTE: "en_route",
  ARRIVED: "arrived",
  RUNNING_LATE: "running_late",
  PAYMENT_REMINDER: "payment_reminder",
} as const;

export type PupilNotifyTypeValue = (typeof PupilNotifyType)[keyof typeof PupilNotifyType];
