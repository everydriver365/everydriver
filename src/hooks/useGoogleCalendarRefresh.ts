// No-op stub.
//
// Previously, this hook refreshed `instructor_calendar_events` from Google
// whenever a booking surface mounted. In the new ICS-subscription model, the
// inbound calendar feeds are polled by a 5-minute pg_cron job calling the
// `poll-ics-subscriptions` edge function — booking surfaces do not trigger
// any sync. The export is kept so existing call sites compile unchanged.

interface Args {
  instructorId?: string | undefined;
  from?: Date | string | undefined;
  to?: Date | string | undefined;
  enabled?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useGoogleCalendarRefresh(_args: Args) {
  // intentional no-op
}
