import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";

interface TableCourse {
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

interface CourseTableListProps {
  courses: TableCourse[];
}

// Category bar colour by course length
const HOURS_COLOR: Record<number, string> = {
  10: "#caee1f",
  20: "#1d4ed8",
  28: "#d92e3a", // Test in a Week
  30: "#d92e3a",
  40: "#6b46c1",
  50: "#0a1936",
};

function colorForHours(h: number) {
  return HOURS_COLOR[h] || "#0a1936";
}

function transmissionLabel(carType?: string | null) {
  if (!carType) return "Manual";
  if (carType === "automatic") return "Automatic";
  if (carType === "both") return "Manual & Auto";
  return "Manual";
}

function courseTypeLabel(c: TableCourse) {
  if (c.isIntensive) return "Intensive";
  if (c.hours >= 30) return "Intensive";
  if (c.hours >= 20) return "Semi-intensive";
  return "Weekly";
}

export function CourseTableList({ courses }: CourseTableListProps) {
  const navigate = useNavigate();

  const goTo = (c: TableCourse) => {
    const dateParam = c.bookableDate ? `&date=${format(c.bookableDate, "yyyy-MM-dd")}` : "";
    navigate(`/book/${c.instructor.id}?hours=${c.hours}${dateParam}`);
  };

  return (
    <div
      className="overflow-hidden rounded-[10px] border bg-white"
      style={{ borderColor: "#e8e8ee" }}
    >
      {/* Column headers — desktop only */}
      <div
        className="hidden sm:grid items-center"
        style={{
          gridTemplateColumns: "90px 1fr 130px 220px 100px",
          gap: "16px",
          padding: "10px 18px",
          background: "#fafaf7",
          borderBottom: "1px solid #e8e8ee",
        }}
      >
        {["Course", "Details", "Instructor", "Pay options", "Price"].map((h) => (
          <div
            key={h}
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#7a7a7a",
              textTransform: "uppercase",
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div>
        {courses.map((c, i) => {
          const final = c.discountedPrice && c.discountedPrice < c.price ? c.discountedPrice : c.price;
          const klarnaPer = (final / 3).toFixed(0);
          const clearpayPer = (final / 4).toFixed(0);
          const last = i === courses.length - 1;

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
              className="cursor-pointer transition-colors"
              style={{
                borderBottom: last ? "none" : "1px solid #f0f0f3",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fafaf7")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Desktop row */}
              <div
                className="hidden sm:grid items-center"
                style={{
                  gridTemplateColumns: "90px 1fr 130px 220px 100px",
                  gap: "16px",
                  padding: "12px 18px",
                }}
              >
                {/* Col 1 — Course */}
                <div className="flex items-center gap-2.5">
                  <div
                    style={{
                      width: 6,
                      height: 36,
                      borderRadius: 3,
                      background: colorForHours(c.hours),
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#0a1936",
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                      }}
                    >
                      {c.hours}
                      <span style={{ fontSize: 10, color: "#7a7a7a", marginLeft: 2, fontWeight: 700 }}>hr</span>
                    </div>
                    {c.isPopular && (
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#d92e3a",
                          letterSpacing: "0.1em",
                          marginTop: 3,
                        }}
                      >
                        POPULAR
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 2 — Details */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0a1936",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {courseTypeLabel(c)} · {transmissionLabel(c.instructor.car_type)}
                  </div>
                  <div style={{ fontSize: 11, color: "#7a7a7a", marginTop: 2 }}>
                    {c.instructor.name ? `${c.instructor.name} · ` : ""}Starts {format(c.bookableDate, "EEE d MMM")}
                  </div>
                </div>

                {/* Col 3 — Instructor */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0a1936",
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.instructor.name || "Instructor"}
                  </div>
                  <div style={{ fontSize: 11, color: "#7a7a7a", marginTop: 2 }}>
                    {typeof c.distance === "number" ? `${c.distance.toFixed(1)} mi` : "—"}
                  </div>
                </div>

                {/* Col 4 — Pay options */}
                <div className="flex flex-wrap gap-1.5">
                  {c.instructor.klarna_enabled && (
                    <span
                      style={{
                        background: "#ffa8cd",
                        color: "#0a0a0a",
                        padding: "3px 7px",
                        borderRadius: 4,
                        fontSize: 10,
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
                        padding: "3px 7px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ fontWeight: 800, letterSpacing: "-0.03em" }}>Clearpay</span>{" "}
                      4×£{clearpayPer}
                    </span>
                  )}
                  {!c.instructor.klarna_enabled && !c.instructor.clearpay_enabled && (
                    <span style={{ fontSize: 11, color: "#9aa0aa" }}>Pay in full</span>
                  )}
                </div>

                {/* Col 5 — Price */}
                <div className="flex flex-col items-end gap-1.5">
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#0a1936",
                      letterSpacing: "-0.015em",
                      lineHeight: 1,
                    }}
                  >
                    £{Math.round(final).toLocaleString()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(c);
                    }}
                    style={{
                      background: "#d92e3a",
                      color: "white",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "6px 10px",
                      borderRadius: 6,
                      lineHeight: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    View
                    <ChevronRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>

              {/* Mobile row — 2-row card */}
              <div className="sm:hidden p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div
                    style={{
                      width: 6,
                      height: 36,
                      borderRadius: 3,
                      background: colorForHours(c.hours),
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#0a1936", letterSpacing: "-0.02em" }}>
                        {c.hours}
                        <span style={{ fontSize: 10, color: "#7a7a7a", marginLeft: 2, fontWeight: 700 }}>hr</span>
                      </span>
                      {c.isPopular && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#d92e3a", letterSpacing: "0.1em" }}>
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0a1936", marginTop: 2 }}>
                      {courseTypeLabel(c)} · {transmissionLabel(c.instructor.car_type)}
                    </div>
                    <div style={{ fontSize: 11, color: "#7a7a7a", marginTop: 1 }}>
                      {c.instructor.name ? `${c.instructor.name} · ` : ""}Starts {format(c.bookableDate, "EEE d MMM")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0a1936" }}>
                      {c.instructor.name || "Instructor"}
                    </div>
                    <div style={{ fontSize: 11, color: "#7a7a7a" }}>
                      {typeof c.distance === "number" ? `${c.distance.toFixed(1)} mi` : "—"}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {c.instructor.klarna_enabled && (
                        <span style={{ background: "#ffa8cd", color: "#0a0a0a", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          <span style={{ fontWeight: 800 }}>Klarna</span> 3×£{klarnaPer}
                        </span>
                      )}
                      {c.instructor.clearpay_enabled && (
                        <span style={{ background: "#b2fce4", color: "#0a0a0a", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          <span style={{ fontWeight: 800 }}>Clearpay</span> 4×£{clearpayPer}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0a1936", letterSpacing: "-0.015em" }}>
                      £{Math.round(final).toLocaleString()}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goTo(c);
                      }}
                      style={{
                        background: "#d92e3a",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      View
                      <ChevronRight style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
