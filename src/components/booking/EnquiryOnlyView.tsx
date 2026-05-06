import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, Loader2, Clock, MapPin } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  instructor: {
    id: string;
    name: string;
    profile_image_url: string | null;
    brand_colour: string | null;
    home_postcode: string;
  };
  courseName: string;
  hours: number;
  totalPrice: number;
  courseImageUrl: string | null;
  locationName: string;
}

const schema = z.object({
  pupil_name: z.string().trim().min(2, "Please enter your name").max(100),
  pupil_email: z.string().trim().email("Enter a valid email").max(255),
  pupil_phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  pupil_postcode: z.string().trim().max(10).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export function EnquiryOnlyView({
  instructor,
  courseName,
  hours,
  totalPrice,
  courseImageUrl,
  locationName,
}: Props) {
  const navigate = useNavigate();
  const brandColour = instructor.brand_colour || "#1e3a5f";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const parsed = schema.safeParse({
      pupil_name: name,
      pupil_email: email,
      pupil_phone: phone,
      pupil_postcode: postcode,
      message,
    });
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      toast.error(first?.message || "Please check the form");
      return;
    }

    setSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .from("booking_enquiries")
        .insert({
          instructor_id: instructor.id,
          pupil_name: parsed.data.pupil_name,
          pupil_email: parsed.data.pupil_email,
          pupil_phone: parsed.data.pupil_phone,
          pupil_postcode: parsed.data.pupil_postcode || null,
          course_name: courseName,
          course_hours: hours,
          message: parsed.data.message || null,
          source: "mini_website",
        })
        .select("id")
        .single();
      if (error) throw error;

      // Fire-and-forget instructor notification (SMS / WhatsApp / email / push)
      if (inserted?.id) {
        supabase.functions
          .invoke("notify-booking-enquiry", { body: { enquiryId: inserted.id } })
          .catch((err) => console.error("notify-booking-enquiry failed", err));
      }
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't send enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-5 py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold">Enquiry sent</h1>
          <p className="text-muted-foreground">
            Thanks {name.split(" ")[0]} — {instructor.name} will be in touch within 24 hours to arrange your lessons.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#142040]">
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <Avatar className="h-8 w-8 border border-white/20">
              <AvatarImage src={instructor.profile_image_url || undefined} />
              <AvatarFallback style={{ backgroundColor: brandColour, color: "white" }} className="text-xs">
                {instructor.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-white/80 max-w-[80px] truncate">{instructor.name}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">
        <div className="rounded-2xl border bg-card p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" style={{ color: "#2B7BC8" }} />
            <h2 className="font-semibold">Send an enquiry</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            No payment now. {instructor.name} will get back to you to arrange lessons that suit you.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postcode">Postcode <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input id="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value.toUpperCase())} placeholder="SO22" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Anything you'd like the instructor to know — preferred days, experience, test booked etc."
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 text-base"
          style={{ backgroundColor: brandColour, color: "white" }}
        >
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
          Send enquiry
        </Button>
      </div>
    </div>
  );
}
