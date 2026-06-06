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

type StaticReview = {
  id: string;
  name: string;
  location: string;
  dateLabel: string;
  passedFirstTime: boolean;
  text: string;
};

const FALLBACK_REVIEWS: StaticReview[] = [
  {
    id: "fb-1",
    name: "Chris",
    location: "Winchester",
    dateLabel: "Jan 2026",
    passedFirstTime: true,
    text: "Passed first attempt with only 2 minors. Ken's teaching is high class — he really listens to your needs.",
  },
  {
    id: "fb-2",
    name: "Michael R.",
    location: "Southampton",
    dateLabel: "Dec 2025",
    passedFirstTime: true,
    text: "Sarah helped me overcome my fear of roundabouts and I passed first time. Highly recommend!",
  },
  {
    id: "fb-3",
    name: "Lucy H.",
    location: "London",
    dateLabel: "Nov 2025",
    passedFirstTime: false,
    text: "Patient, professional and explains things clearly. Best decision I made was choosing Sarah as my instructor.",
  },
];

const CARD_THEMES = [
  { bg: "#FFF8F4", border: "0.5px solid #f9c49a" },
  { bg: "#EEF4FB", border: "0.5px solid #bfd4ee" },
  { bg: "#EAF3DE", border: "0.5px solid #c0dd97" },
];

function formatMonthYear(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

const FONT = "'Poppins', system-ui, sans-serif";

const styles = {
  section: {
    background: "#F3F4F6",
    padding: "48px 5%",
    width: "100%",
    fontFamily: FONT,
  } as React.CSSProperties,
  inner: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
  } as React.CSSProperties,
  header: {
    marginBottom: 20,
  } as React.CSSProperties,
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    color: "#D12E2E",
    textTransform: "uppercase" as const,
    letterSpacing: "1.5px",
    marginBottom: 6,
    fontFamily: FONT,
  },
  heading: {
    fontSize: 20,
    fontWeight: 500,
    color: "#0A1936",
    margin: 0,
    fontFamily: FONT,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  } as React.CSSProperties,
  card: {
    borderRadius: 12,
    padding: "1rem",
    display: "flex",
    flexDirection: "column" as const,
    fontFamily: FONT,
  },
  stars: {
    color: "#f59e0b",
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 10,
  },
  quote: {
    fontStyle: "italic" as const,
    fontSize: 13,
    color: "#374151",
    lineHeight: 1.6,
    flex: 1,
    margin: 0,
    marginBottom: 14,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: 500,
    color: "#0A1936",
  },
  reviewerMeta: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  pill: {
    background: "#EDFAF3",
    color: "#1A7D4E",
    border: "0.5px solid #9de0c0",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
    padding: "3px 10px",
    whiteSpace: "nowrap" as const,
  },
};

function ReviewCard({
  theme,
  text,
  name,
  location,
  dateLabel,
  passedFirstTime,
}: {
  theme: { bg: string; border: string };
  text: string;
  name: string;
  location: string | null;
  dateLabel: string;
  passedFirstTime: boolean;
}) {
  const metaParts = [location, dateLabel].filter(Boolean);
  return (
    <div style={{ ...styles.card, background: theme.bg, border: theme.border }}>
      <div style={styles.stars}>★★★★★</div>
      <p style={styles.quote}>{text}</p>
      <div style={styles.footer}>
        <div>
          <div style={styles.reviewerName}>{name}</div>
          {metaParts.length > 0 && (
            <div style={styles.reviewerMeta}>{metaParts.join(" · ")}</div>
          )}
        </div>
        {passedFirstTime && <div style={styles.pill}>✓ Passed 1st time</div>}
      </div>
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

  if (reviews === null) return null;

  const useFallback = reviews.length === 0;

  return (
    <section style={styles.section}>
      <div style={styles.inner}>
        <div style={styles.header}>
          <div style={styles.eyebrow}>What our pupils say</div>
          <h2 style={styles.heading}>Real reviews. Real results.</h2>
        </div>

        <div style={styles.grid}>
          {useFallback
            ? FALLBACK_REVIEWS.map((r, i) => (
                <ReviewCard
                  key={r.id}
                  theme={CARD_THEMES[i % 3]}
                  text={r.text}
                  name={r.name}
                  location={r.location}
                  dateLabel={r.dateLabel}
                  passedFirstTime={r.passedFirstTime}
                />
              ))
            : reviews.map((r, i) => (
                <ReviewCard
                  key={r.id}
                  theme={CARD_THEMES[i % 3]}
                  text={r.review_text}
                  name={r.reviewer_name}
                  location={r.reviewer_location}
                  dateLabel={formatMonthYear(r.review_date)}
                  passedFirstTime={r.passed_first_time === true}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
