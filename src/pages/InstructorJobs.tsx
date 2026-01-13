import { useState, useEffect } from "react";
import { Briefcase, MapPin, Clock, User, Calendar, FileText, ChevronRight, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { InstructorMobileHeader } from "@/components/instructor/InstructorMobileHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorProfile } from "@/hooks/useInstructorProfile";

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
  const [selectedJob, setSelectedJob] = useState<JobEnquiry | null>(null);
  const [processing, setProcessing] = useState(false);
  const isMobile = useIsMobile();
  const { profile } = useInstructorProfile(MOCK_INSTRUCTOR_ID);

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

  const handleAcceptJob = async (job: JobEnquiry) => {
    setProcessing(true);
    try {
      // Update the enquiry status
      const { error: enquiryError } = await supabase
        .from("course_enquiries")
        .update({ 
          status: "accepted",
          assigned_instructor_id: MOCK_INSTRUCTOR_ID 
        })
        .eq("id", job.id);

      if (enquiryError) throw enquiryError;

      // Create a new pupil from this enquiry
      const { error: pupilError } = await supabase
        .from("pupils")
        .insert({
          instructor_id: MOCK_INSTRUCTOR_ID,
          name: job.name,
          address: job.address,
          postcode: job.postcode,
          course_type: job.course_type,
          prepaid_hours: job.requested_hours || 10,
          enquiry_id: job.id,
          notes: job.additional_notes || undefined
        });

      if (pupilError) throw pupilError;
      
      toast.success("Job accepted! Pupil added to your list.");
      setJobs(jobs.filter(j => j.id !== job.id));
      setSelectedJob(null);
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error("Failed to accept job");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineJob = async (job: JobEnquiry) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("course_enquiries")
        .update({ status: "declined" })
        .eq("id", job.id);

      if (error) throw error;
      
      toast.success("Job declined");
      setJobs(jobs.filter(j => j.id !== job.id));
      setSelectedJob(null);
    } catch (error) {
      console.error("Error declining job:", error);
      toast.error("Failed to decline job");
    } finally {
      setProcessing(false);
    }
  };

  // Calculate earnings based on instructor rate
  const calculateEarnings = (hours: number) => {
    const rate = profile?.hourly_rate || 40;
    return hours * rate;
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
            <Card 
              key={job.id} 
              className="border-l-4 border-l-accent cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setSelectedJob(job)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-semibold">{job.name}</h3>
                        <p className="text-sm text-muted-foreground">{job.course_type}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">{job.requested_hours || 10}hrs</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{job.postcode}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{job.preferred_timing}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Job Detail Sheet */}
      <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          {selectedJob && (
            <div className="flex flex-col h-full">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="text-left">Job Details</SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* Client Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedJob.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedJob.course_type}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs uppercase">Hours</span>
                    </div>
                    <p className="font-semibold">{selectedJob.requested_hours || 10} hours</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Briefcase className="h-4 w-4" />
                      <span className="text-xs uppercase">Earnings</span>
                    </div>
                    <p className="font-semibold text-green-600">
                      £{calculateEarnings(selectedJob.requested_hours || 10)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs uppercase">Location</span>
                  </div>
                  <p className="font-medium">{selectedJob.address}</p>
                  <p className="text-sm text-muted-foreground">{selectedJob.postcode}</p>
                </div>

                {/* Preferred Timing */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs uppercase">Preferred Timing</span>
                  </div>
                  <p className="font-medium">{selectedJob.preferred_timing}</p>
                </div>

                {/* Notes */}
                {selectedJob.additional_notes && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <FileText className="h-4 w-4" />
                      <span className="text-xs uppercase">Additional Notes</span>
                    </div>
                    <p className="text-sm">{selectedJob.additional_notes}</p>
                  </div>
                )}

                {/* Request Date */}
                <p className="text-xs text-muted-foreground text-center">
                  Requested on {format(new Date(selectedJob.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDeclineJob(selectedJob)}
                  disabled={processing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleAcceptJob(selectedJob)}
                  disabled={processing}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {processing ? "Processing..." : "Accept Job"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <InstructorMobileHeader 
          instructorName={profile?.name}
          profileImageUrl={profile?.profile_image_url}
        />
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
