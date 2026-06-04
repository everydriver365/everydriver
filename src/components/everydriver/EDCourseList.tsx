import { useEmbed } from "@/context/EmbedContext";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronRight, Star, BadgeCheck } from "lucide-react";
import klarnaLogo from "@/assets/klarna-round-logo.svg";
import clearpayLogo from "@/assets/clearpay-round-logo.svg";
import { useInstructorRating, hasEnoughReviews } from "@/hooks/useInstructorRating";
import { useVerifiedProSummary } from "@/hooks/useVerifiedProSummary";


// Drive 365 list-view course card. Literal brand hex per spec — this is
// a one-off whitelabel surface that intentionally bypasses semantic tokens.

interface EDCourse {
  instructor: {
    id: string;
    name?: string | null;
    car_type?: string | null;
    klarna_enabled?: boolean | null;
    clearpay_enabled?: boolean | null;
    hourly_rate?: number | null;
    profile_image_url?: string | null;
    home_postcode?: string | null;
  };
  hours: number;
  bookableDate: Date;
  isPopular?: boolean;
  isIntensive?: boolean;
  distance?: number;
  price?: number;
  discountedPrice?: number | null;
  areaName?: string | null;
}

interface EDCourseListProps {
  courses: EDCourse[];
}

const NAVY = "#0A2B6B";
const TEXT_GREY = "#6B7280";
const BORDER = "#E5E7EB";
const HOUR_FILL = "#F0F4FB";
const AMBER = "#F4B83C";

function transmissionLabel(carType?: string | null) {
  if (!carType) return "Manual";
  if (carType === "automatic") return "Automatic";
  if (carType === "both") return "Manual & auto";
  return "Manual";
}

function courseTypeLabel(c: EDCourse) {
  if (c.isIntensive) return "Intensive";
  if (c.hours >= 30) return "Intensive";
  if (c.hours >= 20) return "Semi-intensive";
  return "Weekly";
}

function hoursColour(hours: number): string {
  if (hours === 10) return "#059669";
  if (hours === 20) return "#0070C0";
  if (hours === 30) return "#F59E0B";
  if (hours === 40) return "#D12E2E";
  return "#7C3AED";
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function InstructorMeta({ instructorId }: { instructorId: string }) {
  const { data, isLoading } = useInstructorRating(instructorId);
  const { data: verified } = useVerifiedProSummary(instructorId);
  const isVerified =
    !!verified?.badge_enabled &&
    (verified.verified_credential_count > 0 || verified.is_founding);
  const enough = !isLoading && data && hasEnoughReviews(data);

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      {enough && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A0E27]">
          <Star className="h-3 w-3 fill-[#FBBF24] text-[#FBBF24]" />
          {data!.avgRating?.toFixed(1)}
          <span className="text-[10px] font-normal text-[#9CA3AF]">
            ({data!.totalReviews})
          </span>
        </span>
      )}
      {isVerified && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide text-emerald-700"
          title="DBS checked · ADI registered · Insured"
        >
          <BadgeCheck className="h-2.5 w-2.5" />
          Verified
        </span>
      )}
    </span>
  );
}


export function EDCourseList({ courses }: EDCourseListProps) {
  const { bookNavigate } = useEmbed();

  const goTo = (c: EDCourse) => {
    const dateParam = c.bookableDate
      ? `&date=${format(c.bookableDate, "yyyy-MM-dd")}`
      : "";
    const edParam =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("everydriver") === "1"
        ? "&everydriver=1"
        : "";
    bookNavigate(`/book/${c.instructor.id}?hours=${c.hours}${dateParam}${edParam}`);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {courses.map((c) => {
        const basePrice =
          c.price ??
          (c.instructor.hourly_rate != null
            ? c.instructor.hourly_rate * c.hours
            : 0);
        const final =
          c.discountedPrice && c.discountedPrice < basePrice
            ? c.discountedPrice
            : basePrice;
        const klarnaPer = Math.round(final / 3);
        const clearpayPer = Math.round(final / 4);
        const perHour = Math.round(final / Math.max(c.hours, 1));
        const bar = hoursColour(c.hours);
        const location =
          c.areaName || c.instructor.home_postcode || null;

        return (
          <div
            key={`${c.instructor.id}-${c.hours}-${c.bookableDate.toISOString()}`}
            role="button"
            tabIndex={0}
            onClick={() => goTo(c)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goTo(c);
              }
            }}
            className="ed-card group cursor-pointer bg-white overflow-hidden rounded-xl border border-[#E5E7EB] transition-[box-shadow,border-color] duration-150 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#0070C0]"
          >
            {/* ─────────── DESKTOP ─────────── */}
            <div className="hidden sm:flex items-stretch">
              {/* A — colour bar */}
              <div
                className="w-[5px] shrink-0"
                style={{ background: bar }}
                aria-hidden
              />

              {/* B — hours */}
              <div className="w-16 shrink-0 border-r border-[#F3F4F6] py-3 flex flex-col items-center justify-center">
                <div className="text-[22px] font-extrabold text-[#0A0E27] leading-none">
                  {c.hours}
                </div>
                <div className="mt-1 text-[9px] font-semibold tracking-[0.05em] uppercase text-[#9CA3AF]">
                  hours
                </div>
                {c.isPopular && (
                  <div
                    className="mt-1 text-[8px] font-bold tracking-[0.05em] uppercase rounded-[3px] px-1.5 py-[2px]"
                    style={{ background: "#FEF3C7", color: "#B45309" }}
                  >
                    Popular
                  </div>
                )}
              </div>

              {/* C — details */}
              <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[#0A0E27] truncate">
                    {courseTypeLabel(c)} · {transmissionLabel(c.instructor.car_type)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#9CA3AF] truncate">
                    Starts {format(c.bookableDate, "EEE d MMM")}
                    {location ? ` · ${location}` : ""}
                    {typeof c.distance === "number"
                      ? ` · ${c.distance.toFixed(1)} mi`
                      : ""}
                  </div>
                </div>

                {/* Instructor strip */}
                <div className="flex items-center gap-2 min-w-0">
                  {c.instructor.profile_image_url ? (
                    <img
                      src={c.instructor.profile_image_url}
                      alt={c.instructor.name ?? ""}
                      className="h-7 w-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: "#1E4D9B" }}
                    >
                      {initials(c.instructor.name)}
                    </div>
                  )}
                  {c.instructor.name && (
                    <span className="text-[12px] font-semibold text-[#0A0E27] truncate">
                      {c.instructor.name}
                    </span>
                  )}
                  <InstructorMeta instructorId={c.instructor.id} />
                </div>
              </div>

              {/* D — BNPL pills */}
              {(c.instructor.klarna_enabled || c.instructor.clearpay_enabled) && (
                <div className="w-40 shrink-0 border-l border-[#F3F4F6] p-3 flex flex-col justify-center gap-1.5">
                  {c.instructor.klarna_enabled && (
                    <div
                      className="flex items-center justify-between rounded px-2 py-1 text-[10px] font-bold"
                      style={{ background: "#FFB3C7", color: "#710037" }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <img
                          src={klarnaLogo}
                          alt=""
                          className="h-3.5 w-3.5"
                        />
                        klarna
                      </span>
                      <span>£{klarnaPer}</span>
                    </div>
                  )}
                  {c.instructor.clearpay_enabled && (
                    <div
                      className="flex items-center justify-between rounded px-2 py-1 text-[10px] font-bold"
                      style={{ background: "#B2FCE4", color: "#003D28" }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <img
                          src={clearpayLogo}
                          alt=""
                          className="h-3.5 w-3.5"
                        />
                        clearpay
                      </span>
                      <span>£{clearpayPer}</span>
                    </div>
                  )}
                </div>
              )}

              {/* E — price + CTA */}
              <div className="w-[110px] shrink-0 border-l border-[#F3F4F6] p-3 flex flex-col items-end justify-center gap-2">
                <div className="text-[22px] font-extrabold text-[#0A0E27] tracking-[-0.5px] leading-none">
                  £{Math.round(final).toLocaleString()}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(c);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-[7px] bg-[#0070C0] text-white px-4 py-2 text-xs font-bold transition-colors hover:bg-[#005a9a]"
                >
                  View
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* ─────────── MOBILE (unchanged) ─────────── */}
            <div className="sm:hidden p-4 flex flex-col gap-2.5">
              <div className="flex items-start gap-3">
                <div className="relative flex items-center justify-center">
                  {c.isPopular && (
                    <div
                      className="absolute"
                      style={{
                        top: -8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: AMBER,
                        color: NAVY,
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        padding: "2px 6px",
                        borderRadius: 4,
                        whiteSpace: "nowrap",
                        zIndex: 1,
                      }}
                    >
                      POPULAR
                    </div>
                  )}
                  <div
                    className="flex flex-col items-center justify-center"
                    style={{
                      background: HOUR_FILL,
                      borderRadius: 10,
                      width: 64,
                      height: 64,
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, lineHeight: 1 }}>
                      {c.hours}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: TEXT_GREY,
                      }}
                    >
                      HOURS
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>
                    {courseTypeLabel(c)} · {transmissionLabel(c.instructor.car_type)}
                  </div>
                  <div
                    className="flex items-center"
                    style={{ gap: 6, marginTop: 3, color: TEXT_GREY, fontSize: 12 }}
                  >
                    <CalendarIcon style={{ width: 12, height: 12 }} />
                    Starts {format(c.bookableDate, "EEE d MMM")}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: NAVY,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    £{Math.round(final).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {c.instructor.klarna_enabled && (
                    <span
                      className="inline-flex items-center"
                      style={{
                        background: "#FFA8CD",
                        color: "#0a0a0a",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        gap: 6,
                        lineHeight: 1,
                      }}
                    >
                      <img src={klarnaLogo} alt="Klarna" style={{ height: 14, width: 14 }} />
                      3 × £{klarnaPer}
                    </span>
                  )}
                  {c.instructor.clearpay_enabled && (
                    <span
                      className="inline-flex items-center"
                      style={{
                        background: "#B2FCE4",
                        color: "#0a0a0a",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        gap: 6,
                        lineHeight: 1,
                      }}
                    >
                      <img src={clearpayLogo} alt="Clearpay" style={{ height: 14, width: 14 }} />
                      4 × £{clearpayPer}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(c);
                  }}
                  className="inline-flex items-center gap-1"
                  style={{
                    background: NAVY,
                    color: "white",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: 8,
                  }}
                >
                  View
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
