import { Bell, ChevronRight } from "lucide-react";

interface SwapNotificationsRowProps {
  onClick: () => void;
}

export function SwapNotificationsRow({ onClick }: SwapNotificationsRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-3.5 bg-card rounded-xl border border-border hover:bg-secondary/40 active:bg-secondary transition-colors text-left mt-3"
    >
      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#E6F1FB]">
        <Bell className="h-[18px] w-[18px] text-[#1A52A0]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Test swap alerts</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Notifications when a swap match is found
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </button>
  );
}
