import { Repeat, ChevronRight } from "lucide-react";

interface SwapNeedsAttentionBannerProps {
  hasTestBooked: boolean;
  optedIn: boolean;
  onClick: () => void;
}

export function SwapNeedsAttentionBanner({ hasTestBooked, optedIn, onClick }: SwapNeedsAttentionBannerProps) {
  if (!hasTestBooked || optedIn) return null;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-stretch gap-0 bg-card rounded-xl border border-border overflow-hidden text-left hover:bg-secondary/30 active:bg-secondary transition-colors"
    >
      <div className="w-1 bg-[#1A52A0] shrink-0" />
      <div className="flex items-center gap-3 p-3.5 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-[#E6F1FB]">
          <Repeat className="h-5 w-5 text-[#1A52A0]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Join test swap network</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Find learners to swap test slots with</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </div>
    </button>
  );
}
