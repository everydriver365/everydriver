// No-op stub.
//
// Previously, this triggered an on-demand sync of `instructor_calendar_events`
// from Google. In the ICS-subscription model, refreshing happens via the
// `poll-ics-subscriptions` cron + "Refresh now" button in the settings UI.
// The export is kept so existing call sites compile.

interface Args {
  instructorId: string;
  fromIso: string;
  toIso: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function refreshGoogleCalendar(_args: Args): Promise<void> {
  // intentional no-op
}

// Legacy alias kept for callers that imported a per-date helper.
export async function refreshGoogleCalendarForDate(
  _instructorId: string,
  _dateStr: string,
): Promise<void> {
  // intentional no-op
}
