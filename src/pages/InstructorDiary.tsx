import { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  Clock,
  Star,
  ChevronLeft,
  Search,
  Mic,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";

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
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [stats, setStats] = useState<LessonStat>({ totalLessons: 0, totalHours: 0, uniquePupils: 0 });
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [allPupils, setAllPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPupil, setSelectedPupil] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (instructorId) fetchPupils();
  }, [instructorId]);

  useEffect(() => {
    if (instructorId) fetchData();
  }, [instructorId, dateRange, selectedPupil]);

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
      const daysAgo = parseInt(dateRange);
      const startDate = daysAgo === 0
        ? format(subMonths(new Date(), 12), "yyyy-MM-dd")
        : format(subDays(new Date(), daysAgo), "yyyy-MM-dd");

      let query = supabase
        .from("lesson_history")
        .select("id, lesson_date, start_time, duration_minutes, notes, rating, skills_practiced, pupils(id, name)")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", startDate)
        .order("lesson_date", { ascending: false });

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
    if (!searchQuery) return true;
    const pupilName = lesson.pupils?.name?.toLowerCase() || "";
    const notes = lesson.notes?.toLowerCase() || "";
    return pupilName.includes(searchQuery.toLowerCase()) || notes.includes(searchQuery.toLowerCase());
  }), [lessons, searchQuery]);

  const lessonCount = filteredLessons.length;

  const handleBack = () => navigate("/instructor/pupils");
  const handleSearchFocus = () => {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };
  const handleVoiceSearch = () => {
    // Hook-up: voice handler — falls back to focusing the input if unavailable.
    handleSearchFocus();
  };
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedPupil("all");
    setDateRange("30");
  };

  const selectedPupilObj = allPupils.find(p => p.id === selectedPupil) || null;
  const dateLabel = dateRangeLabels[dateRange] || "Last 30 days";
  const typeLabel = "All types";

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  const cardBorder = "1px solid rgba(26,82,160,0.08)";
  const chipBorder = "1px solid rgba(26,82,160,0.15)";

  return (
    <InstructorPortalLayout>
      <div style={{ backgroundColor: "#F2F4F8" }} className="min-h-full -mx-4 -my-4 sm:-mx-6 sm:-my-6">
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
                  backgroundColor: "#F2F4F8",
                  border: chipBorder,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
                aria-label="Back"
              >
                <ChevronLeft size={14} color="#1A52A0" strokeWidth={2} />
              </button>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.4, margin: 0 }}>
                  Lesson History
                </h1>
                <p style={{ fontSize: 10, color: "#8E8E93", marginTop: 1 }}>
                  All lessons across all pupils
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSearchFocus}
              style={{
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: "#F2F4F8",
                border: chipBorder,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}
              aria-label="Search"
            >
              <Search size={13} color="#5B6B8A" strokeWidth={1.8} />
            </button>
          </div>

          {/* Search bar */}
          <div
            onClick={handleSearchFocus}
            style={{
              backgroundColor: "#FFF", borderRadius: 12,
              padding: "8px 12px",
              display: "flex", alignItems: "center", gap: 7,
              marginBottom: 10,
              border: "1px solid rgba(26,82,160,0.1)",
              cursor: "text",
            }}
          >
            <Search size={12} color="#8E8E93" />
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
                color: "#1A1A1A",
              }}
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleVoiceSearch(); }}
              aria-label="Voice search"
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
            >
              <Mic size={12} color="#8E8E93" strokeWidth={1.6} />
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
                  <button type="button" style={chipStyle(dateRange !== "30")}>
                    {dateLabel}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-1 w-44">
                  {Object.entries(dateRangeLabels).map(([k, label]) => (
                    <button
                      key={k}
                      className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted"
                      onClick={() => setDateRange(k)}
                    >
                      {label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              <button type="button" style={chipStyle(false)} disabled>
                {typeLabel}
              </button>

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
            <StatCard value={String(stats.totalLessons)} label="Lessons" color="#1A52A0" />
            <StatCard value={`${stats.totalHours}h`} label="Hours" color="#1A7A3C" />
            <StatCard value={String(stats.uniquePupils)} label="Pupils" color="#B45309" />
          </div>

          {/* Section header */}
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", letterSpacing: 1.2, textTransform: "uppercase" }}>
              Lessons
            </span>
            <div style={{ backgroundColor: "#F2F4F8", borderRadius: 20, padding: "2px 8px" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#8E8E93" }}>
                {lessonCount} record{lessonCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Lessons list / empty state */}
          {loading ? (
            <div style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 24, textAlign: "center", border: cardBorder, color: "#8E8E93", fontSize: 12 }}>
              Loading…
            </div>
          ) : lessonCount === 0 ? (
            <div style={{
              backgroundColor: "#FFF", borderRadius: 16, padding: 32,
              display: "flex", flexDirection: "column", alignItems: "center",
              border: cardBorder,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: "#EEF3FF",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
              }}>
                <Calendar size={22} color="#1A52A0" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
                No lessons found
              </div>
              <div style={{ fontSize: 11, color: "#8E8E93", textAlign: "center", lineHeight: "17px", marginBottom: 14, maxWidth: 320 }}>
                No lessons match the selected filters. Try adjusting the date range or pupil filter.
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{ backgroundColor: "#EEF3FF", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 600, color: "#1A52A0", border: "none", cursor: "pointer" }}
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: "#FFF", borderRadius: 16, overflow: "hidden", border: cardBorder }}>
              {filteredLessons.map((lesson, idx) => (
                <div key={lesson.id}>
                  {idx > 0 && <div style={{ height: 0.5, backgroundColor: "#F0F3F8", marginLeft: 14, marginRight: 14 }} />}
                  <div style={{ padding: "12px 14px" }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#1A1A1A" }}>
                        {lesson.pupils?.name || "Unknown Pupil"}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {lesson.duration_minutes >= 60 ? `${lesson.duration_minutes / 60}h` : `${lesson.duration_minutes}m`}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3" style={{ fontSize: 11, color: "#8E8E93" }}>
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
                      <p style={{ fontSize: 11, color: "#5B6B8A", marginTop: 6 }} className="line-clamp-2">
                        {lesson.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </InstructorPortalLayout>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    borderRadius: 20,
    padding: "5px 12px",
    backgroundColor: active ? "#1A52A0" : "#FFF",
    border: active ? "none" : "1px solid rgba(26,82,160,0.15)",
    color: active ? "#FFF" : "#5B6B8A",
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
      backgroundColor: "#FFF",
      borderRadius: 13,
      padding: "12px 8px",
      display: "flex", flexDirection: "column", alignItems: "center",
      border: "1px solid rgba(26,82,160,0.08)",
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: -0.5, lineHeight: "25px" }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: "#8E8E93", marginTop: 3, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}
