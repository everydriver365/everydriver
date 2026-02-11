import { motion } from "framer-motion";
import scheduleIcon from "@/assets/calendar-icon.png";
import pupilsIcon from "@/assets/pupils-icon.png";
import messagesIcon from "@/assets/messages-icon.png";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import trackIcon from "@/assets/track-icon.png";
import takePaymentIcon from "@/assets/take-payment-icon.png";
import satnavIcon from "@/assets/satnav-icon.png";
import findMyCarIcon from "@/assets/find_car2.png";
import { ChevronRight } from "lucide-react";

const sampleTiles = [
  { id: "schedule", title: "Schedule", icon: scheduleIcon },
  { id: "pupils", title: "Pupils", icon: pupilsIcon },
  { id: "jobs", title: "Job Offers", icon: jobOffersIcon, badge: 3 },
  { id: "messages", title: "Messages", icon: messagesIcon, badge: 1 },
  { id: "track-lesson", title: "Track Lesson", icon: trackIcon },
  { id: "take-payment", title: "Take Payment", icon: takePaymentIcon },
  { id: "satnav", title: "Sat Nav", icon: satnavIcon },
  { id: "find-my-car", title: "Find My Car", icon: findMyCarIcon },
];

function PhoneFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <div className="w-[320px] bg-background border-2 border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-primary text-primary-foreground text-center py-2 text-xs font-semibold">
          Quick Actions
        </div>
        <div className="p-3 space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Option A: Subtle Bottom Border Gradient ──
function OptionA() {
  return (
    <PhoneFrame title="A) Subtle Bottom Border">
      {/* First tile full width */}
      <div className="relative overflow-hidden bg-white rounded-none p-3 shadow-[0_2px_12px_rgba(20,37,66,0.12)]">
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[7px] overflow-hidden shrink-0">
            <img src={sampleTiles[0].icon} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-foreground text-base">{sampleTiles[0].title}</span>
            <p className="text-muted-foreground text-xs">3 lessons today</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {sampleTiles.slice(1).map((tile) => (
          <div key={tile.id} className="relative overflow-hidden bg-white rounded-none px-3 py-2.5 flex items-center gap-2.5 shadow-[0_2px_12px_rgba(20,37,66,0.12)]">
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 to-primary/10" />
            <div className="w-10 h-10 rounded-[7px] overflow-hidden shrink-0">
              <img src={tile.icon} alt="" className="w-full h-full object-cover" />
            </div>
            {tile.badge && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{tile.badge}</span>
            )}
            <span className="font-medium text-foreground text-sm">{tile.title}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

// ── Option B: Left Accent Bar ──
function OptionB() {
  return (
    <PhoneFrame title="B) Left Accent Bar">
      <div className="relative overflow-hidden bg-white rounded-none p-3 shadow-[0_2px_12px_rgba(20,37,66,0.12)]">
        <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-primary/40" />
        <div className="flex items-center gap-3 pl-1">
          <div className="w-12 h-12 rounded-[7px] overflow-hidden shrink-0">
            <img src={sampleTiles[0].icon} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-foreground text-base">{sampleTiles[0].title}</span>
            <p className="text-muted-foreground text-xs">3 lessons today</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {sampleTiles.slice(1).map((tile) => (
          <div key={tile.id} className="relative overflow-hidden bg-white rounded-none px-3 py-2.5 flex items-center gap-2.5 shadow-[0_2px_12px_rgba(20,37,66,0.12)]">
            <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-primary/30" />
            <div className="w-10 h-10 rounded-[7px] overflow-hidden shrink-0 ml-1">
              <img src={tile.icon} alt="" className="w-full h-full object-cover" />
            </div>
            {tile.badge && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{tile.badge}</span>
            )}
            <span className="font-medium text-foreground text-sm">{tile.title}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

// ── Option C: Gradient Background Wash ──
function OptionC() {
  return (
    <PhoneFrame title="C) Gradient Background Wash">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] rounded-none p-3 shadow-[0_2px_12px_rgba(20,37,66,0.12)] border border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[7px] overflow-hidden shrink-0 ring-2 ring-primary/20">
            <img src={sampleTiles[0].icon} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-foreground text-base">{sampleTiles[0].title}</span>
            <p className="text-muted-foreground text-xs">3 lessons today</p>
          </div>
          <ChevronRight className="h-4 w-4 text-primary/60" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {sampleTiles.slice(1).map((tile) => (
          <div key={tile.id} className="relative overflow-hidden bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] rounded-none px-3 py-2.5 flex items-center gap-2.5 shadow-[0_2px_12px_rgba(20,37,66,0.12)] border border-primary/10">
            <div className="w-10 h-10 rounded-[7px] overflow-hidden shrink-0 ring-1 ring-primary/15">
              <img src={tile.icon} alt="" className="w-full h-full object-cover" />
            </div>
            {tile.badge && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{tile.badge}</span>
            )}
            <span className="font-medium text-foreground text-sm">{tile.title}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

// ── Option D: Full Gradient Header Strip ──
function OptionD() {
  return (
    <PhoneFrame title="D) Gradient Header Strip">
      <div className="relative overflow-hidden bg-white rounded-none shadow-[0_2px_12px_rgba(20,37,66,0.12)]">
        <div className="bg-gradient-to-r from-primary to-primary/70 px-3 py-1.5">
          <span className="text-white text-[10px] font-semibold uppercase tracking-wider">Top Action</span>
        </div>
        <div className="p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-[7px] overflow-hidden shrink-0">
            <img src={sampleTiles[0].icon} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-foreground text-base">{sampleTiles[0].title}</span>
            <p className="text-muted-foreground text-xs">3 lessons today</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {sampleTiles.slice(1).map((tile) => (
          <div key={tile.id} className="relative overflow-hidden bg-white rounded-none shadow-[0_2px_12px_rgba(20,37,66,0.12)]">
            <div className="bg-gradient-to-r from-primary/80 to-primary/40 h-[3px]" />
            <div className="px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-[7px] overflow-hidden shrink-0">
                <img src={tile.icon} alt="" className="w-full h-full object-cover" />
              </div>
              {tile.badge && (
                <span className="absolute top-3 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{tile.badge}</span>
              )}
              <span className="font-medium text-foreground text-sm">{tile.title}</span>
            </div>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

// ── Option E: Icon Glow Ring ──
function OptionE() {
  return (
    <PhoneFrame title="E) Icon Glow Ring + Tint">
      <div className="relative overflow-hidden bg-white rounded-none p-3 shadow-[0_2px_12px_rgba(20,37,66,0.12)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[7px] overflow-hidden shrink-0 ring-2 ring-primary/40 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
            <img src={sampleTiles[0].icon} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-foreground text-base">{sampleTiles[0].title}</span>
            <p className="text-primary/70 text-xs font-medium">3 lessons today</p>
          </div>
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <ChevronRight className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {sampleTiles.slice(1).map((tile) => (
          <div key={tile.id} className="relative overflow-hidden bg-white rounded-none px-3 py-2.5 flex items-center gap-2.5 shadow-[0_2px_12px_rgba(20,37,66,0.12)]">
            <div className="w-10 h-10 rounded-[7px] overflow-hidden shrink-0 ring-1 ring-primary/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
              <img src={tile.icon} alt="" className="w-full h-full object-cover" />
            </div>
            {tile.badge && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{tile.badge}</span>
            )}
            <span className="font-medium text-foreground text-sm">{tile.title}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

// ── Option F: Diagonal Corner Gradient ──
function OptionF() {
  return (
    <PhoneFrame title="F) Corner Gradient Splash">
      <div className="relative overflow-hidden bg-white rounded-none p-3 shadow-[0_2px_12px_rgba(20,37,66,0.12)]">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/15 to-transparent" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-[7px] overflow-hidden shrink-0">
            <img src={sampleTiles[0].icon} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-foreground text-base">{sampleTiles[0].title}</span>
            <p className="text-muted-foreground text-xs">3 lessons today</p>
          </div>
          <ChevronRight className="h-4 w-4 text-primary/50" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {sampleTiles.slice(1).map((tile) => (
          <div key={tile.id} className="relative overflow-hidden bg-white rounded-none px-3 py-2.5 flex items-center gap-2.5 shadow-[0_2px_12px_rgba(20,37,66,0.12)]">
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-primary/10 to-transparent" />
            <div className="w-10 h-10 rounded-[7px] overflow-hidden shrink-0 relative">
              <img src={tile.icon} alt="" className="w-full h-full object-cover" />
            </div>
            {tile.badge && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{tile.badge}</span>
            )}
            <span className="font-medium text-foreground text-sm relative">{tile.title}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

export default function QuickActionGradientDemo() {
  return (
    <div className="min-h-screen bg-muted/30 p-4 pb-20">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-xl font-bold mb-1">Quick Action Tiles — Blue Gradient Options</h1>
        <p className="text-sm text-muted-foreground mb-6">
          6 variations of subtle blue gradient applied to quick action tiles. Pick your favourite.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <OptionA />
          <OptionB />
          <OptionC />
          <OptionD />
          <OptionE />
          <OptionF />
        </div>
      </div>
    </div>
  );
}
