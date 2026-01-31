import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScheduleFABProps {
  onClick: () => void;
  className?: string;
}

export function ScheduleFAB({ onClick, className }: ScheduleFABProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "flex items-center justify-center p-0",
        "touch-manipulation active:scale-95 transition-transform",
        "md:hidden", // Only show on mobile
        className
      )}
      aria-label="Add lesson"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
