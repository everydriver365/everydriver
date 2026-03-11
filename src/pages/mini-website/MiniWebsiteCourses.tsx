import { useParams, Link } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useMiniWebsiteLinks } from "@/hooks/useMiniWebsiteLinks";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isSameDay, isAfter, isBefore, startOfDay, parseISO } from "date-fns";
import { DynamicCourseCard } from "@/components/DynamicCourseCard";
import { MobileCourseCard } from "@/components/courses/MobileCourseCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface Course {
  id: string;
  course_name: string;
  course_hours: number;
  discounted_price: number | null;
  course_image_url: string | null;
  custom_features: string[] | null;
  is_active: boolean;
}

interface CourseTemplate {
  course_hours: number;
  course_name: string;
  default_image_url: string | null;
  is_popular: boolean | null;
  features: string[] | null;
  is_intensive: boolean | null;
}

interface WorkingHours {
  instructor_id: string;
  day_of_week: number;
  is_active: boolean;
}

interface DateOverride {
  instructor_id: string;
  override_date: string;
  override_end_date: string | null;
  is_available: boolean;
}

interface MiniWebsiteCoursesProps {
  subdomainSlug?: string | null;
}

function getMonthOptions(): { value: string; label: string }[] {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const month = addMonths(now, i);
    options.push({
      value: format(month, "yyyy-MM"),
      label: format(month, "MMMM yyyy"),
    });
  }
  return options;
}

export default function MiniWebsiteCourses({ subdomainSlug }: MiniWebsiteCoursesProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "services");
  const links = useMiniWebsiteLinks(slug);
  const isMobile = useIsMobile();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHours, setSelectedHours] = useState<string>("all");
  const [dataLoading, setDataLoading] = useState(true);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  useEffect(() => {
    if (instructor?.id) {
      setDataLoading(true);
      Promise.all([
        supabase
          .from("instructor_courses")
          .select("*")
          .eq("instructor_id", instructor.id)
          .eq("is_active", true),
        supabase
          .from("course_templates")
          .select("*")
          .eq("is_active", true),
        supabase
          .from("instructor_working_hours")
          .select("*")
          .eq("instructor_id", instructor.id),
        supabase
          .from("instructor_date_overrides")
          .select("*")
          .eq("instructor_id", instructor.id),
      ]).then(([coursesRes, templatesRes, workingRes, overridesRes]) => {
        if (coursesRes.data) setCourses(coursesRes.data);
        if (templatesRes.data) setCourseTemplates(templatesRes.data);
        if (workingRes.data) setWorkingHours(workingRes.data);
        if (overridesRes.data) setDateOverrides(overridesRes.data);
        setDataLoading(false);
      });
    }
  }, [instructor?.id]);

  // Check if instructor is available on a given date
  const isDateAvailable = (day: Date) => {
    if (!instructor) return false;
    const today = startOfDay(new Date());
    if (isBefore(day, today)) return false;

    // Check available_from
    if (instructor.available_from && isAfter(parseISO(instructor.available_from), day)) {
      return false;
    }

    const dayOfWeek = getDay(day);
    const dateStr = format(day, "yyyy-MM-dd");

    // Check date overrides first
    const override = dateOverrides.find(
      (o) =>
        o.instructor_id === instructor.id &&
        (o.override_date === dateStr ||
          (o.override_end_date &&
            dateStr >= o.override_date &&
            dateStr <= o.override_end_date))
    );
    if (override) return override.is_available;

    // Check working hours
    return workingHours.some(
      (wh) =>
        wh.instructor_id === instructor.id &&
        wh.day_of_week === dayOfWeek &&
        wh.is_active
    );
  };

  // Get available dates for the selected month
  const availableDatesInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const today = startOfDay(new Date());

    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return allDays.filter((day) => !isBefore(day, today) && isDateAvailable(day));
  }, [selectedMonth, instructor, workingHours, dateOverrides]);

  // Calendar days for display
  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const startDay = getDay(monthStart);
    const today = startOfDay(new Date());

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const paddedDays: (Date | null)[] = Array(startDay).fill(null);
    days.forEach((day) => paddedDays.push(day));

    while (paddedDays.length % 7 !== 0) {
      paddedDays.push(null);
    }

    return paddedDays.map((day) => ({
      date: day,
      isAvailable: day ? availableDatesInMonth.some((d) => isSameDay(d, day)) : false,
      isPast: day ? isBefore(day, today) : false,
    }));
  }, [selectedMonth, availableDatesInMonth]);

  // Filtered courses based on selected hours
  const filteredCourses = useMemo(() => {
    if (selectedHours === "all") return courses;
    const hours = parseInt(selectedHours);
    return courses.filter((c) => c.course_hours === hours);
  }, [courses, selectedHours]);

  // Get template data for a course
  const getTemplateForCourse = (courseHours: number) => {
    return courseTemplates.find((t) => t.course_hours === courseHours);
  };

  // Calculate price for a course
  const getCoursePrice = (course: Course) => {
    if (course.discounted_price) return course.discounted_price;
    if (instructor?.hourly_rate) {
      return instructor.hourly_rate * course.course_hours;
    }
    return null;
  };

  // Unique course hours for filter
  const availableHours = useMemo(() => {
    const hours = [...new Set(courses.map((c) => c.course_hours))].sort((a, b) => a - b);
    return hours;
  }, [courses]);

  const currentMonthIndex = monthOptions.findIndex((m) => m.value === selectedMonth);
  const [year, month] = selectedMonth.split("-").map(Number);
  const monthLabel = format(new Date(year, month - 1), "MMMM yyyy");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !instructor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
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
  const secondaryColor = instructor.secondary_colour || "#d4a574";

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
              Browse available intensive courses and check my availability
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

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Calendar & Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Course Hours Filter */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Course Duration</h3>
                <Select value={selectedHours} onValueChange={setSelectedHours}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All durations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All durations</SelectItem>
                    {availableHours.map((h) => (
                      <SelectItem key={h} value={h.toString()}>
                        {h} hours
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">
                  <CalendarIcon className="inline-block h-4 w-4 mr-2" />
                  Availability
                </h3>

                {/* Month Navigation */}
                <div className="mb-4 flex items-center justify-between">
                  <button
                    onClick={() => currentMonthIndex > 0 && setSelectedMonth(monthOptions[currentMonthIndex - 1].value)}
                    disabled={currentMonthIndex === 0}
                    className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-semibold">{monthLabel}</span>
                  <button
                    onClick={() => currentMonthIndex < monthOptions.length - 1 && setSelectedMonth(monthOptions[currentMonthIndex + 1].value)}
                    disabled={currentMonthIndex >= monthOptions.length - 1}
                    className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {dataLoading ? (
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div key={i} className="h-9 w-full animate-pulse rounded-md bg-muted" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Weekday headers */}
                    <div className="mb-1 grid grid-cols-7 gap-1">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, index) => {
                        if (!day.date) {
                          return <div key={`empty-${index}`} className="h-9" />;
                        }

                        const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                        const isToday = isSameDay(day.date, startOfDay(new Date()));

                        return (
                          <button
                            key={day.date.toISOString()}
                            onClick={() => day.isAvailable && setSelectedDate(day.date!)}
                            disabled={!day.isAvailable || day.isPast}
                            className={`relative flex h-9 items-center justify-center rounded-md text-sm font-medium transition-all ${
                              isSelected
                                ? "text-white shadow-md"
                                : day.isAvailable
                                  ? "bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 dark:text-emerald-400"
                                  : day.isPast
                                    ? "text-muted-foreground/30 cursor-not-allowed"
                                    : "text-muted-foreground/50 cursor-not-allowed"
                            } ${isToday && !isSelected ? "ring-1 ring-primary/40" : ""}`}
                            style={isSelected ? { backgroundColor: primaryColor } : undefined}
                          >
                            {format(day.date, "d")}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground border-t pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-emerald-500/20" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded" style={{ backgroundColor: primaryColor }} />
                    <span>Selected</span>
                  </div>
                </div>

                {selectedDate && (
                  <div className="mt-4 p-3 bg-muted rounded-lg text-center">
                    <p className="text-sm font-medium">
                      Selected: {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact CTA */}
            <Card style={{ backgroundColor: "#e9f4f9" }}>
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

          {/* Main - Course Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: primaryColor }}>
                Available Courses
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} available
              </span>
            </div>

            {dataLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredCourses.map((course) => {
                  const template = getTemplateForCourse(course.course_hours);
                  const price = getCoursePrice(course);
                  const features = course.custom_features || template?.features || [];
                  const imageUrl = course.course_image_url || template?.default_image_url;

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                        {imageUrl && (
                          <div className="relative">
                            <img
                              src={imageUrl}
                              alt={course.course_name}
                              className="w-full h-40 object-cover"
                            />
                            {template?.is_popular && (
                              <Badge className="absolute top-2 right-2 bg-amber-500 text-white border-0">
                                <Star className="h-3 w-3 mr-1 fill-current" /> Popular
                              </Badge>
                            )}
                          </div>
                        )}
                        <CardContent className="p-5 flex-1 flex flex-col">
                          <h3 className="font-semibold text-lg mb-2">{course.course_name}</h3>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {course.course_hours} hours
                            </span>
                            {price && (
                              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                                £{price}
                              </span>
                            )}
                          </div>

                          {features.length > 0 && (
                            <ul className="space-y-2 mb-4 flex-1">
                              {features.slice(0, 3).map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                  <CheckCircle2
                                    className="h-4 w-4 mt-0.5 flex-shrink-0"
                                    style={{ color: secondaryColor }}
                                  />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          )}

                          <Link to={`/book/${instructor.id}?course=${course.course_hours}${selectedDate ? `&date=${format(selectedDate, "yyyy-MM-dd")}` : ""}`}>
                            <Button
                              className="w-full text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Book This Course
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card style={{ backgroundColor: "#e9f4f9" }}>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 mb-4">
                    No courses match your selected filters.
                  </p>
                  <Button variant="outline" onClick={() => setSelectedHours("all")}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Instructor Info */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {instructor.profile_image_url ? (
                    <img
                      src={instructor.profile_image_url}
                      alt={instructor.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {instructor.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{instructor.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {instructor.car_type} • {instructor.home_postcode}
                    </p>
                    {instructor.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {instructor.bio}
                      </p>
                    )}
                  </div>
                  <Link to={links.about}>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MiniWebsiteLayout>
  );
}
