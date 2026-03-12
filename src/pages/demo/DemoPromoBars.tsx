import { motion } from "framer-motion";
import { Sparkles, CreditCard, Gift, Clock, Star, ChevronRight, Zap, Shield, Phone, ArrowRight, Tag, Percent, Crown, X } from "lucide-react";
import { useState } from "react";

const promos = {
  offer: "🌟 Special Offer: 10% off your first lesson",
  klarna: "💳 Pay in instalments with Klarna",
  phone: "07506 782870",
};

// Variant 1: Gradient Marquee
function Variant1() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#1e3a5f] via-[#2a5a8f] to-[#1e3a5f] py-2.5 px-4">
      <motion.div
        className="flex items-center gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-12">
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Special Offer: 10% off your first lesson
            </span>
            <span className="text-amber-300/50">✦</span>
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <CreditCard className="h-4 w-4 text-amber-300" />
              Pay in instalments with Klarna
            </span>
            <span className="text-amber-300/50">✦</span>
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <Phone className="h-4 w-4 text-amber-300" />
              Call us: {promos.phone}
            </span>
            <span className="text-amber-300/50">✦</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Variant 2: Bold Split with CTA
function Variant2() {
  return (
    <div className="bg-[#1e3a5f] py-2.5 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Tag className="h-4 w-4 text-emerald-400" />
            10% OFF First Lesson
          </span>
          <span className="hidden md:flex items-center gap-2 text-sm text-white/80">
            <CreditCard className="h-4 w-4" />
            Klarna & Clearpay available
          </span>
        </div>
        <a href="tel:07506782870" className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors">
          Book Now <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

// Variant 3: Warm Amber Accent
function Variant3() {
  return (
    <div className="bg-gradient-to-r from-[#d4a574] to-[#c8893a] py-2.5 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 md:gap-8">
        <span className="flex items-center gap-2 text-sm font-bold text-white drop-shadow">
          <Gift className="h-4 w-4" />
          10% off your first lesson
        </span>
        <span className="w-px h-4 bg-white/30 hidden md:block" />
        <span className="hidden md:flex items-center gap-2 text-sm font-medium text-white/90">
          <CreditCard className="h-4 w-4" />
          Flexible payments with Klarna
        </span>
        <span className="w-px h-4 bg-white/30 hidden md:block" />
        <span className="hidden lg:flex items-center gap-2 text-sm font-medium text-white/90">
          <Shield className="h-4 w-4" />
          Earlier test guaranteed
        </span>
      </div>
    </div>
  );
}

// Variant 4: Pill Badges
function Variant4() {
  return (
    <div className="bg-[#f0f7fc] border-b border-[#d0e3f0] py-2.5 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs font-bold px-3 py-1 rounded-full">
          <Percent className="h-3 w-3" /> 10% OFF
        </span>
        <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          <CreditCard className="h-3 w-3" /> Klarna
        </span>
        <span className="inline-flex items-center gap-1.5 bg-[#d4a574] text-white text-xs font-bold px-3 py-1 rounded-full">
          <Shield className="h-3 w-3" /> Test Guarantee
        </span>
        <span className="hidden md:inline-flex items-center gap-1.5 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          <Star className="h-3 w-3" /> 5★ Rated
        </span>
        <span className="hidden md:inline-flex items-center gap-1.5 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          <Clock className="h-3 w-3" /> Limited Spots
        </span>
      </div>
    </div>
  );
}

// Variant 5: Countdown Urgency
function Variant5() {
  return (
    <div className="bg-gradient-to-r from-rose-600 to-orange-500 py-2.5 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-4">
        <Zap className="h-4 w-4 text-yellow-200 animate-pulse" />
        <span className="text-sm font-bold text-white">
          FLASH SALE: 10% off — Ends in
        </span>
        <div className="flex items-center gap-1">
          {["02", "14", "37"].map((val, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="bg-black/30 text-white text-xs font-mono font-bold px-1.5 py-0.5 rounded">
                {val}
              </span>
              {i < 2 && <span className="text-white/60 text-xs">:</span>}
            </span>
          ))}
        </div>
        <span className="hidden md:inline text-sm text-white/80 font-medium">
          Use code: <span className="font-bold text-yellow-200">FIRST10</span>
        </span>
      </div>
    </div>
  );
}

// Variant 6: Glassmorphic
function Variant6() {
  return (
    <div className="relative bg-[#1e3a5f]/90 backdrop-blur-md py-3 px-4 border-b border-white/10">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-6">
        <motion.div
          className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1"
          whileHover={{ scale: 1.05 }}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-sm font-medium text-white">10% off first lesson</span>
        </motion.div>
        <motion.div
          className="hidden md:flex items-center gap-2 bg-white/10 rounded-full px-4 py-1"
          whileHover={{ scale: 1.05 }}
        >
          <CreditCard className="h-3.5 w-3.5 text-emerald-300" />
          <span className="text-sm font-medium text-white">Klarna available</span>
        </motion.div>
        <motion.div
          className="hidden lg:flex items-center gap-2 bg-white/10 rounded-full px-4 py-1"
          whileHover={{ scale: 1.05 }}
        >
          <Phone className="h-3.5 w-3.5 text-sky-300" />
          <span className="text-sm font-medium text-white">{promos.phone}</span>
        </motion.div>
      </div>
    </div>
  );
}

// Variant 7: Minimal Underline
function Variant7() {
  return (
    <div className="bg-white border-b-2 border-[#1e3a5f] py-2 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-8 text-sm">
        <span className="font-semibold text-[#1e3a5f]">
          ✨ 10% off your first lesson
        </span>
        <span className="hidden md:inline text-gray-400">|</span>
        <span className="hidden md:inline text-gray-600">
          💳 Pay with Klarna & Clearpay
        </span>
        <span className="hidden lg:inline text-gray-400">|</span>
        <a href="tel:07506782870" className="hidden lg:inline text-[#1e3a5f] font-semibold hover:underline">
          📞 {promos.phone}
        </a>
      </div>
    </div>
  );
}

// Variant 8: Neon Glow
function Variant8() {
  return (
    <div className="bg-gray-950 py-2.5 px-4 border-b border-emerald-500/20">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-6">
        <span className="flex items-center gap-2 text-sm font-bold text-emerald-400" style={{ textShadow: '0 0 10px rgba(52,211,153,0.5)' }}>
          <Zap className="h-4 w-4" />
          10% OFF
        </span>
        <span className="text-gray-600">•</span>
        <span className="text-sm text-gray-300 font-medium">
          First lesson discount
        </span>
        <span className="hidden md:inline text-gray-600">•</span>
        <span className="hidden md:flex items-center gap-2 text-sm text-gray-300 font-medium">
          <CreditCard className="h-4 w-4 text-purple-400" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.5))' }} />
          Klarna & Clearpay
        </span>
        <span className="hidden lg:inline text-gray-600">•</span>
        <span className="hidden lg:flex items-center gap-1.5 text-sm text-amber-400 font-bold" style={{ textShadow: '0 0 10px rgba(251,191,36,0.4)' }}>
          <Crown className="h-4 w-4" />
          5★ Instructor
        </span>
      </div>
    </div>
  );
}

// Variant 9: Dismissible Banner with Icon
function Variant9() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2e5a8f] py-3 px-4 relative">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
        <div className="bg-amber-400 rounded-full p-1">
          <Gift className="h-4 w-4 text-[#1e3a5f]" />
        </div>
        <p className="text-sm text-white font-medium">
          <span className="font-bold">New Student Offer:</span> Get 10% off your first lesson + free theory test access
        </p>
        <a href="tel:07506782870" className="hidden md:inline-flex items-center gap-1 bg-white text-[#1e3a5f] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors ml-2">
          Call Now <ChevronRight className="h-3 w-3" />
        </a>
      </div>
      <button onClick={() => setVisible(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Variant 10: Stacked Mobile-First
function Variant10() {
  return (
    <div className="bg-[#1e3a5f] py-2 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 md:gap-6">
          <div className="flex items-center gap-1.5">
            <div className="bg-emerald-500 rounded px-1.5 py-0.5">
              <span className="text-[10px] font-bold text-white tracking-wider">SAVE</span>
            </div>
            <span className="text-xs md:text-sm font-semibold text-white">10% off</span>
          </div>
          <div className="w-px h-3.5 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <div className="bg-[#ffb3c7] rounded px-1.5 py-0.5">
              <span className="text-[10px] font-bold text-black tracking-wider">KLARNA</span>
            </div>
            <span className="hidden md:inline text-xs md:text-sm text-white/80">Split payments</span>
          </div>
          <div className="w-px h-3.5 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <div className="bg-amber-400 rounded px-1.5 py-0.5">
              <span className="text-[10px] font-bold text-black tracking-wider">ETG</span>
            </div>
            <span className="hidden md:inline text-xs md:text-sm text-white/80">Earlier test</span>
          </div>
          <div className="hidden lg:block w-px h-3.5 bg-white/20" />
          <a href="tel:07506782870" className="hidden lg:flex items-center gap-1 text-xs text-amber-300 font-semibold hover:text-amber-200">
            <Phone className="h-3 w-3" />
            {promos.phone}
          </a>
        </div>
      </div>
    </div>
  );
}

const variants = [
  { name: "Gradient Marquee", desc: "Scrolling text with amber accents on navy gradient", component: Variant1 },
  { name: "Bold Split + CTA", desc: "Navy bar with green Book Now button", component: Variant2 },
  { name: "Warm Amber", desc: "Complementary amber gradient with white text", component: Variant3 },
  { name: "Pill Badges", desc: "Colorful pill badges on light background", component: Variant4 },
  { name: "Countdown Urgency", desc: "Red-orange gradient with countdown timer", component: Variant5 },
  { name: "Glassmorphic", desc: "Frosted glass pills on dark overlay", component: Variant6 },
  { name: "Minimal Underline", desc: "Clean white bar with navy underline", component: Variant7 },
  { name: "Neon Glow", desc: "Dark mode with glowing accent colors", component: Variant8 },
  { name: "Dismissible Banner", desc: "Navy gradient with dismiss button and CTA", component: Variant9 },
  { name: "Badge Labels", desc: "Compact labeled badges with dividers", component: Variant10 },
];

export default function DemoPromoBars() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Promotion Bar Variants</h1>
        <p className="text-gray-500 mb-10">10 designs for the Ken D mini-website announcement bar. Pick your favourite.</p>
        <div className="space-y-10">
          {variants.map((v, i) => {
            const Comp = v.component;
            return (
              <div key={i}>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-xs font-bold text-gray-400 bg-gray-200 rounded-full px-2.5 py-0.5">{i + 1}</span>
                  <h2 className="text-lg font-semibold text-gray-800">{v.name}</h2>
                  <span className="text-sm text-gray-400">{v.desc}</span>
                </div>
                <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
                  <Comp />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
