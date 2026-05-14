import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import klarnaLogo from "@/assets/klarna-round-logo.svg";
import clearpayLogo from "@/assets/clearpay-round-logo.svg";

// EveryDriver-only redesigned list view for course search results.
// Brand tokens (literal hex per spec — intentionally not using semantic
// tokens because this surface is a one-off whitelabel skin):
//   navy        #0A2B6B    primary text + buttons
//   amber       #F4B83C    "POPULAR" ribbon
//   greys       #6B7280 (text), #E5E7EB (border), #F0F4FB (hour fill)
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
    const edParam =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("everydriver") === "1"
        ? "&everydriver=1"
        : "";
    navigate(`/book/${c.instructor.id}?hours=${c.hours}${dateParam}${edParam}`);
  };

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
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
              borderRadius: 12,
              padding: 16,
            }}
          >
            {/* Desktop layout: 70px | 1fr | auto, 16px gap */}
            <div
              className="hidden sm:grid items-center"
              style={{
                gridTemplateColumns: "70px 1fr auto",
                gap: 16,
              }}
            >
              {/* Hours block */}
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
                      letterSpacing: "0.08em",
                      padding: "2px 8px",
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
                    width: 70,
                    height: 70,
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: NAVY,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {c.hours}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
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
                    fontSize: 15,
                    fontWeight: 700,
                    color: NAVY,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {courseTypeLabel(c)} · {transmissionLabel(c.instructor.car_type)}
                </div>
                <div
                  className="flex items-center"
                  style={{ gap: 6, marginTop: 4, color: TEXT_GREY, fontSize: 12 }}
                >
                  <CalendarIcon style={{ width: 12, height: 12 }} />
                  Starts {format(c.bookableDate, "EEE d MMM")}
                </div>

                {/* Payment chips */}
                {(c.instructor.klarna_enabled || c.instructor.clearpay_enabled) && (
                  <div
                    className="flex flex-wrap items-center"
                    style={{ gap: 6, marginTop: 8 }}
                  >
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
                        <img
                          src={klarnaLogo}
                          alt="Klarna"
                          style={{ height: 14, width: 14 }}
                        />
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
                        <img
                          src={clearpayLogo}
                          alt="Clearpay"
                          style={{ height: 14, width: 14 }}
                        />
                        4 × £{clearpayPer}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Price + action */}
              <div className="flex flex-col items-end" style={{ gap: 2 }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: NAVY,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  £{Math.round(final).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: TEXT_GREY }}>
                  £{perHour}/hr
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(c);
                  }}
                  className="ed-view-btn inline-flex items-center transition-colors"
                  style={{
                    background: NAVY,
                    color: "white",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: 8,
                    gap: 4,
                    marginTop: 8,
                  }}
                >
                  View
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            {/* Mobile layout (single column stack) */}
            <div className="sm:hidden flex flex-col" style={{ gap: 10 }}>
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
                  <div style={{ fontSize: 11, color: TEXT_GREY, marginTop: 2 }}>
                    £{perHour}/hr
                  </div>
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
                  className="ed-view-btn inline-flex items-center"
                  style={{
                    background: NAVY,
                    color: "white",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: 8,
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
              .ed-view-btn:hover { background: #082354 !important; }
            `}</style>
          </div>
        );
      })}
    </div>
  );
}
