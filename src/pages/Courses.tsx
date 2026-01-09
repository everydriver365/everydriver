import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Filter, ChevronDown, Clock, PoundSterling, Navigation, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { isFuture, parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { DynamicCourseCard } from "@/components/DynamicCourseCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Standard course hours to display
const DISPLAY_HOURS = [10, 20, 30, 40, 28]; // 28 = Test in a Week

type SortOption = "soonest" | "price-low" | "nearest";

interface Instructor {
  id: string;
  name: string;
  profile_image_url: string | null;
  car_type: string;
  car_make: string | null;
  car_model: string | null;
  home_postcode: string;
  hourly_rate: number | null;
  bio: string | null;
  brand_colour: string | null;
  is_active: boolean;
  available_from: string | null;
}

interface InstructorCourse {
  instructor_id: string;
  course_hours: number;
  is_active: boolean;
  course_image_url: string | null;
}

interface CourseTemplate {
  course_hours: number;
  course_name: string;
  default_image_url: string | null;
  is_popular: boolean | null;
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

interface CourseWithInstructor {
  instructor: Instructor;
  hours: number;
  bookableDate: Date;
  courseImageUrl: string | null;
  isPopular: boolean;
  availableFrom: string | null;
  distance?: number;
}

interface GeoCache {
  [postcode: string]: { lat: number; lng: number } | null;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate next 6 months for dropdown
function getMonthOptions(): { value: string; label: string }[] {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const month = addMonths(now, i);
    options.push({
      value: format(month, "yyyy-MM"),
      label: format(month, "MMMM yyyy"),
    });
  }
  return options;
}

// Calendar Grid View Component
interface CalendarGridViewProps {
  selectedMonth: string;
  selectedDate: Date | null;
  availableDates: Date[];
  onSelectDate: (date: Date) => void;
  loading: boolean;
}

function CalendarGridView({ selectedMonth, selectedDate, availableDates, onSelectDate, loading }: CalendarGridViewProps) {
  const today = startOfDay(new Date());
  
  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const startDay = getDay(monthStart);
    
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const paddedDays: (Date | null)[] = Array(startDay).fill(null);
    days.forEach(day => paddedDays.push(day));
    
    while (paddedDays.length % 7 !== 0) {
      paddedDays.push(null);
    }
    
    return paddedDays.map(day => ({
      date: day,
      isAvailable: day ? availableDates.some(d => isSameDay(d, day)) : false,
      isPast: day ? isBefore(day, today) : false,
    }));
  }, [selectedMonth, availableDates, today]);

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background p-4">
      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day.date) {
            return <div key={`empty-${index}`} className="h-10" />;
          }
          
          const isSelected = selectedDate && isSameDay(day.date, selectedDate);
          const isToday = isSameDay(day.date, today);
          
          return (
            <button
              key={day.date.toISOString()}
              onClick={() => day.isAvailable && onSelectDate(day.date!)}
              disabled={!day.isAvailable || day.isPast}
              className={`relative flex h-10 items-center justify-center rounded-md text-sm font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : day.isAvailable
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                    : day.isPast
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-muted-foreground hover:bg-muted/50 cursor-not-allowed"
              } ${isToday ? "ring-2 ring-primary/30" : ""}`}
            >
              {format(day.date, "d")}
              {day.isAvailable && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-100 dark:bg-emerald-900/30" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-primary" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}

export default function Courses() {
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState("10");
  const [showFilters, setShowFilters] = useState(false);
  const [transmission, setTransmission] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("soonest");
  const [geoCache, setGeoCache] = useState<GeoCache>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Date selection state
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"pills" | "calendar">("pills");

  // Data from Supabase
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<InstructorCourse[]>([]);
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  useEffect(() => {
    fetchData();
  }, []);

  // Get available dates for the selected month
  const availableDatesInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const today = startOfDay(new Date());

    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // For each day, check if any instructor is available
    return allDays.filter((day) => {
      if (isBefore(day, today)) return false;

      const dayOfWeek = getDay(day); // 0 = Sunday, 1 = Monday, etc.
      const dateStr = format(day, "yyyy-MM-dd");

      // Check if any instructor works on this day
      return instructors.some((instructor) => {
        // Check available_from restriction
        if (instructor.available_from && isAfter(parseISO(instructor.available_from), day)) {
          return false;
        }

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
      });
    });
  }, [selectedMonth, instructors, workingHours, dateOverrides]);

  // Generate courses for the selected date
  const coursesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    const dayOfWeek = getDay(selectedDate);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const courses: CourseWithInstructor[] = [];

    for (const instructor of instructors) {
      // Check available_from restriction
      if (instructor.available_from && isAfter(parseISO(instructor.available_from), selectedDate)) {
        continue;
      }

      // Check date overrides first
      const override = dateOverrides.find(
        (o) =>
          o.instructor_id === instructor.id &&
          (o.override_date === dateStr ||
            (o.override_end_date &&
              dateStr >= o.override_date &&
              dateStr <= o.override_end_date))
      );

      let isAvailable = false;
      if (override) {
        isAvailable = override.is_available;
      } else {
        // Check working hours
        isAvailable = workingHours.some(
          (wh) =>
            wh.instructor_id === instructor.id &&
            wh.day_of_week === dayOfWeek &&
            wh.is_active
        );
      }

      if (!isAvailable) continue;

      // Get courses this instructor offers
      const offeredCourses = instructorCourses.filter(
        (c) => c.instructor_id === instructor.id
      );

      for (const hours of DISPLAY_HOURS) {
        const courseData = offeredCourses.find((c) => c.course_hours === hours);
        const template = courseTemplates.find((t) => t.course_hours === hours);

        if (courseData) {
          courses.push({
            instructor,
            hours,
            bookableDate: selectedDate,
            courseImageUrl: courseData.course_image_url || template?.default_image_url || null,
            isPopular: template?.is_popular || false,
            availableFrom: instructor.available_from,
            distance: undefined,
          });
        }
      }
    }

    return courses;
  }, [selectedDate, instructors, instructorCourses, courseTemplates, workingHours, dateOverrides]);

  // Geocode postcodes via edge function
  const geocodePostcodes = useCallback(async (postcodes: string[]): Promise<GeoCache> => {
    const uncached = postcodes.filter((p) => !(p in geoCache));
    if (uncached.length === 0) return geoCache;

    try {
      const { data, error } = await supabase.functions.invoke("geocode-postcode", {
        body: { postcodes: uncached },
      });

      if (error) throw error;

      const newCache: GeoCache = { ...geoCache };
      for (const result of data.results || []) {
        if (result.latitude && result.longitude) {
          newCache[result.postcode] = { lat: result.latitude, lng: result.longitude };
        } else {
          newCache[result.postcode] = null;
        }
      }
      setGeoCache(newCache);
      return newCache;
    } catch (error) {
      console.error("Geocoding error:", error);
      return geoCache;
    }
  }, [geoCache]);

  const handleSearch = async () => {
    if (!postcode.trim()) {
      toast({ title: "Please enter a postcode", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    try {
      const cache = await geocodePostcodes([postcode.replace(/\s+/g, "").toUpperCase()]);
      const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
      const location = cache[cleanPostcode];

      if (location) {
        setUserLocation(location);
        setSortBy("nearest");
        toast({ title: "Location found!", description: "Sorting by nearest instructors" });
      } else {
        toast({ title: "Postcode not found", description: "Please check your postcode", variant: "destructive" });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [instructorsRes, coursesRes, templatesRes, workingHoursRes, overridesRes] = await Promise.all([
        supabase.from("instructors").select("*").eq("is_active", true),
        supabase.from("instructor_courses").select("*").eq("is_active", true),
        supabase.from("course_templates").select("course_hours, course_name, default_image_url, is_popular").eq("is_active", true),
        supabase.from("instructor_working_hours").select("instructor_id, day_of_week, is_active"),
        supabase.from("instructor_date_overrides").select("instructor_id, override_date, override_end_date, is_available"),
      ]);

      if (instructorsRes.error) throw instructorsRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (templatesRes.error) throw templatesRes.error;
      if (workingHoursRes.error) throw workingHoursRes.error;
      if (overridesRes.error) throw overridesRes.error;

      setInstructors(instructorsRes.data || []);
      setInstructorCourses(coursesRes.data || []);
      setCourseTemplates(templatesRes.data || []);
      setWorkingHours(workingHoursRes.data || []);
      setDateOverrides(overridesRes.data || []);

      // Geocode all instructor postcodes
      const allPostcodes = (instructorsRes.data || []).map((i) => i.home_postcode.replace(/\s+/g, "").toUpperCase());
      await geocodePostcodes(allPostcodes);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distances
  const coursesWithDistance = useMemo(() => {
    if (!userLocation) return coursesForSelectedDate;

    return coursesForSelectedDate.map((course) => {
      const instructorPostcode = course.instructor.home_postcode.replace(/\s+/g, "").toUpperCase();
      const instructorLocation = geoCache[instructorPostcode];

      if (instructorLocation) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          instructorLocation.lat,
          instructorLocation.lng
        );
        return { ...course, distance };
      }
      return { ...course, distance: undefined };
    });
  }, [coursesForSelectedDate, userLocation, geoCache]);

  const filteredCourses = coursesWithDistance
    .filter((course) => {
      if (transmission !== "all") {
        const carType = course.instructor.car_type.toLowerCase();
        if (transmission === "manual" && !carType.includes("manual") && carType !== "both") {
          return false;
        }
        if (transmission === "automatic" && !carType.includes("automatic") && carType !== "both") {
          return false;
        }
      }

      if (userLocation && course.distance !== undefined) {
        if (course.distance > parseInt(radius)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "soonest":
          return a.bookableDate.getTime() - b.bookableDate.getTime();
        case "price-low":
          const priceA = a.hours * (a.instructor.hourly_rate || 40);
          const priceB = b.hours * (b.instructor.hourly_rate || 40);
          return priceA - priceB;
        case "nearest":
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        default:
          return 0;
      }
    });

  // Get visible days (show up to 7 available days)
  const visibleDays = availableDatesInMonth.slice(0, 7);

  return (
    <MainLayout>
      {/* Search Header */}
      <section className="border-b bg-secondary/30 py-8">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl"
          >
            <h1 className="mb-6 text-2xl font-bold md:text-3xl">Find Driving Courses Near You</h1>

            <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-md sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter your postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="h-11 border-0 bg-secondary pl-10"
                />
              </div>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="h-11 rounded-lg border-0 bg-secondary px-4 text-foreground"
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="15">15 miles</option>
                <option value="25">25 miles</option>
              </select>
              <Button variant="accent" size="lg" className="h-11" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3"
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
                <div>
                  <label className="mb-2 block text-sm font-medium">Price Range</label>
                  <select className="w-full rounded-lg border bg-background px-3 py-2">
                    <option>Any price</option>
                    <option>Under £500</option>
                    <option>£500-£1000</option>
                    <option>Over £1000</option>
                  </select>
                </div>
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

      {/* Date Selection */}
      <section className="border-b bg-card py-6">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            {/* Month Selector & View Toggle */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Select a date:</span>
                <Select value={selectedMonth} onValueChange={(value) => {
                  setSelectedMonth(value);
                  setSelectedDate(null);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setViewMode("pills")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === "pills" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Pills</span>
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === "calendar" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </button>
              </div>
            </div>

            {/* Day Pills View */}
            {viewMode === "pills" && (
              <>
                {loading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 w-16 animate-pulse rounded-xl bg-muted" />
                    ))}
                  </div>
                ) : availableDatesInMonth.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {visibleDays.map((date) => {
                      const isSelected = selectedDate && isSameDay(date, selectedDate);
                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => setSelectedDate(date)}
                          className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-lg scale-105"
                              : "bg-secondary hover:bg-secondary/80 text-foreground"
                          }`}
                        >
                          <span className="text-xs font-medium uppercase">
                            {format(date, "EEE")}
                          </span>
                          <span className="text-xl font-bold">{format(date, "d")}</span>
                          <span className="text-xs">{format(date, "MMM")}</span>
                        </button>
                      );
                    })}
                    {availableDatesInMonth.length > 7 && (
                      <button
                        onClick={() => setViewMode("calendar")}
                        className="flex flex-col items-center justify-center rounded-xl bg-muted px-4 py-2 text-muted-foreground hover:bg-muted/80"
                      >
                        <span className="text-xs">+{availableDatesInMonth.length - 7}</span>
                        <span className="text-sm font-medium">more</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No available dates in this month</p>
                )}
              </>
            )}

            {/* Calendar Grid View */}
            {viewMode === "calendar" && (
              <CalendarGridView
                selectedMonth={selectedMonth}
                selectedDate={selectedDate}
                availableDates={availableDatesInMonth}
                onSelectDate={setSelectedDate}
                loading={loading}
              />
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container py-8">
        {!selectedDate ? (
          <div className="py-16 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Select a date to see available courses</h2>
            <p className="mt-2 text-muted-foreground">
              Choose a date above to view instructors available on that day
            </p>
          </div>
        ) : (
          <>
            {/* Selected date header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Courses available on {format(selectedDate, "EEEE, d MMMM yyyy")}
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course, index) => (
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
          </>
        )}
      </section>
    </MainLayout>
  );
}
