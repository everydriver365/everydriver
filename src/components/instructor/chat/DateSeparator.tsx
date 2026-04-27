import { format, isSameWeek, isToday, isYesterday } from "date-fns";

interface Props {
  date: Date;
}

export function formatChatDate(date: Date): string | null {
  if (isToday(date)) return null;
  if (isYesterday(date)) return "Yesterday";
  const now = new Date();
  if (isSameWeek(date, now, { weekStartsOn: 1 })) {
    return format(date, "EEEE");
  }
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, "EEEE, d MMMM");
  }
  return format(date, "EEEE, d MMMM yyyy");
}

export function DateSeparator({ date }: Props) {
  const label = formatChatDate(date);
  if (!label) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        margin: "4px 0 8px",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#6E6E73",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}
