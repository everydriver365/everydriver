import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CourseCardHeroVariant } from "@/components/courses/variants/CourseCardHeroVariant";
import { CourseCardSplitVariant } from "@/components/courses/variants/CourseCardSplitVariant";
import { CourseCardInstructorVariant } from "@/components/courses/variants/CourseCardInstructorVariant";
import type { DemoCourse, DemoInstructor } from "@/components/courses/variants/types";

const DEMO_INSTRUCTOR_IDS = [
  "7fe3197d-e57b-4383-877b-6c04bc24420c", // Sarah Mitchell — has reviews
  "1b49d152-1088-4587-8f80-b325ba41c1af", // Richard Chapman
  "c9843b58-6edb-4b97-8238-65d725e30aea", // Ken D
];

function useDemoData() {
  return useQuery({
    queryKey: ["course-cards-demo", DEMO_INSTRUCTOR_IDS],
    queryFn: async () => {
      const [{ data: instructors, error: iErr }, { data: courses, error: cErr }] = await Promise.all([
        supabase
          .from("public_instructors" as any)
          .select("id, name, profile_image_url, brand_colour, home_postcode, car_type, hourly_rate")
          .in("id", DEMO_INSTRUCTOR_IDS),
        supabase
          .from("instructor_courses")
          .select("id, instructor_id, course_name, course_hours, flat_price, discounted_price, is_intensive, offer_active, available_from")
          .in("instructor_id", DEMO_INSTRUCTOR_IDS)
          .eq("is_active", true)
          .order("course_hours"),
      ]);
      if (iErr) throw iErr;
      if (cErr) throw cErr;
      const byId = new Map<string, { instructor: DemoInstructor; courses: DemoCourse[] }>();
      for (const i of (instructors ?? []) as any[]) {
        byId.set(i.id, { instructor: i as DemoInstructor, courses: [] });
      }
      for (const c of (courses ?? []) as any[]) {
        const bucket = byId.get(c.instructor_id);
        if (bucket) bucket.courses.push(c as DemoCourse);
      }
      return Array.from(byId.values()).filter((b) => b.courses.length > 0);
    },
  });
}

export default function CourseCardsDemo() {
  const { data, isLoading, error } = useDemoData();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-foreground">Course Card — Direction Demo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Three instructor-forward layouts side-by-side using live data (ratings, Verified Pro, review snippets).
            Pick one and I'll roll it out to /courses, mini-websites, chat cards and featured courses.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading && <p className="text-muted-foreground">Loading instructors…</p>}
        {error && <p className="text-destructive">Failed to load: {(error as Error).message}</p>}
        {data && data.length === 0 && (
          <p className="text-muted-foreground">No demo instructors found in the database.</p>
        )}

        {data && data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Variant A */}
            <section className="space-y-4">
              <VariantHeader letter="A" title="Instructor Hero Header" desc="Brand-coloured top band, big avatar, ratings + review under name. Course details compact at bottom. One card per course." />
              {data.map(({ instructor, courses }) =>
                courses.slice(0, 2).map((c) => (
                  <CourseCardHeroVariant key={`${instructor.id}-${c.id}`} instructor={instructor} course={c} />
                ))
              )}
            </section>

            {/* Variant B */}
            <section className="space-y-4">
              <VariantHeader letter="B" title="Split Rail" desc="Left rail = instructor (avatar, rating, review). Right = course + price + Book. Horizontal, one card per course." />
              {data.map(({ instructor, courses }) =>
                courses.slice(0, 2).map((c) => (
                  <CourseCardSplitVariant key={`${instructor.id}-${c.id}`} instructor={instructor} course={c} />
                ))
              )}
            </section>

            {/* Variant C */}
            <section className="space-y-4">
              <VariantHeader letter="C" title="One Card Per Instructor" desc="Instructor-first profile card with selectable hour chips for every visible course. Dedupes the feed." />
              {data.map(({ instructor, courses }) => (
                <CourseCardInstructorVariant key={instructor.id} instructor={instructor} courses={courses} />
              ))}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function VariantHeader({ letter, title, desc }: { letter: string; title: string; desc: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold">
          {letter}
        </span>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">{desc}</p>
    </div>
  );
}
