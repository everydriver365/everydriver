import { useState } from "react";
import { motion } from "framer-motion";
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

  const handleLoadMore = () => {
    setMobileVisibleCount(prev => Math.min(prev + 6, filteredCourses.length));
  };

  if (!selectedDate) {
    return (
      <div className="flex h-full items-center justify-center py-16">
        <div className="text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Select a date to see available courses</h2>
          <p className="mt-2 text-muted-foreground">
            Choose an available date from the calendar
          </p>
        </div>
      </div>
    );
  }

  // Build location display string
  const locationDisplay = searchedPostcode 
    ? searchedAreaName 
      ? `${searchedPostcode}, ${searchedAreaName}`
      : searchedPostcode
    : null;

  return (
    <>
      {/* Location header if searched */}
      {locationDisplay && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between rounded-xl border-2 border-emerald-500/30 bg-emerald-500/20 px-5 py-4 shadow-md"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, delay: 0.3, times: [0, 0.5, 1] }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
            >
              <MapPin className="h-5 w-5" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Showing results for</p>
              <h2 className="text-xl font-bold text-foreground">
                {locationDisplay}
              </h2>
            </div>
          </div>
          {onClearSearch && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearSearch}
              className="gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </motion.div>
      )}

      {/* Selected date header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            {format(selectedDate, "EEEE, d MMMM")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Sort + view toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Sort:</span>
          <Button
            variant={sortBy === "soonest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("soonest")}
            className="gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            Soonest
          </Button>
          <Button
            variant={sortBy === "price-low" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("price-low")}
            className="gap-1.5"
          >
            <PoundSterling className="h-3.5 w-3.5" />
            Cheapest
          </Button>
          <Button
            variant={sortBy === "nearest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("nearest")}
            className="gap-1.5"
            disabled={!userLocation}
          >
            <Navigation className="h-3.5 w-3.5" />
            Nearest
          </Button>

          <div className="ml-2 inline-flex rounded-md border bg-card p-0.5">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 gap-1.5 px-2"
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 gap-1.5 px-2"
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        isMobile ? (
          // Mobile: same flip cards as desktop, single column with load more
          <div className="flex flex-col gap-4">
            {filteredCourses.slice(0, mobileVisibleCount).map((course, index) => (
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
            {mobileVisibleCount < filteredCourses.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  className="w-full gap-2"
                >
                  <ChevronDown className="h-4 w-4" />
                  Load More ({filteredCourses.length - mobileVisibleCount} remaining)
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          // Desktop: 2-column grid with flip cards
          <div className="grid gap-6 sm:grid-cols-2">
            {filteredCourses.slice(0, 6).map((course, index) => (
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
        )
      ) : (
        <div className="py-16 text-center">
          <h2 className="text-xl font-semibold">No courses available</h2>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your filters or selecting a different date.
          </p>
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
