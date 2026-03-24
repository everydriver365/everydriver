import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart, Stethoscope, SmilePlus, Eye, Brain, ShieldCheck,
  Phone, Pill, Activity, Users, Plane, Building2, Sparkles,
  Search, Scissors, HeartPulse, MessageCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EnhancedHealthModalProps {
  open: boolean;
  onClose: () => void;
  tier?: "basic" | "enhanced";
}

/* ── BASIC: Benenden Health for Business ── */
const BASIC_BENEFITS = [
  { icon: <Stethoscope className="h-4 w-4" />, title: "24/7 GP Helpline", desc: "Phone & video consultations with a UK-based GP, 24/7. Prescriptions available if clinically appropriate." },
  { icon: <Brain className="h-4 w-4" />, title: "24/7 Mental Health Helpline", desc: "Immediate emotional support for anxiety, depression, bereavement, relationships & more." },
  { icon: <Activity className="h-4 w-4" />, title: "Physiotherapy", desc: "Video or face-to-face sessions — up to 6 sessions with guided self-managed exercise programmes." },
  { icon: <Search className="h-4 w-4" />, title: "Medical Diagnostics", desc: "Private diagnosis for NHS-referred symptoms — consultations, scans & x-rays up to £2,500." },
  { icon: <Scissors className="h-4 w-4" />, title: "Surgical Treatment", desc: "Private surgical procedures from the approved list — full cost covered including surgeon, anaesthetics & aftercare." },
  { icon: <HeartPulse className="h-4 w-4" />, title: "Mental Health Support", desc: "Up to 6 structured wellbeing counselling sessions — phone, video or face-to-face with a counsellor." },
  { icon: <MessageCircle className="h-4 w-4" />, title: "Cancer Advice Service", desc: "Dedicated care team providing emotional & practical support — 9 calls plus email/messaging support." },
  { icon: <Users className="h-4 w-4" />, title: "Neurodiversity & Care Advice", desc: "Advice on ADHD, autism, disability needs, adult care, SEND process & employment rights." },
  { icon: <ShieldCheck className="h-4 w-4" />, title: "Employee Rewards & Wellbeing", desc: "Benenden Health App, Wellbeing Hub, Be Healthy magazine & exclusive retail discounts." },
];

/* ── ENHANCED: AXA Health Business Protect ── */
const ENHANCED_CORE = [
  { icon: <Stethoscope className="h-4 w-4" />, title: "AXA Doctor at Hand", desc: "24/7 phone & video GP consultations — no waiting rooms, no appointments to wait for." },
  { icon: <Phone className="h-4 w-4" />, title: "24/7 Health Support Line", desc: "Direct telephone access to AXA healthcare professionals for you and your family." },
  { icon: <Activity className="h-4 w-4" />, title: "Physio & Musculoskeletal", desc: "Direct access to physiotherapist — phone or online consultation, no GP referral needed." },
  { icon: <SmilePlus className="h-4 w-4" />, title: "Dental Cashback", desc: "Up to £400/yr back on dental treatments (80% of costs)." },
  { icon: <Eye className="h-4 w-4" />, title: "Optical Cashback", desc: "Up to £200/yr on glasses & lenses (80% of costs) plus £25/yr eye test." },
  { icon: <Brain className="h-4 w-4" />, title: "EAP Premier", desc: "24/7 phone support plus up to 8 face-to-face counselling sessions. Legal, debt & family advice." },
];

const ENHANCED_EXTRAS = [
  { icon: <Building2 className="h-4 w-4" />, title: "Private Hospital Treatment", desc: "In-patient & day-patient fees paid in full at AXA-listed private hospitals." },
  { icon: <Heart className="h-4 w-4" />, title: "Cancer Care", desc: "Full cover for cancer treatment including radiotherapy and chemotherapy at private facilities." },
  { icon: <Brain className="h-4 w-4" />, title: "Mental Health Treatment", desc: "In-patient, day-patient and out-patient mental health treatment covered." },
  { icon: <Activity className="h-4 w-4" />, title: "Enhanced Therapies", desc: "Physio, chiropractor, osteopath & acupuncture — up to 10 sessions, more on specialist referral." },
  { icon: <Pill className="h-4 w-4" />, title: "Specialist & Diagnostics", desc: "CT, MRI & PET scans paid in full. Specialist consultations and diagnostic surgery covered." },
  { icon: <Users className="h-4 w-4" />, title: "Family Cover Option", desc: "Extend cover to your family. Hospital accommodation for a parent while a child is treated." },
  
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
                {isEnhanced
                  ? "Underwritten by AXA Health · Business Protect Plan"
                  : "Provided by Benenden Health · Healthcare for Business"
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* BASIC TIER */}
          {!isEnhanced && (
            <div>
              <Badge className="mb-3 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-700 text-[10px]">
                What's Included — From Day One
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
          )}

          {/* ENHANCED TIER — core */}
          {isEnhanced && (
            <>
              <div>
                <Badge className="mb-3 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-700 text-[10px]">
                  Core Benefits — Included
                </Badge>
                <div className="grid gap-2.5">
                  {ENHANCED_CORE.map((b) => (
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
            </>
          )}

          {/* Underwriter note */}
          <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">About the cover</p>
            {isEnhanced ? (
              <p>
                Private medical insurance covers the private treatment of new acute medical conditions arising after joining.
                Cover is for treatment in the UK shown to be safe and effective by NICE.
                Pre-existing conditions, chronic/long-term conditions, and pregnancy are excluded.
              </p>
            ) : (
              <p>
                Benenden Health is a mutual society providing healthcare services on a discretionary basis (not insurance, except TB treatment).
                Services complement the NHS and require NHS practitioner referral where applicable.
                Pre-existing and long-term conditions are not covered. Diagnostics supported up to £2,500.
                870,000+ members · Rated 4.6★ on Trustpilot · 120+ years experience.
              </p>
            )}
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
