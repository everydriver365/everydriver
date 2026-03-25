import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Calendar, Star, Award, MapPin, Search, Clock, Car, Shield, CheckCircle, ArrowRight, Gift, BookOpen, CreditCard, Users, Zap, Heart, Trophy, ThumbsUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import defaultHeroImage from "@/assets/frontpagesquare-4.png";
import intensiveCourseTile from "@/assets/intensive-course-tile.jpg";
import weeklyLessonsTile from "@/assets/weekly-lessons-tile.webp";
import earlyTestBadge from "@/assets/free-retest-badge.png";

const INSTRUCTOR_ID = "c9843b58-6edb-4b97-8238-65d725e30aea";

interface InstructorData {
  name: string;
  bio: string | null;
  phone: string | null;
  email: string | null;
  hourly_rate: number;
  car_type: string;
  brand_colour: string;
  secondary_colour: string;
  profile_image_url: string | null;
  car_image_url: string | null;
  home_postcode: string;
  instructor_grade: string | null;
  cpd_certified: boolean;
  business_name: string | null;
}

function useKenDData() {
  const [instructor, setInstructor] = useState<InstructorData | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("instructors")
      .select("name, bio, phone, email, hourly_rate, car_type, brand_colour, secondary_colour, profile_image_url, car_image_url, home_postcode, instructor_grade, cpd_certified, business_name")
      .eq("id", INSTRUCTOR_ID)
      .single()
      .then(({ data }) => { if (data) setInstructor(data as InstructorData); });

    supabase
      .from("course_reviews")
      .select("rating, reviewer_name, review_text, course_hours")
      .eq("instructor_id", INSTRUCTOR_ID)
      .eq("moderation_status", "approved")
      .limit(5)
      .then(({ data }) => { if (data) setReviews(data); });

    supabase
      .from("instructor_courses")
      .select("*")
      .eq("instructor_id", INSTRUCTOR_ID)
      .eq("is_active", true)
      .limit(3)
      .then(({ data }) => { if (data) setCourses(data); });
  }, []);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return { instructor, reviews, courses, avgRating };
}

const benefits = [
  { icon: CheckCircle, title: "Free Re-Test", desc: "If you fail first time, we'll pay for your next test!" },
  { icon: BookOpen, title: "Free Theory Test", desc: "Need a theory test? We'll book it for free!" },
  { icon: Shield, title: "Earlier Test Guaranteed", desc: "We find you an earlier test date or your money back." },
  { icon: Search, title: "Free Cancellation Finder", desc: "Access to the best test finding software available." },
  { icon: CreditCard, title: "Flexible Payments", desc: "Pay over up to 8 months with Klarna or Clearpay." },
  { icon: Clock, title: "Book Early, Save More", desc: "Early bird discounts and student offers available." },
];

function Wrapper({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-b-4 border-border">
      <div className="container py-4">
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">{id}</span>
        <span className="ml-2 text-sm font-semibold text-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── V1: Premium Dark with Gradient Accents ───
function V1({ instructor, reviews, courses, avgRating }: { instructor: InstructorData; reviews: any[]; courses: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const name = instructor.business_name || instructor.name;
  const [postcode, setPostcode] = useState("");

  return (
    <Wrapper id="V1" title="Premium Dark">
      {/* Announcement */}
      <div style={{ background: `linear-gradient(90deg, ${primary}, ${primary}cc)` }} className="py-2.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-8 text-sm font-semibold text-white">
          <span className="flex items-center gap-1.5">⚡ 10% Early Bird Discount</span>
          <span className="hidden md:flex items-center gap-1.5">🎁 Discounts Available</span>
          <span className="hidden md:flex items-center gap-1.5">🎓 Student Offers</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 50%, ${primary}25, transparent 70%)` }} />
        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-4 bg-white/10 border-white/20 text-white">
                <Award className="h-3 w-3 mr-1" /> Grade {instructor.instructor_grade} Instructor
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-black text-white leading-[0.95] mb-4">
                Welcome to<br />
                <span style={{ color: primary }}>{name}</span>
              </h1>
              <p className="text-gray-400 text-lg mb-6 max-w-md">{instructor.bio}</p>

              <form onSubmit={(e) => { e.preventDefault(); }} className="flex items-center gap-2 mb-8">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input placeholder="Enter your postcode..." value={postcode} onChange={(e) => setPostcode(e.target.value)}
                    className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 rounded-xl" />
                </div>
                <Button size="lg" className="h-12 px-8 rounded-xl font-bold text-white" style={{ backgroundColor: primary }}>Search</Button>
              </form>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-xl overflow-hidden h-36 group cursor-pointer">
                  <img src={intensiveCourseTile} alt="Intensive" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                    <div>
                      <h3 className="font-bold text-white text-sm">Intensive Courses</h3>
                      <p className="text-white/60 text-xs">Fast-track your test</p>
                    </div>
                  </div>
                </div>
                <div className="relative rounded-xl overflow-hidden h-36 group cursor-pointer">
                  <img src={weeklyLessonsTile} alt="Weekly" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                    <div>
                      <h3 className="font-bold text-white text-sm">Weekly Lessons</h3>
                      <p className="text-white/60 text-xs">Learn at your pace</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
              <img src={defaultHeroImage} alt={name} className="w-full h-[500px] object-cover rounded-2xl" />
              <img src={earlyTestBadge} alt="ETG" className="absolute top-4 left-4 w-32 h-32 object-contain drop-shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-white text-center mb-8">Why {name}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}30` }}>
                  <b.icon className="h-5 w-5" style={{ color: primary }} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{b.title}</h3>
                  <p className="text-gray-400 text-xs mt-1">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8" style={{ backgroundColor: primary }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-12 text-white">
          <div className="text-center"><div className="text-4xl font-black">{avgRating}</div><div className="text-sm text-white/70">Rating</div></div>
          <div className="text-center"><div className="text-4xl font-black">{reviews.length}</div><div className="text-sm text-white/70">Reviews</div></div>
          <div className="text-center"><div className="text-4xl font-black">{courses.length}</div><div className="text-sm text-white/70">Courses</div></div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-gray-950 py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {["About Me", "Services", "Courses", "Reviews", "Contact"].map(l => (
            <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center cursor-pointer hover:bg-white/10 transition">
              <h3 className="font-bold text-sm text-white">{l}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-950 py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Ready to get on the road?</h2>
          <p className="text-gray-500 mb-6">Join over 5,200 happy pupils. Pass your driving test with us!</p>
          <Button size="lg" className="h-14 px-10 text-base font-bold rounded-xl text-white" style={{ backgroundColor: primary }}>Search Now</Button>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V2: Warm & Approachable ───
function V2({ instructor, reviews, courses, avgRating }: { instructor: InstructorData; reviews: any[]; courses: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const name = instructor.business_name || instructor.name;
  const [postcode, setPostcode] = useState("");

  return (
    <Wrapper id="V2" title="Warm & Approachable">
      {/* Announcement */}
      <div className="bg-amber-50 border-b border-amber-200 py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-8 text-sm font-medium text-amber-800">
          <span>🌟 Special Offer: 10% off your first lesson</span>
          <span className="hidden md:inline">💳 Pay in instalments with Klarna</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative">
              <img src={defaultHeroImage} alt={name} className="w-full h-[480px] object-cover rounded-3xl shadow-xl" />
              <img src={earlyTestBadge} alt="ETG" className="absolute -top-4 -right-4 w-36 h-36 object-contain drop-shadow-lg" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(s => <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
                <span className="font-bold text-gray-700">{avgRating} ({reviews.length} reviews)</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                Your journey starts<br />with <span style={{ color: primary }}>{name}</span>
              </h1>
              <p className="text-gray-600 text-lg">{instructor.bio}</p>

              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input placeholder="Your postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)}
                    className="pl-10 h-12 rounded-full border-gray-200 shadow-sm" />
                </div>
                <Button size="lg" className="h-12 px-8 rounded-full font-bold text-white" style={{ backgroundColor: primary }}>Find Lessons</Button>
              </form>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition cursor-pointer rounded-2xl">
                  <div className="h-24 overflow-hidden"><img src={intensiveCourseTile} alt="Intensive" className="w-full h-full object-cover" /></div>
                  <CardContent className="p-3"><h3 className="font-bold text-sm">Intensive Courses</h3><p className="text-xs text-gray-500">Fast-track your test</p></CardContent>
                </Card>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition cursor-pointer rounded-2xl">
                  <div className="h-24 overflow-hidden"><img src={weeklyLessonsTile} alt="Weekly" className="w-full h-full object-cover" /></div>
                  <CardContent className="p-3"><h3 className="font-bold text-sm">Weekly Lessons</h3><p className="text-xs text-gray-500">At your own pace</p></CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">Why choose {name}?</h2>
          <p className="text-gray-500 text-center mb-8">Exclusive benefits you won't find anywhere else</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
                  <b.icon className="h-5 w-5" style={{ color: primary }} />
                </div>
                <div><h3 className="font-bold text-gray-900 text-sm">{b.title}</h3><p className="text-gray-500 text-xs mt-1">{b.desc}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-gradient-to-r from-amber-400 to-orange-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-12 text-white">
          <div className="text-center"><div className="text-4xl font-black">{avgRating}</div><div className="text-sm text-white/80">Average Rating</div></div>
          <div className="text-center"><div className="text-4xl font-black">{reviews.length}</div><div className="text-sm text-white/80">Reviews</div></div>
          <div className="text-center"><div className="text-4xl font-black">{courses.length}</div><div className="text-sm text-white/80">Courses</div></div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-amber-50 py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {["About Me", "Services", "Courses", "Reviews", "Contact"].map(l => (
            <Card key={l} className="border-0 shadow-sm hover:shadow-md transition rounded-2xl cursor-pointer">
              <CardContent className="p-4 text-center"><h3 className="font-bold text-sm" style={{ color: primary }}>{l}</h3></CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Start your driving journey today! 🚗</h2>
          <p className="text-gray-400 mb-6">Join thousands of happy learners</p>
          <Button size="lg" className="h-14 px-10 text-base font-bold rounded-full text-white" style={{ backgroundColor: primary }}>Search Now</Button>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V3: Bold Geometric ───
function V3({ instructor, reviews, courses, avgRating }: { instructor: InstructorData; reviews: any[]; courses: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const name = instructor.business_name || instructor.name;
  const [postcode, setPostcode] = useState("");

  return (
    <Wrapper id="V3" title="Bold Geometric">
      {/* Announcement */}
      <div className="py-2 px-4" style={{ backgroundColor: primary }}>
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-6 text-xs font-bold text-white uppercase tracking-widest">
          <span>Early Bird 10% Off</span>
          <span className="w-1 h-1 rounded-full bg-white/50" />
          <span className="hidden md:inline">Student Discounts</span>
          <span className="w-1 h-1 rounded-full bg-white/50 hidden md:inline" />
          <span className="hidden md:inline">Flexible Payments</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-white relative">
        <div className="absolute top-0 right-0 w-1/2 h-full" style={{ backgroundColor: `${primary}08` }} />
        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-16 h-1 mb-6" style={{ backgroundColor: primary }} />
                <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[0.9] mb-4 uppercase tracking-tight">
                  {name}
                </h1>
                <p className="text-xl text-gray-500 mb-8 max-w-lg">{instructor.bio}</p>

                <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 mb-8">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input placeholder="Enter your postcode..." value={postcode} onChange={(e) => setPostcode(e.target.value)}
                      className="pl-10 h-14 text-base border-2 border-gray-200 rounded-none" />
                  </div>
                  <Button size="lg" className="h-14 px-10 rounded-none font-black uppercase tracking-wider text-white" style={{ backgroundColor: primary }}>Go</Button>
                </form>

                <div className="flex gap-6 py-6 border-t border-b border-gray-200">
                  {[
                    { val: avgRating, label: "Rating" },
                    { val: `${reviews.length}`, label: "Reviews" },
                    { val: `£${instructor.hourly_rate}`, label: "Per Hour" },
                    { val: instructor.instructor_grade || "A", label: "Grade" },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="text-2xl font-black" style={{ color: primary }}>{s.val}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative">
                <img src={defaultHeroImage} alt={name} className="w-full h-[400px] object-cover" />
                <img src={earlyTestBadge} alt="ETG" className="absolute bottom-4 right-4 w-28 h-28 object-contain drop-shadow-lg" />
              </motion.div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative h-28 overflow-hidden cursor-pointer group">
                  <img src={intensiveCourseTile} alt="Intensive" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-black text-xs uppercase tracking-wider">Intensive</span></div>
                </div>
                <div className="relative h-28 overflow-hidden cursor-pointer group">
                  <img src={weeklyLessonsTile} alt="Weekly" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-black text-xs uppercase tracking-wider">Weekly</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-1" style={{ backgroundColor: primary }} />
            <h2 className="text-2xl font-black uppercase tracking-wider">Why {name}?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => (
              <div key={b.title} className="border-l-4 bg-white p-5" style={{ borderColor: primary }}>
                <h3 className="font-black text-sm uppercase">{b.title}</h3>
                <p className="text-gray-500 text-xs mt-1">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8" style={{ backgroundColor: primary }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-12 text-white">
          <div className="text-center"><div className="text-4xl font-black">{avgRating}</div><div className="text-sm text-white/70">Rating</div></div>
          <div className="text-center"><div className="text-4xl font-black">{reviews.length}</div><div className="text-sm text-white/70">Reviews</div></div>
          <div className="text-center"><div className="text-4xl font-black">{courses.length}</div><div className="text-sm text-white/70">Courses</div></div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {["About Me", "Services", "Courses", "Reviews", "Contact"].map(l => (
            <div key={l} className="border-2 p-4 text-center cursor-pointer hover:shadow-md transition" style={{ borderColor: primary }}>
              <h3 className="font-black text-xs uppercase tracking-wider" style={{ color: primary }}>{l}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white uppercase mb-3">Join 5,200+ happy pupils</h2>
          <p className="text-gray-500 mb-6">Get on the road. Pass your test.</p>
          <Button size="lg" className="h-14 px-10 rounded-none font-black uppercase text-white" style={{ backgroundColor: primary }}>Search Now <ArrowRight className="ml-2 h-5 w-5" /></Button>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V4: Soft Glassmorphic ───
function V4({ instructor, reviews, courses, avgRating }: { instructor: InstructorData; reviews: any[]; courses: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const name = instructor.business_name || instructor.name;
  const [postcode, setPostcode] = useState("");

  return (
    <Wrapper id="V4" title="Soft Glassmorphic">
      {/* Announcement */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-100 py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-8 text-sm font-medium text-gray-600">
          <span>✨ 10% Early Bird Discount</span>
          <span className="hidden md:inline">🎓 Student Offers</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[600px] overflow-hidden" style={{ background: `linear-gradient(160deg, ${primary}15 0%, #f0f4ff 50%, ${primary}10 100%)` }}>
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: primary }} />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15" style={{ backgroundColor: primary }} />

        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                Learn to drive with<br /><span style={{ color: primary }}>{name}</span>
              </h1>
              <p className="text-gray-500 text-lg mb-6">{instructor.bio}</p>

              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/50 mb-6">
                <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input placeholder="Enter your postcode..." value={postcode} onChange={(e) => setPostcode(e.target.value)}
                      className="pl-10 h-12 bg-white/70 border-gray-200 rounded-xl" />
                  </div>
                  <Button size="lg" className="h-12 px-8 rounded-xl font-bold text-white" style={{ backgroundColor: primary }}>Search</Button>
                </form>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Rating", val: avgRating, icon: Star },
                  { label: "Rate", val: `£${instructor.hourly_rate}`, icon: Clock },
                  { label: "Grade", val: instructor.instructor_grade || "A", icon: Award },
                  { label: "Reviews", val: `${reviews.length}`, icon: Heart },
                ].map(s => (
                  <div key={s.label} className="bg-white/50 backdrop-blur rounded-xl p-3 text-center border border-white/40">
                    <s.icon className="h-4 w-4 mx-auto mb-1" style={{ color: primary }} />
                    <div className="text-lg font-black text-gray-900">{s.val}</div>
                    <div className="text-[10px] text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
              <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-3 shadow-2xl border border-white/40">
                <img src={defaultHeroImage} alt={name} className="w-full h-[440px] object-cover rounded-2xl" />
                <img src={earlyTestBadge} alt="ETG" className="absolute top-6 left-6 w-32 h-32 object-contain drop-shadow-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-white/40 backdrop-blur rounded-xl overflow-hidden cursor-pointer group">
                  <img src={intensiveCourseTile} alt="Intensive" className="w-full h-20 object-cover" />
                  <div className="p-2"><span className="font-bold text-xs">Intensive Courses</span></div>
                </div>
                <div className="bg-white/40 backdrop-blur rounded-xl overflow-hidden cursor-pointer group">
                  <img src={weeklyLessonsTile} alt="Weekly" className="w-full h-20 object-cover" />
                  <div className="p-2"><span className="font-bold text-xs">Weekly Lessons</span></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12" style={{ background: `linear-gradient(180deg, #f8fafc, ${primary}08)` }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-8">Why {name}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white/70 backdrop-blur rounded-2xl p-5 border border-white/50 shadow-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}15` }}>
                  <b.icon className="h-4 w-4" style={{ color: primary }} />
                </div>
                <div><h3 className="font-bold text-sm">{b.title}</h3><p className="text-gray-500 text-xs mt-1">{b.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-12 text-white">
          <div className="text-center"><div className="text-4xl font-black">{avgRating}</div><div className="text-sm text-white/70">Rating</div></div>
          <div className="text-center"><div className="text-4xl font-black">{reviews.length}</div><div className="text-sm text-white/70">Reviews</div></div>
          <div className="text-center"><div className="text-4xl font-black">{courses.length}</div><div className="text-sm text-white/70">Courses</div></div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {["About Me", "Services", "Courses", "Reviews", "Contact"].map(l => (
            <div key={l} className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition cursor-pointer">
              <h3 className="font-bold text-sm" style={{ color: primary }}>{l}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Start your journey today</h2>
          <p className="text-gray-500 mb-6">Over 5,200 happy pupils and counting</p>
          <Button size="lg" className="h-14 px-10 rounded-2xl font-bold text-white" style={{ backgroundColor: primary }}>Search Now</Button>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V5: Magazine Split ───
function V5({ instructor, reviews, courses, avgRating }: { instructor: InstructorData; reviews: any[]; courses: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const name = instructor.business_name || instructor.name;
  const [postcode, setPostcode] = useState("");

  return (
    <Wrapper id="V5" title="Magazine Split">
      {/* Announcement */}
      <div className="bg-gray-900 py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-6 text-xs font-semibold text-gray-300 uppercase tracking-wider">
          <span>10% Early Bird</span><span className="text-gray-600">•</span><span className="hidden md:inline">Student Offers</span><span className="text-gray-600 hidden md:inline">•</span><span className="hidden md:inline">Flexible Payments</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-white">
        <div className="grid lg:grid-cols-2 min-h-[600px]">
          <div className="relative overflow-hidden">
            <img src={defaultHeroImage} alt={name} className="w-full h-full object-cover min-h-[400px]" />
            <img src={earlyTestBadge} alt="ETG" className="absolute top-6 left-6 w-36 h-36 object-contain drop-shadow-2xl" />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex gap-3">
                <div className="relative h-16 w-24 rounded-lg overflow-hidden"><img src={intensiveCourseTile} alt="Intensive" className="w-full h-full object-cover" /></div>
                <div className="relative h-16 w-24 rounded-lg overflow-hidden"><img src={weeklyLessonsTile} alt="Weekly" className="w-full h-full object-cover" /></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center px-8 lg:px-14 py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                <span className="text-sm font-semibold text-gray-600">{avgRating} · {reviews.length} reviews</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-[0.95] mb-4">
                Welcome to<br />{name}
              </h1>

              <div className="h-1 w-20 mb-6" style={{ backgroundColor: primary }} />

              <p className="text-gray-600 text-base mb-8 leading-relaxed">{instructor.bio}</p>

              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input placeholder="Enter postcode..." value={postcode} onChange={(e) => setPostcode(e.target.value)}
                    className="pl-10 h-12 rounded-lg border-gray-300" />
                </div>
                <Button size="lg" className="h-12 px-8 rounded-lg font-bold text-white" style={{ backgroundColor: primary }}>Search</Button>
              </form>

              <div className="flex gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Car className="h-4 w-4" /> {instructor.car_type}</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {instructor.home_postcode}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> £{instructor.hourly_rate}/hr</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-8">Why {name}?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b) => (
              <Card key={b.title} className="border-0 shadow-sm rounded-xl">
                <CardContent className="p-5 flex items-start gap-3">
                  <b.icon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: primary }} />
                  <div><h3 className="font-bold text-sm">{b.title}</h3><p className="text-xs text-gray-500 mt-1">{b.desc}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8" style={{ backgroundColor: primary }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-12 text-white">
          <div className="text-center"><div className="text-4xl font-black">{avgRating}</div><div className="text-sm text-white/70">Rating</div></div>
          <div className="text-center"><div className="text-4xl font-black">{reviews.length}</div><div className="text-sm text-white/70">Reviews</div></div>
          <div className="text-center"><div className="text-4xl font-black">{courses.length}</div><div className="text-sm text-white/70">Courses</div></div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {["About Me", "Services", "Courses", "Reviews", "Contact"].map(l => (
            <Card key={l} className="border shadow-none hover:shadow-md transition cursor-pointer"><CardContent className="p-4 text-center"><h3 className="font-bold text-sm" style={{ color: primary }}>{l}</h3></CardContent></Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: primary }} className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Ready to pass your test?</h2>
          <p className="text-white/70 mb-6">Join 5,200+ happy pupils</p>
          <Button size="lg" className="h-14 px-10 rounded-lg font-bold bg-white hover:bg-gray-100" style={{ color: primary }}>Search Now</Button>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V6: Neon Card Stack ───
function V6({ instructor, reviews, courses, avgRating }: { instructor: InstructorData; reviews: any[]; courses: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const name = instructor.business_name || instructor.name;
  const [postcode, setPostcode] = useState("");

  return (
    <Wrapper id="V6" title="Neon Card Stack">
      {/* Announcement */}
      <div className="bg-black py-2 px-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-6 text-xs font-bold uppercase tracking-widest">
          <span style={{ color: primary }}>⚡ 10% Off</span>
          <span className="text-gray-600 hidden md:inline">|</span>
          <span className="text-gray-400 hidden md:inline">Student Discount</span>
          <span className="text-gray-600 hidden md:inline">|</span>
          <span className="text-gray-400 hidden md:inline">Pay Monthly</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-15" style={{ backgroundColor: primary }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16 relative z-10">
          <div className="text-center mb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-4 border-gray-700 text-gray-400 bg-gray-900">Grade {instructor.instructor_grade} • DVSA Approved</Badge>
              <h1 className="text-5xl lg:text-7xl font-black text-white mb-4 tracking-tight">
                {name?.toUpperCase()}
              </h1>
              <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">{instructor.bio}</p>

              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 max-w-md mx-auto mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                  <Input placeholder="Your postcode..." value={postcode} onChange={(e) => setPostcode(e.target.value)}
                    className="pl-10 h-12 bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 rounded-xl" />
                </div>
                <Button size="lg" className="h-12 px-8 rounded-xl font-bold text-white shadow-lg" style={{ backgroundColor: primary, boxShadow: `0 0 30px ${primary}40` }}>Search</Button>
              </form>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden h-72 group cursor-pointer md:col-span-1">
              <img src={defaultHeroImage} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <img src={earlyTestBadge} alt="ETG" className="absolute top-3 left-3 w-24 h-24 object-contain drop-shadow-lg" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative rounded-2xl overflow-hidden h-72 group cursor-pointer">
              <img src={intensiveCourseTile} alt="Intensive" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5">
                <div><h3 className="text-white font-bold">Intensive Courses</h3><p className="text-white/60 text-sm">Fast-track to your test</p></div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative rounded-2xl overflow-hidden h-72 group cursor-pointer">
              <img src={weeklyLessonsTile} alt="Weekly" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5">
                <div><h3 className="text-white font-bold">Weekly Lessons</h3><p className="text-white/60 text-sm">Learn at your own pace</p></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-950 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-white text-center mb-8">Why {name}?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {benefits.map((b) => (
              <div key={b.title} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition flex items-start gap-3">
                <b.icon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: primary }} />
                <div><h3 className="font-bold text-sm text-white">{b.title}</h3><p className="text-gray-500 text-xs mt-1">{b.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 border-y border-gray-800" style={{ background: `linear-gradient(90deg, ${primary}15, ${primary}30, ${primary}15)` }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-12">
          <div className="text-center"><div className="text-4xl font-black" style={{ color: primary }}>{avgRating}</div><div className="text-sm text-gray-500">Rating</div></div>
          <div className="text-center"><div className="text-4xl font-black" style={{ color: primary }}>{reviews.length}</div><div className="text-sm text-gray-500">Reviews</div></div>
          <div className="text-center"><div className="text-4xl font-black" style={{ color: primary }}>{courses.length}</div><div className="text-sm text-gray-500">Courses</div></div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-black py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {["About Me", "Services", "Courses", "Reviews", "Contact"].map(l => (
            <div key={l} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center cursor-pointer hover:border-gray-600 transition">
              <h3 className="font-bold text-sm" style={{ color: primary }}>{l}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-12 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Ready to hit the road?</h2>
          <p className="text-gray-600 mb-6">5,200+ pupils. One goal. Your licence.</p>
          <Button size="lg" className="h-14 px-10 rounded-xl font-bold text-white" style={{ backgroundColor: primary, boxShadow: `0 0 40px ${primary}30` }}>
            Search Now <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── Main Demo Page ───
export default function DemoMiniWebsiteHomeV2() {
  const { instructor, reviews, courses, avgRating } = useKenDData();
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const variants = [
    { id: "V1", title: "Premium Dark" },
    { id: "V2", title: "Warm & Approachable" },
    { id: "V3", title: "Bold Geometric" },
    { id: "V4", title: "Soft Glassmorphic" },
    { id: "V5", title: "Magazine Split" },
    { id: "V6", title: "Neon Card Stack" },
  ];

  if (!instructor) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b py-4">
        <div className="container">
          <h1 className="text-xl font-bold mb-3">Ken D Homepage Redesign — Full Page Variants</h1>
          <p className="text-sm text-muted-foreground mb-3">Each variant contains: Announcement → Hero → Benefits → Stats → Quick Links → CTA</p>
          <div className="flex flex-wrap gap-2">
            {variants.map(v => (
              <a key={v.id} href={`#${v.id}`}>
                <Badge variant={activeVariant === v.id ? "default" : "outline"} className="cursor-pointer hover:bg-primary/10 transition-colors">
                  {v.id}: {v.title}
                </Badge>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div id="V1"><V1 instructor={instructor} reviews={reviews} courses={courses} avgRating={avgRating} /></div>
      <div id="V2"><V2 instructor={instructor} reviews={reviews} courses={courses} avgRating={avgRating} /></div>
      <div id="V3"><V3 instructor={instructor} reviews={reviews} courses={courses} avgRating={avgRating} /></div>
      <div id="V4"><V4 instructor={instructor} reviews={reviews} courses={courses} avgRating={avgRating} /></div>
      <div id="V5"><V5 instructor={instructor} reviews={reviews} courses={courses} avgRating={avgRating} /></div>
      <div id="V6"><V6 instructor={instructor} reviews={reviews} courses={courses} avgRating={avgRating} /></div>
    </div>
  );
}
