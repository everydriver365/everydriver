import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Calendar, Star, Award, MapPin, Search, ChevronRight, Clock, Car, Shield, CheckCircle2, ArrowRight, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import earlyTestBadge from "@/assets/free-retest-badge.png";

const INSTRUCTOR_ID = "c9843b58-6edb-4b97-8238-65d725e30aea";

interface InstructorData {
  name: string;
  business_name: string | null;
  bio: string | null;
  phone: string | null;
  hourly_rate: number;
  car_type: string;
  brand_colour: string;
  secondary_colour: string;
  profile_image_url: string | null;
  hero_image_url: string | null;
  home_postcode: string;
  instructor_grade: string | null;
  cpd_certified: boolean;
}

function useData() {
  const [instructor, setInstructor] = useState<InstructorData | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("instructors")
      .select("name, business_name, bio, phone, hourly_rate, car_type, brand_colour, secondary_colour, profile_image_url, hero_image_url, home_postcode, instructor_grade, cpd_certified")
      .eq("id", INSTRUCTOR_ID).single()
      .then(({ data }) => { if (data) setInstructor(data as InstructorData); });
    supabase.from("course_reviews")
      .select("rating, reviewer_name, review_text")
      .eq("instructor_id", INSTRUCTOR_ID).eq("moderation_status", "approved").limit(5)
      .then(({ data }) => { if (data) setReviews(data); });
  }, []);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : "5.0";
  return { instructor, reviews, avgRating };
}

function Wrap({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
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

function SearchBox({ primary, onSearch }: { primary: string; onSearch?: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-3 max-w-lg w-full">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Enter your postcode..." className="w-full pl-10 h-12 text-base rounded-xl border-0 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <button className="h-12 px-6 rounded-xl text-white font-semibold flex items-center gap-2" style={{ backgroundColor: primary }}>
          <Search className="h-5 w-5" /> Search
        </button>
      </div>
    </div>
  );
}

// ─── V1: Clean Overlay ───
function V1({ instructor: i, reviews, avgRating }: any) {
  return (
    <Wrap id="V1" title="Clean Overlay">
      <div className="relative min-h-[520px] flex items-center justify-center">
        <img src={i.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4 py-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-500 rounded-full px-4 py-2 mb-6">
            <img src={earlyTestBadge} alt="ETG" className="w-8 h-8 object-contain" />
            <span className="text-white font-bold text-sm">Earlier Test Guaranteed</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 drop-shadow-lg">
            {i.business_name || i.name}
          </h1>
          <p className="text-white/80 text-lg mb-8">Professional driving instruction in {i.home_postcode}</p>
          <SearchBox primary={i.brand_colour} />
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Badge className="bg-white/20 text-white border-0 px-3 py-1.5">⭐ {avgRating} ({reviews.length} reviews)</Badge>
            <Badge className="bg-white/20 text-white border-0 px-3 py-1.5">Grade {i.instructor_grade}</Badge>
            <Badge className="bg-white/20 text-white border-0 px-3 py-1.5">£{i.hourly_rate}/hr</Badge>
          </div>
        </div>
      </div>
      <div className="bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-lg">{i.bio}</p>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V2: Split Hero ───
function V2({ instructor: i, reviews, avgRating }: any) {
  return (
    <Wrap id="V2" title="Split Hero — Image Left, Content Right">
      <div className="grid lg:grid-cols-2 min-h-[500px]">
        <div className="relative">
          <img src={i.hero_image_url} alt="" className="w-full h-full object-cover min-h-[300px]" />
          <div className="absolute top-4 left-4">
            <div className="bg-emerald-500 rounded-xl p-2 shadow-lg">
              <img src={earlyTestBadge} alt="ETG" className="w-16 h-16 object-contain" />
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center p-8 lg:p-16 bg-white">
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, j) => <Star key={j} className="h-5 w-5 fill-current text-amber-400" />)}
            <span className="ml-2 text-sm text-gray-500">{avgRating} ({reviews.length})</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black mb-4" style={{ color: i.brand_colour }}>
            {i.business_name || i.name}
          </h1>
          <p className="text-gray-600 mb-6">{i.bio}</p>
          <SearchBox primary={i.brand_colour} />
          <div className="flex gap-3 mt-6">
            <Badge variant="secondary">Grade {i.instructor_grade}</Badge>
            <Badge variant="secondary">{i.car_type}</Badge>
            <Badge variant="secondary">£{i.hourly_rate}/hr</Badge>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V3: Stacked Full-Width with Floating Card ───
function V3({ instructor: i, reviews, avgRating }: any) {
  return (
    <Wrap id="V3" title="Stacked — Floating Search Card">
      <div className="relative">
        <img src={i.hero_image_url} alt="" className="w-full h-[400px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-emerald-500 rounded-full px-4 py-2 shadow-lg">
          <img src={earlyTestBadge} alt="ETG" className="w-7 h-7 object-contain" />
          <span className="text-white font-bold text-sm">Earlier Test Guaranteed</span>
        </div>
      </div>
      <div className="max-w-2xl mx-auto -mt-20 relative z-10 px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-black mb-2" style={{ color: i.brand_colour }}>{i.business_name || i.name}</h1>
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current text-amber-400" />)}
            <span className="text-sm text-gray-500 ml-1">{avgRating}</span>
          </div>
          <p className="text-gray-600 mb-6">{i.bio}</p>
          <SearchBox primary={i.brand_colour} />
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="outline">Grade {i.instructor_grade}</Badge>
            <Badge variant="outline">{i.car_type}</Badge>
            <Badge variant="outline">£{i.hourly_rate}/hr</Badge>
            <Badge variant="outline">{i.home_postcode}</Badge>
          </div>
        </div>
      </div>
      <div className="h-12" />
    </Wrap>
  );
}

// ─── V4: Magazine Editorial ───
function V4({ instructor: i, reviews, avgRating }: any) {
  return (
    <Wrap id="V4" title="Magazine Editorial">
      <div className="bg-gray-950">
        <div className="relative h-[350px]">
          <img src={i.hero_image_url} alt="" className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        </div>
        <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10 pb-12">
          <div className="flex items-center gap-3 mb-4">
            <img src={earlyTestBadge} alt="ETG" className="w-14 h-14 object-contain drop-shadow-lg" />
            <Badge className="bg-emerald-500 text-white border-0">Earlier Test Guaranteed</Badge>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-[0.9] mb-4">
            {(i.business_name || i.name).toUpperCase()}
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-lg">{i.bio}</p>
          <SearchBox primary={i.brand_colour} />
          <div className="flex gap-6 mt-8">
            {[{ l: "Rating", v: `${avgRating}★` }, { l: "Grade", v: i.instructor_grade }, { l: "Rate", v: `£${i.hourly_rate}` }].map(s => (
              <div key={s.l}><div className="text-2xl font-black text-white">{s.v}</div><div className="text-xs text-white/40 uppercase tracking-wider">{s.l}</div></div>
            ))}
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V5: Glassmorphic Card ───
function V5({ instructor: i, reviews, avgRating }: any) {
  return (
    <Wrap id="V5" title="Glassmorphic Card Overlay">
      <div className="relative min-h-[600px] flex items-center justify-center">
        <img src={i.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 w-full max-w-xl mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-500/90 rounded-full p-3">
                <img src={earlyTestBadge} alt="ETG" className="w-12 h-12 object-contain" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">{i.business_name || i.name}</h1>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current text-amber-400" />)}
              <span className="text-white/70 text-sm ml-1">{avgRating} ({reviews.length})</span>
            </div>
            <p className="text-white/70 mb-6">{i.bio}</p>
            <SearchBox primary={i.brand_colour} />
            <div className="flex justify-center gap-4 mt-6">
              <Badge className="bg-white/20 text-white border-0">Grade {i.instructor_grade}</Badge>
              <Badge className="bg-white/20 text-white border-0">{i.car_type}</Badge>
              <Badge className="bg-white/20 text-white border-0">£{i.hourly_rate}/hr</Badge>
            </div>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V6: Bold Branded Banner ───
function V6({ instructor: i, reviews, avgRating }: any) {
  return (
    <Wrap id="V6" title="Bold Branded Banner">
      <div>
        <div className="relative">
          <img src={i.hero_image_url} alt="" className="w-full h-[400px] object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${i.brand_colour}ee 0%, ${i.brand_colour}88 50%, transparent 100%)` }} />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-4xl mx-auto px-8 w-full">
              <div className="max-w-lg">
                <div className="flex items-center gap-2 mb-4">
                  <img src={earlyTestBadge} alt="ETG" className="w-12 h-12 object-contain" />
                  <span className="text-white/90 font-semibold text-sm">Earlier Test Guaranteed</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">{i.business_name || i.name}</h1>
                <p className="text-white/80 mb-6">{i.bio}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
          <SearchBox primary={i.brand_colour} />
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap gap-3">
          <Badge variant="secondary">⭐ {avgRating} ({reviews.length} reviews)</Badge>
          <Badge variant="secondary">Grade {i.instructor_grade}</Badge>
          <Badge variant="secondary">{i.car_type}</Badge>
          <Badge variant="secondary">£{i.hourly_rate}/hr</Badge>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V7: Minimal Two-Tone ───
function V7({ instructor: i, reviews, avgRating }: any) {
  return (
    <Wrap id="V7" title="Minimal Two-Tone">
      <div>
        <img src={i.hero_image_url} alt="" className="w-full h-[350px] object-cover" />
        <div className="py-12 px-4" style={{ backgroundColor: i.brand_colour }}>
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-5 py-2 mb-6">
              <img src={earlyTestBadge} alt="ETG" className="w-8 h-8 object-contain" />
              <span className="text-white font-bold">Earlier Test Guaranteed</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-3">{i.business_name || i.name}</h1>
            <p className="text-white/70 mb-8">{i.bio}</p>
            <div className="flex justify-center">
              <SearchBox primary={i.secondary_colour} />
            </div>
            <div className="flex justify-center gap-6 mt-8 text-white">
              {[{ l: "Reviews", v: `${avgRating}★` }, { l: "Grade", v: i.instructor_grade }, { l: "Per Hour", v: `£${i.hourly_rate}` }].map(s => (
                <div key={s.l}><div className="text-xl font-black">{s.v}</div><div className="text-xs text-white/50 uppercase">{s.l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V8: Hero Cards Grid ───
function V8({ instructor: i, reviews, avgRating }: any) {
  return (
    <Wrap id="V8" title="Hero Cards Grid">
      <div className="relative min-h-[500px]">
        <img src={i.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main card */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <img src={earlyTestBadge} alt="ETG" className="w-14 h-14 object-contain" />
                <Badge className="bg-emerald-100 text-emerald-700 border-0 font-bold">Earlier Test Guaranteed</Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black mb-3" style={{ color: i.brand_colour }}>{i.business_name || i.name}</h1>
              <p className="text-gray-600 mb-6">{i.bio}</p>
              <SearchBox primary={i.brand_colour} />
            </div>
            {/* Side cards */}
            <div className="space-y-4">
              <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current text-amber-400" />)}
                </div>
                <div className="text-2xl font-black" style={{ color: i.brand_colour }}>{avgRating}</div>
                <p className="text-sm text-gray-500">{reviews.length} verified reviews</p>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg">
                <div className="text-2xl font-black" style={{ color: i.brand_colour }}>£{i.hourly_rate}</div>
                <p className="text-sm text-gray-500">per hour • {i.car_type}</p>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" style={{ color: i.brand_colour }} />
                  <span className="font-bold">Grade {i.instructor_grade}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">CPD Certified Instructor</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V9: Cinematic Parallax ───
function V9({ instructor: i, reviews, avgRating }: any) {
  return (
    <Wrap id="V9" title="Cinematic Bottom Reveal">
      <div className="relative min-h-[550px] flex items-end" style={{ backgroundColor: '#111' }}>
        <img src={i.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pb-12">
          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-3 mb-4">
                <img src={earlyTestBadge} alt="ETG" className="w-12 h-12 object-contain drop-shadow-lg" />
                <Badge className="bg-emerald-500 text-white border-0 text-sm">Earlier Test Guaranteed</Badge>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-3">{i.business_name || i.name}</h1>
              <p className="text-white/60 text-lg mb-6">{i.bio}</p>
              <SearchBox primary={i.brand_colour} />
            </div>
            <div className="flex gap-6 pb-4">
              {[{ l: "Rating", v: `${avgRating}★` }, { l: "Grade", v: i.instructor_grade }, { l: "Rate", v: `£${i.hourly_rate}/hr` }].map(s => (
                <div key={s.l} className="text-center"><div className="text-xl font-black text-white">{s.v}</div><div className="text-[10px] text-white/40 uppercase tracking-widest">{s.l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V10: Newspaper Style ───
function V10({ instructor: i, reviews, avgRating }: any) {
  return (
    <Wrap id="V10" title="Newspaper — Image Top, Content Sections">
      <div className="bg-white">
        <div className="relative">
          <img src={i.hero_image_url} alt="" className="w-full h-[380px] object-cover" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <h1 className="text-4xl lg:text-5xl font-black mb-3" style={{ color: i.brand_colour }}>{i.business_name || i.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current text-amber-400" />)}
                <span className="text-sm text-gray-500">{avgRating} ({reviews.length} reviews)</span>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">{i.bio}</p>
              <SearchBox primary={i.brand_colour} />
            </div>
            <div className="w-full lg:w-auto">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4">
                <img src={earlyTestBadge} alt="ETG" className="w-16 h-16 object-contain" />
                <div>
                  <h3 className="font-bold text-emerald-800">Earlier Test Guaranteed</h3>
                  <p className="text-sm text-emerald-600">We find you a sooner test date</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[{ l: "Grade", v: i.instructor_grade }, { l: "Rate", v: `£${i.hourly_rate}` }, { l: "Type", v: i.car_type }].map(s => (
                  <div key={s.l} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-black" style={{ color: i.brand_colour }}>{s.v}</div>
                    <div className="text-xs text-gray-500">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="h-12" />
      </div>
    </Wrap>
  );
}

// ─── V12A: Soft White Fade ───
function V12A({ instructor: i }: any) {
  return (
    <Wrap id="V12A" title="Soft White Fade">
      <div>
        <div className="relative h-[450px]">
          <img src={i.hero_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <h1 className="text-4xl lg:text-5xl font-black text-white drop-shadow-lg">{i.business_name || i.name}</h1>
          </div>
        </div>
        <div className="bg-white px-4 -mt-2">
          <div className="max-w-xl mx-auto flex items-center gap-3 justify-center py-4">
            <img src={earlyTestBadge} alt="ETG" className="w-10 h-10 object-contain" />
            <span className="font-bold text-emerald-700 text-sm">Earlier Test Guaranteed</span>
            <div className="w-px h-6 bg-gray-200" />
            <SearchBox primary={i.brand_colour} />
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V12B: Overlapping Search Card ───
function V12B({ instructor: i }: any) {
  return (
    <Wrap id="V12B" title="Overlapping Search Card">
      <div>
        <div className="relative h-[450px]">
          <img src={i.hero_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white" />
          <div className="absolute bottom-20 left-0 right-0 text-center">
            <h1 className="text-4xl lg:text-5xl font-black text-white drop-shadow-lg">{i.business_name || i.name}</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto -mt-10 relative z-10 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
            <img src={earlyTestBadge} alt="ETG" className="w-11 h-11 object-contain shrink-0" />
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Enter your postcode..." className="w-full pl-10 h-12 text-base rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <button className="h-12 px-6 rounded-xl text-white font-semibold" style={{ backgroundColor: i.brand_colour }}>
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="h-8 bg-white" />
      </div>
    </Wrap>
  );
}

// ─── V12C: Brand Color Blend ───
function V12C({ instructor: i }: any) {
  return (
    <Wrap id="V12C" title="Brand Color Blend">
      <div>
        <div className="relative h-[450px]">
          <img src={i.hero_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${i.brand_colour} 100%)` }} />
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <h1 className="text-4xl lg:text-5xl font-black text-white drop-shadow-lg">{i.business_name || i.name}</h1>
          </div>
        </div>
        <div className="px-4 py-6" style={{ backgroundColor: i.brand_colour }}>
          <div className="max-w-xl mx-auto flex items-center gap-3 justify-center">
            <img src={earlyTestBadge} alt="ETG" className="w-10 h-10 object-contain" />
            <span className="text-white font-bold text-sm">Earlier Test Guaranteed</span>
            <div className="w-px h-6 bg-white/20" />
            <SearchBox primary={i.secondary_colour} />
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V12D: Frosted Embedded Bar ───
function V12D({ instructor: i }: any) {
  return (
    <Wrap id="V12D" title="Frosted Embedded Bar">
      <div className="relative h-[520px]">
        <img src={i.hero_image_url} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
        <div className="absolute top-8 left-0 right-0 text-center">
          <h1 className="text-4xl lg:text-5xl font-black text-white drop-shadow-lg">{i.business_name || i.name}</h1>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-xl border-t border-white/20 px-4 py-5">
          <div className="max-w-2xl mx-auto flex items-center gap-3 justify-center">
            <img src={earlyTestBadge} alt="ETG" className="w-10 h-10 object-contain drop-shadow" />
            <span className="text-white font-bold text-sm hidden sm:block">Earlier Test Guaranteed</span>
            <div className="flex-1 max-w-md relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Enter your postcode..." className="w-full pl-10 h-12 text-base rounded-xl bg-white/90 border-0 focus:outline-none" />
            </div>
            <button className="h-12 px-6 rounded-xl text-white font-semibold shadow-lg" style={{ backgroundColor: i.brand_colour }}>
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V12E: Gradient Melt ───
function V12E({ instructor: i }: any) {
  return (
    <Wrap id="V12E" title="Gradient Melt into Gray">
      <div>
        <div className="relative h-[450px]">
          <img src={i.hero_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-60% to-gray-100" />
          <div className="absolute bottom-16 left-0 right-0 text-center">
            <h1 className="text-4xl lg:text-5xl font-black text-white drop-shadow-lg mb-2">{i.business_name || i.name}</h1>
            <div className="inline-flex items-center gap-2 bg-emerald-500/90 backdrop-blur rounded-full px-4 py-1.5">
              <img src={earlyTestBadge} alt="ETG" className="w-6 h-6 object-contain" />
              <span className="text-white font-semibold text-xs">Earlier Test Guaranteed</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 px-4 pb-6 -mt-2">
          <div className="max-w-lg mx-auto">
            <SearchBox primary={i.brand_colour} />
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V12F: Bottom Dock ───
function V12F({ instructor: i }: any) {
  return (
    <Wrap id="V12F" title="Bottom Dock">
      <div className="relative h-[500px]">
        <img src={i.hero_image_url} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        <div className="absolute top-10 left-0 right-0 text-center">
          <h1 className="text-4xl lg:text-5xl font-black text-white drop-shadow-lg">{i.business_name || i.name}</h1>
        </div>
        <div className="absolute bottom-6 left-4 right-4 flex justify-center">
          <div className="bg-white rounded-full shadow-2xl pl-4 pr-2 py-2 flex items-center gap-2 max-w-xl w-full">
            <img src={earlyTestBadge} alt="ETG" className="w-9 h-9 object-contain shrink-0" />
            <div className="w-px h-6 bg-gray-200" />
            <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
            <input type="text" placeholder="Enter your postcode..." className="flex-1 h-10 text-base border-0 bg-transparent focus:outline-none" />
            <button className="h-10 px-5 rounded-full text-white font-semibold text-sm" style={{ backgroundColor: i.brand_colour }}>
              Search
            </button>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V12G: Split Fade with Inline Search ───
function V12G({ instructor: i }: any) {
  return (
    <Wrap id="V12G" title="Split Fade — Inline Search">
      <div>
        <div className="relative h-[450px]">
          <img src={i.hero_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 30%, white 100%)` }} />
          <div className="absolute bottom-12 left-0 right-0 px-4">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl lg:text-4xl font-black mb-4 drop-shadow-lg" style={{ color: i.brand_colour }}>{i.business_name || i.name}</h1>
              <div className="flex items-center gap-3">
                <img src={earlyTestBadge} alt="ETG" className="w-10 h-10 object-contain shrink-0" />
                <div className="flex-1 bg-white rounded-2xl shadow-xl p-2 flex items-center gap-2">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Enter your postcode..." className="w-full pl-10 h-11 text-base rounded-xl border-0 bg-gray-50 focus:outline-none" />
                  </div>
                  <button className="h-11 px-5 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: i.brand_colour }}>
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V12H: Dark Bottom Panel ───
function V12H({ instructor: i }: any) {
  return (
    <Wrap id="V12H" title="Dark Bottom Panel">
      <div>
        <div className="relative h-[400px]">
          <img src={i.hero_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900" />
        </div>
        <div className="bg-gray-900 px-4 pb-8 -mt-1">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl lg:text-4xl font-black text-white mb-5">{i.business_name || i.name}</h1>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center gap-3">
              <img src={earlyTestBadge} alt="ETG" className="w-10 h-10 object-contain shrink-0" />
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Enter your postcode..." className="w-full pl-10 h-12 text-base rounded-xl bg-white border-0 focus:outline-none" />
              </div>
              <button className="h-12 px-6 rounded-xl text-white font-semibold" style={{ backgroundColor: i.brand_colour }}>
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V12I: Seamless White with Shadow Line ───
function V12I({ instructor: i }: any) {
  return (
    <Wrap id="V12I" title="Seamless White + Shadow Line">
      <div>
        <div className="relative h-[450px]">
          <img src={i.hero_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-70% to-white" />
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <h1 className="text-4xl lg:text-5xl font-black drop-shadow-lg" style={{ color: i.brand_colour }}>{i.business_name || i.name}</h1>
          </div>
        </div>
        <div className="bg-white border-t shadow-sm px-4 py-5">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-3 bg-gray-50 rounded-full p-2 pl-4 shadow-inner">
              <img src={earlyTestBadge} alt="ETG" className="w-8 h-8 object-contain shrink-0" />
              <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
              <input type="text" placeholder="Enter your postcode to get started..." className="flex-1 h-10 text-base border-0 bg-transparent focus:outline-none" />
              <button className="h-10 px-6 rounded-full text-white font-semibold text-sm" style={{ backgroundColor: i.brand_colour }}>
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

// ─── V12J: Full Bleed with Floating Pill ───
function V12J({ instructor: i }: any) {
  return (
    <Wrap id="V12J" title="Full Bleed + Floating Pill">
      <div className="relative h-[520px]">
        <img src={i.hero_image_url} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/90" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-4xl lg:text-5xl font-black text-white drop-shadow-lg mb-3">{i.business_name || i.name}</h1>
          <div className="inline-flex items-center gap-2 bg-emerald-500 rounded-full px-4 py-2 mb-6 shadow-lg">
            <img src={earlyTestBadge} alt="ETG" className="w-7 h-7 object-contain" />
            <span className="text-white font-bold text-sm">Earlier Test Guaranteed</span>
          </div>
        </div>
        <div className="absolute bottom-8 left-4 right-4 flex justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-3 max-w-lg w-full flex items-center gap-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Enter your postcode..." className="w-full pl-10 h-12 text-base rounded-xl border-0 bg-gray-50 focus:outline-none" />
            </div>
            <button className="h-12 px-6 rounded-xl text-white font-semibold" style={{ backgroundColor: i.brand_colour }}>
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

export default function DemoMiniWebsiteLanding() {
  const { instructor, reviews, avgRating } = useData();

  if (!instructor) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const props = { instructor, reviews, avgRating };

  return (
    <div className="min-h-screen bg-muted/50">
      <div className="bg-gray-900 text-white px-4 py-6 text-center sticky top-0 z-50">
        <h1 className="text-xl font-bold">V12 Variations — Image Blending into Search</h1>
        <p className="text-sm text-gray-400">Full-width hero image • Seamless blend • Postcode search • ETG badge</p>
      </div>
      <V12A {...props} />
      <V12A {...props} />
      <V12B {...props} />
      <V12C {...props} />
      <V12D {...props} />
      <V12E {...props} />
      <V12F {...props} />
      <V12G {...props} />
      <V12H {...props} />
      <V12I {...props} />
      <V12J {...props} />
    </div>
  );
}
