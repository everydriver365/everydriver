import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EnquiryForm, type EnquiryFormValues } from "./EnquiryForm";
import { EnquiryConfirmation } from "./EnquiryConfirmation";

interface InstructorLite {
  id: string;
  name: string;
  profile_image_url: string | null;
  brand_colour: string | null;
  home_postcode: string;
  typical_response_hours?: number | null;
  car_type?: string | null;
  location_name?: string | null;
}

interface Props {
  instructor: InstructorLite;
  courseName: string;
  hours: number;
  totalPrice: number;
  courseImageUrl: string | null;
  locationName: string;
}

export function EnquiryFlow({
  instructor,
  courseName,
  hours,
  totalPrice,
  courseImageUrl,
  locationName,
}: Props) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = async (values: EnquiryFormValues) => {
    setSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .from("booking_enquiries")
        .insert({
          instructor_id: instructor.id,
          pupil_name: values.name,
          pupil_email: values.email,
          pupil_phone: values.phone,
          pupil_postcode: values.postcode || null,
          course_name: courseName,
          course_hours: hours,
          message: values.message || null,
          source: "mini_website",
          source_page: typeof window !== "undefined" ? window.location.pathname + window.location.search : null,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Fire-and-forget: instructor notification (existing) + new admin notification.
      // Email failures must NEVER block the confirmation screen.
      if (inserted?.id) {
        supabase.functions
          .invoke("notify-booking-enquiry", { body: { enquiryId: inserted.id } })
          .catch((err) => console.error("notify-booking-enquiry failed", err));
        supabase.functions
          .invoke("notify-admin-enquiry", { body: { enquiryId: inserted.id } })
          .catch((err) => console.error("notify-admin-enquiry failed", err));
      }

      setSubmittedEmail(values.email);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't send enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#f4f6fa" }}>
      {/* Drive365 navy header */}
      <div className="sticky top-0 z-50" style={{ background: "#142040" }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold flex-1 truncate text-white">{courseName}</h1>
          <span className="text-sm font-medium text-white/80">from £{totalPrice}</span>
        </div>
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
            <img
              src={courseImageUrl || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=200"}
              alt={courseName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 text-xs text-white/70">
            <span className="inline-flex items-center gap-1 mr-2">
              <Clock className="h-3 w-3" />{hours}h
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />{locationName || instructor.home_postcode}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-6 pb-12 px-4">
        {submittedEmail ? (
          <EnquiryConfirmation instructor={instructor} submittedEmail={submittedEmail} />
        ) : (
          <EnquiryForm instructor={instructor} submitting={submitting} onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}
