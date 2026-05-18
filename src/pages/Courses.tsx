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
  hasNetworkPlaceholderAvailabilityOn,
  loadCourseAvailabilitySources,
  type CourseAvailabilitySources,
  type WeeklyHourRow,
  type DateOverrideRow,
  type CalendarEventRow,
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
  is_network_placeholder?: boolean | null;
  placeholder_district?: string | null;
  allowed_lesson_lengths?: number[] | null;
  preferred_lesson_length?: number | null;
  buffer_minutes?: number | null;
  preferred_language?: string | null;
  special_skills?: string | null;
  additional_certifications?: string[] | null;
  adaptations?: string[] | null;
  bsl_signing?: boolean | null;
}

// Smallest lesson the instructor will accept. The booking calendar refuses to
// offer slots shorter than this, so course search must match that bar — otherwise
// a date can advertise as "available" but produce a blank calendar at checkout.
function instructorMinSlotMinutes(instructor: Instructor): number {
  const allowed = (instructor.allowed_lesson_lengths || []).filter((n) => n > 0);
  if (allowed.length > 0) return Math.min(...allowed);
  if (instructor.preferred_lesson_length && instructor.preferred_lesson_length > 0) {
    return instructor.preferred_lesson_length;
  }
  return 60;
}

// Extract UK postcode district (outcode), e.g. "WD17 3AA" -> "WD17".
function extractPostcodeDistrict(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, "").toUpperCase();
  const m = cleaned.match(/^([A-Z]{1,2}[0-9][A-Z0-9]?)/);
  return m ? m[1] : null;
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
                      ? "bg-[#0F2044] text-white shadow-md hover:bg-[#1A3370]"
                      : day.isAvailable
                        ? "bg-[#EAF0FF] text-[#0A0A0A] hover:bg-[#D6DFFF]"
                        : day.isPast
                          ? "text-[#D1D5DB] cursor-not-allowed"
                          : "text-[#D1D5DB] cursor-not-allowed"
                  } ${isToday && !isSelected ? "ring-1 ring-[#0F2044]/40" : ""}`}
                >
                  <span>{format(day.date, "d")}</span>
                  {!hideCounts && day.isAvailable && day.courseCount > 0 && (
                    <span className={`text-[9px] font-semibold leading-none ${
                      isSelected ? "text-white/80" : "text-[#0F2044]"
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
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[#4B5563] border-t pt-3">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#EAF0FF]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#0F2044]" />
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
  
  const [showFilters, setShowFilters] = useState(false);
  const [transmission, setTransmission] = useState(initialTransmission);
  const [klarnaOnly, setKlarnaOnly] = useState(initialKlarna);
  const [clearpayOnly, setClearpayOnly] = useState(initialClearpay);
  const [courseType, setCourseType] = useState(initialCourseType);
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [lessonTimes, setLessonTimes] = useState<"all" | "daytime" | "evenings_weekends">("all");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
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
  const [manualBlocks, setManualBlocks] = useState<ManualBlockRow[]>([]);
  const [bookedLessonGeo, setBookedLessonGeo] = useState<CourseAvailabilitySources["bookedLessonGeo"]>([]);

  const availabilitySources: CourseAvailabilitySources = useMemo(() => ({
    workingHours: workingHourRows,
    availabilityWindows: availabilityWindowRows,
    overrides: overrideRows,
    calendarEvents,
    manualBlocks,
    bookedLessonGeo,
  }), [workingHourRows, availabilityWindowRows, overrideRows, calendarEvents, manualBlocks, bookedLessonGeo]);

  const monthOptions = useMemo(() => getMonthOptions(), []);
  
  // Track if we've done initial search from URL
  const hasSearchedFromUrl = useRef(false);

  // Helper to check if a date has availability (uses shared resolver including
  // Google Calendar busy events + existing scheduled lessons + manual blocks).
  // Each instructor's check uses their own minimum lesson length so search
  // matches what the booking calendar can actually offer.
  const isDateAvailable = useCallback((day: Date, instructorsList: Instructor[], src: CourseAvailabilitySources, candidatePickup?: { lat: number; lng: number } | null) => {
    return instructorsList.some((instructor) =>
      hasInstructorAvailabilityOn(instructor, day, src, {
        minFreeMinutes: instructor.is_network_placeholder ? undefined : instructorMinSlotMinutes(instructor),
        candidatePickup: candidatePickup ?? undefined,
      }),
    );
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
    const searchedDistrict = extractPostcodeDistrict(searchedPostcode);
    if (!userLocation && !searchedDistrict) return instructors;

    const radiusMiles = parseInt(radius);

    return instructors.filter((instructor) => {
      if (instructor.is_network_placeholder) {
        return !!searchedDistrict && instructor.placeholder_district === searchedDistrict;
      }
      if (!userLocation) return false;
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
  }, [instructors, userLocation, radius, geoCache, searchedPostcode]);

  const relevantInstructors = useMemo(() => {
    const base = (userLocation || searchedPostcode) ? instructorsInArea : instructors;
    return base.filter((i) => instructorIdsWithCourses.has(i.id));
  }, [instructors, instructorsInArea, instructorIdsWithCourses, userLocation, searchedPostcode]);

  // Get available dates for the selected month
  const availableDatesInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const today = startOfDay(new Date());

    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Mock network instructors use fixed enquiry hours:
    // Mon-Fri 08:00-19:00, Sat/Sun 09:00-12:00.
    const realInArea = relevantInstructors.filter((i) => !i.is_network_placeholder);
    const placeholdersOnly =
      !!(userLocation || searchedPostcode) && realInArea.length === 0 && relevantInstructors.length > 0;

    return allDays.filter((day) => {
      if (isBefore(day, today)) return false;
      if (placeholdersOnly) return hasNetworkPlaceholderAvailabilityOn(day);
      return realInArea.some((instructor) =>
        hasInstructorAvailabilityOn(instructor, day, availabilitySources, {
          minFreeMinutes: instructorMinSlotMinutes(instructor),
          candidatePickup: userLocation ?? undefined,
        })
      );
    });
  }, [selectedMonth, relevantInstructors, availabilitySources, userLocation, searchedPostcode]);

  // Calculate course counts for each available date in the month
  const courseCountsInMonth = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    for (const day of availableDatesInMonth) {
      const dateStr = format(day, "yyyy-MM-dd");
      let count = 0;
      for (const instructor of relevantInstructors) {
        if (!instructor.is_network_placeholder && !hasInstructorAvailabilityOn(instructor, day, availabilitySources, { minFreeMinutes: instructorMinSlotMinutes(instructor), candidatePickup: userLocation ?? undefined })) continue;
        const offeredCourses = instructorCourses.filter((c) => c.instructor_id === instructor.id);
        for (const hours of DISPLAY_HOURS) {
          if (offeredCourses.find((c) => c.course_hours === hours)) count++;
        }
      }
      counts[dateStr] = count;
    }
    return counts;
  }, [availableDatesInMonth, relevantInstructors, instructorCourses, availabilitySources, userLocation]);

  // Generate courses for the selected date
  const coursesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const courses: CourseWithInstructor[] = [];
    for (const instructor of relevantInstructors) {
      if (!instructor.is_network_placeholder && !hasInstructorAvailabilityOn(instructor, selectedDate, availabilitySources, { minFreeMinutes: instructorMinSlotMinutes(instructor), candidatePickup: userLocation ?? undefined })) continue;
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
  }, [selectedDate, relevantInstructors, instructorCourses, courseTemplates, availabilitySources, userLocation]);

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
      const district = extractPostcodeDistrict(cleanPostcode);
      let result = await geocodePostcodes([cleanPostcode]);
      let location = result.geoCache[cleanPostcode];
      let areaName = result.areaCache[cleanPostcode];

      // Fallback: geocode the outcode so placeholder-only districts still work.
      if (!location && district && district !== cleanPostcode) {
        const districtResult = await geocodePostcodes([district]);
        location = districtResult.geoCache[district] || null;
        areaName = areaName || districtResult.areaCache[district] || null;
        result = { geoCache: { ...result.geoCache, ...districtResult.geoCache }, areaCache: { ...result.areaCache, ...districtResult.areaCache } };
      }

      if (!location && !district) {
        toast({ title: "Postcode not found", description: "Please check your postcode", variant: "destructive" });
        return;
      }

      if (location) setUserLocation(location); else setUserLocation(null);
      setSearchedPostcode(cleanPostcode);
      setSearchedAreaName(areaName || null);
      setSortBy(location ? "nearest" : "soonest");
      setSearchParams({ postcode: cleanPostcode });

      // Jump to the next available date for instructors in the searched area
      const fullGeoCache = { ...geoCache, ...result.geoCache };
      const radiusMiles = parseInt(radius);
      const instructorIds = new Set(
        instructorCourses.filter((c) => c.is_active).map((c) => c.instructor_id)
      );

      const instructorsNearby = instructors.filter((instructor) => {
        if (!instructorIds.has(instructor.id)) return false;

        if (instructor.is_network_placeholder) {
          return !!district && instructor.placeholder_district === district;
        }

        if (!location) return false;

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

      // If only placeholders match, treat today as the first "available" date —
      // they're enquiry-only so the standard availability resolver returns nothing.
      const hasRealNearby = instructorsNearby.some((i) => !i.is_network_placeholder);
      const hasPlaceholderNearby = instructorsNearby.some((i) => i.is_network_placeholder);

      let firstAvailable = findFirstAvailableDate(instructorsNearby, availabilitySources);
      let usedFallback = false;

      // Auto-expand radius once if nothing nearby. If mock instructors match
      // the searched district, keep the result local and show those instead.
      if (!firstAvailable && instructorsNearby.length === 0 && !hasPlaceholderNearby && radiusMiles < 25) {
        console.warn(`[Courses] No instructors within ${radiusMiles}mi of ${cleanPostcode} – expanding to 25mi`);
        setRadius("25");
      }

      // Final fallback: search all instructors with active courses so the grid still renders
      if (!firstAvailable && !hasPlaceholderNearby) {
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
      } else if (hasPlaceholderNearby && !hasRealNearby) {
        // Placeholders are enquiry-only and have no working_hours rows, so the
        // standard availability resolver returns nothing. Pick the first date
        // in the visible months where the placeholder enquiry window applies.
        let picked: { date: Date; month: string } | null = null;
        const today = startOfDay(new Date());
        outer: for (const monthOption of monthOptions) {
          const [yr, mo] = monthOption.value.split("-").map(Number);
          const mStart = startOfMonth(new Date(yr, mo - 1));
          const mEnd = endOfMonth(mStart);
          if (isBefore(mEnd, today)) continue;
          const searchStart = isAfter(mStart, today) ? mStart : today;
          for (const day of eachDayOfInterval({ start: searchStart, end: mEnd })) {
            if (hasNetworkPlaceholderAvailabilityOn(day)) {
              picked = { date: day, month: monthOption.value };
              break outer;
            }
          }
        }
        if (picked) {
          setSelectedMonth(picked.month);
          setSelectedDate(picked.date);
        } else {
          setSelectedDate(null);
        }
      } else {
        setSelectedDate(null);
      }

      toast({
        title: "Location found!",
        description: `Showing courses near ${areaName || cleanPostcode}`,
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

      // PostgREST enforces a server-side max-rows of 1000, so `limit`/`range`
      // alone cannot return more. Paginate explicitly so districts with many
      // network placeholders aren't silently truncated.
      const PAGE = 1000;
      const fetchAll = async <T,>(
        build: () => any,
      ): Promise<{ data: T[]; error: any }> => {
        const all: T[] = [];
        let from = 0;
        while (true) {
          const { data, error } = await build().range(from, from + PAGE - 1);
          if (error) return { data: all, error };
          const rows = (data || []) as T[];
          all.push(...rows);
          if (rows.length < PAGE) break;
          from += PAGE;
          if (from > 100000) break; // hard safety stop
        }
        return { data: all, error: null };
      };

      const [instructorsRes, coursesRes, templatesRes] = await Promise.all([
        fetchAll<any>(() => {
          const q = supabase.from("public_instructors").select("*").eq("is_active", true);
          return whitelabelSlug ? q.eq("app_slug", whitelabelSlug) : q;
        }),
        fetchAll<any>(() =>
          supabase.from("instructor_courses").select("*").eq("is_active", true),
        ),
        supabase
          .from("course_templates")
          .select("course_hours, course_name, default_image_url, is_popular, features, is_intensive")
          .eq("is_active", true),
      ]);

      if (instructorsRes.error) throw instructorsRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (templatesRes.error) throw templatesRes.error;

      const loadedInstructors = instructorsRes.data || [];
      const instructorIds = loadedInstructors.map((i: any) => i.id).filter(Boolean);
      const realInstructorIds = loadedInstructors
        .filter((i: any) => !i.is_network_placeholder)
        .map((i: any) => i.id)
        .filter(Boolean);
      const firstMonth = startOfDay(new Date());
      const lastMonthOption = monthOptions[monthOptions.length - 1];
      const [lastYear, lastMonth] = lastMonthOption.value.split("-").map(Number);
      const rangeEnd = endOfMonth(new Date(lastYear, lastMonth - 1));

      const loadedAvailabilitySources = await loadCourseAvailabilitySources(
        supabase as any,
        realInstructorIds,
        firstMonth,
        rangeEnd,
      );

      const loadedWorkingHourRows = loadedAvailabilitySources.workingHours;
      const loadedAvailabilityWindowRows = loadedAvailabilitySources.availabilityWindows;
      const loadedOverrides = loadedAvailabilitySources.overrides;
      const loadedCalendarEvents = loadedAvailabilitySources.calendarEvents;
      const loadedManualBlocks = loadedAvailabilitySources.manualBlocks;

      setInstructors(loadedInstructors);
      setInstructorCourses(coursesRes.data || []);
      setCourseTemplates(templatesRes.data || []);
      setWorkingHourRows(loadedWorkingHourRows);
      setAvailabilityWindowRows(loadedAvailabilityWindowRows);
      setOverrideRows(loadedOverrides);
      setCalendarEvents(loadedCalendarEvents);
      setManualBlocks(loadedManualBlocks);
      setBookedLessonGeo(loadedAvailabilitySources.bookedLessonGeo || []);

      // Auto-advance to first available date
      const firstAvailable = findFirstAvailableDate(loadedInstructors, loadedAvailabilitySources);
      if (firstAvailable) {
        setSelectedMonth(firstAvailable.month);
        setSelectedDate(firstAvailable.date);
      }

      // Geocode all instructor postcodes
      const allPostcodes = (instructorsRes.data || [])
        .filter((i: any) => !i.is_network_placeholder)
        .map((i: any) => (i.home_postcode || "").replace(/\s+/g, "").toUpperCase())
        .filter(Boolean);
      await geocodePostcodes(allPostcodes);

      // Load postcode rate overrides for all visible instructors (single batched query)
      if (realInstructorIds.length) {
        const { data: rateRows } = await supabase
          .from("instructor_postcode_rates")
          .select("instructor_id, outward_code, hourly_rate")
          .in("instructor_id", realInstructorIds);
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

  const preFilteredCourses = coursesWithDistance
    .filter((course) => {
      const isPlaceholder = !!course.instructor.is_network_placeholder;

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

      // Placeholders bypass radius (matched by district instead).
      if (!isPlaceholder && userLocation && course.distance !== undefined) {
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
        if (!rate) {
          // Placeholders rarely have a published rate; don't drop them on price filter.
          if (!isPlaceholder) return false;
        } else {
          const computed = course.discountedPrice ?? (course.hours * rate + skim);
          if (priceRange === "under-500" && computed >= 500) return false;
          if (priceRange === "500-1000" && (computed < 500 || computed > 1000)) return false;
          if (priceRange === "over-1000" && computed <= 1000) return false;
        }
      }

      // Lesson times filter (uses instructor working hours; placeholders bypass)
      if (lessonTimes !== "all" && !isPlaceholder) {
        const rows = workingHourRows.filter(
          (r) => r.instructor_id === course.instructor.id && r.is_active !== false,
        );
        const matches = rows.some((r) => {
          const start = r.start_time || "00:00";
          const end = r.end_time || "00:00";
          const startMin = parseInt(start.slice(0, 2)) * 60 + parseInt(start.slice(3, 5) || "0");
          const endMin = parseInt(end.slice(0, 2)) * 60 + parseInt(end.slice(3, 5) || "0");
          if (lessonTimes === "daytime") {
            // Mon-Fri (1-5) with overlap of 08:00-17:00
            return r.day_of_week >= 1 && r.day_of_week <= 5 && startMin < 17 * 60 && endMin > 8 * 60;
          }
          // evenings_weekends: weekend day OR weekday ending after 17:00
          const isWeekend = r.day_of_week === 0 || r.day_of_week === 6;
          return isWeekend || endMin > 17 * 60;
        });
        if (!matches) return false;
      }

      // Instructor skills filter (matches additional_certifications or special_skills)
      if (selectedSkills.length > 0) {
        const haystack = [
          ...(course.instructor.additional_certifications || []),
          ...((course.instructor.special_skills || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)),
        ]
          .join(" | ")
          .toLowerCase();
        const matched = selectedSkills.every((skill) => haystack.includes(skill.toLowerCase()));
        if (!matched) return false;
      }

      // Languages filter
      if (selectedLanguages.length > 0) {
        const lang = (course.instructor.preferred_language || "").toLowerCase();
        if (!selectedLanguages.map((l) => l.toLowerCase()).includes(lang)) return false;
      }

      return true;
    });

  // Placeholders only show as a fallback when no real courses are visible
  // for the searched district.
  const filteredCourses = (() => {
    const searchedDistrict = extractPostcodeDistrict(searchedPostcode);
    const real = preFilteredCourses.filter((c) => !c.instructor.is_network_placeholder);
    const placeholders = preFilteredCourses.filter((c) => !!c.instructor.is_network_placeholder);
    const visiblePlaceholders =
      searchedDistrict && real.length === 0
        ? placeholders.filter((c) => c.instructor.placeholder_district === searchedDistrict)
        : [];
    const combined = [...real, ...visiblePlaceholders];

    return combined.sort((a, b) => {
      const aPlace = !!a.instructor.is_network_placeholder;
      const bPlace = !!b.instructor.is_network_placeholder;
      if (aPlace && !bPlace) return 1;
      if (!aPlace && bPlace) return -1;

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
  })();
  
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


  // Build dynamic skill/language option lists from the instructors currently
  // visible in the area (so we never offer a filter that has zero matches).
  const filterOptionPool = useMemo(() => {
    const base = relevantInstructors.filter((i) => !i.is_network_placeholder);
    const skills = new Set<string>();
    const languages = new Set<string>();
    for (const i of base) {
      for (const cert of i.additional_certifications || []) {
        if (cert && cert.trim()) skills.add(cert.trim());
      }
      for (const s of (i.special_skills || "").split(",")) {
        const v = s.trim();
        if (v) skills.add(v);
      }
      const lang = (i.preferred_language || "").trim();
      if (lang) languages.add(lang);
    }
    return {
      skills: Array.from(skills).sort((a, b) => a.localeCompare(b)),
      languages: Array.from(languages).sort((a, b) => a.localeCompare(b)),
    };
  }, [relevantInstructors]);

  // Active filter count (for the Filters button badge)
  const activeFilterCount =
    (transmission !== "all" ? 1 : 0) +
    (klarnaOnly ? 1 : 0) +
    (clearpayOnly ? 1 : 0) +
    (courseType !== "all" ? 1 : 0) +
    (priceRange !== "any" ? 1 : 0) +
    (selectedInstructorId ? 1 : 0) +
    (lessonTimes !== "all" ? 1 : 0) +
    (selectedSkills.length > 0 ? 1 : 0) +
    (selectedLanguages.length > 0 ? 1 : 0);

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
        {!searchedPostcode ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md py-24 text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Enter your postcode</h2>
            <p className="mt-3 text-muted-foreground">
              Enter your postcode above to see available driving courses and instructors in your area.
            </p>
          </motion.div>
        ) : (
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
                  className="relative overflow-hidden p-4"
                  style={{
                    background: "#0F2044",
                    borderRadius: 4,
                  }}
                >
                  <div
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
                    }}
                  />
                  <div className="relative flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
                      style={{ background: "rgba(255,255,255,0.18)" }}
                    >
                      <ShieldCheck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>
                        Pass Promise
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
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
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: "0.08em",
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                    }}
                  >
                    Courses near
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: "#0A0A0A",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {searchedAreaName || searchedPostcode}
                    </span>
                    <span style={{ fontSize: 14, color: "#4B5563" }}>
                      {searchedPostcode} · {radius} mi
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearSearch}
                    className="inline-flex items-center gap-1.5 bg-white text-sm font-medium transition-colors hover:!border-[#0F2044]"
                    style={{ border: "1px solid #E5E7EB", color: "#0A0A0A", padding: "10px 18px", borderRadius: 4 }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Change
                  </button>
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    className="relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                    style={{ background: "#0F2044" }}
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
                className="mb-6 flex items-center justify-between rounded-xl border border-[#0F2044]/20 bg-[#EAF0FF] px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, delay: 0.3, times: [0, 0.5, 1] }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F2044] text-white shadow-md"
                  >
                    <MapPin className="h-5 w-5" />
                  </motion.div>
                  <div>
                    <p className="text-[13px] font-medium text-[#4B5563]">Showing results for</p>
                    <h2 className="text-base font-medium text-[#0A0A0A]">
                      {searchedPostcode}{searchedAreaName ? `, ${searchedAreaName}` : ''}
                    </h2>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSearch}
                  className="gap-1.5 border-[#E5E7EB] bg-white text-[13px] text-[#0A0A0A] hover:!border-[#0F2044] hover:!bg-white"
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
                                background: active ? "#0F2044" : "transparent",
                                color: active ? "white" : "#0A0A0A",
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
                              background: viewMode === "list" ? "#0F2044" : "transparent",
                              color: viewMode === "list" ? "white" : "#0A0A0A",
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
                              background: (viewMode as string) === "grid" ? "#0F2044" : "transparent",
                              color: (viewMode as string) === "grid" ? "white" : "#0A0A0A",
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
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0F2044")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                            className="appearance-none bg-white text-sm font-medium focus:outline-none transition-colors"
                            style={{ border: "1px solid #E5E7EB", color: "#0A0A0A", padding: "10px 32px 10px 16px", borderRadius: 4 }}
                          >
                            <option value="nearest" disabled={!userLocation}>Nearest first</option>
                            <option value="soonest">Soonest</option>
                            <option value="price-low">Cheapest</option>
                          </select>
                          <ChevronDown
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                            style={{ width: 14, height: 14, color: "#9CA3AF" }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.02em" }}>
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
        )}
      </section>
    </MainLayout>
  );
}
