import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { PoundSterling, Clock, CheckCircle2 } from "lucide-react";
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
  const size = 68;
  const radius = 28;
  const stroke = 5.5;
  const circumference = 2 * Math.PI * radius;
  const t = total || 1;
  const progress = Math.min(completed / t, 1);
  const dashoffset = circumference * (1 - progress);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#10B981" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-extrabold text-foreground leading-none tabular-nums">{completed}</span>
        <span className="text-[9px] font-medium text-muted-foreground leading-tight mt-0.5">of {t}</span>
      </div>
    </div>
  );
}

function StatRow({ icon: Icon, value, label, color }: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-foreground leading-none tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{label}</p>
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
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div>
      {/* Dark extension from header */}
      <div className="bg-primary pb-8" />

      {/* Floating white card */}
      <div className="px-4 -mt-6">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {periods.map((period) => (
              <div key={period.label} className="min-w-0 shrink-0 grow-0 basis-full">
                <div
                  className="bg-card rounded-2xl border border-border/40 p-4"
                  style={{
                    boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08), 0 1px 4px -1px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Period badge */}
                  <span className="inline-block bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
                    {period.label}
                  </span>

                  {/* 3-column layout */}
                  <div className="flex items-center gap-4">
                    {/* Column 1: Lesson count */}
                    <div className="min-w-0">
                      <p className="text-[38px] font-extrabold text-foreground leading-none tabular-nums tracking-tight">
                        {period.lessons}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                        lesson{period.lessons !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Column 2: Progress ring */}
                    <div className="flex-shrink-0">
                      <ProgressRing completed={period.completed} total={period.lessons} />
                    </div>

                    {/* Column 3: Stacked stats */}
                    <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                      <StatRow
                        icon={PoundSterling}
                        value={`£${period.earnings.toLocaleString()}`}
                        label="earned"
                        color="bg-emerald-500"
                      />
                      <StatRow
                        icon={Clock}
                        value={`${period.hours}h`}
                        label="worked"
                        color="bg-blue-500"
                      />
                      <StatRow
                        icon={CheckCircle2}
                        value={`${period.completed}`}
                        label="completed"
                        color="bg-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-3 pb-1">
          {periods.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === selectedIndex
                  ? "w-5 bg-primary"
                  : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
