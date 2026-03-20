import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import useEmblaCarousel from "embla-carousel-react";
import type { PeriodStats } from "@/hooks/useHeroStats";

interface HomepageHeroProps {
  firstName: string;
  heroImageUrl?: string | null;
  profileImageUrl?: string | null;
  periods: PeriodStats[];
  drivingScore?: number;
}

function MiniRing({ completed, total }: { completed: number; total: number }) {
  const size = 36;
  const radius = 14;
  const stroke = 3.5;
  const circumference = 2 * Math.PI * radius;
  const t = total || 1;
  const progress = Math.min(completed / t, 1);
  const dashoffset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--warning) / 0.2)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="hsl(var(--warning))" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashoffset}
        style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
      />
    </svg>
  );
}

export function HomepageHero({
  firstName,
  profileImageUrl,
  periods,
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
    if (hour >= 5 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 21) return "Evening";
    return "Hello";
  };

  return (
    <div className="bg-primary px-4 pb-3 -mt-12 pt-14 relative z-30">
      {/* Greeting row */}
      <div className="flex items-center gap-2.5 mb-3">
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt={firstName}
            className="w-9 h-9 rounded-full object-cover border-2 border-primary-foreground/25 shadow"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary-foreground/15 border-2 border-primary-foreground/20 flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-sm">
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-primary-foreground leading-tight">
            {getGreeting()}, {firstName}
          </p>
          <p className="text-[11px] text-primary-foreground/50 mt-0.5">
            {format(new Date(), "EEEE d MMMM")}
          </p>
        </div>
      </div>

      {/* Swipeable widget tiles */}
      <div ref={emblaRef} className="overflow-hidden -mx-1">
        <div className="flex">
          {periods.map((period) => (
            <div key={period.label} className="min-w-0 shrink-0 grow-0 basis-full px-1">
              <div className="grid grid-cols-4 gap-2">
                {/* Lessons tile */}
                <div className="bg-card rounded-xl p-2.5 flex flex-col items-center shadow-sm">
                  <span className="text-[22px] font-bold text-foreground leading-none tabular-nums">
                    {period.lessons}
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground mt-1">lessons</span>
                  <div className="w-full h-1 rounded-full bg-muted mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--success))] transition-all duration-700"
                      style={{ width: `${period.lessons ? (period.completed / period.lessons) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Earnings tile */}
                <div className="bg-card rounded-xl p-2.5 flex flex-col items-center shadow-sm">
                  <span className="text-[22px] font-bold text-foreground leading-none tabular-nums">
                    £{period.earnings >= 1000 ? `${(period.earnings / 1000).toFixed(1)}k` : period.earnings}
                  </span>
                  <span className="text-[9px] font-medium text-[hsl(var(--success))] mt-1">earned</span>
                </div>

                {/* Hours tile */}
                <div className="bg-card rounded-xl p-2.5 flex flex-col items-center shadow-sm">
                  <span className="text-[22px] font-bold text-foreground leading-none tabular-nums">
                    {period.hours}
                  </span>
                  <span className="text-[9px] font-medium text-[hsl(var(--ring)/0.6)] mt-1">hours</span>
                  <div className="w-full h-1 rounded-full bg-muted mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--ring))] transition-all duration-700"
                      style={{ width: `${Math.min((period.hours / 8) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Done tile */}
                <div className="bg-card rounded-xl p-2.5 flex flex-col items-center shadow-sm">
                  <MiniRing completed={period.completed} total={period.lessons} />
                  <span className="text-[9px] font-medium text-muted-foreground mt-0.5">done</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators + period label */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        {periods.map((p, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`rounded-full transition-all duration-200 ${
              i === selectedIndex
                ? "h-1.5 w-8 bg-primary-foreground"
                : "h-1.5 w-1.5 bg-primary-foreground/30"
            }`}
          />
        ))}
        <span className="text-[10px] text-primary-foreground/50 ml-2 font-medium">
          {periods[selectedIndex]?.label}
        </span>
      </div>
    </div>
  );
}
