import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart, Stethoscope, SmilePlus, Eye, Brain, ShieldCheck,
  Phone, Pill, Activity, Users, Plane, Building2, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EnhancedHealthModalProps {
  open: boolean;
  onClose: () => void;
  tier?: "basic" | "enhanced";
}

const BASIC_BENEFITS = [
  { icon: <Stethoscope className="h-4 w-4" />, title: "24/7 GP Access", desc: "Phone & video consultations with AXA Doctor at Hand — day or night, no waiting rooms." },
  { icon: <SmilePlus className="h-4 w-4" />, title: "Dental Cashback", desc: "Up to £400/yr back on dental treatments (80% of costs)." },
  { icon: <Eye className="h-4 w-4" />, title: "Optical Cashback", desc: "Up to £200/yr on glasses & lenses (80% of costs) plus £25/yr eye test." },
  { icon: <Activity className="h-4 w-4" />, title: "Physio & Musculoskeletal", desc: "Direct access to physiotherapist consultations — no GP referral needed." },
  { icon: <Phone className="h-4 w-4" />, title: "24/7 Health Support Line", desc: "Direct telephone access to healthcare professionals for you and your family." },
  { icon: <Brain className="h-4 w-4" />, title: "EAP Support", desc: "24/7 phone support for psychological issues plus legal, debt & family advice." },
];

const ENHANCED_EXTRAS = [
  { icon: <Building2 className="h-4 w-4" />, title: "Private Hospital Treatment", desc: "In-patient & day-patient fees paid in full at AXA-listed private hospitals. No NHS waiting." },
  { icon: <Heart className="h-4 w-4" />, title: "Cancer Care & Treatment", desc: "Full cover for cancer treatment including radiotherapy and chemotherapy at private facilities." },
  { icon: <Brain className="h-4 w-4" />, title: "Mental Health Treatment", desc: "In-patient, day-patient and out-patient mental health treatment plus 8 face-to-face counselling sessions." },
  { icon: <Activity className="h-4 w-4" />, title: "Enhanced Therapies", desc: "Physio, chiropractor, osteopath & acupuncture — up to 10 sessions, more on specialist referral." },
  { icon: <Pill className="h-4 w-4" />, title: "Specialist & Diagnostics", desc: "CT, MRI & PET scans paid in full. Specialist consultations and diagnostic surgery covered." },
  { icon: <Users className="h-4 w-4" />, title: "Family Cover Option", desc: "Extend cover to your family. Hospital accommodation for a parent while a child is treated." },
  { icon: <Plane className="h-4 w-4" />, title: "Worldwide Travel Insurance", desc: "Up to £5M medical cover, baggage protection, cancellation cover & emergency repatriation." },
  { icon: <ShieldCheck className="h-4 w-4" />, title: "Hospital Cash Benefit", desc: "Up to £100/night for a relative to stay nearby during your treatment." },
];

export function EnhancedHealthModal({ open, onClose, tier = "enhanced" }: EnhancedHealthModalProps) {
  const navigate = useNavigate();
  const isEnhanced = tier === "enhanced";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEnhanced ? "Enhanced Health + Cancer Care" : "Basic Health Cover"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Underwritten by AXA Health · Business Protect Plan
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic benefits — shown for both tiers */}
          <div>
            <Badge className="mb-3 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-700 text-[10px]">
              {isEnhanced ? "Core Benefits — Included" : "What's Included"}
            </Badge>
            <div className="grid gap-2.5">
              {BASIC_BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-3 p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <div className="h-8 w-8 rounded-md bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    {b.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{b.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced extras — only for enhanced tier */}
          {isEnhanced && (
            <div>
              <Badge className="mb-3 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700 text-[10px]">
                <Sparkles className="h-3 w-3 mr-1" /> Enhanced — Dashcam Plan Exclusive
              </Badge>
              <div className="grid gap-2.5">
                {ENHANCED_EXTRAS.map((b) => (
                  <div key={b.title} className="flex gap-3 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                    <div className="h-8 w-8 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      {b.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Underwriter note */}
          <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">About the cover</p>
            <p>
              Private medical insurance covers the private treatment of new acute medical conditions arising after joining.
              Cover is for treatment in the UK shown to be safe and effective by NICE.
              Pre-existing conditions, chronic/long-term conditions, and pregnancy are excluded.
              {isEnhanced && " Travel cover applies to trips up to 65 days worldwide."}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => { onClose(); navigate("/instructor-app/signup"); }}
            >
              <Heart className="h-4 w-4 mr-2" />
              {isEnhanced ? "Get Dashcam + Health" : "Get GPS + Health"}
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
