import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Star, MapPin, Clock, Shield, Award, ChevronRight, Car, Users, CheckCircle, Zap, Calendar, CreditCard, BookOpen, RotateCcw, Banknote, GraduationCap, Menu, Home, Play, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIncludedFeatures } from "@/hooks/useIncludedFeatures";

// Testimonial images for social proof
import testimonialSarah from "@/assets/testimonial-sarah.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialEmma from "@/assets/testimonial-emma.jpg";
import testimonialPriya from "@/assets/testimonial-priya.jpg";
import heroImage from "@/assets/hero-driving.jpg";
import heroLearnerMobile from "@/assets/hero-learner-mobile.jpg";
const everyDriverLogo = "/everydriver-logo-main.png";
import logoKlarna from "@/assets/logo-klarna.png";
import logoClearpay from "@/assets/logo-clearpay.webp";
import logoIdeal4Finance from "@/assets/logo-ideal4finance.png";

const MobileHomeDemo = () => {
  const { features: includedFeatures, loading: featuresLoading } = useIncludedFeatures();
  
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

        {/* Option I: David Lloyd Style - Postcode Top, Course Tiles, Benefits */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-pink-500/10 text-pink-600 rounded-full text-sm font-medium mb-2">
              Option I (Your Request)
            </span>
            <h2 className="text-2xl font-bold">Course Discovery Layout</h2>
            <p className="text-muted-foreground mt-2">Postcode search top, course categories, and benefit tiles</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar */}
                <div className="h-11 bg-background flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Header with Menu and Logo */}
                <div className="px-4 py-3 flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Menu className="h-5 w-5" />
                  </Button>
                  <img src={everyDriverLogo} alt="EveryDriver" className="h-6 flex-1 object-contain object-left" />
                </div>
                
                {/* Full Width Postcode Search */}
                <div className="px-4 pb-4">
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="Enter your postcode..."
                        className="pl-12 h-12 rounded-xl bg-muted/50 border-0"
                      />
                    </div>
                    <Button className="h-12 px-6 rounded-xl">
                      <Search className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Hero Image with Overlay Card */}
                <div className="relative mx-4">
                  <div className="relative h-[240px] rounded-3xl overflow-hidden">
                    <img 
                      src={heroLearnerMobile} 
                      alt="Learning to drive" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  </div>
                  
                  {/* Motivational Card Overlay */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -bottom-10 left-4 right-4 bg-card rounded-2xl p-4 shadow-xl border"
                  >
                    <h3 className="font-bold text-base uppercase tracking-wide">Start Your Journey</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Money back if you pass first time, a FREE retest if you don't
                    </p>
                  </motion.div>
                </div>
                
                {/* Spacer for overlay */}
                <div className="h-14" />
                
                {/* Course Category Tiles */}
                <div className="px-4 pt-2 space-y-3">
                  {/* Full Width - Intensive Courses */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-card border border-border/50 rounded-2xl flex items-center gap-4 shadow-lg"
                  >
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
                      <Zap className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Intensive Courses</h4>
                      <p className="text-sm text-muted-foreground">Pass in 1-2 weeks</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                  
                  {/* 2x Grid - Semi Intensive & Lessons */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="p-4 bg-card border border-border/50 rounded-2xl shadow-lg"
                    >
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center mb-3 shadow-md">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-sm">Semi Intensive</h4>
                      <p className="text-xs text-muted-foreground mt-1">2-4 weeks</p>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="p-4 bg-card border border-border/50 rounded-2xl shadow-lg"
                    >
                      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mb-3 shadow-md">
                        <Car className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-sm">Weekly Lessons</h4>
                      <p className="text-xs text-muted-foreground mt-1">Flexible pace</p>
                    </motion.div>
                  </div>
                  
                  {/* What's Included Section - CMS Powered 2x3 Grid */}
                  <div className="pt-3">
                    <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-3">What's Included</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {includedFeatures.slice(0, 6).map((feature, i) => {
                        const IconComponent = feature.icon;
                        return (
                          <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                            className="relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-lg"
                          >
                            {feature.image_url ? (
                              <>
                                <img 
                                  src={feature.image_url} 
                                  alt={feature.title}
                                  className="w-full h-24 object-cover"
                                />
                                <div className="p-3">
                                  <h4 className="font-medium text-sm">{feature.title}</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{feature.description}</p>
                                </div>
                              </>
                            ) : (
                              <div className="p-4">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-2 shadow-md">
                                  <IconComponent className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <h4 className="font-medium text-sm">{feature.title}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{feature.description}</p>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Payment Providers Section */}
                <div className="px-4 pt-4 pb-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85 }}
                    className="bg-card border border-border/50 rounded-2xl p-4 shadow-lg"
                  >
                    <p className="text-xs text-muted-foreground text-center mb-3">Pay your way with</p>
                    <div className="flex items-center justify-center gap-6">
                      <img src={logoKlarna} alt="Klarna" className="h-10 object-contain" />
                      <img src={logoClearpay} alt="Clearpay" className="h-8 object-contain" />
                      <img src={logoIdeal4Finance} alt="Ideal4Finance" className="h-10 object-contain" />
                    </div>
                  </motion.div>
                </div>
                
                {/* Promo Banner */}
                <div className="px-4 pb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="relative h-28 rounded-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/80" />
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
                    <div className="relative z-10 p-4 text-primary-foreground h-full flex flex-col justify-center">
                      <h4 className="font-bold">Refer a Friend</h4>
                      <p className="text-sm text-white/80">Get £50 off your next course</p>
                    </div>
                  </motion.div>
                </div>
                
                {/* Bottom Navigation */}
                <div className="sticky bottom-0 bg-background border-t px-2 py-2">
                  <div className="flex justify-around">
                    {[
                      { icon: Home, label: "Home", active: true },
                      { icon: Calendar, label: "Book", active: false },
                      { icon: Play, label: "Theory", active: false },
                      { icon: CreditCard, label: "Pay", active: false },
                      { icon: Gift, label: "Rewards", active: false },
                    ].map((item, i) => (
                      <div key={i} className={`flex flex-col items-center gap-1 px-3 py-1 ${item.active ? 'text-primary' : 'text-muted-foreground'}`}>
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option J: Club App Style */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-sm font-medium mb-2">
              Option J
            </span>
            <h2 className="text-2xl font-bold">Club App Style</h2>
            <p className="text-muted-foreground mt-2">Progress ring, tile navigation, promotional banners</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar mockup */}
                <div className="h-11 bg-black/5 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Menu className="h-5 w-5" />
                  </Button>
                  <img src={everyDriverLogo} alt="EveryDriver" className="h-8" />
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">London</span>
                  </div>
                </div>
                
                {/* Hero Image with Overlapping Card */}
                <div className="relative">
                  <img 
                    src={heroLearnerMobile} 
                    alt="Learning to drive" 
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* Motivational Card - Overlapping */}
                  <div className="mx-4 -mt-12 relative z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border rounded-2xl p-4 shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        {/* Progress Ring */}
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" 
                                    strokeWidth="4" className="text-muted/30" />
                            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor"
                                    strokeWidth="4" className="text-primary" 
                                    strokeDasharray="176" strokeDashoffset="106" 
                                    strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold">2</span>
                            <span className="text-[10px] text-muted-foreground leading-none">/5</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Keep going!</h3>
                          <p className="text-sm text-muted-foreground">3 more lessons until your test</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Primary Action Tile */}
                <div className="px-4 pt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-primary text-primary-foreground rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">View Available Courses</h4>
                      <p className="text-sm text-white/80">Find your perfect package</p>
                    </div>
                    <ChevronRight className="h-5 w-5" />
                  </motion.div>
                </div>
                
                {/* 2x2 Feature Grid */}
                <div className="px-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: BookOpen, title: "Theory Pro", subtitle: "Pass first time", color: "rose" },
                      { icon: Calendar, title: "Test Booking", subtitle: "We handle it", color: "rose" },
                      { icon: Clock, title: "Flexible Hours", subtitle: "Your schedule", color: "rose" },
                      { icon: CreditCard, title: "Easy Payments", subtitle: "Split the cost", color: "rose" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className="p-4 bg-card border rounded-2xl"
                      >
                        <div className={`w-12 h-12 bg-${item.color}-500/10 rounded-2xl flex items-center justify-center mb-3`}>
                          <item.icon className={`h-6 w-6 text-${item.color}-500`} />
                        </div>
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Promo Banners Carousel */}
                <div className="px-4 pt-6 pb-4">
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {[
                      { title: "Refer a Friend", subtitle: "Get £50 off", bg: "bg-gradient-to-br from-amber-500 to-orange-600" },
                      { title: "Free Retest", subtitle: "If you fail", bg: "bg-gradient-to-br from-emerald-500 to-teal-600" },
                      { title: "Theory Bundle", subtitle: "Save 20%", bg: "bg-gradient-to-br from-violet-500 to-purple-600" },
                    ].map((promo, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className={`flex-shrink-0 w-40 h-24 ${promo.bg} rounded-2xl p-4 text-white`}
                      >
                        <h4 className="font-bold text-sm">{promo.title}</h4>
                        <p className="text-xs text-white/80">{promo.subtitle}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Bottom Navigation */}
                <div className="sticky bottom-0 bg-background border-t px-2 py-2">
                  <div className="flex justify-around">
                    {[
                      { icon: Home, label: "Home", active: true },
                      { icon: Calendar, label: "Book", active: false },
                      { icon: BookOpen, label: "Theory", active: false },
                      { icon: CreditCard, label: "Pay", active: false },
                      { icon: Gift, label: "Benefits", active: false },
                    ].map((item, i) => (
                      <div key={i} className={`flex flex-col items-center gap-1 px-3 py-1 ${item.active ? 'text-primary' : 'text-muted-foreground'}`}>
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option K: Lifestyle Focus */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-sky-500/10 text-sky-600 rounded-full text-sm font-medium mb-2">
              Option K
            </span>
            <h2 className="text-2xl font-bold">Lifestyle Focus</h2>
            <p className="text-muted-foreground mt-2">Hero-heavy design with floating glassmorphic elements</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden overflow-y-auto relative">
                {/* Hero - 70% height */}
                <div className="relative h-[520px]">
                  <img 
                    src={heroImage} 
                    alt="Driving" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  
                  {/* Status bar mockup */}
                  <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-center z-20">
                    <div className="w-32 h-6 bg-white/20 rounded-full backdrop-blur" />
                  </div>
                  
                  {/* Transparent Header */}
                  <div className="absolute top-11 left-0 right-0 px-4 py-3 flex items-center justify-between z-20">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/20">
                      <Menu className="h-5 w-5" />
                    </Button>
                    <img src={everyDriverLogo} alt="EveryDriver" className="h-8 brightness-0 invert" />
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/20">
                      <MapPin className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Floating Search Bar */}
                  <div className="absolute bottom-24 left-4 right-4 z-20">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-1"
                    >
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                        <Input 
                          placeholder="Enter your postcode..."
                          className="pl-12 pr-4 h-12 rounded-xl bg-transparent border-0 text-white placeholder:text-white/50 focus-visible:ring-0"
                        />
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Hero Text */}
                  <div className="absolute bottom-36 left-4 right-4 z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h1 className="text-4xl font-bold text-white leading-tight mb-2">
                        Your Road<br />
                        <span className="text-primary">To Freedom</span>
                      </h1>
                    </motion.div>
                  </div>
                </div>
                
                {/* Stats Row */}
                <div className="px-4 -mt-8 relative z-20">
                  <div className="flex justify-around bg-card border rounded-2xl p-4 shadow-lg">
                    {[
                      { value: "90%", label: "Pass Rate", ring: 90 },
                      { value: "50K+", label: "Learners", ring: 75 },
                      { value: "4.9", label: "Rating", ring: 98 },
                    ].map((stat, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="relative w-12 h-12">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" 
                                    strokeWidth="3" className="text-muted/30" />
                            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor"
                                    strokeWidth="3" className="text-primary" 
                                    strokeDasharray={`${stat.ring * 1.26} 126`}
                                    strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold">{stat.value}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="px-4 py-6">
                  <div className="flex justify-around">
                    {[
                      { icon: Zap, label: "Intensive", color: "bg-amber-500" },
                      { icon: Calendar, label: "Weekly", color: "bg-emerald-500" },
                      { icon: BookOpen, label: "Theory", color: "bg-violet-500" },
                      { icon: Gift, label: "Deals", color: "bg-rose-500" },
                    ].map((action, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-medium">{action.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Featured Testimonial */}
                <div className="px-4 pb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card border rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <img src={testimonialSarah} alt="" className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">Sarah M.</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          "Passed first time! My instructor was amazing and so patient."
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option L: Dashboard Cards */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-teal-500/10 text-teal-600 rounded-full text-sm font-medium mb-2">
              Option L
            </span>
            <h2 className="text-2xl font-bold">Dashboard Cards</h2>
            <p className="text-muted-foreground mt-2">App-like dashboard with modular cards and timeline</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-gradient-to-b from-primary/5 to-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar mockup */}
                <div className="h-11 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Greeting Header */}
                <div className="px-4 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Good morning</p>
                    <h2 className="text-xl font-bold">Ready to learn?</h2>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 relative">
                    <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                    <Users className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Featured Search Card */}
                <div className="px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-primary via-primary to-primary/80 rounded-3xl p-6 text-primary-foreground overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
                    
                    <div className="relative z-10">
                      <span className="inline-block px-2 py-1 bg-white/20 rounded-full text-xs mb-3">
                        🚗 Start Your Journey
                      </span>
                      <h3 className="text-xl font-bold mb-4">Find Your Perfect Instructor</h3>
                      
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Enter postcode..."
                          className="pl-11 h-12 rounded-xl bg-white text-foreground"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Quick Stats Pills */}
                <div className="px-4 py-4 flex gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { icon: Star, value: "4.9", label: "Rating" },
                    { icon: Award, value: "90%", label: "Pass Rate" },
                    { icon: Users, value: "500+", label: "Instructors" },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-card border rounded-full"
                    >
                      <stat.icon className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Action Grid */}
                <div className="px-4">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Calendar, title: "Book Lesson", desc: "Schedule now", color: "bg-blue-500" },
                      { icon: BookOpen, title: "Theory Prep", desc: "Study online", color: "bg-emerald-500" },
                      { icon: CreditCard, title: "Payments", desc: "Manage billing", color: "bg-amber-500" },
                      { icon: GraduationCap, title: "Progress", desc: "Track learning", color: "bg-purple-500" },
                    ].map((action, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className="p-4 bg-card border rounded-2xl flex items-center gap-3"
                      >
                        <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center`}>
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{action.title}</h4>
                          <p className="text-xs text-muted-foreground">{action.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Recent Passes Timeline */}
                <div className="px-4 py-6">
                  <h3 className="font-semibold mb-3">Recent Passes 🎉</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Emma", time: "2 hours ago", img: testimonialEmma },
                      { name: "James", time: "Yesterday", img: testimonialJames },
                      { name: "Priya", time: "2 days ago", img: testimonialPriya },
                    ].map((pass, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-card border rounded-xl"
                      >
                        <img src={pass.img} alt="" className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{pass.name} passed!</span>
                          <p className="text-xs text-muted-foreground">{pass.time}</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Promo Card */}
                <div className="px-4 pb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="relative rounded-2xl overflow-hidden"
                  >
                    <img src={heroLearnerMobile} alt="" className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                    <div className="absolute inset-0 p-4 flex flex-col justify-center text-white">
                      <h4 className="font-bold">Start Your Journey</h4>
                      <p className="text-sm text-white/80">Book your first lesson today</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option M: Premium Minimal */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-slate-500/10 text-slate-600 rounded-full text-sm font-medium mb-2">
              Option M
            </span>
            <h2 className="text-2xl font-bold">Premium Minimal</h2>
            <p className="text-muted-foreground mt-2">High-end, whitespace-focused with bold typography</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar mockup */}
                <div className="h-11 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Minimal Header */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Car className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Menu</span>
                </div>
                
                {/* Hero Typography */}
                <div className="px-6 pt-8 pb-12">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h1 className="text-5xl font-bold leading-[1.1] tracking-tight">
                      Your<br />
                      Journey<br />
                      <span className="text-primary">Awaits</span>
                    </h1>
                  </motion.div>
                </div>
                
                {/* Full-width Search */}
                <div className="px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="relative">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="Enter your postcode"
                        className="pl-14 h-14 rounded-full border-2 text-base"
                      />
                    </div>
                  </motion.div>
                </div>
                
                {/* Trust Badges */}
                <div className="px-6 py-8">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-4"
                  >
                    {[
                      { icon: Shield, label: "DVSA" },
                      { icon: Star, label: "4.9★" },
                      { icon: Award, label: "90% Pass" },
                    ].map((badge, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full">
                        <badge.icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">{badge.label}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
                
                {/* Feature List */}
                <div className="px-6 space-y-4">
                  {[
                    { title: "DVSA Certified Instructors", desc: "All our instructors are fully qualified" },
                    { title: "Flexible Scheduling", desc: "Book lessons that fit your lifestyle" },
                    { title: "Money-Back Guarantee", desc: "Free retest if you don't pass" },
                    { title: "Easy Payment Plans", desc: "Split the cost with Klarna or Clearpay" },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* CTA Button */}
                <div className="px-6 py-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Button className="w-full h-14 rounded-full text-base font-semibold">
                      Find Instructors
                    </Button>
                  </motion.div>
                </div>
                
                {/* Social Proof */}
                <div className="px-6 pb-8">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <div className="flex -space-x-3">
                      {[testimonialSarah, testimonialJames, testimonialEmma, testimonialPriya].map((img, i) => (
                        <img key={i} src={img} alt="" className="w-10 h-10 rounded-full border-2 border-background" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Join <span className="font-semibold text-foreground">50K+</span> learners
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option N: Hybrid Social Proof */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 rounded-full text-sm font-medium mb-2">
              Option N
            </span>
            <h2 className="text-2xl font-bold">Hybrid Social Proof</h2>
            <p className="text-muted-foreground mt-2">Glassmorphic search, avatar stacks, and modular action grid</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar mockup */}
                <div className="h-11 bg-black/5 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Hero Section with Glassmorphic Overlay */}
                <div className="relative h-[350px]">
                  <img 
                    src={heroImage} 
                    alt="Driving" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-background" />
                  
                  {/* Floating Trust Badges */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-4 left-4 right-4 flex justify-between"
                  >
                    <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      DVSA Approved
                    </div>
                    <div className="px-3 py-1.5 bg-amber-500/90 backdrop-blur-md rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      4.9 Rating
                    </div>
                  </motion.div>
                  
                  {/* Content over hero */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-white"
                    >
                      <h1 className="text-2xl font-bold leading-tight mb-2">
                        Learn to Drive<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">With Confidence</span>
                      </h1>
                      
                      {/* Avatar Stack Social Proof */}
                      <div className="flex items-center gap-3 mt-4">
                        <div className="flex -space-x-3">
                          {[testimonialSarah, testimonialJames, testimonialEmma, testimonialPriya].map((img, i) => (
                            <motion.img 
                              key={i} 
                              src={img} 
                              alt="" 
                              className="w-9 h-9 rounded-full border-2 border-white shadow-lg"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + i * 0.1 }}
                            />
                          ))}
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold">50K+</span> learners passed
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Glassmorphic Search Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mx-4 -mt-8 relative z-10"
                >
                  <div className="bg-card/80 backdrop-blur-xl border shadow-xl rounded-2xl p-4">
                    <p className="text-sm font-medium mb-3">Find your instructor</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Enter postcode..."
                          className="pl-10 h-12 rounded-xl"
                        />
                      </div>
                      <Button className="h-12 px-5 rounded-xl">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
                
                {/* Modular Action Grid */}
                <div className="p-4 pt-6">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Car, title: "Intensive", desc: "Pass in 1-2 weeks", color: "from-blue-500 to-blue-600" },
                      { icon: Calendar, title: "Weekly", desc: "Flexible lessons", color: "from-emerald-500 to-emerald-600" },
                      { icon: BookOpen, title: "Theory Prep", desc: "Free with course", color: "from-purple-500 to-purple-600" },
                      { icon: CreditCard, title: "Pay Monthly", desc: "0% finance options", color: "from-amber-500 to-amber-600" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="group relative overflow-hidden rounded-2xl p-4 bg-card border shadow-sm hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Bottom Stats Bar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mx-4 mt-4 p-4 bg-muted/50 rounded-2xl flex justify-around"
                >
                  {[
                    { value: "90%", label: "Pass Rate" },
                    { value: "24/7", label: "Support" },
                    { value: "Free", label: "Retest Cover" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-lg font-bold text-primary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Option O: Video-First Hero */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-sm font-medium mb-2">
              Option O
            </span>
            <h2 className="text-2xl font-bold">Video-First Hero</h2>
            <p className="text-muted-foreground mt-2">Full-width video thumbnail with testimonial integration</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar mockup */}
                <div className="h-11 bg-black/5 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <img src={everyDriverLogo} alt="EveryDriver" className="h-6" />
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Video Hero Section */}
                <div className="relative mx-4 rounded-2xl overflow-hidden">
                  <img 
                    src={heroLearnerMobile} 
                    alt="Learner driving" 
                    className="w-full h-[220px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  
                  {/* Play Button */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:scale-105 transition-transform">
                      <Play className="h-7 w-7 text-primary fill-primary ml-1" />
                    </div>
                  </motion.div>
                  
                  {/* Floating Notification */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute top-3 right-3 bg-white/95 backdrop-blur rounded-xl p-2 shadow-lg flex items-center gap-2"
                  >
                    <img src={testimonialSarah} alt="" className="w-8 h-8 rounded-full" />
                    <div className="pr-2">
                      <p className="text-xs font-semibold">Sarah just passed! 🎉</p>
                      <p className="text-[10px] text-muted-foreground">First time • Leeds</p>
                    </div>
                  </motion.div>
                  
                  {/* Video Caption */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-medium">Watch Sarah's success story</p>
                    <p className="text-white/70 text-xs">2 min watch</p>
                  </div>
                </div>
                
                {/* Pill Category Selectors */}
                <div className="flex gap-2 px-4 py-4 overflow-x-auto">
                  {[
                    { label: "Intensive", icon: Zap, active: true },
                    { label: "Weekly", icon: Calendar, active: false },
                    { label: "Theory", icon: BookOpen, active: false },
                  ].map((cat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                        cat.active 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <cat.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{cat.label}</span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Search Section */}
                <div className="px-4 pb-4">
                  <h2 className="text-xl font-bold mb-1">Find your instructor</h2>
                  <p className="text-sm text-muted-foreground mb-4">Enter your postcode to see availability</p>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="e.g. LS1 4AP"
                        className="pl-11 h-12 rounded-xl"
                      />
                    </div>
                    <Button className="h-12 px-6 rounded-xl">
                      Search
                    </Button>
                  </div>
                </div>
                
                {/* Testimonial Cards Scroll */}
                <div className="px-4 pb-4">
                  <h3 className="font-semibold mb-3">Recent success stories</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                    {[
                      { img: testimonialJames, name: "James", location: "Manchester", text: "Passed first time!" },
                      { img: testimonialEmma, name: "Emma", location: "London", text: "Amazing instructor" },
                      { img: testimonialPriya, name: "Priya", location: "Birmingham", text: "So supportive" },
                    ].map((testimonial, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex-shrink-0 w-[200px] p-3 bg-card border rounded-xl"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img src={testimonial.img} alt="" className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="text-sm font-medium">{testimonial.name}</p>
                            <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">"{testimonial.text}"</p>
                        <div className="flex mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Payment Providers */}
                <div className="px-4 pb-6">
                  <p className="text-xs text-center text-muted-foreground mb-3">Flexible payment options</p>
                  <div className="flex items-center justify-center gap-6">
                    <img src={logoKlarna} alt="Klarna" className="h-5 opacity-60" />
                    <img src={logoClearpay} alt="Clearpay" className="h-5 opacity-60" />
                    <img src={logoIdeal4Finance} alt="Finance" className="h-5 opacity-60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option P: Map-Centric Discovery */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-teal-500/10 text-teal-600 rounded-full text-sm font-medium mb-2">
              Option P
            </span>
            <h2 className="text-2xl font-bold">Map-Centric Discovery</h2>
            <p className="text-muted-foreground mt-2">Interactive map preview with instructor cards</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar mockup */}
                <div className="h-11 bg-black/5 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Header with Location */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Your location</p>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Leeds, LS1</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Map Preview */}
                <div className="relative mx-4 h-[200px] rounded-2xl overflow-hidden bg-muted">
                  {/* Fake map background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-emerald-100 dark:from-blue-900/30 dark:to-emerald-900/30">
                    {/* Map grid lines */}
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute w-full h-px bg-foreground" style={{ top: `${i * 20}%` }} />
                      ))}
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute h-full w-px bg-foreground" style={{ left: `${i * 20}%` }} />
                      ))}
                    </div>
                  </div>
                  
                  {/* Instructor Pins */}
                  {[
                    { top: '30%', left: '25%' },
                    { top: '45%', left: '55%' },
                    { top: '60%', left: '35%' },
                    { top: '40%', left: '70%' },
                    { top: '55%', left: '60%' },
                  ].map((pos, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                      className="absolute w-8 h-8 -ml-4 -mt-4"
                      style={{ top: pos.top, left: pos.left }}
                    >
                      <div className="w-full h-full bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Car className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Availability Pill */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute bottom-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur rounded-full shadow-lg flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium">5 instructors within 2 miles</span>
                  </motion.div>
                </div>
                
                {/* Quick Filters */}
                <div className="flex gap-2 px-4 py-4 overflow-x-auto">
                  {[
                    { label: "Availability", active: true },
                    { label: "Price", active: false },
                    { label: "Rating", active: false },
                    { label: "Distance", active: false },
                  ].map((filter, i) => (
                    <div
                      key={i}
                      className={`px-4 py-2 rounded-full text-sm whitespace-nowrap cursor-pointer transition-colors ${
                        filter.active 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {filter.label}
                    </div>
                  ))}
                </div>
                
                {/* Instructor Cards Scroll */}
                <div className="px-4">
                  <h3 className="font-semibold mb-3">Instructors near you</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Mike Johnson", rating: 4.9, distance: "0.8 mi", price: "£38/hr", available: "Today", img: testimonialJames },
                      { name: "Sarah Williams", rating: 5.0, distance: "1.2 mi", price: "£40/hr", available: "Tomorrow", img: testimonialSarah },
                      { name: "Emma Davies", rating: 4.8, distance: "1.5 mi", price: "£36/hr", available: "Wed", img: testimonialEmma },
                    ].map((instructor, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-card border rounded-xl"
                      >
                        <img src={instructor.img} alt="" className="w-14 h-14 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm truncate">{instructor.name}</h4>
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium">{instructor.rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{instructor.distance}</span>
                            <span>{instructor.price}</span>
                            <span className="text-emerald-600 font-medium">{instructor.available}</span>
                          </div>
                        </div>
                        <Button size="sm" className="rounded-lg">Book</Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Large Search CTA */}
                <div className="p-4 mt-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                    <p className="text-sm font-medium mb-3">Search a different area</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Enter postcode..."
                          className="pl-10 h-11 rounded-xl"
                        />
                      </div>
                      <Button className="h-11 rounded-xl">Go</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option Q: Gamified Progress */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full text-sm font-medium mb-2">
              Option Q
            </span>
            <h2 className="text-2xl font-bold">Gamified Progress</h2>
            <p className="text-muted-foreground mt-2">Journey timeline, achievements, and leaderboard</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/20 dark:to-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar mockup */}
                <div className="h-11 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Header with Streak */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <img src={everyDriverLogo} alt="EveryDriver" className="h-6" />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-full">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-bold text-orange-600">7 day streak!</span>
                    </div>
                  </div>
                </div>
                
                {/* XP Progress Bar */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 p-3 bg-card border rounded-xl mb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-white fill-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Level 3 - Road Ready</p>
                        <p className="text-xs text-muted-foreground">450 / 600 XP</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                    />
                  </div>
                </motion.div>
                
                {/* Journey Timeline */}
                <div className="px-4 mb-6">
                  <h3 className="font-semibold mb-4">Your Journey to Pass</h3>
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-muted" />
                    
                    {[
                      { title: "Theory Test", desc: "Master the rules", icon: BookOpen, done: true, xp: "+100 XP" },
                      { title: "First Lesson", desc: "Get behind the wheel", icon: Car, done: true, xp: "+150 XP" },
                      { title: "10 Hours Complete", desc: "Building confidence", icon: Clock, done: false, xp: "+200 XP" },
                      { title: "Mock Test", desc: "Test your skills", icon: Award, done: false, xp: "+250 XP" },
                      { title: "Pass Your Test!", desc: "You got this!", icon: GraduationCap, done: false, xp: "+500 XP" },
                    ].map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="relative flex items-start gap-4 pb-4"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                          step.done 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {step.done ? <CheckCircle className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium text-sm ${step.done ? '' : 'text-muted-foreground'}`}>{step.title}</h4>
                            <span className={`text-xs font-medium ${step.done ? 'text-emerald-600' : 'text-muted-foreground'}`}>{step.xp}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Achievement Badges */}
                <div className="px-4 mb-6">
                  <h3 className="font-semibold mb-3">Your Badges</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                    {[
                      { icon: BookOpen, label: "Theory Pro", color: "from-blue-400 to-blue-600", earned: true },
                      { icon: Clock, label: "Early Bird", color: "from-amber-400 to-orange-500", earned: true },
                      { icon: Zap, label: "Quick Learner", color: "from-purple-400 to-purple-600", earned: true },
                      { icon: Award, label: "Perfect Score", color: "from-gray-300 to-gray-400", earned: false },
                    ].map((badge, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl ${badge.earned ? '' : 'opacity-40'}`}
                      >
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg`}>
                          <badge.icon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-medium">{badge.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Leaderboard Preview */}
                <div className="px-4 pb-6">
                  <h3 className="font-semibold mb-3">Top Learners This Week</h3>
                  <div className="bg-card border rounded-xl overflow-hidden">
                    {[
                      { rank: 1, name: "Alex K.", xp: "2,450 XP", img: testimonialJames },
                      { rank: 2, name: "Sarah M.", xp: "2,100 XP", img: testimonialSarah },
                      { rank: 3, name: "You", xp: "1,850 XP", img: testimonialEmma, isUser: true },
                    ].map((user, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={`flex items-center gap-3 p-3 ${i !== 2 ? 'border-b' : ''} ${user.isUser ? 'bg-primary/5' : ''}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          user.rank === 1 ? 'bg-amber-400 text-white' :
                          user.rank === 2 ? 'bg-gray-300 text-gray-700' :
                          'bg-orange-400 text-white'
                        }`}>
                          {user.rank}
                        </div>
                        <img src={user.img} alt="" className="w-8 h-8 rounded-full" />
                        <span className={`flex-1 text-sm ${user.isUser ? 'font-semibold' : ''}`}>{user.name}</span>
                        <span className="text-sm font-medium text-primary">{user.xp}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* CTA */}
                <div className="px-4 pb-6">
                  <Button className="w-full h-12 rounded-xl">
                    Continue Your Journey
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Option R: Booking-Focused Flow */}
        <section className="space-y-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-full text-sm font-medium mb-2">
              Option R
            </span>
            <h2 className="text-2xl font-bold">Booking-Focused Flow</h2>
            <p className="text-muted-foreground mt-2">Step-by-step wizard with date picker and price comparison</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden overflow-y-auto">
                {/* Status bar mockup */}
                <div className="h-11 bg-black/5 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                
                {/* Header */}
                <div className="px-4 py-3 flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="font-semibold">Book Your Lessons</h1>
                </div>
                
                {/* Progress Steps */}
                <div className="px-4 mb-6">
                  <div className="flex items-center gap-2">
                    {[
                      { step: 1, label: "Location", done: true },
                      { step: 2, label: "Package", done: true },
                      { step: 3, label: "Date", done: false, current: true },
                      { step: 4, label: "Pay", done: false },
                    ].map((s, i) => (
                      <div key={i} className="flex-1 flex items-center gap-2">
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            s.done ? 'bg-primary text-primary-foreground' :
                            s.current ? 'bg-primary/20 text-primary border-2 border-primary' :
                            'bg-muted text-muted-foreground'
                          }`}
                        >
                          {s.done ? <CheckCircle className="h-4 w-4" /> : s.step}
                        </motion.div>
                        {i < 3 && <div className={`flex-1 h-0.5 ${s.done ? 'bg-primary' : 'bg-muted'}`} />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {["Location", "Package", "Date", "Pay"].map((label, i) => (
                      <span key={i} className="text-[10px] text-muted-foreground">{label}</span>
                    ))}
                  </div>
                </div>
                
                {/* "Book in 60 seconds" Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 mb-4 p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-white">
                    <p className="font-semibold text-sm">Book in 60 seconds</p>
                    <p className="text-xs text-white/80">Fast, simple, secure</p>
                  </div>
                </motion.div>
                
                {/* Date Picker Preview */}
                <div className="px-4 mb-4">
                  <h3 className="font-semibold mb-3">Choose your start date</h3>
                  <div className="bg-card border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </Button>
                      <span className="font-semibold">January 2026</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                        <div key={i} className="text-muted-foreground py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {[...Array(31)].map((_, i) => {
                        const day = i + 1;
                        const isSelected = day === 27;
                        const isAvailable = [22, 23, 24, 27, 28, 29, 30].includes(day);
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.02 * i }}
                            className={`aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer ${
                              isSelected ? 'bg-primary text-primary-foreground font-bold' :
                              isAvailable ? 'bg-primary/10 text-primary hover:bg-primary/20' :
                              day < 21 ? 'text-muted-foreground/50' :
                              'text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {day}
                          </motion.div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      <span className="inline-block w-2 h-2 bg-primary/20 rounded mr-1" /> Available dates
                    </p>
                  </div>
                </div>
                
                {/* Instructor Match Card */}
                <div className="px-4 mb-4">
                  <h3 className="font-semibold mb-3">Your matched instructor</h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-card border rounded-xl"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img src={testimonialJames} alt="" className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="font-semibold">Mike Johnson</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>4.9</span>
                          </div>
                          <span>•</span>
                          <span>0.8 miles away</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">£38</span>
                        <span className="text-xs text-muted-foreground">/hr</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                        Available Jan 27
                      </div>
                      <div className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                        Automatic
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Price Comparison */}
                <div className="px-4 mb-6">
                  <h3 className="font-semibold mb-3">Package options</h3>
                  <div className="space-y-2">
                    {[
                      { hours: 10, price: 380, pricePerHour: 38, popular: false },
                      { hours: 20, price: 720, pricePerHour: 36, popular: true, save: "£40" },
                      { hours: 30, price: 1020, pricePerHour: 34, popular: false, save: "£120" },
                    ].map((pkg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className={`relative p-4 border rounded-xl cursor-pointer transition-colors ${
                          pkg.popular ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-2 right-4 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                            POPULAR
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{pkg.hours} Hours</h4>
                            <p className="text-xs text-muted-foreground">£{pkg.pricePerHour}/hour</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">£{pkg.price}</p>
                            {pkg.save && <p className="text-xs text-emerald-600 font-medium">Save {pkg.save}</p>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* CTA */}
                <div className="px-4 pb-6">
                  <Button className="w-full h-14 rounded-xl text-base font-semibold">
                    Continue to Payment
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Secure checkout with SSL encryption
                  </p>
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
