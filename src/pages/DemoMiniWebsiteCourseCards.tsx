import { useState } from "react";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";
import {
  MapPin, Clock, User, PoundSterling, Star, CheckCircle, Car, Zap,
  TrendingUp, Calendar, ArrowRight, Sparkles, Shield, Award, Heart,
  ChevronRight, Timer, Gift, BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
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
  { hours: 10, isPopular: true, isIntensive: false, discountedPrice: null, features: ["Theory support", "Home pick-up", "Mock test included", "Progress tracking"] },
  { hours: 20, isPopular: false, isIntensive: false, discountedPrice: 760, features: ["Theory support", "Home pick-up", "2 mock tests", "Progress tracking", "Highway driving"] },
  { hours: 30, isPopular: true, isIntensive: false, discountedPrice: null, features: ["Theory support", "Home pick-up", "3 mock tests", "Progress tracking", "Highway driving", "Night driving"] },
  { hours: 28, isPopular: false, isIntensive: true, discountedPrice: 1050, features: ["Test in a week", "Theory support", "Home pick-up", "Intensive format", "Test booking help"] },
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

// ══════════════════════════════════════════════════════════
// VARIANT 1: Clean Minimal
// ══════════════════════════════════════════════════════════
function Variant1({ course }: { course: typeof SAMPLE_COURSES[0] }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-44 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop" alt={name} className="w-full h-full object-cover" />
        {course.isPopular && (
          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Popular</span>
        )}
        {course.isIntensive && (
          <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Zap className="h-3 w-3" /> Intensive
          </span>
        )}
      </div>
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold text-foreground">{name}</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.hours}hrs</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />Winchester</span>
          <span className="flex items-center gap-1"><Car className="h-4 w-4" />Automatic</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">£{final}</span>
                <span className="text-sm line-through text-muted-foreground">£{base}</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-foreground">£{base}</span>
            )}
            <p className="text-xs text-muted-foreground">or from £{Math.round(final / 4)}/mo</p>
          </div>
          <Button size="sm" className="rounded-full">Book Now</Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 2: Bold Split
// ══════════════════════════════════════════════════════════
function Variant2({ course }: { course: typeof SAMPLE_COURSES[0] }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all group">
      <div className="flex">
        {/* Date strip */}
        <div className="w-20 flex flex-col items-center justify-center py-6" style={{ backgroundColor: brandColour }}>
          <span className="text-3xl font-black text-white">{format(nextDate, "d")}</span>
          <span className="text-xs font-bold text-white/70 uppercase">{format(nextDate, "MMM")}</span>
          <div className="mt-2 w-8 h-px bg-white/30" />
          <span className="text-[10px] text-white/60 mt-1">{course.hours}hrs</span>
        </div>
        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground mt-1">with {SAMPLE_INSTRUCTOR.name}</p>
            </div>
            {course.isPopular && <Badge className="bg-emerald-500 border-0 text-white">Popular</Badge>}
          </div>
          <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Winchester</span>
            <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" />Automatic</span>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {course.features.slice(0, 3).map((f, i) => (
              <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{f}</span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div>
              {hasDiscount ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold">£{final}</span>
                  <span className="text-sm line-through text-muted-foreground">£{base}</span>
                </div>
              ) : (
                <span className="text-xl font-bold">£{base}</span>
              )}
            </div>
            <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              View <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 3: Gradient Hero Card
// ══════════════════════════════════════════════════════════
function Variant3({ course }: { course: typeof SAMPLE_COURSES[0] }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);

  return (
    <div className="relative rounded-2xl overflow-hidden group hover:shadow-2xl transition-all">
      <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop" alt={name} className="w-full h-72 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
        <div className="flex gap-2 mb-2">
          {course.isPopular && <Badge className="bg-emerald-500 border-0">Popular</Badge>}
          {course.isIntensive && <Badge className="bg-amber-500 border-0"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>}
          <Badge className="bg-white/20 backdrop-blur-sm border-0"><Car className="h-3 w-3 mr-1" />Auto</Badge>
        </div>
        <h3 className="text-2xl font-black">{name}</h3>
        <div className="flex items-center gap-4 mt-1 text-white/80 text-sm">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.hours} hours</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Winchester</span>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(nextDate, "d MMM")}</span>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">£{final}</span>
                <span className="text-base line-through text-white/50">£{base}</span>
              </div>
            ) : (
              <span className="text-2xl font-black">£{base}</span>
            )}
          </div>
          <Button className="bg-white text-black hover:bg-white/90 font-bold rounded-full">Book Now</Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 4: Compact Horizontal
// ══════════════════════════════════════════════════════════
function Variant4({ course }: { course: typeof SAMPLE_COURSES[0] }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);

  return (
    <div className="flex bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative w-36 shrink-0">
        <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop" alt={name} className="w-full h-full object-cover" />
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            SAVE £{base - final}
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">{name}</h3>
            {course.isPopular && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">POPULAR</span>}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Winchester</span>
            <span className="flex items-center gap-1"><Car className="h-3 w-3" />Auto</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(nextDate, "d MMM")}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          {hasDiscount ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">£{final}</span>
              <span className="text-xs line-through text-muted-foreground">£{base}</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-foreground">£{base}</span>
          )}
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-full">Book <ArrowRight className="h-3 w-3 ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 5: iOS Card Stack
// ══════════════════════════════════════════════════════════
function Variant5({ course }: { course: typeof SAMPLE_COURSES[0] }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);

  return (
    <div className="bg-card rounded-[20px] border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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
          <div className="flex gap-1">
            {course.isPopular && <Badge variant="secondary" className="text-[10px]">Popular</Badge>}
            {course.isIntensive && <Badge className="bg-amber-500 border-0 text-white text-[10px]">Intensive</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted rounded-xl p-3 text-center">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <span className="text-xs font-medium">{course.hours}hrs</span>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <MapPin className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <span className="text-xs font-medium">Winchester</span>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <Car className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <span className="text-xs font-medium">Auto</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {course.features.slice(0, 4).map((f, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-emerald-500" />{f}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-foreground">£{final}</span>
                <span className="text-sm line-through text-muted-foreground">£{base}</span>
              </div>
            ) : (
              <span className="text-xl font-black text-foreground">£{base}</span>
            )}
            <p className="text-[11px] text-muted-foreground">from £{Math.round(final / 4)}/mo</p>
          </div>
          <Button className="rounded-full" size="sm">Book Now</Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 6: Magazine Editorial
// ══════════════════════════════════════════════════════════
function Variant6({ course }: { course: typeof SAMPLE_COURSES[0] }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);

  return (
    <div className="bg-card border border-border rounded-none hover:shadow-xl transition-all overflow-hidden">
      <div className="relative h-52 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop" alt={name} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" />
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: brandColour }} />
      </div>
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">
          <span>{course.hours} Hours</span>
          <span>·</span>
          <span>Automatic</span>
          <span>·</span>
          <span>Winchester</span>
        </div>
        <h3 className="text-2xl font-black text-foreground tracking-tight">{name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {SAMPLE_INSTRUCTOR.bio}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">£{final}</span>
                <span className="text-base line-through text-muted-foreground">£{base}</span>
              </div>
            ) : (
              <span className="text-2xl font-black">£{base}</span>
            )}
          </div>
          <button className="text-sm font-bold uppercase tracking-wider hover:underline flex items-center gap-1" style={{ color: brandColour }}>
            Book Now <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 7: Pricing Table Style
// ══════════════════════════════════════════════════════════
function Variant7({ course }: { course: typeof SAMPLE_COURSES[0] }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);

  return (
    <div className={`bg-card rounded-2xl border-2 overflow-hidden transition-all hover:shadow-xl ${course.isPopular ? 'border-emerald-500 shadow-emerald-500/10' : 'border-border'}`}>
      {course.isPopular && (
        <div className="bg-emerald-500 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
          Most Popular
        </div>
      )}
      <div className="p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full mx-auto" style={{ backgroundColor: `${brandColour}15` }}>
          <span className="text-2xl font-black" style={{ color: brandColour }}>{course.hours}</span>
        </div>
        <h3 className="text-xl font-bold text-foreground">{name}</h3>
        <div>
          {hasDiscount ? (
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-black text-foreground">£{final}</span>
              <span className="text-lg line-through text-muted-foreground">£{base}</span>
            </div>
          ) : (
            <span className="text-4xl font-black text-foreground">£{base}</span>
          )}
          <p className="text-sm text-muted-foreground mt-1">or from £{Math.round(final / 4)}/month</p>
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
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Calendar className="h-3 w-3" />Next: {format(nextDate, "d MMM yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 8: Glassmorphic
// ══════════════════════════════════════════════════════════
function Variant8({ course }: { course: typeof SAMPLE_COURSES[0] }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);

  return (
    <div className="relative rounded-2xl overflow-hidden group">
      <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=600&fit=crop" alt={name} className="w-full h-80 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="backdrop-blur-xl bg-white/15 rounded-2xl p-5 border border-white/20 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{name}</h3>
              <div className="flex items-center gap-3 text-sm text-white/70 mt-0.5">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.hours}hrs</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Winchester</span>
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
          <div className="flex items-center gap-2">
            {course.features.slice(0, 3).map((f, i) => (
              <span key={i} className="text-[10px] bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">{f}</span>
            ))}
          </div>
          <Button className="w-full bg-white text-black hover:bg-white/90 rounded-full font-bold">Book Now</Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 9: Feature Grid Card
// ══════════════════════════════════════════════════════════
function Variant9({ course }: { course: typeof SAMPLE_COURSES[0] }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
      {/* Top colored banner */}
      <div className="h-2" style={{ backgroundColor: brandColour }} />
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
            <Badge className="bg-red-500 border-0 text-white text-[10px]">-£{base - final} OFF</Badge>
          )}
        </div>

        {/* Feature pills grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">{course.hours} hours</span>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2.5">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">Automatic</span>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">Winchester</span>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">{format(nextDate, "d MMM")}</span>
          </div>
        </div>

        {/* Features list */}
        <div className="space-y-1.5">
          {course.features.slice(0, 4).map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black">£{final}</span>
                <span className="text-sm line-through text-muted-foreground">£{base}</span>
              </div>
            ) : (
              <span className="text-xl font-black">£{base}</span>
            )}
            <CompactPaymentBadges amount={final} />
          </div>
          <Button size="sm" className="rounded-full" style={{ backgroundColor: brandColour }}>
            Book Now <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VARIANT 10: Bold Banner Card
// ══════════════════════════════════════════════════════════
function Variant10({ course }: { course: typeof SAMPLE_COURSES[0] }) {
  const { base, final, hasDiscount } = getPrice(course.hours, course.discountedPrice);
  const name = getCourseName(course.hours);

  return (
    <div className="rounded-2xl overflow-hidden hover:shadow-xl transition-all border border-border">
      {/* Bold top section */}
      <div className="p-5 text-white relative" style={{ backgroundColor: brandColour }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/4" style={{ backgroundColor: 'white' }} />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {course.isPopular && <Badge className="bg-white/20 border-0 text-white text-[10px]">⭐ Popular</Badge>}
              {course.isIntensive && <Badge className="bg-amber-400 border-0 text-black text-[10px]"><Zap className="h-3 w-3 mr-0.5" />Intensive</Badge>}
            </div>
            <h3 className="text-xl font-black">{name}</h3>
            <p className="text-sm text-white/70 mt-0.5">{course.hours} hours · Automatic · Winchester</p>
          </div>
          <div className="text-right">
            {hasDiscount ? (
              <>
                <p className="text-sm line-through text-white/50">£{base}</p>
                <span className="text-3xl font-black">£{final}</span>
              </>
            ) : (
              <span className="text-3xl font-black">£{base}</span>
            )}
          </div>
        </div>
      </div>
      {/* Bottom section */}
      <div className="bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback style={{ backgroundColor: brandColour, color: 'white' }} className="text-xs">KD</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{SAMPLE_INSTRUCTOR.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>4.9 · Grade A Instructor</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {course.features.slice(0, 4).map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />{f}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />Next: {format(nextDate, "d MMM")}
          </p>
          <Button size="sm" className="rounded-full" style={{ backgroundColor: brandColour }}>
            Book Now
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
  { name: "1. Clean Minimal", desc: "Simple, modern card with image hero and clean typography", Component: Variant1 },
  { name: "2. Bold Split", desc: "Date strip on the left with horizontal content layout", Component: Variant2 },
  { name: "3. Gradient Hero", desc: "Full-bleed image with gradient overlay and floating content", Component: Variant3 },
  { name: "4. Compact Horizontal", desc: "Space-efficient horizontal layout, great for lists", Component: Variant4 },
  { name: "5. iOS Card Stack", desc: "Apple-inspired rounded cards with info pill grid", Component: Variant5 },
  { name: "6. Magazine Editorial", desc: "Editorial style with strong typography and minimal color", Component: Variant6 },
  { name: "7. Pricing Table", desc: "Centered pricing card with feature checklist", Component: Variant7 },
  { name: "8. Glassmorphic", desc: "Frosted glass overlay on full-bleed imagery", Component: Variant8 },
  { name: "9. Feature Grid", desc: "Instructor avatar with detailed feature grid layout", Component: Variant9 },
  { name: "10. Bold Banner", desc: "Bold colored header section with white content area", Component: Variant10 },
];

export default function DemoMiniWebsiteCourseCards() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10 space-y-16">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-foreground">Mini-Website Course Cards</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            10 design variants for instructor mini-website course cards. Same data, different styles.
          </p>
        </div>

        {VARIANTS.map(({ name, desc, Component }) => (
          <section key={name} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{name}</h2>
              <p className="text-muted-foreground">{desc}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
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
