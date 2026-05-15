import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { SidebarCalendar } from "@/components/courses/SidebarCalendar";
import { DynamicCourseCard } from "@/components/DynamicCourseCard";
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
  const [availableFrom, setAvailableFrom] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [instructorName, setInstructorName] = useState<string>("");
  const [mobileVisibleCount, setMobileVisibleCount] = useState(6);
  const [didJumpToAvailableFrom, setDidJumpToAvailableFrom] = useState(false);

  // Resolve slug → instructor id (via RPC so we can detect "hidden" too)
  useEffect(() => {
    if (!slug) {
      setInstructorId(null);
      setLookupError("This site is not configured.");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .rpc("get_whitelabel_instructor_status", { p_slug: slug })
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setLookupError("Instructor not found.");
        setInstructorId(null);
        return;
      }
      setInstructorName(data.name ?? "");
      if (!data.is_active) {
        // Hidden by the instructor — show a friendly "bookings paused" state.
        setPaused(true);
        setInstructorId(null);
        return;
      }
      setInstructorId(data.id);
      setAvailableFrom(data.available_from ?? null);
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
    nextAvailableDates,
    filteredCourses,
  } = useCourseDiscovery(
    "all",
    instructorId === undefined ? null : instructorId,
  );

  // If the instructor has a future available_from, open the calendar on that month.
  useEffect(() => {
    if (didJumpToAvailableFrom || !availableFrom) return;
    const fromDate = new Date(availableFrom);
    if (isNaN(fromDate.getTime())) return;
    if (fromDate.getTime() <= Date.now()) {
      setDidJumpToAvailableFrom(true);
      return;
    }
    const targetMonth = format(fromDate, "yyyy-MM");
    if (targetMonth !== selectedMonth) {
      setSelectedMonth(targetMonth);
    }
    setDidJumpToAvailableFrom(true);
  }, [availableFrom, didJumpToAvailableFrom, selectedMonth, setSelectedMonth]);

  const handlePickDate = (d: Date) => {
    const targetMonth = format(d, "yyyy-MM");
    if (targetMonth !== selectedMonth) setSelectedMonth(targetMonth);
    setSelectedDate(d);
  };


  const coursesWithDistance = filteredCourses;

  const handleLoadMore = () =>
    setMobileVisibleCount((p) => Math.min(p + 6, coursesWithDistance.length));

  const isInitialising = instructorId === undefined;

  // Inject Course/ItemList JSON-LD for the visible course set (whitelabel SEO).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "wl-courses-jsonld";
    const existing = document.getElementById(id);
    if (paused || coursesWithDistance.length === 0) {
      if (existing) existing.remove();
      return;
    }
    // Provider URL must be the canonical branded host (not www / preview origin)
    // so Google attributes the schema to the right business.
    const canonicalOrigin = config?.host
      ? `https://${config.host}`
      : (typeof window !== "undefined" ? window.location.origin : "");
    const coursesUrl = `${canonicalOrigin}/courses`;

    // Build a PostalAddress from the whitelabel config when available.
    const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\b/i;
    const rawAddress = config?.address?.trim() || "";
    const postcodeMatch = rawAddress.match(UK_POSTCODE_RE);
    const postalCode = postcodeMatch ? postcodeMatch[0].toUpperCase() : undefined;
    const addressNoPc = rawAddress.replace(UK_POSTCODE_RE, "").trim().replace(/,\s*$/, "");
    const addressParts = addressNoPc.split(",").map((s) => s.trim()).filter(Boolean);
    const addressLocality = addressParts.length > 0 ? addressParts[addressParts.length - 1] : undefined;
    const streetAddress = addressParts.length > 1 ? addressParts.slice(0, -1).join(", ") : undefined;
    const postalAddress = (postalCode || addressLocality || streetAddress)
      ? {
          "@type": "PostalAddress",
          addressCountry: "GB",
          ...(streetAddress && { streetAddress }),
          ...(addressLocality && { addressLocality }),
          ...(postalCode && { postalCode }),
        }
      : undefined;

    const provider = {
      "@type": "DrivingSchool",
      "@id": `${canonicalOrigin}/#drivingschool`,
      name: brand,
      url: `${canonicalOrigin}/`,
      ...(config?.logoPath && {
        logo: /^https?:\/\//i.test(config.logoPath)
          ? config.logoPath
          : `${canonicalOrigin}${config.logoPath.startsWith("/") ? "" : "/"}${config.logoPath}`,
      }),
      ...(config?.phone && { telephone: config.phone }),
      ...(config?.email && { email: config.email }),
      ...(postalAddress && { address: postalAddress }),
      ...(addressLocality && { areaServed: { "@type": "City", name: addressLocality } }),
    };

    const items = coursesWithDistance.slice(0, 20).map((c, i) => {
      const skim = (c.instructor as { school_skim_amount?: number }).school_skim_amount || 0;
      const hourly = (c.instructor as { hourly_rate?: number }).hourly_rate || 0;
      const basePrice = hourly * c.hours;
      const price = c.discountedPrice || (basePrice ? basePrice + skim : 0);
      const startIso = c.bookableDate?.toISOString?.() ?? undefined;
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Course",
          name: `${c.hours}-hour ${c.isIntensive ? "intensive " : ""}driving course with ${brand}`,
          description: `${c.hours} hours of in-car driving tuition with ${brand}${c.isIntensive ? " delivered as an intensive course" : ""}.`,
          url: coursesUrl,
          provider,
          timeRequired: `PT${c.hours}H`,
          educationalCredentialAwarded: "DVSA driving test preparation",
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "onsite",
            courseWorkload: `PT${c.hours}H`,
            ...(postalAddress && { location: postalAddress }),
            startDate: startIso,
            ...(price > 0 && {
              offers: {
                "@type": "Offer",
                price: price.toFixed(2),
                priceCurrency: "GBP",
                availability: "https://schema.org/InStock",
                url: coursesUrl,
                ...(startIso && { validFrom: startIso }),
              },
            }),
          },
          ...(price > 0 && {
            offers: {
              "@type": "Offer",
              price: price.toFixed(2),
              priceCurrency: "GBP",
              availability: "https://schema.org/InStock",
              url: coursesUrl,
            },
          }),
        },
      };
    });
    const payload = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: items,
    };
    let script = existing as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(JSON.parse(JSON.stringify(payload)));
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [coursesWithDistance, paused, brand, config]);


  return (
    <MainLayout>
      <SEOHead
        title={paused ? "Bookings paused" : "Driving Lessons & Intensive Courses"}
        description={
          paused
            ? `${instructorName || brand} is not currently accepting new bookings.`
            : `Browse available driving lessons and intensive courses with ${brand}. Pick a date to see what's bookable.`
        }
        noindex={paused}
      />
      <section className="container py-8">
        {paused ? (
          <div className="rounded-xl border bg-card p-8 text-center max-w-xl mx-auto">
            <div
              className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: `${config?.brandColour || "#1e3a5f"}1a`, color: config?.brandColour || "#1e3a5f" }}
            >
              <CalendarIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">Bookings paused</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {instructorName || brand} is not currently accepting new bookings. Please check back soon.
            </p>
          </div>
        ) : lookupError ? (
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
              ) : !selectedDate || availableDatesInMonth.length === 0 ? (
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <CalendarIcon className="mt-0.5 h-6 w-6 text-muted-foreground" />
                    <div>
                      <h2 className="text-lg font-semibold">
                        {nextAvailableDates.length > 0
                          ? "Next available dates"
                          : "No upcoming availability"}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {availableFrom
                          ? `${brand} is taking bookings from ${format(new Date(availableFrom), "d MMMM yyyy")}.`
                          : nextAvailableDates.length > 0
                            ? "Tap a date to see courses you can book."
                            : "Please check back soon."}
                      </p>
                    </div>
                  </div>
                  {nextAvailableDates.length > 0 && (
                    <>
                      {format(nextAvailableDates[0], "yyyy-MM") !== selectedMonth && (
                        <Button
                          onClick={() => handlePickDate(nextAvailableDates[0])}
                          className="mb-3 w-full"
                        >
                          Jump to {format(nextAvailableDates[0], "MMMM yyyy")}
                        </Button>
                      )}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {nextAvailableDates.slice(0, 9).map((d) => (
                          <button
                            key={d.toISOString()}
                            onClick={() => handlePickDate(d)}
                            className="rounded-lg border bg-background px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/40"
                          >
                            <div className="text-xs text-muted-foreground">
                              {format(d, "EEE")}
                            </div>
                            <div>{format(d, "d MMM")}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
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
                    <div className="flex flex-col gap-4">
                      {coursesWithDistance
                        .slice(0, mobileVisibleCount)
                        .map((course, index) => (
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
                  offerActive={course.offerActive}
                  offerLabel={course.offerLabel}
                  offerPercentOff={course.offerPercentOff}
                  offerStartsAt={course.offerStartsAt}
                  offerEndsAt={course.offerEndsAt}
                              customFeatures={course.customFeatures}
                              isPremium={course.isPremium}
                              placementType={course.placementType}
                            />
                          </motion.div>
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
                  offerActive={course.offerActive}
                  offerLabel={course.offerLabel}
                  offerPercentOff={course.offerPercentOff}
                  offerStartsAt={course.offerStartsAt}
                  offerEndsAt={course.offerEndsAt}
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
