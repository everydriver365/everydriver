import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Filter, ChevronDown, PoundSterling, Navigation, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, LayoutGrid, List, RotateCcw } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { MainLayout } from "@/components/layout/MainLayout";
import { CourseSearchHeader, type CourseFilterId } from "@/components/courses/CourseSearchHeader";
import { DynamicCourseCard } from "@/components/DynamicCourseCard";
import { CourseTableList } from "@/components/courses/CourseTableList";
import { Edit2, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { getWhitelabelInstructorSlug } from "@/lib/whitelabel";
import { resolveHourlyRate, type PostcodeRateRule } from "@/lib/pricing/resolveHourlyRate";
import { SEOHead } from "@/components/SEOHead";
import {
  hasInstructorAvailabilityOn,
  type CourseAvailabilitySources,
  type WeeklyHourRow,
  type DateOverrideRow,
  type CalendarEventRow,
  type ScheduledLessonRow,
  type ManualBlockRow,
} from "@/lib/courseAvailability";

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
  offerActive?: boolean | null;
  offerLabel?: string | null;
  offerPercentOff?: number | null;
  offerStartsAt?: string | null;
  offerEndsAt?: string | null;
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
  hideCounts?: boolean;
}

function SidebarCalendar({ 
  selectedMonth, 
  setSelectedMonth, 
  selectedDate, 
  availableDates,
  courseCounts,
  onSelectDate, 
  loading,
  monthOptions,
  hideCounts,
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
                  {!hideCounts && day.isAvailable && day.courseCount > 0 && (
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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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
  // Separate weekly availability sources so each can use its own day-of-week
  // convention (working_hours = 0..6 Sun..Sat, availability_windows = 1..7 Mon..Sun).
  const [workingHourRows, setWorkingHourRows] = useState<WeeklyHourRow[]>([]);
  const [availabilityWindowRows, setAvailabilityWindowRows] = useState<WeeklyHourRow[]>([]);
  const [overrideRows, setOverrideRows] = useState<DateOverrideRow[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventRow[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLessonRow[]>([]);
  const [manualBlocks, setManualBlocks] = useState<ManualBlockRow[]>([]);

  const availabilitySources: CourseAvailabilitySources = useMemo(() => ({
    workingHours: workingHourRows,
    availabilityWindows: availabilityWindowRows,
    overrides: overrideRows,
    calendarEvents,
    scheduledLessons,
    manualBlocks,
  }), [workingHourRows, availabilityWindowRows, overrideRows, calendarEvents, scheduledLessons, manualBlocks]);

  const monthOptions = useMemo(() => getMonthOptions(), []);
  
  // Track if we've done initial search from URL
  const hasSearchedFromUrl = useRef(false);

  // Helper to check if a date has availability (uses shared resolver including
  // Google Calendar busy events + existing scheduled lessons + manual blocks).
  const isDateAvailable = useCallback((day: Date, instructorsList: Instructor[], src: CourseAvailabilitySources) => {
    return instructorsList.some((instructor) => hasInstructorAvailabilityOn(instructor, day, src));
  }, []);

  // Find first available date across next 6 months
  const findFirstAvailableDate = useCallback((instructorsList: Instructor[], src: CourseAvailabilitySources) => {
    const today = startOfDay(new Date());
    for (const monthOption of monthOptions) {
      const [year, month] = monthOption.value.split("-").map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(monthStart);
      const searchStart = isAfter(monthStart, today) ? monthStart : today;
      if (isBefore(monthEnd, today)) continue;
      const daysInMonth = eachDayOfInterval({ start: searchStart, end: monthEnd });
      for (const day of daysInMonth) {
        if (isDateAvailable(day, instructorsList, src)) {
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

      return relevantInstructors.some((instructor) =>
        hasInstructorAvailabilityOn(instructor, day, availabilitySources)
      );
    });
  }, [selectedMonth, relevantInstructors, availabilitySources]);

  // Calculate course counts for each available date in the month
  const courseCountsInMonth = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    for (const day of availableDatesInMonth) {
      const dateStr = format(day, "yyyy-MM-dd");
      let count = 0;
      for (const instructor of relevantInstructors) {
        if (!hasInstructorAvailabilityOn(instructor, day, availabilitySources)) continue;
        const offeredCourses = instructorCourses.filter((c) => c.instructor_id === instructor.id);
        for (const hours of DISPLAY_HOURS) {
          if (offeredCourses.find((c) => c.course_hours === hours)) count++;
        }
      }
      counts[dateStr] = count;
    }
    return counts;
  }, [availableDatesInMonth, relevantInstructors, instructorCourses, availabilitySources]);

  // Generate courses for the selected date
  const coursesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const courses: CourseWithInstructor[] = [];
    for (const instructor of relevantInstructors) {
      if (!hasInstructorAvailabilityOn(instructor, selectedDate, availabilitySources)) continue;
      const offeredCourses = instructorCourses.filter((c) => c.instructor_id === instructor.id);
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
            offerActive: (courseData as any).offer_active ?? null,
            offerLabel: (courseData as any).offer_label ?? null,
            offerPercentOff: (courseData as any).offer_percent_off ?? null,
            offerStartsAt: (courseData as any).offer_starts_at ?? null,
            offerEndsAt: (courseData as any).offer_ends_at ?? null,
          });
        }
      }
    }
    return courses;
  }, [selectedDate, relevantInstructors, instructorCourses, courseTemplates, availabilitySources]);

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

      let firstAvailable = findFirstAvailableDate(instructorsNearby, availabilitySources);
      let usedFallback = false;

      // Auto-expand radius once if nothing nearby
      if (!firstAvailable && instructorsNearby.length === 0 && radiusMiles < 25) {
        console.warn(`[Courses] No instructors within ${radiusMiles}mi of ${cleanPostcode} – expanding to 25mi`);
        setRadius("25");
      }

      // Final fallback: search all instructors with active courses so the grid still renders
      if (!firstAvailable) {
        const allWithCourses = instructors.filter((i) => instructorIds.has(i.id));
        firstAvailable = findFirstAvailableDate(allWithCourses, availabilitySources);
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
    setCourseType("all");
    setPriceRange("any");
    setSelectedInstructorId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("transmission");
      next.delete("klarna");
      next.delete("clearpay");
      next.delete("courseType");
      next.delete("priceRange");
      return next;
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const whitelabelSlug = getWhitelabelInstructorSlug();
      const instructorsQuery = supabase.from("public_instructors").select("*").eq("is_active", true);
      if (whitelabelSlug) instructorsQuery.eq("app_slug", whitelabelSlug);

      const [instructorsRes, coursesRes, templatesRes] = await Promise.all([
        instructorsQuery,
        supabase.from("instructor_courses").select("*").eq("is_active", true),
        supabase.from("course_templates").select("course_hours, course_name, default_image_url, is_popular, features, is_intensive").eq("is_active", true),
      ]);

      if (instructorsRes.error) throw instructorsRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (templatesRes.error) throw templatesRes.error;

      const loadedInstructors = instructorsRes.data || [];
      const instructorIds = loadedInstructors.map((i: any) => i.id).filter(Boolean);
      const firstMonth = startOfDay(new Date());
      const lastMonthOption = monthOptions[monthOptions.length - 1];
      const [lastYear, lastMonth] = lastMonthOption.value.split("-").map(Number);
      const rangeEnd = endOfMonth(new Date(lastYear, lastMonth - 1));
      const fromYmd = format(firstMonth, "yyyy-MM-dd");
      const toYmd = format(rangeEnd, "yyyy-MM-dd");
      const fromIso = firstMonth.toISOString();
      const toIso = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate() + 1).toISOString();

      const [workingHoursRes, availabilityWindowsRes, overridesRes, lessonsRes, blocksRes, eventsRes] = instructorIds.length > 0
        ? await Promise.all([
            supabase
              .from("instructor_working_hours")
              .select("instructor_id, day_of_week, start_time, end_time, is_active")
              .in("instructor_id", instructorIds),
            supabase
              .from("availability_windows")
              .select("instructor_id, day_of_week, start_time, end_time, is_active")
              .in("instructor_id", instructorIds),
            supabase
              .from("instructor_date_overrides")
              .select("instructor_id, override_date, override_end_date, is_available, start_time, end_time")
              .in("instructor_id", instructorIds)
              .gte("override_date", fromYmd)
              .lte("override_date", toYmd),
            supabase
              .from("scheduled_lessons")
              .select("instructor_id, lesson_date, start_time, duration_minutes, status")
              .in("instructor_id", instructorIds)
              .gte("lesson_date", fromYmd)
              .lte("lesson_date", toYmd)
              .neq("status", "cancelled"),
            supabase
              .from("instructor_manual_blocks")
              .select("instructor_id, start_datetime, end_datetime")
              .in("instructor_id", instructorIds)
              .gte("end_datetime", fromIso)
              .lte("start_datetime", toIso),
            supabase
              .from("instructor_calendar_events")
              .select("instructor_id, start_time, end_time, is_busy")
              .in("instructor_id", instructorIds)
              .eq("is_busy", true)
              .gte("end_time", fromIso)
              .lte("start_time", toIso),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
          ];

      if (workingHoursRes.error) throw workingHoursRes.error;
      if (availabilityWindowsRes.error) throw availabilityWindowsRes.error;
      if (overridesRes.error) throw overridesRes.error;
      if (lessonsRes.error) throw lessonsRes.error;
      if (blocksRes.error) throw blocksRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const loadedWorkingHourRows = workingHoursRes.data || [];
      const loadedAvailabilityWindowRows = availabilityWindowsRes.data || [];
      const loadedOverrides = overridesRes.data || [];
      const loadedCalendarEvents = eventsRes.data || [];
      const loadedScheduledLessons = lessonsRes.data || [];
      const loadedManualBlocks = blocksRes.data || [];
      const loadedAvailabilitySources: CourseAvailabilitySources = {
        workingHours: loadedWorkingHourRows,
        availabilityWindows: loadedAvailabilityWindowRows,
        overrides: loadedOverrides,
        calendarEvents: loadedCalendarEvents,
        scheduledLessons: loadedScheduledLessons,
        manualBlocks: loadedManualBlocks,
      };

      setInstructors(loadedInstructors);
      setInstructorCourses(coursesRes.data || []);
      setCourseTemplates(templatesRes.data || []);
      setWorkingHourRows(loadedWorkingHourRows);
      setAvailabilityWindowRows(loadedAvailabilityWindowRows);
      setOverrideRows(loadedOverrides);
      setCalendarEvents(loadedCalendarEvents);
      setScheduledLessons(loadedScheduledLessons);
      setManualBlocks(loadedManualBlocks);

      // Auto-advance to first available date
      const firstAvailable = findFirstAvailableDate(loadedInstructors, loadedAvailabilitySources);
      if (firstAvailable) {
        setSelectedMonth(firstAvailable.month);
        setSelectedDate(firstAvailable.date);
      }

      // Geocode all instructor postcodes
      const allPostcodes = (instructorsRes.data || []).map((i: any) => (i.home_postcode || "").replace(/\s+/g, "").toUpperCase()).filter(Boolean);
      await geocodePostcodes(allPostcodes);

      // Load postcode rate overrides for all visible instructors (single batched query)
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

      // Course Type filter
      if (courseType !== "all") {
        if (courseType === "test-in-a-week") {
          if (!course.isIntensive) return false;
        } else {
          const wantHours = parseInt(courseType);
          if (!Number.isNaN(wantHours) && course.hours !== wantHours) return false;
        }
      }

      // Price Range filter (live data only — skip courses with no published rate)
      if (priceRange !== "any") {
        const skim = Number(course.instructor.school_skim_amount ?? 0);
        const rate = Number(course.instructor.hourly_rate ?? 0);
        if (!rate) return false;
        const computed = course.discountedPrice ?? (course.hours * rate + skim);
        if (priceRange === "under-500" && computed >= 500) return false;
        if (priceRange === "500-1000" && (computed < 500 || computed > 1000)) return false;
        if (priceRange === "over-1000" && computed <= 1000) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "soonest":
          return a.bookableDate.getTime() - b.bookableDate.getTime();
        case "price-low": {
          // Instructors with no published rate sort to the bottom.
          const rateA = Number(a.instructor.hourly_rate ?? 0);
          const rateB = Number(b.instructor.hourly_rate ?? 0);
          if (!rateA && !rateB) return 0;
          if (!rateA) return 1;
          if (!rateB) return -1;
          const skimA = Number(a.instructor.school_skim_amount ?? 0);
          const skimB = Number(b.instructor.school_skim_amount ?? 0);
          return ((a.hours * rateA) + skimA) - ((b.hours * rateB) + skimB);
        }
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


  // Active filter count (for the Filters button badge)
  const activeFilterCount =
    (transmission !== "all" ? 1 : 0) +
    (klarnaOnly ? 1 : 0) +
    (clearpayOnly ? 1 : 0) +
    (courseType !== "all" ? 1 : 0) +
    (priceRange !== "any" ? 1 : 0) +
    (selectedInstructorId ? 1 : 0);

  const isListMode = viewMode === "list";

  return (
    <MainLayout>
      <SEOHead
        title="Driving Courses Near You | Compare & Book | EveryDriver"
        description="Compare intensive, semi-intensive and weekly driving courses from DVSA-approved instructors near you. Book online with 0% finance options."
      />
      {/* Search Header */}
      <CourseSearchHeader
        title={searchedAreaName ? `Courses in ${searchedAreaName}` : "Find a Course"}
        postcode={postcode}
        setPostcode={setPostcode}
        radius={radius}
        setRadius={setRadius}
        transmission={transmission}
        setTransmission={setTransmission}
        isSearching={isSearching}
        onSearch={() => handleSearch()}
        activeFilter={
          (courseType === "test-in-a-week"
            ? "intensive"
            : courseType === "30"
            ? "semi-intensive"
            : courseType === "10" || courseType === "20"
            ? "weekly"
            : "all") as CourseFilterId
        }
        setActiveFilter={(v) => {
          const next =
            v === "intensive"
              ? "test-in-a-week"
              : v === "semi-intensive"
              ? "30"
              : v === "weekly"
              ? "10"
              : "all";
          setCourseType(next);
          setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (next === "all") params.delete("courseType");
            else params.set("courseType", next);
            return params;
          });
        }}
        onMoreFilters={() => setShowFilters((s) => !s)}
      />

      <section className="border-b bg-background pb-6">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-5xl"
          >

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
                        value={priceRange}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPriceRange(v);
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            if (v === "any") next.delete("priceRange");
                            else next.set("priceRange", v);
                            return next;
                          });
                        }}
                      >
                        <option value="any">Any price</option>
                        <option value="under-500">Under £500</option>
                        <option value="500-1000">£500 – £1,000</option>
                        <option value="over-1000">Over £1,000</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Course Type</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition focus:border-[#0B2545] focus:outline-none focus:ring-2 focus:ring-[#0B2545]/10"
                      value={courseType}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCourseType(v);
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          if (v === "all") next.delete("courseType");
                          else next.set("courseType", v);
                          return next;
                        });
                      }}
                    >
                      <option value="all">All courses</option>
                      <option value="10">10 Hours</option>
                      <option value="20">20 Hours</option>
                      <option value="30">30 Hours</option>
                      <option value="40">40 Hours</option>
                      <option value="test-in-a-week">Test in a Week</option>
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
                hideCounts={isListMode}
              />

              {/* Pass Promise card — list view only */}
              {isListMode && (
                <div
                  className="relative overflow-hidden rounded-xl p-4"
                  style={{
                    background: "linear-gradient(135deg, #0a1936 0%, #1a2f5c 100%)",
                  }}
                >
                  <div
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(217,46,58,0.3) 0%, transparent 70%)",
                    }}
                  />
                  <div className="relative flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
                      style={{ background: "#d92e3a" }}
                    >
                      <ShieldCheck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                        Pass Promise
                      </div>
                      <div style={{ fontSize: 11, color: "#9aa0b5", marginTop: 1 }}>
                        Re-test on us if you don't pass.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Instructors Filter Tile */}
              {availableInstructorsForFilter.length > 0 && (
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className={isListMode ? "text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a7a]" : "text-sm font-semibold"}>
                      {isListMode ? "Your Match" : `Instructors ${userLocation ? "Nearby" : "Available"}`}
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
            {/* Compact header strip — list mode */}
            {isListMode && searchedPostcode && (
              <div
                className="mb-4 flex items-center justify-between rounded-lg bg-white px-4 py-3"
                style={{ borderBottom: "1px solid #e8e8ee" }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      color: "#7a7a7a",
                      textTransform: "uppercase",
                    }}
                  >
                    Courses near
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#0a1936",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {searchedAreaName || searchedPostcode}
                    </span>
                    <span style={{ fontSize: 12, color: "#7a7a7a" }}>
                      {searchedPostcode} · {radius} mi
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearSearch}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-50"
                    style={{ border: "1px solid #d0d0d8", color: "#0a1936" }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Change
                  </button>
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    className="relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                    style={{ background: "#0a1936" }}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span
                        className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                        style={{ background: "#d92e3a" }}
                      >
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Original green banner — hidden in list mode */}
            {!isListMode && searchedPostcode && (
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
                {isListMode ? (
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div
                        className="inline-flex items-center rounded-full p-0.5"
                        style={{ border: "1px solid #e8e8ee", background: "white" }}
                      >
                        {[
                          { value: "all", label: "All" },
                          { value: "manual", label: "Manual" },
                          { value: "automatic", label: "Automatic" },
                        ].map((opt) => {
                          const active = transmission === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setTransmission(opt.value)}
                              className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
                              style={{
                                background: active ? "#0a1936" : "transparent",
                                color: active ? "white" : "#7a7a7a",
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* View toggle */}
                        <div
                          className="inline-flex items-center rounded-full p-0.5"
                          style={{ border: "1px solid #e8e8ee", background: "white" }}
                        >
                          <button
                            onClick={() => setViewMode("list")}
                            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all"
                            style={{
                              background: viewMode === "list" ? "#0a1936" : "transparent",
                              color: viewMode === "list" ? "white" : "#7a7a7a",
                            }}
                            aria-label="List view"
                          >
                            <List className="h-3 w-3" />
                            List
                          </button>
                          <button
                            onClick={() => setViewMode("grid")}
                            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all"
                            style={{
                              background: (viewMode as string) === "grid" ? "#0a1936" : "transparent",
                              color: (viewMode as string) === "grid" ? "white" : "#7a7a7a",
                            }}
                            aria-label="Grid view"
                          >
                            <LayoutGrid className="h-3 w-3" />
                            Grid
                          </button>
                        </div>
                        <label
                          htmlFor="course-sort"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "#7a7a7a",
                            textTransform: "uppercase",
                          }}
                        >
                          Sort
                        </label>
                        <div className="relative">
                          <select
                            id="course-sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-sm font-semibold focus:outline-none"
                            style={{ border: "1px solid #d0d0d8", color: "#0a1936" }}
                          >
                            <option value="nearest" disabled={!userLocation}>Nearest first</option>
                            <option value="soonest">Soonest</option>
                            <option value="price-low">Cheapest</option>
                          </select>
                          <ChevronDown
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                            style={{ width: 14, height: 14, color: "#7a7a7a" }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0a1936", letterSpacing: "-0.02em" }}>
                        {format(selectedDate, "EEEE, d MMMM")}
                      </h2>
                      <p style={{ fontSize: 12, color: "#7a7a7a", marginTop: 2 }}>
                        {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </>
                ) : (
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

                    {/* View toggle */}
                    <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm gap-0.5">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                          (viewMode as string) === "list"
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
                          (viewMode as string) === "grid"
                            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/25"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                        aria-label="Grid view"
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Grid
                      </button>
                    </div>

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
                )}

                {filteredCourses.length > 0 ? (
                  isListMode ? (
                    <>
                      <CourseTableList
                        courses={(isMobile ? filteredCourses.slice(0, mobileVisibleCount) : filteredCourses).map((c) => {
                          const rate = resolvedRateFor(c.instructor) ?? Number(c.instructor.hourly_rate ?? 0);
                          const skim = Number(c.instructor.school_skim_amount ?? 0);
                          return {
                            instructor: c.instructor,
                            hours: c.hours,
                            bookableDate: c.bookableDate,
                            isPopular: c.isPopular,
                            isIntensive: c.isIntensive,
                            distance: c.distance,
                            price: c.hours * rate + skim,
                            discountedPrice: c.discountedPrice,
                          };
                        })}
                      />
                      {isMobile && mobileVisibleCount < filteredCourses.length && (
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
                    </>
                  ) : isMobile ? (
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
                  offerActive={course.offerActive}
                  offerLabel={course.offerLabel}
                  offerPercentOff={course.offerPercentOff}
                  offerStartsAt={course.offerStartsAt}
                  offerEndsAt={course.offerEndsAt}
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
                  offerActive={course.offerActive}
                  offerLabel={course.offerLabel}
                  offerPercentOff={course.offerPercentOff}
                  offerStartsAt={course.offerStartsAt}
                  offerEndsAt={course.offerEndsAt}
                              customFeatures={course.customFeatures}
                              areaName={areaCache[course.instructor.home_postcode?.replace(/\s+/g, "").toUpperCase()] || null}
                              effectiveHourlyRate={resolvedRateFor(course.instructor)}
                              learnerPostcode={searchedPostcode}
                            />
                          </motion.div>
                        ))}
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
                      {(() => {
                        const nextDate = availableDatesInMonth.find(
                          (d) => !selectedDate || !isSameDay(d, selectedDate)
                        );
                        if (!nextDate) return null;
                        return (
                          <Button
                            variant="default"
                            onClick={() => setSelectedDate(nextDate)}
                            className="gap-1.5"
                          >
                            <CalendarIcon className="h-4 w-4" />
                            Try {format(nextDate, "EEE d MMM")}
                          </Button>
                        );
                      })()}
                      {userLocation && parseInt(radius) < 50 && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            const next = parseInt(radius) < 25 ? "25" : "50";
                            setRadius(next);
                            handleSearch(searchedPostcode || postcode);
                          }}
                        >
                          Expand to {parseInt(radius) < 25 ? "25" : "50"} miles
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleResetFilters}>
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
