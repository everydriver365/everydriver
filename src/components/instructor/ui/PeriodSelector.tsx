import { useState } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Premium tile-system period selector.
 *
 * Used in the Driving Report header and shared across dashboards
 * (Earnings, WeekAtAGlance). Renders a thin row with a calendar icon,
 * a system-blue label showing the current range, and a chevron — taps
 * open a popover list of preset periods.
 *
 * The component is presentation-only: the parent owns `value`, computes
 * the displayed `rangeLabel`, and reacts to `onChange`.
 */

export type PeriodKey =
  | "this_week"
  | "last_7_days"
  | "last_30_days"
  | "this_year"
  | "all_time";

export interface PeriodOption {
  value: PeriodKey;
  label: string;
}

export const DEFAULT_PERIOD_OPTIONS: ReadonlyArray<PeriodOption> = [
  { value: "this_week", label: "This week" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_year", label: "This year" },
  { value: "all_time", label: "All time" },
];

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

export interface PeriodSelectorProps {
  value: PeriodKey;
  /** Human-readable range for the currently selected period (e.g. "27 Mar – 27 Apr"). */
  rangeLabel: string;
  onChange: (value: PeriodKey) => void;
  options?: ReadonlyArray<PeriodOption>;
  className?: string;
}

export function PeriodSelector({
  value,
  rangeLabel,
  onChange,
  options = DEFAULT_PERIOD_OPTIONS,
  className,
}: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={className}
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontFamily: FONT_STACK,
          }}
          aria-label="Change period"
        >
          <Calendar size={14} strokeWidth={1.6} color="#6E6E73" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#2B7BC8",
            }}
          >
            {rangeLabel}
          </span>
          <ChevronDown size={10} strokeWidth={1.6} color="#2B7BC8" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-1 w-48"
        style={{
          background: "#FFFFFF",
          border: "0.5px solid #E5E5EA",
          borderRadius: 12,
          fontFamily: FONT_STACK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  background: "transparent",
                  border: 0,
                  padding: "8px 10px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#000000",
                  fontWeight: active ? 500 : 400,
                  textAlign: "left",
                }}
              >
                <span>{opt.label}</span>
                {active && (
                  <Check size={14} strokeWidth={2} color="#2B7BC8" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
