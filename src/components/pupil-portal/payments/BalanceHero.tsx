import { paymentsTokens as t, poppins } from "./tokens";

interface Props {
  /** Project convention: balance > 0 = credit, < 0 = owed, 0 = balanced */
  balance: number;
}

export function BalanceHero({ balance }: Props) {
  const isBalanced = balance === 0;
  const isOwed = balance < 0;
  const isCredit = balance > 0;

  const pillBg = isOwed ? t.redLight : t.greenLight;
  const pillBorder = isOwed ? t.redBorder : t.greenBorder;
  const pillColour = isOwed ? t.red : t.green;
  const label = isBalanced ? "All balanced" : isOwed ? "Amount due" : "Credit available";

  return (
    <div
      style={{
        backgroundColor: t.navy,
        padding: "20px 20px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: poppins,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        Current balance
      </div>
      <div
        style={{
          fontSize: 40,
          fontWeight: 700,
          color: "#FFF",
          letterSpacing: -1.5,
          lineHeight: "44px",
        }}
      >
        £{Math.abs(balance).toFixed(2)}
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          marginTop: 8,
          backgroundColor: pillBg,
          border: `1px solid ${pillBorder}`,
          borderRadius: 20,
          padding: "3px 12px",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: pillColour,
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 500, color: pillColour }}>{label}</span>
      </div>
    </div>
  );
}
