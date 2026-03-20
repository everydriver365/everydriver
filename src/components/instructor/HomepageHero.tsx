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
  const size = 64;
  const radius = 26;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const t = total || 1;
  const progress = Math.min(completed / t, 1);
  const dashoffset = circumference * (1 - progress);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} opacity={0.3}
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
        <span className="text-[16px] font-bold text-foreground leading-none tabular-nums">{completed}/{t}</span>
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
      {/* Dark header with avatar + greeting */}
      <div className="bg-primary text-primary-foreground px-5 pt-1 pb-8 rounded-b-3xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center gap-3 pt-1">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={firstName}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-foreground/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 border-2 border-primary-foreground/20 flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-primary-foreground leading-tight">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {firstName}
            </p>
            <p className="text-[11px] text-primary-foreground/50 mt-0.5">
              {format(new Date(), "EEEE d MMMM")}
            </p>
          </div>
        </div>
      </div>

      {/* White glassmorphic card overlapping the dark header */}
      <div className="px-4 -mt-5">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {periods.map((period) => (
              <div key={period.label} className="min-w-0 shrink-0 grow-0 basis-full">
                <div className="bg-card rounded-2xl border border-border/50 shadow-lg shadow-black/5 px-4 py-3.5">
                  {/* Period badge */}
                  <div className="mb-3">
                    <span className="inline-block bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {period.label}
                    </span>
                  </div>

                  {/* 3-column layout */}
                  <div className="flex items-center">
                    {/* Column 1: Lesson count */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[36px] font-extrabold text-foreground leading-none tabular-nums">
                        {period.lessons}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-1">
                        lesson{period.lessons !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Column 2: Progress ring */}
                    <div className="px-3">
                      <ProgressRing completed={period.completed} total={period.lessons} />
                    </div>

                    {/* Column 3: Stacked stats with icons on right */}
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-foreground tabular-nums leading-none">
                          £{period.earnings.toLocaleString()}
                        </span>
                        <PoundSterling className="h-4 w-4 text-emerald-500 shrink-0" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-foreground tabular-nums leading-none">
                          {period.hours}h
                        </span>
                        <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-foreground tabular-nums leading-none">
                          {period.completed} done
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2.5">
          {periods.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === selectedIndex ? "w-4 bg-foreground" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
