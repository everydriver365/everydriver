import { useState } from "react";
import { format } from "date-fns";
import { ShieldCheck, List as ListIcon, LayoutGrid } from "lucide-react";
import { useEmbed } from "@/context/EmbedContext";
import { computeOfferStatus } from "@/lib/courseOffer";

type SortOption = "soonest" | "price-low" | "nearest";

/**
 * Mirror of the fields DynamicCourseCard consumes, so mobile renders the
 * SAME data as the Drive365 desktop course cards. Pricing, discount logic,
 * title, and intensity label MUST match DynamicCourseCard derivations.
 */
interface ChapmansCourse {
  instructor: {
    id: string;
    name?: string | null;
    car_type?: string | null;
    profile_image_url?: string | null;
    home_postcode?: string | null;
    hourly_rate?: number | null;
    school_skim_amount?: number | null;
    klarna_enabled?: boolean | null;
    clearpay_enabled?: boolean | null;
  };
  hours: number;
  bookableDate: Date;
  isIntensive?: boolean;
  distance?: number;
  discountedPrice?: number | null;
  offerActive?: boolean | null;
  offerLabel?: string | null;
  offerPercentOff?: number | null;
  offerStartsAt?: string | null;
  offerEndsAt?: string | null;
  effectiveHourlyRate?: number | null;
  areaName?: string | null;
}

interface Props {
  courses: ChapmansCourse[];
  totalCount: number;
  selectedDate: Date;
  searchedAreaName: string | null;
  viewMode: "list" | "grid";
  setViewMode: (v: "list" | "grid") => void;
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;
  userLocation: { lat: number; lng: number } | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  remainingCount?: number;
}

const HOURS_BAR: Record<number, string> = {
  10: "#059669",
  20: "#0070C0",
  30: "#F59E0B",
  40: "#D12E2E",
};

function barColor(hours: number) {
  return HOURS_BAR[hours] || "#7C3AED";
}

// Match DynamicCourseCard transmission logic.
function transmissionLabel(carType?: string | null) {
  const t = (carType || "").toLowerCase();
  const isAutomatic = t.includes("automatic") || t === "auto";
  const isManual = t.includes("manual");
  if (t === "both" || (isAutomatic && isManual)) return "Auto & Manual";
  if (isAutomatic) return "Automatic";
  return "Manual";
}

// Match DynamicCourseCard course-name logic (no DB lookup — same string).
function courseName(hours: number) {
  return hours === 28 ? "Test in a Week" : `${hours} Hour Course`;
}

// Match DynamicCourseCard intensity badge logic.
function intensityLabel(hours: number, isIntensive?: boolean) {
  if (isIntensive) return "Intensive";
  if (hours >= 30 && hours <= 40) return "Semi-Intensive";
  return null;
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export function ChapmansMobileResults({
  courses,
  totalCount,
  selectedDate,
  searchedAreaName,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  userLocation,
  hasMore,
  onLoadMore,
  remainingCount,
}: Props) {
  const { bookNavigate } = useEmbed();
  const [passPromiseDismissed, setPassPromiseDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("chapmans_pass_promise_dismissed") === "1";
  });

  const dismissPromise = () => {
    setPassPromiseDismissed(true);
    try {
      sessionStorage.setItem("chapmans_pass_promise_dismissed", "1");
    } catch {}
  };

  const goTo = (c: ChapmansCourse) => {
    const dateParam = c.bookableDate ? `&date=${format(c.bookableDate, "yyyy-MM-dd")}` : "";
    bookNavigate(`/book/${c.instructor.id}?hours=${c.hours}${dateParam}`);
  };


  return (
    <div>
      {/* Section 3 — Results header */}
      <div
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0A0E27" }}>
            {format(selectedDate, "EEE d MMM")}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
            {totalCount} course{totalCount !== 1 ? "s" : ""}
            {searchedAreaName ? ` · ${searchedAreaName}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* List/Grid toggle */}
          <div
            style={{
              display: "flex",
              border: "1px solid #E5E7EB",
              borderRadius: 6,
              overflow: "hidden",
              background: "#FFF",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 700,
                border: "none",
                background: viewMode === "list" ? "#0A2B6B" : "transparent",
                color: viewMode === "list" ? "#FFF" : "#9CA3AF",
                cursor: "pointer",
              }}
            >
              <ListIcon size={11} />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: viewMode === "grid" ? 700 : 600,
                border: "none",
                background: viewMode === "grid" ? "#0A2B6B" : "transparent",
                color: viewMode === "grid" ? "#FFF" : "#9CA3AF",
                cursor: "pointer",
              }}
            >
              <LayoutGrid size={11} />
              Grid
            </button>
          </div>

        </div>

      </div>

      {/* Section 4 — Pass Promise strip */}
      {!passPromiseDismissed && (
        <div
          style={{
            margin: "0 16px 10px",
            background: "#0A2B6B",
            borderRadius: 8,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <ShieldCheck size={14} color="#FFF" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#FFF" }}>Pass Promise</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                Re-test free if you don't pass
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissPromise}
            aria-label="Dismiss"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              fontSize: 18,
              cursor: "pointer",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Section 5 — Course list cards */}
      <div
        style={
          viewMode === "grid"
            ? { padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }
            : { padding: "0 16px" }
        }
      >
        {courses.map((c, i) => {
          const isGrid = viewMode === "grid";
          // Mirror DynamicCourseCard pricing exactly.
          const defaultRate = Number(c.instructor.hourly_rate ?? 0);
          const hourlyRate =
            c.effectiveHourlyRate != null && c.effectiveHourlyRate > 0
              ? c.effectiveHourlyRate
              : defaultRate;
          const schoolSkim = Number(c.instructor.school_skim_amount ?? 0);
          const basePrice = c.hours * hourlyRate;
          const totalPrice = basePrice + schoolSkim;
          const offer = computeOfferStatus(totalPrice, {
            offer_active: c.offerActive,
            offer_label: c.offerLabel,
            offer_percent_off: c.offerPercentOff,
            offer_starts_at: c.offerStartsAt,
            offer_ends_at: c.offerEndsAt,
            discounted_price: c.discountedPrice,
          });
          const hasDiscount = offer.isLive;
          const finalPrice = hasDiscount ? offer.finalPrice : totalPrice;
          const intensity = intensityLabel(c.hours, c.isIntensive);
          const titleSuffix = intensity ? ` · ${intensity}` : "";
          const locationBits = [c.areaName, typeof c.distance === "number" ? `${c.distance.toFixed(1)} mi` : null].filter(Boolean);
          return (
            <div
              key={`${c.instructor.id}-${c.hours}-${c.bookableDate.toISOString()}-${i}`}
              onClick={() => goTo(c)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goTo(c);
                }
              }}
              style={{
                background: "#FFF",
                borderRadius: 12,
                border: "0.5px solid #E5E7EB",
                overflow: "hidden",
                marginBottom: isGrid ? 0 : 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "stretch",
              }}
            >
              {/* Coloured left bar */}
              <div
                style={{
                  width: 4,
                  flexShrink: 0,
                  background: barColor(c.hours),
                }}
              />

              {/* Card body */}
              <div style={{ flex: 1, padding: isGrid ? 10 : 12, minWidth: 0 }}>
                {/* Row 1 — course + price */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: isGrid ? "column" : "row",
                    justifyContent: "space-between",
                    alignItems: isGrid ? "flex-start" : "flex-start",
                    marginBottom: 6,
                    gap: isGrid ? 4 : 8,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: isGrid ? 12 : 13,
                        fontWeight: 700,
                        color: "#0A0E27",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.25,
                      }}
                    >
                      {courseName(c.hours)}{titleSuffix} · {transmissionLabel(c.instructor.car_type)}
                    </div>
                    <div style={{ fontSize: isGrid ? 10 : 11, color: "#9CA3AF", marginTop: 2 }}>
                      Starts {format(c.bookableDate, "EEE d MMM")}
                      {!isGrid && locationBits.length > 0 ? ` · ${locationBits.join(" · ")}` : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isGrid ? "row" : "column",
                      alignItems: isGrid ? "baseline" : "flex-end",
                      gap: isGrid ? 6 : 0,
                      flexShrink: 0,
                      marginLeft: isGrid ? 0 : 8,
                    }}
                  >
                    {hasDiscount && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#9CA3AF",
                          textDecoration: "line-through",
                          lineHeight: 1,
                          marginBottom: isGrid ? 0 : 2,
                          order: isGrid ? 2 : 0,
                        }}
                      >
                        £{Math.round(totalPrice).toLocaleString()}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: isGrid ? 16 : 18,
                        fontWeight: 800,
                        color: hasDiscount ? "#059669" : "#0A0E27",
                        letterSpacing: "-0.015em",
                        lineHeight: 1,
                      }}
                    >
                      £{Math.round(finalPrice).toLocaleString()}
                    </div>
                  </div>
                </div>



                {/* Row 2 — instructor */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                    minWidth: 0,
                  }}
                >
                  {c.instructor.profile_image_url ? (
                    <img
                      src={c.instructor.profile_image_url}
                      alt=""
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 9999,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 9999,
                        background: "#1E4D9B",
                        color: "#FFF",
                        fontSize: 9,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(c.instructor.name)}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#0A0E27",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      minWidth: 0,
                    }}
                  >
                    {c.instructor.name || "Instructor"}
                  </div>
                </div>

                {/* Row 3 — payment + CTA */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      flexWrap: "wrap",
                      minWidth: 0,
                    }}
                  >
                    {c.instructor.klarna_enabled && (
                      <span
                        style={{
                          background: "#FFB3C7",
                          borderRadius: 3,
                          padding: "2px 6px",
                          fontFamily: "system-ui, sans-serif",
                          fontSize: 9,
                          fontWeight: 900,
                          color: "#17120F",
                        }}
                      >
                        klarna
                      </span>
                    )}
                    {c.instructor.clearpay_enabled && (
                      <span
                        style={{
                          background: "#B2FCE4",
                          borderRadius: 3,
                          padding: "2px 6px",
                          fontFamily: "system-ui, sans-serif",
                          fontSize: 9,
                          fontWeight: 900,
                          color: "#000E18",
                        }}
                      >
                        clearpay
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>· card · cash</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(c);
                    }}
                    style={{
                      background: "#0070C0",
                      color: "#FFF",
                      border: "none",
                      borderRadius: 7,
                      padding: "7px 16px",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {hasMore && onLoadMore && (
          <button
            type="button"
            onClick={onLoadMore}
            style={{
              width: "100%",
              marginTop: 4,
              padding: "12px 16px",
              background: "#FFF",
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "#0A0E27",
              cursor: "pointer",
            }}
          >
            Load more{typeof remainingCount === "number" ? ` (${remainingCount})` : ""}
          </button>
        )}
        {courses.length === 0 && (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: 13,
            }}
          >
            No courses found. Try widening your radius or picking another date.
          </div>
        )}
      </div>
    </div>
  );
}

