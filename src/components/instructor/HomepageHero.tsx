import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { PoundSterling, Clock, BookOpen } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import instructorHeroImg from "@/assets/hero-instructor.jpg";
import type { PeriodStats } from "@/hooks/useHeroStats";

interface HomepageHeroProps {
  firstName: string;
  heroImageUrl?: string | null;
  profileImageUrl?: string | null;
  periods: PeriodStats[];
  drivingScore?: number;
}

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const size = 54;
  const radius = 22;
  const stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const t = total || 1;
  const progress = Math.min(completed / t, 1);
  const dashoffset = circumference * (1 - progress);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke}
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Good Morning, ${firstName}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon, ${firstName}`;
    if (hour >= 17 && hour < 21) return `Good Evening, ${firstName}`;
    return `Hello, ${firstName}`;
  };

  const today = periods[0];

  return (
    <div className="relative overflow-hidden hero-banner-no-top-radius" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Background */}
      <img
        src={heroImageUrl || instructorHeroImg}
        alt="Driving scene"
        className="absolute inset-0 h-full w-full object-cover !rounded-none"
      />
      <div className="absolute inset-0 bg-primary/85" />

      {/* Content */}
      <div className="relative z-10 px-5 pt-5 pb-3 flex flex-col gap-3">
        {/* Top — avatar + greeting */}
        <div className="flex items-center gap-3">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={firstName}
              className="w-11 h-11 rounded-full object-cover border-2 border-white/30 shadow-lg"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/15 border-2 border-white/20 flex items-center justify-center">
              <span className="text-white font-semibold text-[16px]">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1
              className="text-[20px] font-bold text-white leading-tight"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
            >
              {getGreeting()}
            </h1>
            <p className="text-[11px] text-white/55 mt-0.5">
              {format(new Date(), "EEEE d MMMM")}
            </p>
          </div>
        </div>

        {/* Swipeable period cards */}
        <div>
          <div ref={emblaRef} className="overflow-hidden -mx-1">
            <div className="flex">
              {periods.map((period, i) => (
                <div key={period.label} className="min-w-0 shrink-0 grow-0 basis-full px-1">
                  <div className="bg-white/[0.12] backdrop-blur-sm rounded-2xl border border-white/[0.08] p-4">
                    {/* Period label + progress ring */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
                          {period.label}
                        </p>
                        <p className="text-[28px] font-extrabold text-white leading-none mt-1 tabular-nums">
                          {period.lessons}
                          <span className="text-[13px] font-medium text-white/45 ml-1.5">
                            lesson{period.lessons !== 1 ? "s" : ""}
                          </span>
                        </p>
                      </div>
                      <ProgressRing completed={period.completed} total={period.lessons} />
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1.5 flex-1 bg-white/[0.08] rounded-lg px-2.5 py-2">
                        <PoundSterling className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[13px] font-bold text-white tabular-nums">
                          £{period.earnings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 bg-white/[0.08] rounded-lg px-2.5 py-2">
                        <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        <span className="text-[13px] font-bold text-white tabular-nums">
                          {period.hours}h
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 bg-white/[0.08] rounded-lg px-2.5 py-2">
                        <BookOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="text-[13px] font-bold text-white tabular-nums">
                          {period.completed}
                        </span>
                        <span className="text-[9px] text-white/40">done</span>
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
