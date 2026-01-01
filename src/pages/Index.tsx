import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Calendar, Award, Users, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import testimonialSarah from "@/assets/testimonial-sarah.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialEmma from "@/assets/testimonial-emma.jpg";

const features = [
  {
    icon: Calendar,
    title: "Live Availability",
    description: "See real-time availability synced with Google Calendar. Book lessons that fit your schedule.",
  },
  {
    icon: MapPin,
    title: "Local Instructors",
    description: "Find certified instructors near you. Search by postcode and set your preferred radius.",
  },
  {
    icon: Award,
    title: "Track Progress",
    description: "Monitor your learning journey with detailed progress reports and skill assessments.",
  },
  {
    icon: Users,
    title: "Parent Visibility",
    description: "Parents can track lessons, progress, and payments through a dedicated portal.",
  },
];

const stats = [
  { value: "15,000+", label: "Students Passed" },
  { value: "98%", label: "Pass Rate" },
  { value: "500+", label: "Instructors" },
  { value: "24/7", label: "Online Booking" },
];

const testimonials = [
  {
    name: "Emma Thompson",
    role: "Passed First Time",
    content: "The booking system made finding a local instructor so easy. Passed my test in just 8 weeks!",
    avatar: "ET",
  },
  {
    name: "James Wilson",
    role: "Parent",
    content: "Being able to track my daughter's progress and manage payments in one place is brilliant.",
    avatar: "JW",
  },
  {
    name: "Sarah Mitchell",
    role: "Driving Instructor",
    content: "The calendar integration saves me hours every week. My students love the easy booking.",
    avatar: "SM",
  },
];

const heroTestimonials = [
  {
    name: "Sarah",
    achievement: "Passed 1st time!",
    image: testimonialSarah,
    rotation: -6,
    position: "top-0 left-0",
  },
  {
    name: "James",
    achievement: "Intensive Course",
    image: testimonialJames,
    rotation: 6,
    position: "top-8 right-0",
  },
  {
    name: "Emma",
    achievement: "Intensive Course",
    image: testimonialEmma,
    rotation: 0,
    position: "bottom-0 left-1/4",
  },
];

export default function Index() {
  const [postcode, setPostcode] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/courses?postcode=${postcode}`;
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-12 lg:py-20">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Free Re-test
              </Badge>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Your Driving
                <span className="block text-primary">Success Story</span>
                <span className="block">Starts Here</span>
              </h1>

              <p className="mb-8 max-w-md text-lg text-muted-foreground">
                Join thousands who passed with DriveTime. Intensive courses designed to get you on the road faster.
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mb-8 flex max-w-md overflow-hidden rounded-full border bg-card shadow-md">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your postcode..."
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="h-14 border-0 bg-transparent pl-12 text-base focus-visible:ring-0"
                  />
                </div>
                <Button type="submit" className="m-1.5 h-11 rounded-full px-6">
                  Find Courses
                </Button>
              </form>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 font-semibold text-foreground">4.9</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#ffb3c7] px-2 py-1 text-xs font-semibold text-[#000]">
                    Klarna.
                  </span>
                  <span className="rounded bg-[#b2fce4] px-2 py-1 text-xs font-semibold text-[#000]">
                    clearpay
                  </span>
                  <span className="text-sm text-muted-foreground">0% Finance</span>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Testimonial Images */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden h-[500px] lg:block"
            >
              {/* Sarah Card - Top Left */}
              <motion.div
                initial={{ opacity: 0, y: 20, rotate: -6 }}
                animate={{ opacity: 1, y: 0, rotate: -6 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute left-0 top-0 z-10 w-56 overflow-hidden rounded-3xl shadow-xl"
              >
                <img
                  src={testimonialSarah}
                  alt="Sarah - Passed 1st time"
                  className="h-72 w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="font-semibold text-white">Sarah</div>
                  <div className="text-sm text-white/80">Passed 1st time!</div>
                </div>
              </motion.div>

              {/* James Card - Top Right */}
              <motion.div
                initial={{ opacity: 0, y: 20, rotate: 6 }}
                animate={{ opacity: 1, y: 0, rotate: 6 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute right-0 top-8 z-20 w-48 overflow-hidden rounded-3xl shadow-xl"
              >
                <img
                  src={testimonialJames}
                  alt="James - Intensive Course"
                  className="h-64 w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="font-semibold text-white">James</div>
                  <div className="text-sm text-white/80">Intensive Course</div>
                </div>
              </motion.div>

              {/* Emma Card - Bottom Center */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute bottom-0 left-1/4 z-30 w-52 overflow-hidden rounded-3xl border-4 border-white shadow-xl"
              >
                <img
                  src={testimonialEmma}
                  alt="Emma - Intensive Course"
                  className="h-56 w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="font-semibold text-white">Emma</div>
                  <div className="text-sm text-white/80">Intensive Course</div>
                </div>
              </motion.div>

              {/* Learners Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute bottom-16 right-4 z-40 flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white">10k+ Learners</div>
                  <div className="text-sm text-white/80">And counting!</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-12">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-card p-6 shadow-lg md:grid-cols-4 md:gap-8 md:p-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-primary md:text-3xl">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-4 text-3xl font-bold md:text-4xl"
          >
            Everything You Need to
            <span className="text-accent"> Learn to Drive</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-muted-foreground"
          >
            Our platform connects learners, instructors, and parents in one seamless experience.
          </motion.p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group rounded-2xl border bg-card p-6 transition-all hover:border-accent/50 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-secondary/50 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-4 text-3xl font-bold md:text-4xl"
            >
              Trusted by Thousands of
              <span className="text-accent"> Happy Drivers</span>
            </motion.h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-card p-6 shadow-md"
              >
                <p className="mb-4 text-muted-foreground">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-3xl gradient-hero p-8 text-center md:p-16"
        >
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Start Your Driving Journey?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
            Join thousands of learners who have passed their test with DriveTime. 
            Book your first lesson today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/courses">
              <Button variant="hero" size="xl">
                Find a Lesson
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="heroOutline" size="xl">
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </MainLayout>
  );
}
