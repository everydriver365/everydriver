import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import instructorHeroImg from "@/assets/hero-instructor.jpg";

interface SlideData {
  label: string;
  completed: number;
  total: number;
  subtitle: string;
  gradientId: string;
}

interface HomepageHeroProps {
  firstName: string;
  heroImageUrl?: string | null;
  profileImageUrl?: string | null;
  weeklyLessonsScheduled: number;
  weeklyLessonsCompleted: number;
  weeklyLessonsTotal: number;
  todayCompleted: number;
  todayTotal: number;
  monthlyCompleted: number;
  monthlyScheduled: number;
  monthlyTotal: number;
}

function ProgressRing({ completed, total, scheduled, gradientId }: { completed: number; total: number; scheduled: number; gradientId: string }) {
  const radius = 28;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const t = total || 1;
  const completedOffset = circumference * (1 - Math.min(completed / t, 1));
  const scheduledOffset = circumference * (1 - Math.min(scheduled / t, 1));

  return (
    <div className="relative w-[68px] h-[68px] shrink-0">
      <svg viewBox="0 0 68 68" className="w-full h-full -rotate-90">
        <circle cx="34" cy="34" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} opacity={0.4} />
        <defs>
          <linearGradient id={`${gradientId}-green`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>
          <linearGradient id={`${gradientId}-red`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DAE4E1" />
            <stop offset="100%" stopColor="#C8D4D0" />
          </linearGradient>
        </defs>
        <motion.circle cx="34" cy="34" r={radius} fill="none" stroke={`url(#${gradientId}-red)`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: scheduledOffset }} transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.2 }} />
        <motion.circle cx="34" cy="34" r={radius} fill="none" stroke={`url(#${gradientId}-green)`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: completedOffset }} transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.4 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-bold text-foreground leading-none tabular-nums">{completed}</span>
        <span className="text-[9px] font-medium text-muted-foreground leading-tight mt-0.5">of {t}</span>
      </div>
    </div>
  );
}

export function HomepageHero({
  firstName,
  heroImageUrl,
  profileImageUrl,
  weeklyLessonsScheduled,
  weeklyLessonsCompleted,
  weeklyLessonsTotal,
  todayCompleted,
  todayTotal,
  monthlyCompleted,
  monthlyScheduled,
  monthlyTotal,
}: HomepageHeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "center" });
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

  const slides: SlideData[] = [
    {
      label: "TODAY",
      completed: todayCompleted,
      total: todayTotal,
      subtitle: `${todayTotal} lesson${todayTotal !== 1 ? "s" : ""} today`,
      gradientId: "ring-today",
    },
    {
      label: "THIS WEEK",
      completed: weeklyLessonsCompleted,
      total: weeklyLessonsTotal,
      subtitle: `${weeklyLessonsScheduled} lesson${weeklyLessonsScheduled !== 1 ? "s" : ""} scheduled`,
      gradientId: "ring-week",
    },
    {
      label: "THIS MONTH",
      completed: monthlyCompleted,
      total: monthlyTotal,
      subtitle: `${monthlyTotal} lesson${monthlyTotal !== 1 ? "s" : ""} this month`,
      gradientId: "ring-month",
    },
  ];

  const getMotivation = (slide: SlideData) => {
    if (slide.completed === slide.total && slide.total > 0) return "All done! 🎉";
    return "Keep it moving!";
  };

  return (
    <div className="relative">
      {/* Background image area */}
      <div className="relative" style={{ aspectRatio: "1 / 0.35", borderRadius: 0, overflow: "hidden" }}>
        <img src={heroImageUrl && heroImageUrl.trim() !== '' ? heroImageUrl : instructorHeroImg} alt="Driving scene" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = instructorHeroImg; }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/30" />

        {/* Greeting text + avatar */}
        <div className="absolute inset-0 flex flex-col justify-end" style={{ paddingBottom: 56, paddingLeft: 20, paddingRight: 20 }}>
          <div className="flex items-end gap-3">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={firstName} className="w-11 h-11 rounded-full object-cover border-2 border-white/40 shadow-md" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                <span className="text-white font-semibold text-[16px]">{firstName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div>
              <p className="text-[14px] font-medium text-white/80 leading-tight drop-shadow-md">
                {new Date().getHours() >= 5 && new Date().getHours() < 12
                  ? "Good morning,"
                  : new Date().getHours() >= 12 && new Date().getHours() < 17
                  ? "Good afternoon,"
                  : new Date().getHours() >= 17 && new Date().getHours() < 21
                  ? "Good evening,"
                  : "Hello,"}
              </p>
              <h1 className="text-[32px] font-bold text-white leading-tight drop-shadow-md tracking-tight">{firstName}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel overlapping the hero */}
      <div className="-mt-10 relative z-10 px-5">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {slides.map((slide, i) => (
              <div key={slide.label} className="min-w-0 shrink-0 grow-0 basis-full">
                <div
                  className="backdrop-blur-xl flex items-center justify-between"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.97)",
                    borderRadius: 22,
                    padding: "14px 16px",
                    border: "1px solid #DAE4E1",
                    boxShadow: "0 2px 12px rgba(15, 70, 60, 0.06), 0 1px 4px rgba(15, 70, 60, 0.03)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#0F766E" }}>
                      {slide.label}
                    </p>
                    <p className="text-[17px] font-semibold mt-0.5 leading-snug" style={{ color: "#12263A" }}>
                      {getMotivation(slide)}
                    </p>
                    <p className="text-[13px] mt-0.5" style={{ color: "#6A7A78" }}>{slide.subtitle}</p>
                  </div>
                  <ProgressRing
                    completed={slide.completed}
                    total={slide.total}
                    scheduled={slide.total}
                    gradientId={slide.gradientId}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-colors duration-200"
              style={{
                width: i === selectedIndex ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === selectedIndex ? "#0F766E" : "#DAE4E1",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
