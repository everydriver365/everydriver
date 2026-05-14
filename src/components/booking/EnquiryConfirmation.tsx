import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

interface InstructorLite {
  id: string;
  name: string;
  profile_image_url: string | null;
  brand_colour: string | null;
  typical_response_hours?: number | null;
  car_type?: string | null;
  location_name?: string | null;
  home_postcode?: string | null;
}

interface Props {
  instructor: InstructorLite;
  submittedEmail: string;
}

const D365_PRIMARY = "#142040";
const D365_TEXT = "#0f172a";
const D365_TEXT_MUTED = "#5b6577";
const D365_BORDER = "#e3e7ee";
const D365_TINT = "#eef1f8";
const D365_SOFT = "#f4f6fa";
const D365_SUCCESS = "#16a34a";
const D365_SUCCESS_TINT = "#e7f6ec";
const D365_ACCENT = "#2B7BC8";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function EnquiryConfirmation({ instructor, submittedEmail }: Props) {
  const navigate = useNavigate();
  const firstName = instructor.name.split(/\s+/)[0] || instructor.name;
  const responseHours = instructor.typical_response_hours ?? 24;

  const carTypeLabel = instructor.car_type
    ? instructor.car_type.charAt(0).toUpperCase() + instructor.car_type.slice(1)
    : null;
  const areaLabel = instructor.location_name || instructor.home_postcode || null;
  const metaLine = [carTypeLabel, areaLabel ? `${areaLabel} area` : null].filter(Boolean).join(" · ");

  return (
    <div
      className="drive365-brand mx-auto w-full"
      style={{
        maxWidth: 520,
        background: "#ffffff",
        borderRadius: 16,
        border: `1px solid ${D365_BORDER}`,
        padding: "32px 28px 24px",
        color: D365_TEXT,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Success */}
      <div className="flex flex-col items-center text-center">
        <div
          className="flex items-center justify-center"
          style={{ width: 64, height: 64, borderRadius: 999, background: D365_SUCCESS_TINT }}
        >
          <Check size={32} strokeWidth={2.5} style={{ color: D365_SUCCESS }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: D365_PRIMARY, marginTop: 18, marginBottom: 8 }}>
          Enquiry sent
        </h2>
        <p style={{ fontSize: 14, color: D365_TEXT_MUTED, lineHeight: 1.55, maxWidth: 420 }}>
          We've passed your message on to{" "}
          <span style={{ color: D365_PRIMARY, fontWeight: 600 }}>{firstName}</span>. A confirmation is on its way to{" "}
          <span style={{ color: D365_PRIMARY, fontWeight: 600 }}>{submittedEmail}</span>.
        </p>
      </div>

      {/* Instructor recap */}
      <div
        className="flex items-center gap-3 mt-6"
        style={{ background: D365_TINT, borderRadius: 12, padding: 14 }}
      >
        <div
          className="flex-shrink-0 overflow-hidden rounded-full flex items-center justify-center text-white font-semibold"
          style={{
            width: 40, height: 40,
            background: `linear-gradient(135deg, ${D365_PRIMARY}, ${D365_ACCENT})`,
            fontSize: 13,
          }}
        >
          {instructor.profile_image_url ? (
            <img src={instructor.profile_image_url} alt={instructor.name} className="w-full h-full object-cover" />
          ) : (
            initials(instructor.name)
          )}
        </div>
        <div className="min-w-0">
          <div style={{ fontWeight: 700, color: D365_PRIMARY, fontSize: 14 }}>{instructor.name}</div>
          {metaLine && (
            <div style={{ fontSize: 12, color: D365_TEXT_MUTED, marginTop: 2 }}>{metaLine}</div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: D365_SOFT, borderRadius: 12, padding: 18, marginTop: 16 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: D365_TEXT_MUTED, marginBottom: 14 }}>
          WHAT HAPPENS NEXT
        </div>
        <Timeline
          steps={[
            {
              state: "done",
              title: "Your enquiry is on its way",
              sub: "Sent just now",
            },
            {
              state: "current",
              title: `${firstName} gets in touch`,
              sub: `Usually within ${responseHours} hours, by email or phone`,
            },
            {
              state: "future",
              title: "Agree dates that suit you",
              sub: "No payment until you're both happy with the plan",
            },
          ]}
        />
      </div>

      {/* Outline CTA */}
      <button
        type="button"
        onClick={() => navigate("/courses")}
        className="w-full mt-5 flex items-center justify-center gap-2 transition-colors"
        style={{
          background: "#fff", color: D365_PRIMARY, fontWeight: 600, fontSize: 14,
          padding: "12px 16px", borderRadius: 10, border: `1px solid ${D365_BORDER}`, cursor: "pointer",
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = D365_SOFT; e.currentTarget.style.borderColor = D365_PRIMARY; }}
        onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = D365_BORDER; }}
      >
        Browse other instructors nearby
        <ArrowRight size={16} />
      </button>

      {/* Footnote */}
      <p style={{ fontSize: 11.5, color: D365_TEXT_MUTED, marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>
        Haven't heard back after 48 hours?{" "}
        <a
          href="mailto:enquiries@drive365.co.uk"
          style={{ color: D365_PRIMARY, fontWeight: 600, textDecoration: "underline" }}
        >
          Let us know
        </a>{" "}
        and we'll chase it up.
      </p>
    </div>
  );
}

interface Step {
  state: "done" | "current" | "future";
  title: string;
  sub: string;
}

function Timeline({ steps }: { steps: Step[] }) {
  return (
    <div style={{ position: "relative" }}>
      {/* Vertical connector */}
      <div
        style={{
          position: "absolute", left: 11, top: 12, bottom: 12,
          width: 1, background: D365_BORDER,
        }}
      />
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3" style={{ position: "relative", marginBottom: i < steps.length - 1 ? 14 : 0 }}>
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: 24, height: 24, borderRadius: 999,
              background: step.state === "done" ? D365_SUCCESS
                : step.state === "current" ? D365_ACCENT
                : "#dde2ec",
              color: step.state === "future" ? "#7a8294" : "#fff",
              fontSize: 11, fontWeight: 700,
              zIndex: 1,
            }}
          >
            {step.state === "done" ? <Check size={14} strokeWidth={3} /> : (i + 1)}
          </div>
          <div className="min-w-0" style={{ paddingTop: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: D365_PRIMARY }}>{step.title}</div>
            <div style={{ fontSize: 12, color: D365_TEXT_MUTED, marginTop: 1 }}>{step.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
