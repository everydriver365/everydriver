import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FaultEntry } from "./types";
import { cn } from "@/lib/utils";

interface FaultRowProps {
  label: string;
  subLabel?: string;
  value: FaultEntry;
  onChange: (value: FaultEntry) => void;
  indent?: boolean;
  disabled?: boolean;
}

export function FaultRow({
  label,
  subLabel,
  value,
  onChange,
  indent = false,
  disabled = false,
}: FaultRowProps) {
  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const total = parseInt(e.target.value) || 0;
    onChange({ ...value, total: Math.max(0, Math.min(99, total)) });
  };

  const handleSeriousChange = (checked: boolean) => {
    onChange({ ...value, serious: checked, dangerous: checked ? false : value.dangerous });
  };

  const handleDangerousChange = (checked: boolean) => {
    onChange({ ...value, dangerous: checked, serious: checked ? false : value.serious });
  };

  const hasAnyFault = value.total > 0 || value.serious || value.dangerous;

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_50px_32px_32px] gap-1 items-center py-1 px-2 border-b border-border/50 hover:bg-muted/30 transition-colors",
        indent && "pl-6",
        hasAnyFault && "bg-amber-50 dark:bg-amber-950/30",
        value.serious && "bg-orange-100 dark:bg-orange-950/40",
        value.dangerous && "bg-red-100 dark:bg-red-950/40"
      )}
    >
      <div className="min-w-0">
        <span className="text-xs font-medium truncate block">{label}</span>
        {subLabel && (
          <span className="text-[10px] text-muted-foreground truncate block">{subLabel}</span>
        )}
      </div>
      <Input
        type="number"
        min={0}
        max={99}
        value={value.total || ""}
        onChange={handleTotalChange}
        disabled={disabled}
        className="h-7 w-12 text-center text-xs p-1"
        placeholder="0"
      />
      <Checkbox
        checked={value.serious}
        onCheckedChange={handleSeriousChange}
        disabled={disabled}
        className="h-5 w-5 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
        title="Serious"
      />
      <Checkbox
        checked={value.dangerous}
        onCheckedChange={handleDangerousChange}
        disabled={disabled}
        className="h-5 w-5 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
        title="Dangerous"
      />
    </div>
  );
}
