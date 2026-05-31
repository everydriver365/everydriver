import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, { label: string; bg: string; fg: string }> = {
  draft:     { label: "Draft",     bg: "#F3F4F6", fg: "#374151" },
  sent:      { label: "Sent",      bg: "#E0E7FF", fg: "#3730A3" },
  unpaid:    { label: "Sent",      bg: "#E0E7FF", fg: "#3730A3" },
  scheduled: { label: "Scheduled", bg: "#E0E7FF", fg: "#3730A3" },
  partially_paid: { label: "Part paid", bg: "#FEF3C7", fg: "#92400E" },
  viewed:    { label: "Viewed",    bg: "#DBEAFE", fg: "#1E40AF" },
  paid:      { label: "Paid",      bg: "#D1FAE5", fg: "#065F46" },
  payment_pending: { label: "Pending", bg: "#FEF3C7", fg: "#92400E" },
  overdue:   { label: "Overdue",   bg: "#FEE2E2", fg: "#991B1B" },
  cancelled: { label: "Cancelled", bg: "#F3F4F6", fg: "#6B7280" },
  canceled:  { label: "Cancelled", bg: "#F3F4F6", fg: "#6B7280" },
  refunded:  { label: "Refunded",  bg: "#FEE2E2", fg: "#991B1B" },
  failed:    { label: "Failed",    bg: "#FEE2E2", fg: "#991B1B" },
};

export function InvoiceStatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status || "draft").toLowerCase();
  const s = STATUS_STYLES[key] || { label: key, bg: "#F3F4F6", fg: "#374151" };
  return (
    <Badge
      style={{ backgroundColor: s.bg, color: s.fg, border: "none", fontWeight: 600 }}
      className="rounded-full px-2.5 py-0.5 text-[11px]"
    >
      {s.label}
    </Badge>
  );
}
