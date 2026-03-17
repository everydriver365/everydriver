import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, ChevronRight, ChevronLeft, Check } from "lucide-react";

interface LiveBookingPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryColor?: string;
}

export function LiveBookingPreviewModal({ open, onOpenChange, primaryColor = "#2563eb" }: LiveBookingPreviewModalProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dates = [14, 15, 16, 17, 18, 19];
  const selectedDay = 2; // Wed

  const slots = [
    { time: "09:00", duration: "2hrs", available: true },
    { time: "11:30", duration: "1.5hrs", available: true },
    { time: "14:00", duration: "2hrs", available: false },
    { time: "16:00", duration: "1.5hrs", available: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>Live Booking Preview</DialogTitle>
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
            <p className="text-white font-bold text-sm mb-0.5">Book a Lesson</p>
            <p className="text-white/70 text-[10px]">Choose a date & time that suits you</p>
          </div>

          {/* Week selector */}
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between mb-2">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold">July 2025</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {days.map((day, i) => (
                <button
                  key={day}
                  className="flex flex-col items-center py-1.5 rounded-lg transition-colors"
                  style={i === selectedDay ? { backgroundColor: primaryColor } : {}}
                >
                  <span className={`text-[9px] ${i === selectedDay ? "text-white/80" : "text-muted-foreground"}`}>{day}</span>
                  <span className={`text-xs font-bold ${i === selectedDay ? "text-white" : "text-foreground"}`}>{dates[i]}</span>
                  {i !== selectedDay && i !== 3 && (
                    <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: primaryColor }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div className="px-3 mt-3">
            <p className="text-[10px] text-muted-foreground mb-2">Available slots for Wed 16 Jul</p>
            <div className="space-y-2">
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    !slot.available ? "opacity-40 bg-muted/30" : i === 1 ? "ring-2 shadow-sm" : "bg-card"
                  }`}
                  style={i === 1 ? { borderColor: primaryColor, ringColor: primaryColor } : {}}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: slot.available ? `${primaryColor}15` : undefined }}
                    >
                      <Clock className="h-3.5 w-3.5" style={{ color: slot.available ? primaryColor : undefined }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{slot.time}</p>
                      <p className="text-[10px] text-muted-foreground">{slot.duration} lesson</p>
                    </div>
                  </div>
                  {slot.available ? (
                    i === 1 ? (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )
                  ) : (
                    <span className="text-[9px] text-muted-foreground font-medium">Booked</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="px-3 py-3 mt-1">
            <div
              className="w-full py-2.5 rounded-xl text-center text-white text-xs font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              Confirm Booking — 11:30
            </div>
          </div>

          {/* Bottom nav */}
          <div className="border-t flex items-center justify-around py-2 bg-card">
            {[
              { icon: Calendar, label: "Book", active: true },
              { icon: Clock, label: "My Lessons", active: false },
              { icon: MapPin, label: "Instructor", active: false },
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
