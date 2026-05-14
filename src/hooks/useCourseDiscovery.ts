import { useState, useEffect, useMemo, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isSameDay, isAfter, isBefore, startOfDay, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  hasInstructorAvailabilityOn,
  loadCourseAvailabilitySources,
  type CourseAvailabilitySources,
  type InstructorLite,
} from "@/lib/courseAvailability";

export type SortOption = "soonest" | "price-low" | "nearest";
export type CourseTypeFilter = "all" | "intensive" | "semi-intensive";

export interface Instructor {
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
  buffer_minutes?: number | null;
}

export interface InstructorCourse {
  instructor_id: string;
  course_hours: number;
  is_active: boolean;
  course_image_url: string | null;
  discounted_price: number | null;
  custom_features: string[] | null;
}

export interface CourseTemplate {
  course_hours: number;
  course_name: string;
  default_image_url: string | null;
  is_popular: boolean | null;
  is_intensive: boolean | null;
  features: string[] | null;
}

export interface WorkingHours {
  instructor_id: string;
  day_of_week: number;
  is_active: boolean;
}

export interface DateOverride {
  instructor_id: string;
  override_date: string;
  override_end_date: string | null;
  is_available: boolean;
}

export interface CourseWithInstructor {
  instructor: Instructor;
  hours: number;
  bookableDate: Date;
  courseImageUrl: string | null;
  isPopular: boolean;
  availableFrom: string | null;
  distance?: number;
  courseName: string;
  features: string[] | null;
  isIntensive: boolean;
  discountedPrice: number | null;
  customFeatures: string[] | null;
  isPremium?: boolean;
  placementType?: string;
  priorityScore?: number;
}

interface GeoCache {
  [postcode: string]: { lat: number; lng: number } | null;
}

// Hour buckets are no longer hard-coded — they are derived dynamically from
// course_templates + instructor_courses so any new course an instructor offers
// flows through automatically. The intensive/semi-intensive split uses
// course_templates.is_intensive as the single source of truth.

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

export function getMonthOptions(): { value: string; label: string }[] {
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

interface AreaCache {
  [postcode: string]: string | null;
}

export function useCourseDiscovery(courseTypeFilter: CourseTypeFilter = "all", instructorId?: string | null, initialPostcode?: string) {
  const [postcode, setPostcode] = useState(initialPostcode || "");
  const [radius, setRadius] = useState("10");
  const [transmission, setTransmission] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("soonest");
  const [geoCache, setGeoCache] = useState<GeoCache>({});
  const [areaCache, setAreaCache] = useState<AreaCache>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchedPostcode, setSearchedPostcode] = useState<string | null>(null);
  const [searchedAreaName, setSearchedAreaName] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<InstructorCourse[]>([]);
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([]);
  const [sources, setSources] = useState<CourseAvailabilitySources>({
    workingHours: [],
    availabilityWindows: [],
    overrides: [],
    calendarEvents: [],
    scheduledLessons: [],
    manualBlocks: [],
  });
  const [premiumPlacements, setPremiumPlacements] = useState<{ instructor_id: string; placement_type: string; priority_score: number }[]>([]);


  const monthOptions = useMemo(() => getMonthOptions(), []);

  // Build the candidate hour list dynamically from course_templates +
  // instructor_courses. The intensive/semi-intensive split is driven by
  // course_templates.is_intensive — no hard-coded buckets.
  const displayHours = useMemo(() => {
    const intensiveSet = new Set<number>();
    const semiSet = new Set<number>();
    const allSet = new Set<number>();

    for (const t of courseTemplates) {
      allSet.add(t.course_hours);
      if (t.is_intensive) intensiveSet.add(t.course_hours);
      else semiSet.add(t.course_hours);
    }
    // Include any hours an instructor actually offers, even if no template row
    // exists (default to semi-intensive bucket).
    for (const c of instructorCourses) {
      allSet.add(c.course_hours);
      if (!intensiveSet.has(c.course_hours) && !semiSet.has(c.course_hours)) {
        semiSet.add(c.course_hours);
      }
    }

    let pool: Set<number>;
    if (instructorId) {
      pool = new Set(
        instructorCourses
          .filter((c) => c.instructor_id === instructorId)
          .map((c) => c.course_hours),
      );
    } else if (courseTypeFilter === "intensive") {
      pool = intensiveSet;
    } else if (courseTypeFilter === "semi-intensive") {
      pool = semiSet;
    } else {
      pool = allSet;
    }
    return Array.from(pool).sort((a, b) => a - b);
  }, [courseTypeFilter, instructorId, instructorCourses, courseTemplates]);

  // Single source of truth: delegates to courseAvailability resolver, which
  // honours working hours, date overrides, manual blocks, scheduled lessons,
  // Google Calendar busy events, and instructor buffer + travel padding.
  const isDateAvailable = useCallback((day: Date, instructorsList: Instructor[], src: CourseAvailabilitySources) => {
    const today = startOfDay(new Date());
    if (isBefore(day, today)) return false;
    return instructorsList.some((instructor) =>
      hasInstructorAvailabilityOn(instructor as InstructorLite, day, src),
    );
  }, []);

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

  const geocodePostcodes = useCallback(async (postcodes: string[]): Promise<{ geoCache: GeoCache; areaCache: AreaCache }> => {
    const uncached = postcodes.filter((p) => !(p in geoCache));
    if (uncached.length === 0) return { geoCache, areaCache };

    try {
      const { data, error } = await supabase.functions.invoke("geocode-postcode", {
        body: { postcodes: uncached },
      });

      if (error) throw error;

      const newGeoCache: GeoCache = { ...geoCache };
      const newAreaCache: AreaCache = { ...areaCache };
      
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let instructorsQuery = supabase.from("public_instructors").select("*").eq("is_active", true);
      if (instructorId) {
        instructorsQuery = instructorsQuery.eq("id", instructorId);
      }
      let coursesQuery = supabase.from("instructor_courses").select("*").eq("is_active", true);
      if (instructorId) {
        coursesQuery = coursesQuery.eq("instructor_id", instructorId);
      }

      const [instructorsRes, coursesRes, templatesRes, premiumRes] = await Promise.all([
        instructorsQuery,
        coursesQuery,
        supabase.from("course_templates").select("course_hours, course_name, default_image_url, is_popular, is_intensive, features").eq("is_active", true),
        supabase.from("instructor_premium_placements").select("instructor_id, placement_type, priority_score, expires_at").eq("is_active", true),
      ]);

      if (instructorsRes.error) throw instructorsRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (templatesRes.error) throw templatesRes.error;

      const loadedInstructors = instructorsRes.data || [];
      setInstructors(loadedInstructors);
      setInstructorCourses(coursesRes.data || []);
      setCourseTemplates(templatesRes.data || []);

      // Load all six availability sources for every instructor across the
      // search horizon (today + 18 months). Single round-trip — both calendar
      // dots and the per-day course list use the result so display is always
      // consistent with the booking-time guard in create-booking.
      const fromDate = new Date();
      const toDate = addMonths(fromDate, 18);
      const newSources = await loadCourseAvailabilitySources(
        supabase as any,
        loadedInstructors.map((i) => i.id),
        fromDate,
        toDate,
      );
      setSources(newSources);

      // Store premium placements (filter expired)
      const now = new Date().toISOString();
      const activePlacements = (premiumRes.data || []).filter(
        (p) => !p.expires_at || p.expires_at > now
      );
      setPremiumPlacements(activePlacements);

      const firstAvailable = findFirstAvailableDate(loadedInstructors, newSources);
      if (firstAvailable) {
        setSelectedMonth(firstAvailable.month);
        setSelectedDate(firstAvailable.date);
      }

      const allPostcodes = (instructorsRes.data || []).map((i) => i.home_postcode.replace(/\s+/g, "").toUpperCase());
      await geocodePostcodes(allPostcodes);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [findFirstAvailableDate, geocodePostcodes, instructorId]);

  useEffect(() => {
    // If instructorId is null, the caller wants to filter by instructor but it hasn't loaded yet — skip
    if (instructorId === null) return;
    fetchData();
  }, [instructorId]);

  const handleSearch = async () => {
    if (!postcode.trim()) {
      toast({ title: "Please enter a postcode", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    try {
      const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
      const result = await geocodePostcodes([cleanPostcode]);
      const location = result.geoCache[cleanPostcode];
      const areaName = result.areaCache[cleanPostcode];

      if (location) {
        setUserLocation(location);
        setSearchedPostcode(cleanPostcode);
        setSearchedAreaName(areaName || null);
        setSortBy("nearest");
        
        // Find instructors in the searched area using the full geoCache (includes previously geocoded instructor postcodes)
        const radiusMiles = parseInt(radius);
        const fullGeoCache = { ...geoCache, ...result.geoCache };
        
        const instructorsNearby = instructors.filter((instructor) => {
          const instructorPostcode = instructor.home_postcode.replace(/\s+/g, "").toUpperCase();
          const instructorLocation = fullGeoCache[instructorPostcode];
          
          if (!instructorLocation) return false;
          
          const distance = calculateDistance(
            location.lat,
            location.lng,
            instructorLocation.lat,
            instructorLocation.lng
          );
          
          return distance <= radiusMiles;
        });

        // If instructors found in area, jump to their first available date
        if (instructorsNearby.length > 0) {
          const firstAvailable = findFirstAvailableDate(instructorsNearby, sources);
          if (firstAvailable) {
            setSelectedMonth(firstAvailable.month);
            setSelectedDate(firstAvailable.date);
          }
        }
        
        toast({ title: "Location found!", description: `Showing courses near ${areaName || cleanPostcode}` });
      } else {
        toast({ title: "Postcode not found", description: "Please check your postcode", variant: "destructive" });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setPostcode("");
    setUserLocation(null);
    setSearchedPostcode(null);
    setSearchedAreaName(null);
    setSortBy("soonest");
    
    // Jump back to first available date for all instructors
    const firstAvailable = findFirstAvailableDate(instructors, sources);
    if (firstAvailable) {
      setSelectedMonth(firstAvailable.month);
      setSelectedDate(firstAvailable.date);
    }
  };

  // Filter instructors by location when a postcode search is active
  const instructorsInArea = useMemo(() => {
    if (!userLocation) return instructors;
    
    const radiusMiles = parseInt(radius);
    
    return instructors.filter((instructor) => {
      const instructorPostcode = instructor.home_postcode.replace(/\s+/g, "").toUpperCase();
      const instructorLocation = geoCache[instructorPostcode];
      
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

  // Upcoming available dates across the next ~6 months (cap 12 dates).
  // Delegates to hasInstructorAvailabilityOn so calendar dots match the
  // booking-time guard exactly: working hours, overrides, manual blocks,
  // scheduled lessons, Google Calendar events, and buffer/travel padding.
  const nextAvailableDates = useMemo(() => {
    const today = startOfDay(new Date());
    const relevantInstructors = userLocation ? instructorsInArea : instructors;
    if (relevantInstructors.length === 0) return [] as Date[];

    const results: Date[] = [];
    const monthsToScan = monthOptions.slice(0, 6);

    for (const monthOption of monthsToScan) {
      const [year, month] = monthOption.value.split("-").map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(monthStart);
      if (isBefore(monthEnd, today)) continue;
      const searchStart = isAfter(monthStart, today) ? monthStart : today;
      const days = eachDayOfInterval({ start: searchStart, end: monthEnd });

      for (const day of days) {
        const isAvailable = relevantInstructors.some((instructor) =>
          hasInstructorAvailabilityOn(instructor as InstructorLite, day, sources),
        );
        if (isAvailable) {
          results.push(day);
          if (results.length >= 12) return results;
        }
      }
    }
    return results;
  }, [instructors, instructorsInArea, userLocation, sources, monthOptions]);

  const availableDatesInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const today = startOfDay(new Date());

    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const relevantInstructors = userLocation ? instructorsInArea : instructors;

    return allDays.filter((day) => {
      if (isBefore(day, today)) return false;
      return relevantInstructors.some((instructor) =>
        hasInstructorAvailabilityOn(instructor as InstructorLite, day, sources),
      );
    });
  }, [selectedMonth, instructors, instructorsInArea, sources, userLocation]);

  // Auto-jump the calendar to the first month that has availability for the
  // currently scoped instructors (whitelabel partner or location search).
  // Only triggers when the selected month is empty but a later month has dates.
  useEffect(() => {
    if (loading) return;
    const relevantInstructors = userLocation ? instructorsInArea : instructors;
    if (relevantInstructors.length === 0) return;
    if (availableDatesInMonth.length > 0) return;
    if (nextAvailableDates.length === 0) return;

    const target = nextAvailableDates[0];
    const targetMonth = format(target, "yyyy-MM");
    if (targetMonth === selectedMonth) return;

    setSelectedMonth(targetMonth);
    setSelectedDate(target);
  }, [loading, availableDatesInMonth, nextAvailableDates, selectedMonth, instructors, instructorsInArea, userLocation]);

  const coursesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    const courses: CourseWithInstructor[] = [];

    for (const instructor of instructors) {
      // Single source of truth: same resolver as calendar dots and the
      // booking-time guard. Honours overrides, blocks, GCal, lessons, buffers.
      if (!hasInstructorAvailabilityOn(instructor as InstructorLite, selectedDate, sources)) {
        continue;
      }

      const offeredCourses = instructorCourses.filter(
        (c) => c.instructor_id === instructor.id
      );

      for (const hours of displayHours) {
        const courseData = offeredCourses.find((c) => c.course_hours === hours);
        const template = courseTemplates.find((t) => t.course_hours === hours);

        if (courseTypeFilter === "intensive" && template && !template.is_intensive) continue;
        if (courseTypeFilter === "semi-intensive" && template && template.is_intensive) continue;

        if (courseData) {
          const placement = premiumPlacements.find((p) => p.instructor_id === instructor.id);
          courses.push({
            instructor,
            hours,
            bookableDate: selectedDate,
            courseImageUrl: courseData.course_image_url || template?.default_image_url || null,
            isPopular: template?.is_popular || false,
            availableFrom: instructor.available_from,
            distance: undefined,
            courseName: template?.course_name || `${hours} Hour Course`,
            features: template?.features || null,
            isIntensive: template?.is_intensive || false,
            discountedPrice: courseData.discounted_price || null,
            customFeatures: courseData.custom_features || null,
            isPremium: !!placement,
            placementType: placement?.placement_type,
            priorityScore: placement?.priority_score,
          });
        }
      }
    }

    return courses;
  }, [selectedDate, instructors, instructorCourses, courseTemplates, sources, displayHours, courseTypeFilter, premiumPlacements]);

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
      // Premium instructors always come first
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      if (a.isPremium && b.isPremium) {
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      }

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

  return {
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
    nextAvailableDates,
    filteredCourses,
    handleSearch,
    searchedPostcode,
    searchedAreaName,
    clearSearch,
    areaCache,
  };
}
