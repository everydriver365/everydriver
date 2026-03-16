import { useEffect, useRef, useState } from "react";
import klarnaLogo from "@/assets/klarna-logo.svg";

interface KlarnaOSMWidgetProps {
  amount: number; // Price in GBP (e.g., 500 for £500)
  locale?: string;
  theme?: "default" | "dark";
  className?: string;
}

// Extend JSX to include custom Klarna elements
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "klarna-placement": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "data-key"?: string;
          "data-locale"?: string;
          "data-purchase-amount"?: string;
          "data-theme"?: string;
        },
        HTMLElement
      >;
    }
  }
}

/**
 * Klarna On-Site Messaging Widget
 * Shows dynamic "Pay in 3" instalment amounts
 * 
 * Note: Requires a Klarna OSM Client ID configured in Merchant Portal
 */
export function KlarnaOSMWidget({ 
  amount, 
  locale = "en-GB", 
  theme = "default",
  className = ""
}: KlarnaOSMWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Convert to minor units (pence)
  const purchaseAmount = Math.round(amount * 100);

  useEffect(() => {
    // Load Klarna OSM SDK if not already loaded
    if (typeof document !== "undefined") {
      const existingScript = document.querySelector('script[src*="klarna.com/web-sdk"]');
      
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://js.klarna.com/web-sdk/v1/klarna.js";
        script.async = true;
        script.setAttribute("data-client-id", "klarna-osm"); // Placeholder - needs real client ID
        script.onload = () => {
          setSdkLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setSdkLoaded(true);
      }
    }
  }, []);

  // Calculate instalment amount for display
  const instalmentAmount = (amount / 3).toFixed(2);

  return (
    <div ref={containerRef} className={className}>
      {/* Klarna placement element - SDK will populate this if loaded */}
      {sdkLoaded && (
        <klarna-placement
          data-key="credit-promotion-badge"
          data-locale={locale}
          data-purchase-amount={purchaseAmount.toString()}
          data-theme={theme}
        />
      )}
      
      {/* Fallback display - always show the calculated amount */}
      {!sdkLoaded && (
        <div className="flex items-center gap-2 text-sm">
          <img src={klarnaLogo} alt="Klarna" className="h-5 w-5" />
          <span className="text-muted-foreground">
            £{amount} over 3 months – £{instalmentAmount}/mo
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Klarna badge with calculated instalments (no SDK required)
 */
export function KlarnaInstalmentBadge({ 
  amount, 
  className = "" 
}: { 
  amount: number; 
  className?: string;
}) {
  const instalmentAmount = (amount / 3).toFixed(2);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={klarnaLogo} alt="Klarna" className="h-5 w-5" />
      <span className="text-xs text-muted-foreground">
        £{amount} over 3 months (£{instalmentAmount}/mo)
      </span>
    </div>
  );
}
