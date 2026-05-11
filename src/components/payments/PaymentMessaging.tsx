import { KlarnaInstalmentBadge } from "./KlarnaOSMWidget";
import { ClearpayInstalmentBadge } from "./ClearpayOSMWidget";
import klarnaRoundLogo from "@/assets/klarna-round-logo.svg";
import clearpayRoundLogo from "@/assets/clearpay-round-logo.svg";

interface PaymentMessagingProps {
  amount: number;
  showKlarna?: boolean;
  showClearpay?: boolean;
  layout?: "inline" | "stacked";
  className?: string;
}

/**
 * Combined payment messaging component
 * Shows Klarna and/or Clearpay finance options with calculated instalments
 */
export function PaymentMessaging({
  amount,
  showKlarna = true,
  showClearpay = true,
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
              £{amount} in 3 monthly payments of £{klarnaInstalment}
            </span>
          </div>
        )}
        {showClearpay && (
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#b2fce4] px-2 py-0.5 text-xs font-bold text-black">
              clearpay
            </span>
            <span className="text-xs text-muted-foreground">
              £{amount} in 4 monthly payments of £{clearpayInstalment}
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
    </div>
  );
}

/**
 * Compact version for course cards - shows just the key instalment info
 */
export function CompactPaymentBadges({
  amount,
  className = "",
  klarnaEnabled = true,
  clearpayEnabled = true,
}: {
  amount: number;
  className?: string;
  klarnaEnabled?: boolean;
  clearpayEnabled?: boolean;
}) {
  if (!klarnaEnabled && !clearpayEnabled) return null;

  const klarnaInstalment = (amount / 3).toFixed(2);
  const clearpayInstalment = (amount / 4).toFixed(2);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {klarnaEnabled && (
        <span
          className="inline-flex items-center gap-1 rounded-md bg-[#ffb3c7] px-2 py-0.5 text-xs font-bold text-black"
          title={`£${amount} in 3 monthly payments of £${klarnaInstalment}`}
        >
          <img src={klarnaRoundLogo} alt="Klarna" className="h-3.5 w-3.5" />
          £{klarnaInstalment}/mo × 3
        </span>
      )}
      {clearpayEnabled && (
        <span
          className="inline-flex items-center gap-1 rounded-md bg-[#b2fce4] px-2 py-0.5 text-xs font-bold text-black"
          title={`£${amount} in 4 monthly payments of £${clearpayInstalment}`}
        >
          <img src={clearpayRoundLogo} alt="Clearpay" className="h-3.5 w-3.5" />
          £{clearpayInstalment}/mo × 4
        </span>
      )}
    </div>
  );
}
