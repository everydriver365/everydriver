import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";

const formSchema = z.object({
  customerName: z.string().trim().min(1, "Name is required").max(200),
  address: z.string().trim().min(1, "Address is required").max(500),
  postcode: z.string().trim().min(1, "Postcode is required").max(15),
  customerEmail: z.string().trim().email("Invalid email").max(255).or(z.literal("")),
  customerPhone: z.string().trim().max(30).optional(),
  transmission: z.enum(["manual", "automatic"]),
  courseTitle: z.string().trim().min(1, "Course title is required").max(200),
  courseHours: z.coerce.number().min(1, "Must be at least 1 hour").max(500),
  totalCost: z.coerce.number().min(0, "Cost cannot be negative"),
  notes: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;
type AssignmentType = "instructor" | "job_offer";
type PaymentMethod = "cash" | "bank_transfer" | "not_paid";

interface BespokePrefill {
  instructorId?: string;
  date?: string;
  time?: string;
  duration?: string;
}

interface BespokeBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: BespokePrefill;
}

export function BespokeBookingModal({ open, onOpenChange, prefill }: BespokeBookingModalProps) {
  const [step, setStep] = useState(1);
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("job_offer");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("not_paid");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Apply prefill on open
  useState(() => {
    if (prefill?.instructorId) {
      setSelectedInstructorId(prefill.instructorId);
      setAssignmentType("instructor");
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      address: "",
      postcode: "",
      customerEmail: "",
      customerPhone: "",
      transmission: "manual",
      courseTitle: "",
      courseHours: 10,
      totalCost: 0,
      notes: "",
    },
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ["admin-instructors-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, name, home_postcode, is_active")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const resetModal = () => {
    setStep(1);
    setAssignmentType("job_offer");
    setSelectedInstructorId("");
    setPaymentMethod("not_paid");
    setIsSubmitting(false);
    setIsComplete(false);
    form.reset();
  };

  const handleClose = (val: boolean) => {
    if (!val) resetModal();
    onOpenChange(val);
  };

  const goToStep2 = async () => {
    const valid = await form.trigger();
    if (valid) setStep(2);
  };

  const goToStep3 = () => {
    if (assignmentType === "instructor" && !selectedInstructorId) {
      toast.error("Please select an instructor");
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const values = form.getValues();

      if (assignmentType === "job_offer") {
        const { error } = await supabase.from("course_enquiries").insert({
          name: values.customerName,
          address: values.address,
          postcode: values.postcode,
          email: values.customerEmail || null,
          phone: values.customerPhone || null,
          transmission_type: values.transmission,
          course_type: values.courseTitle,
          requested_hours: values.courseHours,
          total_cost: values.totalCost || null,
          preferred_timing: "Flexible",
          additional_notes: values.notes || null,
          status: "pending",
        });
        if (error) throw error;
        toast.success("Job offer created and will be sent to matching instructors!");
      } else {
        const { data: pupil, error: pupilError } = await supabase
          .from("pupils")
          .insert({
            instructor_id: selectedInstructorId,
            name: values.customerName,
            email: values.customerEmail || null,
            phone: values.customerPhone || null,
            address: values.address,
            postcode: values.postcode,
            transmission_type: values.transmission,
            course_type: values.courseTitle,
            notes: values.notes || null,
          })
          .select("id")
          .single();
        if (pupilError) throw pupilError;

        const today = new Date().toISOString().split("T")[0];
        const { error: lessonError } = await supabase
          .from("scheduled_lessons")
          .insert({
            instructor_id: selectedInstructorId,
            pupil_id: pupil.id,
            lesson_date: today,
            start_time: "09:00",
            duration_minutes: values.courseHours * 60,
            lesson_type: values.courseTitle,
            status: "confirmed",
            payment_status: paymentMethod === "not_paid" ? "not_paid" : "paid",
            amount_due: values.totalCost,
            notes: `Bespoke: ${values.courseTitle} (${values.courseHours}hrs) - ${values.transmission}`,
          });
        if (lessonError) throw lessonError;

        if (paymentMethod !== "not_paid") {
          const { error: paymentError } = await supabase
            .from("payment_history")
            .insert({
              instructor_id: selectedInstructorId,
              pupil_id: pupil.id,
              amount: values.totalCost,
              payment_method: paymentMethod === "cash" ? "cash" : "bank_transfer",
              notes: `Bespoke: ${values.courseTitle} (${values.courseHours}hrs)`,
            });
          if (paymentError) throw paymentError;
        }

        toast.success("Booking created and assigned to instructor!");
      }

      setIsComplete(true);
    } catch (err) {
      console.error("Bespoke booking error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedInstructor = instructors.find((i) => i.id === selectedInstructorId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isComplete ? "Booking Created" : `Create Bespoke Booking — Step ${step} of 3`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Enter the pupil and course details."}
            {step === 2 && "Assign to an instructor or send as a job offer."}
            {step === 3 && "Review and confirm the booking."}
            {isComplete && "The booking has been saved successfully."}
          </DialogDescription>
        </DialogHeader>

        {isComplete ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="h-16 w-16 text-accent" />
            <p className="text-center text-muted-foreground">
              {assignmentType === "job_offer"
                ? `Job offer for "${form.getValues("courseTitle")}" has been created and will be sent to instructors covering ${form.getValues("postcode")}.`
                : `Booking for ${form.getValues("customerName")} has been assigned to ${selectedInstructor?.name || "the instructor"}.`}
            </p>
            <Button onClick={() => handleClose(false)}>Close</Button>
          </div>
        ) : (
          <>
            {/* Step 1: Pupil & Course Details */}
            {step === 1 && (
              <Form {...form}>
                <div className="space-y-4">
                  <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <GoogleAddressAutocomplete
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          onPostcodeChange={(postcode) => {
                            form.setValue("postcode", postcode, { shouldValidate: true });
                          }}
                          placeholder="Start typing an address..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="postcode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl><Input placeholder="Auto-filled from address" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="transmission" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transmission</FormLabel>
                        <FormControl>
                          <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4 pt-2">
                            <div className="flex items-center gap-1.5">
                              <RadioGroupItem value="manual" id="tx-manual" />
                              <Label htmlFor="tx-manual" className="font-normal">Manual</Label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <RadioGroupItem value="automatic" id="tx-auto" />
                              <Label htmlFor="tx-auto" className="font-normal">Automatic</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="customerEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="Optional" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input placeholder="Optional" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <hr className="border-border" />

                  <FormField control={form.control} name="courseTitle" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl><Input placeholder="e.g. 30hr Intensive Course" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="courseHours" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours</FormLabel>
                        <FormControl><Input type="number" min={1} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="totalCost" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Cost (£)</FormLabel>
                        <FormControl><Input type="number" min={0} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl><Textarea placeholder="Any additional info..." rows={2} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="button" className="w-full" onClick={goToStep2}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Form>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">How should this booking be handled?</Label>
                  <RadioGroup value={assignmentType} onValueChange={(v) => setAssignmentType(v as AssignmentType)}>
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setAssignmentType("job_offer")}>
                      <RadioGroupItem value="job_offer" id="job-offer" className="mt-0.5" />
                      <div>
                        <Label htmlFor="job-offer" className="font-medium cursor-pointer">Send as Job Offer</Label>
                        <p className="text-sm text-muted-foreground mt-0.5">Instructors in the area can accept this booking</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setAssignmentType("instructor")}>
                      <RadioGroupItem value="instructor" id="direct-assign" className="mt-0.5" />
                      <div>
                        <Label htmlFor="direct-assign" className="font-medium cursor-pointer">Assign to Instructor</Label>
                        <p className="text-sm text-muted-foreground mt-0.5">Directly assign to a specific instructor</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {assignmentType === "instructor" && (
                  <div className="space-y-2">
                    <Label>Select Instructor</Label>
                    <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.name} {inst.home_postcode ? `(${inst.home_postcode})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {assignmentType === "instructor" && (
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_paid">Not Paid</SelectItem>
                        <SelectItem value="cash">Paid — Cash</SelectItem>
                        <SelectItem value="bank_transfer">Paid — Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button className="flex-1" onClick={goToStep3}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Pupil</span><span className="font-medium">{form.getValues("customerName")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium text-right max-w-[60%]">{form.getValues("address")}, {form.getValues("postcode")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Course</span><span className="font-medium">{form.getValues("courseTitle")} ({form.getValues("courseHours")}hrs)</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span className="font-medium">£{form.getValues("totalCost")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Transmission</span><span className="font-medium capitalize">{form.getValues("transmission")}</span></div>
                  <hr className="border-border" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assignment</span>
                    <span className="font-medium">{assignmentType === "job_offer" ? "Job Offer" : selectedInstructor?.name || "—"}</span>
                  </div>
                  {assignmentType === "instructor" && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-medium capitalize">{paymentMethod.replace("_", " ")}</span></div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Confirm Booking"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
