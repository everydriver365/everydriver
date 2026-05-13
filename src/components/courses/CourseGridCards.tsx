import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, MapPin, User, Heart, ChevronRight } from "lucide-react";
import { useState } from "react";

interface GridCourse {
  instructor: {
    id: string;
    name?: string | null;
    car_type?: string | null;
    klarna_enabled?: boolean | null;
    clearpay_enabled?: boolean | null;
    rating?: number | null;
    home_postcode?: string | null;
  };
  hours: number;
  bookableDate: Date;
  isPopular?: boolean;
  isIntensive?: boolean;
  distance?: number;
  price: number;
  discountedPrice?: number | null;
  areaName?: string | null;
}

interface CourseGridCardsProps {
  courses: GridCourse[];
}

// Gradient by course length — cycles back to lime past 50h
const HOURS_GRADIENT: Record<number, string> = {
  10: "linear-gradient(135deg, #caee1f 0%, #8fb40c 100%)",
  20: "linear-gradient(135deg, #5b9bd5 0%, #1d4ed8 100%)",
  28: "linear-gradient(135deg, #f4a3b8 0%, #d92e3a 100%)",
  30: "linear-gradient(135deg, #f4a3b8 0%, #d92e3a 100%)",
  40: "linear-gradient(135deg, #a78bfa 0%, #6b46c1 100%)",
};

function gradientForHours(h: number) {
  if (HOURS_GRADIENT[h]) return HOURS_GRADIENT[h];
  // Cycle back to lime for 50+
  return HOURS_GRADIENT[10];
}

// Whether the gradient background is "dark" (white text needed)
function isDarkGradient(h: number) {
  return h === 20 || h === 28 || h === 30 || h === 40;
}

function transmissionLabel(carType?: string | null) {
  if (!carType) return "Manual";
  if (carType === "automatic") return "Automatic";
  if (carType === "both") return "Manual & Auto";
  return "Manual";
}

function courseTypeLabel(c: GridCourse): "Intensive" | "Semi-intensive" | "Lessons" {
  if (c.isIntensive) return "Intensive";
  if (c.hours >= 30) return "Intensive";
  if (c.hours >= 20) return "Semi-intensive";
  return "Lessons";
}

function CourseCarSvg({ hours }: { hours: number }) {
  const isRed = hours === 28 || hours === 30;
  const isBlue = hours === 20;
  const lFill = isRed ? "#0a1936" : "#d92e3a";
  const bodyFill = isBlue ? "#ffffff" : "#1a1a22";
  const wheelOuter = isBlue ? "#1a1a22" : "#0a0a10";
  return (
    <svg
      viewBox="0 0 400 160"
      style={{ position: "absolute", bottom: 0, right: -30, width: 340, height: 140, pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20,110 Q20,80 50,72 L100,60 Q130,50 180,50 L260,50 Q300,52 314,80 L322,110 L322,130 L20,130 Z"
        fill={bodyFill}
      />
      <rect x="30" y="128" width="290" height="10" fill={wheelOuter} />
      <circle cx="80" cy="132" r="20" fill={wheelOuter} />
      <circle cx="80" cy="132" r="13" fill="#3a3a44" />
      <circle cx="270" cy="132" r="20" fill={wheelOuter} />
      <circle cx="270" cy="132" r="13" fill="#3a3a44" />
      <rect x="90" y="60" width="140" height="36" fill="#bce4ff" opacity="0.8" />
      <rect x="170" y="92" width="28" height="28" fill="#ffffff" stroke="#1f2a3a" strokeWidth="1.5" />
      <text x="184" y="115" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight={900} fill={lFill}>
        L
      </text>
    </svg>
  );
}

const typePillStyle = (type: ReturnType<typeof courseTypeLabel>) => {
  if (type === "Intensive") return { background: "#e8efe5", color: "#1a4a2e" };
  if (type === "Semi-intensive") return { background: "#e8e8f5", color: "#3a2a8a" };
  return { background: "#e0e8f5", color: "#1a3a8a" };
};

const transPillStyle = (label: string) => {
  if (label.startsWith("Automatic")) return { background: "#e8e8f5", color: "#3a2a8a" };
  return { background: "#f0f0f3", color: "#0a1936" };
};

export function CourseGridCards({ courses }: CourseGridCardsProps) {
  const navigate = useNavigate();
  const [favs, setFavs] = useState<Record<string, boolean>>({});

  const goTo = (c: GridCourse) => {
    const dateParam = c.bookableDate ? `&date=${format(c.bookableDate, "yyyy-MM-dd")}` : "";
    navigate(`/book/${c.instructor.id}?hours=${c.hours}${dateParam}`);
  };

  return (
    <div
      className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
      style={{ alignItems: "start" }}
    >
      {courses.map((c) => {
        const final = c.discountedPrice && c.discountedPrice < c.price ? c.discountedPrice : c.price;
        const showDiscount = c.discountedPrice && c.discountedPrice < c.price;
        const klarnaPer = Math.round(final / 3);
        const clearpayPer = Math.round(final / 4);
        const type = courseTypeLabel(c);
        const trans = transmissionLabel(c.instructor.car_type);
        const dark = isDarkGradient(c.hours);
        const headerText = dark ? "#ffffff" : "#0a1936";
        const key = `${c.instructor.id}-${c.hours}-${c.bookableDate.toISOString()}`;
        const isFav = !!favs[key];

        return (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => goTo(c)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goTo(c);
              }
            }}
            className="group cursor-pointer"
            style={{
              background: "#ffffff",
              borderRadius: 14,
              border: "1px solid #e8e8ee",
              boxShadow: "0 1px 2px rgba(10,25,54,0.04)",
              overflow: "hidden",
              transition: "transform 200ms ease, box-shadow 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,25,54,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(10,25,54,0.04)";
            }}
          >
            {/* Visual header */}
            <div
              className="relative overflow-hidden"
              style={{
                height: 160,
                background: gradientForHours(c.hours),
              }}
            >
              {/* Radial highlight overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle at top right, rgba(255,255,255,0.3) 0%, transparent 60%)",
                  pointerEvents: "none",
                }}
              />
              {/* Car illustration */}
              <CourseCarSvg hours={c.hours} />

              {/* Top-left badges */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  display: "flex",
                  gap: 5,
                  zIndex: 2,
                }}
              >
                {c.isPopular && (
                  <span
                    style={{
                      background: "#d92e3a",
                      color: "#ffffff",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      padding: "3px 8px",
                      borderRadius: 4,
                    }}
                  >
                    POPULAR
                  </span>
                )}
                {showDiscount && (
                  <span
                    style={{
                      background: "rgba(10,25,54,0.85)",
                      color: "#ffffff",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      padding: "3px 8px",
                      borderRadius: 4,
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    SAVE £{Math.round((c.price - (c.discountedPrice || 0)))}
                  </span>
                )}
              </div>

              {/* Top-right favourite */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFavs((prev) => ({ ...prev, [key]: !prev[key] }));
                }}
                aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.95)",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  zIndex: 2,
                }}
              >
                <Heart
                  style={{ width: 17, height: 17 }}
                  color={isFav ? "#d92e3a" : "#7a7a7a"}
                  fill={isFav ? "#d92e3a" : "none"}
                />
              </button>

              {/* Bottom-left hours */}
              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  left: 16,
                  color: headerText,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 42,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  {c.hours}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    opacity: 0.85,
                  }}
                >
                  hr
                </span>
              </div>
            </div>

            {/* Content body */}
            <div style={{ padding: "16px 18px 18px" }}>
              {/* Tag pills */}
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                <span
                  style={{
                    ...typePillStyle(type),
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    padding: "3px 8px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                  }}
                >
                  {type}
                </span>
                <span
                  style={{
                    ...transPillStyle(trans),
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    padding: "3px 8px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                  }}
                >
                  {trans}
                </span>
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#0a1936",
                  letterSpacing: "-0.015em",
                  lineHeight: 1.25,
                  marginTop: 0,
                  marginBottom: 10,
                }}
              >
                {c.hours}-hour {type.toLowerCase()} course
              </h3>

              {/* Meta info */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  fontSize: 12,
                  color: "#5a5a66",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar style={{ width: 13, height: 13, color: "#0a1936", flexShrink: 0 }} />
                  <span>
                    Starts{" "}
                    <span style={{ color: "#0a1936", fontWeight: 700 }}>
                      {format(c.bookableDate, "EEE d MMM")}
                    </span>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <User style={{ width: 13, height: 13, color: "#0a1936", flexShrink: 0 }} />
                  <span>
                    With{" "}
                    <span style={{ color: "#0a1936", fontWeight: 700 }}>
                      {c.instructor.name || "Instructor"}
                    </span>
                    {typeof c.instructor.rating === "number" && c.instructor.rating > 0 && (
                      <> · ★ {c.instructor.rating.toFixed(1)}</>
                    )}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin style={{ width: 13, height: 13, color: "#0a1936", flexShrink: 0 }} />
                  <span>
                    {c.areaName || "Local"}
                    {typeof c.distance === "number" && <> · {c.distance.toFixed(1)} mi</>}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid #f0f0f3", paddingTop: 12 }}>
                {/* Price + CTA row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#0a1936",
                          letterSpacing: "-0.02em",
                          lineHeight: 1,
                        }}
                      >
                        £{Math.round(final).toLocaleString()}
                      </span>
                      {showDiscount && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#9aa0aa",
                            textDecoration: "line-through",
                          }}
                        >
                          £{Math.round(c.price).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {(c.instructor.klarna_enabled || c.instructor.clearpay_enabled) && (
                      <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
                        {c.instructor.klarna_enabled && (
                          <span
                            style={{
                              background: "#ffa8cd",
                              color: "#0a0a0a",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 9,
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Klarna</span>{" "}
                            3×£{klarnaPer}
                          </span>
                        )}
                        {c.instructor.clearpay_enabled && (
                          <span
                            style={{
                              background: "#b2fce4",
                              color: "#0a0a0a",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 9,
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ fontWeight: 800, letterSpacing: "-0.03em" }}>Clearpay</span>{" "}
                            4×£{clearpayPer}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(c);
                    }}
                    style={{
                      background: "#d92e3a",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "9px 16px",
                      borderRadius: 8,
                      boxShadow: "0 3px 8px rgba(217,46,58,0.25)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    View
                    <ChevronRight style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
