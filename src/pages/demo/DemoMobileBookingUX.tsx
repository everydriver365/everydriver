import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import {
  Clock, MapPin, Car, Zap, Calendar, Star, ChevronLeft, ChevronRight,
  Check, X, ArrowRight, CreditCard, Shield, Sparkles, User, Phone, Mail,
  ChevronDown, ChevronUp, Lock, Gift, FileText, CheckCircle, Circle,
  GraduationCap, MessageSquare, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Concept 1: Compact Horizontal Course Cards ───────────────────────────────
// Current cards use a 160px image + stacked layout = ~320px per card.
// This variant uses a horizontal layout that fits 2 courses in the viewport.

const MOCK_COURSES = [
  { name: "10 Hour Course", hours: 10, price: 400, popular: true, intensive: false, next: addDays(new Date(), 3) },
  { name: "20 Hour Course", hours: 20, price: 780, popular: false, intensive: false, next: addDays(new Date(), 5) },
  { name: "30 Hour Course", hours: 30, price: 1140, popular: true, intensive: false, next: addDays(new Date(), 2) },
  { name: "Test in a Week", hours: 28, price: 1100, popular: false, intensive: true, next: addDays(new Date(), 7) },
];

const BRAND_COLOR = "#142040";

function CompactCourseCard({ course }: { course: typeof MOCK_COURSES[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border overflow-hidden bg-card active:scale-[0.98] transition-transform"
    >
      <div className="flex">
        {/* Left accent strip */}
        <div className="w-1.5 shrink-0" style={{ backgroundColor: BRAND_COLOR }} />

        <div className="flex-1 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="font-bold text-base text-foreground">{course.name}</h3>
                {course.popular && <Badge className="bg-emerald-500/90 border-0 text-white text-[9px] px-1.5 py-0">Popular</Badge>}
                {course.intensive && <Badge className="bg-amber-500/90 border-0 text-white text-[9px] px-1.5 py-0"><Zap className="h-2.5 w-2.5 mr-0.5" />Fast</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.hours}hrs</span>
                <span className="flex items-center gap-1"><Car className="h-3 w-3" />Auto</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(course.next, "d MMM")}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl font-black text-foreground">£{course.price}</span>
              <p className="text-[10px] text-muted-foreground">£{(course.price / course.hours).toFixed(0)}/hr</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: BRAND_COLOR }}>KD</div>
              <span className="text-xs text-muted-foreground">Ken D · <Star className="h-3 w-3 inline fill-amber-400 text-amber-400" /> 4.9</span>
            </div>
            <Button size="sm" className="rounded-full h-8 text-xs px-4" style={{ backgroundColor: BRAND_COLOR }}>
              Book <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Concept 2: Swipeable Week Strip Calendar ─────────────────────────────────
// Replaces the full month calendar with a horizontally scrollable week view.
// Tapping a day expands time slots inline — no separate panel needed.

function WeekStripCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ date: Date; time: string; duration: number }[]>([]);

  const startDate = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // Mock availability
  const availableDays = [1, 2, 3, 5]; // Mon, Tue, Wed, Fri
  const timeSlots = ["08:00", "09:00", "10:00", "11:30", "13:00", "14:00", "15:30", "16:00"];

  const isAvailable = (date: Date) => availableDays.includes(date.getDay());
  const isBooked = (date: Date) => bookedSlots.some(s => isSameDay(s.date, date));
  const totalBooked = bookedSlots.reduce((acc, s) => acc + s.duration, 0);

  const handleBook = (date: Date, time: string) => {
    setBookedSlots(prev => [...prev, { date, time, duration: 2 }]);
  };

  const handleRemove = (index: number) => {
    setBookedSlots(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Schedule Your Lessons</span>
          <span className="text-muted-foreground">{totalBooked}/10 hours</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: BRAND_COLOR }}
            animate={{ width: `${(totalBooked / 10) * 100}%` }}
            transition={{ type: "spring", damping: 20 }}
          />
        </div>
      </div>

      {/* Duration pills */}
      <div className="flex gap-2">
        {[1, 1.5, 2, 3].map(h => (
          <button
            key={h}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
              h === 2
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            {h}hr{h > 1 ? "s" : ""}
          </button>
        ))}
      </div>

      {/* Week strip */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground">
            {format(days[0], "d MMM")} – {format(days[6], "d MMM yyyy")}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-0">
          {days.map((day) => {
            const avail = isAvailable(day);
            const booked = isBooked(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button
                key={day.toISOString()}
                onClick={() => avail && setSelectedDay(isSelected ? null : day)}
                disabled={!avail}
                className={cn(
                  "flex flex-col items-center py-3 transition-all relative",
                  avail ? "cursor-pointer" : "opacity-30",
                  isSelected && "bg-primary/10",
                  booked && !isSelected && "bg-emerald-50 dark:bg-emerald-950/20"
                )}
              >
                <span className="text-[10px] uppercase text-muted-foreground font-medium">
                  {format(day, "EEE")}
                </span>
                <span className={cn(
                  "mt-1 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  isSelected && "text-white",
                  booked && !isSelected && "text-emerald-600 dark:text-emerald-400",
                  !isSelected && !booked && "text-foreground"
                )}
                  style={isSelected ? { backgroundColor: BRAND_COLOR } : undefined}
                >
                  {booked && !isSelected ? <Check className="h-4 w-4" /> : day.getDate()}
                </span>
                {avail && !booked && (
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Inline time slots */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="overflow-hidden border-t"
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground">{format(selectedDay, "EEEE, d MMMM")}</span>
                  <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {timeSlots.map(time => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      onClick={() => handleBook(selectedDay, time)}
                      className="text-xs h-11 min-h-[44px] active:scale-95 transition-transform touch-manipulation font-medium"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booked slots as chips */}
      {bookedSlots.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {bookedSlots.map((slot, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="pl-2.5 pr-1 py-1.5 text-xs gap-1.5 cursor-pointer hover:bg-destructive/10 transition-colors"
              onClick={() => handleRemove(i)}
            >
              {format(slot.date, "EEE d")} · {slot.time} · {slot.duration}hr
              <X className="h-3 w-3 text-muted-foreground" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Concept 3: Sticky Booking Summary Bar ────────────────────────────────────
// A thumb-zone bottom bar that summarises the booking and shows the next action.

function StickyBookingBar() {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-bottom"
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">10 Hour Course</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>4/10 hrs scheduled</span>
            <span>·</span>
            <span className="font-semibold text-foreground">£400</span>
          </div>
        </div>
        <Button className="rounded-full h-11 px-6 font-bold shadow-lg" style={{ backgroundColor: BRAND_COLOR }}>
          Continue
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Concept 4: Swipeable Carousel Course Cards ──────────────────────────────
// Horizontal scroll snap for quick browsing on mobile.

function CarouselCourseCards() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {MOCK_COURSES.map((course, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="snap-start shrink-0 w-[280px]"
          >
            <div className="rounded-2xl border border-border overflow-hidden bg-card h-full">
              {/* Colored header */}
              <div className="p-4 text-white" style={{ backgroundColor: BRAND_COLOR }}>
                <div className="flex items-center gap-1.5 mb-1">
                  {course.popular && <Badge className="bg-white/20 border-0 text-white text-[9px]">⭐ Popular</Badge>}
                  {course.intensive && <Badge className="bg-amber-400/20 border-0 text-amber-200 text-[9px]"><Zap className="h-2.5 w-2.5 mr-0.5" />Intensive</Badge>}
                </div>
                <h3 className="text-lg font-black">{course.name}</h3>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black">£{course.price}</span>
                  <span className="text-xs text-white/60">£{(course.price / course.hours).toFixed(0)}/hr</span>
                </div>
              </div>

              <div className="p-3.5 space-y-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.hours} hours</span>
                  <span className="flex items-center gap-1"><Car className="h-3 w-3" />Automatic</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Winchester</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(course.next, "d MMM")}</span>
                </div>
                <Button className="w-full rounded-xl h-11 font-bold" style={{ backgroundColor: BRAND_COLOR }}>
                  Book Now
                </Button>
                <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Shield className="h-3 w-3" />Money-back</span>
                  <span className="flex items-center gap-0.5"><CreditCard className="h-3 w-3" />Pay in 3</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Scroll indicator dots */}
      <div className="flex justify-center gap-1.5">
        {MOCK_COURSES.map((_, i) => (
          <div key={i} className={cn("h-1.5 rounded-full transition-all", i === 0 ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30")} />
        ))}
      </div>
    </div>
  );
}

// ─── Concept 5: Quick-Tap Time Grid ──────────────────────────────────────────
// Larger touch targets grouped by morning/afternoon with visual distinction.

function QuickTapTimeGrid() {
  const [selected, setSelected] = useState<string | null>(null);
  const morning = ["07:00", "08:00", "09:00", "10:00", "11:00"];
  const afternoon = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-foreground">Pick a Time — Wed, 19 Mar</h4>
        <Badge variant="outline" className="text-xs">2hr lesson</Badge>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">☀️ Morning</p>
          <div className="grid grid-cols-5 gap-1.5">
            {morning.map(t => (
              <button
                key={t}
                onClick={() => setSelected(selected === t ? null : t)}
                className={cn(
                  "h-12 rounded-xl text-sm font-semibold transition-all active:scale-95 touch-manipulation",
                  selected === t
                    ? "text-white shadow-md"
                    : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                )}
                style={selected === t ? { backgroundColor: BRAND_COLOR } : undefined}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">🌤️ Afternoon</p>
          <div className="grid grid-cols-5 gap-1.5">
            {afternoon.map(t => (
              <button
                key={t}
                onClick={() => setSelected(selected === t ? null : t)}
                className={cn(
                  "h-12 rounded-xl text-sm font-semibold transition-all active:scale-95 touch-manipulation",
                  selected === t
                    ? "text-white shadow-md"
                    : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                )}
                style={selected === t ? { backgroundColor: BRAND_COLOR } : undefined}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20"
        >
          <div className="text-sm">
            <span className="font-semibold text-foreground">{selected} – {parseInt(selected) + 2}:00</span>
            <span className="text-muted-foreground ml-1.5">· 2 hours</span>
          </div>
          <Button size="sm" className="rounded-full h-8" style={{ backgroundColor: BRAND_COLOR }}>
            <Check className="h-3 w-3 mr-1" /> Confirm
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Demo Page ───────────────────────────────────────────────────────────────

export default function DemoMobileBookingUX() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Mobile Booking UX Concepts</h1>
        <p className="text-xs text-muted-foreground">Tap and interact with each concept</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-10 pb-32">

        {/* Concept 1 */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: BRAND_COLOR }}>1</span>
              Compact Course Cards
            </h2>
            <p className="text-xs text-muted-foreground mt-1">No image — just the essential info. Two cards fit per screen vs one with current layout.</p>
          </div>
          <div className="space-y-2.5">
            {MOCK_COURSES.map((c, i) => <CompactCourseCard key={i} course={c} />)}
          </div>
        </section>

        {/* Concept 2 */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: BRAND_COLOR }}>2</span>
              Swipeable Carousel Cards
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Horizontal scroll-snap for quick browsing without vertical scrolling.</p>
          </div>
          <CarouselCourseCards />
        </section>

        {/* Concept 3 */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: BRAND_COLOR }}>3</span>
              Week Strip Calendar
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Replaces full-month calendar. Shows one week at a time with inline time picker. Tap a day → times appear below.</p>
          </div>
          <WeekStripCalendar />
        </section>

        {/* Concept 4 */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: BRAND_COLOR }}>4</span>
              Quick-Tap Time Grid
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Bigger 48px touch targets, grouped by morning/afternoon with colour distinction. Instant confirmation inline.</p>
          </div>
          <QuickTapTimeGrid />
        </section>

        {/* Concept 5 */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: BRAND_COLOR }}>5</span>
              Sticky Bottom Booking Bar
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Always-visible summary in the thumb zone. Shows progress, price, and next action.</p>
          </div>
          <Card className="border-2 border-dashed border-muted-foreground/30">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              👇 See the sticky bar fixed at the bottom of this page
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Sticky bar demo */}
      <StickyBookingBar />
    </div>
  );
}
