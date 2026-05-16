import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Check,
  ChevronRight,
  ArrowLeftRight,
  CreditCard,
  User,
} from "lucide-react";
import heroLearnerImg from "@/assets/drive365-hero-learner.jpeg";
import heroPlaceholderImg from "@/assets/hero-placeholder-v2.png";
import intensiveCourseImg from "@/assets/drive365-intensive.jpeg";
import weeklyCourseImg from "@/assets/course-weekly-lessons.jpg";
import semiCourseImg from "@/assets/semi-intensive-card.jpg";
import { PostcodeSearch } from "@/components/home/PostcodeSearch";

const NAV_LINKS = [
  { label: "Find an instructor", href: "/instructors" },
  { label: "Courses", href: "/courses" },
  { label: "Test swap", href: "/test-swap" },
  { label: "Theory test", href: "/theory" },
  { label: "About", href: "/about" },
];

const PROOF_STATS = [
  { num: "12,400+", label: "Lessons booked" },
  { num: "4.9", label: "3,200 reviews", isStars: true },
  { num: "94%", label: "First-time pass rate" },
  { num: "2,400+", label: "Approved instructors" },
  { num: "DVSA", label: "Approved service" },
];

const COURSES = [
  {
    id: "intensive",
    badge: "Fast Track",
    badgeColor: "#2D3FE7",
    title: "Intensive Courses",
    description:
      "Full immersion experience. Learn everything in concentrated sessions and pass your test in record time.",
    features: ["30–40 hours of lessons", "Pass in 1–2 weeks", "Test booking included"],
    priceFrom: "£1,299",
    priceUnit: null as string | null,
    ctaLabel: "View courses",
    ctaHref: "/courses?type=intensive",
    ctaBg: "#2D3FE7",
    featured: false,
    sceneBg: "#3E57D9",
  },
  {
    id: "semi",
    badge: "Most popular",
    badgeColor: "#3E57D9",
    title: "Semi-Intensive",
    description:
      "The perfect balance of speed and flexibility. Ideal if you have some availability but need time to practise between sessions.",
    features: ["30 hours of lessons", "Pass in 2–4 weeks", "Flexible scheduling"],
    priceFrom: "£999",
    priceUnit: null as string | null,
    ctaLabel: "View courses",
    ctaHref: "/courses?type=semi-intensive",
    ctaBg: "#3E57D9",
    featured: true,
    sceneBg: "#3B6D11",
  },
  {
    id: "weekly",
    badge: "Flexible",
    badgeColor: "#2D3FE7",
    title: "Weekly Lessons",
    description:
      "Traditional approach for busy schedules. Build confidence gradually with regular weekly sessions at times that suit you.",
    features: ["1–2 hours per week", "Pay as you go", "Same instructor every week"],
    priceFrom: "£35",
    priceUnit: "/hour",
    ctaLabel: "View lessons",
    ctaHref: "/courses?type=weekly",
    ctaBg: "#2D3FE7",
    featured: false,
    sceneBg: "#1D9E75",
  },
];

const WHY_ITEMS = [
  {
    icon: ShieldCheck,
    iconBg: "#E6F1FB",
    iconColor: "#3E57D9",
    title: "Money back guarantee",
    body: "Pass first time or get your money back. Free retest included if you don't pass.",
  },
  {
    icon: ArrowLeftRight,
    iconBg: "#E1F5EE",
    iconColor: "#1D9E75",
    title: "Test swap network",
    body: "Can't wait months for a test? Swap your date with another learner — completely free.",
  },
  {
    icon: CreditCard,
    iconBg: "#FFF6E6",
    iconColor: "#B45309",
    title: "Spread the cost",
    body: "Pay monthly with Klarna or Clearpay. No interest, no hidden fees, no nasty surprises.",
  },
  {
    icon: User,
    iconBg: "#F0EEFF",
    iconColor: "#6B21A8",
    title: "DVSA-approved instructors",
    body: "Every instructor on Drive365 is fully qualified and DVSA approved — no exceptions.",
  },
];

const REVIEWS = [
  {
    text:
      '"Passed first time with Drive365. Ken was an incredible instructor — patient, thorough and always on time. The test swap feature saved me weeks of waiting too."',
    initials: "BF",
    color: "#3E57D9",
    name: "Berty F.",
    sub: "Eastleigh · Passed first time",
  },
  {
    text:
      '"The semi-intensive course was perfect for me. I could fit it around work and still had time to practise between sessions. Worth every penny."',
    initials: "SL",
    color: "#3B6D11",
    name: "Sam L.",
    sub: "Southampton · Semi-intensive",
  },
  {
    text:
      '"Used the test swap and got a date 6 weeks earlier than my original booking. The checklist made the DVSA call so easy. Amazing service."',
    initials: "JW",
    color: "#993556",
    name: "Jordan W.",
    sub: "Winchester · Test swap user",
  },
];

const HeroCarIllustration = () => (
  <svg
    viewBox="0 0 520 320"
    width="100%"
    style={{ maxWidth: 520, height: "auto", display: "block" }}
    aria-hidden
  >
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#16306B" />
        <stop offset="100%" stopColor="#191C2F" />
      </linearGradient>
      <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1A2540" />
        <stop offset="100%" stopColor="#0A1428" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="520" height="240" fill="url(#sky)" rx="12" />
    {/* Buildings */}
    <rect x="20" y="120" width="60" height="120" fill="#0A1733" />
    <rect x="90" y="90" width="50" height="150" fill="#0E1F44" />
    <rect x="150" y="140" width="40" height="100" fill="#0A1733" />
    <rect x="340" y="100" width="55" height="140" fill="#0E1F44" />
    <rect x="405" y="130" width="45" height="110" fill="#0A1733" />
    <rect x="460" y="110" width="50" height="130" fill="#0E1F44" />
    {/* Windows */}
    {Array.from({ length: 6 }).map((_, r) =>
      Array.from({ length: 3 }).map((__, c) => (
        <rect
          key={`w-${r}-${c}`}
          x={28 + c * 16}
          y={132 + r * 16}
          width="6"
          height="6"
          fill="#FBBF24"
          opacity={(r + c) % 2 === 0 ? 0.7 : 0.25}
        />
      ))
    )}
    {/* Moon */}
    <circle cx="430" cy="55" r="22" fill="#F5F5F0" opacity="0.9" />
    <circle cx="422" cy="50" r="22" fill="url(#sky)" />
    {/* Road */}
    <rect x="0" y="240" width="520" height="80" fill="url(#road)" />
    {/* Road markings */}
    {Array.from({ length: 7 }).map((_, i) => (
      <rect key={i} x={20 + i * 75} y={278} width="40" height="4" fill="#3E57D9" opacity="0.7" />
    ))}
    {/* Car shadow */}
    <ellipse cx="260" cy="270" rx="120" ry="8" fill="#000" opacity="0.4" />
    {/* Car body */}
    <path
      d="M160 250 Q170 215 210 210 L300 210 Q335 213 348 240 L370 240 Q378 240 378 252 L378 262 Q378 268 372 268 L350 268 Q346 282 332 282 Q318 282 314 268 L210 268 Q206 282 192 282 Q178 282 174 268 L156 268 Q150 268 150 262 L150 254 Q150 250 160 250 Z"
      fill="#E63946"
    />
    {/* Roof highlight */}
    <path d="M180 218 Q200 212 230 212 L290 212 Q318 215 330 230 L210 230 Z" fill="#F77784" opacity="0.7" />
    {/* Windows */}
    <path d="M195 232 L218 218 L268 218 L286 232 Z" fill="#191C2F" />
    <path d="M290 232 L286 218 L318 220 L328 232 Z" fill="#191C2F" />
    {/* L-plate */}
    <rect x="202" y="248" width="14" height="14" fill="#FFF" rx="1" />
    <text x="209" y="259" fontSize="11" fontWeight="700" fill="#E63946" textAnchor="middle">L</text>
    {/* Wheels */}
    <circle cx="192" cy="270" r="14" fill="#0A0A0A" />
    <circle cx="192" cy="270" r="6" fill="#3D4A5C" />
    <circle cx="332" cy="270" r="14" fill="#0A0A0A" />
    <circle cx="332" cy="270" r="6" fill="#3D4A5C" />
    {/* Headlight glow */}
    <circle cx="368" cy="252" r="4" fill="#FFE9A8" />
    <ellipse cx="395" cy="258" rx="22" ry="5" fill="#FFE9A8" opacity="0.25" />
  </svg>
);

const CourseCardImage: React.FC<{ courseId: string; badge: string; badgeColor: string; bg: string }> = ({
  courseId,
  badge,
  badgeColor,
  bg,
}) => (
  <div
    style={{
      height: 180,
      background: `linear-gradient(180deg, ${bg} 0%, #191C2F 100%)`,
      position: "relative",
      overflow: "hidden",
    }}
  >
    {courseId === "intensive" ? (
      <img
        src={intensiveCourseImg}
        alt="Learner celebrating after passing driving test"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    ) : courseId === "weekly" ? (
      <img
        src={weeklyCourseImg}
        alt="Learner driver holding L-plates from car window"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    ) : courseId === "semi" ? (
      <img
        src={semiCourseImg}
        alt="Two happy learners in a car"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    ) : (
      <svg viewBox="0 0 360 180" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {courseId === "weekly" ? (
          <>
            <circle cx="300" cy="40" r="22" fill="#FBBF24" opacity="0.85" />
            <path d="M0 130 Q90 100 180 120 T360 110 L360 180 L0 180 Z" fill="#1D9E75" opacity="0.55" />
            <path d="M0 150 Q120 130 240 145 T360 140 L360 180 L0 180 Z" fill="#191C2F" opacity="0.6" />
          </>
        ) : (
          <>
            <circle cx="290" cy="45" r="20" fill="#FDE68A" opacity="0.9" />
            <path d="M0 120 L60 80 L130 115 L210 70 L290 110 L360 90 L360 180 L0 180 Z" fill="#3B6D11" opacity="0.6" />
            <path d="M0 145 L80 125 L170 140 L260 120 L360 135 L360 180 L0 180 Z" fill="#191C2F" opacity="0.6" />
          </>
        )}
        {/* car */}
        <g transform="translate(110,110)">
          <path
            d="M0 30 Q5 10 25 8 L80 8 Q100 10 108 25 L120 25 Q125 25 125 31 L125 36 Q125 40 121 40 L110 40 Q108 48 100 48 Q92 48 90 40 L40 40 Q38 48 30 48 Q22 48 20 40 L8 40 Q4 40 4 36 L4 32 Q4 30 0 30 Z"
            fill="#E63946"
          />
          <path d="M22 18 L40 10 L72 10 L88 18 Z" fill="#191C2F" />
          <rect x="28" y="28" width="9" height="9" fill="#FFF" rx="1" />
          <text x="32.5" y="35" fontSize="7" fontWeight="700" fill="#E63946" textAnchor="middle">L</text>
          <circle cx="22" cy="42" r="7" fill="#0A0A0A" />
          <circle cx="98" cy="42" r="7" fill="#0A0A0A" />
        </g>
      </svg>
    )}
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        background: badgeColor,
        color: "#FFF",
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 2,
        letterSpacing: 0.2,
      }}
    >
      {badge}
    </div>
  </div>
);

export default function Drive365Home({ afterLearningPaths }: { afterLearningPaths?: React.ReactNode } = {}) {
  const navigate = useNavigate();
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState("10 miles");
  const [transmission, setTransmission] = useState("Any");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (postcode) params.set("postcode", postcode);
    params.set("radius", radius);
    params.set("transmission", transmission);
    navigate(`/courses?${params.toString()}`);
  };

  return (
    <div style={{ width: "100%", overflow: "hidden", background: "#F6F6F8" }}>
      {/* Desktop-only styles for the new Drive 365 home hero & Why section. */}
      <style>{`
        @media (min-width: 768px) {
          .d365-hero-wrap { background: #FFFFFF; padding: 56px 24px; display: flex; justify-content: center; }
          .d365-hero { width: 100%; max-width: 1200px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: stretch; }
          .d365-hero-photo { position: relative; background: #9FD3E8; border-radius: 4px; overflow: hidden; min-height: 540px; }
          .d365-hero-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .d365-hero-right { display: flex; flex-direction: column; gap: 16px; }
          .d365-hero-right { display: flex; flex-direction: column; gap: 16px; }
          .d365-welcome { background: #EAF0FF; padding: 24px; border-radius: 4px; }
          .d365-welcome h1 { font-size: 44px; line-height: 1.05; font-weight: 800; color: #0A0A0A; text-transform: uppercase; letter-spacing: -0.5px; margin: 0 0 14px; font-family: Inter, "Helvetica Neue", system-ui, sans-serif; }
          .d365-welcome p { font-size: 15px; line-height: 1.55; color: #4B5563; margin: 0; }
          .d365-welcome p b { color: #0A0A0A; font-weight: 700; }
          .d365-cta { width: 100%; background: #2D3FE7; color: #FFFFFF; border: none; border-radius: 2px; padding: 16px 20px; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 10px; transition: background 120ms ease; font-family: inherit; }
          .d365-cta:hover { background: #1F2DC9; }
          .d365-cta-icon { width: 22px; height: 22px; border-radius: 999px; background: rgba(255,255,255,0.2); display: inline-flex; align-items: center; justify-content: center; }
          .d365-feat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .d365-feat { background: #EAF0FF; padding: 20px; border-radius: 4px; display: flex; flex-direction: column; gap: 12px; }
          .d365-feat-full { grid-column: 1 / -1; }
          .d365-feat-row-layout { flex-direction: row; align-items: stretch; gap: 16px; }
          .d365-feat-row-layout .d365-feat-thumb { width: 140px; aspect-ratio: 1 / 1; flex: 0 0 140px; object-fit: cover; border-radius: 4px; display: block; background: #9FD3E8; }
          .d365-feat-body { display: flex; flex-direction: column; gap: 8px; flex: 1; }
          .d365-feat img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 4px; display: block; background: #9FD3E8; }
          .d365-feat h3 { font-size: 16px; font-weight: 800; color: #0A0A0A; text-transform: uppercase; letter-spacing: 0.02em; margin: 0; font-family: Inter, "Helvetica Neue", system-ui, sans-serif; }
          .d365-feat p { font-size: 14px; line-height: 1.5; color: #4B5563; margin: 0; }
          .d365-feat-btn { width: 100%; background: #2D3FE7; color: #FFFFFF; border: none; border-radius: 2px; padding: 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; font-family: inherit; transition: background 120ms ease; }
          .d365-feat-btn:hover { background: #1F2DC9; }
          .d365-spacer { background: #EAF0FF; height: 40px; border-radius: 4px; width: 100%; }
          .d365-why-wrap { background: #FFFFFF; padding: 80px 24px 56px; display: flex; justify-content: center; }
          .d365-why { width: 100%; max-width: 1200px; display: grid; grid-template-columns: 30% 70%; align-items: start; }
          .d365-why-left { padding-right: 32px; border-right: 1px solid #2D3FE7; }
          .d365-why-eyebrow { font-size: 12px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 12px; font-family: Inter, "Helvetica Neue", system-ui, sans-serif; }
          .d365-why-heading { font-size: 32px; font-weight: 800; color: #0A0A0A; text-transform: uppercase; letter-spacing: -0.5px; margin: 0; line-height: 1.1; font-family: Inter, "Helvetica Neue", system-ui, sans-serif; }
          .d365-why-right { padding-left: 32px; }
          .d365-why-right p { font-size: 16px; line-height: 1.6; color: #4B5563; margin: 0; }
          .d365-why-right p b { color: #0A0A0A; font-weight: 700; }
        }
        @media (max-width: 767px) { .d365-hero-wrap, .d365-why-wrap { display: none; } }
      `}</style>

      {/* New Drive 365 hero (desktop only) */}
      <section className="d365-hero-wrap" aria-label="Drive 365 welcome">
        <div className="d365-hero">
          <div className="d365-hero-photo">
            <img
              src={heroPlaceholderImg}
              alt="Smiling young learner driver holding a steering wheel, ready to start lessons with Drive 365"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="d365-hero-right">
            <div className="d365-welcome text-center">
              <h1>Welcome to Drive 365</h1>
              <p className="mx-0 py-0">
                Search, compare and book direct with independent, instructors  in the UK.
                <br />
                Book through Drive 365 for a range of exclusive benefits when you book.
              </p>
              <PostcodeSearch />
            </div>
            <div className="d365-feat-row">
              <div className="d365-feat">
                <img
                  src={intensiveCourseImg}
                  alt="Focused learner driver concentrating on the road during an intensive driving course in the UK"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                />
                <h3>Intensive Courses</h3>
                <p>Briefly and concisely explain what you do for your audience.</p>
                <Link to="/courses?type=intensive" style={{ marginTop: "auto" }}>
                  <button type="button" className="d365-feat-btn">Read more</button>
                </Link>
              </div>
              <div className="d365-feat">
                <img
                  src={semiCourseImg}
                  alt="Happy learner driver with an L-plate enjoying a flexible semi-intensive driving lesson"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                />
                <h3>Semi Intensive Courses</h3>
                <p>Briefly and concisely explain what you do for your audience.</p>
                <Link to="/courses?type=semi-intensive" style={{ marginTop: "auto" }}>
                  <button type="button" className="d365-feat-btn">Read more</button>
                </Link>
              </div>
              <div className="d365-feat d365-feat-full d365-feat-row-layout">
                <img
                  className="d365-feat-thumb"
                  src={weeklyCourseImg}
                  alt="Learner driver having a regular weekly driving lesson with a friendly instructor"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                />
                <div className="d365-feat-body">
                  <h3>Weekly Lessons</h3>
                  <p>Briefly and concisely explain what you do for your audience.</p>
                  <Link to="/courses?type=weekly" style={{ marginTop: "auto" }}>
                    <button type="button" className="d365-feat-btn">Read more</button>
                  </Link>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Why Drive 365? */}
      <section className="d365-why-wrap" aria-label="Why Drive 365">
        <div className="d365-why">
          <div className="d365-why-left">
            <div className="d365-why-eyebrow">Drive 365</div>
            <h2 className="d365-why-heading">Why Drive 365?</h2>
          </div>
          <div className="d365-why-right">
            <p>
              <b>Why book through Drive 365?</b> There are so many benefits when booking through Drive 365 that are not available when booking direct with an instructor.
            </p>
          </div>
        </div>
      </section>

      {/* HomeSocialProof */}
      <div
        style={{
          background: "#FFF",
          borderTop: "0.5px solid #E9E5E8",
          borderBottom: "0.5px solid #E9E5E8",
          padding: "18px 5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          
        }}
      >
        {PROOF_STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "0 20px",
              borderRight: i < PROOF_STATS.length - 1 ? "0.5px solid #E9E5E8" : "none",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: "#191C2F", letterSpacing: -0.5, lineHeight: 1 }}>
              {stat.isStars ? "★★★★★" : stat.num}
            </div>
            <div style={{ fontSize: 11, color: "#51567A", marginTop: 3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* HomeCourses */}
      <section style={{ padding: "56px 5%", background: "#F6F6F8", width: "100%" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#3E57D9", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
          Learning paths
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: "#191C2F", letterSpacing: -0.5, marginBottom: 10 }}>
          Choose your learning path
        </h2>
        <p style={{ fontSize: 15, color: "#51567A", lineHeight: 1.6, maxWidth: 520, marginBottom: 36 }}>
          Whether you want to pass quickly or learn at your own pace, we have the perfect course for you.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 20 }}>
          {COURSES.map((course) => (
            <div
              key={course.id}
              style={{
                background: "#FFF",
                borderRadius: 18,
                overflow: "hidden",
                border: course.featured ? "2px solid #2D3FE7" : "1px solid #E9E5E8",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CourseCardImage courseId={course.id} badge={course.badge} badgeColor={course.badgeColor} bg={course.sceneBg} />
              <div style={{ padding: 22, flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#191C2F", marginBottom: 6 }}>{course.title}</h3>
                <p style={{ fontSize: 13, color: "#51567A", lineHeight: 1.6, marginBottom: 14 }}>{course.description}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 18 }}>
                  {course.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#51567A" }}>
                      <Check size={11} color="#2D3FE7" strokeWidth={1.8} />
                      {f}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "auto" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 1 }}>From</div>
                  <div>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#0A0A0A", letterSpacing: -0.5 }}>{course.priceFrom}</span>
                    {course.priceUnit && <span style={{ fontSize: 12, color: "#51567A" }}>{course.priceUnit}</span>}
                  </div>
                </div>
                <Link to={course.ctaHref}>
                  <button
                    style={{
                      width: "100%",
                      border: "none",
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      background: course.ctaBg,
                      color: "#FFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      marginTop: 16,
                    }}
                  >
                    {course.ctaLabel} <ChevronRight size={12} color="#FFF" strokeWidth={2.2} />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      {afterLearningPaths}

      {/* HomeSwapBand */}
      <section
        style={{
          background: "#2D3FE7",
          padding: "64px 80px",
          display: "flex",
          alignItems: "center",
          gap: 48,
          position: "relative",
          overflow: "hidden",
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "rgba(255,255,255,0.08)", right: -80, top: -120, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.06)", right: 80, bottom: -100, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.10)", right: 220, top: 40, pointerEvents: "none" }} />

        <div style={{ flex: "1 1 60%", position: "relative", zIndex: 1, maxWidth: 720 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5DCAA5", letterSpacing: "0.125em", textTransform: "uppercase", marginBottom: 12 }}>
            New → Free feature
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "#FFFFFF", letterSpacing: -0.5, lineHeight: 1.1, margin: 0, whiteSpace: "pre-line" }}>
            {"Can't wait months\nfor your test?"}
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, maxWidth: 480, marginTop: 16, fontWeight: 400 }}>
            Swap your driving test date with another learner — completely free. Drive365 matches you, DVSA completes the swap. Your booking reference never changes.
          </p>
          <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
            <Link to="/test-swap">
              <button
                style={{ background: "#FFFFFF", border: "none", borderRadius: 2, padding: "12px 24px", fontSize: 14, fontWeight: 500, color: "#2D3FE7", cursor: "pointer", whiteSpace: "nowrap", transition: "background 120ms ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
              >
                Find a swap match →
              </button>
            </Link>
            <Link to="/test-swap#how-it-works">
              <button
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 2, padding: "12px 24px", fontSize: 14, fontWeight: 500, color: "#FFFFFF", cursor: "pointer", whiteSpace: "nowrap", transition: "all 120ms ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FFFFFF"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; e.currentTarget.style.background = "transparent"; }}
              >
                How it works
              </button>
            </Link>
          </div>
        </div>

        <div style={{ flex: "1 1 40%", position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
          <svg viewBox="0 0 360 220" width="100%" style={{ maxWidth: 380, height: "auto" }} aria-hidden>
            <g transform="translate(20,30)">
              <rect x="0" y="10" width="120" height="140" rx="8" fill="none" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="0" y="10" width="120" height="28" rx="8" fill="#FFFFFF" opacity="0.15" />
              <line x1="0" y1="38" x2="120" y2="38" stroke="#FFFFFF" strokeWidth="2" />
              <line x1="25" y1="0" x2="25" y2="22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              <line x1="95" y1="0" x2="95" y2="22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              {Array.from({ length: 3 }).map((_, r) =>
                Array.from({ length: 5 }).map((__, c) => (
                  <circle key={`a-${r}-${c}`} cx={18 + c * 22} cy={58 + r * 26} r="3" fill="#FFFFFF" opacity="0.4" />
                ))
              )}
              <circle cx="62" cy="84" r="10" fill="#5DCAA5" />
              <text x="62" y="88" fontSize="11" fontWeight="700" fill="#FFFFFF" textAnchor="middle">12</text>
            </g>
            <g transform="translate(160,95)" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0 8 L34 8 L28 2 M34 8 L28 14" />
              <path d="M40 28 L6 28 L12 22 M6 28 L12 34" />
            </g>
            <g transform="translate(220,30)">
              <rect x="0" y="10" width="120" height="140" rx="8" fill="none" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="0" y="10" width="120" height="28" rx="8" fill="#FFFFFF" opacity="0.15" />
              <line x1="0" y1="38" x2="120" y2="38" stroke="#FFFFFF" strokeWidth="2" />
              <line x1="25" y1="0" x2="25" y2="22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              <line x1="95" y1="0" x2="95" y2="22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              {Array.from({ length: 3 }).map((_, r) =>
                Array.from({ length: 5 }).map((__, c) => (
                  <circle key={`b-${r}-${c}`} cx={18 + c * 22} cy={58 + r * 26} r="3" fill="#FFFFFF" opacity="0.4" />
                ))
              )}
              <circle cx="84" cy="110" r="10" fill="#5DCAA5" />
              <text x="84" y="114" fontSize="11" fontWeight="700" fill="#FFFFFF" textAnchor="middle">3</text>
            </g>
          </svg>
        </div>
      </section>

    </div>
  );
}
