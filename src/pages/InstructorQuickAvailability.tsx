import { useState, useEffect, useMemo, type CSSProperties } from "react";
import { PageSkeleton } from "@/components/ui/skeletons/PageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addWeeks, subWeeks, startOfWeek, addDays, subDays, isSameDay, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Plus, Trash2, Pencil, X } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { AvailabilityRulesManager } from "@/components/instructor/AvailabilityRulesManager";
import { AvailableFromCard } from "@/components/instructor/AvailableFromCard";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface TimeSlot {
  start: string;
  end: string;
}

interface DateOverride {
  id: string;
  override_date: string;
  override_end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
}

interface WorkingHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function InstructorQuickAvailability() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [editForm, setEditForm] = useState({
    isAvailable: true,
    timeSlots: [{ start: "09:00", end: "17:00" }] as TimeSlot[],
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    if (instructorId) {
      fetchData();
    }
  }, [instructorId, currentWeekStart]);

  const fetchData = async () => {
    if (!instructorId) return;
    
    setLoading(true);
    try {
      const startDate = format(currentWeekStart, "yyyy-MM-dd");
      const endDate = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

      const [overridesRes, workingHoursRes] = await Promise.all([
        supabase
          .from("instructor_date_overrides")
          .select("*")
          .eq("instructor_id", instructorId)
          .gte("override_date", startDate)
          .lte("override_date", endDate),
        supabase
          .from("instructor_working_hours")
          .select("*")
          .eq("instructor_id", instructorId),
      ]);

      if (overridesRes.data) {
        setOverrides(overridesRes.data);
      }
      if (workingHoursRes.data) {
        setWorkingHours(workingHoursRes.data);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const getDateAvailability = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    // Get all overrides for this date
    const dateOverrides = overrides.filter(o => o.override_date === dateStr);
    
    if (dateOverrides.length > 0) {
      // Check if any override marks unavailable
      const unavailableOverride = dateOverrides.find(o => !o.is_available);
      if (unavailableOverride) {
        return {
          hasOverride: true,
          isAvailable: false,
          timeSlots: [],
        };
      }
      
      // Get all time slots from overrides
      const timeSlots = dateOverrides
        .filter(o => o.is_available && o.start_time && o.end_time)
        .map(o => ({
          start: o.start_time!,
          end: o.end_time!,
        }));
      
      return {
        hasOverride: true,
        isAvailable: true,
        timeSlots,
      };
    }

    const dayOfWeek = date.getDay();
    const defaultHours = workingHours.find(w => w.day_of_week === dayOfWeek);
    
    if (defaultHours && defaultHours.is_active) {
      return {
        hasOverride: false,
        isAvailable: true,
        timeSlots: [{ start: defaultHours.start_time, end: defaultHours.end_time }],
      };
    }

    return {
      hasOverride: false,
      isAvailable: false,
      timeSlots: [],
    };
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const openEditSheet = (date: Date) => {
    const availability = getDateAvailability(date);
    setEditingDate(date);
    setEditForm({
      isAvailable: availability.isAvailable,
      timeSlots: availability.timeSlots.length > 0 
        ? availability.timeSlots.map(s => ({ start: s.start.slice(0, 5), end: s.end.slice(0, 5) }))
        : [{ start: "09:00", end: "17:00" }],
    });
  };

  const addTimeSlot = () => {
    setEditForm({
      ...editForm,
      timeSlots: [...editForm.timeSlots, { start: "12:00", end: "14:00" }],
    });
  };

  const removeTimeSlot = (index: number) => {
    if (editForm.timeSlots.length <= 1) return;
    setEditForm({
      ...editForm,
      timeSlots: editForm.timeSlots.filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...editForm.timeSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setEditForm({ ...editForm, timeSlots: newSlots });
  };

  const saveOverride = async () => {
    if (!instructorId || !editingDate) return;

    const dateStr = format(editingDate, "yyyy-MM-dd");
    
    try {
      // First, delete all existing overrides for this date
      const { error: deleteError } = await supabase
        .from("instructor_date_overrides")
        .delete()
        .eq("instructor_id", instructorId)
        .eq("override_date", dateStr);

      if (deleteError) throw deleteError;

      if (!editForm.isAvailable) {
        // Insert single unavailable override
        const { error } = await supabase
          .from("instructor_date_overrides")
          .insert({
            instructor_id: instructorId,
            override_date: dateStr,
            is_available: false,
            start_time: null,
            end_time: null,
          });

        if (error) throw error;
      } else {
        // Insert multiple time slot overrides
        const inserts = editForm.timeSlots.map(slot => ({
          instructor_id: instructorId,
          override_date: dateStr,
          is_available: true,
          start_time: slot.start,
          end_time: slot.end,
        }));

        const { error } = await supabase
          .from("instructor_date_overrides")
          .insert(inserts);

        if (error) throw error;
      }

      toast.success("Availability updated");
      setEditingDate(null);
      fetchData();
    } catch (error) {
      console.error("Error saving override:", error);
      toast.error("Failed to save changes");
    }
  };

  const removeOverride = async () => {
    if (!editingDate || !instructorId) return;
    
    const dateStr = format(editingDate, "yyyy-MM-dd");
    
    try {
      const { error } = await supabase
        .from("instructor_date_overrides")
        .delete()
        .eq("instructor_id", instructorId)
        .eq("override_date", dateStr);

      if (error) throw error;

      toast.success("Override removed - using default hours");
      setEditingDate(null);
      fetchData();
    } catch (error) {
      console.error("Error removing override:", error);
      toast.error("Failed to remove override");
    }
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <PageSkeleton />
      </InstructorPortalLayout>
    );
  }

  // Derived stats from existing week data
  const today = startOfDay(new Date());
  const availableDays = weekDays
    .map((d) => ({ date: d, av: getDateAvailability(d) }))
    .filter((x) => x.av.isAvailable && x.av.timeSlots.length > 0);
  const unavailableDays = weekDays.filter((d) => {
    if (d < today && !isSameDay(d, today)) return false;
    const av = getDateAvailability(d);
    return !(av.isAvailable && av.timeSlots.length > 0);
  });
  const slotCount = availableDays.length;
  const totalHours = availableDays.reduce((acc, x) => {
    return (
      acc +
      x.av.timeSlots.reduce((s, t) => {
        const [sh, sm] = t.start.split(":").map(Number);
        const [eh, em] = t.end.split(":").map(Number);
        return s + (eh * 60 + em - (sh * 60 + sm)) / 60;
      }, 0)
    );
  }, 0);
  const monthLabel = format(currentWeekStart, "MMMM yyyy");

  // 9-day strip centred on today
  const stripStart = subDays(today, 4);
  const visibleStripDays = Array.from({ length: 9 }, (_, i) => addDays(stripStart, i));

  const handleAddSlot = () => openEditSheet(today);
  const handleAddSlotForDay = (d: Date) => openEditSheet(d);
  const handleEditSlot = (d: Date) => openEditSheet(d);
  const handleDeleteSlotForDay = async (d: Date) => {
    const dateStr = format(d, "yyyy-MM-dd");
    if (!instructorId) return;
    try {
      const { error } = await supabase
        .from("instructor_date_overrides")
        .delete()
        .eq("instructor_id", instructorId)
        .eq("override_date", dateStr);
      if (error) throw error;
      toast.success("Availability removed");
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to remove");
    }
  };

  const fmtTime12 = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    const dh = h % 12 || 12;
    return `${dh}:${String(m).padStart(2, "0")} ${ap}`;
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#8E8E93",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        marginBottom: 8,
        paddingLeft: 2,
      }}
    >
      {label}
    </div>
  );

  return (
    <InstructorPortalLayout>
      <div style={{ background: "#F2F4F8", margin: "-16px -16px 0", minHeight: "calc(100vh - 60px)" }}>
        {/* Header */}
        <div
          style={{
            background: "#FFF",
            padding: "12px 16px",
            borderBottom: "0.5px solid #F0F3F8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.4 }}>
              Availability
            </div>
            <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 2 }}>
              {slotCount} day{slotCount === 1 ? "" : "s"} set · {totalHours.toFixed(1)}h available this week
            </div>
          </div>
          <button
            onClick={handleAddSlot}
            style={{
              background: "#3D55A1",
              borderRadius: 20,
              padding: "7px 14px",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
              color: "#FFF",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Plus size={11} strokeWidth={2.2} />
            Add
          </button>
        </div>

        <div style={{ padding: "14px 15px 24px" }}>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
              style={navBtnStyle}
              aria-label="Previous week"
            >
              <ChevronLeft size={14} color="#3D55A1" strokeWidth={2} />
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{monthLabel}</div>
              <div style={{ fontSize: 9, color: "#8E8E93", marginTop: 1 }}>
                {slotCount} availability slot{slotCount === 1 ? "" : "s"}
              </div>
            </div>
            <button
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
              style={navBtnStyle}
              aria-label="Next week"
            >
              <ChevronRight size={14} color="#3D55A1" strokeWidth={2} />
            </button>
          </div>

          {/* Week strip */}
          <div
            style={{
              background: "#FFF",
              borderRadius: 14,
              padding: "10px 8px",
              marginBottom: 12,
              border: "0.5px solid rgba(26,82,160,0.08)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {visibleStripDays.map((day) => {
              const isT = isSameDay(day, new Date());
              const isPastDay = day < today;
              const av = getDateAvailability(day);
              const dotColor = av.isAvailable && av.timeSlots.length > 0 ? "#1A7A3C" : null;
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setCurrentWeekStart(startOfWeek(day, { weekStartsOn: 0 }))}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: isT ? 700 : 500,
                      color: isT ? "#3D55A1" : isPastDay ? "#C7C7CC" : "#8E8E93",
                    }}
                  >
                    {format(day, "EEEEE")}
                  </span>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      background: isT ? "#3D55A1" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: isT ? "#FFF" : isPastDay ? "#C7C7CC" : "#1A1A1A",
                      }}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      background: dotColor || "transparent",
                    }}
                  />
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : availableDays.length === 0 && unavailableDays.length === 0 ? (
            <div
              style={{
                background: "#FFF",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "0.5px solid rgba(26,82,160,0.08)",
              }}
            >
              <Calendar size={28} color="#C7C7CC" strokeWidth={1.4} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginTop: 10, marginBottom: 4 }}>
                No availability set
              </div>
              <div style={{ fontSize: 11, color: "#8E8E93", textAlign: "center", marginBottom: 14 }}>
                Add your working hours for {monthLabel} so pupils can book lessons
              </div>
              <button
                onClick={handleAddSlot}
                style={{
                  background: "#3D55A1",
                  borderRadius: 20,
                  padding: "7px 16px",
                  border: "none",
                  color: "#FFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Add first slot
              </button>
            </div>
          ) : (
            <>
              {/* Available days */}
              <SectionLabel label="This week" />
              <div
                style={{
                  background: "#FFF",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "0.5px solid rgba(26,82,160,0.08)",
                  marginBottom: 14,
                }}
              >
                {availableDays.map(({ date, av }, idx) => {
                  const isT = isSameDay(date, new Date());
                  // Render one row per time slot, with the date column on the first only
                  return av.timeSlots.map((slot, sIdx) => {
                    const startMin = (() => {
                      const [h, m] = slot.start.split(":").map(Number);
                      return h * 60 + m;
                    })();
                    const endMin = (() => {
                      const [h, m] = slot.end.split(":").map(Number);
                      return h * 60 + m;
                    })();
                    const dur = (endMin - startMin) / 60;
                    const config = {
                      band: "#1A7A3C",
                      bg: "#F2FBF5",
                      labelColor: "#1A7A3C",
                      label: "Available",
                    };
                    const isFirstRow = sIdx === 0;
                    return (
                      <div key={`${date.toISOString()}-${sIdx}`}>
                        <button
                          onClick={() => handleEditSlot(date)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "12px 14px",
                            background: config.bg,
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div style={{ width: 36, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, opacity: isFirstRow ? 1 : 0 }}>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                color: isT ? "#1A7A3C" : "#8E8E93",
                              }}
                            >
                              {format(date, "EEE")}
                            </span>
                            <span
                              style={{
                                fontSize: 20,
                                fontWeight: 700,
                                letterSpacing: -0.5,
                                lineHeight: "24px",
                                color: "#1A1A1A",
                              }}
                            >
                              {format(date, "d")}
                            </span>
                            {isT && (
                              <span style={{ fontSize: 8, fontWeight: 600, color: "#1A7A3C" }}>Today</span>
                            )}
                          </div>
                          <div
                            style={{
                              width: 3,
                              height: 44,
                              borderRadius: 2,
                              background: config.band,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: config.labelColor }}>
                                {config.label}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: "#1A1A1A" }}>
                              {fmtTime12(slot.start.slice(0, 5))} – {fmtTime12(slot.end.slice(0, 5))}
                            </div>
                            <div style={{ fontSize: 9, color: "#8E8E93", marginTop: 2 }}>
                              {dur.toFixed(1)}h
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                            <span
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSlot(date);
                              }}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: isT ? "#E8F8ED" : "#F2F4F8",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Pencil size={12} color={isT ? "#1A7A3C" : "#5B6B8A"} strokeWidth={1.7} />
                            </span>
                            <span
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlotForDay(date);
                              }}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: "#FFF0F0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <X size={12} color="#B23A3F" strokeWidth={1.7} />
                            </span>
                          </div>
                        </button>
                        <div style={{ height: 0.5, background: "#F0F3F8", margin: "0 14px" }} />
                      </div>
                    );
                  });
                })}
                <button
                  onClick={handleAddSlot}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={11} color="#3D55A1" strokeWidth={2.2} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1" }}>
                    Add availability slot
                  </span>
                </button>
              </div>

              {/* Unavailable days */}
              {unavailableDays.length > 0 && (
                <>
                  <SectionLabel label="Unavailable this week" />
                  <div
                    style={{
                      background: "#FFF",
                      borderRadius: 16,
                      overflow: "hidden",
                      border: "0.5px solid rgba(26,82,160,0.08)",
                      marginBottom: 14,
                    }}
                  >
                    {unavailableDays.map((day, idx) => (
                      <div key={day.toISOString()}>
                        <button
                          onClick={() => handleAddSlotForDay(day)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "11px 14px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div style={{ width: 36, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 9, fontWeight: 600, color: "#C7C7CC", textTransform: "uppercase" }}>
                              {format(day, "EEE")}
                            </span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: "#C7C7CC", lineHeight: "22px" }}>
                              {format(day, "d")}
                            </span>
                          </div>
                          <div style={{ width: 3, height: 36, borderRadius: 2, background: "#E0E5EE", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#C7C7CC" }}>No availability set</div>
                            <div style={{ fontSize: 10, color: "#C7C7CC", marginTop: 1 }}>Tap to add a slot</div>
                          </div>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: "#F2F4F8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Plus size={11} color="#8E8E93" strokeWidth={2.2} />
                          </div>
                        </button>
                        {idx < unavailableDays.length - 1 && (
                          <div style={{ height: 0.5, background: "#F0F3F8", margin: "0 14px" }} />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <div style={{ fontSize: 10, color: "#8E8E93", textAlign: "center", padding: "0 16px", marginTop: 4 }}>
            Changes here override your default working hours and Google Calendar sync.
          </div>
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editingDate} onOpenChange={(open) => !open && setEditingDate(null)}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingDate && format(editingDate, "EEEE, MMMM d, yyyy")}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Available Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="available-toggle" className="text-base">
                Available on this day
              </Label>
              <Switch
                id="available-toggle"
                checked={editForm.isAvailable}
                onCheckedChange={(checked) => 
                  setEditForm({ ...editForm, isAvailable: checked })
                }
              />
            </div>

            {/* Time Slots */}
            {editForm.isAvailable && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Time Slots</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTimeSlot}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Slot
                  </Button>
                </div>
                
                {editForm.timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Start
                      </Label>
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        End
                      </Label>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    {editForm.timeSlots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(index)}
                        className="text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={removeOverride}
                className="flex-1"
              >
                Reset to Default
              </Button>
              <Button onClick={saveOverride} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Availability Rules Engine */}
      {instructorId && <AvailabilityRulesManager instructorId={instructorId} />}
    </InstructorPortalLayout>
  );
}

const navBtnStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 16,
  background: "#FFF",
  border: "0.5px solid rgba(26,82,160,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
