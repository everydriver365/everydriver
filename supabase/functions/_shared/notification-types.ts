// Edge-function mirror of src/lib/notificationTypes.ts — keep in sync.
// Plain Deno-friendly TS (no React, no path aliases).

export const PushDataType = {
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
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_CONFIRMED: "payment_confirmed",
  PAYMENT_FAILED: "payment_failed",
  REFUND: "refund",
  PAYMENT_REMINDER: "payment_reminder",
  JOB_OFFER: "job_offer",
  MESSAGE: "message",
  ADMIN_MESSAGE: "admin_message",
  WHATSAPP_HANDOFF: "whatsapp_handoff",
  EN_ROUTE: "en_route",
  ARRIVED: "arrived",
  RUNNING_LATE: "running_late",
  SYSTEM: "system",
  TEST_SWAP: "test_swap",
  TEST_SWAP_MATCH: "test_swap_match",
  WAITLIST_MATCH: "waitlist_match",
  SLOT_OFFER: "slot_offer",
  DAILY_SUMMARY: "daily_summary",
  DIGEST: "digest",
  COURSE_BONUS: "course_bonus",
} as const;

export const NotifyCategory = {
  JOB: "job",
  PAYMENT: "payment",
  LESSON: "lesson",
  REMINDER: "reminder",
  MESSAGE: "message",
  TEST_SWAP: "test_swap",
  SYSTEM: "system",
} as const;

export const NotifyImportance = {
  NORMAL: "normal",
  IMPORTANT: "important",
} as const;

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
