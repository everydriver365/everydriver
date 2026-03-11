import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Calendar, Star, Award, MapPin, ChevronRight, Play, Clock, Car, Shield, CheckCircle2, ArrowRight, Quote, Users, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

// Ken D's data
const SLUG = "ken-d";
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
  welcome_video_url: string | null;
}

function useKenDData() {
  const [instructor, setInstructor] = useState<InstructorData | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("instructors")
      .select("name, bio, phone, email, hourly_rate, car_type, brand_colour, secondary_colour, profile_image_url, car_image_url, home_postcode, instructor_grade, cpd_certified, welcome_video_url")
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
  }, []);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return { instructor, reviews, avgRating };
}

function Wrapper({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-b-4 border-border py-6">
      <div className="container mb-4">
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">{id}</span>
        <span className="ml-2 text-sm font-semibold text-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── V1: Bold Split Hero ───
function V1({ instructor, reviews, avgRating }: { instructor: InstructorData; reviews: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const secondary = instructor.secondary_colour;
  return (
    <Wrapper id="V1" title="Bold Split Hero">
      <div className="bg-white">
        <div className="grid lg:grid-cols-2 min-h-[600px]">
          {/* Left - Content */}
          <div className="flex flex-col justify-center px-8 lg:px-16 py-12" style={{ backgroundColor: primary }}>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Badge className="mb-6 bg-white/20 text-white border-0 text-sm px-4 py-1.5">
                <Award className="h-3.5 w-3.5 mr-1.5" /> Grade {instructor.instructor_grade} Instructor
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-black text-white leading-[0.95] mb-6">
                {instructor.name.trim().split(' ')[0]}<br />
                <span style={{ color: secondary }}>Driving School</span>
              </h1>
              <p className="text-white/80 text-lg mb-8 max-w-md">{instructor.bio}</p>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" style={{ color: secondary }} />
                  ))}
                </div>
                <span className="text-white font-bold text-lg">{avgRating}</span>
                <span className="text-white/60">({reviews.length} reviews)</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="rounded-full text-base px-8 shadow-xl" style={{ backgroundColor: secondary, color: '#000' }}>
                  <Calendar className="h-5 w-5 mr-2" /> Book Now
                </Button>
                <a href={`tel:${instructor.phone}`}>
                  <Button size="lg" variant="outline" className="rounded-full text-base px-8 border-white/30 text-white hover:bg-white/10">
                    <Phone className="h-5 w-5 mr-2" /> Call Me
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right - Image + Stats */}
          <div className="relative bg-gray-100 flex items-end justify-center overflow-hidden">
            {instructor.profile_image_url && (
              <img src={instructor.profile_image_url} alt={instructor.name} className="h-[500px] w-auto object-contain relative z-10" />
            )}
            <div className="absolute top-0 left-0 right-0 h-1/2" style={{ background: `linear-gradient(135deg, ${primary}20 0%, transparent 100%)` }} />
            
            {/* Floating stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="absolute top-8 right-8 z-20">
              <div className="bg-white rounded-2xl shadow-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold"><Car className="h-4 w-4" style={{ color: primary }} /> {instructor.car_type}</div>
                <div className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4" style={{ color: primary }} /> {instructor.home_postcode}</div>
                <div className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4" style={{ color: primary }} /> £{instructor.hourly_rate}/hr</div>
              </div>
            </motion.div>

            {instructor.car_image_url && (
              <motion.img initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                src={instructor.car_image_url} alt="Training car" className="absolute bottom-4 left-4 h-28 object-contain z-20 drop-shadow-xl" />
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// ─── V2: Cinematic Full-Width ───
function V2({ instructor, reviews, avgRating }: { instructor: InstructorData; reviews: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const secondary = instructor.secondary_colour;
  return (
    <Wrapper id="V2" title="Cinematic Full-Width">
      <div className="relative min-h-[650px] flex items-center" style={{ backgroundColor: '#0a0a0a' }}>
        {/* Background gradient */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 50%, ${primary}40 0%, transparent 70%)` }} />
        
        <div className="container max-w-6xl relative z-10 py-16">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current text-amber-400" />)}
                  </div>
                  <span className="text-white/70 text-sm">{avgRating} • {reviews.length} reviews</span>
                </div>

                <h1 className="text-6xl lg:text-7xl font-black text-white leading-[0.9] mb-6 tracking-tight">
                  LEARN TO<br />
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${secondary}, ${primary})` }}>
                    DRIVE WITH
                  </span><br />
                  CONFIDENCE
                </h1>

                <p className="text-white/60 text-lg mb-8 max-w-lg">{instructor.bio}</p>

                <div className="flex flex-wrap gap-4 mb-10">
                  <Button size="lg" className="rounded-full px-10 text-lg font-bold shadow-2xl" style={{ backgroundColor: primary }}>
                    Book Your Lesson <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  {instructor.welcome_video_url && (
                    <Button size="lg" variant="ghost" className="rounded-full text-white hover:bg-white/10">
                      <Play className="h-5 w-5 mr-2" /> Watch Video
                    </Button>
                  )}
                </div>

                <div className="flex gap-8">
                  {[
                    { label: "Hourly Rate", value: `£${instructor.hourly_rate}` },
                    { label: "Grade", value: instructor.instructor_grade || "A" },
                    { label: "Transmission", value: instructor.car_type },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="text-2xl font-black text-white">{s.value}</div>
                      <div className="text-xs text-white/40 uppercase tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-2 flex justify-center">
              {instructor.profile_image_url && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                  className="relative">
                  <div className="w-72 h-72 rounded-full overflow-hidden ring-4 ring-white/30">
                    <img src={instructor.profile_image_url} alt={instructor.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-6 py-2 shadow-xl">
                    <span className="font-bold text-sm">{instructor.name.trim()}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// ─── V3: Clean Modern Card ───
function V3({ instructor, reviews, avgRating }: { instructor: InstructorData; reviews: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const secondary = instructor.secondary_colour;
  return (
    <Wrapper id="V3" title="Clean Modern Card">
      <div className="bg-gray-50 py-16">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Top bar */}
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />
            
            <div className="p-8 lg:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile */}
                <div className="flex-shrink-0">
                  {instructor.profile_image_url && (
                    <img src={instructor.profile_image_url} alt={instructor.name}
                      className="w-32 h-32 rounded-2xl object-cover shadow-lg" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-gray-900">{instructor.name.trim()}</h1>
                    {instructor.cpd_certified && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0"><Shield className="h-3 w-3 mr-1" /> CPD</Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="rounded-full"><Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" /> {avgRating} ({reviews.length})</Badge>
                    <Badge variant="outline" className="rounded-full"><MapPin className="h-3 w-3 mr-1" /> {instructor.home_postcode}</Badge>
                    <Badge variant="outline" className="rounded-full"><Car className="h-3 w-3 mr-1" /> {instructor.car_type}</Badge>
                    <Badge variant="outline" className="rounded-full">Grade {instructor.instructor_grade}</Badge>
                  </div>

                  <p className="text-gray-600 mb-6">{instructor.bio}</p>

                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="rounded-xl" style={{ backgroundColor: primary }}>
                      <Calendar className="h-4 w-4 mr-2" /> Book a Lesson — £{instructor.hourly_rate}/hr
                    </Button>
                    <a href={`tel:${instructor.phone}`}>
                      <Button size="lg" variant="outline" className="rounded-xl">
                        <Phone className="h-4 w-4 mr-2" /> {instructor.phone}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Features grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t">
                {[
                  { icon: Shield, label: "DVSA Approved", desc: "Fully qualified" },
                  { icon: Award, label: `Grade ${instructor.instructor_grade}`, desc: "Instructor rating" },
                  { icon: Clock, label: "Flexible Hours", desc: "7 days a week" },
                  { icon: Users, label: "All Levels", desc: "Beginner to test" },
                ].map(f => (
                  <div key={f.label} className="text-center p-4 rounded-xl bg-gray-50">
                    <f.icon className="h-6 w-6 mx-auto mb-2" style={{ color: primary }} />
                    <div className="font-semibold text-sm">{f.label}</div>
                    <div className="text-xs text-gray-500">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Wrapper>
  );
}

// ─── V4: Magazine Editorial ───
function V4({ instructor, reviews, avgRating }: { instructor: InstructorData; reviews: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const secondary = instructor.secondary_colour;
  return (
    <Wrapper id="V4" title="Magazine Editorial">
      <div className="bg-white">
        <div className="container max-w-6xl py-16">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left column */}
            <div className="lg:col-span-7">
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Est. 2004</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <h1 className="text-7xl lg:text-8xl font-black leading-[0.85] mb-8" style={{ color: primary }}>
                  {instructor.name.trim().split(' ')[0].toUpperCase()}
                </h1>
                <h2 className="text-3xl font-light text-gray-400 -mt-4 mb-8">DRIVING SCHOOL</h2>

                <div className="prose max-w-none mb-8">
                  <p className="text-lg text-gray-700 leading-relaxed">{instructor.bio}</p>
                </div>

                <div className="flex items-center gap-6 pb-8 border-b mb-8">
                  <div>
                    <div className="text-4xl font-black" style={{ color: primary }}>£{instructor.hourly_rate}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Per Hour</div>
                  </div>
                  <div className="h-12 w-px bg-gray-200" />
                  <div>
                    <div className="text-4xl font-black" style={{ color: primary }}>{instructor.instructor_grade}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Grade</div>
                  </div>
                  <div className="h-12 w-px bg-gray-200" />
                  <div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current text-amber-400" />)}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">{reviews.length} Reviews</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button size="lg" className="rounded-none px-10 text-base font-bold uppercase tracking-wider" style={{ backgroundColor: primary }}>
                    Book Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <a href={`tel:${instructor.phone}`}>
                    <Button size="lg" variant="outline" className="rounded-none px-10 text-base uppercase tracking-wider border-2" style={{ borderColor: primary, color: primary }}>
                      Call {instructor.phone}
                    </Button>
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Right column - stacked images */}
            <div className="lg:col-span-5 space-y-4">
              {instructor.profile_image_url && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="relative aspect-[3/4] overflow-hidden">
                  <img src={instructor.profile_image_url} alt={instructor.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-white" />
                      <span className="text-white font-medium">{instructor.home_postcode}</span>
                    </div>
                  </div>
                </motion.div>
              )}
              {instructor.car_image_url && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                  className="relative h-48 overflow-hidden bg-gray-100 rounded-lg">
                  <img src={instructor.car_image_url} alt="Training vehicle" className="w-full h-full object-contain p-4" />
                  <Badge className="absolute top-3 right-3 border-0 font-bold" style={{ backgroundColor: secondary, color: '#000' }}>
                    {instructor.car_type}
                  </Badge>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// ─── V5: Glassmorphic iOS ───
function V5({ instructor, reviews, avgRating }: { instructor: InstructorData; reviews: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const secondary = instructor.secondary_colour;
  return (
    <Wrapper id="V5" title="Glassmorphic iOS">
      <div className="relative min-h-[700px] overflow-hidden" style={{ background: `linear-gradient(160deg, ${primary} 0%, #1a1a2e 50%, ${primary}80 100%)` }}>
        {/* Blurred background orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-30" style={{ backgroundColor: secondary }} />
        <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ backgroundColor: primary }} />

        <div className="container max-w-5xl relative z-10 py-16">
          <div className="flex flex-col items-center text-center mb-12">
            {instructor.profile_image_url && (
              <motion.img initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                src={instructor.profile_image_url} alt={instructor.name}
                className="w-28 h-28 rounded-3xl object-cover shadow-2xl ring-2 ring-white/20 mb-6" />
            )}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-3">{instructor.name.trim()}</h1>
              <p className="text-white/50 text-lg mb-6">{instructor.bio}</p>
            </motion.div>
          </div>

          {/* Glass stat cards */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {[
              { label: "Rating", value: avgRating, icon: Star, sub: `${reviews.length} reviews` },
              { label: "Rate", value: `£${instructor.hourly_rate}`, icon: Clock, sub: "per hour" },
              { label: "Grade", value: instructor.instructor_grade || "A", icon: Award, sub: "DVSA rated" },
              { label: "Area", value: instructor.home_postcode, icon: MapPin, sub: instructor.car_type },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 text-center border border-white/10">
                <s.icon className="h-5 w-5 mx-auto mb-2" style={{ color: secondary }} />
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-white/40">{s.sub}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <div className="flex justify-center gap-4">
            <Button size="lg" className="rounded-2xl px-10 text-base font-bold shadow-2xl" style={{ backgroundColor: secondary, color: '#000' }}>
              <Calendar className="h-5 w-5 mr-2" /> Book a Lesson
            </Button>
            <a href={`tel:${instructor.phone}`}>
              <Button size="lg" className="rounded-2xl px-10 text-base bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20">
                <Phone className="h-5 w-5 mr-2" /> Call Now
              </Button>
            </a>
          </div>

          {/* Reviews ticker */}
          {reviews.length > 0 && (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="mt-12 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-start gap-3">
                <Quote className="h-8 w-8 text-white/20 flex-shrink-0" />
                <div>
                  <p className="text-white/80 italic">"{reviews[0]?.review_text}"</p>
                  <p className="text-white/40 text-sm mt-2">— {reviews[0]?.reviewer_name}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

// ─── V6: Brutalist Bold ───
function V6({ instructor, reviews, avgRating }: { instructor: InstructorData; reviews: any[]; avgRating: string }) {
  const primary = instructor.brand_colour;
  const secondary = instructor.secondary_colour;
  return (
    <Wrapper id="V6" title="Brutalist Bold">
      <div className="bg-white">
        {/* Top accent bar */}
        <div className="h-3" style={{ backgroundColor: primary }} />
        
        <div className="container max-w-6xl py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left - massive typography */}
            <div className="flex-1">
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                <div className="flex items-center gap-4 mb-6">
                  {instructor.profile_image_url && (
                    <img src={instructor.profile_image_url} alt={instructor.name}
                      className="w-16 h-16 rounded-full object-cover border-4" style={{ borderColor: primary }} />
                  )}
                  <div>
                    <Badge className="text-white border-0 mb-1" style={{ backgroundColor: primary }}>Grade {instructor.instructor_grade} • CPD Certified</Badge>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current text-amber-500" />)}
                      <span className="text-sm text-gray-500 ml-1">{avgRating}</span>
                    </div>
                  </div>
                </div>

                <h1 className="text-6xl lg:text-8xl font-black leading-[0.85] mb-4 uppercase">
                  <span style={{ color: primary }}>{instructor.name.trim().split(' ')[0]}</span><br />
                  <span className="text-gray-900">DRIVING</span>
                </h1>

                <div className="border-l-4 pl-6 my-8" style={{ borderColor: secondary }}>
                  <p className="text-xl text-gray-600">{instructor.bio}</p>
                </div>
              </motion.div>
            </div>

            {/* Right - Info blocks */}
            <div className="lg:w-80 space-y-3">
              {[
                { label: "RATE", value: `£${instructor.hourly_rate}/hr`, color: primary },
                { label: "AREA", value: instructor.home_postcode, color: primary },
                { label: "CAR", value: instructor.car_type, color: primary },
                { label: "REVIEWS", value: `${reviews.length} ★`, color: primary },
              ].map(item => (
                <motion.div key={item.label} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  className="border-2 p-4 flex items-center justify-between" style={{ borderColor: item.color }}>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">{item.label}</span>
                  <span className="text-xl font-black" style={{ color: item.color }}>{item.value}</span>
                </motion.div>
              ))}

              <div className="pt-4 space-y-3">
                <Button className="w-full rounded-none h-14 text-base font-black uppercase tracking-wider" style={{ backgroundColor: primary }}>
                  Book Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <a href={`tel:${instructor.phone}`} className="block">
                  <Button variant="outline" className="w-full rounded-none h-14 text-base font-black uppercase tracking-wider border-2" style={{ borderColor: primary, color: primary }}>
                    <Phone className="mr-2 h-5 w-5" /> {instructor.phone}
                  </Button>
                </a>
              </div>

              {instructor.car_image_url && (
                <div className="pt-2">
                  <img src={instructor.car_image_url} alt="Training vehicle" className="w-full h-40 object-contain bg-gray-50 p-4" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

// ─── Main Demo Page ───
export default function DemoMiniWebsiteHome() {
  const { instructor, reviews, avgRating } = useKenDData();
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const variants = [
    { id: "V1", title: "Bold Split Hero" },
    { id: "V2", title: "Cinematic Full-Width" },
    { id: "V3", title: "Clean Modern Card" },
    { id: "V4", title: "Magazine Editorial" },
    { id: "V5", title: "Glassmorphic iOS" },
    { id: "V6", title: "Brutalist Bold" },
  ];

  if (!instructor) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky nav */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b py-4">
        <div className="container">
          <h1 className="text-xl font-bold mb-3">Mini Website Home — Design Variants for {instructor.name.trim()}</h1>
          <div className="flex flex-wrap gap-2">
            {variants.map(v => (
              <a key={v.id} href={`#${v.id}`}>
                <Badge
                  variant={activeVariant === v.id ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  {v.id}: {v.title}
                </Badge>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div id="V1"><V1 instructor={instructor} reviews={reviews} avgRating={avgRating} /></div>
      <div id="V2"><V2 instructor={instructor} reviews={reviews} avgRating={avgRating} /></div>
      <div id="V3"><V3 instructor={instructor} reviews={reviews} avgRating={avgRating} /></div>
      <div id="V4"><V4 instructor={instructor} reviews={reviews} avgRating={avgRating} /></div>
      <div id="V5"><V5 instructor={instructor} reviews={reviews} avgRating={avgRating} /></div>
      <div id="V6"><V6 instructor={instructor} reviews={reviews} avgRating={avgRating} /></div>
    </div>
  );
}
