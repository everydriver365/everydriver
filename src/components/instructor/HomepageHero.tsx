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
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id={`${gradientId}-red`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="100%" stopColor="#EF4444" />
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
      {/* Background image area — bleeds under the header */}
      <div className="relative" style={{ aspectRatio: "1 / 0.43", borderRadius: 0, overflow: "hidden" }}>
        <img src={heroImageUrl && heroImageUrl.trim() !== '' ? heroImageUrl : instructorHeroImg} alt="Driving scene" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = instructorHeroImg; }} />
        {/* Subtle bottom gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />

        {/* Greeting text + avatar — bottom-left */}
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
              <p className="text-[16px] font-normal text-white/80 leading-tight drop-shadow-md">
                {new Date().getHours() >= 5 && new Date().getHours() < 12
                  ? "Good morning,"
                  : new Date().getHours() >= 12 && new Date().getHours() < 17
                  ? "Good afternoon,"
                  : new Date().getHours() >= 17 && new Date().getHours() < 21
                  ? "Good evening,"
                  : "Hello,"}
              </p>
              <h1 className="text-[34px] font-bold text-white leading-tight drop-shadow-md">{firstName}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel overlapping the hero — pulled up */}
      <div className="-mt-10 relative z-10 px-4">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {slides.map((slide, i) => (
              <div key={slide.label} className="min-w-0 shrink-0 grow-0 basis-full">
                <div
                  className="bg-white/95 dark:bg-card/90 backdrop-blur-xl rounded-2xl p-3.5 flex items-center justify-between"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.10)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {slide.label}
                    </p>
                    <p className="text-[17px] font-semibold text-foreground mt-0.5 leading-snug">
                      {getMotivation(slide)}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{slide.subtitle}</p>
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
        <div className="flex justify-center gap-1.5 mt-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                i === selectedIndex ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
