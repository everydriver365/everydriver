import { format, parseISO } from "date-fns";

interface CalendarEvent {
  title: string;
  description: string;
  startDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  durationMinutes: number;
  location?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toICSDate(dateStr: string, timeStr: string): string {
  const d = parseISO(dateStr);
  const [h, m] = timeStr.split(":").map(Number);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`;
}

function addMinutes(dateStr: string, timeStr: string, minutes: number): string {
  const d = parseISO(dateStr);
  const [h, m] = timeStr.split(":").map(Number);
  const totalMin = h * 60 + m + minutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(newH)}${pad(newM)}00`;
}

export function generateICSFile(event: CalendarEvent): string {
  const start = toICSDate(event.startDate, event.startTime);
  const end = addMinutes(event.startDate, event.startTime, event.durationMinutes);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EveryDriver//Booking//EN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
    event.location ? `LOCATION:${event.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function generateMultiEventICS(events: CalendarEvent[]): string {
  const vevents = events.map((event) => {
    const start = toICSDate(event.startDate, event.startTime);
    const end = addMinutes(event.startDate, event.startTime, event.durationMinutes);
    return [
      "BEGIN:VEVENT",
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
      event.location ? `LOCATION:${event.location}` : "",
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EveryDriver//Booking//EN",
    ...vevents,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadMultiEventICS(events: CalendarEvent[]) {
  const ics = generateMultiEventICS(events);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lessons.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadICS(event: CalendarEvent) {
  const ics = generateICSFile(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lesson-${event.startDate}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const start = toICSDate(event.startDate, event.startTime);
  const end = addMinutes(event.startDate, event.startTime, event.durationMinutes);
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description,
    location: event.location || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
