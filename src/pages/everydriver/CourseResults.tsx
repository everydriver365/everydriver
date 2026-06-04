import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCourseDiscovery, type CourseTypeFilter } from "@/hooks/useCourseDiscovery";
import { Drive365SearchHeader } from "@/components/courses/Drive365SearchHeader";
import { SidebarCalendar } from "@/components/courses/SidebarCalendar";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { Button } from "@/components/ui/button";
import { EmbedProvider } from "@/context/EmbedContext";
import { SEOHead } from "@/components/SEOHead";

interface CourseResultsProps {
  defaultType?: CourseTypeFilter;
  title?: string;
  showTypeSwitcher?: boolean;
  /**
   * Embeddable, unbranded variant for iframing on third-party sites.
   * Removes MainLayout chrome (Drive365 header/footer), goes transparent,
   * posts iframe height to parent, and breaks booking navigation out of
   * the iframe so payment redirects (Square/Klarna/Clearpay/GoCardless)
   * run on the top-level drive365.co.uk window first-party.
   *
   * Mount example for host pages:
   *   <iframe
   *     src="https://drive365.co.uk/embed/courses"
   *     style="width:100%;border:0;min-height:1200px"
   *     allow="payment *; clipboard-write"
   *     referrerpolicy="no-referrer-when-downgrade"
   *   ></iframe>
   */
  embed?: boolean;
}

/**
 * Unified, single source of truth for the public course-search results page.
 * Replaces the legacy Courses.tsx (1876 lines) and is wired into:
 *   /courses, /search, /drive365/search, /services
 *
 * /intensives and /semi-intensive keep their hero pages but consume the same
 * useCourseDiscovery hook, so every learner-facing surface honours the same
 * availability rules: working hours + overrides + manual blocks + scheduled
 * lessons + Google Calendar busy events + buffer/travel padding.
 */
export default function CourseResults({
  defaultType = "all",
  title = "Find Driving Courses Near You",
  showTypeSwitcher = true,
  embed = false,
}: CourseResultsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPostcode = searchParams.get("postcode") || "";
  const typeFromUrl = (searchParams.get("type") as CourseTypeFilter | null) || defaultType;

  const {
    postcode,
    setPostcode,
    radius,
    setRadius,
    transmission,
    setTransmission,
    loading,
    sortBy,
    setSortBy,
    userLocation,
    isSearching,
    selectedMonth,
    setSelectedMonth,
    selectedDate,
    setSelectedDate,
    monthOptions,
    availableDatesInMonth,
    filteredCourses,
    handleSearch,
    searchedPostcode,
    searchedAreaName,
    clearSearch,
  } = useCourseDiscovery(typeFromUrl, undefined, initialPostcode);

  // Auto-run a search if a postcode came in via URL.
  const autoSearched = useRef(false);
  useEffect(() => {
    if (autoSearched.current) return;
    if (!initialPostcode) return;
    if (loading) return;
    autoSearched.current = true;
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialPostcode]);

  const setType = (next: CourseTypeFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === "all") params.delete("type");
    else params.set("type", next);
    setSearchParams(params, { replace: true });
  };

  const [lessonTimes, setLessonTimes] = useState<"all" | "daytime" | "evenings_weekends">("all");

  const matchInstructors = useMemo(() => {
    const seen = new Map<string, { instructor: typeof filteredCourses[number]["instructor"]; distance?: number; carType: string }>();
    for (const c of filteredCourses) {
      if (!c.instructor || seen.has(c.instructor.id)) continue;
      const ct = (c.instructor.car_type || "").toLowerCase();
      const carType = ct.includes("auto") && !ct.includes("manual") ? "Automatic" : ct.includes("manual") && !ct.includes("auto") ? "Manual" : "Manual & Auto";
      seen.set(c.instructor.id, { instructor: c.instructor, distance: c.distance, carType });
    }
    return Array.from(seen.values()).slice(0, 8);
  }, [filteredCourses]);

  // Embed-mode side effects: transparent backdrop + height reporter for host iframe.
  useEffect(() => {
    if (!embed) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.background;
    const prevBodyBg = body.style.background;
    html.style.background = "transparent";
    body.style.background = "transparent";

    let raf = 0;
    const post = () => {
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      try {
        window.parent?.postMessage({ type: "drive365:embed:height", height: h }, "*");
      } catch { /* ignore */ }
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(post);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    schedule();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      html.style.background = prevHtmlBg;
      body.style.background = prevBodyBg;
    };
  }, [embed]);

  const Shell: React.ElementType = embed ? "div" : MainLayout;

  return (
    <EmbedProvider embed={embed}>
      {embed && <SEOHead title="Find Driving Courses" description="Embeddable course search" noindex />}
      <Shell {...(embed ? { className: "min-h-screen bg-transparent" } : {})}>
      <Drive365SearchHeader
        title={title}
        postcode={postcode}
        setPostcode={setPostcode}
        radius={radius}
        setRadius={setRadius}
        transmission={transmission}
        setTransmission={setTransmission}
        isSearching={isSearching}
        onSearch={handleSearch}
        activeFilter={showTypeSwitcher ? (typeFromUrl as any) : undefined}
        setActiveFilter={showTypeSwitcher ? ((v) => setType((v === "weekly" ? "all" : v) as CourseTypeFilter)) : undefined}
      />

      <section className="container py-8 pb-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-4">
            <SidebarCalendar
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedDate={selectedDate}
              availableDates={availableDatesInMonth}
              onSelectDate={setSelectedDate}
              loading={loading}
              monthOptions={monthOptions}
            />

            {/* Refine results */}
            <div className="hidden lg:block rounded-xl border bg-card p-4 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold">Refine results</h3>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Transmission</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[{ value: "all", label: "Any" }, { value: "manual", label: "Manual" }, { value: "automatic", label: "Auto" }].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTransmission(opt.value)}
                      className={`text-xs h-8 rounded-md border transition-colors ${transmission === opt.value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Lesson times</div>
                <div className="space-y-1.5">
                  {([
                    { value: "all", label: "Anytime" },
                    { value: "daytime", label: "Daytime (08:00–17:00)" },
                    { value: "evenings_weekends", label: "Evenings & weekends" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLessonTimes(opt.value)}
                      className={`w-full text-left text-xs h-8 px-3 rounded-md border transition-colors ${lessonTimes === opt.value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pass Promise */}
            <div
              className="relative overflow-hidden p-4 hidden lg:block"
              style={{ background: "#0F2044", borderRadius: 4 }}
            >
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)" }}
              />
              <div className="relative flex items-center gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
                  style={{ background: "rgba(255,255,255,0.18)" }}
                >
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>Pass Promise</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                    Re-test on us if you don't pass.
                  </div>
                </div>
              </div>
            </div>

            {/* Your Match */}
            {matchInstructors.length > 0 && (
              <div className="hidden lg:block rounded-xl border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a7a]">
                  Your Match
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {matchInstructors.map(({ instructor, distance, carType }) => (
                    <div key={instructor.id} className="flex w-full items-center gap-3 rounded-lg p-2">
                      <div
                        className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2"
                        style={{
                          backgroundColor: "hsl(var(--muted))",
                          borderColor: instructor.brand_colour || "hsl(var(--border))",
                        }}
                      >
                        {instructor.profile_image_url ? (
                          <img src={instructor.profile_image_url} alt={instructor.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                            {instructor.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{instructor.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {carType}{typeof distance === "number" ? ` · ${distance.toFixed(1)} mi` : ""}
                        </div>
                      </div>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: instructor.brand_colour || "#0F2044" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <CourseGrid
              selectedDate={selectedDate}
              filteredCourses={filteredCourses}
              sortBy={sortBy}
              setSortBy={setSortBy}
              userLocation={userLocation}
              searchedPostcode={searchedPostcode}
              searchedAreaName={searchedAreaName}
              onClearSearch={clearSearch}
            />
          </div>
        </div>
      </section>
      </Shell>
    </EmbedProvider>
  );
}
