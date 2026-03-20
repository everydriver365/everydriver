import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { PoundSterling, Clock, BookOpen } from "lucide-react";
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
  const size = 56;
  const radius = 23;
  const stroke = 4.5;
  const circumference = 2 * Math.PI * radius;
  const t = total || 1;
  const progress = Math.min(completed / t, 1);
  const dashoffset = circumference * (1 - progress);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#34D399" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-bold text-white leading-none tabular-nums">{completed}</span>
        <span className="text-[8px] font-medium text-white/50 leading-tight mt-0.5">of {t}</span>
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
    <div className="bg-primary" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="px-4 pt-2 pb-3">
        {/* Swipeable glass cards */}
        <div>
          <div ref={emblaRef} className="overflow-hidden -mx-1">
            <div className="flex">
              {periods.map((period) => (
                <div key={period.label} className="min-w-0 shrink-0 grow-0 basis-full px-1">
                  <div className="bg-white/[0.10] backdrop-blur-sm rounded-2xl border border-white/[0.08] px-4 py-3">
                    {/* Period label */}
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300 mb-2.5">
                      {period.label}
                    </p>

                    {/* 3-column layout: Lessons | Ring | Stats */}
                    <div className="flex items-center gap-3">
                      {/* Column 1: Lesson count */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[28px] font-extrabold text-white leading-none tabular-nums">
                          {period.lessons}
                        </p>
                        <p className="text-[11px] text-white/45 mt-0.5">
                          lesson{period.lessons !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Column 2: Progress ring */}
                      <ProgressRing completed={period.completed} total={period.lessons} />

                      {/* Column 3: Stacked stats */}
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <PoundSterling className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span className="text-[12px] font-bold text-white tabular-nums leading-none">
                            £{period.earnings.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-sky-400 shrink-0" />
                          <span className="text-[12px] font-bold text-white tabular-nums leading-none">
                            {period.hours}h
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3 w-3 text-amber-400 shrink-0" />
                          <span className="text-[12px] font-bold text-white tabular-nums leading-none">
                            {period.completed}
                          </span>
                          <span className="text-[9px] text-white/40 leading-none">done</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mt-2">
            {periods.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === selectedIndex ? "w-4 bg-white" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
