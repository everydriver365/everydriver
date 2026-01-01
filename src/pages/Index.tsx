import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Calendar, Award, Users, Heart, Star, Clock, Zap, CreditCard, User, ArrowRight, ShieldCheck, Video, GraduationCap, Search, Wallet, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import testimonialSarah from "@/assets/testimonial-sarah.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialEmma from "@/assets/testimonial-emma.jpg";
import courseIntensive from "@/assets/course-intensive.jpg";
import courseSemiIntensive from "@/assets/course-semi-intensive.jpg";
import courseWeekly from "@/assets/course-weekly.jpg";
import videoThumbnail from "@/assets/video-thumbnail.jpg";
import newsFeatured from "@/assets/news-featured.jpg";
import newsArticle1 from "@/assets/news-article1.jpg";
import newsArticle2 from "@/assets/news-article2.jpg";

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

      {/* Choose Your Learning Path Section */}
      <section className="bg-secondary/30 py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Badge className="mb-4 border-0 bg-primary text-primary-foreground">
              Find Your Perfect Fit
            </Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Choose Your Learning Path
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
              Whether you want to pass quickly or learn at your own pace, we have the perfect course for you
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Intensive Courses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl bg-card shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={courseIntensive}
                  alt="Intensive Courses"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className="absolute right-3 top-3 border-0 bg-primary text-primary-foreground gap-1">
                  <Zap className="h-3 w-3" />
                  Fast Track
                </Badge>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold">Intensive Courses</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Full immersion driving experience. Learn everything in concentrated sessions and pass your test in record time.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span><strong>30-40 hours</strong> of lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Pass in <strong>1-2 weeks</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Test booking <strong>included</strong></span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£1,299</div>
                  </div>
                  <Link to="/courses?type=intensive">
                    <Button className="gap-2">
                      View Courses
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Semi-Intensive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl bg-card shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={courseSemiIntensive}
                  alt="Semi-Intensive Courses"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className="absolute right-3 top-3 border-0 bg-emerald-500 text-white gap-1">
                  <Star className="h-3 w-3" />
                  Popular
                </Badge>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold">Semi-Intensive</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The perfect balance of speed and flexibility. Ideal if you have some availability but need time to practice between sessions.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span><strong>30 hours</strong> of lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Pass in <strong>2-4 weeks</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-primary" />
                    <span><strong>Flexible</strong> scheduling</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£999</div>
                  </div>
                  <Link to="/courses?type=semi-intensive">
                    <Button className="gap-2">
                      View Courses
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Weekly Lessons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl bg-card shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={courseWeekly}
                  alt="Weekly Lessons"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className="absolute right-3 top-3 border-0 bg-blue-500 text-white gap-1">
                  <Heart className="h-3 w-3" />
                  Flexible
                </Badge>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold">Weekly Lessons</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Traditional approach for busy schedules. Build confidence gradually with regular weekly sessions at times that suit you.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span><strong>1-2 hours</strong> per week</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span><strong>Pay as you go</strong> or packages</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-primary" />
                    <span><strong>Same instructor</strong> every week</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <div className="text-2xl font-bold text-primary">£35<span className="text-sm font-normal text-muted-foreground">/hour</span></div>
                  </div>
                  <Link to="/courses?type=weekly">
                    <Button className="gap-2">
                      View Lessons
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="bg-background py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Badge className="mb-4 border-0 bg-primary text-primary-foreground">
              Why Learners Love Us
            </Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              What's Included With Every Course
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
              Everything you need to pass your driving test, all included for free.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* FREE Re-Test */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl bg-card shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-rose-100 to-rose-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="h-20 w-20 text-rose-400" />
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-primary">FREE Re-Test if you fail</h3>
                  <Badge className="border-0 bg-primary text-primary-foreground text-xs">FREE</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Every instructor is DVSA approved and background checked for your safety.
                </p>
                <button className="mt-3 text-sm text-primary hover:underline">
                  Tap for more info
                </button>
              </div>
            </motion.div>

            {/* Live Availability */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl bg-card shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="h-20 w-20 text-amber-500" />
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-primary">Live Availability</h3>
                  <Badge className="border-0 bg-primary text-primary-foreground text-xs">FREE</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Skip the waiting lists. Find instructors with immediate availability in your area.
                </p>
                <button className="mt-3 text-sm text-primary hover:underline">
                  Tap for more info
                </button>
              </div>
            </motion.div>

            {/* FREE Theory Test */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl bg-card shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <GraduationCap className="h-20 w-20 text-emerald-500" />
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-primary">FREE Theory Test</h3>
                  <Badge className="border-0 bg-primary text-primary-foreground text-xs">FREE</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our intensive courses are designed to get you test-ready in record time.
                </p>
                <button className="mt-3 text-sm text-primary hover:underline">
                  Tap for more info
                </button>
              </div>
            </motion.div>

            {/* FREE Theory Test Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl bg-card shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-sky-100 to-sky-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Award className="h-20 w-20 text-sky-500" />
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-primary">FREE Theory Test Pro</h3>
                  <Badge className="border-0 bg-primary text-primary-foreground text-xs">FREE</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  We cover the cost of your second test if you don't pass the first time.
                </p>
                <button className="mt-3 text-sm text-primary hover:underline">
                  Tap for more info
                </button>
              </div>
            </motion.div>

            {/* FREE Cancellation Finder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl bg-card shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-violet-100 to-violet-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="h-20 w-20 text-violet-500" />
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-primary">FREE Cancellation Finder</h3>
                  <Badge className="border-0 bg-primary text-primary-foreground text-xs">FREE</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our dedicated team is here to help you every step of the way, 7 days a week.
                </p>
                <button className="mt-3 text-sm text-primary hover:underline">
                  Tap for more info
                </button>
              </div>
            </motion.div>

            {/* Flexible Payments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-2xl bg-card shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-pink-100 via-pink-50 to-teal-100">
                <div className="absolute inset-0 flex items-center justify-center gap-4">
                  <span className="rounded bg-[#ffb3c7] px-3 py-1.5 text-sm font-bold text-black">
                    Klarna.
                  </span>
                  <span className="rounded bg-[#b2fce4] px-3 py-1.5 text-sm font-bold text-black">
                    clearpay
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-primary">Flexible Payments</h3>
                  <Badge className="border-0 bg-primary text-primary-foreground text-xs">FREE</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lessons that fit around your life. Weekends, evenings, and intensive blocks available.
                </p>
                <button className="mt-3 text-sm text-primary hover:underline">
                  Tap for more info
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Story Section */}
      <section className="bg-amber-50/60 py-16">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Video Thumbnail */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-xl">
                <img
                  src={videoThumbnail}
                  alt="Our Story Video"
                  className="h-full w-full object-cover"
                />
                {/* Play Button Overlay */}
                <button className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110">
                    <Play className="h-6 w-6 fill-primary text-primary ml-1" />
                  </div>
                </button>
              </div>
              <p className="mt-4 text-center italic text-muted-foreground">
                Our Story - Watch Now!
              </p>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 gap-1 border-0 bg-amber-500 text-white hover:bg-amber-500">
                <Play className="h-3 w-3 fill-white" />
                Watch Our Story
              </Badge>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Every Driver Has a Story
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                From nervous first-timers to confident road users, we've been part of thousands of driving journeys. Watch our intro to see what makes us different.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="gap-2 bg-amber-500 hover:bg-amber-600">
                  <Play className="h-4 w-4 fill-white" />
                  Play Video
                </Button>
                <Button variant="outline" className="gap-2">
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="bg-background py-16">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold md:text-3xl">Latest News & Tips</h2>
            <Button variant="outline" className="hidden sm:flex">
              View All Articles
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Featured Article */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl"
            >
              <img
                src={newsFeatured}
                alt="Road safety news"
                className="h-80 w-full object-cover transition-transform duration-300 group-hover:scale-105 md:h-96"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <Badge className="mb-3 border-0 bg-primary text-primary-foreground">
                  Driving News
                </Badge>
                <h3 className="mb-2 text-xl font-bold text-white md:text-2xl">
                  Road Safety Statistics Show Improvement in 2025
                </h3>
                <p className="text-sm text-white/80">
                  New figures have been released showing improved road safety outcomes, with officials urging continued focus on safe driving practices.
                </p>
              </div>
            </motion.div>

            {/* Side Articles */}
            <div className="flex flex-col gap-6">
              {/* Article 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="group flex gap-4 rounded-xl bg-card p-4 shadow-md transition-shadow hover:shadow-lg"
              >
                <img
                  src={newsArticle1}
                  alt="Instructor test changes"
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <div className="flex flex-col justify-center">
                  <Badge className="mb-1 w-fit border-0 bg-primary/10 text-primary text-xs">
                    Driving News
                  </Badge>
                  <h4 className="mb-1 font-semibold group-hover:text-primary transition-colors">
                    Driving instructor qualifying test changes: December 2025
                  </h4>
                  <span className="text-xs text-muted-foreground">1 min read</span>
                </div>
              </motion.div>

              {/* Article 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                viewport={{ once: true }}
                className="group flex gap-4 rounded-xl bg-card p-4 shadow-md transition-shadow hover:shadow-lg"
              >
                <img
                  src={newsArticle2}
                  alt="Examiner news"
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <div className="flex flex-col justify-center">
                  <Badge className="mb-1 w-fit border-0 bg-primary/10 text-primary text-xs">
                    Driving News
                  </Badge>
                  <h4 className="mb-1 font-semibold group-hover:text-primary transition-colors">
                    Driving examiner updates: December 2025. Driver and Vehicle Standards Agency.
                  </h4>
                  <span className="text-xs text-muted-foreground">1 min read</span>
                </div>
              </motion.div>

              {/* Read More Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Button className="w-full gap-2">
                  Read More Articles
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
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
