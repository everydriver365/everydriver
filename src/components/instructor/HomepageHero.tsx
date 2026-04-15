import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";

interface SlideData {
  label: string;
  completed: number;
  total: number;
  subtitle: string;
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

// Apple Health-style activity ring
function ActivityRing({ completed, total }: { completed: number; total: number }) {
  const size = 80;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(completed / total, 1) : 0;
  const offset = circumference * (1 - progress);

  // End-cap dot position
  const angle = progress * 2 * Math.PI - Math.PI / 2;
  const cx = size / 2 + radius * Math.cos(angle);
  const cy = size / 2 + radius * Math.sin(angle);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#D4F5DF" strokeWidth={stroke}
        />
        {/* Progress gradient */}
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5EE87A" />
            <stop offset="100%" stopColor="#25A244" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#ring-grad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
        />
        {/* End cap dot */}
        {progress > 0.02 && (
          <motion.circle
            cx={cx} cy={cy} r={stroke / 2}
            fill="#25A244"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          />
        )}
      </svg>
      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: "none" }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#000", lineHeight: 1, fontFamily: "-apple-system, 'SF Pro Text', sans-serif" }}>
          {completed}
        </span>
        <span style={{ fontSize: 10, color: "#8E8E93", lineHeight: 1, marginTop: 2 }}>
          of {total || 0}
        </span>
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
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Hello";
  };

  const slides: SlideData[] = [
    { label: "TODAY", completed: todayCompleted, total: todayTotal, subtitle: `${todayTotal} lesson${todayTotal !== 1 ? "s" : ""} today` },
    { label: "THIS WEEK", completed: weeklyLessonsCompleted, total: weeklyLessonsTotal, subtitle: `${weeklyLessonsScheduled} scheduled` },
    { label: "THIS MONTH", completed: monthlyCompleted, total: monthlyTotal, subtitle: `${monthlyTotal} lesson${monthlyTotal !== 1 ? "s" : ""} this month` },
  ];

  const dateStr = format(new Date(), "EEEE, d MMMM");

  return (
    <div className="px-4 pt-3">
      {/* Hero card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 28,
          border: "0.5px solid #E5E5EA",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
          fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
        }}
      >
        {/* Greeting row */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p style={{ fontSize: 14, color: "#8E8E93", fontWeight: 400 }}>{getGreeting()}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: "#000", lineHeight: 1.15, marginTop: 2 }}>{firstName}</p>
          </div>
          <div className="shrink-0" style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", backgroundColor: "#F2F2F7" }}>
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8622A, #FF8C42)" }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{firstName.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 0.5, backgroundColor: "#E5E5EA", marginLeft: 20, marginRight: 20 }} />

        {/* Today section carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {slides.map((slide, i) => (
              <div key={slide.label} className="min-w-0 shrink-0 grow-0 basis-full">
                <div className="px-5 pt-4 pb-3">
                  {/* Label row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#30D158", display: "inline-block" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#30D158", letterSpacing: 0.8, textTransform: "uppercase" as const }}>
                        {slide.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: "#8E8E93" }}>{dateStr}</span>
                  </div>

                  {/* Ring + info */}
                  <div className="flex items-center gap-4">
                    <ActivityRing completed={slide.completed} total={slide.total} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 17, fontWeight: 600, color: "#000" }}>
                        {slide.completed === slide.total && slide.total > 0 ? "All done! 🎉" : "Keep it moving!"}
                      </p>
                      <p style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}>{slide.subtitle}</p>
                      {/* Thin progress bar */}
                      <div style={{ height: 4, borderRadius: 2, backgroundColor: "#D4F5DF", marginTop: 8, overflow: "hidden" }}>
                        <motion.div
                          style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #5EE87A, #25A244)" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${slide.total > 0 ? Math.min((slide.completed / slide.total) * 100, 100) : 0}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 pb-3">
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: "50%",
                backgroundColor: i === selectedIndex ? "#3C3C43" : "#C7C7CC",
                transition: "background-color 0.2s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
