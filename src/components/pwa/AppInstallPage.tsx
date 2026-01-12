import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePWAConfig } from "@/hooks/usePWAConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  Smartphone, 
  Share, 
  Plus, 
  Check, 
  ArrowRight,
  Monitor,
  ChevronDown
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface AppInstallPageProps {
  appType: 'instructor' | 'pupil' | 'parent';
}

export function AppInstallPage({ appType }: AppInstallPageProps) {
  const { data: config, isLoading } = usePWAConfig(appType);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
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
    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Skeleton className="h-96 w-full max-w-md" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">App configuration not found</p>
      </div>
    );
  }

  const themeColor = config.theme_color || '#1e3a5f';

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md"
        >
          {/* App Icon & Name */}
          <div className="mb-8 text-center text-white">
            {config.icon_192_url ? (
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                src={config.icon_192_url}
                alt={config.app_name}
                className="mx-auto mb-4 h-24 w-24 rounded-2xl shadow-2xl"
              />
            ) : (
              <div 
                className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 shadow-2xl"
              >
                <Smartphone className="h-12 w-12 text-white" />
              </div>
            )}
            <h1 className="text-2xl font-bold">{config.app_name}</h1>
            {config.description && (
              <p className="mt-2 text-white/80">{config.description}</p>
            )}
          </div>

          {/* Install Card */}
          <Card className="mb-6 overflow-hidden shadow-2xl">
            <CardContent className="p-6">
              {isInstalled ? (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold">App Installed!</h2>
                  <p className="mb-4 text-muted-foreground">
                    {config.app_name} is now on your home screen
                  </p>
                  <Button 
                    onClick={() => window.location.href = config.start_url}
                    className="w-full"
                    style={{ backgroundColor: themeColor }}
                  >
                    Open App
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-xl font-semibold">Install the App</h2>
                    <p className="text-muted-foreground">
                      Add {config.short_name} to your home screen for the best experience
                    </p>
                  </div>

                  {deferredPrompt ? (
                    <Button 
                      onClick={handleInstall}
                      className="w-full"
                      size="lg"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Install Now
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setShowInstructions(true)}
                      className="w-full"
                      size="lg"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      How to Install
                    </Button>
                  )}

                  {showInstructions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6"
                    >
                      {isIOS ? (
                        <div className="space-y-4">
                          <h3 className="font-semibold">Install on iOS:</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">1</div>
                              <div className="flex-1">
                                <span>Tap the </span>
                                <Share className="inline h-4 w-4" />
                                <span> Share button</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">2</div>
                              <span>Scroll down and tap "Add to Home Screen"</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">3</div>
                              <div className="flex-1">
                                <span>Tap </span>
                                <Plus className="inline h-4 w-4" />
                                <span> Add</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : isAndroid ? (
                        <div className="space-y-4">
                          <h3 className="font-semibold">Install on Android:</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">1</div>
                              <span>Tap the menu (⋮) in your browser</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">2</div>
                              <span>Tap "Add to Home screen" or "Install app"</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">3</div>
                              <span>Confirm by tapping "Add" or "Install"</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="font-semibold">Install on Desktop:</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                              <Monitor className="h-5 w-5 text-muted-foreground" />
                              <span>Look for the install icon in your browser's address bar</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="mt-4 flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {showInstructions ? 'Hide' : 'Show'} installation instructions
                    <ChevronDown className={`h-4 w-4 transition-transform ${showInstructions ? 'rotate-180' : ''}`} />
                  </button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="space-y-3 text-white/90">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5" />
              <span>Fast & responsive</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5" />
              <span>Get notifications</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5" />
              <span>Always up to date</span>
            </div>
          </div>

          {/* Skip Link */}
          <div className="mt-8 text-center">
            <a 
              href={config.start_url}
              className="text-white/70 underline hover:text-white"
            >
              Continue in browser instead
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
