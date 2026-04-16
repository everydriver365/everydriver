import React, { useState, useMemo, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { Menu, Search, Clock, Car, MapPin, Info, Plus, Phone, MessageSquare, Wrench, Users, FileText, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ─── Types ─────────────────────────────────────────────────────────────────
type LessonType = "Beginner" | "Intermediate" | "Test Prep" | "Pass Plus" | "College" | "Speed Awareness" | "Theory";

interface SampleLesson {
  id: string;
  date: string; // yyyy-MM-dd
  studentName: string;
  initials: string;
  startTime: string;
  endTime: string;
  type: LessonType;
  tag?: { label: string; variant: "amber" | "red" | "blue" | "green" | "purple" | "slate" };
  statusTag?: { label: string; variant: "amber" | "red" | "blue" | "green" | "purple" | "slate" };
  subtitle?: string;
  vehicle?: string;
  location?: string;
  accentColor: string;
  avatarBg: string;
  avatarText: string;
  hasTimeIssue?: boolean;
  actions: { label: string; variant: "default" | "primary"; icon?: React.ElementType }[];
}

// ─── Sample Data ───────────────────────────────────────────────────────────
function generateSampleData(weekStart: Date): SampleLesson[] {
  const d = (offset: number) => format(addDays(weekStart, offset), "yyyy-MM-dd");

  return [
    {
      id: "1", date: d(0), studentName: "Emma Thompson", initials: "ET", startTime: "09:00", endTime: "11:00",
      type: "Beginner", tag: { label: "Beginner", variant: "blue" }, statusTag: { label: "Confirmed", variant: "green" },
      vehicle: "Vauxhall Corsa", accentColor: "#2563EB", avatarBg: "bg-blue-100", avatarText: "text-blue-700",
      actions: [{ label: "Call", variant: "default", icon: Phone }, { label: "Message", variant: "default", icon: MessageSquare }, { label: "Details", variant: "default", icon: FileText }],
    },
    {
      id: "2", date: d(1), studentName: "Lotty Williams", initials: "LW", startTime: "01:00", endTime: "00:59",
      type: "College", tag: { label: "College", variant: "amber" }, statusTag: { label: "Time issue", variant: "red" },
      vehicle: "Vauxhall Corsa", accentColor: "#F59E0B", avatarBg: "bg-amber-100", avatarText: "text-amber-700",
      hasTimeIssue: true,
      actions: [{ label: "Call", variant: "default", icon: Phone }, { label: "Message", variant: "default", icon: MessageSquare }, { label: "Fix time", variant: "primary", icon: Wrench }],
    },
    {
      id: "3", date: d(1), studentName: "Ken Patel", initials: "KP", startTime: "07:00", endTime: "10:00",
      type: "Speed Awareness", tag: { label: "Speed awareness", variant: "blue" }, statusTag: { label: "Confirmed", variant: "green" },
      subtitle: "National Speed Awareness", location: "Classroom 2", accentColor: "#2563EB", avatarBg: "bg-blue-100", avatarText: "text-blue-700",
      actions: [{ label: "Details", variant: "default", icon: FileText }, { label: "Attendees", variant: "default", icon: Users }, { label: "Check in", variant: "default", icon: LogIn }],
    },
    {
      id: "4", date: d(2), studentName: "Oliver Brown", initials: "OB", startTime: "10:00", endTime: "12:00",
      type: "Test Prep", tag: { label: "Test Prep", variant: "purple" }, statusTag: { label: "Confirmed", variant: "green" },
      vehicle: "Ford Fiesta", accentColor: "#7C3AED", avatarBg: "bg-purple-100", avatarText: "text-purple-700",
      actions: [{ label: "Call", variant: "default", icon: Phone }, { label: "Message", variant: "default", icon: MessageSquare }, { label: "Details", variant: "default", icon: FileText }],
    },
    {
      id: "5", date: d(3), studentName: "Sophie Chen", initials: "SC", startTime: "14:00", endTime: "16:00",
      type: "Intermediate", tag: { label: "Intermediate", variant: "green" }, statusTag: { label: "Confirmed", variant: "green" },
      vehicle: "Vauxhall Corsa", accentColor: "#16A34A", avatarBg: "bg-green-100", avatarText: "text-green-700",
      actions: [{ label: "Call", variant: "default", icon: Phone }, { label: "Message", variant: "default", icon: MessageSquare }, { label: "Details", variant: "default", icon: FileText }],
    },
    {
      id: "6", date: d(4), studentName: "James Wilson", initials: "JW", startTime: "09:00", endTime: "11:00",
      type: "Pass Plus", tag: { label: "Pass Plus", variant: "slate" }, statusTag: { label: "Confirmed", variant: "green" },
      vehicle: "Ford Fiesta", accentColor: "#475569", avatarBg: "bg-slate-100", avatarText: "text-slate-700",
      actions: [{ label: "Call", variant: "default", icon: Phone }, { label: "Message", variant: "default", icon: MessageSquare }, { label: "Details", variant: "default", icon: FileText }],
    },
    {
      id: "7", date: d(4), studentName: "Mia Johnson", initials: "MJ", startTime: "13:00", endTime: "14:00",
      type: "Theory", tag: { label: "Theory", variant: "amber" }, statusTag: { label: "Confirmed", variant: "green" },
      location: "Online", accentColor: "#F59E0B", avatarBg: "bg-amber-100", avatarText: "text-amber-700",
      actions: [{ label: "Details", variant: "default", icon: FileText }, { label: "Message", variant: "default", icon: MessageSquare }],
    },
    {
      id: "8", date: d(5), studentName: "Ava Davis", initials: "AD", startTime: "11:00", endTime: "13:00",
      type: "Beginner", tag: { label: "Beginner", variant: "blue" }, statusTag: { label: "Confirmed", variant: "green" },
      vehicle: "Vauxhall Corsa", accentColor: "#2563EB", avatarBg: "bg-blue-100", avatarText: "text-blue-700",
      actions: [{ label: "Call", variant: "default", icon: Phone }, { label: "Message", variant: "default", icon: MessageSquare }, { label: "Details", variant: "default", icon: FileText }],
    },
  ];
}

// ─── Tag Component ─────────────────────────────────────────────────────────
const tagStyles: Record<string, string> = {
  amber: "bg-[#FEF3C7] text-[#92400E]",
  red: "bg-[#FEE2E2] text-[#991B1B]",
  blue: "bg-[#DBEAFE] text-[#1E40AF]",
  green: "bg-[#DCFCE7] text-[#166534]",
  purple: "bg-[#F3E8FF] text-[#6B21A8]",
  slate: "bg-[#F1F5F9] text-[#334155]",
};

function Tag({ label, variant }: { label: string; variant: string }) {
  return (
    <span className={cn("text-[10px] font-medium px-[7px] py-[2px] rounded", tagStyles[variant] || tagStyles.slate)}>
      {label}
    </span>
  );
}

// ─── Lesson Card ───────────────────────────────────────────────────────────
function LessonCard({ lesson }: { lesson: SampleLesson }) {
  return (
    <div className="bg-white rounded-[14px] p-[14px] border border-[#E2E8F0] mb-2.5 flex overflow-hidden" style={{ borderWidth: "0.5px" }}>
      {/* Accent bar */}
      <div className="w-[3px] rounded-full mr-3 shrink-0 self-stretch" style={{ backgroundColor: lesson.accentColor }} />

      <div className="flex-1 min-w-0">
        {/* Tags */}
        <div className="flex items-center gap-1.5 mb-2">
          {lesson.tag && <Tag label={lesson.tag.label} variant={lesson.tag.variant} />}
          {lesson.statusTag && <Tag label={lesson.statusTag.label} variant={lesson.statusTag.variant} />}
        </div>

        {/* Name + Avatar */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[15px] font-medium text-[#0F172A]">{lesson.studentName}</p>
            {lesson.subtitle && <p className="text-[12px] text-[#64748B]">{lesson.subtitle}</p>}
          </div>
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0", lesson.avatarBg, lesson.avatarText)}>
            {lesson.initials}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-[#64748B]" />
            <span className={cn("text-[12px]", lesson.hasTimeIssue ? "text-[#DC2626] font-medium" : "text-[#64748B]")}>
              {lesson.startTime} – {lesson.endTime}
            </span>
          </div>
          {lesson.vehicle && (
            <div className="flex items-center gap-1">
              <Car className="h-3 w-3 text-[#64748B]" />
              <span className="text-[12px] text-[#64748B]">{lesson.vehicle}</span>
            </div>
          )}
          {lesson.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#64748B]" />
              <span className="text-[12px] text-[#64748B]">{lesson.location}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {lesson.actions.map((action) => (
            <button
              key={action.label}
              className={cn(
                "flex-1 py-[7px] rounded-[7px] text-[12px] font-medium flex items-center justify-center gap-1 min-h-[44px] transition-colors active:scale-[0.97]",
                action.variant === "primary"
                  ? "bg-[#DBEAFE] text-[#1E40AF]"
                  : "bg-[#F1F5F9] text-[#334155]"
              )}
            >
              {action.icon && <action.icon className="h-3.5 w-3.5" />}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
type SegmentView = "Day" | "Week" | "Month";

interface MobileScheduleRedesignProps {
  onAddLesson?: () => void;
  onMenuTap?: () => void;
}

export function MobileScheduleRedesign({ onAddLesson, onMenuTap }: MobileScheduleRedesignProps) {
  const navigate = useNavigate();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 3 }); // Start on Wed to match spec
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [activeSegment, setActiveSegment] = useState<SegmentView>("Day");

  const sampleData = useMemo(() => generateSampleData(weekStart), []);
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const lessonsForDay = useMemo(() => sampleData.filter((l) => l.date === selectedDateStr), [sampleData, selectedDateStr]);

  // Count lessons per date for dot indicators
  const lessonCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    sampleData.forEach((l) => map.set(l.date, (map.get(l.date) || 0) + 1));
    return map;
  }, [sampleData]);

  const totalHours = useMemo(() => {
    return lessonsForDay.reduce((sum, l) => {
      const [sh, sm] = l.startTime.split(":").map(Number);
      const [eh, em] = l.endTime.split(":").map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins < 0) mins = 0;
      return sum + mins;
    }, 0);
  }, [lessonsForDay]);

  const isToday = isSameDay(selectedDate, today);
  const headerMonth = format(selectedDate, "MMMM yyyy");

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] dark:bg-[#0F172A] max-w-[420px] mx-auto w-full">
      {/* ─── Sticky Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-[#1E293B]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button
            onClick={onMenuTap}
            className="w-9 h-9 rounded-[10px] bg-[#F7F8FA] dark:bg-[#334155] flex items-center justify-center min-h-[44px] min-w-[44px]"
          >
            <Menu className="h-[18px] w-[18px] text-[#334155] dark:text-[#CBD5E1]" />
          </button>

          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-[0.5px] text-[#64748B] dark:text-[#94A3B8]">
              SCHEDULE
            </p>
            <p className="text-[17px] font-medium text-[#0F172A] dark:text-white">
              {headerMonth}
            </p>
          </div>

          <button className="w-9 h-9 rounded-[10px] bg-[#F7F8FA] dark:bg-[#334155] flex items-center justify-center min-h-[44px] min-w-[44px]">
            <Search className="h-[18px] w-[18px] text-[#334155] dark:text-[#CBD5E1]" />
          </button>
        </div>

        {/* Segmented Toggle */}
        <div className="px-4 pb-3">
          <div className="bg-[#F1F3F7] dark:bg-[#1E293B] p-1 rounded-[12px] flex">
            {(["Day", "Week", "Month"] as SegmentView[]).map((seg) => (
              <button
                key={seg}
                onClick={() => setActiveSegment(seg)}
                className={cn(
                  "flex-1 py-[7px] text-[13px] font-medium rounded-[10px] transition-all min-h-[44px]",
                  activeSegment === seg
                    ? "bg-white dark:bg-[#334155] text-[#0F172A] dark:text-white shadow-sm"
                    : "text-[#64748B] dark:text-[#94A3B8]"
                )}
              >
                {seg}
              </button>
            ))}
          </div>
        </div>

        {/* Day Strip */}
        <div className="px-2 pb-3">
          <div className="flex justify-between overflow-x-auto no-scrollbar">
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isSelected = dateStr === selectedDateStr;
              const lessonCount = lessonCountByDate.get(dateStr) || 0;
              const isDayToday = isSameDay(day, today);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex flex-col items-center w-[44px] py-2 rounded-[12px] transition-all min-h-[44px] relative",
                    isSelected
                      ? "bg-[#2563EB] dark:bg-[#3B82F6]"
                      : "bg-transparent"
                  )}
                >
                  <span className={cn(
                    "text-[10px] uppercase font-medium mb-1",
                    isSelected ? "text-white/80" : "text-[#94A3B8] dark:text-[#64748B]"
                  )}>
                    {format(day, "EEE")}
                  </span>
                  <span className={cn(
                    "text-[15px] font-medium",
                    isSelected ? "text-white" : "text-[#0F172A] dark:text-[#E2E8F0]"
                  )}>
                    {format(day, "d")}
                  </span>
                  {/* Dot indicator */}
                  {lessonCount > 0 && (
                    <div className={cn(
                      "w-[5px] h-[5px] rounded-full mt-1",
                      isSelected
                        ? "bg-[#FCD34D]"
                        : "bg-[#2563EB] dark:bg-[#3B82F6]"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom separator */}
        <div className="h-px bg-[#E2E8F0] dark:bg-[#334155]" />
      </div>

      {/* ─── Content Area ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDateStr}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {/* Day section header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[16px] font-medium text-[#0F172A] dark:text-white">
                  {format(selectedDate, "EEEE, d MMMM")}
                </p>
                <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">
                  {lessonsForDay.length} lesson{lessonsForDay.length !== 1 ? "s" : ""} · {Math.round(totalHours / 60)} hour{Math.round(totalHours / 60) !== 1 ? "s" : ""} total
                </p>
              </div>
              {isToday && (
                <span className="bg-[#DCFCE7] text-[#166534] text-[11px] font-medium px-[10px] py-[4px] rounded-[6px]">
                  Today
                </span>
              )}
            </div>

            {/* Lesson Cards */}
            {lessonsForDay.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[14px] text-[#94A3B8] dark:text-[#64748B]">No lessons scheduled</p>
              </div>
            ) : (
              lessonsForDay.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
            )}

            {/* Insight strip */}
            {lessonsForDay.length > 0 && lessonsForDay.length < 4 && (
              <div className="flex items-center gap-3 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-[10px] p-[10px] mt-1">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-[#334155] flex items-center justify-center shrink-0">
                  <Info className="h-3.5 w-3.5 text-[#64748B]" />
                </div>
                <p className="text-[12px] text-[#334155] dark:text-[#CBD5E1]">
                  {4 - lessonsForDay.length}-hour gap between lessons · room to add one
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Primary Action Button ─────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F7F8FA] dark:from-[#0F172A] via-[#F7F8FA]/95 dark:via-[#0F172A]/95 to-transparent pointer-events-none max-w-[420px] mx-auto">
        <button
          onClick={onAddLesson}
          className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white py-[14px] rounded-[12px] text-[14px] font-medium flex items-center justify-center gap-2 pointer-events-auto transition-colors min-h-[44px] shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
        >
          <Plus className="h-[18px] w-[18px]" />
          Add lesson
        </button>
      </div>
    </div>
  );
}
