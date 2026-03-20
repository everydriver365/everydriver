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
  const size = 80;
  const radius = 34;
  const stroke = 7;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(completed / safeTotal, 1);
  const dashoffset = circumference * (1 - progress);

  return (
    <div className="relative shrink-0 mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="#34D399" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-black text-white leading-none tabular-nums">{completed}</span>
        <span className="text-[9px] font-semibold text-white/40 mt-0.5">of {safeTotal}</span>
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
      <div className="px-4 pt-1 pb-4">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-3">
            {periods.map((period) => (
              <div key={period.label} className="min-w-0 shrink-0 grow-0 basis-full">
                <div
                  className="rounded-3xl overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {/* Top section: period + lesson count + ring */}
                  <div className="px-4 pt-4 pb-3 flex items-center gap-4">
                    {/* Left: period + lessons */}
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 mb-1.5">
                        {period.label}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[48px] font-black text-white leading-none tabular-nums" style={{ letterSpacing: "-0.04em" }}>
                          {period.lessons}
                        </span>
                        <span className="text-[13px] font-medium text-white/35">
                          lesson{period.lessons !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    {/* Right: ring */}
                    <ProgressRing completed={period.completed} total={period.lessons} />
                  </div>

                  {/* Bottom: 3 stat tiles */}
                  <div className="px-3 pb-3 grid grid-cols-3 gap-2">
                    {/* Earned */}
                    <div className="rounded-2xl bg-emerald-500/15 px-3 py-2.5 text-center">
                      <PoundSterling className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                      <p className="text-[15px] font-bold text-white tabular-nums leading-none">
                        £{period.earnings.toLocaleString()}
                      </p>
                      <p className="text-[9px] font-semibold text-emerald-300/60 uppercase tracking-wider mt-1">
                        Earned
                      </p>
                    </div>
                    {/* Hours */}
                    <div className="rounded-2xl bg-sky-500/15 px-3 py-2.5 text-center">
                      <Clock3 className="h-4 w-4 text-sky-400 mx-auto mb-1" />
                      <p className="text-[15px] font-bold text-white tabular-nums leading-none">
                        {period.hours}h
                      </p>
                      <p className="text-[9px] font-semibold text-sky-300/60 uppercase tracking-wider mt-1">
                        Hours
                      </p>
                    </div>
                    {/* Done */}
                    <div className="rounded-2xl bg-amber-500/15 px-3 py-2.5 text-center">
                      <CheckCircle2 className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                      <p className="text-[15px] font-bold text-white tabular-nums leading-none">
                        {period.completed}
                      </p>
                      <p className="text-[9px] font-semibold text-amber-300/60 uppercase tracking-wider mt-1">
                        Done
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {periods.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-[5px] rounded-full transition-all duration-300 ${
                i === selectedIndex ? "w-5 bg-white" : "w-[5px] bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
