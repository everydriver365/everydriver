import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

const bespokeEnquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  address: z.string().trim().min(5, "Please enter your full address").max(200, "Address must be less than 200 characters"),
  postcode: z.string().trim().min(5, "Please enter a valid postcode").max(10, "Postcode must be less than 10 characters"),
  course_type: z.string().min(1, "Please select a course type"),
  requested_hours: z.number().min(1, "Please select hours").max(100, "Maximum 100 hours"),
  preferred_timing: z.string().min(1, "Please select your preferred timing"),
  additional_notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

type BespokeEnquiryFormData = z.infer<typeof bespokeEnquirySchema>;

const courseTypes = [
  { value: "intensive", label: "Intensive Course (1-2 weeks)" },
  { value: "semi-intensive", label: "Semi-Intensive Course (3-4 weeks)" },
  { value: "weekly", label: "Weekly Lessons" },
  { value: "refresher", label: "Refresher Course" },
  { value: "pass-plus", label: "Pass Plus" },
  { value: "motorway", label: "Motorway Lessons" },
  { value: "other", label: "Other / Custom" },
];

const hoursOptions = [
  { value: 5, label: "5 hours" },
  { value: 10, label: "10 hours" },
  { value: 15, label: "15 hours" },
  { value: 20, label: "20 hours" },
  { value: 25, label: "25 hours" },
  { value: 30, label: "30 hours" },
  { value: 35, label: "35 hours" },
  { value: 40, label: "40 hours" },
  { value: 50, label: "50 hours" },
];

const timingOptions = [
  { value: "asap", label: "As soon as possible" },
  { value: "this-week", label: "This week" },
  { value: "next-week", label: "Next week" },
  { value: "this-month", label: "Within the next month" },
  { value: "flexible", label: "I'm flexible" },
  { value: "weekdays-morning", label: "Weekday mornings" },
  { value: "weekdays-afternoon", label: "Weekday afternoons" },
  { value: "weekdays-evening", label: "Weekday evenings" },
  { value: "weekends", label: "Weekends only" },
];

export function BespokeEnquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<BespokeEnquiryFormData>({
    resolver: zodResolver(bespokeEnquirySchema),
    defaultValues: {
      requested_hours: 20,
    },
  });

  const selectedHours = watch("requested_hours");

  const onSubmit = async (data: BespokeEnquiryFormData) => {
    setIsSubmitting(true);
    try {
      // Use the edge function to create enquiry and notify instructors
      const { data: result, error } = await supabase.functions.invoke("create-enquiry", {
        body: {
          name: data.name,
          address: data.address,
          postcode: data.postcode.toUpperCase(),
          courseType: data.course_type,
          requestedHours: data.requested_hours,
          preferredTiming: data.preferred_timing,
          additionalNotes: data.additional_notes || null,
        },
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Your bespoke course request has been submitted!");
      if (result?.notified > 0) {
        toast.info(`${result.notified} instructors have been notified`);
      }
      reset();
    } catch (error) {
      console.error("Error submitting enquiry:", error);
      toast.error("Failed to submit your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Request Submitted!</h3>
        <p className="text-muted-foreground mb-4">
          We've received your bespoke course request. An instructor will review it shortly and get in touch.
        </p>
        <Button onClick={() => setIsSubmitted(false)} variant="outline">
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          placeholder="John Smith"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          placeholder="123 High Street, London"
          {...register("address")}
          className={errors.address ? "border-destructive" : ""}
        />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="postcode">Postcode *</Label>
        <Input
          id="postcode"
          placeholder="SW1A 1AA"
          {...register("postcode")}
          className={errors.postcode ? "border-destructive" : ""}
        />
        {errors.postcode && (
          <p className="text-sm text-destructive">{errors.postcode.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="course_type">What type of course are you looking for? *</Label>
        <Select onValueChange={(value) => setValue("course_type", value)}>
          <SelectTrigger className={errors.course_type ? "border-destructive" : ""}>
            <SelectValue placeholder="Select course type" />
          </SelectTrigger>
          <SelectContent>
            {courseTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.course_type && (
          <p className="text-sm text-destructive">{errors.course_type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="requested_hours">How many hours do you need? *</Label>
        <Select 
          value={String(selectedHours || "")}
          onValueChange={(value) => setValue("requested_hours", parseInt(value))}
        >
          <SelectTrigger className={errors.requested_hours ? "border-destructive" : ""}>
            <SelectValue placeholder="Select hours" />
          </SelectTrigger>
          <SelectContent>
            {hoursOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.requested_hours && (
          <p className="text-sm text-destructive">{errors.requested_hours.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_timing">When would you like to start? *</Label>
        <Select onValueChange={(value) => setValue("preferred_timing", value)}>
          <SelectTrigger className={errors.preferred_timing ? "border-destructive" : ""}>
            <SelectValue placeholder="Select your preferred timing" />
          </SelectTrigger>
          <SelectContent>
            {timingOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.preferred_timing && (
          <p className="text-sm text-destructive">{errors.preferred_timing.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional_notes">Additional Notes (optional)</Label>
        <Textarea
          id="additional_notes"
          placeholder="Any specific requirements, previous experience, or questions?"
          rows={3}
          {...register("additional_notes")}
          className={errors.additional_notes ? "border-destructive" : ""}
        />
        {errors.additional_notes && (
          <p className="text-sm text-destructive">{errors.additional_notes.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Bespoke Course Request"
        )}
      </Button>
    </form>
  );
}
