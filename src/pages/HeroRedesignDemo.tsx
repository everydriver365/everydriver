import { motion } from "framer-motion";
import { MapPin, Star, ChevronLeft, Play, ArrowRight, CheckCircle2, Users, Award, Clock, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import testimonialSarah from "@/assets/testimonial-sarah.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialEmma from "@/assets/testimonial-emma.jpg";
const logo = "/everydriver-logo.png";

export default function HeroRedesignDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-nav px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-nav-foreground hover:text-accent">
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <h1 className="text-lg font-bold text-nav-foreground">Hero Redesign Options</h1>
        </div>
      </header>

      {/* Option 1: Bold Split Screen */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 1</Badge>
          <span className="font-semibold">Bold Split Screen</span>
          <span className="ml-2 text-sm text-muted-foreground">— Full-height split with bold typography</span>
        </div>
        
        <div className="grid min-h-[600px] lg:grid-cols-2">
          {/* Left - Dark */}
          <div className="flex flex-col justify-center bg-[#001f47] p-12 lg:p-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-400">
                UK's #1 Driving School
              </p>
              <h1 className="mb-6 text-5xl font-black leading-[1.1] text-white lg:text-6xl">
                Learn to Drive.
                <br />
                <span className="text-amber-400">Pass First Time.</span>
              </h1>
              <p className="mb-8 max-w-md text-lg text-white/70">
                Join 15,000+ successful drivers. Expert instructors, flexible scheduling, guaranteed results.
              </p>
              
              <div className="mb-8 flex max-w-md overflow-hidden rounded-full bg-white">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Enter your postcode"
                    className="h-14 border-0 bg-transparent pl-12 focus-visible:ring-0"
                  />
                </div>
                <Button className="m-1.5 h-11 rounded-full bg-amber-500 px-6 hover:bg-amber-600">
                  Get Started
                </Button>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[testimonialSarah, testimonialJames, testimonialEmma].map((img, i) => (
                    <img key={i} src={img} alt="" className="h-10 w-10 rounded-full border-2 border-[#001f47] object-cover" />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/60">4.9 from 2,400+ reviews</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Right - Image */}
          <div className="relative overflow-hidden">
            <img src={testimonialSarah} alt="Student" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Floating Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="absolute bottom-8 left-8 right-8 grid grid-cols-3 gap-4"
            >
              {[
                { value: "98%", label: "Pass Rate" },
                { value: "2 Weeks", label: "Avg. Time" },
                { value: "500+", label: "Instructors" },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl bg-white/10 p-4 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Option 2: Centered Minimal */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 2</Badge>
          <span className="font-semibold">Centered Minimal</span>
          <span className="ml-2 text-sm text-muted-foreground">— Clean, centered layout with floating elements</span>
        </div>
        
        <div className="relative min-h-[650px] overflow-hidden bg-gradient-to-b from-slate-50 to-white">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          
          <div className="container relative py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Badge className="mb-6 border-amber-200 bg-amber-50 text-amber-700">
                <Sparkles className="mr-1 h-3 w-3" /> Trusted by 15,000+ learners
              </Badge>
              
              <h1 className="mx-auto mb-6 max-w-4xl text-5xl font-bold tracking-tight text-slate-900 lg:text-7xl">
                Your journey to
                <span className="relative mx-3 inline-block">
                  <span className="relative z-10">freedom</span>
                  <svg className="absolute -bottom-2 left-0 h-3 w-full text-amber-400" viewBox="0 0 200 12" preserveAspectRatio="none">
                    <path d="M0,8 Q50,0 100,8 T200,8" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                </span>
                starts here
              </h1>
              
              <p className="mx-auto mb-10 max-w-2xl text-xl text-slate-600">
                Expert instructors. Flexible schedules. Pass your test with confidence.
              </p>
              
              <div className="mx-auto mb-12 flex max-w-lg items-center gap-3 rounded-full border bg-white p-2 shadow-lg">
                <MapPin className="ml-4 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Enter your postcode..."
                  className="flex-1 border-0 focus-visible:ring-0"
                />
                <Button className="rounded-full bg-[#001f47] px-8">
                  Find Instructors <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8">
                {[
                  { icon: Shield, text: "DVSA Approved" },
                  { icon: Award, text: "98% Pass Rate" },
                  { icon: Clock, text: "Flexible Hours" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-600">
                    <item.icon className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Floating Images */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative mx-auto mt-16 max-w-4xl"
            >
              <div className="flex justify-center gap-4">
                {[testimonialSarah, testimonialJames, testimonialEmma].map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`overflow-hidden rounded-2xl shadow-xl ${i === 1 ? "w-64 scale-110" : "w-48"}`}
                  >
                    <img src={img} alt="" className="h-72 w-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Option 3: Video-First */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 3</Badge>
          <span className="font-semibold">Video-First</span>
          <span className="ml-2 text-sm text-muted-foreground">— Large video thumbnail as focal point</span>
        </div>
        
        <div className="min-h-[650px] bg-[#001f47] py-16">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left - Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  <span className="flex h-2 w-2 rounded-full bg-green-400" />
                  Now accepting new students
                </div>
                
                <h1 className="mb-6 text-4xl font-bold text-white lg:text-5xl">
                  Watch How We Turn
                  <span className="block text-amber-400">Beginners into Confident Drivers</span>
                </h1>
                
                <p className="mb-8 text-lg text-white/70">
                  See real success stories from our students who passed their tests on the first attempt.
                </p>
                
                <div className="mb-8 flex flex-wrap gap-4">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600">
                    Start Learning Today
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    View All Courses
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: "15K+", label: "Students Passed" },
                    { value: "98%", label: "Pass Rate" },
                    { value: "4.9★", label: "Rating" },
                  ].map((stat, i) => (
                    <div key={i}>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-white/60">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* Right - Video Thumbnail */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-3xl">
                  <img src={testimonialSarah} alt="Video" className="w-full" />
                  <div className="absolute inset-0 bg-black/30" />
                  
                  {/* Play Button */}
                  <button className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl transition-transform hover:scale-110">
                    <Play className="ml-1 h-8 w-8 fill-[#001f47] text-[#001f47]" />
                  </button>
                  
                  {/* Video Duration */}
                  <div className="absolute bottom-4 right-4 rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
                    2:34
                  </div>
                </div>
                
                {/* Floating Testimonial */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-4 -left-4 max-w-xs rounded-2xl bg-white p-4 shadow-xl"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <img src={testimonialEmma} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-slate-900">Emma T.</p>
                      <p className="text-xs text-slate-500">Passed in 3 weeks</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">"Best decision I ever made. My instructor was amazing!"</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 4: Cards Stack */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 4</Badge>
          <span className="font-semibold">Feature Cards Stack</span>
          <span className="ml-2 text-sm text-muted-foreground">— Key benefits prominently displayed</span>
        </div>
        
        <div className="min-h-[650px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
          <div className="container">
            <div className="mb-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <img src={logo} alt="EveryDriver" className="mx-auto mb-8 h-10" />
                
                <h1 className="mb-6 text-4xl font-bold text-white lg:text-6xl">
                  The Smarter Way to
                  <span className="block bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    Learn to Drive
                  </span>
                </h1>
                
                <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400">
                  Join thousands of successful drivers who chose the modern approach to driving lessons.
                </p>
                
                <div className="mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-sm">
                  <MapPin className="ml-3 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Your postcode..."
                    className="flex-1 border-0 bg-transparent text-white placeholder:text-slate-400 focus-visible:ring-0"
                  />
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 px-6">
                    Find Courses
                  </Button>
                </div>
              </motion.div>
            </div>
            
            {/* Feature Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: Zap, title: "Fast-Track Learning", desc: "Intensive courses get you road-ready in just 2 weeks", color: "from-amber-500 to-orange-500" },
                { icon: Shield, title: "Guaranteed Pass", desc: "Free re-test if you don't pass first time with us", color: "from-emerald-500 to-teal-500" },
                { icon: Users, title: "Expert Instructors", desc: "500+ DVSA-approved instructors near you", color: "from-blue-500 to-indigo-500" },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-2xl bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-white">{card.title}</h3>
                  <p className="text-slate-400">{card.desc}</p>
                </motion.div>
              ))}
            </div>
            
            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center"
            >
              <div className="flex -space-x-2">
                {[testimonialSarah, testimonialJames, testimonialEmma].map((img, i) => (
                  <img key={i} src={img} alt="" className="h-10 w-10 rounded-full border-2 border-slate-800 object-cover" />
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-800 bg-amber-500 text-sm font-bold text-white">
                  +15K
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 font-semibold text-white">4.9</span>
                </div>
                <p className="text-sm text-slate-500">from 2,400+ verified reviews</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Option 5: Asymmetric Bold */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 5</Badge>
          <span className="font-semibold">Asymmetric Bold</span>
          <span className="ml-2 text-sm text-muted-foreground">— Large typography with floating images</span>
        </div>
        
        <div className="relative min-h-[650px] overflow-hidden bg-[#faf9f7] py-20">
          <div className="container relative">
            {/* Main Content */}
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <p className="mb-4 font-mono text-sm uppercase tracking-widest text-amber-600">
                  [ Driving Made Simple ]
                </p>
                
                <h1 className="mb-8 text-6xl font-black leading-[0.95] tracking-tight text-slate-900 lg:text-8xl">
                  PASS YOUR
                  <br />
                  <span className="text-amber-500">TEST</span> WITH
                  <br />
                  CONFIDENCE
                </h1>
                
                <div className="mb-10 flex flex-wrap items-center gap-6">
                  <Button size="lg" className="h-14 rounded-none bg-slate-900 px-8 text-lg">
                    Book Now →
                  </Button>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-slate-600">Free cancellation</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-12">
                  {[
                    { value: "98%", label: "Pass Rate" },
                    { value: "15,000+", label: "Students" },
                    { value: "500+", label: "Instructors" },
                  ].map((stat, i) => (
                    <div key={i}>
                      <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* Floating Images */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="absolute right-0 top-20 hidden w-96 lg:block"
            >
              <div className="relative">
                <div className="absolute -left-12 top-32 z-20 h-48 w-40 overflow-hidden rounded-2xl shadow-2xl">
                  <img src={testimonialJames} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="relative z-10 h-80 w-64 overflow-hidden rounded-2xl shadow-2xl">
                  <img src={testimonialSarah} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -right-8 bottom-0 z-0 h-44 w-36 overflow-hidden rounded-2xl shadow-xl">
                  <img src={testimonialEmma} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Option 6: Glassmorphism */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 6</Badge>
          <span className="font-semibold">Glassmorphism</span>
          <span className="ml-2 text-sm text-muted-foreground">— Modern glass effect with gradient background</span>
        </div>
        
        <div className="relative min-h-[650px] overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
          {/* Blurred Shapes */}
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-amber-400/30 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-pink-500/30 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
          
          <div className="container relative py-20">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm text-white">Rated 4.9/5 by 15,000+ learners</span>
                </div>
                
                <h1 className="mb-6 text-5xl font-bold text-white lg:text-6xl">
                  Drive Your Dreams
                  <span className="block text-amber-400">Into Reality</span>
                </h1>
                
                <p className="mb-8 max-w-lg text-lg text-white/70">
                  Experience the future of driving education. Personalized lessons, cutting-edge technology, exceptional results.
                </p>
                
                {/* Glass Search Box */}
                <div className="mb-8 max-w-md rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                  <p className="mb-3 text-sm font-medium text-white/80">Find instructors near you</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                      <Input
                        placeholder="Enter postcode..."
                        className="h-12 border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                      />
                    </div>
                    <Button className="h-12 bg-amber-500 px-6 hover:bg-amber-600">
                      Search
                    </Button>
                  </div>
                </div>
                
                {/* Glass Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "98%", label: "Pass Rate" },
                    { value: "2 Weeks", label: "Avg. Time" },
                    { value: "24/7", label: "Support" },
                  ].map((stat, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/60">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* Right - Glass Card with Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 overflow-hidden rounded-2xl">
                      <img src={testimonialSarah} alt="" className="h-64 w-full object-cover" />
                    </div>
                    <div className="overflow-hidden rounded-2xl">
                      <img src={testimonialJames} alt="" className="h-40 w-full object-cover" />
                    </div>
                    <div className="overflow-hidden rounded-2xl">
                      <img src={testimonialEmma} alt="" className="h-40 w-full object-cover" />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[testimonialSarah, testimonialJames, testimonialEmma].map((img, i) => (
                        <img key={i} src={img} alt="" className="h-8 w-8 rounded-full border-2 border-white/20 object-cover" />
                      ))}
                    </div>
                    <p className="text-sm text-white/70">+15,000 happy drivers</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 7: Clean Editorial */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 7</Badge>
          <span className="font-semibold">Clean Editorial</span>
          <span className="ml-2 text-sm text-muted-foreground">— Magazine-style white layout</span>
        </div>
        
        <div className="min-h-[650px] bg-white py-20">
          <div className="container">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Est. 2020</span>
                </div>
                
                <h1 className="mb-6 font-serif text-5xl font-light leading-tight text-slate-900 lg:text-6xl">
                  The Art of
                  <span className="block font-normal italic text-amber-600">Confident Driving</span>
                </h1>
                
                <p className="mb-8 max-w-md text-lg leading-relaxed text-slate-600">
                  Master the road with expert guidance. Our personalized approach has helped over 15,000 students pass with flying colors.
                </p>
                
                <div className="mb-10 flex items-center gap-4">
                  <Button size="lg" className="rounded-none bg-slate-900 px-8 hover:bg-slate-800">
                    Start Your Journey
                  </Button>
                  <Button size="lg" variant="ghost" className="rounded-none text-slate-600 hover:text-slate-900">
                    Learn More →
                  </Button>
                </div>
                
                <div className="flex items-center gap-8 border-t pt-8">
                  {[
                    { value: "98%", label: "Pass Rate" },
                    { value: "15K+", label: "Graduates" },
                    { value: "4.9", label: "Rating" },
                  ].map((stat, i) => (
                    <div key={i}>
                      <p className="text-3xl font-light text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <div className="relative">
                  <img src={testimonialSarah} alt="" className="h-[500px] w-full object-cover" />
                  <div className="absolute -bottom-6 -left-6 bg-white p-6 shadow-xl">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600">"Exceptional experience from start to finish."</p>
                    <p className="mt-2 text-xs font-semibold text-slate-900">— Sarah M.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 8: Soft Gradient White */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 8</Badge>
          <span className="font-semibold">Soft Gradient White</span>
          <span className="ml-2 text-sm text-muted-foreground">— Subtle gradient with floating cards</span>
        </div>
        
        <div className="min-h-[650px] bg-gradient-to-b from-amber-50/50 via-white to-white py-20">
          <div className="container">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                  <Award className="h-4 w-4" />
                  Rated #1 Driving School in UK
                </div>
                
                <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 lg:text-6xl">
                  Your License to
                  <span className="relative mx-2">
                    <span className="relative z-10 text-amber-600">Freedom</span>
                    <div className="absolute -inset-1 -rotate-1 rounded bg-amber-100" />
                  </span>
                  Awaits
                </h1>
                
                <p className="mx-auto mb-10 max-w-2xl text-xl text-slate-600">
                  Join thousands of confident drivers who started their journey with us. Expert instructors, flexible schedules, guaranteed results.
                </p>
                
                <div className="mx-auto mb-12 flex max-w-xl flex-col items-center gap-4 sm:flex-row">
                  <div className="relative w-full flex-1">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Enter your postcode..."
                      className="h-14 rounded-xl border-slate-200 bg-white pl-12 shadow-sm"
                    />
                  </div>
                  <Button size="lg" className="h-14 w-full rounded-xl bg-amber-500 px-8 hover:bg-amber-600 sm:w-auto">
                    Find Courses
                  </Button>
                </div>
              </motion.div>
              
              {/* Floating Feature Cards */}
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { icon: Clock, title: "Flexible Hours", desc: "Morning, evening & weekend slots" },
                  { icon: Shield, title: "Pass Guarantee", desc: "Free re-test if you don't pass" },
                  { icon: Users, title: "Expert Instructors", desc: "500+ certified professionals" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                      <item.icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="mb-1 font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
              
              {/* Avatars */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
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
                  <p className="text-sm text-slate-600">15,000+ happy students</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 9: Minimal Cards */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 9</Badge>
          <span className="font-semibold">Minimal Cards</span>
          <span className="ml-2 text-sm text-muted-foreground">— Ultra-clean with card-based layout</span>
        </div>
        
        <div className="min-h-[650px] bg-white py-20">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left Content */}
              <div className="lg:col-span-5">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="sticky top-24"
                >
                  <p className="mb-4 text-sm font-medium text-amber-600">LEARN TO DRIVE</p>
                  
                  <h1 className="mb-6 text-4xl font-bold text-slate-900 lg:text-5xl">
                    Pass your test with confidence
                  </h1>
                  
                  <p className="mb-8 text-lg text-slate-600">
                    Expert instruction tailored to your pace. Book your first lesson in minutes.
                  </p>
                  
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button size="lg" className="bg-slate-900">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button size="lg" variant="outline">
                      View Pricing
                    </Button>
                  </div>
                  
                  <div className="mt-10 flex items-center gap-6">
                    <div className="flex -space-x-2">
                      {[testimonialSarah, testimonialJames, testimonialEmma].map((img, i) => (
                        <img key={i} src={img} alt="" className="h-10 w-10 rounded-full border-2 border-white object-cover" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-900">15K+</span> students passed
                    </p>
                  </div>
                </motion.div>
              </div>
              
              {/* Right Cards */}
              <div className="lg:col-span-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { img: testimonialSarah, name: "Sarah M.", quote: "Passed first time!", course: "Intensive" },
                    { img: testimonialJames, name: "James T.", quote: "Amazing instructor!", course: "Semi-Intensive" },
                    { img: testimonialEmma, name: "Emma L.", quote: "So patient and helpful!", course: "Weekly" },
                    { img: testimonialSarah, name: "Mike R.", quote: "Highly recommend!", course: "Intensive" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 ${i === 0 ? "sm:col-span-2" : ""}`}
                    >
                      <img src={item.img} alt="" className={`w-full object-cover ${i === 0 ? "h-64" : "h-40"}`} />
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-sm text-slate-500">{item.course} Course</p>
                          </div>
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                            {item.quote}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 10: Boxed Hero */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 10</Badge>
          <span className="font-semibold">Boxed Hero</span>
          <span className="ml-2 text-sm text-muted-foreground">— Content in bordered container</span>
        </div>
        
        <div className="min-h-[650px] bg-slate-50 py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
            >
              <div className="grid lg:grid-cols-2">
                {/* Left Content */}
                <div className="p-10 lg:p-16">
                  <div className="mb-8 flex items-center gap-3">
                    <img src={logo} alt="EveryDriver" className="h-8" />
                  </div>
                  
                  <h1 className="mb-6 text-4xl font-bold text-slate-900 lg:text-5xl">
                    Learn to drive the <span className="text-amber-500">smart way</span>
                  </h1>
                  
                  <p className="mb-8 text-lg text-slate-600">
                    Personalized lessons with top-rated instructors. Flexible scheduling that fits your life.
                  </p>
                  
                  <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-medium text-slate-700">Find instructors near you</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input placeholder="Postcode" className="h-12 pl-10" />
                      </div>
                      <Button className="h-12 bg-amber-500 px-6 hover:bg-amber-600">
                        Search
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-6">
                    {[
                      { icon: CheckCircle2, text: "Free cancellation" },
                      { icon: CheckCircle2, text: "Pass guarantee" },
                      { icon: CheckCircle2, text: "0% finance available" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <item.icon className="h-4 w-4 text-emerald-500" />
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Right Image */}
                <div className="relative">
                  <img src={testimonialSarah} alt="" className="h-full min-h-[400px] w-full object-cover" />
                  
                  {/* Floating Stats */}
                  <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-3">
                    {[
                      { value: "98%", label: "Pass Rate" },
                      { value: "500+", label: "Instructors" },
                      { value: "4.9★", label: "Rating" },
                    ].map((stat, i) => (
                      <div key={i} className="rounded-xl bg-white/90 p-3 text-center backdrop-blur-sm">
                        <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-slate-600">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Option 11: Stacked Sections */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 11</Badge>
          <span className="font-semibold">Stacked Sections</span>
          <span className="ml-2 text-sm text-muted-foreground">— Vertical flow with distinct sections</span>
        </div>
        
        <div className="min-h-[650px] bg-white">
          {/* Top Section */}
          <div className="border-b py-16">
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-3xl text-center"
              >
                <div className="mb-4 flex justify-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-6 text-slate-500">Trusted by 15,000+ learners across the UK</p>
                
                <h1 className="mb-6 text-5xl font-bold text-slate-900 lg:text-6xl">
                  Pass Your Driving Test
                  <span className="block text-amber-500">First Time</span>
                </h1>
                
                <p className="mb-8 text-xl text-slate-600">
                  Expert instructors. Flexible scheduling. Guaranteed results.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="bg-slate-900 px-8">
                    Book Now
                  </Button>
                  <Button size="lg" variant="outline" className="px-8">
                    View Courses
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Image Strip */}
          <div className="overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="flex"
            >
              {[testimonialSarah, testimonialJames, testimonialEmma, testimonialSarah, testimonialJames].map((img, i) => (
                <div key={i} className="flex-shrink-0">
                  <img src={img} alt="" className="h-64 w-80 object-cover" />
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Stats Section */}
          <div className="border-t py-12">
            <div className="container">
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {[
                  { value: "98%", label: "Pass Rate" },
                  { value: "15K+", label: "Students Passed" },
                  { value: "500+", label: "Instructors" },
                  { value: "24/7", label: "Online Booking" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center"
                  >
                    <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-slate-500">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 12: Playful Modern */}
      <section className="border-b">
        <div className="mb-4 bg-muted px-6 py-3">
          <Badge variant="outline" className="mr-2">Option 12</Badge>
          <span className="font-semibold">Playful Modern</span>
          <span className="ml-2 text-sm text-muted-foreground">— Fun, approachable design with shapes</span>
        </div>
        
        <div className="relative min-h-[650px] overflow-hidden bg-white py-20">
          {/* Decorative Shapes */}
          <div className="absolute -left-20 top-20 h-40 w-40 rounded-full bg-amber-100" />
          <div className="absolute -right-10 bottom-20 h-32 w-32 rounded-full bg-blue-100" />
          <div className="absolute right-1/4 top-10 h-24 w-24 rounded-full bg-emerald-100" />
          
          <div className="container relative">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-amber-700">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">New: Pay monthly from £99</span>
                </div>
                
                <h1 className="mb-6 text-5xl font-bold text-slate-900 lg:text-6xl">
                  Driving lessons
                  <span className="relative mx-2 inline-block">
                    <span className="relative z-10">made easy</span>
                    <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none">
                      <path d="M0,10 Q50,0 100,10 T200,10" stroke="#f59e0b" strokeWidth="4" fill="none" />
                    </svg>
                  </span>
                  🚗
                </h1>
                
                <p className="mb-8 text-xl text-slate-600">
                  Learn at your own pace with friendly, patient instructors. We'll get you road-ready in no time!
                </p>
                
                <div className="mb-8 flex flex-wrap gap-4">
                  <Button size="lg" className="rounded-full bg-amber-500 px-8 hover:bg-amber-600">
                    Find Your Instructor ✨
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full px-8">
                    How It Works
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {["🎯 98% Pass Rate", "⭐ 4.9 Rating", "💳 0% Finance"].map((text, i) => (
                    <span key={i} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                      {text}
                    </span>
                  ))}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative"
              >
                {/* Main Image */}
                <div className="relative z-10 overflow-hidden rounded-[2rem] shadow-xl">
                  <img src={testimonialSarah} alt="" className="w-full" />
                </div>
                
                {/* Floating Elements */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -left-8 top-1/4 z-20 rounded-2xl bg-white p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                      🎉
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">15,000+</p>
                      <p className="text-sm text-slate-500">Happy Drivers</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-4 -right-4 z-20 rounded-2xl bg-amber-500 px-6 py-4 text-white shadow-xl"
                >
                  <p className="text-2xl font-bold">From £30/hr</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-12 text-center">
        <p className="text-muted-foreground">Which hero design do you prefer? Let me know and I'll implement it!</p>
        <Link to="/">
          <Button className="mt-4">Back to Home</Button>
        </Link>
      </section>
    </div>
  );
}
