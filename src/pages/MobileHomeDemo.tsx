import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Star, MapPin, Clock, Shield, Award, ChevronRight, Car, Users, CheckCircle, Zap, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Testimonial images for social proof
import testimonialSarah from "@/assets/testimonial-sarah.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialEmma from "@/assets/testimonial-emma.jpg";
import testimonialPriya from "@/assets/testimonial-priya.jpg";
import heroImage from "@/assets/hero-driving.jpg";

const MobileHomeDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container flex items-center gap-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-lg font-semibold">Mobile Homepage Options</h1>
        </div>
      </div>

      <div className="container py-8 space-y-16">
        <p className="text-center text-muted-foreground max-w-2xl mx-auto">
          Compare these 4 mobile homepage layouts. Each is shown in a phone mockup to simulate the mobile experience.
        </p>

        {/* Option A: Immersive Hero with Floating Search */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
              Option A
            </span>
            <h2 className="text-2xl font-bold">Immersive Hero with Floating Search</h2>
            <p className="text-muted-foreground mt-2">Full-bleed hero image, floating search bar, horizontal scroll benefits</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar mockup */}
                <div className="h-11 bg-black/5 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Hero Section */}
                <div className="relative h-[420px]">
                  <img 
                    src={heroImage} 
                    alt="Driving" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Content over hero */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm mb-3">
                        #1 Driving School
                      </span>
                      <h1 className="text-3xl font-bold leading-tight mb-2">
                        Learn to Drive<br />
                        <span className="text-amber-400">With Confidence</span>
                      </h1>
                      <p className="text-white/80 text-sm mb-4">
                        Find your perfect instructor near you
                      </p>
                      
                      {/* Floating Search */}
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder="Enter your postcode..."
                          className="pl-12 pr-24 h-14 rounded-full bg-white text-foreground shadow-lg"
                        />
                        <Button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10">
                          <Search className="h-4 w-4 mr-2" />
                          Find
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Social Proof */}
                <div className="px-6 py-4 flex items-center gap-3 border-b">
                  <div className="flex -space-x-2">
                    {[testimonialSarah, testimonialJames, testimonialEmma].map((img, i) => (
                      <img key={i} src={img} alt="" className="w-8 h-8 rounded-full border-2 border-background" />
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-sm font-medium ml-1">4.9</span>
                    </div>
                    <p className="text-xs text-muted-foreground">50,000+ happy learners</p>
                  </div>
                </div>
                
                {/* Horizontal Benefits Scroll */}
                <div className="p-6">
                  <h3 className="font-semibold mb-4">Why Choose Us</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                    {[
                      { icon: Shield, title: "DVSA Approved", desc: "All instructors certified" },
                      { icon: Clock, title: "Flexible Times", desc: "Book lessons 24/7" },
                      { icon: Award, title: "High Pass Rate", desc: "90%+ first-time pass" },
                      { icon: CreditCard, title: "Easy Payments", desc: "Pay as you go" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex-shrink-0 w-36 p-4 bg-muted/50 rounded-xl"
                      >
                        <item.icon className="h-8 w-8 text-primary mb-2" />
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option B: Compact Card-Stack */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-sm font-medium mb-2">
              Option B
            </span>
            <h2 className="text-2xl font-bold">Compact Card-Stack</h2>
            <p className="text-muted-foreground mt-2">Condensed hero card with 2x2 benefit grid below</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-gradient-to-b from-primary/5 to-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar mockup */}
                <div className="h-11 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Logo & Nav */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">EveryDriver</span>
                  <Button variant="ghost" size="sm">Menu</Button>
                </div>
                
                {/* Hero Card */}
                <div className="px-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-primary rounded-3xl p-6 text-primary-foreground overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10">
                      <span className="inline-block px-2 py-1 bg-white/20 rounded-full text-xs mb-3">
                        Start Your Journey
                      </span>
                      <h1 className="text-2xl font-bold mb-2">
                        Find Your Perfect<br />Driving Instructor
                      </h1>
                      <p className="text-white/80 text-sm mb-4">
                        Local, certified, ready to teach
                      </p>
                      
                      {/* Search */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Your postcode"
                            className="pl-10 h-12 rounded-xl bg-white text-foreground"
                          />
                        </div>
                        <Button variant="secondary" className="h-12 px-6 rounded-xl">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Stats Row */}
                <div className="px-4 py-4 flex justify-around">
                  {[
                    { value: "50K+", label: "Learners" },
                    { value: "4.9★", label: "Rating" },
                    { value: "90%", label: "Pass Rate" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-lg font-bold text-primary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
                
                {/* 2x2 Benefit Grid */}
                <div className="px-4 pb-6">
                  <h3 className="font-semibold mb-4">Why Book With Us</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Shield, title: "DVSA Certified", desc: "Trusted instructors", color: "bg-blue-500" },
                      { icon: Clock, title: "Flexible Times", desc: "Book anytime", color: "bg-emerald-500" },
                      { icon: Award, title: "High Pass Rate", desc: "90%+ success", color: "bg-amber-500" },
                      { icon: CreditCard, title: "Easy Payments", desc: "Split the cost", color: "bg-purple-500" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="p-4 bg-card rounded-2xl border shadow-sm"
                      >
                        <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option C: Story-Style Sections */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-600 rounded-full text-sm font-medium mb-2">
              Option C
            </span>
            <h2 className="text-2xl font-bold">Story-Style Sections</h2>
            <p className="text-muted-foreground mt-2">Swipeable full-screen sections like social stories</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative">
                {/* Background Image */}
                <img 
                  src={heroImage} 
                  alt="Driving" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
                
                {/* Status bar mockup */}
                <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-center z-20">
                  <div className="w-32 h-6 bg-white/20 rounded-full backdrop-blur" />
                </div>
                
                {/* Story Progress Dots */}
                <div className="absolute top-14 left-0 right-0 flex gap-1 px-4 z-20">
                  {[1, 2, 3, 4].map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 h-1 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/30'}`}
                    />
                  ))}
                </div>
                
                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-6 z-10 text-white">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {/* Avatar row */}
                    <div className="flex items-center gap-3 mb-6">
                      <img src={testimonialSarah} alt="" className="w-10 h-10 rounded-full border-2 border-white" />
                      <div>
                        <div className="font-medium text-sm">Sarah passed!</div>
                        <div className="text-xs text-white/70">First time • 2 hours ago</div>
                      </div>
                    </div>
                    
                    <h1 className="text-3xl font-bold leading-tight mb-3">
                      Your Driving<br />
                      Journey Starts<br />
                      <span className="text-amber-400">Here</span>
                    </h1>
                    
                    <p className="text-white/80 mb-6">
                      Join 50,000+ learners who passed with us
                    </p>
                    
                    {/* Search */}
                    <div className="relative mb-4">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="Enter your postcode"
                        className="pl-12 h-14 rounded-2xl bg-white/10 backdrop-blur border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    
                    <Button className="w-full h-14 rounded-2xl text-lg" size="lg">
                      Find Instructors Near Me
                    </Button>
                    
                    {/* Quick Benefits */}
                    <div className="flex justify-around mt-6 pt-6 border-t border-white/20">
                      {[
                        { icon: Shield, label: "Certified" },
                        { icon: Clock, label: "Flexible" },
                        { icon: Award, label: "90% Pass" },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <item.icon className="h-5 w-5 text-amber-400" />
                          <span className="text-xs">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option D: Bottom-Sheet Search */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-sm font-medium mb-2">
              Option D (Recommended)
            </span>
            <h2 className="text-2xl font-bold">Bottom-Sheet Search</h2>
            <p className="text-muted-foreground mt-2">Hero with sticky expandable search + benefits sheet</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden relative">
                {/* Status bar mockup */}
                <div className="h-11 bg-primary flex items-center justify-center">
                  <div className="w-32 h-6 bg-white/20 rounded-full" />
                </div>
                
                {/* Hero Section - Shorter */}
                <div className="relative h-[280px] bg-primary">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full" />
                  </div>
                  
                  <div className="relative z-10 p-6 pt-2 text-primary-foreground">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-lg font-bold">EveryDriver</span>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                        Login
                      </Button>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-3">
                        🚗 Trusted by 50K+ Learners
                      </span>
                      <h1 className="text-3xl font-bold leading-tight">
                        Start Your<br />
                        Driving Journey<br />
                        <span className="text-amber-300">Today</span>
                      </h1>
                    </motion.div>
                  </div>
                </div>
                
                {/* Bottom Sheet */}
                <motion.div 
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[2rem] shadow-2xl"
                  style={{ top: '260px' }}
                >
                  {/* Handle */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-muted rounded-full" />
                  </div>
                  
                  <div className="px-6 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(100% - 24px)' }}>
                    {/* Search */}
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Find Instructors Near You</h3>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Enter postcode"
                            className="pl-10 h-12 rounded-xl"
                          />
                        </div>
                        <Button className="h-12 px-5 rounded-xl">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Benefits List */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Why Choose Us</h3>
                      {[
                        { icon: Shield, title: "DVSA Approved Instructors", desc: "All certified and background checked" },
                        { icon: Calendar, title: "Flexible Scheduling", desc: "Book lessons that fit your life" },
                        { icon: Award, title: "90%+ Pass Rate", desc: "Learn from the best instructors" },
                        { icon: CreditCard, title: "Easy Payment Options", desc: "Pay weekly or monthly installments" },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl"
                        >
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <item.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Testimonial Preview */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <img src={testimonialPriya} alt="" className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground italic">
                            "Passed first time thanks to my amazing instructor!"
                          </p>
                          <p className="text-xs font-medium mt-1">— Priya, Leeds</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Option E: Split Screen Hero */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-sm font-medium mb-2">
              Option E
            </span>
            <h2 className="text-2xl font-bold">Split Screen Hero</h2>
            <p className="text-muted-foreground mt-2">Diagonal split with image and content sides</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar */}
                <div className="h-11 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Split Hero */}
                <div className="relative h-[400px] overflow-hidden">
                  {/* Diagonal clip */}
                  <div className="absolute inset-0 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 100%)' }}>
                    <img src={heroImage} alt="" className="w-full h-full object-cover opacity-30" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 p-6 pt-4">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-xl font-bold text-primary-foreground">EveryDriver</span>
                      <Button variant="ghost" size="sm" className="text-white">
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-primary-foreground"
                    >
                      <h1 className="text-3xl font-bold leading-tight mb-3">
                        Your Road<br />
                        to Freedom<br />
                        <span className="text-amber-300">Starts Here</span>
                      </h1>
                      <p className="text-white/80 text-sm mb-6">
                        Expert instructors. Flexible lessons.<br />
                        Results guaranteed.
                      </p>
                    </motion.div>
                  </div>
                  
                  {/* Floating testimonial */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute bottom-4 right-4 left-4 bg-white rounded-2xl p-4 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <img src={testimonialEmma} alt="" className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">"Best decision I ever made!"</p>
                        <p className="text-xs font-medium">— Emma, Manchester</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Search Section */}
                <div className="p-6 -mt-2">
                  <div className="bg-muted/50 rounded-2xl p-4">
                    <h3 className="font-semibold mb-3 text-center">Find Your Instructor</h3>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Postcode" className="pl-10 h-12 rounded-xl" />
                      </div>
                      <Button className="h-12 px-6 rounded-xl">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Benefits */}
                <div className="px-6 pb-6 space-y-3">
                  {[
                    { icon: Shield, title: "Fully Certified", desc: "DVSA approved instructors" },
                    { icon: Calendar, title: "Book Instantly", desc: "No waiting, start this week" },
                    { icon: Award, title: "Pass Guarantee", desc: "90%+ first-time success" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-4 p-3 border rounded-xl"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option F: Card Carousel Hero */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-cyan-500/10 text-cyan-600 rounded-full text-sm font-medium mb-2">
              Option F
            </span>
            <h2 className="text-2xl font-bold">Card Carousel Hero</h2>
            <p className="text-muted-foreground mt-2">Swipeable testimonial cards with floating search</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-gradient-to-br from-primary via-primary to-primary/80 rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar */}
                <div className="h-11 flex items-center justify-center">
                  <div className="w-32 h-6 bg-white/20 rounded-full" />
                </div>
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between text-primary-foreground">
                  <span className="text-lg font-bold">EveryDriver</span>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {[testimonialSarah, testimonialJames].map((img, i) => (
                        <img key={i} src={img} alt="" className="w-6 h-6 rounded-full border-2 border-primary" />
                      ))}
                    </div>
                    <span className="text-xs">50K+</span>
                  </div>
                </div>
                
                {/* Main Content */}
                <div className="px-6 text-primary-foreground">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h1 className="text-3xl font-bold leading-tight mb-2">
                      Drive Into<br />
                      Your Future
                    </h1>
                    <p className="text-white/80 text-sm mb-6">
                      Join thousands who passed with confidence
                    </p>
                  </motion.div>
                  
                  {/* Search Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-4 shadow-xl mb-6"
                  >
                    <p className="text-foreground text-sm font-medium mb-3">Find instructors near you</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Enter postcode" className="pl-10 h-11 rounded-xl" />
                      </div>
                      <Button className="h-11 rounded-xl">Search</Button>
                    </div>
                  </motion.div>
                </div>
                
                {/* Testimonial Cards Carousel */}
                <div className="px-6 pb-4">
                  <p className="text-white/60 text-xs mb-3">Recent passes ✨</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
                    {[
                      { img: testimonialSarah, name: "Sarah", location: "Leeds", quote: "Passed first time!" },
                      { img: testimonialJames, name: "James", location: "London", quote: "Amazing instructor!" },
                      { img: testimonialPriya, name: "Priya", location: "Bristol", quote: "So patient and kind!" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex-shrink-0 w-48 bg-white/10 backdrop-blur rounded-xl p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img src={item.img} alt="" className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="text-white font-medium text-sm">{item.name}</p>
                            <p className="text-white/60 text-xs">{item.location}</p>
                          </div>
                        </div>
                        <p className="text-white/80 text-sm italic">"{item.quote}"</p>
                        <div className="flex mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="mx-6 bg-white/10 backdrop-blur rounded-2xl p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center text-primary-foreground">
                    {[
                      { value: "4.9", label: "Rating" },
                      { value: "90%", label: "Pass Rate" },
                      { value: "24/7", label: "Booking" },
                    ].map((stat, i) => (
                      <div key={i}>
                        <div className="text-xl font-bold">{stat.value}</div>
                        <div className="text-xs text-white/60">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option G: Minimal Clean */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-slate-500/10 text-slate-600 rounded-full text-sm font-medium mb-2">
              Option G
            </span>
            <h2 className="text-2xl font-bold">Minimal Clean</h2>
            <p className="text-muted-foreground mt-2">Whitespace-focused with bold typography</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar */}
                <div className="h-11 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Minimal Header */}
                <div className="px-6 py-6 flex items-center justify-between">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <Car className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Login
                  </Button>
                </div>
                
                {/* Giant Typography */}
                <div className="px-6 py-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h1 className="text-5xl font-bold leading-[1.1] tracking-tight mb-4">
                      Learn to<br />
                      <span className="text-primary">drive.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                      Find certified instructors in your area and book your first lesson today.
                    </p>
                  </motion.div>
                  
                  {/* Search */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="Enter your postcode"
                        className="pl-12 h-14 rounded-2xl border-2 text-lg"
                      />
                    </div>
                    <Button className="w-full h-14 rounded-2xl text-lg" size="lg">
                      Find Instructors
                    </Button>
                  </motion.div>
                </div>
                
                {/* Minimal Stats */}
                <div className="px-6 py-8 border-t">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    {[
                      { value: "50K+", label: "Learners" },
                      { value: "4.9", label: "Rating" },
                      { value: "90%", label: "Pass Rate" },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Simple Features */}
                <div className="px-6 pb-8">
                  {[
                    "DVSA approved instructors",
                    "Flexible scheduling",
                    "Pay as you learn",
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3 py-3 border-b last:border-0"
                    >
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option H: App Store Style */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-full text-sm font-medium mb-2">
              Option H
            </span>
            <h2 className="text-2xl font-bold">App Store Style</h2>
            <p className="text-muted-foreground mt-2">Bold gradients with app-like featured sections</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar */}
                <div className="h-11 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Header */}
                <div className="px-6 py-4">
                  <h2 className="text-2xl font-bold">Good morning! 👋</h2>
                  <p className="text-muted-foreground">Ready to start your driving journey?</p>
                </div>
                
                {/* Featured Card */}
                <div className="px-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white/10 rounded-full" />
                    
                    <div className="relative z-10">
                      <span className="inline-block px-2 py-1 bg-white/20 rounded-full text-xs mb-4">
                        🔥 Most Popular
                      </span>
                      <h3 className="text-2xl font-bold mb-2">Find Your Instructor</h3>
                      <p className="text-white/80 text-sm mb-4">
                        50,000+ learners trust us for their driving lessons
                      </p>
                      
                      {/* Search */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input 
                            placeholder="Postcode"
                            className="h-12 rounded-xl bg-white/20 border-white/30 text-white placeholder:text-white/60"
                          />
                        </div>
                        <Button variant="secondary" className="h-12 px-5 rounded-xl">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Quick Actions */}
                <div className="px-4 py-6">
                  <h3 className="font-semibold mb-4 px-2">Quick Actions</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { icon: Search, label: "Search", color: "bg-blue-500" },
                      { icon: Calendar, label: "Book", color: "bg-emerald-500" },
                      { icon: CreditCard, label: "Finance", color: "bg-amber-500" },
                      { icon: Award, label: "Courses", color: "bg-purple-500" },
                    ].map((action, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground">{action.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Featured Testimonials */}
                <div className="px-4 pb-6">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-semibold">Recent Passes</h3>
                    <Button variant="ghost" size="sm" className="text-primary">
                      See all
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { img: testimonialSarah, name: "Sarah", when: "2h ago", text: "First time pass! 🎉" },
                      { img: testimonialJames, name: "James", when: "5h ago", text: "Best instructor ever!" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl"
                      >
                        <img src={item.img} alt="" className="w-12 h-12 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{item.name}</span>
                            <span className="text-xs text-muted-foreground">{item.when}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.text}</p>
                          <div className="flex mt-1">
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
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

        {/* Footer */}
        <div className="text-center py-8 border-t">
          <p className="text-muted-foreground mb-4">Which layout do you prefer?</p>
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileHomeDemo;
