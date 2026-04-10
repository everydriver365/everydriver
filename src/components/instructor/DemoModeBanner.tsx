import { AlertTriangle, Eye, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoMode } from "@/context/DemoModeContext";
import { Card, CardContent } from "@/components/ui/card";

/** Persistent amber banner shown when demo mode is active */
export function DemoModeBanner() {
  const { isDemoMode, toggleDemoMode, loading } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="bg-amber-500/15 border border-amber-500/30 rounded-none px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <Eye className="h-4 w-4 shrink-0" />
        <p className="text-xs font-medium">
          <span className="font-bold">Demo Mode</span> — You're viewing sample data. Your real account is unaffected.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDemoMode}
        disabled={loading}
        className="text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs h-7 px-2 shrink-0"
      >
        Exit Demo
      </Button>
    </div>
  );
}

/** Invitation card shown to new instructors with empty accounts */
export function DemoModeInviteCard() {
  const { isDemoMode, toggleDemoMode, loading } = useDemoMode();

  if (isDemoMode) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-none bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Explore with Demo Mode</p>
            <p className="text-xs text-muted-foreground">
              See what the app looks like with pupils, lessons, and payments — all using sample data that won't affect your real account.
            </p>
          </div>
          <Button
            size="sm"
            onClick={toggleDemoMode}
            disabled={loading}
            className="h-8 text-xs"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Try Demo Mode
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
