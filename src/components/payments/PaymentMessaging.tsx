import { KlarnaInstalmentBadge } from "./KlarnaOSMWidget";
import { ClearpayInstalmentBadge } from "./ClearpayOSMWidget";

interface PaymentMessagingProps {
  amount: number;
  showKlarna?: boolean;
  showClearpay?: boolean;
  showIdeal?: boolean;
  layout?: "inline" | "stacked";
  className?: string;
}

/**
 * Combined payment messaging component
 * Shows Klarna, Clearpay, and/or iDeal finance options with calculated instalments
 */
export function PaymentMessaging({
  amount,
  showKlarna = true,
  showClearpay = true,
  showIdeal = true,
  layout = "inline",
  className = ""
}: PaymentMessagingProps) {
  const klarnaInstalment = (amount / 3).toFixed(2);
  const clearpayInstalment = (amount / 4).toFixed(2);

  if (layout === "stacked") {
    return (
      <div className={`space-y-2 ${className}`}>
        {showKlarna && (
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#ffb3c7] px-2 py-0.5 text-xs font-bold text-black">
              Klarna.
            </span>
            <span className="text-xs text-muted-foreground">
              Pay in 3: 3 × £{klarnaInstalment}
            </span>
          </div>
        )}
        {showClearpay && (
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#b2fce4] px-2 py-0.5 text-xs font-bold text-black">
              clearpay
            </span>
            <span className="text-xs text-muted-foreground">
              Pay in 4: 4 × £{clearpayInstalment}
            </span>
          </div>
        )}
        {showIdeal && (
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#ffd700] px-2 py-0.5 text-xs font-bold text-black">
              iDeal
            </span>
            <span className="text-xs text-muted-foreground">
              Finance available
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {showKlarna && (
        <KlarnaInstalmentBadge amount={amount} />
      )}
      {showClearpay && (
        <ClearpayInstalmentBadge amount={amount} />
      )}
      {showIdeal && (
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-[#ffd700] px-2 py-0.5 text-xs font-bold text-black">
            iDeal
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for course cards - shows just the key instalment info
 */
export function CompactPaymentBadges({
  amount,
  className = ""
}: {
  amount: number;
  className?: string;
}) {
  const klarnaInstalment = (amount / 3).toFixed(2);
  const clearpayInstalment = (amount / 4).toFixed(2);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span 
        className="rounded-md bg-[#ffb3c7] px-2 py-0.5 text-xs font-bold text-black"
        title={`Pay in 3 instalments of £${klarnaInstalment}`}
      >
        Klarna. £{klarnaInstalment}
      </span>
      <span 
        className="rounded-md bg-[#b2fce4] px-2 py-0.5 text-xs font-bold text-black"
        title={`Pay in 4 instalments of £${clearpayInstalment}`}
      >
        clearpay £{clearpayInstalment}
      </span>
      <span className="rounded-md bg-[#ffd700] px-2 py-0.5 text-xs font-bold text-black">
        iDeal
      </span>
    </div>
  );
}
