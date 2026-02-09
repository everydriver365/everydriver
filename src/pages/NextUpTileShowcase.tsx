import { useState } from "react";
import { format, addMinutes } from "date-fns";
import { Clock, Phone, MessageSquare, X, Navigation, Car, Mail, Check, CreditCard, CalendarClock, User, MapPin, Timer, ChevronDown, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PupilAvatar } from "@/components/instructor/PupilAvatar";
import { PaymentStatusBadge } from "@/components/instructor/PaymentStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Shared mock data
const mock = {
  pupilName: "Sarah Johnson",
  pickupPostcode: "SW1A 1AA",
  pickupLocation: "23 Victoria Road",
  startTime: "2:30 PM",
  dateLabel: "Today",
  countdown: "in 42 min",
  balance: 120,
  durationLabel: "2h",
  etaText: "25 min",
  etaTime: format(addMinutes(new Date(), 25), "HH:mm"),
  unreadCount: 2,
};

// ─── OPTION A: Compact Command Centre ──────────────────────────
function OptionA() {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-2xl bg-card border border-border shadow-[0_2px_12px_rgba(20,37,66,0.08)] overflow-hidden">
        {/* Slim map banner with floating countdown */}
        <div className="relative h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <MapPin className="h-16 w-16 text-primary" />
          </div>
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200/60 text-xs font-bold text-amber-700 dark:text-amber-300 animate-pulse shadow-sm">
              <Timer className="h-3 w-3" /> {mock.countdown}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
            <PupilAvatar name={mock.pupilName} size="lg" />
            <div>
              <p className="font-bold text-foreground text-base">{mock.pupilName}</p>
              <p className="text-xs text-muted-foreground">{mock.pickupLocation}, {mock.pickupPostcode}</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Info row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10 text-xs font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" /> {mock.dateLabel} · {mock.startTime}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              {mock.durationLabel} lesson
            </span>
            <PaymentStatusBadge balance={mock.balance} size="md" className="rounded-none" />
          </div>

          {/* ETA */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mb-3">
            <Car className="h-3.5 w-3.5" />
            ETA {mock.etaTime} ({mock.etaText})
          </div>

          {/* Unread */}
          {mock.unreadCount > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 border border-destructive/20">
              <Mail className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">
                {mock.unreadCount} unread messages from Sarah
              </span>
            </div>
          )}

          {/* Icon-only circle actions */}
          <div className="flex items-center justify-between gap-2">
            <Button size="sm" className="flex-1 rounded-xl gap-1.5">
              <Navigation className="h-4 w-4" /> Navigate
            </Button>
            <Button size="icon" variant="outline" className="rounded-full h-10 w-10 shrink-0">
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="rounded-full h-10 w-10 shrink-0">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="rounded-full h-10 w-10 shrink-0">
              <Check className="h-4 w-4 text-emerald-600" />
            </Button>
          </div>

          {/* Expand */}
          <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-center gap-1 pt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <span>{expanded ? "Less" : "More actions"}</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown className="h-3.5 w-3.5" /></motion.div>
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border mt-2">
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><User className="h-3.5 w-3.5" /> Pupil</Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Schedule</Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-destructive hover:text-destructive"><X className="h-3.5 w-3.5" /> Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── OPTION B: Split Card ──────────────────────────────────────
function OptionB() {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-2xl bg-card border border-border shadow-[0_2px_12px_rgba(20,37,66,0.08)] overflow-hidden">
        <div className="flex">
          {/* Left accent panel */}
          <div className="w-[110px] bg-gradient-to-b from-primary to-primary/80 flex flex-col items-center justify-center py-5 px-2 gap-2">
            <PupilAvatar name={mock.pupilName} size="lg" className="ring-2 ring-white/30" />
            <p className="text-xs font-bold text-primary-foreground text-center leading-tight">{mock.pupilName}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-primary-foreground animate-pulse">
              <Timer className="h-3 w-3" /> {mock.countdown}
            </span>
          </div>

          {/* Right content */}
          <div className="flex-1 p-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Clock className="h-4 w-4 text-primary" /> {mock.dateLabel} · {mock.startTime}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {mock.pickupLocation}, {mock.pickupPostcode}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  {mock.durationLabel}
                </span>
                <PaymentStatusBadge balance={mock.balance} size="sm" className="rounded-none" />
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <Car className="h-3 w-3" /> ETA {mock.etaTime}
                </span>
              </div>
            </div>

            {/* Unread */}
            {mock.unreadCount > 0 && (
              <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-destructive/10 px-2.5 py-1.5 border border-destructive/20">
                <Mail className="h-3.5 w-3.5 text-destructive" />
                <span className="text-[11px] font-medium text-destructive">{mock.unreadCount} unread</span>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              <Button size="sm" className="rounded-xl gap-1 text-xs col-span-2"><Navigation className="h-3.5 w-3.5" /> Navigate</Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs"><Phone className="h-3 w-3" /> Call</Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs"><Check className="h-3 w-3 text-emerald-600" /> On Way</Button>
            </div>
          </div>
        </div>

        {/* Expand */}
        <div className="px-4 pb-3">
          <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <span>{expanded ? "Less" : "More"}</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown className="h-3.5 w-3.5" /></motion.div>
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border mt-2">
                  <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs"><User className="h-3 w-3" /> Pupil</Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs"><CalendarClock className="h-3 w-3" /> Schedule</Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs text-destructive"><X className="h-3 w-3" /> Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── OPTION C: Ticket Style ────────────────────────────────────
function OptionC() {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-2xl bg-card border border-border shadow-[0_2px_12px_rgba(20,37,66,0.08)] overflow-hidden">
        {/* Top section */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">
            <PupilAvatar name={mock.pupilName} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-bold text-foreground text-base truncate">{mock.pupilName}</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200/60 text-[11px] font-bold text-amber-700 dark:text-amber-300 animate-pulse shrink-0">
                  <Timer className="h-3 w-3" /> {mock.countdown}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{mock.pickupLocation}, {mock.pickupPostcode}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <PaymentStatusBadge balance={mock.balance} size="md" className="rounded-none" />
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" /> ETA {mock.etaTime} ({mock.etaText})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tear-line divider */}
        <div className="relative h-6 flex items-center">
          <div className="absolute left-0 -translate-x-1/2 w-5 h-5 rounded-full bg-background" />
          <div className="absolute right-0 translate-x-1/2 w-5 h-5 rounded-full bg-background" />
          <div className="w-full border-t-2 border-dashed border-border/60 mx-5" />
        </div>

        {/* Bottom section */}
        <div className="p-4 pt-1">
          {/* Time + duration */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" /> {mock.dateLabel} · {mock.startTime}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              {mock.durationLabel} lesson
            </span>
          </div>

          {/* Unread */}
          {mock.unreadCount > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 border border-destructive/20">
              <Mail className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">{mock.unreadCount} unread messages from Sarah</span>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" className="rounded-xl gap-1.5 col-span-3"><Navigation className="h-4 w-4" /> Start Navigation</Button>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><Phone className="h-3.5 w-3.5" /> Call</Button>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Message</Button>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> On Way</Button>
          </div>

          {/* Expand */}
          <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-center gap-1 pt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <span>{expanded ? "Less" : "More actions"}</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown className="h-3.5 w-3.5" /></motion.div>
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border mt-2">
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><User className="h-3.5 w-3.5" /> Pupil</Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Schedule</Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-destructive hover:text-destructive"><X className="h-3.5 w-3.5" /> Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── OPTION D: Minimal Timeline ────────────────────────────────
function OptionD() {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-2xl bg-card border border-border shadow-[0_2px_12px_rgba(20,37,66,0.08)] overflow-hidden">
        <div className="p-4">
          {/* Single compact row */}
          <div className="flex items-center gap-3">
            <PupilAvatar name={mock.pupilName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{mock.pupilName}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" /> {mock.startTime} · {mock.pickupPostcode}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200/60 text-[11px] font-bold text-amber-700 dark:text-amber-300 animate-pulse">
                <Timer className="h-3 w-3" /> {mock.countdown}
              </span>
              <Button size="sm" className="rounded-xl gap-1 h-8 px-3">
                <Navigation className="h-3.5 w-3.5" /> Go
              </Button>
            </div>
          </div>

          {/* Subtle info bar */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <PaymentStatusBadge balance={mock.balance} size="sm" className="rounded-none" />
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Car className="h-3 w-3" /> {mock.etaText}
            </span>
            <span className="text-[11px] text-muted-foreground">{mock.durationLabel} lesson</span>
            {mock.unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                <Mail className="h-3 w-3" /> {mock.unreadCount} unread
              </span>
            )}
          </div>

          {/* Expand for full actions */}
          <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-center gap-1 pt-2 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <span>{expanded ? "Less" : "Actions"}</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown className="h-3.5 w-3.5" /></motion.div>
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-2 pt-2 border-t border-border mt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><Phone className="h-3.5 w-3.5" /> Call</Button>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Message</Button>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> On Way</Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><User className="h-3.5 w-3.5" /> Pupil</Button>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Schedule</Button>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-destructive hover:text-destructive"><X className="h-3.5 w-3.5" /> Cancel</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SHOWCASE PAGE ─────────────────────────────────────────────
export default function NextUpTileShowcase() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Next Up Tile — Design Options</h1>
      </div>

      <div>
        <h2 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Option A — Compact Command Centre</h2>
        <OptionA />
      </div>

      <div>
        <h2 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Option B — Split Card</h2>
        <OptionB />
      </div>

      <div>
        <h2 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Option C — Ticket Style</h2>
        <OptionC />
      </div>

      <div>
        <h2 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Option D — Minimal Timeline</h2>
        <OptionD />
      </div>

      <div className="pb-8 text-center text-xs text-muted-foreground">
        All options preserve the same actions: Navigate, Call, Message, On Way, View Pupil, Schedule, Cancel
      </div>
    </div>
  );
}
