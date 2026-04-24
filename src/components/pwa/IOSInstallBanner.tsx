import { useState, useEffect } from "react";
import { detectNativeWrapper } from "@/hooks/useIsNativeWrapper";
import { X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IOSInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if iOS Safari and not in standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    const isDismissed = localStorage.getItem('ios-install-banner-dismissed');

    if (isIOS && !isStandalone && !isDismissed && !detectNativeWrapper()) {
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('ios-install-banner-dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-primary text-primary-foreground px-4 py-3 relative">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {!showInstructions ? (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Install EveryDriver for a fullscreen experience
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="ml-3 shrink-0"
                onClick={() => setShowInstructions(true)}
              >
                Show me how
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">To install:</p>
              <ol className="text-sm space-y-1.5 pl-1">
                <li className="flex items-center gap-2">
                  <span className="bg-primary-foreground/20 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                  <span className="flex items-center gap-1">
                    Tap the Share button <Share className="h-4 w-4 inline" />
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary-foreground/20 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                  <span className="flex items-center gap-1">
                    Scroll and tap "Add to Home Screen" <Plus className="h-4 w-4 inline" />
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary-foreground/20 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                  <span>Tap "Add" to confirm</span>
                </li>
              </ol>
            </div>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-primary-foreground/10 rounded-full shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
