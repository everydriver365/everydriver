import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import klarnaLogo from "@/assets/klarna-wordmark.svg";
import clearpayLogo from "@/assets/clearpay-wordmark.svg";

// EveryDriver-only redesigned list view for course search results.
// Brand tokens (literal hex per spec — intentionally not using semantic tokens
// because this surface is a one-off whitelabel skin that should not follow the
// Drive365 design system):
//   navy        #0A2B6B   primary text + buttons
//   amber       #F4B83C   "POPULAR" ribbon
//   green       #3FB76B
//   red         #E63946
//   greys       #6B7280 (text), #E5E7EB (border), #F0F4FB (hour fill),
//               #F3F4F6 (chip bg)
//   page bg     #F9FAFB
//   surface     #FFFFFF

interface EDCourse {
  instructor: {
    id: string;
    name?: string | null;
    car_type?: string | null;
    klarna_enabled?: boolean | null;
    clearpay_enabled?: boolean | null;
  };
  hours: number;
  bookableDate: Date;
  isPopular?: boolean;
  isIntensive?: boolean;
  distance?: number;
  price: number;
  discountedPrice?: number | null;
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

export function EDCourseList({ courses }: EDCourseListProps) {
  const navigate = useNavigate();

  const goTo = (c: EDCourse) => {
    const dateParam = c.bookableDate
      ? `&date=${format(c.bookableDate, "yyyy-MM-dd")}`
      : "";
    // Preserve the ?everydriver=1 preview override so the booking page also
    // renders the EveryDriver clone. On the real everydriver.co.uk host the
    // param is absent and host-detection takes over.
    const edParam =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("everydriver") === "1"
        ? "&everydriver=1"
        : "";
    navigate(`/book/${c.instructor.id}?hours=${c.hours}${dateParam}${edParam}`);
  };

  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      {courses.map((c) => {
        const final =
          c.discountedPrice && c.discountedPrice < c.price
            ? c.discountedPrice
            : c.price;
        const klarnaPer = Math.round(final / 3);
        const clearpayPer = Math.round(final / 4);
        const perHour = Math.round(final / Math.max(c.hours, 1));

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
            className="ed-course-card group cursor-pointer bg-white transition-colors"
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            {/* Desktop layout */}
            <div
              className="hidden sm:grid items-center"
              style={{
                gridTemplateColumns: "104px 1fr auto",
                gap: 20,
              }}
            >
              {/* Hours block */}
              <div className="flex items-center justify-center">
                <div
                  className="flex flex-col items-center justify-center"
                  style={{
                    background: HOUR_FILL,
                    borderRadius: 14,
                    width: 104,
                    minHeight: 104,
                    padding: c.isPopular ? "10px 8px 14px" : "0",
                  }}
                >
                  {c.isPopular && (
                    <div
                      style={{
                        background: AMBER,
                        color: NAVY,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        padding: "3px 10px",
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    >
                      POPULAR
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      color: NAVY,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {c.hours}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: TEXT_GREY,
                    }}
                  >
                    HOURS
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: NAVY,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {courseTypeLabel(c)} · {transmissionLabel(c.instructor.car_type)}
                </div>
                <div
                  className="flex items-center"
                  style={{ gap: 6, marginTop: 6, color: TEXT_GREY, fontSize: 13 }}
                >
                  <CalendarIcon style={{ width: 14, height: 14 }} />
                  Starts {format(c.bookableDate, "EEE d MMM")}
                </div>

                {/* Payment chips */}
                {(c.instructor.klarna_enabled || c.instructor.clearpay_enabled) && (
                  <div
                    className="flex flex-wrap items-center"
                    style={{ gap: 8, marginTop: 12 }}
                  >
                    {c.instructor.klarna_enabled && (
                      <span
                        className="inline-flex items-center"
                        style={{
                          background: "#FFA8CD",
                          color: "#0a0a0a",
                          padding: "8px 14px",
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          gap: 10,
                          lineHeight: 1.1,
                        }}
                      >
                        <img
                          src={klarnaLogo}
                          alt="Klarna"
                          style={{ height: 13, width: "auto" }}
                        />
                        <span className="flex flex-col" style={{ fontSize: 12 }}>
                          <span>3 ×</span>
                          <span>£{klarnaPer}</span>
                        </span>
                      </span>
                    )}
                    {c.instructor.clearpay_enabled && (
                      <span
                        className="inline-flex items-center"
                        style={{
                          background: "#B2FCE4",
                          color: "#0a0a0a",
                          padding: "8px 14px",
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          gap: 10,
                          lineHeight: 1.1,
                        }}
                      >
                        <img
                          src={clearpayLogo}
                          alt="Clearpay"
                          style={{ height: 13, width: "auto" }}
                        />
                        <span className="flex flex-col" style={{ fontSize: 12 }}>
                          <span>4 ×</span>
                          <span>£{clearpayPer}</span>
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Price + action */}
              <div className="flex flex-col items-end" style={{ gap: 4 }}>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: NAVY,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  £{Math.round(final).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: TEXT_GREY }}>
                  £{perHour}/hr
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(c);
                  }}
                  className="inline-flex items-center transition-colors"
                  style={{
                    background: "white",
                    color: NAVY,
                    border: `1px solid ${BORDER}`,
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "8px 18px",
                    borderRadius: 10,
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  View
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            {/* Mobile layout */}
            <div className="sm:hidden flex flex-col" style={{ gap: 12 }}>
              <div className="flex items-start" style={{ gap: 12 }}>
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
                        borderRadius: 999,
                        whiteSpace: "nowrap",
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
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: NAVY,
                        lineHeight: 1,
                      }}
                    >
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
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: NAVY,
                    }}
                  >
                    {courseTypeLabel(c)} · {transmissionLabel(c.instructor.car_type)}
                  </div>
                  <div
                    className="flex items-center"
                    style={{
                      gap: 6,
                      marginTop: 3,
                      color: TEXT_GREY,
                      fontSize: 12,
                    }}
                  >
                    <CalendarIcon style={{ width: 12, height: 12 }} />
                    Starts {format(c.bookableDate, "EEE d MMM")}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: NAVY,
                    letterSpacing: "-0.02em",
                  }}
                >
                  £{Math.round(final).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between" style={{ gap: 8 }}>
                <div className="flex flex-wrap items-center" style={{ gap: 6 }}>
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
                      }}
                    >
                      <img src={klarnaLogo} alt="Klarna" style={{ height: 11, width: "auto" }} />
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
                      }}
                    >
                      <img src={clearpayLogo} alt="Clearpay" style={{ height: 11, width: "auto" }} />
                      4 × £{clearpayPer}
                    </span>
                  )}
                  {!c.instructor.klarna_enabled && !c.instructor.clearpay_enabled && (
                    <span style={{ fontSize: 11, color: TEXT_GREY }}>£{perHour}/hr</span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(c);
                  }}
                  className="inline-flex items-center"
                  style={{
                    background: "white",
                    color: NAVY,
                    border: `1px solid ${BORDER}`,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "7px 14px",
                    borderRadius: 10,
                    gap: 4,
                  }}
                >
                  View
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            <style>{`
              .ed-course-card:hover { border-color: ${NAVY} !important; }
            `}</style>
          </div>
        );
      })}
    </div>
  );
}
