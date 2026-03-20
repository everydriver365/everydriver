import { useState, useCallback, useEffect } from "react";
import { PoundSterling, Clock3, CheckCircle2 } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import type { PeriodStats } from "@/hooks/useHeroStats";

interface HomepageHeroProps {
  firstName: string;
  heroImageUrl?: string | null;
  profileImageUrl?: string | null;
  periods: PeriodStats[];
  drivingScore?: number;
}

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const safeTotal = Math.max(total, 1);
  const size = 74;
  const radius = 30;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(completed / safeTotal, 1);
  const dashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full bg-muted/35 shadow-inner">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(154 70% 45%)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-black leading-none tracking-[-0.04em] text-foreground tabular-nums">
          {completed}/{safeTotal}
        </span>
      </div>
    </div>
  );
}

function StatItem({
  icon: Icon,
  value,
  label,
  bubble,
  iconColor,
}: {
  icon: typeof PoundSterling;
  value: string;
  label: string;
  bubble: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: bubble }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>

      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-none text-foreground tabular-nums">{value}</p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

export function HomepageHero({
  firstName,
  heroImageUrl,
  profileImageUrl,
  periods,
  drivingScore = 100,
}: HomepageHeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div className="bg-primary pb-8" />

      <div className="-mt-6 px-4">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {periods.map((period) => (
              <div key={period.label} className="min-w-0 shrink-0 grow-0 basis-full">
                <div
                  className="rounded-[28px] border border-border/50 bg-card px-4 py-4 overflow-hidden relative"
                  style={{
                    boxShadow:
                      "0 18px 38px -22px rgba(15, 23, 42, 0.35), 0 10px 18px -16px rgba(15, 23, 42, 0.2), inset 0 1px 0 rgba(255,255,255,0.6)",
                  }}
                >
                  {/* Coloured accent bar at top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400" />

                  <div className="mb-3 flex items-center justify-between gap-3 mt-1">
                    <span className="inline-flex rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm shadow-emerald-500/30">
                      {period.label}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {period.completed}/{Math.max(period.lessons, 1)} complete
                    </span>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.15fr)] items-center gap-3">
                    <div className="border-r border-border/70 pr-3">
                      <p className="text-[42px] font-black leading-none tracking-[-0.06em] text-foreground tabular-nums">
                        {period.lessons}
                      </p>
                      <p className="mt-1 text-[12px] font-medium text-muted-foreground">
                        lesson{period.lessons !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="border-r border-border/70 px-3">
                      <ProgressRing completed={period.completed} total={period.lessons} />
                    </div>

                    <div className="space-y-3 pl-1">
                      <StatItem
                        icon={PoundSterling}
                        value={`£${period.earnings.toLocaleString()}`}
                        label="earned"
                        bubble="hsl(154 70% 45% / 0.12)"
                        iconColor="hsl(154 70% 40%)"
                      />
                      <StatItem
                        icon={Clock3}
                        value={`${period.hours}h`}
                        label="worked"
                        bubble="hsl(204 94% 47% / 0.12)"
                        iconColor="hsl(204 94% 43%)"
                      />
                      <StatItem
                        icon={CheckCircle2}
                        value={`${period.completed}`}
                        label="done"
                        bubble="hsl(38 92% 50% / 0.14)"
                        iconColor="hsl(38 92% 45%)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex justify-center gap-1.5 pb-1">
          {periods.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === selectedIndex ? "w-5 bg-foreground" : "w-1.5 bg-muted-foreground/25"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
