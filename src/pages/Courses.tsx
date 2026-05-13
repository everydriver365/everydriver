import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Filter, ChevronDown, PoundSterling, Navigation, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, LayoutGrid, List, RotateCcw } from "lucide-react";
import { isFuture, parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { MainLayout } from "@/components/layout/MainLayout";
import { DynamicCourseCard } from "@/components/DynamicCourseCard";
import { CourseRowCard } from "@/components/courses/CourseRowCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { getWhitelabelInstructorSlug } from "@/lib/whitelabel";
import { resolveHourlyRate, type PostcodeRateRule } from "@/lib/pricing/resolveHourlyRate";
import { SEOHead } from "@/components/SEOHead";

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
  home_address?: string | null;
  hourly_rate: number | null;
  bio: string | null;
  brand_colour: string | null;
  is_active: boolean;
  available_from: string | null;
  school_skim_amount?: number | null;
  klarna_enabled?: boolean | null;
  clearpay_enabled?: boolean | null;
}

interface InstructorCourse {
  instructor_id: string;
  course_hours: number;
  is_active: boolean;
  course_image_url: string | null;
  discounted_price: number | null;
  custom_features: string[] | null;
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

interface CourseWithInstructor {
  instructor: Instructor;
  hours: number;
  bookableDate: Date;
  courseImageUrl: string | null;
  isPopular: boolean;
  availableFrom: string | null;
  distance?: number;
  features: string[] | null;
  isIntensive: boolean;
  discountedPrice: number | null;
  customFeatures: string[] | null;
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

// Generate next 18 months for dropdown
function getMonthOptions(): { value: string; label: string }[] {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 18; i++) {
    const month = addMonths(now, i);
    options.push({
      value: format(month, "yyyy-MM"),
      label: format(month, "MMMM yyyy"),
    });
  }
  return options;
}

// Sidebar Calendar Component
interface SidebarCalendarProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedDate: Date | null;
  availableDates: Date[];
  courseCounts: { [dateStr: string]: number };
  onSelectDate: (date: Date) => void;
  loading: boolean;
  monthOptions: { value: string; label: string }[];
}

function SidebarCalendar({ 
  selectedMonth, 
  setSelectedMonth, 
  selectedDate, 
  availableDates,
  courseCounts,
  onSelectDate, 
  loading,
  monthOptions 
}: SidebarCalendarProps) {
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
    
    return paddedDays.map(day => {
      const dateStr = day ? format(day, "yyyy-MM-dd") : "";
      return {
        date: day,
        isAvailable: day ? availableDates.some(d => isSameDay(d, day)) : false,
        isPast: day ? isBefore(day, today) : false,
        courseCount: day ? (courseCounts[dateStr] || 0) : 0,
      };
    });
  }, [selectedMonth, availableDates, courseCounts, today]);

  const currentMonthIndex = monthOptions.findIndex(m => m.value === selectedMonth);

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      setSelectedMonth(monthOptions[currentMonthIndex - 1].value);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < monthOptions.length - 1) {
      setSelectedMonth(monthOptions[currentMonthIndex + 1].value);
    }
  };

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthLabel = format(new Date(year, month - 1), "MMMM yyyy");

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      {/* Month Dropdown */}
      <div className="mb-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-popover z-50">
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Month Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          disabled={currentMonthIndex === 0}
          className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <button
          onClick={handleNextMonth}
          disabled={currentMonthIndex >= monthOptions.length - 1}
          className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
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
              const isToday = isSameDay(day.date, today);
              
              return (
                <button
                  key={day.date.toISOString()}
                  onClick={() => day.isAvailable && onSelectDate(day.date!)}
                  disabled={!day.isAvailable || day.isPast}
                  className={`relative flex h-10 flex-col items-center justify-center rounded-md text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : day.isAvailable
                        ? "bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 dark:text-emerald-400"
                        : day.isPast
                          ? "text-muted-foreground/30 cursor-not-allowed"
                          : "text-muted-foreground/50 cursor-not-allowed"
                  } ${isToday && !isSelected ? "ring-1 ring-primary/40" : ""}`}
                >
                  <span>{format(day.date, "d")}</span>
                  {day.isAvailable && day.courseCount > 0 && (
                    <span className={`text-[9px] font-semibold leading-none ${
                      isSelected ? "text-primary-foreground/80" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {day.courseCount}
                    </span>
                  )}
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
          <span className="h-3 w-3 rounded bg-primary" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}

export default function Courses() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPostcode = searchParams.get("postcode") || "";
  const initialRadius = searchParams.get("radius") || "10";
  const initialTransmission = searchParams.get("transmission") || "all";
  const initialKlarna = searchParams.get("klarna") === "1";
  const initialClearpay = searchParams.get("clearpay") === "1";
  const initialCourseType = searchParams.get("courseType") || "all";
  const initialPriceRange = searchParams.get("priceRange") || "any";
  const [postcode, setPostcode] = useState(initialPostcode);
  const [radius, setRadius] = useState(initialRadius);
  const [showRadiusFallbackNotice, setShowRadiusFallbackNotice] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [transmission, setTransmission] = useState(initialTransmission);
  const [klarnaOnly, setKlarnaOnly] = useState(initialKlarna);
  const [clearpayOnly, setClearpayOnly] = useState(initialClearpay);
  const [courseType, setCourseType] = useState(initialCourseType);
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("soonest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [geoCache, setGeoCache] = useState<GeoCache>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedPostcode, setSearchedPostcode] = useState<string | null>(null);
  const [searchedAreaName, setSearchedAreaName] = useState<string | null>(null);
  const [areaCache, setAreaCache] = useState<{ [postcode: string]: string | null }>({});

  // Date selection state
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Instructor filter state
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  
  // Mobile load more state
  const [mobileVisibleCount, setMobileVisibleCount] = useState(6);
  const [postcodeRulesByInstructor, setPostcodeRulesByInstructor] = useState<Record<string, PostcodeRateRule[]>>({});

  const handleLoadMore = () => {
    setMobileVisibleCount(prev => Math.min(prev + 6, filteredCourses.length));
  };

  const resolvedRateFor = useCallback((instructor: any): number | null => {
    return resolveHourlyRate({
      pupilPostcode: searchedPostcode,
      instructorDefaultRate: instructor?.hourly_rate ?? null,
      postcodeRules: postcodeRulesByInstructor[instructor?.id] || null,
    });
  }, [searchedPostcode, postcodeRulesByInstructor]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<InstructorCourse[]>([]);
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);

  const monthOptions = useMemo(() => getMonthOptions(), []);
  
  // Track if we've done initial search from URL
  const hasSearchedFromUrl = useRef(false);

  // Helper to check if a date has availability
  const isDateAvailable = useCallback((day: Date, instructorsList: Instructor[], workingHoursList: WorkingHours[], dateOverridesList: DateOverride[]) => {
    const today = startOfDay(new Date());
    if (isBefore(day, today)) return false;

    const jsDow = getDay(day);
    const dayOfWeek = jsDow === 0 ? 7 : jsDow; // DB uses 1=Mon..7=Sun
    const dateStr = format(day, "yyyy-MM-dd");

    return instructorsList.some((instructor) => {
      if (instructor.available_from && isAfter(parseISO(instructor.available_from), day)) {
        return false;
      }

      const override = dateOverridesList.find(
        (o) =>
          o.instructor_id === instructor.id &&
          (o.override_date === dateStr ||
            (o.override_end_date &&
              dateStr >= o.override_date &&
              dateStr <= o.override_end_date))
      );
      if (override) return override.is_available;

      return workingHoursList.some(
        (wh) =>
          wh.instructor_id === instructor.id &&
          wh.day_of_week === dayOfWeek &&
          wh.is_active
      );
    });
  }, []);

  // Find first available date across next 6 months
  const findFirstAvailableDate = useCallback((instructorsList: Instructor[], workingHoursList: WorkingHours[], dateOverridesList: DateOverride[]) => {
    const today = startOfDay(new Date());
    
    for (const monthOption of monthOptions) {
      const [year, month] = monthOption.value.split("-").map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(monthStart);
      const searchStart = isAfter(monthStart, today) ? monthStart : today;
      
      if (isBefore(monthEnd, today)) continue;
      
      const daysInMonth = eachDayOfInterval({ start: searchStart, end: monthEnd });
      
      for (const day of daysInMonth) {
        if (isDateAvailable(day, instructorsList, workingHoursList, dateOverridesList)) {
          return { date: day, month: monthOption.value };
        }
      }
    }
    return null;
  }, [monthOptions, isDateAvailable]);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-search if postcode was passed via URL
  useEffect(() => {
    if (initialPostcode && !hasSearchedFromUrl.current && !loading && instructors.length > 0) {
      hasSearchedFromUrl.current = true;
      handleSearch();
    }
  }, [initialPostcode, loading, instructors.length]);

  const instructorIdsWithCourses = useMemo(() => {
    const ids = new Set<string>();
    for (const c of instructorCourses) {
      if (c.is_active) ids.add(c.instructor_id);
    }
    return ids;
  }, [instructorCourses]);

  const instructorsInArea = useMemo(() => {
    if (!userLocation) return instructors;

    const radiusMiles = parseInt(radius);

    return instructors.filter((instructor) => {
      const instructorPostcode = instructor.home_postcode.replace(/\s+/g, "").toUpperCase();
      const cached = geoCache[instructorPostcode];
      const instructorLocation = cached
        ?? ((instructor as any).lat != null && (instructor as any).lng != null
          ? { lat: Number((instructor as any).lat), lng: Number((instructor as any).lng) }
          : null);
      if (!instructorLocation) return false;

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        instructorLocation.lat,
        instructorLocation.lng
      );

      return distance <= radiusMiles;
    });
  }, [instructors, userLocation, radius, geoCache]);

  const relevantInstructors = useMemo(() => {
    const base = userLocation ? instructorsInArea : instructors;
    return base.filter((i) => instructorIdsWithCourses.has(i.id));
  }, [instructors, instructorsInArea, instructorIdsWithCourses, userLocation]);

  // Get available dates for the selected month
  const availableDatesInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const today = startOfDay(new Date());

    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // For each day, check if any relevant instructor (in area + has courses) is available
    return allDays.filter((day) => {
      if (isBefore(day, today)) return false;

      const jsDow = getDay(day);
      const dayOfWeek = jsDow === 0 ? 7 : jsDow; // DB uses 1=Mon..7=Sun
      const dateStr = format(day, "yyyy-MM-dd");

      return relevantInstructors.some((instructor) => {
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
  }, [selectedMonth, relevantInstructors, workingHours, dateOverrides]);

  // Calculate course counts for each available date in the month
  const courseCountsInMonth = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    
    for (const day of availableDatesInMonth) {
      const jsDow = getDay(day);
      const dayOfWeek = jsDow === 0 ? 7 : jsDow; // DB uses 1=Mon..7=Sun
      const dateStr = format(day, "yyyy-MM-dd");
      let count = 0;

      for (const instructor of relevantInstructors) {
        if (instructor.available_from && isAfter(parseISO(instructor.available_from), day)) {
          continue;
        }

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
          isAvailable = workingHours.some(
            (wh) =>
              wh.instructor_id === instructor.id &&
              wh.day_of_week === dayOfWeek &&
              wh.is_active
          );
        }

        if (!isAvailable) continue;

        const offeredCourses = instructorCourses.filter(
          (c) => c.instructor_id === instructor.id
        );

        for (const hours of DISPLAY_HOURS) {
          const courseData = offeredCourses.find((c) => c.course_hours === hours);
          if (courseData) count++;
        }
      }

      counts[dateStr] = count;
    }

    return counts;
  }, [availableDatesInMonth, relevantInstructors, instructorCourses, workingHours, dateOverrides]);

  // Generate courses for the selected date
  const coursesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    const jsDowSel = getDay(selectedDate);
    const dayOfWeek = jsDowSel === 0 ? 7 : jsDowSel; // DB uses 1=Mon..7=Sun
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const courses: CourseWithInstructor[] = [];

    for (const instructor of relevantInstructors) {
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
            features: template?.features || null,
            isIntensive: template?.is_intensive || false,
            discountedPrice: courseData.discounted_price || null,
            customFeatures: courseData.custom_features || null,
          });
        }
      }
    }

    return courses;
  }, [selectedDate, relevantInstructors, instructorCourses, courseTemplates, workingHours, dateOverrides]);

  // Geocode postcodes via edge function
  const geocodePostcodes = useCallback(async (postcodes: string[]): Promise<{ geoCache: GeoCache; areaCache: { [postcode: string]: string | null } }> => {
    const uncached = postcodes.filter((p) => !(p in geoCache));
    if (uncached.length === 0) return { geoCache, areaCache };

    try {
      const { data, error } = await supabase.functions.invoke("geocode-postcode", {
        body: { postcodes: uncached },
      });

      if (error) throw error;

      const newGeoCache: GeoCache = { ...geoCache };
      const newAreaCache: { [postcode: string]: string | null } = { ...areaCache };
      
      for (const result of data.results || []) {
        if (result.latitude && result.longitude) {
          newGeoCache[result.postcode] = { lat: result.latitude, lng: result.longitude };
        } else {
          newGeoCache[result.postcode] = null;
        }
        newAreaCache[result.postcode] = result.area_name || null;
      }
      setGeoCache(newGeoCache);
      setAreaCache(newAreaCache);
      return { geoCache: newGeoCache, areaCache: newAreaCache };
    } catch (error) {
      console.error("Geocoding error:", error);
      return { geoCache, areaCache };
    }
  }, [geoCache, areaCache]);

  const handleSearch = async (searchPostcode?: string) => {
    const postcodeToSearch = searchPostcode || postcode;
    
    if (!postcodeToSearch.trim()) {
      toast({ title: "Please enter a postcode", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    try {
      const cleanPostcode = postcodeToSearch.replace(/\s+/g, "").toUpperCase();
      const result = await geocodePostcodes([cleanPostcode]);
      const location = result.geoCache[cleanPostcode];
      const areaName = result.areaCache[cleanPostcode];

      if (!location) {
        toast({ title: "Postcode not found", description: "Please check your postcode", variant: "destructive" });
        return;
      }

      setUserLocation(location);
      setSearchedPostcode(cleanPostcode);
      setSearchedAreaName(areaName || null);
      setSortBy("nearest");
      setSearchParams({ postcode: cleanPostcode });

      // Jump to the next available date for instructors in the searched area
      const fullGeoCache = { ...geoCache, ...result.geoCache };
      const radiusMiles = parseInt(radius);
      const instructorIds = new Set(
        instructorCourses.filter((c) => c.is_active).map((c) => c.instructor_id)
      );

      const instructorsNearby = instructors.filter((instructor) => {
        if (!instructorIds.has(instructor.id)) return false;

        const instructorPostcode = instructor.home_postcode.replace(/\s+/g, "").toUpperCase();
        const cached = fullGeoCache[instructorPostcode];
        const instructorLocation = cached
          ?? ((instructor as any).lat != null && (instructor as any).lng != null
            ? { lat: Number((instructor as any).lat), lng: Number((instructor as any).lng) }
            : null);
        if (!instructorLocation) return false;

        const distance = calculateDistance(
          location.lat,
          location.lng,
          instructorLocation.lat,
          instructorLocation.lng
        );

        return distance <= radiusMiles;
      });

      let firstAvailable = findFirstAvailableDate(instructorsNearby, workingHours, dateOverrides);
      let usedFallback = false;

      // Auto-expand radius once if nothing nearby
      if (!firstAvailable && instructorsNearby.length === 0 && radiusMiles < 25) {
        console.warn(`[Courses] No instructors within ${radiusMiles}mi of ${cleanPostcode} – expanding to 25mi`);
        setRadius("25");
      }

      // Final fallback: search all instructors with active courses so the grid still renders
      if (!firstAvailable) {
        const allWithCourses = instructors.filter((i) => instructorIds.has(i.id));
        firstAvailable = findFirstAvailableDate(allWithCourses, workingHours, dateOverrides);
        if (firstAvailable) {
          usedFallback = true;
          console.warn(`[Courses] Postcode ${cleanPostcode}: no nearby instructors, showing all available courses`);
        }
      }

      if (firstAvailable) {
        setSelectedMonth(firstAvailable.month);
        setSelectedDate(firstAvailable.date);
      } else {
        setSelectedDate(null);
      }

      setShowRadiusFallbackNotice(usedFallback);

      toast({
        title: "Location found!",
        description: usedFallback
          ? `No instructors within ${radiusMiles} mi of ${areaName || cleanPostcode} – showing wider results`
          : `Showing courses near ${areaName || cleanPostcode}`,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle postcode selection from autocomplete - auto search
  const handlePostcodeSelect = (selectedPostcode: string) => {
    setPostcode(selectedPostcode);
    // Trigger search immediately with the selected postcode
    handleSearch(selectedPostcode);
  };

  const clearSearch = () => {
    setPostcode("");
    setUserLocation(null);
    setSearchedPostcode(null);
    setSearchedAreaName(null);
    setSortBy("soonest");
    // Clear URL params
    setSearchParams({});
  };

  const handleResetFilters = () => {
    setTransmission("all");
    setSortBy("soonest");
    setKlarnaOnly(false);
    setClearpayOnly(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("transmission");
      next.delete("klarna");
      next.delete("clearpay");
      return next;
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const whitelabelSlug = getWhitelabelInstructorSlug();
      const instructorsQuery = supabase.from("public_instructors").select("*").eq("is_active", true);
      if (whitelabelSlug) instructorsQuery.eq("app_slug", whitelabelSlug);

      const [instructorsRes, coursesRes, templatesRes, workingHoursRes, availabilityWindowsRes, overridesRes] = await Promise.all([
        instructorsQuery,
        supabase.from("instructor_courses").select("*").eq("is_active", true),
        supabase.from("course_templates").select("course_hours, course_name, default_image_url, is_popular, features, is_intensive").eq("is_active", true),
        supabase.from("instructor_working_hours").select("instructor_id, day_of_week, is_active"),
        supabase.from("availability_windows").select("instructor_id, day_of_week, is_active"),
        supabase.from("instructor_date_overrides").select("instructor_id, override_date, override_end_date, is_available"),
      ]);

      if (instructorsRes.error) throw instructorsRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (templatesRes.error) throw templatesRes.error;
      if (workingHoursRes.error) throw workingHoursRes.error;
      if (availabilityWindowsRes.error) throw availabilityWindowsRes.error;
      if (overridesRes.error) throw overridesRes.error;

      const loadedInstructors = instructorsRes.data || [];
      // Merge both availability sources: some instructors store hours in
      // instructor_working_hours, others in availability_windows. Union both
      // so search availability checks find rows for either.
      const loadedWorkingHours = [
        ...(workingHoursRes.data || []),
        ...(availabilityWindowsRes.data || []),
      ];
      const loadedOverrides = overridesRes.data || [];

      setInstructors(loadedInstructors);
      setInstructorCourses(coursesRes.data || []);
      setCourseTemplates(templatesRes.data || []);
      setWorkingHours(loadedWorkingHours);
      setDateOverrides(loadedOverrides);

      // Auto-advance to first available date
      const firstAvailable = findFirstAvailableDate(loadedInstructors, loadedWorkingHours, loadedOverrides);
      if (firstAvailable) {
        setSelectedMonth(firstAvailable.month);
        setSelectedDate(firstAvailable.date);
      }

      // Geocode all instructor postcodes
      const allPostcodes = (instructorsRes.data || []).map((i: any) => (i.home_postcode || "").replace(/\s+/g, "").toUpperCase()).filter(Boolean);
      await geocodePostcodes(allPostcodes);

      // Load postcode rate overrides for all visible instructors (single batched query)
      const instructorIds = (instructorsRes.data || []).map((i: any) => i.id).filter(Boolean);
      if (instructorIds.length) {
        const { data: rateRows } = await supabase
          .from("instructor_postcode_rates")
          .select("instructor_id, outward_code, hourly_rate")
          .in("instructor_id", instructorIds);
        const map: Record<string, PostcodeRateRule[]> = {};
        for (const r of (rateRows || []) as any[]) {
          (map[r.instructor_id] ||= []).push({ outward_code: r.outward_code, hourly_rate: Number(r.hourly_rate) });
        }
        setPostcodeRulesByInstructor(map);
      }
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
      const cached = geoCache[instructorPostcode];
      const instructorLocation = cached
        ?? ((course.instructor as any).lat != null && (course.instructor as any).lng != null
          ? { lat: Number((course.instructor as any).lat), lng: Number((course.instructor as any).lng) }
          : null);

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
      // Filter by selected instructor
      if (selectedInstructorId && course.instructor.id !== selectedInstructorId) {
        return false;
      }
      
      if (transmission !== "all") {
        const carType = course.instructor.car_type.toLowerCase();
        if (transmission === "manual" && !carType.includes("manual") && carType !== "both") {
          return false;
        }
        if (transmission === "automatic" && !carType.includes("automatic") && carType !== "both") {
          return false;
        }
      }

      if (klarnaOnly && !course.instructor.klarna_enabled) {
        return false;
      }
      if (clearpayOnly && !course.instructor.clearpay_enabled) {
        return false;
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
          const skimA = a.instructor.school_skim_amount || 0;
          const skimB = b.instructor.school_skim_amount || 0;
          const priceA = (a.hours * (a.instructor.hourly_rate || 40)) + skimA;
          const priceB = (b.hours * (b.instructor.hourly_rate || 40)) + skimB;
          return priceA - priceB;
        case "nearest":
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        default:
          return 0;
      }
    });
  
  // Get unique instructors from courses for the filter tile
  const availableInstructorsForFilter = useMemo(() => {
    const instructorMap = new Map<string, { instructor: Instructor; distance?: number }>();
    
    for (const course of coursesWithDistance) {
      if (!instructorMap.has(course.instructor.id)) {
        instructorMap.set(course.instructor.id, {
          instructor: course.instructor,
          distance: course.distance,
        });
      }
    }
    
    return Array.from(instructorMap.values()).sort((a, b) => {
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
  }, [coursesWithDistance]);

  return (
    <MainLayout>
      <SEOHead
        title="Driving Courses Near You | Compare & Book | EveryDriver"
        description="Compare intensive, semi-intensive and weekly driving courses from DVSA-approved instructors near you. Book online with 0% finance options."
      />
      {/* Search Header */}
      <section className="border-b bg-background py-8">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl"
          >
            <h1 className="mb-6 text-2xl font-bold md:text-3xl">
              {searchedAreaName ? `Courses in ${searchedAreaName}` : "Find a Course"}
            </h1>

            <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.08)] md:p-3">
              <div className="flex flex-col items-stretch gap-2 sm:flex-row">
                {/* Postcode input */}
                <div className="group relative flex-1">
                  <label className="absolute -top-2 left-11 z-10 bg-white px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Postcode
                  </label>
                  <PostcodeAutocomplete
                    value={postcode}
                    onChange={setPostcode}
                    onSelect={handlePostcodeSelect}
                    placeholder="Enter postcode"
                    className="w-full"
                    inputClassName="h-14 rounded-2xl border-0 bg-slate-50/60 pl-12 pr-4 font-medium text-slate-700 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20"
                  />
                  <MapPin className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                </div>

                {/* Radius select */}
                <div className="group relative w-full sm:w-56">
                  <label className="absolute -top-2 left-11 z-10 bg-white px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Search Radius
                  </label>
                  <svg className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="h-14 w-full appearance-none rounded-2xl border-0 bg-slate-50/60 pl-12 pr-10 font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="5">5 miles</option>
                    <option value="10">10 miles</option>
                    <option value="15">15 miles</option>
                    <option value="25">25 miles</option>
                    <option value="35">35 miles</option>
                    <option value="50">50 miles</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                {/* Search button */}
                <button
                  onClick={() => handleSearch()}
                  disabled={isSearching}
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2545] px-8 font-bold text-white shadow-lg shadow-[#0B2545]/20 transition-all hover:bg-[#0B2545]/90 active:scale-95 disabled:opacity-60 sm:w-auto"
                >
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Search</span>
                      <Search className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
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
                  <label className="mb-2 block text-sm font-semibold text-foreground">Transmission</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition focus:border-[#0B2545] focus:outline-none focus:ring-2 focus:ring-[#0B2545]/10"
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                {!isMobile && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">Price Range</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition focus:border-[#0B2545] focus:outline-none focus:ring-2 focus:ring-[#0B2545]/10"
                        value={sortBy === "price-low" ? "cheapest" : "any"}
                        onChange={(e) => {
                          if (e.target.value === "cheapest") setSortBy("price-low");
                          else if (sortBy === "price-low") setSortBy("soonest");
                        }}
                      >
                        <option value="any">Any price</option>
                        <option value="cheapest">Cheapest first</option>
                        <option disabled>Under £500</option>
                        <option disabled>£500-£1000</option>
                        <option disabled>Over £1000</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Course Type</label>
                  <div className="relative">
                    <select className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition focus:border-[#0B2545] focus:outline-none focus:ring-2 focus:ring-[#0B2545]/10">
                      <option>All courses</option>
                      <option>10 Hours</option>
                      <option>20 Hours</option>
                      <option>30 Hours</option>
                      <option>40 Hours</option>
                      <option>Test in a Week</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Pay Later</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setKlarnaOnly((v) => !v)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold shadow-sm transition-all ${
                        klarnaOnly
                          ? "border-pink-300 bg-pink-50 text-pink-700 ring-1 ring-pink-300/40"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      aria-pressed={klarnaOnly}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-400 text-[10px] font-bold text-white shadow-sm">
                        K
                      </span>
                      Klarna
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearpayOnly((v) => !v)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold shadow-sm transition-all ${
                        clearpayOnly
                          ? "border-violet-300 bg-violet-50 text-violet-700 ring-1 ring-violet-300/40"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      aria-pressed={clearpayOnly}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white shadow-sm">
                        C
                      </span>
                      Clearpay
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Two Column Layout: Calendar + Courses */}
      <section className="container py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Column: Calendar + Instructors */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              <SidebarCalendar
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedDate={selectedDate}
                availableDates={availableDatesInMonth}
                courseCounts={courseCountsInMonth}
                onSelectDate={setSelectedDate}
                loading={loading}
                monthOptions={monthOptions}
              />
              
              {/* Instructors Filter Tile */}
              {availableInstructorsForFilter.length > 0 && (
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Instructors {userLocation ? "Nearby" : "Available"}
                    </h3>
                    {selectedInstructorId && (
                      <button
                        onClick={() => setSelectedInstructorId(null)}
                        className="text-xs text-primary hover:underline"
                      >
                        Show all
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableInstructorsForFilter.map(({ instructor, distance }) => {
                      // Convert hex to rgba for background with opacity
                      const getBrandBgColor = (hex: string | null) => {
                        if (!hex) return undefined;
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        return `rgba(${r}, ${g}, ${b}, 0.15)`;
                      };
                      
                      return (
                        <button
                          key={instructor.id}
                          onClick={() => setSelectedInstructorId(
                            selectedInstructorId === instructor.id ? null : instructor.id
                          )}
                          className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-all ${
                            selectedInstructorId === instructor.id
                              ? "ring-2 ring-primary"
                              : "hover:bg-muted"
                          }`}
                          style={{
                            backgroundColor: selectedInstructorId === instructor.id && instructor.brand_colour
                              ? getBrandBgColor(instructor.brand_colour)
                              : undefined,
                          }}
                        >
                          <div 
                            className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2"
                            style={{
                              backgroundColor: getBrandBgColor(instructor.brand_colour) || 'hsl(var(--muted))',
                              borderColor: instructor.brand_colour || 'hsl(var(--border))',
                            }}
                          >
                            {instructor.profile_image_url ? (
                              <img
                                src={instructor.profile_image_url}
                                alt={instructor.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div 
                                className="flex h-full w-full items-center justify-center text-sm font-semibold"
                                style={{
                                  color: instructor.brand_colour || 'hsl(var(--primary))',
                                }}
                              >
                                {instructor.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium">{instructor.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="capitalize">{instructor.car_type}</span>
                              {distance !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>{distance.toFixed(1)} mi</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div 
                            className="h-3 w-3 rounded-full flex-shrink-0 border"
                            style={{ 
                              backgroundColor: instructor.brand_colour || 'hsl(var(--primary))',
                              borderColor: instructor.brand_colour || 'hsl(var(--primary))',
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Course Tiles */}
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
                {showRadiusFallbackNotice && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                    <span>
                      No instructors found within {radius} mi of {searchedAreaName || searchedPostcode}. Showing wider results.
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => {
                        setRadius("50");
                        setShowRadiusFallbackNotice(false);
                      }}
                    >
                      Expand to 50 mi
                    </Button>
                  </div>
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

                   {/* Transmission Filter + Sort buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Transmission Pills */}
                    <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm gap-0.5">
                      {[
                        { value: "all", label: "All" },
                        { value: "manual", label: "Manual" },
                        { value: "automatic", label: "Automatic" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTransmission(option.value)}
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                            transmission === option.value
                              ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/25"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {/* Sort Pills */}
                    <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm gap-0.5">
                      <button
                        onClick={() => setSortBy("soonest")}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                          sortBy === "soonest"
                            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/25"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Soonest
                      </button>
                      <button
                        onClick={() => setSortBy("nearest")}
                        disabled={!userLocation}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                          sortBy === "nearest"
                            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/25"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        } ${!userLocation ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Nearest
                      </button>
                      <button
                        onClick={() => setSortBy("price-low")}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                          sortBy === "price-low"
                            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/25"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <PoundSterling className="h-3.5 w-3.5" />
                        Cheapest
                      </button>
                    </div>

                    {/* View toggle (desktop only) */}
                    {!isMobile && (
                      <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm gap-0.5">
                        <button
                          onClick={() => setViewMode("list")}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                            viewMode === "list"
                              ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/25"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                          aria-label="List view"
                        >
                          <List className="h-3.5 w-3.5" />
                          List
                        </button>
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                            viewMode === "grid"
                              ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/25"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                          aria-label="Grid view"
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                          Grid
                        </button>
                      </div>
                    )}

                    {/* Reset Filters */}
                    <button
                      onClick={handleResetFilters}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      title="Reset filters"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </button>
                  </div>
                </div>

                {filteredCourses.length > 0 ? (
                  isMobile ? (
                    // Mobile: Same flip cards as desktop, single column
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
                            areaName={areaCache[course.instructor.home_postcode?.replace(/\s+/g, "").toUpperCase()] || null}
                            effectiveHourlyRate={resolvedRateFor(course.instructor)}
                            learnerPostcode={searchedPostcode}
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
                    <>
                      <div className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                        {filteredCourses.slice(0, 6).map((course, index) => {
                          const rate = resolvedRateFor(course.instructor) ?? course.instructor.hourly_rate ?? 40;
                          const skim = course.instructor.school_skim_amount || 0;
                          const computedPrice = course.hours * rate + skim;
                          return (
                            <motion.div
                              key={`${course.instructor.id}-${course.hours}-${course.bookableDate.toISOString()}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              {viewMode === "list" ? (
                                <CourseRowCard
                                  instructor={course.instructor}
                                  hours={course.hours}
                                  nextAvailable={course.bookableDate}
                                  distance={course.distance}
                                  isIntensive={course.isIntensive}
                                  price={computedPrice}
                                  discountedPrice={course.discountedPrice}
                                  areaName={areaCache[course.instructor.home_postcode?.replace(/\s+/g, "").toUpperCase()] || null}
                                />
                              ) : (
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
                                  areaName={areaCache[course.instructor.home_postcode?.replace(/\s+/g, "").toUpperCase()] || null}
                                  effectiveHourlyRate={resolvedRateFor(course.instructor)}
                                  learnerPostcode={searchedPostcode}
                                />
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                      {filteredCourses.length > 6 && (
                        <div className="mt-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            Showing 6 of {filteredCourses.length} courses
                          </p>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  <div className="py-16 text-center max-w-md mx-auto">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">No courses found</h2>
                    <p className="mt-2 text-muted-foreground">
                      {userLocation
                        ? `No instructors offering courses within ${radius} miles${searchedAreaName ? ` of ${searchedAreaName}` : ""} on this date. Try widening your search radius below, picking a different date, or removing some filters.`
                        : "We couldn't find courses matching your search. Try widening your search radius, entering a different postcode, or removing some filters."}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      {userLocation && parseInt(radius) < 50 && (
                        <Button
                          variant="default"
                          onClick={() => {
                            const next = parseInt(radius) < 25 ? "25" : "50";
                            setRadius(next);
                            handleSearch(searchedPostcode || postcode);
                          }}
                        >
                          Expand to {parseInt(radius) < 25 ? "25" : "50"} miles
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => { setSelectedInstructorId(null); setSortBy("soonest"); setTransmission("all"); }}>
                        Clear Filters
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/contact"><MapPin className="h-4 w-4 mr-1" /> Contact Us</a>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
