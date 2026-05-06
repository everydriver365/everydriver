import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, Sparkles, UserCog, CheckCircle, AlertCircle, 
  Loader2, User, Phone, Mail, RefreshCw, Pencil
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Instructor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profile_image_url: string | null;
  booking_mode: string | null;
  is_active: boolean;
}

interface PendingPupil {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  course_type: string | null;
  prepaid_hours: number | null;
  created_at: string;
  scheduling_status: string | null;
  instructor_id: string;
  instructor_name?: string;
  scheduled_lessons_count: number;
}

export function BookingModeOverview() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [pendingPupils, setPendingPupils] = useState<PendingPupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch instructors with booking modes
      const { data: instructorData, error: instructorError } = await supabase
        .from("instructors")
        .select("id, name, email, phone, profile_image_url, booking_mode, is_active")
        .eq("is_active", true)
        .order("name");

      if (instructorError) throw instructorError;
      setInstructors(instructorData || []);

      // Fetch pupils from instructor_assigns instructors who need scheduling
      const instructorAssignsIds = (instructorData || [])
        .filter(i => i.booking_mode === "instructor_assigns")
        .map(i => i.id);

      if (instructorAssignsIds.length > 0) {
        // Get pupils and their scheduled lesson counts
        const { data: pupilData, error: pupilError } = await supabase
          .from("pupils")
          .select(`
            id, name, email, phone, course_type, prepaid_hours, created_at, 
            scheduling_status, instructor_id
          `)
          .in("instructor_id", instructorAssignsIds)
          .or("scheduling_status.eq.pending_schedule,scheduling_status.is.null");

        if (pupilError) throw pupilError;

        // Get scheduled lesson counts for each pupil
        const pupilIds = (pupilData || []).map(p => p.id);
        const { data: lessonCounts } = await supabase
          .from("scheduled_lessons")
          .select("pupil_id")
          .in("pupil_id", pupilIds)
          .neq("status", "cancelled");

        // Count lessons per pupil
        const lessonCountMap: Record<string, number> = {};
        (lessonCounts || []).forEach(l => {
          lessonCountMap[l.pupil_id] = (lessonCountMap[l.pupil_id] || 0) + 1;
        });

        // Map instructor names
        const instructorMap: Record<string, string> = {};
        (instructorData || []).forEach(i => {
          instructorMap[i.id] = i.name;
        });

        const enrichedPupils: PendingPupil[] = (pupilData || []).map(p => ({
          ...p,
          instructor_name: instructorMap[p.instructor_id],
          scheduled_lessons_count: lessonCountMap[p.id] || 0,
        }));

        // Filter to only those who need scheduling (less lessons than prepaid hours)
        const pending = enrichedPupils.filter(p => {
          const hoursScheduled = p.scheduled_lessons_count; // Assuming 1 lesson = 1 hour avg
          return p.prepaid_hours && hoursScheduled < p.prepaid_hours;
        });

        setPendingPupils(pending);
      } else {
        setPendingPupils([]);
      }
    } catch (error) {
      console.error("Error fetching booking mode data:", error);
      toast.error("Failed to load booking mode data");
    } finally {
      setLoading(false);
    }
  };

  const markAsScheduled = async (pupilId: string) => {
    setConfirmingId(pupilId);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ scheduling_status: "scheduled" })
        .eq("id", pupilId);

      if (error) throw error;
      
      toast.success("Pupil marked as fully scheduled");
      setPendingPupils(prev => prev.filter(p => p.id !== pupilId));
    } catch (error) {
      console.error("Error updating pupil:", error);
      toast.error("Failed to update pupil status");
    } finally {
      setConfirmingId(null);
    }
  };

  const updateBookingMode = async (instructorId: string, newMode: string) => {
    setSavingId(instructorId);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ booking_mode: newMode })
        .eq("id", instructorId);

      if (error) throw error;
      
      toast.success("Booking mode updated");
      setInstructors(prev => 
        prev.map(i => i.id === instructorId ? { ...i, booking_mode: newMode } : i)
      );
      setEditingId(null);
      // Refresh data to update pending pupils if mode changed to/from instructor_assigns
      fetchData();
    } catch (error) {
      console.error("Error updating booking mode:", error);
      toast.error("Failed to update booking mode");
    } finally {
      setSavingId(null);
    }
  };

  // Count by mode
  const modeCounts = {
    pupil_choice: instructors.filter(i => !i.booking_mode || i.booking_mode === "pupil_choice").length,
    auto_assign: instructors.filter(i => i.booking_mode === "auto_assign").length,
    instructor_assigns: instructors.filter(i => i.booking_mode === "instructor_assigns").length,
    enquiry_only: instructors.filter(i => i.booking_mode === "enquiry_only").length,
  };

  const getModeIcon = (mode: string | null) => {
    switch (mode) {
      case "auto_assign": return <Sparkles className="h-4 w-4 text-amber-500" />;
      case "instructor_assigns": return <UserCog className="h-4 w-4 text-emerald-500" />;
      case "enquiry_only": return <Mail className="h-4 w-4" style={{ color: '#2B7BC8' }} />;
      default: return <Calendar className="h-4 w-4 text-primary" />;
    }
  };

  const getModeLabel = (mode: string | null) => {
    switch (mode) {
      case "auto_assign": return "Auto-Assign";
      case "instructor_assigns": return "Instructor Assigns";
      case "enquiry_only": return "Enquiry Only";
      default: return "Pupil Choice";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading booking modes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{modeCounts.pupil_choice}</div>
                <div className="text-sm text-muted-foreground">Pupil Choice</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{modeCounts.auto_assign}</div>
                <div className="text-sm text-muted-foreground">Auto-Assign</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <UserCog className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{modeCounts.instructor_assigns}</div>
                <div className="text-sm text-muted-foreground">Instructor Assigns</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending Schedules
            {pendingPupils.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingPupils.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="instructors" className="gap-2">
            <User className="h-4 w-4" />
            All Instructors
          </TabsTrigger>
        </TabsList>

        {/* Pending Schedules Tab */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Pupils Awaiting Lesson Scheduling
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingPupils.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                  <p className="font-medium">All pupils are fully scheduled!</p>
                  <p className="text-sm">No pending schedules for instructor-led bookings.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPupils.map((pupil) => (
                    <div
                      key={pupil.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {pupil.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{pupil.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3">
                            <span>{pupil.course_type || "Course"}</span>
                            <span>•</span>
                            <span>Instructor: {pupil.instructor_name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            {pupil.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {pupil.email}
                              </span>
                            )}
                            {pupil.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {pupil.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge variant={pupil.scheduled_lessons_count > 0 ? "secondary" : "destructive"}>
                              {pupil.scheduled_lessons_count}/{pupil.prepaid_hours || 0}h scheduled
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Booked {format(new Date(pupil.created_at), "MMM d, yyyy")}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsScheduled(pupil.id)}
                          disabled={confirmingId === pupil.id}
                        >
                          {confirmingId === pupil.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm Scheduled
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Instructors Tab */}
        <TabsContent value="instructors" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Instructor Booking Modes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {instructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={instructor.profile_image_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {instructor.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{instructor.name}</div>
                        {instructor.email && (
                          <div className="text-xs text-muted-foreground">{instructor.email}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingId === instructor.id ? (
                        <Select
                          defaultValue={instructor.booking_mode || "pupil_choice"}
                          onValueChange={(value) => updateBookingMode(instructor.id, value)}
                          disabled={savingId === instructor.id}
                        >
                          <SelectTrigger className="w-[180px]">
                            {savingId === instructor.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pupil_choice">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                Pupil Choice
                              </div>
                            </SelectItem>
                            <SelectItem value="auto_assign">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                Auto-Assign
                              </div>
                            </SelectItem>
                            <SelectItem value="instructor_assigns">
                              <div className="flex items-center gap-2">
                                <UserCog className="h-4 w-4 text-emerald-500" />
                                Instructor Assigns
                              </div>
                            </SelectItem>
                            <SelectItem value="enquiry_only">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" style={{ color: '#2B7BC8' }} />
                                Enquiry Only
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <>
                          <Badge variant="secondary" className="gap-1.5">
                            {getModeIcon(instructor.booking_mode)}
                            {getModeLabel(instructor.booking_mode)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingId(instructor.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
