import { useState, useCallback, useEffect } from "react";
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
  const size = 72;
  const radius = 30;
  const stroke = 6;
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
        <span className="text-[18px] font-extrabold text-white leading-none tabular-nums">{completed}</span>
        <span className="text-[9px] font-medium text-white/45 leading-tight mt-0.5">of {t}</span>
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
        <div ref={emblaRef} className="overflow-hidden -mx-1">
          <div className="flex">
            {periods.map((period) => (
              <div key={period.label} className="min-w-0 shrink-0 grow-0 basis-full px-1">
                <div
                  className="rounded-2xl p-4 border border-white/[0.08]"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {/* Period label row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                      {period.label}
                    </span>
                    <span className="text-[10px] text-white/30 tabular-nums">
                      {period.completed}/{period.lessons} complete
                    </span>
                  </div>

                  {/* Main content: 3 columns */}
                  <div className="flex items-center gap-4">
                    {/* Left: Big lesson number */}
                    <div className="min-w-0">
                      <p className="text-[42px] font-black text-white leading-none tabular-nums" style={{ letterSpacing: "-0.03em" }}>
                        {period.lessons}
                      </p>
                      <p className="text-[11px] font-medium text-white/40 mt-1">
                        lesson{period.lessons !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Centre: Ring */}
                    <ProgressRing completed={period.completed} total={period.lessons} />

                    {/* Right: Stats column */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 bg-white/[0.06] rounded-xl px-3 py-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <PoundSterling className="h-3 w-3 text-emerald-400" />
                        </div>
                        <span className="text-[14px] font-bold text-white tabular-nums">
                          £{period.earnings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/[0.06] rounded-xl px-3 py-2">
                        <div className="w-6 h-6 rounded-md bg-sky-500/20 flex items-center justify-center shrink-0">
                          <Clock className="h-3 w-3 text-sky-400" />
                        </div>
                        <span className="text-[14px] font-bold text-white tabular-nums">
                          {period.hours}h
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/[0.06] rounded-xl px-3 py-2">
                        <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-amber-400" />
                        </div>
                        <span className="text-[14px] font-bold text-white tabular-nums">
                          {period.completed}
                        </span>
                        <span className="text-[9px] text-white/35">done</span>
                      </div>
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
                i === selectedIndex
                  ? "w-5 bg-white"
                  : "w-[5px] bg-white/25"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
