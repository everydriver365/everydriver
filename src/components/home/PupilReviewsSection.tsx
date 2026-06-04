import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type InstructorRef = { name: string | null } | null;

type ReviewRow = {
  id: string;
  reviewer_name: string;
  review_text: string;
  review_date: string | null;
  reviewer_location: string | null;
  passed_first_time: boolean | null;
  instructor_id: string | null;
  instructors: InstructorRef;
};

type PlaceholderReview = {
  id: string;
  reviewer_name: string;
  review_text: string;
  reviewer_location: string;
  dateLabel: string;
  passed_first_time: boolean;
  instructorName: string;
  passRate: number;
};

const PLACEHOLDERS: PlaceholderReview[] = [
  {
    id: "ph-1",
    reviewer_name: "Sarah M.",
    review_text:
      "I wanted to know who was teaching me before I handed over £1,000. EveryDriver was the only school that let me choose. Passed first time with Ken.",
    reviewer_location: "Winchester",
    dateLabel: "May 2026",
    passed_first_time: true,
    instructorName: "Ken D",
    passRate: 96,
  },
  {
    id: "ph-2",
    reviewer_name: "Jake T.",
    review_text:
      "Other schools just assign you someone. I read Richard's reviews, saw his 94% pass rate and booked straight away. Best decision I made.",
    reviewer_location: "Southampton",
    dateLabel: "April 2026",
    passed_first_time: true,
    instructorName: "Richard Chapman",
    passRate: 94,
  },
  {
    id: "ph-3",
    reviewer_name: "Emma R.",
    review_text:
      "I'd failed twice before with a school that assigned me someone random. Chose my own instructor on EveryDriver and finally passed. Wish I'd found this sooner.",
    reviewer_location: "Eastleigh",
    dateLabel: "March 2026",
    passed_first_time: true,
    instructorName: "Sarah Jones",
    passRate: 91,
  },
];

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMonthYear(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

const styles = {
  section: {
    background: "#F3F4F6",
    padding: "48px 40px",
    width: "100%",
  } as React.CSSProperties,
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 700,
    color: "#E8641A",
    textTransform: "uppercase" as const,
    letterSpacing: "1.5px",
    marginBottom: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0A1628",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  ratingWrap: { display: "flex", alignItems: "center", gap: 8 },
  stars: { color: "#FBBF24", fontSize: 14, letterSpacing: 1 },
  ratingNum: { fontSize: 12, fontWeight: 700, color: "#0A1628" },
  ratingCount: { fontSize: 11, color: "#9CA3AF" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  } as React.CSSProperties,
  card: {
    background: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    border: "1px solid #E5E7EB",
  } as React.CSSProperties,
  cardStars: {
    color: "#FBBF24",
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 12,
    color: "#0A1628",
    lineHeight: 1.6,
    marginBottom: 12,
  },
  cardFooter: {
    borderTop: "1px solid #F3F4F6",
    paddingTop: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reviewerName: { fontSize: 11, fontWeight: 700, color: "#0A1628" },
  reviewerMeta: { fontSize: 10, color: "#9CA3AF", marginTop: 2 },
  badge: {
    background: "#D1FAE5",
    color: "#059669",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    whiteSpace: "nowrap" as const,
  },
  instructorRow: {
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#0A2B6B",
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,
  instructorText: { fontSize: 10, color: "#9CA3AF" },
};

function CardShell({
  text,
  name,
  location,
  dateLabel,
  passedFirstTime,
  instructorName,
  passRate,
}: {
  text: string;
  name: string;
  location: string | null;
  dateLabel: string;
  passedFirstTime: boolean;
  instructorName: string | null;
  passRate: number | null;
}) {
  const metaParts = [location, dateLabel].filter(Boolean);
  return (
    <div style={styles.card}>
      <div style={styles.cardStars}>★★★★★</div>
      <p style={styles.cardText}>{text}</p>
      <div style={styles.cardFooter}>
        <div>
          <div style={styles.reviewerName}>{name}</div>
          {metaParts.length > 0 && (
            <div style={styles.reviewerMeta}>{metaParts.join(" · ")}</div>
          )}
        </div>
        {passedFirstTime && <div style={styles.badge}>✓ Passed 1st time</div>}
      </div>
      {instructorName && (
        <div style={styles.instructorRow}>
          <div style={styles.avatar}>{initialsFor(instructorName)}</div>
          <div style={styles.instructorText}>
            Instructor: {instructorName}
            {typeof passRate === "number" ? ` · ${passRate}% pass rate` : ""}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PupilReviewsSection() {
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("course_reviews")
        .select(
          "id, reviewer_name, review_text, review_date, reviewer_location, passed_first_time, instructor_id, instructors:instructor_id(name)"
        )
        .eq("moderation_status", "approved")
        .eq("is_visible", true)
        .order("review_date", { ascending: false })
        .limit(3);
      if (cancelled) return;
      if (error) {
        setReviews([]);
        return;
      }
      setReviews((data ?? []) as unknown as ReviewRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (reviews === null) {
    // Avoid flash; render nothing until query resolves.
    return null;
  }

  const usePlaceholders = reviews.length === 0;

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>WHAT OUR PUPILS SAY</div>
          <h2 style={styles.heading}>Real reviews. Real results.</h2>
        </div>
        <div style={styles.ratingWrap}>
          <span style={styles.stars}>★★★★★</span>
          <span style={styles.ratingNum}>4.9</span>
          <span style={styles.ratingCount}>2,400+ reviews</span>
        </div>
      </div>

      <div style={styles.grid}>
        {usePlaceholders
          ? PLACEHOLDERS.map((r) => (
              <CardShell
                key={r.id}
                text={r.review_text}
                name={r.reviewer_name}
                location={r.reviewer_location}
                dateLabel={r.dateLabel}
                passedFirstTime={r.passed_first_time}
                instructorName={r.instructorName}
                passRate={r.passRate}
              />
            ))
          : reviews.map((r) => (
              <CardShell
                key={r.id}
                text={r.review_text}
                name={r.reviewer_name}
                location={r.reviewer_location}
                dateLabel={formatMonthYear(r.review_date)}
                passedFirstTime={r.passed_first_time === true}
                instructorName={r.instructors?.name ?? null}
                passRate={null}
              />
            ))}
      </div>
    </section>
  );
}
