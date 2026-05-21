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
  CALENDAR_SYNC_FAILED: "calendar_sync_failed",

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

  // Live tracking
  EN_ROUTE: "en_route",
  ARRIVED: "arrived",
  RUNNING_LATE: "running_late",

  // System
  SYSTEM: "system",
  TEST_SWAP: "test_swap",
  WAITLIST_MATCH: "waitlist_match",
  SLOT_OFFER: "slot_offer",
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
  LESSON_REMINDER: "lesson_reminder",
  LESSON_CANCELLED: "lesson_cancelled",
  BOOKING_CONFIRMED: "booking_confirmed",
  TEST_BOOKING_CONFIRMED: "test_booking_confirmed",
  PAYMENT_CONFIRMED: "payment_confirmed",
  WAITLIST_MATCH: "waitlist_match",
  EN_ROUTE: "en_route",
  ARRIVED: "arrived",
  RUNNING_LATE: "running_late",
  PAYMENT_REMINDER: "payment_reminder",
} as const;

export type PupilNotifyTypeValue = (typeof PupilNotifyType)[keyof typeof PupilNotifyType];
