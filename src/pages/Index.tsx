import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, ChevronRight, Calendar, Award, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-driving.jpg";

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

export default function Index() {
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState("10");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to courses with search params
    window.location.href = `/courses?postcode=${postcode}&radius=${radius}`;
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Driving lesson in progress" 
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 gradient-hero opacity-90" />
        </div>
        
        <div className="container relative py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="mb-4 inline-block rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent">
                🚗 Learn to Drive with Confidence
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl"
            >
              Your Journey to the
              <span className="text-gradient block">Open Road Starts Here</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 text-lg text-primary-foreground/80"
            >
              Find local driving instructors with real-time availability. 
              Book lessons, track progress, and get on the road faster.
            </motion.p>

            {/* Search Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onSubmit={handleSearch}
              className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl bg-card p-4 shadow-xl sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter your postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="h-12 border-0 bg-secondary pl-10 text-base"
                />
              </div>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="h-12 rounded-lg border-0 bg-secondary px-4 text-base text-foreground"
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="15">15 miles</option>
                <option value="25">25 miles</option>
              </select>
              <Button type="submit" variant="hero" size="lg" className="h-12">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </motion.form>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container -mt-6 relative z-10">
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
