import { useParams, Link } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useCourseDiscovery } from "@/hooks/useCourseDiscovery";
import { SidebarCalendar } from "@/components/courses/SidebarCalendar";
import { CourseGrid } from "@/components/courses/CourseGrid";

interface MiniWebsiteCoursesProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteCourses({ subdomainSlug }: MiniWebsiteCoursesProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const { page, instructor, loading: pageLoading, notFound } = useWebsitePage(slug, "services");
  const links = useMiniWebsiteLinks(slug);

  // Use the same course discovery hook as the main Drive365 site, filtered to this instructor
  const {
    sortBy,
    setSortBy,
    userLocation,
    loading: coursesLoading,
    selectedMonth,
    setSelectedMonth,
    selectedDate,
    setSelectedDate,
    monthOptions,
    availableDatesInMonth,
    filteredCourses,
  } = useCourseDiscovery("all", instructor?.id ?? null);

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
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const primaryColor = instructor.brand_colour || "#1e3a5f";

  return (
    <MiniWebsiteLayout instructor={instructor}>
      {/* Hero */}
      <section className="py-12 sm:py-16" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-5xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Find Your Perfect Course
            </h1>
            <p className="text-lg text-white/90">
              Browse available courses and check availability
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                <MapPin className="h-4 w-4 mr-1" /> {instructor.home_postcode}
              </Badge>
              {instructor.car_type && (
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  {instructor.car_type}
                </Badge>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Two Column Layout: Calendar + Courses — same as Drive365 */}
      <section className="max-w-6xl mx-auto px-4 py-8 pb-24">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Column: Calendar */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-20 space-y-6">
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

          {/* Right Column: Course Tiles — exact same component as Drive365 */}
          <div className="flex-1">
            <CourseGrid
              selectedDate={selectedDate}
              filteredCourses={filteredCourses.map(c => ({
                ...c,
                instructor: {
                  ...c.instructor,
                  home_address: instructor.coverage_area || "Winchester",
                  home_postcode: instructor.coverage_area || "Winchester",
                },
              }))}
              sortBy={sortBy}
              setSortBy={setSortBy}
              userLocation={userLocation}
            />
          </div>
        </div>
      </section>
    </MiniWebsiteLayout>
  );
}
