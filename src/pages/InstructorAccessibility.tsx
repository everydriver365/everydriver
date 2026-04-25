import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Type, Contrast, Sparkles, Hand } from "lucide-react";
import {
  useAccessibility,
  TEXT_SCALE_LABELS,
  TEXT_SCALE_VALUES,
  type TextScale,
} from "@/context/AccessibilityContext";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SCALES: TextScale[] = ["sm", "md", "lg", "xl"];

export default function InstructorAccessibility() {
  const navigate = useNavigate();
  const a11y = useAccessibility();

  return (
    <div
      className="min-h-screen ios-instructor instructor-portal"
      style={{ backgroundColor: "hsl(var(--dsm-bg))" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--dsm-border))]"
        style={{
          backgroundColor: "hsl(var(--dsm-bg))",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full flex items-center justify-center bg-white shadow-sm border border-[hsl(var(--dsm-border))]"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" style={{ color: "hsl(var(--dsm-text))" }} />
        </button>
        <h1
          className="text-[17px] font-semibold"
          style={{ color: "hsl(var(--dsm-text))" }}
        >
          Accessibility
        </h1>
      </div>

      <div className="px-4 py-4 space-y-5 pb-20">
        {/* Live preview */}
        <section className="rounded-2xl bg-white border border-[hsl(var(--dsm-border))] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6E6E73] mb-2">
            Preview
          </p>
          <p
            className="font-medium leading-snug"
            style={{
              color: "hsl(var(--dsm-text))",
              fontSize: `${15 * TEXT_SCALE_VALUES[a11y.textScale]}px`,
            }}
          >
            The quick brown fox jumps over the lazy dog.
          </p>
          <p
            className="mt-1 text-[#6E6E73]"
            style={{
              fontSize: `${13 * TEXT_SCALE_VALUES[a11y.textScale]}px`,
            }}
          >
            This is how secondary text will appear.
          </p>
        </section>

        {/* Text size */}
        <section>
          <p className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6E6E73]">
            Text size
          </p>
          <div className="rounded-2xl bg-white border border-[hsl(var(--dsm-border))] p-3">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Type className="h-4 w-4 text-[#6E6E73]" />
              <span className="text-[13px] text-[#6E6E73]">
                Adjusts text across the app
              </span>
            </div>
            <div
              className="grid gap-1 p-1 rounded-xl"
              style={{
                gridTemplateColumns: "repeat(4, 1fr)",
                backgroundColor: "hsl(var(--dsm-bg))",
              }}
            >
              {SCALES.map((s) => {
                const active = a11y.textScale === s;
                return (
                  <button
                    key={s}
                    onClick={() => a11y.setTextScale(s)}
                    className={cn(
                      "py-2 rounded-lg text-center transition-all",
                      active
                        ? "bg-white shadow-sm font-semibold"
                        : "text-[#6E6E73] active:bg-white/60"
                    )}
                    style={{
                      color: active ? "hsl(var(--dsm-text))" : undefined,
                      fontSize: 11 + SCALES.indexOf(s) * 2,
                    }}
                    aria-pressed={active}
                  >
                    {TEXT_SCALE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Display toggles */}
        <section>
          <p className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6E6E73]">
            Display
          </p>
          <div className="rounded-2xl bg-white border border-[hsl(var(--dsm-border))] overflow-hidden">
            <ToggleRow
              icon={Contrast}
              title="High contrast"
              subtitle="Stronger text and borders"
              checked={a11y.highContrast}
              onChange={a11y.setHighContrast}
            />
            <ToggleRow
              icon={Sparkles}
              title="Reduce motion"
              subtitle="Minimise animations and transitions"
              checked={a11y.reduceMotion}
              onChange={a11y.setReduceMotion}
            />
            <ToggleRow
              icon={Hand}
              title="Larger tap targets"
              subtitle="Adds extra padding to buttons"
              checked={a11y.largeTapTargets}
              onChange={a11y.setLargeTapTargets}
              isLast
            />
          </div>
        </section>

        {/* Reset */}
        <button
          onClick={a11y.reset}
          className="w-full rounded-2xl bg-white border border-[hsl(var(--dsm-border))] py-3.5 flex items-center justify-center gap-2 text-[15px] font-medium active:bg-[hsl(var(--dsm-bg))]"
          style={{ color: "hsl(var(--dsm-text))" }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  subtitle,
  checked,
  onChange,
  isLast,
}: {
  icon: typeof Contrast;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        !isLast && "border-b border-[hsl(var(--dsm-border))]"
      )}
    >
      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[hsl(var(--dsm-bg))] shrink-0">
        <Icon className="h-4 w-4" style={{ color: "hsl(var(--dsm-text))" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[15px] font-medium leading-tight"
          style={{ color: "hsl(var(--dsm-text))" }}
        >
          {title}
        </div>
        <div className="text-[12px] text-[#6E6E73] leading-tight mt-0.5">{subtitle}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
