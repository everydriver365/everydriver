import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { MainLayout } from "@/components/layout/MainLayout";
import { SidebarCalendar } from "@/components/courses/SidebarCalendar";
import { DynamicCourseCard } from "@/components/DynamicCourseCard";
import { MobileCourseCard } from "@/components/courses/MobileCourseCard";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useCourseDiscovery } from "@/hooks/useCourseDiscovery";
import { getWhitelabelConfig } from "@/lib/whitelabel";

/**
 * White-label /courses page.
 *
 * Renders the standard learner course-browsing UX scoped to the single
 * instructor mapped to the current white-label domain. There is no
 * postcode/radius gating — visitors see all of this instructor's
 * availability. The optional postcode field is for distance display only.
 */
export default function WhitelabelCourses() {
  const isMobile = useIsMobile();
  const config = getWhitelabelConfig();
  const slug = config?.instructorSlug ?? null;
  const brand = config?.brandName ?? "Driving School";

  const [instructorId, setInstructorId] = useState<string | null | undefined>(
    undefined,
  );
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(6);

  // Resolve slug → instructor id
  useEffect(() => {
    if (!slug) {
      setInstructorId(null);
      setLookupError("This site is not configured.");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, is_active")
        .eq("app_slug", slug)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setLookupError("Instructor not found.");
        setInstructorId(null);
        return;
      }
      if (!data.is_active) {
        setLookupError("This instructor is currently unavailable.");
        setInstructorId(null);
        return;
      }
      setInstructorId(data.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const {
    loading,
    selectedMonth,
    setSelectedMonth,
    selectedDate,
    setSelectedDate,
    monthOptions,
    availableDatesInMonth,
    filteredCourses,
  } = useCourseDiscovery(
    "all",
    instructorId === undefined ? null : instructorId,
  );

  // If the currently selected month has no availability (e.g. instructor's
  // available_from is in a future month), step forward to the next month
  // that does — so visitors land on real availability instead of an empty
  // calendar. Guarded by lastAdvancedFromRef to prevent loops.
  const lastAdvancedFromRef = useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;
    if (!instructorId) return;
    if (availableDatesInMonth.length > 0) return;
    if (lastAdvancedFromRef.current === selectedMonth) return;

    const idx = monthOptions.findIndex((m) => m.value === selectedMonth);
    if (idx === -1 || idx >= monthOptions.length - 1) return;

    lastAdvancedFromRef.current = selectedMonth;
    setSelectedMonth(monthOptions[idx + 1].value);
    setSelectedDate(null);
  }, [
    loading,
    instructorId,
    availableDatesInMonth,
    selectedMonth,
    monthOptions,
    setSelectedMonth,
    setSelectedDate,
  ]);

  // When availability appears for the current month but no date is picked
  // yet (because we just auto-advanced), select the first available date.
  useEffect(() => {
    if (loading) return;
    if (selectedDate) return;
    if (availableDatesInMonth.length === 0) return;
    setSelectedDate(availableDatesInMonth[0]);
  }, [loading, selectedDate, availableDatesInMonth, setSelectedDate]);

  const coursesWithDistance = filteredCourses;

  const handleLoadMore = () =>
    setMobileVisibleCount((p) => Math.min(p + 6, coursesWithDistance.length));

  const isInitialising = instructorId === undefined;

  return (
    <MainLayout>
      <section className="border-b bg-secondary/30 py-8">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl"
          >
            <h1 className="text-2xl font-bold md:text-3xl">{brand} — Courses</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose an available date below to see courses you can book.
            </p>

          </motion.div>
        </div>
      </section>

      <section className="container py-8">
        {lookupError ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <h2 className="text-lg font-semibold">{lookupError}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please check back soon or get in touch.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <SidebarCalendar
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedDate={selectedDate}
                availableDates={availableDatesInMonth}
                onSelectDate={setSelectedDate}
                loading={isInitialising || loading}
                monthOptions={monthOptions}
              />
            </aside>

            <div>
              {isInitialising || loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !selectedDate ? (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <CalendarIcon className="mb-3 h-10 w-10 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">
                    No upcoming availability
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please check back soon — new dates are added regularly.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold">
                      {format(selectedDate, "EEEE, d MMMM")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {coursesWithDistance.length} course
                      {coursesWithDistance.length !== 1 ? "s" : ""} available
                    </p>
                  </div>

                  {coursesWithDistance.length === 0 ? (
                    <div className="rounded-xl border bg-card p-8 text-center">
                      <h3 className="text-base font-semibold">
                        No courses on this date
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Try selecting another available date in the calendar.
                      </p>
                    </div>
                  ) : isMobile ? (
                    <div className="flex flex-col gap-3">
                      {coursesWithDistance
                        .slice(0, mobileVisibleCount)
                        .map((course, index) => (
                          <MobileCourseCard
                            key={`${course.instructor.id}-${course.hours}-${course.bookableDate.toISOString()}`}
                            course={course}
                            index={index}
                          />
                        ))}
                      {mobileVisibleCount < coursesWithDistance.length && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleLoadMore}
                          className="mt-2 w-full"
                        >
                          Load more (
                          {coursesWithDistance.length - mobileVisibleCount}{" "}
                          remaining)
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {coursesWithDistance.map((course, index) => (
                        <motion.div
                          key={`${course.instructor.id}-${course.hours}-${course.bookableDate.toISOString()}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <DynamicCourseCard
                            instructor={course.instructor}
                            hours={course.hours}
                            nextAvailable={course.bookableDate}
                            courseImageUrl={course.courseImageUrl}
                            isPopular={course.isPopular}
                            availableFrom={course.availableFrom}
                            distance={course.distance}
                            features={course.features}
                            isIntensive={course.isIntensive}
                            discountedPrice={course.discountedPrice}
                            customFeatures={course.customFeatures}
                            isPremium={course.isPremium}
                            placementType={course.placementType}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
