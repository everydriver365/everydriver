import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Calendar, Award, Users, Heart, Star, Clock, Zap, CreditCard, User, ArrowRight, ShieldCheck, Video, GraduationCap, Search, Wallet, Play, HelpCircle, CheckCircle2, DollarSign, Car, BookOpen, Headphones, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import { CourseCard } from "@/components/CourseCard";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import featureRetest from "@/assets/feature-retest.jpg";
import featureAvailability from "@/assets/feature-availability.jpg";
import featureTheory from "@/assets/feature-theory.jpg";
import featureTheoryPro from "@/assets/feature-theory-pro.jpg";
import featureCancellation from "@/assets/feature-cancellation.jpg";
import featurePayments from "@/assets/feature-payments.jpg";
import testimonialSarahM from "@/assets/testimonial-sarah-m.jpg";
import testimonialEmily from "@/assets/testimonial-emily.jpg";
import testimonialPriya from "@/assets/testimonial-priya.jpg";

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
      {/* Hero Section - Soft Gradient White */}
      <section className="relative min-h-[650px] overflow-hidden bg-gradient-to-b from-amber-50/50 via-white to-white py-20">
        {/* Subtle dot pattern */}
        <div 
          className="absolute inset-0 opacity-[0.4]" 
          style={{ 
            backgroundImage: `radial-gradient(circle, hsl(var(--primary) / 0.15) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }} 
        />
        {/* Decorative gradient orbs */}
        <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -right-32 top-32 h-80 w-80 rounded-full bg-amber-100/40 blur-3xl" />
        
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                <Award className="h-4 w-4" />
                Rated #1 Driving School in UK
              </div>
              
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground lg:text-6xl">
                Your License to
                <span className="relative mx-2 inline-block">
                  <span className="relative z-10 text-amber-600">Freedom</span>
                  <div className="absolute -inset-1 -rotate-1 rounded bg-amber-100" />
                </span>
                Awaits
              </h1>
              
              <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
                Join thousands of confident drivers who started their journey with us. Expert instructors, flexible schedules, guaranteed results.
              </p>
              
              <form onSubmit={handleSearch} className="mx-auto mb-12 flex max-w-xl flex-col items-center gap-4 sm:flex-row">
                <div className="relative w-full flex-1">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your postcode..."
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="h-14 rounded-xl border-border bg-white pl-12 shadow-sm"
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 w-full rounded-xl bg-amber-500 px-8 hover:bg-amber-600 sm:w-auto">
                  Find Courses
                </Button>
              </form>
            </motion.div>
            
            {/* Floating Feature Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 grid gap-6 sm:grid-cols-3"
            >
              {[
                { icon: Clock, title: "Flexible Hours", desc: "Morning, evening & weekend slots" },
                { icon: ShieldCheck, title: "Pass Guarantee", desc: "Free re-test if you don't pass" },
                { icon: Users, title: "Expert Instructors", desc: "500+ certified professionals" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <item.icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Avatars & Rating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 flex items-center justify-center gap-4"
            >
              <div className="flex -space-x-3">
                {[testimonialSarah, testimonialJames, testimonialEmma].map((img, i) => (
                  <img key={i} src={img} alt="" className="h-12 w-12 rounded-full border-3 border-white object-cover shadow-sm" />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">15,000+ happy students</p>
              </div>
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
              <div className="relative h-40 overflow-hidden">
                <img
                  src={featureRetest}
                  alt="FREE Re-Test"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
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
              <div className="relative h-40 overflow-hidden">
                <img
                  src={featureAvailability}
                  alt="Live Availability"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
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
              <div className="relative h-40 overflow-hidden">
                <img
                  src={featureTheory}
                  alt="FREE Theory Test"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
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
              <div className="relative h-40 overflow-hidden">
                <img
                  src={featureTheoryPro}
                  alt="FREE Theory Test Pro"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
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
              <div className="relative h-40 overflow-hidden">
                <img
                  src={featureCancellation}
                  alt="FREE Cancellation Finder"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
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
              <div className="relative h-40 overflow-hidden">
                <img
                  src={featurePayments}
                  alt="Flexible Payments"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
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

      {/* Featured Courses Section */}
      <section className="bg-background py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <Badge className="mb-2 border-0 bg-primary text-primary-foreground">
                Available Now
              </Badge>
              <h2 className="text-2xl font-bold md:text-3xl">Featured Courses</h2>
            </div>
            <Link to="/courses">
              <Button variant="outline" className="hidden gap-2 sm:flex">
                View All Courses
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <CourseCard
                course={{
                  id: 1,
                  title: "Intensive Driving Course - Manchester",
                  instructor: "Sarah Johnson",
                  price: 1299,
                  location: "Manchester, M1",
                  duration: "30 hours",
                  description: "Fast-track your driving with our intensive course. Perfect for quick learners who want to pass in 1-2 weeks.",
                  nextAvailableDay: "15",
                  nextAvailableMonth: "Jan",
                  tags: ["Intensive"],
                  isPopular: true,
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
            >
              <CourseCard
                course={{
                  id: 2,
                  title: "Semi-Intensive Course - London",
                  instructor: "James Williams",
                  price: 999,
                  location: "London, SW1",
                  duration: "30 hours",
                  description: "Balance speed and flexibility with our semi-intensive option. Learn at a comfortable pace over 2-4 weeks.",
                  nextAvailableDay: "18",
                  nextAvailableMonth: "Jan",
                  tags: ["Semi-Intensive"],
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <CourseCard
                course={{
                  id: 3,
                  title: "Weekly Lessons - Birmingham",
                  instructor: "Emma Thompson",
                  price: 35,
                  location: "Birmingham, B1",
                  duration: "2 hours/week",
                  description: "Traditional weekly lessons at your own pace. Perfect for busy schedules with flexible booking.",
                  nextAvailableDay: "12",
                  nextAvailableMonth: "Jan",
                  tags: ["Weekly"],
                }}
              />
            </motion.div>
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link to="/courses">
              <Button className="gap-2">
                View All Courses
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* From Nervous to Road Ready Section */}
      <section className="bg-secondary/30 py-16">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 gap-1 border-0 bg-emerald-500 text-white hover:bg-emerald-500">
                <Award className="h-3 w-3" />
                Proven Results
              </Badge>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                From Nervous to<br />
                <span className="italic text-primary">Road Ready</span>
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of learners who transformed their driving fears into confidence.
              </p>

              {/* Stats */}
              <div className="mb-8 flex flex-wrap gap-6">
                <div className="rounded-xl border bg-card px-6 py-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-foreground">98%</div>
                  <div className="text-sm text-muted-foreground">Pass Rate</div>
                </div>
                <div className="rounded-xl border bg-card px-6 py-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-foreground">15k+</div>
                  <div className="text-sm text-muted-foreground">Happy Learners</div>
                </div>
                <div className="rounded-xl border bg-card px-6 py-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-foreground">4.9</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
              </div>

              <Link to="/courses">
                <Button className="gap-2">
                  Start Your Journey
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Right Content - Testimonials */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {/* Testimonial 1 */}
              <div className="rounded-xl bg-card p-4 shadow-md">
                <div className="flex gap-4">
                  <img
                    src={testimonialSarahM}
                    alt="Sarah M."
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      "The intensive course was exactly what I needed. My instructor was patient and really focused on my weak points."
                    </p>
                    <div className="text-sm">
                      <span className="font-semibold">Sarah M.</span>
                      <span className="text-muted-foreground"> • 5-Day Intensive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="rounded-xl bg-card p-4 shadow-md">
                <div className="flex gap-4">
                  <img
                    src={testimonialEmily}
                    alt="Emily R."
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      "I went from being terrified of roundabouts to navigating them with ease. Best decision I ever made."
                    </p>
                    <div className="text-sm">
                      <span className="font-semibold">Emily R.</span>
                      <span className="text-muted-foreground"> • Semi-Intensive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="rounded-xl bg-card p-4 shadow-md">
                <div className="flex gap-4">
                  <img
                    src={testimonialPriya}
                    alt="Priya T."
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      "Working full-time made it hard to learn, but the flexible scheduling meant I could fit lessons around my job."
                    </p>
                    <div className="text-sm">
                      <span className="font-semibold">Priya T.</span>
                      <span className="text-muted-foreground"> • 10-Day Course</span>
                    </div>
                  </div>
                </div>
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

      {/* FAQ Section */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[400px_1fr]">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 gap-1 border-0 bg-secondary text-foreground">
                <HelpCircle className="h-3 w-3" />
                SUPPORT
              </Badge>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Got questions?<br />
                <span className="text-primary">We've got answers.</span>
              </h2>
              <p className="mb-8 text-muted-foreground">
                Everything you need to know about our intensive courses, guarantees, and getting you on the road.
              </p>

              {/* Still need help card */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">Still need help?</span>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Our friendly team is here to help you choose the right course.
                </p>
                <Button className="w-full">Contact Support</Button>
              </div>
            </motion.div>

            {/* Right Content - Accordion */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="item-1" className="rounded-xl border bg-card px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-left font-medium">How quickly can I get my driving license?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 text-muted-foreground">
                    With our intensive courses, you could be test-ready in as little as 1-2 weeks. The exact timeline depends on your current skill level and availability.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="rounded-xl border bg-card px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-left font-medium">Do you guarantee a pass?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 text-muted-foreground">
                    While we cannot guarantee a pass, we offer a free re-test if you do not pass the first time. Our 98% pass rate speaks to the quality of our instruction.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="rounded-xl border bg-card px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                        <Calendar className="h-4 w-4 text-amber-500" />
                      </div>
                      <span className="text-left font-medium">What if I need to change my instructor?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 text-muted-foreground">
                    No problem! If you are not happy with your instructor for any reason, we can arrange for you to switch to a different instructor at no extra cost.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="rounded-xl border bg-card px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                        <DollarSign className="h-4 w-4 text-rose-500" />
                      </div>
                      <span className="text-left font-medium">Are flexible payment plans available?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 text-muted-foreground">
                    Yes! We offer 0% finance through Klarna and Clearpay, allowing you to spread the cost over several months with no interest.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="rounded-xl border bg-card px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                        <MapPin className="h-4 w-4 text-violet-500" />
                      </div>
                      <span className="text-left font-medium">What areas do you cover?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 text-muted-foreground">
                    We have instructors across the UK, covering major cities and surrounding areas. Enter your postcode to find available instructors near you.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="rounded-xl border bg-card px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                        <Car className="h-4 w-4 text-sky-500" />
                      </div>
                      <span className="text-left font-medium">Can I choose my test center?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 text-muted-foreground">
                    Absolutely! You can choose your preferred test center, and we will book your test there. Your instructor will also practice routes specific to that center.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="rounded-xl border bg-card px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                        <BookOpen className="h-4 w-4 text-orange-500" />
                      </div>
                      <span className="text-left font-medium">Do I need to have passed my theory test first?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 text-muted-foreground">
                    You can start lessons without passing your theory test, but you will need to pass it before taking your practical test. We include free Theory Test Pro access to help you prepare.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="rounded-xl border bg-card px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
                        <Headphones className="h-4 w-4 text-teal-500" />
                      </div>
                      <span className="text-left font-medium">What happens if I need to cancel or reschedule?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11 text-muted-foreground">
                    We understand plans change. You can reschedule with at least 48 hours notice at no extra charge. Cancellations with less notice may incur a fee.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
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

      {/* Trust Badges Section */}
      <section className="border-t bg-muted/30 py-8">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {/* DVSA */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                DVSA
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">Driver & Vehicle<br/>Standards Agency</span>
            </div>

            {/* ADI Code of Practice */}
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
              <span className="text-sm font-semibold text-primary">ADI</span>
              <span className="text-xs text-muted-foreground">Code of Practice</span>
              <div className="h-5 w-5 rounded-full bg-teal-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>

            {/* MSA */}
            <div className="text-primary font-bold text-lg italic">
              msa<span className="text-teal-500">.</span>
            </div>

            {/* DBS */}
            <div className="flex items-center gap-1 rounded bg-teal-600 px-2 py-1">
              <span className="text-white text-xs font-bold">DBS</span>
              <span className="text-white/80 text-[10px]">checked</span>
            </div>

            {/* MSA Badge */}
            <div className="text-primary font-bold text-lg">
              MSA
            </div>

            {/* DIA */}
            <div className="rounded border border-primary px-2 py-1">
              <span className="text-primary text-sm font-bold">DIA</span>
            </div>

            {/* Divider */}
            <div className="hidden h-8 w-px bg-border md:block" />

            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              <div className="rounded bg-[#1a1f71] px-2 py-1">
                <span className="text-white text-xs font-bold italic">VISA</span>
              </div>
              <div className="rounded bg-gradient-to-r from-[#eb001b] to-[#f79e1b] px-2 py-1">
                <span className="text-white text-xs font-bold">MasterCard</span>
              </div>
              <div className="rounded bg-[#0099df] px-2 py-1">
                <span className="text-white text-xs font-bold">Maestro</span>
              </div>
              <div className="rounded bg-[#0b4ea2] px-2 py-1">
                <span className="text-white text-xs font-bold">JCB</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
