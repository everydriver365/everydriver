import { useEffect, useRef, useState } from "react";
import clearpayLogo from "@/assets/clearpay-logo.svg";

interface ClearpayOSMWidgetProps {
  amount: number; // Price in GBP (e.g., 500 for £500)
  locale?: string;
  theme?: "white" | "black" | "mint";
  size?: "xs" | "sm" | "md" | "lg";
  logoType?: "badge" | "lockup";
  className?: string;
}

// Extend JSX to include custom Afterpay/Clearpay elements
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "afterpay-placement": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "data-locale"?: string;
          "data-currency"?: string;
          "data-amount"?: string;
          "data-size"?: string;
          "data-badge-theme"?: string;
          "data-logo-type"?: string;
          "data-show-interest-free"?: string;
          "data-show-with"?: string;
        },
        HTMLElement
      >;
    }
  }
}

/**
 * Clearpay/Afterpay On-Site Messaging Widget
 * Shows dynamic "Pay in 4" instalment amounts
 * 
 * Uses the Afterpay.js SDK which powers Clearpay in the UK
 */
export function ClearpayOSMWidget({ 
  amount, 
  locale = "en_GB", 
  theme = "mint",
  size = "sm",
  logoType = "badge",
  className = ""
}: ClearpayOSMWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    // Load Afterpay/Clearpay SDK if not already loaded
    if (typeof document !== "undefined") {
      const existingScript = document.querySelector('script[src*="afterpay.js"]');
      
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://js.afterpay.com/afterpay-1.x.js";
        script.async = true;
        script.onload = () => {
          setSdkLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setSdkLoaded(true);
      }
    }
  }, []);

  // Calculate instalment amount for display (Pay in 4)
  const instalmentAmount = (amount / 4).toFixed(2);

  return (
    <div ref={containerRef} className={className}>
      {/* Afterpay/Clearpay placement element - SDK will populate this if loaded */}
      {sdkLoaded && (
        <afterpay-placement
          data-locale={locale}
          data-currency="GBP"
          data-amount={amount.toFixed(2)}
          data-size={size}
          data-badge-theme={theme}
          data-logo-type={logoType}
          data-show-interest-free="true"
          data-show-with="true"
        />
      )}
      
      {/* Fallback display - always show the calculated amount */}
      {!sdkLoaded && (
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-md bg-[#b2fce4] px-2 py-0.5 text-xs font-bold text-black">
            clearpay
          </span>
          <span className="text-muted-foreground">
            £{amount} over 4 months – £{instalmentAmount}/mo
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Clearpay badge with calculated instalments (no SDK required)
 */
export function ClearpayInstalmentBadge({ 
  amount, 
  className = "" 
}: { 
  amount: number; 
  className?: string;
}) {
  const instalmentAmount = (amount / 4).toFixed(2);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="rounded-md bg-[#b2fce4] px-2 py-0.5 text-xs font-bold text-black">
        clearpay
      </span>
      <span className="text-xs text-muted-foreground">
        £{amount} over 4 months (£{instalmentAmount}/mo)
      </span>
    </div>
  );
}
