import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Circle, ChevronRight, TrendingUp, Award } from "lucide-react";

interface TrackProgressPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryColor?: string;
}

const categories = [
  {
    name: "Junctions",
    progress: 85,
    skills: [
      { name: "Approaching junctions", level: "Achieved", done: true },
      { name: "Turning left/right", level: "Achieved", done: true },
      { name: "Emerging at junctions", level: "Under Guidance", done: false },
    ],
  },
  {
    name: "Roundabouts",
    progress: 60,
    skills: [
      { name: "Mini roundabouts", level: "Achieved", done: true },
      { name: "Multi-lane roundabouts", level: "Introduced", done: false },
    ],
  },
  {
    name: "Manoeuvres",
    progress: 40,
    skills: [
      { name: "Parallel parking", level: "Under Guidance", done: false },
      { name: "Bay parking", level: "Introduced", done: false },
      { name: "Pull up on the right", level: "Achieved", done: true },
    ],
  },
];

const levelColor: Record<string, string> = {
  Achieved: "text-emerald-600 bg-emerald-50",
  "Under Guidance": "text-amber-600 bg-amber-50",
  Introduced: "text-blue-600 bg-blue-50",
};

export function TrackProgressPreviewModal({ open, onOpenChange, primaryColor = "#2563eb" }: TrackProgressPreviewModalProps) {
  const overall = 62;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>Track Progress Preview</DialogTitle>
        </DialogHeader>

        <div className="bg-background rounded-xl overflow-hidden">
          {/* Status bar */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-semibold">9:41</span>
            <div className="w-4 h-2 rounded-sm border border-muted-foreground/40 relative">
              <div className="absolute inset-[1px] right-[2px] rounded-[1px]" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>

          {/* Header */}
          <div className="px-4 pb-3" style={{ backgroundColor: primaryColor }}>
            <p className="text-white font-bold text-sm mb-0.5">Your Progress</p>
            <p className="text-white/70 text-[10px]">DVSA Driving Syllabus</p>
          </div>

          {/* Overall ring */}
          <div className="px-3 pt-3 flex items-center gap-3">
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="5" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke={primaryColor} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - overall / 100)}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{overall}%</span>
            </div>
            <div>
              <p className="text-xs font-semibold">Test Readiness</p>
              <p className="text-[10px] text-muted-foreground">17 of 27 competencies achieved</p>
              <div className="flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-[9px] text-emerald-600 font-medium">+8% this month</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="px-3 mt-3 space-y-2 max-h-[240px] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.name} className="bg-card rounded-xl border p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold">{cat.name}</p>
                  <span className="text-[10px] font-bold" style={{ color: primaryColor }}>{cat.progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full" style={{ width: `${cat.progress}%`, backgroundColor: primaryColor }} />
                </div>
                <div className="space-y-1.5">
                  {cat.skills.map((skill) => (
                    <div key={skill.name} className="flex items-center gap-2">
                      {skill.done ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="text-[10px] flex-1">{skill.name}</span>
                      <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${levelColor[skill.level] || ""}`}>
                        {skill.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Achievement badge */}
          <div className="px-3 py-3">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
              <Award className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-amber-800">Junction Master</p>
                <p className="text-[9px] text-amber-600">Unlocked — all junction skills achieved!</p>
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="border-t flex items-center justify-around py-2 bg-card">
            {[
              { icon: TrendingUp, label: "Progress", active: true },
              { icon: Award, label: "Badges", active: false },
              { icon: ChevronRight, label: "Reports", active: false },
            ].map((tab) => (
              <div key={tab.label} className="flex flex-col items-center gap-0.5">
                <tab.icon
                  className={`h-4 w-4 ${tab.active ? "" : "text-muted-foreground"}`}
                  style={tab.active ? { color: primaryColor } : {}}
                />
                <span
                  className={`text-[9px] font-medium ${tab.active ? "" : "text-muted-foreground"}`}
                  style={tab.active ? { color: primaryColor } : {}}
                >
                  {tab.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
