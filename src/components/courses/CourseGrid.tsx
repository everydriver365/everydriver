import { useCallback, useState } from "react";

import { format } from "date-fns";
import { Calendar as CalendarIcon, PoundSterling, Navigation, MapPin, X, ChevronDown, Clock, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicCourseCard } from "@/components/DynamicCourseCard";
import { EDCourseList } from "@/components/everydriver/EDCourseList";

import { CourseWithInstructor, SortOption } from "@/hooks/useCourseDiscovery";
import { useIsMobile } from "@/hooks/use-mobile";
interface CourseGridProps {
  selectedDate: Date | null;
  filteredCourses: CourseWithInstructor[];
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  userLocation: { lat: number; lng: number } | null;
  searchedPostcode?: string | null;
  searchedAreaName?: string | null;
  onClearSearch?: () => void;
}

export function CourseGrid({
  selectedDate,
  filteredCourses,
  sortBy,
  setSortBy,
  userLocation,
  searchedPostcode,
  searchedAreaName,
  onClearSearch,
}: CourseGridProps) {
  const isMobile = useIsMobile();
  const [mobileVisibleCount, setMobileVisibleCount] = useState(6);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleLoadMore = useCallback(() => {
    setMobileVisibleCount(prev => Math.min(prev + 6, filteredCourses.length));
  }, [filteredCourses.length]);


  // Note: we intentionally do NOT gate on selectedDate. Courses load
  // immediately for the soonest available date; the calendar filters.



  // Build location display string
  const locationDisplay = searchedPostcode 
    ? searchedAreaName 
      ? `${searchedPostcode}, ${searchedAreaName}`
      : searchedPostcode
    : null;

  return (
    <>
      {/* Results header — Drive 365 list skin */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#0070C0]">
            Driving courses near
          </div>
          <h2 className="mt-1 text-[22px] font-extrabold text-[#0A0E27] tracking-[-0.5px] leading-tight">
            {searchedAreaName || searchedPostcode || (selectedDate ? format(selectedDate, "EEEE, d MMMM") : "Available courses")}
            {(searchedAreaName || searchedPostcode) && (
              <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
                {searchedAreaName && searchedPostcode ? searchedPostcode : ""}
              </span>
            )}
            {locationDisplay && onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="ml-3 inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-semibold text-[#6B7280] align-middle hover:bg-[#F3F4F6]"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </h2>
        </div>


        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={sortBy === "soonest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("soonest")}
            className="h-8 gap-1.5 rounded-md border-[#E5E7EB] text-[11px] font-semibold text-[#4B5563]"
          >
            <Clock className="h-3.5 w-3.5" />
            Soonest
          </Button>
          <Button
            variant={sortBy === "price-low" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("price-low")}
            className="h-8 gap-1.5 rounded-md border-[#E5E7EB] text-[11px] font-semibold text-[#4B5563]"
          >
            <PoundSterling className="h-3.5 w-3.5" />
            Cheapest
          </Button>
          <Button
            variant={sortBy === "nearest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("nearest")}
            className="h-8 gap-1.5 rounded-md border-[#E5E7EB] text-[11px] font-semibold text-[#4B5563]"
            disabled={!userLocation}
          >
            <Navigation className="h-3.5 w-3.5" />
            Nearest
          </Button>

          <div className="ml-2 inline-flex overflow-hidden rounded-md border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                viewMode === "list"
                  ? "bg-[#0A2B6B] text-white"
                  : "bg-white text-[#6B7280] hover:bg-[#F8FAFF]"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                viewMode === "grid"
                  ? "bg-[#0A2B6B] text-white"
                  : "bg-white text-[#6B7280] hover:bg-[#F8FAFF]"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Day heading */}
      <div className="mb-3.5">
        <div className="text-[15px] font-bold text-[#0A0E27] leading-tight">
          {format(selectedDate, "EEEE, d MMMM")}
        </div>
        <div className="mt-1 text-xs text-[#9CA3AF]">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} available
        </div>
      </div>


      {filteredCourses.length === 0 ? (
        <div className="py-16 text-center">
          <h2 className="text-xl font-semibold">No courses available</h2>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your filters or selecting a different date.
          </p>
        </div>
      ) : viewMode === "list" ? (
        <EDCourseList
          courses={(isMobile ? filteredCourses.slice(0, mobileVisibleCount) : filteredCourses).map((c) => ({
            instructor: c.instructor,
            hours: c.hours,
            bookableDate: c.bookableDate,
            isPopular: c.isPopular,
            isIntensive: c.isIntensive,
            distance: c.distance,
            discountedPrice: c.discountedPrice,
            areaName: searchedAreaName ?? null,
          }))}
        />
      ) : isMobile ? (
        <div className="flex flex-col gap-4">
          {filteredCourses.slice(0, mobileVisibleCount).map((course) => (
            <div
              key={`${course.instructor.id}-${course.hours}-${course.bookableDate.toISOString()}`}
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
            </div>
          ))}
          {mobileVisibleCount < filteredCourses.length && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                className="w-full gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                Load More ({filteredCourses.length - mobileVisibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredCourses.slice(0, 6).map((course) => (
            <div
              key={`${course.instructor.id}-${course.hours}-${course.bookableDate.toISOString()}`}
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
            </div>
          ))}
        </div>
      )}

      {filteredCourses.length > 6 && (
        <div className="mt-6 text-center">
          <Button variant="outline" size="lg">
            Show all {filteredCourses.length} courses
          </Button>
        </div>
      )}
    </>
  );
}
