import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Star, Clock, Car, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";

const mockCourses = [
  {
    id: 1,
    instructor: "John Smith",
    rating: 4.9,
    reviews: 127,
    price: 35,
    location: "Manchester, M1",
    availability: "Next available: Tomorrow",
    specialties: ["Manual", "Nervous Drivers"],
    image: "JS",
  },
  {
    id: 2,
    instructor: "Sarah Johnson",
    rating: 4.8,
    reviews: 89,
    price: 32,
    location: "Manchester, M4",
    availability: "Next available: Today",
    specialties: ["Automatic", "Intensive Courses"],
    image: "SJ",
  },
  {
    id: 3,
    instructor: "Mike Williams",
    rating: 4.7,
    reviews: 156,
    price: 38,
    location: "Salford, M5",
    availability: "Next available: Friday",
    specialties: ["Manual", "Pass Plus"],
    image: "MW",
  },
  {
    id: 4,
    instructor: "Emma Davis",
    rating: 5.0,
    reviews: 45,
    price: 40,
    location: "Trafford, M32",
    availability: "Next available: Monday",
    specialties: ["Automatic", "Female Instructor"],
    image: "ED",
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
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex h-32 w-full items-center justify-center bg-primary sm:h-auto sm:w-32">
                      <span className="text-3xl font-bold text-primary-foreground">
                        {course.image}
                      </span>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{course.instructor}</h3>
                          <div className="mt-1 flex items-center gap-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="text-sm font-medium">{course.rating}</span>
                            <span className="text-sm text-muted-foreground">
                              ({course.reviews} reviews)
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">£{course.price}</div>
                          <div className="text-xs text-muted-foreground">per hour</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {course.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.availability}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {course.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button variant="accent" size="sm" className="flex-1">
                          Book Lesson
                        </Button>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
