import { useState, useEffect } from "react";
import { detectNativeWrapper } from "@/hooks/useIsNativeWrapper";
import { X, Share, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Drive365InstallBannerProps {
  onDismiss?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function Drive365InstallBanner({ onDismiss }: Drive365InstallBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const checkInstallState = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone === true;
      const isDismissed = localStorage.getItem('everydriver-install-dismissed');
      
      setIsIOS(isIOSDevice);
      
      if (!isStandalone && !isDismissed && !detectNativeWrapper()) {
        setShowBanner(true);
      }
    };

    checkInstallState();

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        handleDismiss();
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('everydriver-install-dismissed', 'true');
    setShowBanner(false);
    onDismiss?.();
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-emerald-500 text-white px-4 py-3"
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              {!showInstructions ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      Install EveryDriver for the best experience
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0"
                    onClick={handleInstall}
                  >
                    {deferredPrompt ? "Install Now" : "Show me how"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">To install EveryDriver:</p>
                  <ol className="text-sm space-y-1.5 pl-1">
                    <li className="flex items-center gap-2">
                      <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                      <span className="flex items-center gap-1">
                        Tap the Share button <Share className="h-4 w-4 inline" />
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                      <span className="flex items-center gap-1">
                        Scroll and tap "Add to Home Screen" <Plus className="h-4 w-4 inline" />
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                      <span>Tap "Add" to confirm</span>
                    </li>
                  </ol>
                </div>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded-full shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
