import { useState, useEffect } from "react";
import { Briefcase, MapPin, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { InstructorMobileHeader } from "@/components/instructor/InstructorMobileHeader";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const MOCK_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

interface JobEnquiry {
  id: string;
  name: string;
  postcode: string;
  address: string;
  course_type: string;
  preferred_timing: string;
  requested_hours: number | null;
  additional_notes: string | null;
  created_at: string;
  status: string;
}

export default function InstructorJobs() {
  const [jobs, setJobs] = useState<JobEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("course_enquiries")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("course_enquiries")
        .update({ 
          status: "accepted",
          assigned_instructor_id: MOCK_INSTRUCTOR_ID 
        })
        .eq("id", jobId);

      if (error) throw error;
      
      toast.success("Job accepted! Contact details will be shared.");
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error("Failed to accept job");
    }
  };

  const content = (
    <div className="px-3 md:container py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Available Jobs
        </h1>
        <Badge variant="secondary">{jobs.length} open</Badge>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No available jobs at the moment</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for new enquiries</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="border-l-4 border-l-accent">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{job.name}</h3>
                    <p className="text-sm text-muted-foreground">{job.course_type}</p>
                  </div>
                  <Badge variant="outline">{job.requested_hours || 10}hrs</Badge>
                </div>
                
                <div className="space-y-1 text-sm mb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{job.postcode}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{job.preferred_timing}</span>
                  </div>
                </div>

                {job.additional_notes && (
                  <p className="text-sm bg-muted/50 rounded p-2 mb-3">{job.additional_notes}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(job.created_at), "MMM d, h:mm a")}
                  </span>
                  <Button size="sm" onClick={() => handleAcceptJob(job.id)}>
                    Accept Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Mobile Layout - No header
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <InstructorMobileHeader />
        {content}
        <InstructorBottomNav />
      </div>
    );
  }

  // Desktop Layout
  return (
    <MainLayout>
      {content}
      <InstructorBottomNav />
    </MainLayout>
  );
}
