import { useState } from "react";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";
import {
  MapPin, Clock, User, PoundSterling, Star, CheckCircle, Car, Zap,
  TrendingUp, Calendar, ArrowRight, Sparkles, Shield, Award, Heart,
  ChevronRight, Timer, Gift, BookOpen, GraduationCap, Route,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompactPaymentBadges } from "@/components/payments/PaymentMessaging";

// ── Sample data ──────────────────────────────────────────
const SAMPLE_INSTRUCTOR = {
  id: "demo",
  name: "Ken Donaldson",
  profile_image_url: null,
  car_type: "Automatic",
  car_make: "Toyota",
  car_model: "Yaris",
  home_postcode: "SO23 9AB",
  home_address: "Winchester",
  hourly_rate: 40,
  bio: "Grade A instructor with 15+ years of experience. Specialising in nervous and anxious learners with a calm, patient approach.",
  brand_colour: "#1e3a5f",
};

const SAMPLE_COURSES = [
  { hours: 10, isPopular: true, isIntensive: false, discountedPrice: null, features: ["Theory support", "Home pick-up", "Mock test included", "Progress tracking"], image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop" },
  { hours: 20, isPopular: false, isIntensive: false, discountedPrice: 760, features: ["Theory support", "Home pick-up", "2 mock tests", "Progress tracking", "Highway driving"], image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=400&fit=crop" },
  { hours: 30, isPopular: true, isIntensive: false, discountedPrice: null, features: ["Theory support", "Home pick-up", "3 mock tests", "Progress tracking", "Highway driving", "Night driving"], image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=400&fit=crop" },
  { hours: 28, isPopular: false, isIntensive: true, discountedPrice: 1050, features: ["Test in a week", "Theory support", "Home pick-up", "Intensive format", "Test booking help"], image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&h=400&fit=crop" },
];

const nextDate = addDays(new Date(), 5);
const brandColour = "#1e3a5f";

function getPrice(hours: number, discountedPrice: number | null) {
  const base = hours * (SAMPLE_INSTRUCTOR.hourly_rate || 40);
  return { base, final: discountedPrice || base, hasDiscount: !!discountedPrice && discountedPrice < base };
}

function getCourseName(hours: number) {
  return hours === 28 ? "Test in a Week" : `${hours} Hour Course`;
}

type CourseType = typeof SAMPLE_COURSES[0];

// ══════════════════════════════════════════════════════════
// VARIANT 1: Elevated Card
// ══════════════════════════════════════════════════════════
function Variant1({ course }: { course: CourseType }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all group">
      <div className="relative h-48 overflow-hidden">
        <img src={course.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {course.isPopular && <Badge className="bg-emerald-500 border-0 text-white shadow-lg">⭐ Popular</Badge>}
          {course.isIntensive && <Badge className="bg-amber-500 border-0 text-white shadow-lg"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>}
        </div>
        <Badge className="absolute top-3 right-3 bg-white/90 text-foreground border-0 shadow"><Car className="h-3 w-3 mr-1" />Automatic</Badge>
        {hasDiscount && (
          <div className="absolute bottom-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-lg shadow-lg text-sm font-bold">
            Save £{base - final}
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">with {SAMPLE_INSTRUCTOR.name} · Winchester</p>
          </div>
          <div className="flex items-center gap-1 text-sm" style={{ color: brandColour }}>
            <Calendar className="h-4 w-4" />
            <span className="font-semibold">{format(nextDate, "d MMM")}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.hours} hours</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Winchester</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {course.features.slice(0, 3).map((f, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle className="h-3 w-3 text-emerald-500" />{f}</span>
          ))}
        </div>
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <div>
              {hasDiscount ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">£{final}</span>
                  <span className="text-sm line-through text-muted-foreground">£{base}</span>
                </div>
              ) : (
                <span className="text-2xl font-black text-foreground">£{base}</span>
              )}
            </div>
            <Button size="sm" className="rounded-full" style={{ backgroundColor: brandColour }}>Book Now</Button>
          </div>
          <CompactPaymentBadges amount={final} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 2: Stacked Modern
// ══════════════════════════════════════════════════════════
function Variant2({ course }: { course: CourseType }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);
  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden hover:shadow-xl transition-all">
      <div className="relative h-44 overflow-hidden">
        <img src={course.image} alt={name} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-1.5">
          {course.isPopular && <Badge className="bg-emerald-500/90 backdrop-blur-sm border-0 text-white">Popular</Badge>}
          {course.isIntensive && <Badge className="bg-amber-500/90 backdrop-blur-sm border-0 text-white"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>}
          <Badge className="bg-white/80 backdrop-blur-sm text-foreground border-0"><Car className="h-3 w-3 mr-1" />Auto</Badge>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-xl font-black text-foreground">{name}</h3>
          <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.hours}hrs</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Winchester</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(nextDate, "d MMM")}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {course.features.slice(0, 4).map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />{f}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">£{final}</span>
                <span className="text-sm line-through text-muted-foreground">£{base}</span>
                <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">-£{base - final}</Badge>
              </div>
            ) : (
              <span className="text-2xl font-black text-foreground">£{base}</span>
            )}
            <Button size="sm" className="rounded-full px-6" style={{ backgroundColor: brandColour }}>Book</Button>
          </div>
          <CompactPaymentBadges amount={final} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 3: Side-by-Side Pro
// ══════════════════════════════════════════════════════════
function Variant3({ course }: { course: CourseType }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);
  return (
    <div className="flex bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all group">
      <div className="relative w-44 shrink-0 overflow-hidden">
        <img src={course.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">SAVE £{base - final}</div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-foreground">{name}</h3>
            <div className="flex gap-1">
              {course.isPopular && <Badge variant="secondary" className="text-[10px]">Popular</Badge>}
              {course.isIntensive && <Badge className="bg-amber-500 border-0 text-white text-[10px]"><Zap className="h-3 w-3" /></Badge>}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.hours}hrs</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Winchester</span>
            <span className="flex items-center gap-1"><Car className="h-3 w-3" />Auto</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {course.features.slice(0, 3).map((f, i) => (
              <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{f}</span>
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            {hasDiscount ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black">£{final}</span>
                <span className="text-xs line-through text-muted-foreground">£{base}</span>
              </div>
            ) : (
              <span className="text-xl font-black">£{base}</span>
            )}
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              View <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <CompactPaymentBadges amount={final} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 4: Cinematic Overlay
// ══════════════════════════════════════════════════════════
function Variant4({ course }: { course: CourseType }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);
  return (
    <div className="relative rounded-2xl overflow-hidden group hover:shadow-2xl transition-all h-[380px]">
      <img src={course.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute top-3 left-3 flex gap-1.5 z-10">
        {course.isPopular && <Badge className="bg-emerald-500 border-0 text-white">⭐ Popular</Badge>}
        {course.isIntensive && <Badge className="bg-amber-500 border-0 text-white"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>}
        <Badge className="bg-white/20 backdrop-blur-sm border-0 text-white"><Car className="h-3 w-3 mr-1" />Auto</Badge>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white space-y-3">
        <div>
          <h3 className="text-2xl font-black">{name}</h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-white/80">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.hours}hrs</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Winchester</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(nextDate, "d MMM")}</span>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">£{final}</span>
                <span className="text-base line-through text-white/50">£{base}</span>
              </div>
            ) : (
              <span className="text-3xl font-black">£{base}</span>
            )}
            <CompactPaymentBadges amount={final} className="mt-1.5" />
          </div>
          <Button className="bg-white text-black hover:bg-white/90 font-bold rounded-full shadow-xl">Book Now</Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 5: Pill Info Card
// ══════════════════════════════════════════════════════════
function Variant5({ course }: { course: CourseType }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);
  return (
    <div className="bg-card rounded-[20px] border border-border shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <img src={course.image} alt={name} className="w-full h-full object-cover" />
        {hasDiscount && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">-£{base - final}</div>
        )}
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-lg" style={{ backgroundColor: brandColour }}>
              {course.hours}
            </div>
            <div>
              <h3 className="font-bold text-foreground">{name}</h3>
              <p className="text-xs text-muted-foreground">{format(nextDate, "EEEE, d MMMM")}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {course.isPopular && <Badge variant="secondary" className="text-[10px]">Popular</Badge>}
            {course.isIntensive && <Badge className="bg-amber-500 border-0 text-white text-[10px]">Intensive</Badge>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted rounded-xl p-2.5 text-center">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-0.5" />
            <span className="text-[11px] font-medium">{course.hours}hrs</span>
          </div>
          <div className="bg-muted rounded-xl p-2.5 text-center">
            <MapPin className="h-4 w-4 mx-auto text-muted-foreground mb-0.5" />
            <span className="text-[11px] font-medium">Winchester</span>
          </div>
          <div className="bg-muted rounded-xl p-2.5 text-center">
            <Car className="h-4 w-4 mx-auto text-muted-foreground mb-0.5" />
            <span className="text-[11px] font-medium">Auto</span>
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-foreground">£{final}</span>
                <span className="text-sm line-through text-muted-foreground">£{base}</span>
              </div>
            ) : (
              <span className="text-xl font-black text-foreground">£{base}</span>
            )}
            <Button className="rounded-full" size="sm" style={{ backgroundColor: brandColour }}>Book Now</Button>
          </div>
          <CompactPaymentBadges amount={final} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 6: Bold Header Card
// ══════════════════════════════════════════════════════════
function Variant6({ course }: { course: CourseType }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);
  return (
    <div className="rounded-2xl overflow-hidden hover:shadow-xl transition-all border border-border">
      <div className="relative">
        <img src={course.image} alt={name} className="w-full h-40 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div className="text-white">
            <div className="flex gap-1.5 mb-1">
              {course.isPopular && <Badge className="bg-emerald-500/90 border-0 text-white text-[10px]">Popular</Badge>}
              {course.isIntensive && <Badge className="bg-amber-500/90 border-0 text-white text-[10px]"><Zap className="h-3 w-3 mr-0.5" />Intensive</Badge>}
            </div>
            <h3 className="text-xl font-black">{name}</h3>
          </div>
          <Badge className="bg-white/20 backdrop-blur-sm border-0 text-white"><Car className="h-3 w-3 mr-1" />Auto</Badge>
        </div>
      </div>
      <div className="p-4" style={{ backgroundColor: brandColour }}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-white/70" />{course.hours}hrs</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-white/70" />Winchester</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-white/70" />{format(nextDate, "d MMM")}</span>
          </div>
          <div className="text-right">
            {hasDiscount ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black">£{final}</span>
                <span className="text-xs line-through text-white/50">£{base}</span>
              </div>
            ) : (
              <span className="text-xl font-black">£{base}</span>
            )}
          </div>
        </div>
      </div>
      <div className="bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback style={{ backgroundColor: brandColour, color: 'white' }} className="text-xs">KD</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{SAMPLE_INSTRUCTOR.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />4.9 · Grade A
            </div>
          </div>
          <Button size="sm" className="ml-auto rounded-full" style={{ backgroundColor: brandColour }}>Book Now</Button>
        </div>
        <CompactPaymentBadges amount={final} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 7: Pricing Focus
// ══════════════════════════════════════════════════════════
function Variant7({ course }: { course: CourseType }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);
  return (
    <div className={`bg-card rounded-2xl border-2 overflow-hidden transition-all hover:shadow-xl ${course.isPopular ? 'border-emerald-500 shadow-emerald-500/10' : 'border-border'}`}>
      {course.isPopular && (
        <div className="bg-emerald-500 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">Most Popular</div>
      )}
      <div className="relative h-36 overflow-hidden">
        <img src={course.image} alt={name} className="w-full h-full object-cover" />
        {course.isIntensive && (
          <Badge className="absolute top-2 right-2 bg-amber-500 border-0 text-white"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>
        )}
      </div>
      <div className="p-6 text-center space-y-4">
        <h3 className="text-xl font-bold text-foreground">{name}</h3>
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.hours}hrs</span>
          <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" />Auto</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Winchester</span>
        </div>
        <div>
          {hasDiscount ? (
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-black text-foreground">£{final}</span>
              <span className="text-lg line-through text-muted-foreground">£{base}</span>
            </div>
          ) : (
            <span className="text-4xl font-black text-foreground">£{base}</span>
          )}
        </div>
        <div className="space-y-2 text-left">
          {course.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-foreground">{f}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-2">
          <Button className="w-full rounded-full" style={{ backgroundColor: brandColour }}>Book Now</Button>
          <CompactPaymentBadges amount={final} className="justify-center" />
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Calendar className="h-3 w-3" />Next: {format(nextDate, "d MMM yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 8: Glassmorphic Float
// ══════════════════════════════════════════════════════════
function Variant8({ course }: { course: CourseType }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);
  return (
    <div className="relative rounded-2xl overflow-hidden group h-[360px]">
      <img src={course.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute top-3 left-3 flex gap-1.5">
        {course.isPopular && <Badge className="bg-emerald-500 border-0 text-white">Popular</Badge>}
        {course.isIntensive && <Badge className="bg-amber-500 border-0 text-white"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="backdrop-blur-xl bg-white/15 rounded-2xl p-5 border border-white/20 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{name}</h3>
              <div className="flex items-center gap-3 text-sm text-white/70 mt-0.5">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.hours}hrs</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Winchester</span>
                <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" />Auto</span>
              </div>
            </div>
            <div className="text-right">
              {hasDiscount ? (
                <>
                  <span className="text-xl font-black">£{final}</span>
                  <p className="text-xs line-through text-white/50">£{base}</p>
                </>
              ) : (
                <span className="text-xl font-black">£{base}</span>
              )}
            </div>
          </div>
          <CompactPaymentBadges amount={final} />
          <Button className="w-full bg-white text-black hover:bg-white/90 rounded-full font-bold">Book Now</Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 9: Feature Grid Pro
// ══════════════════════════════════════════════════════════
function Variant9({ course }: { course: CourseType }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40 overflow-hidden">
        <img src={course.image} alt={name} className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {course.isPopular && <Badge className="bg-emerald-500 border-0 text-white">Popular</Badge>}
          {course.isIntensive && <Badge className="bg-amber-500 border-0 text-white"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>}
        </div>
        <Badge className="absolute top-3 right-3 bg-white/90 text-foreground border-0"><Car className="h-3 w-3 mr-1" />Auto</Badge>
      </div>
      <div className="h-1.5" style={{ backgroundColor: brandColour }} />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border-2" style={{ borderColor: brandColour }}>
              <AvatarFallback style={{ backgroundColor: brandColour, color: 'white' }}>KD</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-foreground">{name}</h3>
              <p className="text-xs text-muted-foreground">with {SAMPLE_INSTRUCTOR.name}</p>
            </div>
          </div>
          {hasDiscount && (
            <Badge className="bg-red-500 border-0 text-white text-[10px]">-£{base - final}</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">{course.hours} hours</span>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">Winchester</span>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">{format(nextDate, "d MMM")}</span>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2.5">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium">4.9 rated</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {course.features.slice(0, 4).map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black">£{final}</span>
                <span className="text-sm line-through text-muted-foreground">£{base}</span>
              </div>
            ) : (
              <span className="text-xl font-black">£{base}</span>
            )}
            <Button size="sm" className="rounded-full" style={{ backgroundColor: brandColour }}>
              Book Now <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <CompactPaymentBadges amount={final} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 10: Split Date Banner
// ══════════════════════════════════════════════════════════
function Variant10({ course }: { course: CourseType }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all group">
      <div className="relative h-44 overflow-hidden">
        <img src={course.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        <div className="absolute top-3 right-3 flex gap-1.5">
          {course.isPopular && <Badge className="bg-emerald-500 border-0 text-white shadow">Popular</Badge>}
          {course.isIntensive && <Badge className="bg-amber-500 border-0 text-white shadow"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>}
        </div>
        {/* Date overlay on image */}
        <div className="absolute bottom-0 left-0 p-4">
          <div className="flex items-center gap-3 text-white">
            <div className="h-14 w-14 rounded-xl flex flex-col items-center justify-center" style={{ backgroundColor: brandColour }}>
              <span className="text-xl font-black leading-none">{format(nextDate, "d")}</span>
              <span className="text-[10px] font-bold uppercase text-white/80">{format(nextDate, "MMM")}</span>
            </div>
            <div>
              <h3 className="text-lg font-black drop-shadow-lg">{name}</h3>
              <p className="text-sm text-white/80">{course.hours}hrs · Automatic</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback style={{ backgroundColor: brandColour, color: 'white' }} className="text-xs">KD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{SAMPLE_INSTRUCTOR.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Winchester</p>
          </div>
          <div className="text-right">
            {hasDiscount ? (
              <div>
                <div className="flex items-baseline gap-1.5 justify-end">
                  <span className="text-lg font-black text-foreground">£{final}</span>
                  <span className="text-xs line-through text-muted-foreground">£{base}</span>
                </div>
              </div>
            ) : (
              <span className="text-lg font-black text-foreground">£{base}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {course.features.slice(0, 3).map((f, i) => (
            <span key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-emerald-500" />{f}
            </span>
          ))}
        </div>
        <div className="space-y-2 pt-2 border-t border-border">
          <CompactPaymentBadges amount={final} />
          <Button className="w-full rounded-full" size="sm" style={{ backgroundColor: brandColour }}>
            Book Now <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// DEMO PAGE
// ══════════════════════════════════════════════════════════
const VARIANTS = [
  { name: "1. Elevated Card", desc: "Image hero with badges, features, and full payment options", Component: Variant1 },
  { name: "2. Stacked Modern", desc: "Clean stacked layout with rounded corners and discount badge", Component: Variant2 },
  { name: "3. Side-by-Side Pro", desc: "Horizontal layout with image on left, details on right", Component: Variant3 },
  { name: "4. Cinematic Overlay", desc: "Full-bleed image with gradient overlay and floating content", Component: Variant4 },
  { name: "5. Pill Info Card", desc: "Apple-inspired with hours badge and info pill grid", Component: Variant5 },
  { name: "6. Bold Header Card", desc: "Image + branded color bar + white content area", Component: Variant6 },
  { name: "7. Pricing Focus", desc: "Centered pricing table style with feature checklist", Component: Variant7 },
  { name: "8. Glassmorphic Float", desc: "Frosted glass card floating over full-bleed imagery", Component: Variant8 },
  { name: "9. Feature Grid Pro", desc: "Instructor avatar with detailed feature and info grid", Component: Variant9 },
  { name: "10. Split Date Banner", desc: "Date box overlay on image with instructor details below", Component: Variant10 },
];

export default function DemoMiniWebsiteCourseCards() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10 space-y-16">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-foreground">Mini-Website Course Cards</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            10 design variants for instructor mini-website course cards. All include images, Klarna & Clearpay.
          </p>
        </div>

        {VARIANTS.map(({ name, desc, Component }) => (
          <section key={name} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{name}</h2>
              <p className="text-muted-foreground">{desc}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {SAMPLE_COURSES.map((course, i) => (
                <Component key={i} course={course} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
