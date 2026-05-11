import { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar as CalendarIcon,
  Calendar,
  Clock,
  Star,
  ChevronLeft,
  Search,
  Mic,
  Info,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";
import { LessonDetailDrawer } from "@/components/instructor/diary/LessonDetailDrawer";

type StatusFilter = "all" | "rated" | "unrated" | "has_notes" | "missing_notes";
const statusLabels: Record<StatusFilter, string> = {
  all: "All statuses",
  rated: "Rated",
  unrated: "Unrated",
  has_notes: "Has notes",
  missing_notes: "Missing notes",
};


interface LessonRecord {
  id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  notes: string | null;
  rating: number | null;
  skills_practiced: string[] | null;
  pupils: { id: string; name: string } | null;
}

interface Pupil {
  id: string;
  name: string;
}

interface LessonStat {
  totalLessons: number;
  totalHours: number;
  uniquePupils: number;
}

const dateRangeLabels: Record<string, string> = {
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 3 months",
  "0": "All time",
};

export default function InstructorDiary() {
  const { instructor, signOut } = useInstructorAuth();
  const instructorId = instructor?.id;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const initials = (instructor?.name || "I")
    .split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const handleSignOut = async () => { await signOut(); navigate("/instructor-app/login"); };
  const Shell = ({ children }: { children: React.ReactNode }) =>
    isMobile ? (
      <InstructorPortalLayout>{children}</InstructorPortalLayout>
    ) : (
      <DashboardShell
        userInitials={initials}
        userName={instructor?.name || "Instructor"}
        notificationCount={notificationCount}
        onSignOut={handleSignOut}
        onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
        onBell={() => navigate("/instructor/notifications")}
      >
        {children}
      </DashboardShell>
    );

  const [stats, setStats] = useState<LessonStat>({ totalLessons: 0, totalHours: 0, uniquePupils: 0 });
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [allPupils, setAllPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPupil, setSelectedPupil] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpDismissed, setHelpDismissed] = useState(true);
  useEffect(() => {
    setHelpDismissed(localStorage.getItem("dsm.lessonHistory.helpDismissed") === "1");
  }, []);
  const dismissHelp = () => {
    localStorage.setItem("dsm.lessonHistory.helpDismissed", "1");
    setHelpDismissed(true);
  };
  const [activeLesson, setActiveLesson] = useState<LessonRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openLesson = (l: LessonRecord) => { setActiveLesson(l); setDrawerOpen(true); };
  const handleLessonSaved = (updated: LessonRecord) => {
    setLessons((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
  };

  const usingCustomRange = !!(customFrom && customTo);

  useEffect(() => {
    if (instructorId) fetchPupils();
  }, [instructorId]);

  useEffect(() => {
    if (instructorId) fetchData();
  }, [instructorId, dateRange, selectedPupil, customFrom, customTo]);

  const fetchPupils = async () => {
    if (!instructorId) return;
    try {
      const { data } = await supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", instructorId)
        .order("name");
      setAllPupils(data || []);
    } catch (error) {
      console.error("Error fetching pupils:", error);
    }
  };

  const fetchData = async () => {
    if (!instructorId) return;
    try {
      setLoading(true);
      let startDate: string;
      let endDate: string | null = null;
      if (usingCustomRange) {
        startDate = format(customFrom!, "yyyy-MM-dd");
        endDate = format(customTo!, "yyyy-MM-dd");
      } else {
        const daysAgo = parseInt(dateRange);
        startDate = daysAgo === 0
          ? format(subMonths(new Date(), 12), "yyyy-MM-dd")
          : format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
      }

      let query = supabase
        .from("lesson_history")
        .select("id, lesson_date, start_time, duration_minutes, notes, rating, skills_practiced, pupils(id, name)")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", startDate)
        .order("lesson_date", { ascending: false });

      if (endDate) query = query.lte("lesson_date", endDate);

      if (selectedPupil !== "all") {
        query = query.eq("pupil_id", selectedPupil);
      }

      const { data: lessonsData, error: lessonsError } = await query.limit(100);

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      const totalLessons = lessonsData?.length || 0;
      const totalHours = Math.round((lessonsData?.reduce((sum, l) => sum + l.duration_minutes, 0) || 0) / 60);
      const uniquePupils = new Set(lessonsData?.map(l => (l.pupils as any)?.id)).size;

      setStats({ totalLessons, totalHours, uniquePupils });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = useMemo(() => lessons.filter(lesson => {
    // Status filter
    if (statusFilter === "rated" && !lesson.rating) return false;
    if (statusFilter === "unrated" && lesson.rating) return false;
    if (statusFilter === "has_notes" && !lesson.notes?.trim()) return false;
    if (statusFilter === "missing_notes" && lesson.notes?.trim()) return false;

    if (!searchQuery) return true;
    const pupilName = lesson.pupils?.name?.toLowerCase() || "";
    const notes = lesson.notes?.toLowerCase() || "";
    return pupilName.includes(searchQuery.toLowerCase()) || notes.includes(searchQuery.toLowerCase());
  }), [lessons, searchQuery, statusFilter]);

  const lessonCount = filteredLessons.length;

  const handleBack = () => navigate("/instructor/pupils");
  const handleSearchFocus = () => {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };
  const handleVoiceSearch = () => {
    handleSearchFocus();
  };
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedPupil("all");
    setDateRange("30");
    setCustomFrom(undefined);
    setCustomTo(undefined);
    setStatusFilter("all");
  };

  const selectedPupilObj = allPupils.find(p => p.id === selectedPupil) || null;
  const dateLabel = usingCustomRange
    ? `${format(customFrom!, "MMM d")} – ${format(customTo!, "MMM d")}`
    : (dateRangeLabels[dateRange] || "Last 30 days");
  const statusLabel = statusLabels[statusFilter];

  if (!instructorId) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Shell>
    );
  }

  const cardBorder = "0.5px solid var(--d2-border)";
  const chipBorder = "0.5px solid var(--d2-border)";

  return (
    <Shell>
      <div style={{ backgroundColor: "var(--d2-bg)" }} className={isMobile ? "min-h-full -mx-4 -my-4 sm:-mx-6 sm:-my-6" : "min-h-full -m-6"}>
        <div className="max-w-5xl mx-auto" style={{ padding: "0 15px 24px" }}>
          {/* Header */}
          <div
            className="flex items-center justify-between"
            style={{ padding: "10px 16px 12px", marginLeft: -15, marginRight: -15 }}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: "var(--d2-bg)",
                  border: chipBorder,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
                aria-label="Back"
              >
                <ChevronLeft size={14} color="var(--d2-indigo)" strokeWidth={2} />
              </button>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--d2-text-1)", letterSpacing: -0.4, margin: 0 }}>
                  Lesson History
                </h1>
                <p style={{ fontSize: 11, color: "var(--d2-text-2)", marginTop: 2 }}>
                  A searchable record of every past lesson — review notes, ratings and pupil progress.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSearchFocus}
              style={{
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: "var(--d2-bg)",
                border: chipBorder,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}
              aria-label="Search"
            >
              <Search size={13} color="var(--d2-text-3)" strokeWidth={1.8} />
            </button>
          </div>

          {!helpDismissed && (
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                background: "var(--d2-indigo-bg, #EDF2FE)",
                border: "0.5px solid var(--d2-border)",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 10,
              }}
            >
              <Info size={14} color="var(--d2-indigo)" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ flex: 1, fontSize: 12, lineHeight: 1.5, color: "var(--d2-text-1)", margin: 0 }}>
                Use Lesson History to look back at completed lessons. Filter by pupil, date range or status to find lessons that are missing notes or a rating, review what you covered last time, or pull stats for tax and CPD evidence.
              </p>
              <button
                onClick={dismissHelp}
                aria-label="Dismiss"
                style={{
                  background: "transparent", border: "none", padding: 2, cursor: "pointer",
                  color: "var(--d2-text-2)", flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Search bar */}
          <div
            onClick={handleSearchFocus}
            style={{
              backgroundColor: "var(--d2-surface)", borderRadius: 12,
              padding: "8px 12px",
              display: "flex", alignItems: "center", gap: 7,
              marginBottom: 10,
              border: "0.5px solid var(--d2-border)",
              cursor: "text",
            }}
          >
            <Search size={12} color="var(--d2-text-2)" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by pupil or notes..."
              style={{
                flex: 1,
                fontSize: 11,
                background: "transparent",
                border: "none",
                outline: "none",
                boxShadow: "none",
                padding: 0,
                height: "auto",
                color: "var(--d2-text-1)",
              }}
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleVoiceSearch(); }}
              aria-label="Voice search"
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
            >
              <Mic size={12} color="var(--d2-text-2)" strokeWidth={1.6} />
            </button>
          </div>

          {/* Filter chips */}
          <div className="overflow-x-auto" style={{ marginBottom: 12 }}>
            <div className="flex gap-1.5" style={{ paddingRight: 4 }}>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    style={chipStyle(!!selectedPupilObj)}
                  >
                    {selectedPupilObj?.name || "All pupils"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-1 w-56">
                  <button
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted"
                    onClick={() => setSelectedPupil("all")}
                  >
                    All pupils
                  </button>
                  {allPupils.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted"
                      onClick={() => setSelectedPupil(p.id)}
                    >
                      {p.name}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" style={chipStyle(dateRange !== "30" || usingCustomRange)}>
                    {dateLabel}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-2 w-auto" align="start">
                  <div className="space-y-1 mb-2">
                    {Object.entries(dateRangeLabels).map(([k, label]) => (
                      <button
                        key={k}
                        className={cn(
                          "w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted",
                          !usingCustomRange && dateRange === k && "bg-muted font-semibold",
                        )}
                        onClick={() => { setDateRange(k); setCustomFrom(undefined); setCustomTo(undefined); }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t pt-2">
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground px-2 mb-1">
                      Custom range
                    </div>
                    <CalendarPicker
                      mode="range"
                      selected={{ from: customFrom, to: customTo }}
                      onSelect={(range) => {
                        setCustomFrom(range?.from);
                        setCustomTo(range?.to);
                      }}
                      numberOfMonths={1}
                      className={cn("p-2 pointer-events-auto")}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" style={chipStyle(statusFilter !== "all")}>
                    {statusLabel}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-1 w-44">
                  {(Object.entries(statusLabels) as [StatusFilter, string][]).map(([k, label]) => (
                    <button
                      key={k}
                      className={cn(
                        "w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted",
                        statusFilter === k && "bg-muted font-semibold",
                      )}
                      onClick={() => setStatusFilter(k)}
                    >
                      {label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              <button
                type="button"
                style={chipStyle(false)}
                onClick={() => navigate("/instructor/data-export")}
              >
                Export
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-1.5" style={{ marginBottom: 14 }}>
            <StatCard value={String(stats.totalLessons)} label="Lessons" color="var(--d2-indigo)" />
            <StatCard value={`${stats.totalHours}h`} label="Hours" color="var(--d2-emerald-fg)" />
            <StatCard value={String(stats.uniquePupils)} label="Pupils" color="var(--d2-amber-fg)" />
          </div>

          {/* Section header */}
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--d2-text-2)", letterSpacing: 1.2, textTransform: "uppercase" }}>
              Lessons
            </span>
            <div style={{ backgroundColor: "var(--d2-bg)", borderRadius: 20, padding: "2px 8px" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--d2-text-2)" }}>
                {lessonCount} record{lessonCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Lessons list / empty state */}
          {loading ? (
            <div style={{ backgroundColor: "var(--d2-surface)", borderRadius: 16, padding: 24, textAlign: "center", border: cardBorder, color: "var(--d2-text-2)", fontSize: 12 }}>
              Loading…
            </div>
          ) : lessonCount === 0 ? (
            <div style={{
              backgroundColor: "var(--d2-surface)", borderRadius: 16, padding: 32,
              display: "flex", flexDirection: "column", alignItems: "center",
              border: cardBorder,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: "var(--d2-indigo-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
              }}>
                <Calendar size={22} color="var(--d2-indigo)" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--d2-text-1)", marginBottom: 4 }}>
                No lessons found
              </div>
              <div style={{ fontSize: 11, color: "var(--d2-text-2)", textAlign: "center", lineHeight: "17px", marginBottom: 14, maxWidth: 320 }}>
                No lessons match the selected filters. Try adjusting the date range or pupil filter.
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{ backgroundColor: "var(--d2-indigo-bg)", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 600, color: "var(--d2-indigo)", border: "none", cursor: "pointer" }}
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: "var(--d2-surface)", borderRadius: 16, overflow: "hidden", border: cardBorder }}>
              {filteredLessons.map((lesson, idx) => (
                <div key={lesson.id}>
                  {idx > 0 && <div style={{ height: 0.5, backgroundColor: "var(--d2-border)", marginLeft: 14, marginRight: 14 }} />}
                  <button
                    type="button"
                    onClick={() => openLesson(lesson)}
                    className="w-full text-left transition-colors hover:bg-muted/40"
                    style={{ padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--d2-text-1)" }}>
                        {lesson.pupils?.name || "Unknown Pupil"}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {lesson.duration_minutes >= 60 ? `${lesson.duration_minutes / 60}h` : `${lesson.duration_minutes}m`}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3" style={{ fontSize: 11, color: "var(--d2-text-2)" }}>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lesson.lesson_date), "MMM d, yyyy")}
                      </span>
                      {lesson.start_time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.start_time.slice(0, 5)}
                        </span>
                      )}
                      {lesson.rating && (
                        <span className="inline-flex items-center gap-0.5">
                          {[...Array(lesson.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </span>
                      )}
                    </div>
                    {lesson.skills_practiced && lesson.skills_practiced.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lesson.skills_practiced.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-[10px]">
                            {skill}
                          </Badge>
                        ))}
                        {lesson.skills_practiced.length > 3 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{lesson.skills_practiced.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    {lesson.notes && (
                      <p style={{ fontSize: 11, color: "var(--d2-text-3)", marginTop: 6 }} className="line-clamp-2">
                        {lesson.notes}
                      </p>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <LessonDetailDrawer
        lesson={activeLesson}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSaved={handleLessonSaved}
      />
    </Shell>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    borderRadius: 20,
    padding: "5px 12px",
    backgroundColor: active ? "var(--d2-indigo)" : "var(--d2-surface)",
    border: active ? "none" : "0.5px solid var(--d2-border)",
    color: active ? "var(--d2-surface)" : "var(--d2-text-2)",
    fontSize: 10,
    fontWeight: 600,
    whiteSpace: "nowrap",
    cursor: "pointer",
  };
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{
      flex: 1,
      backgroundColor: "var(--d2-surface)",
      borderRadius: 13,
      padding: "12px 8px",
      display: "flex", flexDirection: "column", alignItems: "center",
      border: "0.5px solid var(--d2-border)",
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: -0.5, lineHeight: "25px" }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: "var(--d2-text-2)", marginTop: 3, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}
