import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { FeaturedCourse } from "@/hooks/useFeaturedCourses";
import heroFallback from "@/assets/hero-driving.jpg";

interface Props {
  courses: FeaturedCourse[];
  loading: boolean;
}

interface InstructorRow {
  id: string;
  name: string;
  profile_image_url: string | null;
  car_type: string | null;
  hourly_rate: number | null;
  home_postcode: string | null;
}

interface RatingRow {
  instructor_id: string;
  avg_rating: number | null;
  total_reviews: number | null;
}

const AVATAR_COLORS = ["#1E4D9B", "#E8641A", "#059669"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function priceFor(c: FeaturedCourse): number | null {
  if (c.discountedPrice != null) return c.discountedPrice;
  if (c.instructor.hourly_rate != null) return Number(c.instructor.hourly_rate) * c.hours;
  return null;
}

function courseTypeLabel(c: FeaturedCourse): string | null {
  if (c.isIntensive) return "⚡ Intensive";
  if (c.hours >= 20) return "Semi-intensive";
  return null;
}

export function FeaturedCoursesAndInstructors({ courses, loading }: Props) {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingRow>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: ratingData } = await supabase
        .from("instructor_rating_summary")
        .select("instructor_id, avg_rating, total_reviews")
        .order("avg_rating", { ascending: false })
        .limit(30);
      const ratingRows = (ratingData ?? []) as RatingRow[];
      const ids = ratingRows.map((r) => r.instructor_id);
      if (ids.length === 0) {
        if (!cancelled) {
          setInstructors([]);
          setRatings({});
        }
        return;
      }
      const { data: insData } = await supabase
        .from("public_instructors")
        .select("id, name, profile_image_url, car_type, hourly_rate, home_postcode")
        .in("id", ids)
        .eq("is_active", true);
      const insRows = (insData ?? []) as InstructorRow[];
      const ratingMap: Record<string, RatingRow> = {};
      ratingRows.forEach((r) => (ratingMap[r.instructor_id] = r));
      // Order by avg_rating desc, keep only top 3 active
      const ordered = ratingRows
        .map((r) => insRows.find((i) => i.id === r.instructor_id))
        .filter((i): i is InstructorRow => Boolean(i))
        .slice(0, 3);
      if (!cancelled) {
        setInstructors(ordered);
        setRatings(ratingMap);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ordered = useMemo(() => {
    if (courses.length === 0) return [];
    const popularFirst = [...courses].sort((a, b) => {
      if (a.isPopular === b.isPopular) return 0;
      return a.isPopular ? -1 : 1;
    });
    return popularFirst;
  }, [courses]);

  const featured = ordered[0];
  const small = ordered.slice(1, 3);

  return (
    <section style={{ background: "#F6F6F8", padding: "32px 5%" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          padding: 20,
        }}
      >
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0A1628", margin: 0 }}>Featured courses</h2>
          <Link to="/courses" style={{ fontSize: 11, fontWeight: 600, color: "#0070C0", textDecoration: "none" }}>
            View all courses →
          </Link>
        </div>

        {loading || !featured ? (
          <div style={{ height: 220, borderRadius: 10, background: "#F3F4F6" }} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: small.length > 0 ? "1.4fr 1fr" : "1fr",
              gap: 10,
            }}
          >
            {/* Large featured card */}
            <FeaturedLargeCard course={featured} onView={() => navigate(`/book/${featured.instructor.id}`)} />

            {/* Right stack */}
            {small.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {small.map((c) => (
                  <FeaturedSmallCard
                    key={`${c.instructor.id}-${c.hours}`}
                    course={c}
                    onView={() => navigate(`/book/${c.instructor.id}`)}
                  />
                ))}
                <button
                  onClick={() => navigate("/courses")}
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#F3F4F6",
                    color: "#0A1628",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  View all courses →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Featured instructors row */}
        {instructors.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0A1628", margin: 0 }}>Choose your instructor</h3>
              <Link to="/courses" style={{ fontSize: 11, fontWeight: 600, color: "#0070C0", textDecoration: "none" }}>
                See all instructors →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {instructors.map((ins, idx) => (
                <InstructorCard
                  key={ins.id}
                  instructor={ins}
                  rating={ratings[ins.id]}
                  accentColor={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                  isTopRated={idx === 0}
                  onView={() => navigate(`/book/${ins.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedLargeCard({ course, onView }: { course: FeaturedCourse; onView: () => void }) {
  const today = isSameDay(course.bookableDate, new Date());
  const price = priceFor(course);
  const title = course.isIntensive
    ? `${course.hours}-Hour Intensive Course`
    : `${course.hours}-Hour Driving Course`;
  return (
    <div
      onClick={onView}
      style={{
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        border: "2px solid #E8641A",
        position: "relative",
      }}
    >
      <div style={{ height: 200, position: "relative", overflow: "hidden" }}>
        <img
          src={course.courseImageUrl || heroFallback}
          alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(10,18,40,0.85))",
          }}
        />
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5 }}>
          {today && (
            <span
              style={{
                background: "#059669",
                color: "#FFFFFF",
                fontSize: 8,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 20,
              }}
            >
              Available today
            </span>
          )}
          {course.isPopular && (
            <span
              style={{
                background: "#E8641A",
                color: "#FFFFFF",
                fontSize: 8,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 20,
              }}
            >
              Most popular
            </span>
          )}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>{title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Avatar
              src={course.instructor.profile_image_url}
              name={course.instructor.name}
              size={26}
              fallbackColor={course.instructor.brand_colour || "#1E4D9B"}
            />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>{course.instructor.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {price != null && (
              <span style={{ fontSize: 22, fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5 }}>
                £{price.toFixed(0)}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              style={{
                background: "#E8641A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 7,
                padding: "8px 16px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              View course →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedSmallCard({ course, onView }: { course: FeaturedCourse; onView: () => void }) {
  const today = isSameDay(course.bookableDate, new Date());
  const price = priceFor(course);
  const typeLabel = courseTypeLabel(course);
  const title = course.isIntensive ? `${course.hours}h Intensive` : `${course.hours}h Course`;
  return (
    <div
      onClick={onView}
      style={{
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        border: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "stretch",
        background: "#FFFFFF",
      }}
    >
      <div style={{ width: 80, flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <img
          src={course.courseImageUrl || heroFallback}
          alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,18,40,0.3)" }} />
      </div>
      <div style={{ flex: 1, padding: 10 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
          {today && (
            <span
              style={{
                background: "#059669",
                color: "#FFFFFF",
                fontSize: 7,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 20,
              }}
            >
              Today
            </span>
          )}
          {typeLabel && (
            <span
              style={{
                background: "#0A2B6B",
                color: "#FFFFFF",
                fontSize: 7,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 20,
              }}
            >
              {typeLabel}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0A1628", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 10, color: "#9CA3AF" }}>{course.instructor.name}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          {price != null ? (
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>£{price.toFixed(0)}</span>
          ) : <span />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            style={{
              background: "#0A1628",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 5,
              padding: "5px 10px",
              fontSize: 9,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            View →
          </button>
        </div>
      </div>
    </div>
  );
}

function InstructorCard({
  instructor,
  rating,
  accentColor,
  isTopRated,
  onView,
}: {
  instructor: InstructorRow;
  rating: RatingRow | undefined;
  accentColor: string;
  isTopRated: boolean;
  onView: () => void;
}) {
  const transmission = instructor.car_type
    ? instructor.car_type.toLowerCase().includes("auto")
      ? "Automatic"
      : "Manual"
    : null;
  return (
    <div
      onClick={onView}
      style={{
        background: isTopRated ? "#FFF7ED" : "#F8FAFF",
        borderRadius: 10,
        padding: 14,
        border: isTopRated ? "2px solid #E8641A" : "1px solid #E5E7EB",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {isTopRated && (
        <span
          style={{
            position: "absolute",
            top: -7,
            right: 10,
            background: "#E8641A",
            color: "#FFFFFF",
            fontSize: 8,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
          }}
        >
          ⭐ Top rated
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Avatar src={instructor.profile_image_url} name={instructor.name} size={40} fallbackColor={accentColor} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0A1628", lineHeight: 1.2 }}>{instructor.name}</div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>
            {instructor.home_postcode || ""}
            {instructor.hourly_rate != null ? ` · £${Number(instructor.hourly_rate).toFixed(0)}/hr` : ""}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        {rating?.avg_rating != null ? (
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>
            ★ {Number(rating.avg_rating).toFixed(1)} ({rating.total_reviews ?? 0})
          </span>
        ) : <span />}
      </div>
      {(transmission || instructor.car_type) && (
        <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
          {transmission && (
            <span
              style={{
                background: "#EFF6FF",
                color: "#0070C0",
                fontSize: 9,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 20,
              }}
            >
              {transmission}
            </span>
          )}
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView();
        }}
        style={{
          width: "100%",
          padding: 7,
          background: isTopRated ? "#E8641A" : "#0A1628",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        View profile
      </button>
    </div>
  );
}

function Avatar({
  src,
  name,
  size,
  fallbackColor,
}: {
  src: string | null;
  name: string;
  size: number;
  fallbackColor: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #FFFFFF",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: fallbackColor,
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        border: "2px solid #FFFFFF",
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}
