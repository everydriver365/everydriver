import { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Search, MapPin, Filter, ChevronDown, PoundSterling, Navigation,
  Loader2, Calendar as CalendarIcon, X,
} from "lucide-react";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { MiniWebsiteCourseCard } from "@/components/mini-website/MiniWebsiteCourseCard";
import { MobileCourseCard } from "@/components/courses/MobileCourseCard";
import { SidebarCalendar } from "@/components/courses/SidebarCalendar";
import { useCourseDiscovery } from "@/hooks/useCourseDiscovery";
import { useIsMobile } from "@/hooks/use-mobile";

interface MiniWebsiteCoursesProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteCourses({ subdomainSlug }: MiniWebsiteCoursesProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const [searchParams] = useSearchParams();
  const initialPostcode = searchParams.get("postcode") || "";
  const initialHours = searchParams.get("hours") ? Number(searchParams.get("hours")) : null;
  const initialDate = searchParams.get("date") || "";
  const { page, instructor, loading: pageLoading, notFound } = useWebsitePage(slug, "services");
  const links = useMiniWebsiteLinks(slug);
  const isMobile = useIsMobile();
  const autoSearchedRef = useRef(false);
  const autoDateSetRef = useRef(false);

  const {
    postcode,
    setPostcode,
    radius,
    setRadius,
    transmission,
    setTransmission,
    sortBy,
    setSortBy,
    userLocation,
    loading: coursesLoading,
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
  } = useCourseDiscovery("all", instructor?.id ?? null, initialPostcode);

  // Auto-search when arriving with a postcode param
  useEffect(() => {
    if (initialPostcode && instructor?.id && !autoSearchedRef.current && !coursesLoading) {
      autoSearchedRef.current = true;
      handleSearch();
    }
  }, [initialPostcode, instructor?.id, coursesLoading]);

  const [showFilters, setShowFilters] = useState(false);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(6);

  const handleLoadMore = () => {
    setMobileVisibleCount(prev => Math.min(prev + 6, filteredCourses.length));
  };

  // Override location display for specific instructors
  const overriddenCourses = filteredCourses.map(c => ({
    ...c,
    instructor: {
      ...c.instructor,
      home_address: "Winchester",
      home_postcode: "Winchester",
    },
  }));

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !instructor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <Link to={`/i/${slug}`}>
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const STYLE_OVERRIDES: Record<string, { primaryColor?: string }> = {
    "ken-d": { primaryColor: "#142040" },
  };
  const primaryColor = STYLE_OVERRIDES[slug]?.primaryColor || instructor.brand_colour || "#1e3a5f";

  return (
    <MiniWebsiteLayout instructor={instructor} pageTitle="Courses" pageDescription={`Browse and book driving courses with ${instructor.business_name || instructor.name}. Intensive and weekly courses available.`} metaTitle={page?.meta_title} metaDescription={page?.meta_description}>
      {/* Search Header — identical to Drive365 */}
      <section className="border-b py-8" style={{ backgroundColor: '#e9f4f9' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl"
          >
            <h1 className="mb-6 text-2xl font-bold md:text-3xl" style={{ color: primaryColor }}>
              {searchedAreaName ? `Courses in ${searchedAreaName}` : "Find a Course"}
            </h1>

            <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-md sm:flex-row sm:items-center">
              <PostcodeAutocomplete
                value={postcode}
                onChange={setPostcode}
                placeholder="Enter your postcode"
                className="flex-1"
                inputClassName="h-11 border bg-background"
              />
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="h-11 rounded-lg border bg-background px-4 text-foreground"
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="15">15 miles</option>
                <option value="25">25 miles</option>
                <option value="35">35 miles</option>
                <option value="50">50 miles</option>
              </select>
              <Button variant="accent" size="lg" className="h-11" onClick={() => handleSearch()} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </div>

            {/* More Filters Button - Desktop only */}
            {!isMobile && (
              <div className="mt-4 flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  More Filters
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </Button>
              </div>
            )}

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-4 grid gap-4 rounded-xl border bg-card p-4 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-3'}`}
              >
                <div>
                  <label className="mb-2 block text-sm font-medium">Transmission</label>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-2"
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </select>
                </div>
                {!isMobile && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Price Range</label>
                    <select className="w-full rounded-lg border bg-background px-3 py-2">
                      <option>Any price</option>
                      <option>Under £500</option>
                      <option>£500-£1000</option>
                      <option>Over £1000</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium">Course Type</label>
                  <select className="w-full rounded-lg border bg-background px-3 py-2">
                    <option>All courses</option>
                    <option>10 Hours</option>
                    <option>20 Hours</option>
                    <option>30 Hours</option>
                    <option>40 Hours</option>
                    <option>Test in a Week</option>
                  </select>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Two Column Layout: Calendar + Courses */}
      <section className="container py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Column: Calendar */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              <SidebarCalendar
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedDate={selectedDate}
                availableDates={availableDatesInMonth}
                onSelectDate={setSelectedDate}
                loading={coursesLoading}
                monthOptions={monthOptions}
              />

              {/* Contact CTA */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Need help choosing a course?
                  </p>
                  <Link to={links.contact}>
                    <Button variant="outline" className="w-full">
                      Contact {instructor.name.split(" ")[0]}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Course Tiles — identical to Drive365 */}
          <div className="flex-1">
            {/* Location display with clear button */}
            {searchedPostcode && (
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
                      {searchedPostcode}{searchedAreaName ? `, ${searchedAreaName}` : ''}
                    </h2>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSearch}
                  className="gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </motion.div>
            )}

            {!selectedDate ? (
              <div className="flex h-full items-center justify-center py-16">
                <div className="text-center">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold">Select a date to see available courses</h2>
                  <p className="mt-2 text-muted-foreground">
                    Choose an available date from the calendar
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-foreground`}>
                        {format(selectedDate, "EEEE, d MMMM")}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {overriddenCourses.length} course{overriddenCourses.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </div>

                  {/* Filters — compact horizontal scroll on mobile */}
                  {isMobile ? (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
                      {/* Transmission chips */}
                      {[
                        { value: "all", label: "All" },
                        { value: "manual", label: "Manual" },
                        { value: "automatic", label: "Auto" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTransmission(option.value)}
                          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold border transition-all active:scale-95 touch-manipulation ${
                            transmission === option.value
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-card text-foreground border-border"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}

                      {/* Divider */}
                      <div className="shrink-0 w-px bg-border my-1" />

                      {/* Sort chips */}
                      {[
                        { value: "soonest", label: "Soonest", icon: CalendarIcon, disabled: false },
                        { value: "nearest", label: "Nearest", icon: Navigation, disabled: !userLocation },
                        { value: "price-low", label: "Price ↓", icon: PoundSterling, disabled: false },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => !option.disabled && setSortBy(option.value as any)}
                          disabled={option.disabled}
                          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold border transition-all active:scale-95 touch-manipulation ${
                            sortBy === option.value
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-card text-foreground border-border"
                          } ${option.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          <option.icon className="h-3 w-3" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Desktop: existing pill groups */
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center rounded-full bg-muted p-1 gap-0.5">
                        {[
                          { value: "all", label: "All" },
                          { value: "manual", label: "Manual" },
                          { value: "automatic", label: "Automatic" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setTransmission(option.value)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                              transmission === option.value
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center rounded-full bg-muted p-1 gap-0.5">
                        <button
                          onClick={() => setSortBy("soonest")}
                          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                            sortBy === "soonest"
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />Soonest
                        </button>
                        <button
                          onClick={() => setSortBy("nearest")}
                          disabled={!userLocation}
                          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                            sortBy === "nearest"
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          } ${!userLocation ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          <Navigation className="h-3.5 w-3.5" />Nearest
                        </button>
                        <button
                          onClick={() => setSortBy("price-low")}
                          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                            sortBy === "price-low"
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <PoundSterling className="h-3.5 w-3.5" />Price
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {overriddenCourses.length > 0 ? (
                  isMobile ? (
                    <div className="flex flex-col gap-3">
                      {overriddenCourses.slice(0, mobileVisibleCount).map((course, index) => (
                        <MobileCourseCard
                          key={`${course.instructor.id}-${course.hours}-${course.bookableDate.toISOString()}`}
                          course={{
                            instructor: course.instructor,
                            hours: course.hours,
                            bookableDate: course.bookableDate,
                            courseImageUrl: course.courseImageUrl,
                            isPopular: course.isPopular,
                            distance: course.distance,
                            isIntensive: course.isIntensive,
                            discountedPrice: course.discountedPrice,
                            customFeatures: course.customFeatures,
                            isPremium: course.isPremium,
                            placementType: course.placementType,
                          }}
                          index={index}
                        />
                      ))}
                      {mobileVisibleCount < overriddenCourses.length && (
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
                            Load More ({overriddenCourses.length - mobileVisibleCount} remaining)
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {overriddenCourses.slice(0, 6).map((course, index) => (
                        <motion.div
                          key={`${course.instructor.id}-${course.hours}-${course.bookableDate.toISOString()}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <MiniWebsiteCourseCard
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
                            primaryColor={primaryColor}
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
              </>
            )}
          </div>
        </div>
      </section>
    </MiniWebsiteLayout>
  );
}
