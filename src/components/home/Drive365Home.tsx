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
import semiCourseImg from "@/assets/semi-intensive-card.png";
import logoKlarna from "@/assets/logo-klarna.png";
import logoClearpay from "@/assets/logo-clearpay.webp";

import bookNowPayLaterBadge from "@/assets/book-now-pay-later-badge.png";
import { PostcodeSearch } from "@/components/home/PostcodeSearch";
import SeeWhoIsTeaching from "@/components/home/SeeWhoIsTeaching";
import PupilReviewsSection from "@/components/home/PupilReviewsSection";

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
    badgeColor: "#D12E2E",
    title: "Intensive Courses",
    description:
      "Full immersion experience. Learn everything in concentrated sessions and pass your test in record time.",
    features: ["10–40 hours of lessons", "Pass in 1–2 weeks", "Test booking included"],
    priceFrom: "£1,299",
    priceUnit: null as string | null,
    ctaLabel: "View courses",
    ctaHref: "/courses?type=intensive",
    ctaBg: "#0A1628",
    ctaHoverBg: "#1A2332",
    featured: false,
    sceneBg: "#3E57D9",
  },
  {
    id: "semi",
    badge: "Most popular",
    badgeColor: "#0A1628",
    title: "Semi-Intensive",
    description:
      "The perfect balance of speed and flexibility. Ideal if you have some availability but need time to practise between sessions.",
    features: ["FREE Re-Test if you fail", "Pass in 2–4 weeks", "Flexible scheduling"],
    priceFrom: "£999",
    priceUnit: null as string | null,
    ctaLabel: "View courses",
    ctaHref: "/courses?type=semi-intensive",
    ctaBg: "#E8641A",
    ctaHoverBg: "#C8520E",
    featured: true,
    sceneBg: "#3B6D11",
  },
  {
    id: "weekly",
    badge: "Flexible",
    badgeColor: "#059669",
    title: "Weekly Lessons",
    description:
      "Traditional approach for busy schedules. Build confidence gradually with regular weekly sessions at times that suit you.",
    features: ["Drive when it suits you.", "Pay as you go", "Same instructor every week"],
    priceFrom: "£30",
    priceUnit: "/hour",
    ctaLabel: "View lessons",
    ctaHref: "/courses?type=weekly",
    ctaBg: "#0A1628",
    ctaHoverBg: "#1A2332",
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
    body: "Every instructor on EveryDriver is fully qualified and DVSA approved — no exceptions.",
  },
];

const REVIEWS = [
  {
    text:
      '"Passed first time with EveryDriver. Ken was an incredible instructor — patient, thorough and always on time. The test swap feature saved me weeks of waiting too."',
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
        fontSize: 10,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 4,
        letterSpacing: 0.2,
      }}
    >
      {badge}
    </div>
  </div>
);

export default function Drive365Home({ afterLearningPaths, afterHero }: { afterLearningPaths?: React.ReactNode; afterHero?: React.ReactNode } = {}) {
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
          .d365-hero-photo { position: relative; background: #9FD3E8; border-radius: 15px; overflow: hidden; min-height: 540px; }
          .d365-hero-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .d365-hero-right { display: flex; flex-direction: column; gap: 16px; }
          .d365-hero-right { display: flex; flex-direction: column; gap: 16px; }
          .d365-welcome { background: #EAF0FF; padding: 24px; border-radius: 15px; }
          .d365-welcome-eyebrow { font-size: 10px; font-weight: 700; color: #E8641A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; font-family: Inter, "Helvetica Neue", system-ui, sans-serif; }
          .d365-welcome h1 { font-size: 40px; line-height: 1.1; font-weight: 800; color: #0A1628; letter-spacing: -1.5px; margin: 0 0 14px; font-family: Inter, "Helvetica Neue", system-ui, sans-serif; }
          .d365-welcome p { font-size: 15px; line-height: 1.55; color: #4B5563; margin: 0; }
          .d365-welcome p b { color: #0A0A0A; font-weight: 700; }
          .d365-cta { width: 100%; background: #0F2044; color: #FFFFFF; border: none; border-radius: 10px; padding: 16px 20px; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 10px; transition: background 120ms ease; font-family: inherit; }
          .d365-cta:hover { background: #1A3370; }
          .d365-cta-icon { width: 22px; height: 22px; border-radius: 999px; background: rgba(255,255,255,0.2); display: inline-flex; align-items: center; justify-content: center; }
          .d365-feat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: stretch; }
          .d365-feat { background: #EAF0FF; padding: 20px; border-radius: 15px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; height: 100%; }
          .d365-feat > h3 { margin-top: 0; }
          .d365-feat > p { flex: 1; }
          .d365-feat-full { grid-column: 1 / -1; }
          .d365-feat-row-layout { flex-direction: row; align-items: stretch; gap: 16px; justify-content: flex-start; }
          .d365-feat-row-layout .d365-feat-thumb { width: 140px; aspect-ratio: 1 / 1; flex: 0 0 140px; object-fit: cover; border-radius: 10px; display: block; background: #9FD3E8; }
          .d365-feat-body { display: flex; flex-direction: column; justify-content: space-between; gap: 8px; flex: 1; }
          .d365-feat-body > p { flex: 1; }
          .d365-feat img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 10px; display: block; background: #9FD3E8; }
          .d365-feat h3 { font-size: 16px; font-weight: 800; color: #0A0A0A; text-transform: uppercase; letter-spacing: 0.02em; margin: 0; font-family: Inter, "Helvetica Neue", system-ui, sans-serif; }
          .d365-feat p { font-size: 14px; line-height: 1.5; color: #4B5563; margin: 0; }
          .d365-feat-btn { width: 100%; height: 34px; background: #0F2044; color: #FFFFFF; border: none; border-radius: 10px; padding: 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; font-family: inherit; transition: background 120ms ease; display: flex; align-items: center; justify-content: center; margin-top: 0; }
          .d365-feat-btn:hover { background: #1A3370; }
          .d365-feat-btn--red { background: #3082cf; }
          .d365-feat-btn--red:hover { background: #2b6cb0; }
          .d365-feat-btn--blue { background: #3082cf; }
          .d365-feat-btn--blue:hover { background: #2b6cb0; }
          .d365-feat-btn--dark { background: #3082cf; }
          .d365-feat-btn--dark:hover { background: #2b6cb0; }
          .d365-spacer { background: #EAF0FF; height: 40px; border-radius: 15px; width: 100%; }
          .d365-why-wrap { background: #FFFFFF; padding: 80px 24px 56px; display: flex; justify-content: center; }
          .d365-why { width: 100%; max-width: 1200px; display: grid; grid-template-columns: 30% 70%; align-items: start; }
          .d365-why-left { padding-right: 32px; border-right: 1px solid #0F2044; }
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
              src={bookNowPayLaterBadge}
              alt="Book Now Pay Later"
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                width: 110,
                height: 110,
                transform: "rotate(-12deg)",
                zIndex: 10,
                objectFit: "contain",
              }}
            />
            <img
              src={heroPlaceholderImg}
              alt="Smiling young learner driver holding a steering wheel, ready to start lessons with EveryDriver"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="d365-hero-right">
            <div className="d365-welcome text-center">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0A1628", letterSpacing: -0.5, lineHeight: 1 }}>
                  Every<span style={{ color: "#0070C0" }}>Driver</span>
                </div>
                <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D12E2E" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                </div>
              </div>
              <div className="d365-welcome-eyebrow">Find your instructor</div>
              <h1>See who's teaching you before you book.</h1>
              <p className="mx-0 py-0" style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65, maxWidth: 440, margin: "0 auto" }}>
                Every instructor verified. Real reviews. Real pass rates. You choose who teaches you.{" "}
                <span style={{ color: "#0A1628", fontWeight: 600 }}>All bookings backed by us.</span>
              </p>
              <PostcodeSearch />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <span style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 500 }}>
                  Book now, pay later with
                </span>
                <span style={{ background: "#FFB3C7", borderRadius: 5, padding: "3px 10px", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 900, color: "#17120F" }}>
                  Klarna
                </span>
                <span style={{ background: "#B2FCE4", borderRadius: 5, padding: "3px 10px", fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 900, color: "#000E18" }}>
                  Clearpay
                </span>
              </div>
            </div>
            <div className="d365-feat-row">
              <div className="d365-feat">
                <img
                  src={intensiveCourseImg}
                  alt="Focused learner driver concentrating on the road during an intensive driving course in the UK"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                />
                <h3>Intensive Courses</h3>
                <p>Pass your test in as little as one week, with our pass guarantee.</p>
                <Link to="/courses?type=intensive">
                  <button type="button" className="d365-feat-btn d365-feat-btn--red">Read more</button>
                </Link>
              </div>
              <div className="d365-feat">
                <img
                  src={semiCourseImg}
                  alt="Happy learner driver with an L-plate enjoying a flexible semi-intensive driving lesson"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                />
                <h3>Semi Intensive</h3>
                <p>Take slightly more relaxed approach with a semi intensive course.</p>
                <Link to="/courses?type=semi-intensive">
                  <button type="button" className="d365-feat-btn d365-feat-btn--blue">Read more</button>
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
                  <p>Take your time with regular lessons at a time to suit you and your schedule.</p>
                  <Link to="/courses?type=weekly">
                    <button type="button" className="d365-feat-btn d365-feat-btn--dark">Read more</button>
                  </Link>
              </div>
            </div>
          </div>
            
          </div>
        </div>
      </section>

      {afterHero}

      <SeeWhoIsTeaching />


      {/* HomeCourses — MOBILE (unchanged) */}
      <section className="md:hidden" style={{ padding: "36px 5%", background: "#F6F6F8", width: "100%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#E8641A", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>

          Learning paths
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0A0E27", letterSpacing: -0.5, marginBottom: 8 }}>
          Choose your learning path
        </h2>
        <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5, maxWidth: 520, marginBottom: 24 }}>
          Whether you want to pass quickly or learn at your own pace, we have the perfect course for you.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 16 }}>
          {COURSES.map((course) => (
            <div
              key={course.id}
              style={{
                background: "#FFFFFF",
                borderRadius: 6,
                overflow: "hidden",
                border: course.featured ? "2px solid #E8641A" : "1px solid #E5E7EB",
                boxShadow: course.featured ? "0 4px 20px rgba(232,100,26,0.12)" : undefined,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
                <CourseCardImage courseId={course.id} badge={course.badge} badgeColor={course.badgeColor} bg={course.sceneBg} />
              </div>
              <div style={{ padding: "14px 16px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A0E27", marginBottom: 8 }}>{course.title}</h3>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>From</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#0A0E27", letterSpacing: -0.5 }}>{course.priceFrom}</span>
                  {course.priceUnit && <span style={{ fontSize: 12, fontWeight: 400, color: "#4B5563" }}>{course.priceUnit}</span>}
                </div>
              </div>
              <Link to={course.ctaHref} style={{ display: "block" }}>
                <button
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: "0 0 4px 4px",
                    padding: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    background: course.ctaBg,
                    color: "#FFF",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "background 120ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = course.ctaHoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = course.ctaBg)}
                >
                  {course.ctaLabel} <ChevronRight size={14} color="#FFF" strokeWidth={2.2} />
                </button>
              </Link>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* HomeCourses — DESKTOP compact "Three routes to your licence" */}
      <section className="hidden md:block" style={{ padding: "40px 5%", background: "linear-gradient(180deg, #F4F6FA 0%, #FFFFFF 100%)", width: "100%", fontFamily: "'Poppins', sans-serif", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
            <div style={{ maxWidth: 580 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 999, padding: "4px 10px", fontSize: 9, fontWeight: 800, color: "#0F2044", textTransform: "uppercase", letterSpacing: "1.2px", boxShadow: "0 1px 4px rgba(15,32,68,0.04)" }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: "#E8641A" }} />
                Three routes · one licence
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0A0E27", letterSpacing: "-0.8px", margin: "8px 0 6px", lineHeight: 1.15 }}>
                Choose the <span style={{ color: "#E8641A" }}>route</span> that fits your life.
              </h2>
              <p style={{ fontSize: 13, color: "#5A6B82", lineHeight: 1.5, margin: 0 }}>
                Pass fast on an intensive, balance speed with practice on a semi-intensive, or learn at your own pace with weekly lessons. Every route includes a free re-test, free theory test, and Klarna or Clearpay.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 2 }}>
              <span style={{ fontSize: 11, color: "#5A6B82", fontWeight: 600 }}>Not sure?</span>
              <Link to="/courses" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#0F2044", color: "#FFFFFF", padding: "8px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                Compare all routes <ChevronRight size={12} strokeWidth={2.4} />
              </Link>
            </div>
          </div>

          {/* Three lanes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.06fr 1fr", gap: 12, alignItems: "stretch" }}>
            {COURSES.map((course, idx) => {
              const accent = course.id === "intensive" ? "#D12E2E" : course.id === "semi" ? "#E8641A" : "#1D9E75";
              const accentSoft = course.id === "intensive" ? "#FDECEC" : course.id === "semi" ? "#FFF1E8" : "#E6F6EE";
              const lane = idx === 0 ? "01" : idx === 1 ? "02" : "03";
              const tagline = course.id === "intensive" ? "Pass in 1–2 weeks" : course.id === "semi" ? "Pass in 2–4 weeks" : "Pass at your own pace";
              const subline = course.id === "intensive" ? "Full immersion, test booked in" : course.id === "semi" ? "Balanced speed & practice" : "Same instructor every week";
              const imgSrc = course.id === "intensive" ? intensiveCourseImg : course.id === "weekly" ? weeklyCourseImg : semiCourseImg;
              const imgAlt = course.id === "intensive" ? "Learner celebrating after passing driving test" : course.id === "weekly" ? "Learner driver holding L-plates from car window" : "Two happy learners in a car";
              return (
                <div
                  key={course.id}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 12,
                    border: course.featured ? `2px solid ${accent}` : "1px solid #E8EDF2",
                    boxShadow: course.featured
                      ? `0 14px 40px -24px ${accent}66, 0 2px 0 ${accent}22 inset`
                      : "0 8px 24px -16px rgba(10,22,40,0.16)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    transform: course.featured ? "translateY(-4px)" : "none",
                    transition: "transform 220ms ease, box-shadow 220ms ease",
                  }}
                >
                  {course.featured && (
                    <div style={{ position: "absolute", top: 10, right: 10, zIndex: 5, background: accent, color: "#FFFFFF", fontSize: 8, fontWeight: 900, padding: "4px 8px", borderRadius: 999, letterSpacing: "1px", textTransform: "uppercase", boxShadow: `0 4px 10px -4px ${accent}88` }}>
                      Most popular
                    </div>
                  )}

                  {/* Card image */}
                  <div style={{ height: 130, overflow: "hidden", position: "relative" }}>
                    <img
                      src={imgSrc}
                      alt={imgAlt}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>

                  {/* Lane header */}
                  <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: accentSoft, color: accent, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, letterSpacing: "-0.5px", border: `1px solid ${accent}22` }}>
                      {lane}
                    </div>
                    <div style={{ lineHeight: 1.15 }}>
                      <div style={{ fontSize: 8, fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "1.2px" }}>{course.badge}</div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0A0E27", margin: "2px 0 0", letterSpacing: "-0.2px" }}>{course.title}</h3>
                    </div>
                  </div>

                  {/* Tagline */}
                  <div style={{ padding: "10px 16px 0" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2044" }}>{tagline}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{subline}</div>
                  </div>

                  {/* Price */}
                  <div style={{ padding: "12px 16px 2px", display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>From</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#0A0E27", letterSpacing: "-0.8px" }}>{course.priceFrom}</span>
                    {course.priceUnit && <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>{course.priceUnit}</span>}
                  </div>

                  {/* Features */}
                  <ul style={{ listStyle: "none", margin: 0, padding: "8px 16px 2px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {course.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151", fontWeight: 500 }}>
                        <span style={{ width: 16, height: 16, borderRadius: 999, background: accentSoft, color: accent, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={10} strokeWidth={3} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Spread cost row */}
                  <div style={{ margin: "10px 16px 0", padding: "8px 10px", background: "#F6F8FC", border: "1px solid #EAEEF5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <span style={{ fontSize: 9, color: "#5A6B82", fontWeight: 600 }}>Spread cost · 0% interest</span>
                    <span style={{ display: "inline-flex", gap: 3 }}>
                      <span style={{ background: "#FFB3C7", color: "#17120F", fontSize: 8, fontWeight: 900, padding: "2px 5px", borderRadius: 3 }}>Klarna</span>
                      <span style={{ background: "#B2FCE4", color: "#000E18", fontSize: 8, fontWeight: 900, padding: "2px 5px", borderRadius: 3 }}>Clearpay</span>
                    </span>
                  </div>

                  {/* CTA */}
                  <div style={{ padding: 16, marginTop: "auto" }}>
                    <Link to={course.ctaHref} style={{ display: "block" }}>
                      <button
                        style={{
                          width: "100%",
                          border: "none",
                          borderRadius: 10,
                          padding: "10px 14px",
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "-0.2px",
                          background: course.featured ? accent : "#0F2044",
                          color: "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          boxShadow: course.featured ? `0 8px 18px -10px ${accent}99` : "0 6px 14px -8px rgba(15,32,68,0.5)",
                          transition: "transform 160ms ease, box-shadow 160ms ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                      >
                        {course.ctaLabel} <ChevronRight size={12} strokeWidth={2.6} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reassurance footer row */}
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 16, color: "#5A6B82", fontSize: 11, fontWeight: 600 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={12} color="#1D9E75" strokeWidth={3} /> Free re-test if you don't pass</span>
            <span style={{ width: 3, height: 3, borderRadius: 999, background: "#CBD2DD" }} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={12} color="#1D9E75" strokeWidth={3} /> Free theory test included</span>
            <span style={{ width: 3, height: 3, borderRadius: 999, background: "#CBD2DD" }} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={12} color="#1D9E75" strokeWidth={3} /> DVSA-approved instructors</span>
          </div>
        </div>
      </section>


      {afterLearningPaths}

      <PupilReviewsSection />

    </div>
  );
}

