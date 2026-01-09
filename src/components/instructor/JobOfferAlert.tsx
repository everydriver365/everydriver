import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { PostcodeMapPreview } from "./PostcodeMapPreview";
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  User, 
  Check, 
  X, 
  Clock,
  PoundSterling,
  Home,
  FileText,
  Loader2 
} from "lucide-react";

interface CourseEnquiry {
  id: string;
  name: string;
  address: string;
  postcode: string;
  course_type: string;
  preferred_timing: string;
  additional_notes: string | null;
  requested_hours: number | null;
  status: string;
  created_at: string;
}

interface Instructor {
  hourly_rate: number | null;
  school_skim_percentage: number | null;
}

const courseTypeLabels: Record<string, string> = {
  "intensive": "Intensive Course",
  "semi-intensive": "Semi-Intensive Course",
  "weekly": "Weekly Lessons",
  "refresher": "Refresher Course",
  "pass-plus": "Pass Plus",
  "motorway": "Motorway Lessons",
  "other": "Custom Course",
};

const timingLabels: Record<string, string> = {
  "asap": "As soon as possible",
  "this-week": "This week",
  "next-week": "Next week",
  "this-month": "Within the next month",
  "flexible": "Flexible timing",
  "weekdays-morning": "Weekday mornings",
  "weekdays-afternoon": "Weekday afternoons",
  "weekdays-evening": "Weekday evenings",
  "weekends": "Weekends only",
};

interface JobOfferAlertProps {
  instructorId: string;
}

export function JobOfferAlert({ instructorId }: JobOfferAlertProps) {
  const [enquiries, setEnquiries] = useState<CourseEnquiry[]>([]);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [instructorId]);

  const fetchData = async () => {
    try {
      // Fetch pending enquiries
      const { data: enquiriesData, error: enquiriesError } = await supabase
        .from("course_enquiries")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (enquiriesError) throw enquiriesError;
      setEnquiries(enquiriesData || []);

      // Fetch instructor details for payment calculation
      const { data: instructorData, error: instructorError } = await supabase
        .from("instructors")
        .select("hourly_rate, school_skim_percentage")
        .eq("id", instructorId)
        .maybeSingle();

      if (!instructorError && instructorData) {
        setInstructor(instructorData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayment = (hours: number) => {
    const hourlyRate = instructor?.hourly_rate || 35; // Default £35/hour
    const skimPercentage = instructor?.school_skim_percentage || 0;
    const grossAmount = hours * hourlyRate;
    const skimAmount = grossAmount * (skimPercentage / 100);
    const netAmount = grossAmount - skimAmount;
    return { grossAmount, skimAmount, netAmount, hourlyRate };
  };

  const handleAccept = async (enquiry: CourseEnquiry) => {
    setProcessingId(enquiry.id);
    try {
      // Create new pupil from the enquiry
      const { error: pupilError } = await supabase.from("pupils").insert({
        instructor_id: instructorId,
        name: enquiry.name,
        address: enquiry.address,
        postcode: enquiry.postcode,
        course_type: enquiry.course_type,
        enquiry_id: enquiry.id,
        lessons_completed: 0,
        progress: 0,
      });

      if (pupilError) throw pupilError;

      // Update enquiry status
      const { error: updateError } = await supabase
        .from("course_enquiries")
        .update({ 
          status: "accepted", 
          assigned_instructor_id: instructorId 
        })
        .eq("id", enquiry.id);

      if (updateError) throw updateError;

      const payment = calculatePayment(enquiry.requested_hours || 10);
      setEnquiries((prev) => prev.filter((e) => e.id !== enquiry.id));
      toast.success(`You've accepted ${enquiry.name}'s course! You'll earn £${payment.netAmount.toFixed(0)}`);
    } catch (error) {
      console.error("Error accepting enquiry:", error);
      toast.error("Failed to accept the request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (enquiry: CourseEnquiry) => {
    setProcessingId(enquiry.id);
    try {
      const { error } = await supabase
        .from("course_enquiries")
        .update({ status: "declined" })
        .eq("id", enquiry.id);

      if (error) throw error;

      setEnquiries((prev) => prev.filter((e) => e.id !== enquiry.id));
      toast.info(`You've declined ${enquiry.name}'s request.`);
    } catch (error) {
      console.error("Error declining enquiry:", error);
      toast.error("Failed to decline the request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <Card className="border-accent bg-accent/5">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (enquiries.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-accent" />
        <h2 className="font-semibold">
          New Job Offers{" "}
          <Badge variant="secondary" className="ml-1">
            {enquiries.length}
          </Badge>
        </h2>
      </div>

      <AnimatePresence>
        {enquiries.map((enquiry) => {
          const hours = enquiry.requested_hours || 10;
          const payment = calculatePayment(hours);

          return (
            <motion.div
              key={enquiry.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-success/50 bg-gradient-to-br from-success/5 to-success/10 overflow-hidden">
                <CardContent className="p-0">
                  {/* Payment Banner */}
                  <div className="bg-success/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PoundSterling className="h-5 w-5 text-success" />
                      <span className="font-semibold text-success">
                        You'll Earn
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-success">
                        £{payment.netAmount.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {hours} hours × £{payment.hourlyRate}/hr
                        {payment.skimAmount > 0 && (
                          <span> (- £{payment.skimAmount.toFixed(0)} platform fee)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Header with Course Type and Date */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge className="bg-primary text-primary-foreground mb-2">
                          {courseTypeLabels[enquiry.course_type] || enquiry.course_type}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          Requested {new Date(enquiry.created_at).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {hours} hours
                      </Badge>
                    </div>

                    {/* Client Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                          {enquiry.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{enquiry.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {enquiry.postcode}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Map Preview */}
                      <PostcodeMapPreview postcode={enquiry.postcode} />

                      {/* Full Details Grid */}
                      <div className="grid gap-3 text-sm">
                        <div className="flex items-start gap-2">
                          <Home className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div>
                            <div className="font-medium">Full Address</div>
                            <div className="text-muted-foreground">{enquiry.address}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div>
                            <div className="font-medium">Preferred Timing</div>
                            <div className="text-muted-foreground">
                              {timingLabels[enquiry.preferred_timing] || enquiry.preferred_timing}
                            </div>
                          </div>
                        </div>

                        {enquiry.additional_notes && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                              <div className="font-medium">Client Notes</div>
                              <div className="text-muted-foreground">{enquiry.additional_notes}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="lg"
                        className="flex-1"
                        onClick={() => handleAccept(enquiry)}
                        disabled={processingId === enquiry.id}
                      >
                        {processingId === enquiry.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Accept Job
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleDecline(enquiry)}
                        disabled={processingId === enquiry.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
