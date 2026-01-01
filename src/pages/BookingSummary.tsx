import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Car, User, Calendar, CheckCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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
  special_skills: string | null;
  brand_colour: string | null;
}

interface CourseDetails {
  instructor: Instructor;
  hours: number;
  courseName: string;
  totalPrice: number;
  pricePerHour: number;
}

export default function BookingSummary() {
  const { instructorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const hours = parseInt(searchParams.get("hours") || "10");

  useEffect(() => {
    const fetchDetails = async () => {
      if (!instructorId) return;

      const { data: instructor, error } = await supabase
        .from("instructors")
        .select("*")
        .eq("id", instructorId)
        .maybeSingle();

      if (error || !instructor) {
        console.error("Error fetching instructor:", error);
        setLoading(false);
        return;
      }

      const hourlyRate = instructor.hourly_rate || 40;
      const courseName = hours === 28 ? "Test in a Week" : `${hours} Hour Course`;

      setCourseDetails({
        instructor,
        hours,
        courseName,
        totalPrice: hours * hourlyRate,
        pricePerHour: hourlyRate,
      });
      setLoading(false);
    };

    fetchDetails();
  }, [instructorId, hours]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <div className="animate-pulse">Loading course details...</div>
        </div>
      </MainLayout>
    );
  }

  if (!courseDetails) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <Button onClick={() => navigate("/courses")} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { instructor, courseName, totalPrice, pricePerHour } = courseDetails;
  const brandColour = instructor.brand_colour || "#1e3a5f";

  return (
    <MainLayout>
      <div className="container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border bg-card p-6 shadow-md"
            >
              <h1 className="text-2xl font-bold md:text-3xl">{courseName}</h1>
              <p className="mt-2 text-muted-foreground">
                with {instructor.name}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{hours} Hours Total</div>
                    <div className="text-sm text-muted-foreground">
                      Flexible scheduling
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Near {instructor.home_postcode}</div>
                    <div className="text-sm text-muted-foreground">
                      Pick-up available
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                  <Car className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{instructor.car_type}</div>
                    <div className="text-sm text-muted-foreground">
                      {instructor.car_make} {instructor.car_model}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Flexible Start</div>
                    <div className="text-sm text-muted-foreground">
                      Choose your dates
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Instructor Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border bg-card p-6 shadow-md"
            >
              <h2 className="text-lg font-semibold">Your Instructor</h2>
              
              <div className="mt-4 flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={instructor.profile_image_url || undefined} />
                  <AvatarFallback 
                    className="text-lg"
                    style={{ backgroundColor: brandColour, color: "white" }}
                  >
                    {instructor.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{instructor.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {instructor.car_type} Instructor
                  </Badge>
                  {instructor.bio && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {instructor.bio}
                    </p>
                  )}
                  {instructor.special_skills && (
                    <div className="mt-3">
                      <span className="text-sm font-medium">Specialties: </span>
                      <span className="text-sm text-muted-foreground">
                        {instructor.special_skills}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* What's Included */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border bg-card p-6 shadow-md"
            >
              <h2 className="text-lg font-semibold">What's Included</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Pick-up from home or work",
                  "Theory test support",
                  "Free re-test if needed",
                  "Dual controls vehicle",
                  "Patient, qualified instructor",
                  "Flexible rescheduling",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Pricing */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-24 rounded-2xl border bg-card p-6 shadow-md"
            >
              <h2 className="text-lg font-semibold">Price Summary</h2>
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {hours} hours × £{pricePerHour}/hr
                  </span>
                  <span>£{totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Booking fee</span>
                  <span>£0</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>£{totalPrice}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    or from £{Math.round(totalPrice / 4)}/month with Klarna
                  </div>
                </div>
              </div>

              <Button className="w-full mt-6 gap-2" size="lg">
                <CreditCard className="h-4 w-4" />
                Proceed to Payment
              </Button>

              <div className="mt-4 flex justify-center gap-2">
                <span className="rounded bg-[#b2fce4] px-2 py-1 text-xs font-semibold text-[#000]">
                  clearpay
                </span>
                <span className="rounded bg-[#ffb3c7] px-2 py-1 text-xs font-semibold text-[#000]">
                  Klarna.
                </span>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                No payment required now. Pay when your lessons are confirmed.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
