import { MainLayout } from "@/components/layout/MainLayout";
import { Zap, Clock, Calendar, Star } from "lucide-react";
import { useCourseDiscovery } from "@/hooks/useCourseDiscovery";
import { CourseSearchHeader } from "@/components/courses/CourseSearchHeader";
import { SidebarCalendar } from "@/components/courses/SidebarCalendar";
import { CourseGrid } from "@/components/courses/CourseGrid";

export default function Intensives() {
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
  } = useCourseDiscovery("intensive");

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="bg-primary/5 border-b">
        <div className="container py-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Fast Track Your Licence</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Intensive Driving Courses</h1>
            <p className="text-lg text-muted-foreground">
              Pass your driving test in as little as one week with our intensive courses. 
              Perfect for busy schedules or urgent driving needs.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-8 max-w-3xl mx-auto">
            <div className="text-center p-4 bg-card rounded-lg shadow-sm">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Quick Results</h3>
              <p className="text-sm text-muted-foreground">Pass in as little as 5-7 days</p>
            </div>
            <div className="text-center p-4 bg-card rounded-lg shadow-sm">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Flexible Dates</h3>
              <p className="text-sm text-muted-foreground">Start dates to suit your schedule</p>
            </div>
            <div className="text-center p-4 bg-card rounded-lg shadow-sm">
              <Star className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground mb-1">High Pass Rate</h3>
              <p className="text-sm text-muted-foreground">90%+ first-time pass rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Header */}
      <CourseSearchHeader
        title="Find Intensive Courses Near You"
        postcode={postcode}
        setPostcode={setPostcode}
        radius={radius}
        setRadius={setRadius}
        transmission={transmission}
        setTransmission={setTransmission}
        isSearching={isSearching}
        onSearch={handleSearch}
      />

      {/* Two Column Layout: Calendar + Courses */}
      <section className="container py-8 pb-24">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Column: Calendar */}
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

          {/* Right Column: Course Tiles */}
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
