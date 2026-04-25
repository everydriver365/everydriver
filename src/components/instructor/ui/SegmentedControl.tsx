import { ReactNode } from "react";

/**
 * Premium tile-system segmented control.
 *
 * Matches the Today/Tomorrow toggle on HomeTodaySchedule and the All/Active/Passed
 * filter on the Pupils list. Keep all interaction logic in the parent — this is
 * a presentation-only primitive.
 */
export interface SegmentedControlOption<V extends string> {
  value: V;
  label: ReactNode;
}

export interface SegmentedControlProps<V extends string> {
  value: V;
  options: ReadonlyArray<SegmentedControlOption<V>>;
  onChange: (value: V) => void;
  className?: string;
  ariaLabel?: string;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

export function SegmentedControl<V extends string>({
  value,
  options,
  onChange,
  className,
  ariaLabel,
}: SegmentedControlProps<V>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={className}
      style={{
        padding: 4,
        background: "#F2F2F4",
        borderRadius: 10,
        display: "grid",
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "8px 0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              color: active ? "#000000" : "#6E6E73",
              background: active ? "#FFFFFF" : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s cubic-bezier(0.2,0.7,0.2,1)",
              fontFamily: FONT_STACK,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
