import { Repeat, ChevronRight } from "lucide-react";

interface SwapProfileRowProps {
  optedIn: boolean;
  onClick: () => void;
}

export function SwapProfileRow({ optedIn, onClick }: SwapProfileRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-3.5 bg-card rounded-xl border border-border hover:bg-secondary/40 active:bg-secondary transition-colors text-left mt-3"
    >
      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#E6F1FB]">
        <Repeat className="h-[18px] w-[18px] text-[#1A52A0]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">Test swap</p>
          {optedIn && (
            <span className="bg-[#E1F5EE] text-[#085041] text-[10px] font-medium rounded-full px-2 py-0.5">
              Active
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {optedIn ? "Active — showing your slot" : "Not joined"}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </button>
  );
}
