import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, Phone, Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ScheduleLessonsDialog } from "@/components/instructor/ScheduleLessonsDialog";

interface PendingPupil {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  prepaid_hours: number;
  preferred_times: string[] | null;
  preferred_days: string[] | null;
  scheduling_status: string | null;
  created_at: string;
  scheduled_hours: number;
}

export default function InstructorPendingScheduling() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const [selectedPupil, setSelectedPupil] = useState<PendingPupil | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: pendingPupils = [], isLoading, refetch } = useQuery({
    queryKey: ['pending-scheduling-pupils', instructorId],
    queryFn: async () => {
      if (!instructorId) return [];

      // Get pupils with prepaid hours who need scheduling
      const { data: pupils, error } = await supabase
        .from('pupils')
        .select('*')
        .eq('instructor_id', instructorId)
        .gt('prepaid_hours', 0)
        .or('scheduling_status.is.null,scheduling_status.neq.scheduled');

      if (error) throw error;

      // For each pupil, calculate how many hours are already scheduled
      const pupilsWithScheduledHours = await Promise.all(
        (pupils || []).map(async (pupil) => {
          const { data: lessons } = await supabase
            .from('scheduled_lessons')
            .select('duration_minutes')
            .eq('pupil_id', pupil.id)
            .in('status', ['scheduled', 'completed']);

          const scheduledMinutes = lessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
          const scheduledHours = scheduledMinutes / 60;

          return {
            ...pupil,
            scheduled_hours: scheduledHours,
          };
        })
      );

      // Filter to only show pupils who still need lessons scheduled
      return pupilsWithScheduledHours.filter(
        (p) => p.scheduled_hours < (p.prepaid_hours || 0)
      ) as PendingPupil[];
    },
    enabled: !!instructorId,
  });

  const handleScheduleClick = (pupil: PendingPupil) => {
    setSelectedPupil(pupil);
    setIsDialogOpen(true);
  };

  const handleScheduleSuccess = async () => {
    setIsDialogOpen(false);
    setSelectedPupil(null);
    await refetch();
    toast.success("Lessons scheduled successfully!");
  };

  const markAsFullyScheduled = async (pupilId: string) => {
    const { error } = await supabase
      .from('pupils')
      .update({ scheduling_status: 'scheduled' })
      .eq('id', pupilId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success("Marked as fully scheduled");
    refetch();
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Pending Scheduling</h1>
              <p className="text-sm text-muted-foreground">
                Pupils awaiting lesson scheduling
              </p>
            </div>
          </div>
          {pendingPupils.length > 0 && (
            <Badge variant="secondary" className="text-base px-3 py-1">
              {pendingPupils.length} pending
            </Badge>
          )}
        </div>

        {/* Info Banner */}
        <Card className="border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm text-primary/80 dark:text-primary/70">
                <p className="font-medium mb-1">These pupils have booked and paid but their lessons haven't been scheduled yet.</p>
                <p>Click "Schedule Lessons" to add their lessons to your calendar, then they'll receive a confirmation.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && pendingPupils.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground text-center max-w-md">
                All your pupils have their lessons scheduled. New bookings will appear here when pupils choose "Instructor Assigns" scheduling.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pending Pupils List */}
        {!isLoading && pendingPupils.length > 0 && (
          <div className="grid gap-4">
            {pendingPupils.map((pupil) => {
              const remainingHours = (pupil.prepaid_hours || 0) - pupil.scheduled_hours;
              
              return (
                <Card key={pupil.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{pupil.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Booked {format(new Date(pupil.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
                      >
                        {remainingHours}h to schedule
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${pupil.phone}`} className="hover:underline">{pupil.phone}</a>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${pupil.email}`} className="hover:underline truncate">{pupil.email}</a>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{pupil.address}, {pupil.postcode}</span>
                      </div>
                    </div>

                    {/* Preferences */}
                    {(pupil.preferred_days?.length || pupil.preferred_times?.length) && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2">PREFERENCES</p>
                        <div className="flex flex-wrap gap-2">
                          {pupil.preferred_days?.map((day) => (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {day}
                            </Badge>
                          ))}
                          {pupil.preferred_times?.map((time) => (
                            <Badge key={time} variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hours Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Scheduling Progress</span>
                        <span className="font-medium">
                          {pupil.scheduled_hours}h / {pupil.prepaid_hours}h
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ 
                            width: `${Math.min(100, (pupil.scheduled_hours / (pupil.prepaid_hours || 1)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => handleScheduleClick(pupil)}
                        className="flex-1"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Lessons
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => markAsFullyScheduled(pupil.id)}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Dialog */}
      {selectedPupil && (
        <ScheduleLessonsDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          pupil={selectedPupil}
          instructorId={instructorId}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </InstructorPortalLayout>
  );
}
