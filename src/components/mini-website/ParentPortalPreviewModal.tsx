import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, BookOpen, CreditCard, TrendingUp, Bell, ChevronRight, Star } from "lucide-react";

interface ParentPortalPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryColor?: string;
}

export function ParentPortalPreviewModal({ open, onOpenChange, primaryColor = "#2563eb" }: ParentPortalPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>Parent Portal Preview</DialogTitle>
        </DialogHeader>

        {/* Phone mockup frame */}
        <div className="bg-background rounded-xl overflow-hidden">
          {/* Status bar */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 rounded-sm border border-muted-foreground/40 relative">
                <div className="absolute inset-[1px] right-[2px] rounded-[1px]" style={{ backgroundColor: primaryColor }} />
              </div>
            </div>
          </div>

          {/* App header */}
          <div className="px-4 pb-3" style={{ backgroundColor: primaryColor }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white/70 text-[10px]">Welcome back</p>
                <p className="text-white font-bold text-sm">Sarah's Mum</p>
              </div>
              <div className="relative">
                <Bell className="h-5 w-5 text-white/80" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[6px] text-white font-bold">2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Child card */}
          <div className="px-3 -mt-4">
            <div className="bg-card rounded-xl shadow-md border p-3">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Sarah Thompson</p>
                  <p className="text-[10px] text-muted-foreground">with Ken D • 18 lessons completed</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Test readiness</span>
                  <span className="font-semibold" style={{ color: primaryColor }}>72%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: "72%", backgroundColor: primaryColor }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 px-3 mt-3">
            {[
              { label: "Next Lesson", value: "Tue 2pm", icon: BookOpen },
              { label: "Balance", value: "£45.00", icon: CreditCard },
              { label: "Progress", value: "72%", icon: TrendingUp },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-lg border p-2 text-center">
                <stat.icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: primaryColor }} />
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                <p className="font-bold text-xs">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div className="px-3 mt-3 pb-3">
            <p className="text-xs font-semibold mb-2">Recent Activity</p>
            <div className="space-y-2">
              {[
                { title: "Lesson Completed", subtitle: "Roundabouts & junctions", time: "Today", rating: 4 },
                { title: "Payment Received", subtitle: "£30.00 credited", time: "Yesterday", rating: null },
                { title: "Lesson Completed", subtitle: "Dual carriageways", time: "Mon", rating: 5 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {item.rating !== null ? (
                      <BookOpen className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{item.title}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                      {item.rating && (
                        <div className="flex items-center gap-0.5 ml-1">
                          {Array.from({ length: item.rating }).map((_, j) => (
                            <Star key={j} className="h-2 w-2 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="border-t flex items-center justify-around py-2 bg-card">
            {[
              { icon: Users, label: "Children", active: true },
              { icon: BookOpen, label: "Lessons", active: false },
              { icon: TrendingUp, label: "Progress", active: false },
              { icon: CreditCard, label: "Payments", active: false },
            ].map((tab) => (
              <div key={tab.label} className="flex flex-col items-center gap-0.5">
                <tab.icon
                  className="h-4 w-4"
                  style={{ color: tab.active ? primaryColor : undefined }}
                  {...(!tab.active && { className: "h-4 w-4 text-muted-foreground" })}
                />
                <span
                  className="text-[9px] font-medium"
                  style={{ color: tab.active ? primaryColor : undefined }}
                  {...(!tab.active && { className: "text-[9px] font-medium text-muted-foreground" })}
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
