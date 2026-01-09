import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PoundSterling, Navigation, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicCourseCard } from "@/components/DynamicCourseCard";
import { CourseWithInstructor, SortOption } from "@/hooks/useCourseDiscovery";

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
          className="mb-6 flex items-center justify-between rounded-xl border-2 border-primary bg-primary/10 px-5 py-4 shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Showing results for</p>
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
              className="gap-1.5 border-primary/30 hover:bg-primary/10"
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

        {/* Sort buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Sort:</span>
          <Button
            variant={sortBy === "price-low" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("price-low")}
            className="gap-1.5"
          >
            <PoundSterling className="h-3.5 w-3.5" />
            Price
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
        </div>
      </div>

      {filteredCourses.length > 0 ? (
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
              />
            </motion.div>
          ))}
        </div>
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
