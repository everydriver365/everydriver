import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Briefcase } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { JobOfferCard } from "@/components/instructor/JobOfferCard";
import { EmptyState } from "@/components/instructor/EmptyState";
import { JobOfferDetailSheet } from "@/components/instructor/JobOfferDetailSheet";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorProfile } from "@/hooks/useInstructorProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const { instructor: authInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  const { profile } = useInstructorProfile(instructorId || "");
  
  const [jobs, setJobs] = useState<JobEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobEnquiry | null>(null);
  const [processing, setProcessing] = useState(false);
  const [jobDistances, setJobDistances] = useState<Record<string, number | null>>({});

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch distances for all jobs
  const fetchDistances = useCallback(async (jobList: JobEnquiry[]) => {
    if (!profile?.home_postcode || jobList.length === 0) return;

    try {
      const postcodes = [profile.home_postcode, ...jobList.map(j => j.postcode)];
      const { data, error } = await supabase.functions.invoke("geocode-postcode", {
        body: { postcodes },
      });

      if (error) throw error;

      const results = data?.results || [];
      const homeCoords = results[0];
      
      if (!homeCoords?.latitude || !homeCoords?.longitude) return;

      const distances: Record<string, number | null> = {};
      jobList.forEach((job, index) => {
        const jobCoords = results[index + 1];
        if (jobCoords?.latitude && jobCoords?.longitude) {
          distances[job.id] = calculateDistance(
            homeCoords.latitude, 
            homeCoords.longitude, 
            jobCoords.latitude, 
            jobCoords.longitude
          );
        } else {
          distances[job.id] = null;
        }
      });

      setJobDistances(distances);
    } catch (err) {
      console.error("Error calculating distances:", err);
    }
  }, [profile?.home_postcode]);

  useEffect(() => {
    if (instructorId) {
      fetchJobs();
    }
  }, [instructorId]);

  // Fetch distances when jobs or profile changes
  useEffect(() => {
    if (jobs.length > 0 && profile?.home_postcode) {
      fetchDistances(jobs);
    }
  }, [jobs, profile?.home_postcode, fetchDistances]);

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
    if (!instructorId) return;
    setProcessing(true);
    try {
      // Update the enquiry status
      const { error: enquiryError } = await supabase
        .from("course_enquiries")
        .update({ 
          status: "accepted",
          assigned_instructor_id: instructorId 
        })
        .eq("id", job.id);

      if (enquiryError) throw enquiryError;

      // Create a new pupil from this enquiry
      const { error: pupilError } = await supabase
        .from("pupils")
        .insert({
          instructor_id: instructorId,
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
      <div
        className="pb-24"
        style={{ background: "#F2F2F4", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
      >
        {/* Page header card */}
        <div
          className="flex items-center"
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#F1ECFA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Briefcase size={22} strokeWidth={2} color="#8A5BC9" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#6E6E73",
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                margin: "0 0 2px",
              }}
            >
              Opportunities
            </p>
            <h1
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: "#000000",
                letterSpacing: "-0.3px",
                margin: 0,
              }}
            >
              Available jobs
            </h1>
          </div>
          {jobs.length > 0 && (
            <span
              style={{
                background: "#F1ECFA",
                color: "#8A5BC9",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              {jobs.length} new
            </span>
          )}
        </div>

        {loading ? (
          <div
            className="text-center"
            style={{
              background: "#FFFFFF",
              border: "0.5px solid #E5E5EA",
              borderRadius: 12,
              padding: 24,
              fontSize: 13,
              color: "#6E6E73",
            }}
          >
            Loading jobs…
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No new opportunities"
            subtitle="Check back soon — new offers come in regularly"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <AnimatePresence initial={false}>
              {jobs.map((job) => (
                <JobOfferCard
                  key={job.id}
                  offer={job}
                  distanceMi={jobDistances[job.id] ?? null}
                  onExpand={() => setSelectedJob(job)}
                  onAccept={() => handleAcceptJob(job)}
                  onDecline={() => handleDeclineJob(job)}
                  processing={processing}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Job Offer Detail Sheet */}
        <JobOfferDetailSheet
          job={selectedJob}
          distanceMi={selectedJob ? jobDistances[selectedJob.id] ?? null : null}
          hourlyRate={profile?.hourly_rate ?? 40}
          processing={processing}
          onClose={() => setSelectedJob(null)}
          onAccept={() => selectedJob && handleAcceptJob(selectedJob)}
          onDecline={() => selectedJob && handleDeclineJob(selectedJob)}
        />
      </div>
    </InstructorPortalLayout>
  );
}
