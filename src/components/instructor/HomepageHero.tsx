import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Calendar, MessageCircle, Briefcase, PoundSterling } from "lucide-react";
import carRoadIllustration from "@/assets/car-road-illustration.png";

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

interface RingDef {
  completed: number;
  total: number;
  gradId: string;
  start: string;
  end: string;
  trackColor: string;
}

function ConcentricRings({
  rings,
  centerCompleted,
  centerTotal,
  centerColor,
}: {
  rings: RingDef[]; // outer -> inner
  centerCompleted: number;
  centerTotal: number;
  centerColor: string;
}) {
  const size = 78;
  const stroke = 8;
  const gap = 2;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
        <defs>
          {rings.map((r) => (
            <linearGradient key={r.gradId} id={r.gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={r.start} />
              <stop offset="100%" stopColor={r.end} />
            </linearGradient>
          ))}
        </defs>
        {rings.map((r, i) => {
          const radius = (size - stroke) / 2 - i * (stroke + gap);
          if (radius <= 0) return null;
          const circumference = 2 * Math.PI * radius;
          const progress = r.total > 0 ? Math.min(r.completed / r.total, 1) : 0;
          const offset = circumference * (1 - progress);
          return (
            <g key={r.gradId}>
              <circle
                cx={cx} cy={cy} r={radius}
                fill="none" stroke={r.trackColor} strokeWidth={stroke}
              />
              <motion.circle
                cx={cx} cy={cy} r={radius}
                fill="none" stroke={`url(#${r.gradId})`} strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1], delay: 0.2 + i * 0.1 }}
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: 17, fontWeight: 700, color: centerColor, lineHeight: 1, fontFamily: "-apple-system, 'SF Pro Display', sans-serif" }}>
          {centerCompleted}
        </span>
        <span style={{ fontSize: 9, color: "#8E8E93", lineHeight: 1, marginTop: 2 }}>
          of {centerTotal || 0}
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
    { label: "TODAY", completed: todayCompleted, total: todayTotal, subtitle: `${todayTotal} lesson${todayTotal !== 1 ? "s" : ""} scheduled` },
    { label: "THIS WEEK", completed: weeklyLessonsCompleted, total: weeklyLessonsTotal, subtitle: `${weeklyLessonsScheduled} scheduled` },
    { label: "THIS MONTH", completed: monthlyCompleted, total: monthlyTotal, subtitle: `${monthlyTotal} lesson${monthlyTotal !== 1 ? "s" : ""} this month` },
  ];

  const dateStr = format(new Date(), "d MMMM yyyy");

  const navigate = useNavigate();

  const stats = [
    {
      icon: Calendar,
      value: String(weeklyLessonsTotal),
      label: "This week",
      iconBg: "rgba(255,149,0,0.14)",
      iconColor: "#FF9500",
      tileBg: "rgba(255,149,0,0.08)",
      highlight: false,
      route: "/instructor/schedule",
    },
    {
      icon: PoundSterling,
      value: `£${weeklyEarnings}`,
      label: "Earnings",
      iconBg: "rgba(52,199,89,0.14)",
      iconColor: "#34C759",
      tileBg: "rgba(52,199,89,0.08)",
      highlight: false,
      route: "/instructor/income",
    },
    {
      icon: MessageCircle,
      value: String(unreadMessages),
      label: "Messages",
      iconBg: "rgba(0,122,255,0.12)",
      iconColor: "#007AFF",
      tileBg: "rgba(0,122,255,0.07)",
      highlight: false,
      route: "/instructor/messages",
    },
    {
      icon: Briefcase,
      value: String(pendingJobs),
      label: "Job offers",
      iconBg: "#2A394F",
      iconColor: "#fff",
      tileBg: "#2A394F",
      highlight: pendingJobs > 0,
      route: "/instructor/jobs",
    },
  ];

  return (
    <div className="px-4 pt-3" style={{ fontFamily: "-apple-system, 'SF Pro Text', 'SF Pro Display', sans-serif" }}>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Blue Header Bar */}
        <div
          className="flex items-center justify-between"
          style={{
            backgroundColor: "#2A394F",
            borderRadius: "20px 20px 0 0",
            padding: "6px 16px",
          }}
        >
          <p style={{ fontSize: 22, fontWeight: 500, color: "#FFFFFF", lineHeight: 1.2, margin: 0 }}>
            {getGreeting()}, {firstName}
          </p>
          <div className="relative shrink-0">
            <div
              style={{
                width: 42, height: 42, borderRadius: "50%", overflow: "hidden",
                border: "2.5px solid rgba(255,255,255,0.5)",
              }}
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8622A, #FF8C42)" }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{firstName.charAt(0)}</span>
                </div>
              )}
            </div>
            {/* Green available dot */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 13,
                height: 13,
                borderRadius: "50%",
                backgroundColor: "#34C759",
                border: "2.5px solid rgba(255,255,255,0.5)",
              }}
            />
          </div>
        </div>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {slides.map((slide, i) => (
              <div key={slide.label} className="min-w-0 shrink-0 grow-0 basis-full">
                <div className="px-4 pt-2 pb-2">
                  {/* Date row */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#34C759",
                        letterSpacing: 0.8,
                        textTransform: "uppercase" as const,
                        backgroundColor: "rgba(52,199,89,0.12)",
                        padding: "4px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {slide.label}
                    </span>
                    <span style={{ fontSize: 13, color: "#8E8E93", fontWeight: 400 }}>{dateStr}</span>
                  </div>

                  {/* Ring + Lessons info + car illustration */}
                  <div className="flex items-center gap-3 relative">
                    {/* Car illustration behind text */}
                    <img
                      src={carRoadIllustration}
                      alt=""
                      className="absolute pointer-events-none select-none"
                      style={{
                        right: -5,
                        bottom: -10,
                        width: 140,
                        height: "auto",
                        opacity: 0.65,
                      }}
                    />
                    <ConcentricRings
                      rings={[
                        { completed: todayCompleted, total: todayTotal, gradId: "ringToday", start: "#FF2D55", end: "#FF6B9D", trackColor: "rgba(255,45,85,0.15)" },
                        { completed: weeklyLessonsCompleted, total: weeklyLessonsTotal, gradId: "ringWeek", start: "#A8E063", end: "#34C759", trackColor: "rgba(52,199,89,0.15)" },
                        { completed: monthlyCompleted, total: monthlyTotal, gradId: "ringMonth", start: "#30B0C7", end: "#5AC8FA", trackColor: "rgba(48,176,199,0.15)" },
                      ]}
                      centerCompleted={slide.completed}
                      centerTotal={slide.total}
                      centerColor={i === 0 ? "#FF2D55" : i === 1 ? "#34C759" : "#30B0C7"}
                    />
                    <div className="flex-1 min-w-0 relative z-10">
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1E", marginBottom: 1 }}>
                        {slide.completed === slide.total && slide.total > 0 ? "All done! 🎉" : slide.label === "TODAY" ? "Lessons Today" : slide.label === "THIS WEEK" ? "Lessons This Week" : "Lessons This Month"}
                      </p>
                      <p style={{ fontSize: 12, color: "#8E8E93" }}>{slide.subtitle}</p>
                      {/* Progress bar */}
                      <div style={{ height: 4, borderRadius: 2, backgroundColor: slide.total === 0 ? "rgba(0,122,255,0.15)" : "#E5E5EA", marginTop: 10, overflow: "hidden" }}>
                        <motion.div
                          style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #34C759, #30B0C7)" }}
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
                backgroundColor: i === selectedIndex ? "#3C3C43" : "#D1D1D6",
                transition: "background-color 0.2s",
              }}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 0.5, backgroundColor: "rgba(0,0,0,0.06)", marginLeft: 20, marginRight: 20 }} />

        {/* Bottom stats row */}
        <div className="grid grid-cols-4 gap-1.5 px-3 py-2.5">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(stat.route)}
              className="flex flex-col items-center rounded-2xl py-2 px-1 cursor-pointer"
              style={{
                backgroundColor: stat.highlight ? stat.tileBg : stat.tileBg,
                borderRadius: 16,
              }}
            >
                <div
                className="flex items-center justify-center mb-1"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  backgroundColor: stat.highlight ? "rgba(255,255,255,0.2)" : stat.iconBg,
                }}
              >
                <stat.icon size={13} color={stat.highlight ? "#fff" : stat.iconColor} strokeWidth={2.2} />
              </div>
              <span style={{
                fontSize: 15,
                fontWeight: 700,
                color: stat.highlight ? "#fff" : "#1C1C1E",
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
              }}>
                {stat.value}
              </span>
              <span style={{
                fontSize: 9.5,
                color: stat.highlight ? "rgba(255,255,255,0.8)" : "#8E8E93",
                marginTop: 2,
                fontWeight: 500,
              }}>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
