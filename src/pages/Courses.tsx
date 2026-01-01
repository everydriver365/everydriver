import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { DynamicCourseCard } from "@/components/DynamicCourseCard";
import { supabase } from "@/integrations/supabase/client";

// Standard course hours to display
const DISPLAY_HOURS = [10, 20, 30, 40, 28]; // 28 = Test in a Week

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
}

interface InstructorCourse {
  instructor_id: string;
  course_hours: number;
  is_active: boolean;
  course_image_url: string | null;
}

interface CourseWithInstructor {
  instructor: Instructor;
  hours: number;
  nextAvailable: Date | null;
  courseImageUrl: string | null;
}

export default function Courses() {
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState("10");
  const [showFilters, setShowFilters] = useState(false);
  const [transmission, setTransmission] = useState("all");
  const [courses, setCourses] = useState<CourseWithInstructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Fetch active instructors
      const { data: instructors, error: instructorsError } = await supabase
        .from("instructors")
        .select("*")
        .eq("is_active", true);

      if (instructorsError) throw instructorsError;

      // Fetch instructor courses
      const { data: instructorCourses, error: coursesError } = await supabase
        .from("instructor_courses")
        .select("*")
        .eq("is_active", true);

      if (coursesError) throw coursesError;

      // Build course list based on instructor offerings
      const courseList: CourseWithInstructor[] = [];

      for (const instructor of instructors || []) {
        // Get courses this instructor offers
        const offeredCourses = (instructorCourses || []).filter(
          (c) => c.instructor_id === instructor.id
        );

        // For each course hour the instructor offers, create a course card
        for (const hours of DISPLAY_HOURS) {
          const courseData = offeredCourses.find((c) => c.course_hours === hours);
          
          if (courseData) {
            courseList.push({
              instructor,
              hours,
              nextAvailable: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
              courseImageUrl: courseData.course_image_url || null,
            });
          }
        }
      }

      // Sort by next available date
      courseList.sort((a, b) => {
        if (!a.nextAvailable) return 1;
        if (!b.nextAvailable) return -1;
        return a.nextAvailable.getTime() - b.nextAvailable.getTime();
      });

      setCourses(courseList);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (transmission !== "all") {
      const carType = course.instructor.car_type.toLowerCase();
      if (transmission === "manual" && !carType.includes("manual") && carType !== "both") {
        return false;
      }
      if (transmission === "automatic" && !carType.includes("automatic") && carType !== "both") {
        return false;
      }
    }
    return true;
  });

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
              <Button variant="accent" size="lg" className="h-11">
                <Search className="mr-2 h-4 w-4" />
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
              <span className="text-sm text-muted-foreground">
                {loading ? "Loading..." : `${filteredCourses.length} courses available`}
              </span>
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

      {/* Results */}
      <section className="container py-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[420px] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={`${course.instructor.id}-${course.hours}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DynamicCourseCard
                  instructor={course.instructor}
                  hours={course.hours}
                  nextAvailable={course.nextAvailable}
                  courseImageUrl={course.courseImageUrl}
                  isPopular={course.hours === 30 || course.hours === 40}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <h2 className="text-xl font-semibold">No courses available</h2>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
