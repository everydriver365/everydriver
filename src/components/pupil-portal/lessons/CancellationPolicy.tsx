import { Info, Check, TriangleAlert, XCircle } from "lucide-react";
import { lessonsTokens as t, cardShadow } from "./tokens";

interface Props {
  cancelNoticeHours?: number;
}

export function CancellationPolicy({ cancelNoticeHours = 24 }: Props) {
  const POLICIES = [
    {
      key: 'free',
      iconBg: t.greenLight,
      iconColor: t.green,
      Icon: Check,
      title: 'Free cancellation',
      body: `Cancel more than ${cancelNoticeHours} hours before your lesson at no charge`,
    },
    {
      key: 'late',
      iconBg: t.amberLight,
      iconColor: t.amber,
      Icon: TriangleAlert,
      title: 'Late cancellation',
      body: `Less than ${cancelNoticeHours} hours notice — a fee may apply`,
    },
    {
      key: 'noshow',
      iconBg: t.redLight,
      iconColor: t.red,
      Icon: XCircle,
      title: 'No-show',
      body: "Full lesson charge applies if you don't attend",
    },
  ] as const;

  return (
    <div
      style={{
        backgroundColor: t.white,
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        overflow: 'hidden',
        boxShadow: cardShadow,
        fontFamily: 'Poppins, system-ui, sans-serif',
      }}
    >
      <div
        className="flex items-center gap-[7px]"
        style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${t.divider}` }}
      >
        <Info size={13} color={t.muted} strokeWidth={1.8} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: t.muted,
            letterSpacing: '0.7px',
            textTransform: 'uppercase',
          }}
        >
          Cancellation policy
        </span>
      </div>

      {POLICIES.map((p, i) => (
        <div
          key={p.key}
          className="flex items-start gap-3"
          style={{
            padding: '12px 16px',
            borderBottom: i < POLICIES.length - 1 ? `1px solid ${t.divider}` : 'none',
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: p.iconBg,
              marginTop: 1,
            }}
          >
            <p.Icon size={14} color={p.iconColor} strokeWidth={1.9} />
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 13, fontWeight: 600, color: t.navy, marginBottom: 2 }}>
              {p.title}
            </div>
            <div style={{ fontSize: 12, fontWeight: 300, color: t.muted, lineHeight: '18px' }}>
              {p.body}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
