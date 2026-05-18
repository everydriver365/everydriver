import { Check, Clock, XCircle, CreditCard, Loader2 } from "lucide-react";
import { paymentsTokens as t, poppins } from "./tokens";

export type PaymentStatus = "paid" | "pending" | "failed";

export interface UIPayment {
  id: string;
  description: string;
  dateFormatted: string;
  amount: number;
  status: PaymentStatus;
  refunded?: boolean;
}

function PaymentsEmptyState() {
  return (
    <div
      style={{
        padding: "36px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        fontFamily: poppins,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: t.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <CreditCard size={24} color={t.placeholder} strokeWidth={1.8} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: t.navy, marginBottom: 4 }}>
        No payment history yet
      </div>
      <div style={{ fontSize: 12, fontWeight: 300, color: t.muted, lineHeight: "19px" }}>
        Your lesson payments will appear here once you've booked your first lesson
      </div>
    </div>
  );
}

function PaymentRow({ payment, isLast }: { payment: UIPayment; isLast: boolean }) {
  const isPaid = payment.status === "paid";
  const isPending = payment.status === "pending";

  const statusColour = isPaid ? t.green : isPending ? t.amber : t.red;
  const statusLabel = isPaid ? "Paid" : isPending ? "Pending" : "Failed";
  const iconBg = isPaid ? t.greenIconBg : isPending ? t.amberLight : t.redIconBg;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "13px 16px",
        borderBottom: isLast ? "none" : `1px solid ${t.divider}`,
        fontFamily: poppins,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {isPaid ? (
          <Check size={14} color={statusColour} strokeWidth={2} />
        ) : isPending ? (
          <Clock size={14} color={statusColour} strokeWidth={1.8} />
        ) : (
          <XCircle size={14} color={statusColour} strokeWidth={1.8} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: t.navy,
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {payment.description}
        </div>
        <div style={{ fontSize: 12, fontWeight: 300, color: t.muted }}>
          {payment.dateFormatted}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: statusColour,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 500, color: statusColour }}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.navy }}>
          £{payment.amount.toFixed(2)}
        </div>
        {payment.refunded && (
          <div style={{ fontSize: 10, fontWeight: 400, color: t.muted, marginTop: 2 }}>
            Refunded
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  payments: UIPayment[];
  loading: boolean;
}

export function PaymentsHistoryCard({ payments, loading }: Props) {
  return (
    <div
      style={{
        backgroundColor: t.white,
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(15,32,68,0.05)",
      }}
    >
      {loading ? (
        <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
          <Loader2 size={20} color={t.blue} className="animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <PaymentsEmptyState />
      ) : (
        payments.map((p, i) => (
          <PaymentRow key={p.id} payment={p} isLast={i === payments.length - 1} />
        ))
      )}
    </div>
  );
}
