import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, User, PoundSterling, Star, CheckCircle, Car, Zap, TrendingUp, ArrowRight, Calendar, ChevronRight, Bookmark, Heart, Award, Shield, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import courseIntensive from "@/assets/course-intensive.jpg";

// Mock data matching DynamicCourseCard props
const mockCourse = {
  instructor: {
    id: "demo-1",
    name: "Sarah Mitchell",
    profile_image_url: null,
    car_type: "Automatic",
    car_make: "Toyota",
    car_model: "Yaris",
    home_postcode: "SW1A 1AA",
    home_address: "Central London",
    hourly_rate: 40,
    bio: "Friendly, patient instructor with 10+ years experience. Specialist in nervous learners and intensive courses.",
    brand_colour: "#1e3a5f",
  },
  hours: 30,
  courseImageUrl: courseIntensive,
  isPopular: true,
  isIntensive: true,
  features: ["Theory support", "Home pick-up", "Mock test included", "Flexible scheduling"],
  totalPrice: 1200,
  finalPrice: 1080,
  hasDiscount: true,
  nextDate: "15 Apr",
  distance: 2.3,
};

function SectionLabel({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      <div className="flex items-center gap-3 mb-1">
        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">{number}</span>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground ml-11">{description}</p>
    </div>
  );
}

// ─── Variant 1: Clean Minimal ───
function V1CleanMinimal() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-44 overflow-hidden">
        <img src={mockCourse.courseImageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className="bg-emerald-500 text-white border-0">Popular</Badge>
          <Badge className="bg-primary text-white border-0"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>
        </div>
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-foreground px-2.5 py-1 rounded-lg text-sm font-semibold">
          <MapPin className="h-3.5 w-3.5 inline mr-1" />{mockCourse.distance} mi
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{mockCourse.hours} Hour Course</h3>
            <p className="text-sm text-muted-foreground">with {mockCourse.instructor.name}</p>
          </div>
          <div className="text-right">
            <span className="text-sm line-through text-muted-foreground">£{mockCourse.totalPrice}</span>
            <p className="text-xl font-bold text-foreground">£{mockCourse.finalPrice}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{mockCourse.nextDate}</span>
          <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" />Automatic</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{mockCourse.instructor.home_postcode}</span>
        </div>
        <Button className="w-full">Book Now</Button>
      </div>
    </div>
  );
}

// ─── Variant 2: Horizontal Card ───
function V2HorizontalCard() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex hover:shadow-lg transition-shadow">
      <div className="relative w-48 shrink-0">
        <img src={mockCourse.courseImageUrl} alt="" className="h-full w-full object-cover" />
        <Badge className="absolute top-2 left-2 bg-emerald-500 text-white border-0 text-xs">Popular</Badge>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-base">{mockCourse.hours} Hour Intensive</h3>
            <Badge variant="secondary" className="text-xs"><Car className="h-3 w-3 mr-1" />Auto</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Avatar className="h-5 w-5"><AvatarFallback className="text-[10px] bg-primary text-primary-foreground">SM</AvatarFallback></Avatar>
            <span>{mockCourse.instructor.name}</span>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>4.9</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span><Calendar className="h-3 w-3 inline mr-1" />{mockCourse.nextDate}</span>
            <span><MapPin className="h-3 w-3 inline mr-1" />{mockCourse.distance} mi</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div>
            <span className="text-sm line-through text-muted-foreground mr-2">£{mockCourse.totalPrice}</span>
            <span className="text-lg font-bold">£{mockCourse.finalPrice}</span>
          </div>
          <Button size="sm">Book Now</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Variant 3: Bold Gradient Footer ───
function V3BoldGradient() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card hover:shadow-xl transition-shadow">
      <div className="relative h-48">
        <img src={mockCourse.courseImageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-0"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">Popular</Badge>
          </div>
          <h3 className="text-xl font-bold text-white">{mockCourse.hours} Hour Course</h3>
        </div>
        <div className="absolute top-3 right-3 bg-red-500 text-white px-2.5 py-1 rounded-lg text-sm font-bold">
          Save £{mockCourse.totalPrice - mockCourse.finalPrice}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary"><AvatarFallback className="bg-primary text-primary-foreground">SM</AvatarFallback></Avatar>
          <div>
            <p className="font-medium text-sm">{mockCourse.instructor.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />4.9 · {mockCourse.instructor.home_address}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted rounded-lg p-2"><Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" /><span className="text-xs font-medium">{mockCourse.hours}h</span></div>
          <div className="bg-muted rounded-lg p-2"><Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" /><span className="text-xs font-medium">{mockCourse.nextDate}</span></div>
          <div className="bg-muted rounded-lg p-2"><Car className="h-4 w-4 mx-auto mb-1 text-muted-foreground" /><span className="text-xs font-medium">Auto</span></div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between bg-primary rounded-xl px-4 py-3">
          <div>
            <span className="text-sm line-through text-primary-foreground/60">£{mockCourse.totalPrice}</span>
            <span className="text-xl font-bold text-primary-foreground ml-2">£{mockCourse.finalPrice}</span>
          </div>
          <Button variant="secondary" size="sm">Book Now <ArrowRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}

// ─── Variant 4: Magazine Style ───
function V4Magazine() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative h-56 overflow-hidden">
        <img src={mockCourse.courseImageUrl} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card" />
      </div>
      <div className="-mt-8 relative z-10 px-5 pb-5 space-y-3">
        <div className="flex gap-1.5">
          <Badge className="bg-emerald-500/90 text-white border-0 text-xs">Popular</Badge>
          <Badge className="bg-primary/90 text-primary-foreground border-0 text-xs"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>
          <Badge variant="outline" className="text-xs bg-card"><Car className="h-3 w-3 mr-1" />Auto</Badge>
        </div>
        <h3 className="text-2xl font-black tracking-tight">{mockCourse.hours} HOUR COURSE</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{mockCourse.instructor.bio}</p>
        <div className="flex items-center gap-3 py-2">
          <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">SM</AvatarFallback></Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold">{mockCourse.instructor.name}</p>
            <p className="text-xs text-muted-foreground">{mockCourse.instructor.home_address} · {mockCourse.nextDate}</p>
          </div>
          <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="text-sm font-bold">4.9</span></div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <span className="text-sm line-through text-muted-foreground mr-1">£{mockCourse.totalPrice}</span>
            <span className="text-2xl font-black">£{mockCourse.finalPrice}</span>
            <p className="text-xs text-muted-foreground">or from £{Math.round(mockCourse.finalPrice / 4)}/mo</p>
          </div>
          <Button>View Course <ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}

// ─── Variant 5: Compact Pill Card ───
function V5CompactPill() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-lg transition-shadow space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0">
          <img src={mockCourse.courseImageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Badge className="bg-primary text-primary-foreground border-0 text-[10px] px-1.5 py-0"><Zap className="h-2.5 w-2.5 mr-0.5" />Intensive</Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Popular</Badge>
          </div>
          <h3 className="font-bold truncate">{mockCourse.hours} Hour Course</h3>
          <p className="text-xs text-muted-foreground truncate">{mockCourse.instructor.name} · {mockCourse.instructor.home_address}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs line-through text-muted-foreground">£{mockCourse.totalPrice}</p>
          <p className="text-lg font-bold">£{mockCourse.finalPrice}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { icon: Calendar, label: mockCourse.nextDate },
          { icon: Car, label: "Auto" },
          { icon: MapPin, label: `${mockCourse.distance} mi` },
          { icon: Clock, label: `${mockCourse.hours}h` },
        ].map((item, i) => (
          <span key={i} className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1 text-xs text-muted-foreground shrink-0">
            <item.icon className="h-3 w-3" />{item.label}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">Details</Button>
        <Button size="sm" className="flex-1">Book Now</Button>
      </div>
    </div>
  );
}

// ─── Variant 6: Split Brand Color ───
function V6SplitBrand() {
  return (
    <div className="rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow flex flex-col">
      <div className="relative h-40 overflow-hidden">
        <img src={mockCourse.courseImageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className="bg-emerald-500 text-white border-0">Popular</Badge>
        </div>
      </div>
      <div className="flex flex-1">
        <div className="w-20 shrink-0 flex flex-col items-center justify-center py-4" style={{ backgroundColor: mockCourse.instructor.brand_colour }}>
          <span className="text-2xl font-bold text-white">15</span>
          <span className="text-xs font-medium text-white/80 uppercase">Apr</span>
          <div className="h-px w-8 bg-white/30 my-2" />
          <span className="text-lg font-bold text-white">{mockCourse.hours}h</span>
        </div>
        <div className="flex-1 bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{mockCourse.hours} Hour Intensive</h3>
            <Badge variant="secondary" className="text-xs"><Car className="h-3 w-3 mr-1" />Auto</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] bg-primary text-primary-foreground">SM</AvatarFallback></Avatar>
            <span className="text-sm text-muted-foreground">{mockCourse.instructor.name}</span>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{mockCourse.instructor.home_address} · {mockCourse.distance} mi</p>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <span className="text-xs line-through text-muted-foreground mr-1">£{mockCourse.totalPrice}</span>
              <span className="font-bold text-lg">£{mockCourse.finalPrice}</span>
            </div>
            <Button size="sm">Book <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variant 7: Feature Spotlight ───
function V7FeatureSpotlight() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-36 overflow-hidden">
        <img src={mockCourse.courseImageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <Badge className="w-fit bg-white/20 backdrop-blur text-white border-0 mb-1"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>
          <h3 className="text-xl font-bold text-white">{mockCourse.hours}h Course</h3>
          <p className="text-sm text-white/80">{mockCourse.instructor.name} · {mockCourse.nextDate}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {mockCourse.features.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs line-through text-muted-foreground">£{mockCourse.totalPrice}</span>
              <p className="text-xl font-bold">£{mockCourse.finalPrice}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>or £{Math.round(mockCourse.finalPrice / 4)}/mo</p>
              <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{mockCourse.distance} mi</p>
            </div>
          </div>
          <Button>Book Now</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Variant 8: iOS Card Stack ───
function V8iOSStack() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <Avatar className="h-11 w-11 border-2 border-primary/20">
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">SM</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-bold">{mockCourse.instructor.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />4.9 · {mockCourse.instructor.home_address}
          </div>
        </div>
        <Badge className="bg-emerald-500 text-white border-0">Popular</Badge>
      </div>
      <div className="relative h-40 overflow-hidden">
        <img src={mockCourse.courseImageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs"><Car className="h-3 w-3 mr-1" />Auto</Badge>
            </div>
            <span className="text-white text-sm font-medium">{mockCourse.distance} mi away</span>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{mockCourse.hours} Hour Course</h3>
            <p className="text-xs text-muted-foreground">Starting {mockCourse.nextDate}</p>
          </div>
          <div className="text-right">
            <p className="text-xs line-through text-muted-foreground">£{mockCourse.totalPrice}</p>
            <p className="text-2xl font-bold">£{mockCourse.finalPrice}</p>
            <p className="text-[10px] text-muted-foreground">from £{Math.round(mockCourse.finalPrice / 4)}/mo</p>
          </div>
        </div>
        <Button className="w-full rounded-xl">Book Now <ArrowRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </div>
  );
}

// ─── Variant 9: Dark Premium ───
function V9DarkPremium() {
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/10">
      <div className="relative h-44 overflow-hidden">
        <img src={mockCourse.courseImageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-400 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-lg">
          <Star className="h-3 w-3 fill-current" />Featured
        </div>
        <div className="absolute bottom-3 left-4 flex gap-1.5">
          <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 text-xs"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>
          <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 text-xs">Popular</Badge>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{mockCourse.hours} Hour Course</h3>
          <span className="text-xs text-zinc-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{mockCourse.distance} mi</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-amber-500/30"><AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs font-bold">SM</AvatarFallback></Avatar>
          <div>
            <p className="text-sm font-medium text-white">{mockCourse.instructor.name}</p>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />4.9 · <Car className="h-3 w-3" />Auto · {mockCourse.nextDate}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {mockCourse.features.slice(0, 3).map((f, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-zinc-300 bg-white/5 rounded-full px-2.5 py-1">
              <CheckCircle className="h-3 w-3 text-emerald-400" />{f}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div>
            <span className="text-sm line-through text-zinc-500 mr-2">£{mockCourse.totalPrice}</span>
            <span className="text-2xl font-bold text-white">£{mockCourse.finalPrice}</span>
            <p className="text-xs text-zinc-500">or from £{Math.round(mockCourse.finalPrice / 4)}/mo</p>
          </div>
          <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl">Book Now</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Variant 10: Ticket Style ───
function V10Ticket() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex">
        <div className="relative flex-1 h-auto min-h-[200px]">
          <img src={mockCourse.courseImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
        </div>
        <div className="w-[280px] shrink-0 p-5 space-y-3 relative">
          {/* Ticket perforation */}
          <div className="absolute left-0 top-0 bottom-0 w-px border-l-2 border-dashed border-border" />
          
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground border-0"><Zap className="h-3 w-3 mr-1" />Intensive</Badge>
            <Badge className="bg-emerald-500 text-white border-0">Popular</Badge>
          </div>
          
          <h3 className="text-xl font-bold">{mockCourse.hours} HOUR COURSE</h3>
          
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><User className="h-3.5 w-3.5" />{mockCourse.instructor.name}</p>
            <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{mockCourse.nextDate}</p>
            <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{mockCourse.instructor.home_address} · {mockCourse.distance} mi</p>
            <p className="flex items-center gap-2"><Car className="h-3.5 w-3.5" />Automatic · Toyota Yaris</p>
          </div>
          
          <div className="pt-2 border-t border-dashed border-border flex items-center justify-between">
            <div>
              <span className="text-xs line-through text-muted-foreground">£{mockCourse.totalPrice}</span>
              <p className="text-2xl font-bold">£{mockCourse.finalPrice}</p>
            </div>
            <Button size="sm">Book <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoCourseCards() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10 max-w-5xl">
        <div className="mb-10">
          <Badge className="mb-2">Demo</Badge>
          <h1 className="text-3xl font-black mb-2">Course Card Variants</h1>
          <p className="text-muted-foreground">10 design options for the featured courses section. All retain the same data and booking functionality.</p>
        </div>

        <div className="space-y-12">
          <div><SectionLabel number={1} title="Clean Minimal" description="Simple, modern card with clear hierarchy and full-width CTA" /><div className="max-w-sm"><V1CleanMinimal /></div></div>
          
          <div><SectionLabel number={2} title="Horizontal Card" description="Side-by-side layout, compact and scannable" /><div className="max-w-2xl"><V2HorizontalCard /></div></div>
          
          <div><SectionLabel number={3} title="Bold Gradient Footer" description="Eye-catching branded CTA bar with stat pills" /><div className="max-w-sm"><V3BoldGradient /></div></div>
          
          <div><SectionLabel number={4} title="Magazine Style" description="Editorial layout with large image bleed and bold typography" /><div className="max-w-sm"><V4Magazine /></div></div>
          
          <div><SectionLabel number={5} title="Compact Pill" description="Small footprint with pill-style metadata chips" /><div className="max-w-md"><V5CompactPill /></div></div>
          
          <div><SectionLabel number={6} title="Split Brand Color" description="Instructor brand colour date strip, event-ticket inspired" /><div className="max-w-sm"><V6SplitBrand /></div></div>
          
          <div><SectionLabel number={7} title="Feature Spotlight" description="Features grid front and centre, great for upselling course benefits" /><div className="max-w-md"><V7FeatureSpotlight /></div></div>
          
          <div><SectionLabel number={8} title="iOS Card Stack" description="Apple-style card with instructor header, image, and clean CTA" /><div className="max-w-sm"><V8iOSStack /></div></div>
          
          <div><SectionLabel number={9} title="Dark Premium" description="Dark theme with amber accents, premium/featured feel" /><div className="max-w-sm"><V9DarkPremium /></div></div>
          
          <div><SectionLabel number={10} title="Ticket Style" description="Horizontal ticket/boarding-pass layout with dashed perforation" /><div className="max-w-2xl"><V10Ticket /></div></div>
        </div>
      </div>
    </div>
  );
}
