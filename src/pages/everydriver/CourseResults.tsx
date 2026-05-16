import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCourseDiscovery, type CourseTypeFilter } from "@/hooks/useCourseDiscovery";
import { CourseSearchHeader } from "@/components/courses/CourseSearchHeader";
import { SidebarCalendar } from "@/components/courses/SidebarCalendar";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { Button } from "@/components/ui/button";

interface CourseResultsProps {
  defaultType?: CourseTypeFilter;
  title?: string;
  showTypeSwitcher?: boolean;
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

  return (
    <MainLayout>
      <CourseSearchHeader
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
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-20">
              <SidebarCalendar
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedDate={selectedDate}
                availableDates={availableDatesInMonth}
                onSelectDate={setSelectedDate}
                loading={loading}
                monthOptions={monthOptions}
              />
            </div>
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
    </MainLayout>
  );
}
