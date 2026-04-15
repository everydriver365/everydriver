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
  weeklyEarnings?: number;
  unreadMessages?: number;
  pendingJobs?: number;
}

// Apple Health-style activity ring with iOS system colours
function ActivityRing({ completed, total }: { completed: number; total: number }) {
  const size = 80;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(completed / total, 1) : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#E5E5EA" strokeWidth={stroke}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#34C759" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
        />
      </svg>
      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: 20, fontWeight: 700, color: "#1C1C1E", lineHeight: 1, fontFamily: "-apple-system, 'SF Pro Text', sans-serif" }}>
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
  weeklyEarnings = 0,
  unreadMessages = 0,
  pendingJobs = 0,
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
      {/* Hero card — iOS glass */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(249,249,251,0.9) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 24,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 10px 30px rgba(0,0,0,0.06)",
          overflow: "hidden",
          fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
        }}
      >
        {/* Greeting row */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p style={{ fontSize: 14, color: "#8E8E93", fontWeight: 400 }}>{getGreeting()}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: "#1C1C1E", lineHeight: 1.15, marginTop: 2 }}>{firstName}</p>
          </div>
          <div
            className="shrink-0"
            style={{
              width: 46, height: 46, borderRadius: "50%", overflow: "hidden",
              backgroundColor: "#F2F2F7",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8622A, #FF8C42)" }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{firstName.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subtle divider */}
        <div style={{ height: 0.5, backgroundColor: "rgba(0,0,0,0.06)", marginLeft: 20, marginRight: 20 }} />

        {/* Today section carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {slides.map((slide, i) => (
              <div key={slide.label} className="min-w-0 shrink-0 grow-0 basis-full">
                <div className="px-5 pt-4 pb-3">
                  {/* Label row */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#34C759",
                        letterSpacing: 0.6,
                        textTransform: "uppercase" as const,
                        backgroundColor: "rgba(52,199,89,0.15)",
                        padding: "3px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {slide.label}
                    </span>
                    <span style={{ fontSize: 13, color: "#8E8E93" }}>{dateStr}</span>
                  </div>

                  {/* Ring + info */}
                  <div className="flex items-center gap-4">
                    <ActivityRing completed={slide.completed} total={slide.total} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 17, fontWeight: 600, color: "#1C1C1E" }}>
                        {slide.completed === slide.total && slide.total > 0 ? "All done! 🎉" : "Lessons today"}
                      </p>
                      <p style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}>{slide.subtitle}</p>
                      {/* Thin progress bar */}
                      <div style={{ height: 4, borderRadius: 2, backgroundColor: "#E5E5EA", marginTop: 8, overflow: "hidden" }}>
                        <motion.div
                          style={{ height: "100%", borderRadius: 2, backgroundColor: "#34C759" }}
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

        {/* Bottom stat strip */}
        <div style={{ backgroundColor: "rgba(249,249,251,0.6)" }}>
          <div className="grid grid-cols-4 py-1">
            {[
              { label: "This week", value: String(weeklyLessonsTotal), color: "#1C1C1E" },
              { label: "Earnings", value: `£${weeklyEarnings}`, color: "#34C759" },
              { label: "Messages", value: String(unreadMessages), color: "#FF9500" },
              { label: "Job offer", value: String(pendingJobs), color: "#007AFF" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center py-2"
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: stat.color, fontVariantNumeric: "tabular-nums" }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: 10, color: "#8E8E93", marginTop: 1 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
