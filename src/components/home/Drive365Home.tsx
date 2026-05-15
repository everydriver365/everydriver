import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  Check,
  ChevronRight,
  ArrowLeftRight,
  CreditCard,
  User,
} from "lucide-react";
import heroLearnerImg from "@/assets/drive365-hero-learner.jpeg";
import intensiveCourseImg from "@/assets/course-intensive-pass.jpg";
import weeklyCourseImg from "@/assets/course-weekly-lessons.jpg";
import semiCourseImg from "@/assets/course-semi-intensive.jpg";

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
    badgeColor: "#1D9E75",
    title: "Intensive Courses",
    description:
      "Full immersion experience. Learn everything in concentrated sessions and pass your test in record time.",
    features: ["30–40 hours of lessons", "Pass in 1–2 weeks", "Test booking included"],
    priceFrom: "£1,299",
    priceUnit: null as string | null,
    ctaLabel: "View courses",
    ctaHref: "/courses?type=intensive",
    ctaBg: "#0F2044",
    featured: false,
    sceneBg: "#1A52A0",
  },
  {
    id: "semi",
    badge: "Most popular",
    badgeColor: "#1A52A0",
    title: "Semi-Intensive",
    description:
      "The perfect balance of speed and flexibility. Ideal if you have some availability but need time to practise between sessions.",
    features: ["30 hours of lessons", "Pass in 2–4 weeks", "Flexible scheduling"],
    priceFrom: "£999",
    priceUnit: null as string | null,
    ctaLabel: "View courses",
    ctaHref: "/courses?type=semi-intensive",
    ctaBg: "#1A52A0",
    featured: true,
    sceneBg: "#3B6D11",
  },
  {
    id: "weekly",
    badge: "Flexible",
    badgeColor: "#3B6D11",
    title: "Weekly Lessons",
    description:
      "Traditional approach for busy schedules. Build confidence gradually with regular weekly sessions at times that suit you.",
    features: ["1–2 hours per week", "Pay as you go", "Same instructor every week"],
    priceFrom: "£35",
    priceUnit: "/hour",
    ctaLabel: "View lessons",
    ctaHref: "/courses?type=weekly",
    ctaBg: "#0F2044",
    featured: false,
    sceneBg: "#1D9E75",
  },
];

const WHY_ITEMS = [
  {
    icon: ShieldCheck,
    iconBg: "#E6F1FB",
    iconColor: "#1A52A0",
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
    color: "#1A52A0",
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
        <stop offset="100%" stopColor="#0F2044" />
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
      <rect key={i} x={20 + i * 75} y={278} width="40" height="4" fill="#5DCAA5" opacity="0.7" />
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
    <path d="M195 232 L218 218 L268 218 L286 232 Z" fill="#0F2044" />
    <path d="M290 232 L286 218 L318 220 L328 232 Z" fill="#0F2044" />
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
      background: `linear-gradient(180deg, ${bg} 0%, #0F2044 100%)`,
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
            <path d="M0 150 Q120 130 240 145 T360 140 L360 180 L0 180 Z" fill="#0F2044" opacity="0.6" />
          </>
        ) : (
          <>
            <circle cx="290" cy="45" r="20" fill="#FDE68A" opacity="0.9" />
            <path d="M0 120 L60 80 L130 115 L210 70 L290 110 L360 90 L360 180 L0 180 Z" fill="#3B6D11" opacity="0.6" />
            <path d="M0 145 L80 125 L170 140 L260 120 L360 135 L360 180 L0 180 Z" fill="#0F2044" opacity="0.6" />
          </>
        )}
        {/* car */}
        <g transform="translate(110,110)">
          <path
            d="M0 30 Q5 10 25 8 L80 8 Q100 10 108 25 L120 25 Q125 25 125 31 L125 36 Q125 40 121 40 L110 40 Q108 48 100 48 Q92 48 90 40 L40 40 Q38 48 30 48 Q22 48 20 40 L8 40 Q4 40 4 36 L4 32 Q4 30 0 30 Z"
            fill="#E63946"
          />
          <path d="M22 18 L40 10 L72 10 L88 18 Z" fill="#0F2044" />
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
        borderRadius: 999,
        letterSpacing: 0.2,
      }}
    >
      {badge}
    </div>
  </div>
);

export default function Drive365Home() {
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
    <div style={{ width: "100%", overflow: "hidden", background: "#F0F2F5" }}>

      {/* HomeHero */}
      <section
        style={{
          background: "#0F2044",
          position: "relative",
          overflow: "hidden",
          padding: "64px 5% 0",
          width: "100%",
        }}
      >
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "#1A52A0", opacity: 0.07, top: -200, right: "10%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "#1D9E75", opacity: 0.05, bottom: -100, left: "5%", pointerEvents: "none" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "flex-end", width: "100%", position: "relative", zIndex: 1 }}>
          <div>
            <h1 style={{ fontSize: 46, fontWeight: 700, color: "#FFF", lineHeight: 1.14, letterSpacing: -1.5, marginBottom: 16, whiteSpace: "pre-line" }}>
              {"Learn to drive\nwith "}
              <span style={{ color: "#5DCAA5" }}>confidence</span>
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 24, maxWidth: 440 }}>
              Money back if you pass first time. Free retest if you don't. Find an instructor near you today.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Spread the cost with</span>
              <span style={{ background: "#FFF", borderRadius: 5, padding: "3px 9px", fontSize: 11, fontWeight: 700, color: "#FF5B78" }}>klarna</span>
              <span style={{ background: "#FFF", borderRadius: 5, padding: "3px 9px", fontSize: 11, fontWeight: 700, color: "#1E3545" }}>clearpay</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <img
              src={heroLearnerImg}
              alt="Confident learner driver behind the wheel"
              style={{
                width: "100%",
                maxWidth: 520,
                height: "auto",
                borderRadius: 20,
                objectFit: "cover",
                boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
                display: "block",
              }}
            />
          </div>
        </div>
      </section>

      {/* HomeSearchCard */}
      <div style={{ background: "#F0F2F5", padding: "0 5%", width: "100%" }}>
        <div
          style={{
            background: "#FFF",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(15,32,68,0.13)",
            padding: "22px 28px",
            transform: "translateY(-50%)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "2 1 200px" }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: "#5F6B7A" }}>Your postcode</label>
              <input
                type="text"
                placeholder="e.g. SO30 2TD"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                style={{ border: "1px solid #E0E4EB", borderRadius: 8, padding: "10px 13px", fontSize: 14, color: "#0F2044", background: "#F8F9FA", outline: "none", width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 120px" }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: "#5F6B7A" }}>Radius</label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                style={{ border: "1px solid #E0E4EB", borderRadius: 8, padding: "10px 13px", fontSize: 14, color: "#0F2044", background: "#F8F9FA", outline: "none", width: "100%" }}
              >
                {["5 miles", "10 miles", "15 miles", "20 miles"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 120px" }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: "#5F6B7A" }}>Transmission</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                style={{ border: "1px solid #E0E4EB", borderRadius: 8, padding: "10px 13px", fontSize: 14, color: "#0F2044", background: "#F8F9FA", outline: "none", width: "100%" }}
              >
                {["Any", "Manual", "Automatic"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button
              onClick={handleSearch}
              style={{
                background: "#1A52A0",
                border: "none",
                borderRadius: 10,
                padding: "11px 26px",
                fontSize: 14,
                fontWeight: 600,
                color: "#FFF",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 44,
                flexShrink: 0,
              }}
            >
              <Search size={15} color="#FFF" />
              Search all instructors
            </button>
          </div>
        </div>
      </div>

      {/* HomeSocialProof */}
      <div
        style={{
          background: "#FFF",
          borderTop: "0.5px solid #E0E4EB",
          borderBottom: "0.5px solid #E0E4EB",
          padding: "18px 5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          marginTop: -10,
        }}
      >
        {PROOF_STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "0 20px",
              borderRight: i < PROOF_STATS.length - 1 ? "0.5px solid #E0E4EB" : "none",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0F2044", letterSpacing: -0.5, lineHeight: 1 }}>
              {stat.isStars ? "★★★★★" : stat.num}
            </div>
            <div style={{ fontSize: 11, color: "#5F6B7A", marginTop: 3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* HomeCourses */}
      <section style={{ padding: "56px 5%", background: "#F0F2F5", width: "100%" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#1A52A0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
          Learning paths
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: "#0F2044", letterSpacing: -0.5, marginBottom: 10 }}>
          Choose your learning path
        </h2>
        <p style={{ fontSize: 15, color: "#5F6B7A", lineHeight: 1.6, maxWidth: 520, marginBottom: 36 }}>
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
                border: course.featured ? "2px solid #1A52A0" : "1px solid #E0E4EB",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CourseCardImage courseId={course.id} badge={course.badge} badgeColor={course.badgeColor} bg={course.sceneBg} />
              <div style={{ padding: 22, flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F2044", marginBottom: 6 }}>{course.title}</h3>
                <p style={{ fontSize: 13, color: "#5F6B7A", lineHeight: 1.6, marginBottom: 14 }}>{course.description}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 18 }}>
                  {course.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5F6B7A" }}>
                      <Check size={11} color="#1A52A0" strokeWidth={1.8} />
                      {f}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "auto" }}>
                  <div style={{ fontSize: 11, color: "#5F6B7A", marginBottom: 1 }}>From</div>
                  <div>
                    <span style={{ fontSize: 26, fontWeight: 700, color: "#0F2044", letterSpacing: -0.5 }}>{course.priceFrom}</span>
                    {course.priceUnit && <span style={{ fontSize: 12, color: "#5F6B7A" }}>{course.priceUnit}</span>}
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

      {/* HomeWhyDrive365 */}
      <section style={{ padding: "56px 5%", background: "#FFF", width: "100%" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#1A52A0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
          Why Drive365
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: "#0F2044", letterSpacing: -0.5, marginBottom: 28 }}>
          Everything you need to pass
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16 }}>
          {WHY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} style={{ background: "#FFF", borderRadius: 14, padding: 22, border: "0.5px solid #E0E4EB" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: item.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={18} color={item.iconColor} strokeWidth={1.7} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0F2044", marginBottom: 5 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#5F6B7A", lineHeight: 1.6 }}>{item.body}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HomeReviews */}
      <section style={{ padding: "56px 5%", background: "#F0F2F5", width: "100%" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#1A52A0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
          Reviews
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: "#0F2044", letterSpacing: -0.5, marginBottom: 10 }}>
          What our learners say
        </h2>
        <p style={{ fontSize: 15, color: "#5F6B7A", lineHeight: 1.6, marginBottom: 32 }}>
          Over 3,200 five-star reviews from learners across the UK.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 16 }}>
          {REVIEWS.map((rev) => (
            <div key={rev.name} style={{ background: "#FFF", borderRadius: 14, padding: 20, border: "0.5px solid #E0E4EB" }}>
              <div style={{ color: "#F59E0B", fontSize: 13, letterSpacing: 1, marginBottom: 10 }}>★★★★★</div>
              <p style={{ fontSize: 13, color: "#3D4A5C", lineHeight: 1.65, marginBottom: 14 }}>{rev.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: rev.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#FFF", flexShrink: 0 }}>
                  {rev.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#0F2044" }}>{rev.name}</div>
                  <div style={{ fontSize: 11, color: "#5F6B7A" }}>{rev.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HomeSwapBand */}
      <section
        style={{
          background: "#0F2044",
          padding: "56px 5%",
          display: "flex",
          alignItems: "center",
          gap: 48,
          position: "relative",
          overflow: "hidden",
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "#1A52A0", opacity: 0.12, right: -120, top: -150, pointerEvents: "none" }} />
        <div style={{ flex: "1 1 360px", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5DCAA5", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            New — Free feature
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "#FFF", letterSpacing: -0.5, marginBottom: 10, whiteSpace: "pre-line" }}>
            {"Can't wait months\nfor your test?"}
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 460 }}>
            Swap your driving test date with another learner — completely free. Drive365 matches you, DVSA completes the swap. Your booking reference never changes.
          </p>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          <Link to="/test-swap">
            <button style={{ background: "#1D9E75", border: "none", borderRadius: 9, padding: "13px 24px", fontSize: 14, fontWeight: 600, color: "#FFF", cursor: "pointer", whiteSpace: "nowrap", width: "100%" }}>
              Find a swap match →
            </button>
          </Link>
          <Link to="/test-swap#how-it-works">
            <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 9, padding: "13px 24px", fontSize: 14, color: "rgba(255,255,255,0.7)", cursor: "pointer", whiteSpace: "nowrap", width: "100%" }}>
              How it works
            </button>
          </Link>
        </div>
      </section>

      {/* HomeFooterCTA */}
      <section style={{ background: "#1A52A0", padding: "64px 5%", textAlign: "center", width: "100%", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.05)", top: -200, right: -100, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, color: "#FFF", letterSpacing: -0.5, marginBottom: 10 }}>
            Ready to start learning?
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginBottom: 28, lineHeight: 1.6, maxWidth: 440, margin: "0 auto 28px" }}>
            Find a DVSA-approved instructor near you and book your first lesson today.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/instructors">
              <button style={{ background: "#FFF", border: "none", borderRadius: 9, padding: "13px 28px", fontSize: 14, fontWeight: 600, color: "#1A52A0", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
                Search instructors <ChevronRight size={13} color="#1A52A0" strokeWidth={2.2} />
              </button>
            </Link>
            <Link to="/courses">
              <button style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.3)", borderRadius: 9, padding: "13px 28px", fontSize: 14, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>
                Browse courses
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
