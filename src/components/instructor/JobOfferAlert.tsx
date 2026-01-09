import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  User, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
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
  status: string;
  created_at: string;
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
  "asap": "ASAP",
  "this-week": "This week",
  "next-week": "Next week",
  "this-month": "This month",
  "flexible": "Flexible",
  "weekdays-morning": "Weekday mornings",
  "weekdays-afternoon": "Weekday afternoons",
  "weekdays-evening": "Weekday evenings",
  "weekends": "Weekends",
};

interface JobOfferAlertProps {
  instructorId: string;
}

export function JobOfferAlert({ instructorId }: JobOfferAlertProps) {
  const [enquiries, setEnquiries] = useState<CourseEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingEnquiries();
  }, []);

  const fetchPendingEnquiries = async () => {
    try {
      const { data, error } = await supabase
        .from("course_enquiries")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEnquiries(data || []);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
    } finally {
      setLoading(false);
    }
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

      setEnquiries((prev) => prev.filter((e) => e.id !== enquiry.id));
      toast.success(`You've accepted ${enquiry.name}'s course request!`);
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
        {enquiries.map((enquiry) => (
          <motion.div
            key={enquiry.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-warning/50 bg-warning/5 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-warning text-warning-foreground">
                          {courseTypeLabels[enquiry.course_type] || enquiry.course_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(enquiry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="mt-2 font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {enquiry.name}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpanded(expanded === enquiry.id ? null : enquiry.id)
                      }
                    >
                      {expanded === enquiry.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Summary */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {enquiry.postcode}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {timingLabels[enquiry.preferred_timing] || enquiry.preferred_timing}
                    </span>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expanded === enquiry.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t pt-3 mt-2"
                      >
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Full Address:</span>
                            <p className="text-muted-foreground">{enquiry.address}</p>
                          </div>
                          {enquiry.additional_notes && (
                            <div>
                              <span className="font-medium">Notes:</span>
                              <p className="text-muted-foreground">{enquiry.additional_notes}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAccept(enquiry)}
                      disabled={processingId === enquiry.id}
                    >
                      {processingId === enquiry.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDecline(enquiry)}
                      disabled={processingId === enquiry.id}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
