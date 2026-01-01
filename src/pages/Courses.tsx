import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { CourseCard } from "@/components/CourseCard";

const mockCourses = [
  {
    id: 1,
    title: "40 Hour Intensive Course",
    instructor: "John Smith",
    price: 1800,
    location: "Winchester, Southampton or Portsmouth",
    duration: "4hr lessons",
    description: "The standard course for complete beginners.",
    nextAvailableDay: "2",
    nextAvailableMonth: "Mar",
    tags: ["Intensive", "Manual"],
    isPopular: true,
  },
  {
    id: 2,
    title: "30 Hour Semi-Intensive Course",
    instructor: "Sarah Johnson",
    price: 1350,
    location: "Manchester, Bolton or Salford",
    duration: "3hr lessons",
    description: "Perfect for those with some driving experience.",
    nextAvailableDay: "5",
    nextAvailableMonth: "Mar",
    tags: ["Semi-Intensive", "Automatic"],
    isPopular: false,
  },
  {
    id: 3,
    title: "20 Hour Refresher Course",
    instructor: "Mike Williams",
    price: 900,
    location: "Birmingham, Coventry or Wolverhampton",
    duration: "2hr lessons",
    description: "Ideal for returning drivers needing a confidence boost.",
    nextAvailableDay: "8",
    nextAvailableMonth: "Mar",
    tags: ["Refresher", "Manual"],
    isPopular: true,
  },
  {
    id: 4,
    title: "50 Hour Complete Beginner Course",
    instructor: "Emma Davis",
    price: 2250,
    location: "Leeds, Bradford or Wakefield",
    duration: "5hr lessons",
    description: "Comprehensive course for absolute beginners.",
    nextAvailableDay: "12",
    nextAvailableMonth: "Mar",
    tags: ["Intensive", "Automatic"],
    isPopular: false,
  },
];

export default function Courses() {
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState("10");
  const [showFilters, setShowFilters] = useState(false);

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
            <h1 className="mb-6 text-2xl font-bold md:text-3xl">Find Driving Lessons Near You</h1>
            
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
                {mockCourses.length} instructors found
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
                  <select className="w-full rounded-lg border bg-background px-3 py-2">
                    <option>All</option>
                    <option>Manual</option>
                    <option>Automatic</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Price Range</label>
                  <select className="w-full rounded-lg border bg-background px-3 py-2">
                    <option>Any price</option>
                    <option>Under £30/hr</option>
                    <option>£30-£40/hr</option>
                    <option>Over £40/hr</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Availability</label>
                  <select className="w-full rounded-lg border bg-background px-3 py-2">
                    <option>Any time</option>
                    <option>Today</option>
                    <option>This week</option>
                    <option>Weekends only</option>
                  </select>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="container py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {mockCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CourseCard course={course} />
            </motion.div>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
