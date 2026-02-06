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

interface BespokeBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BespokeBookingModal({ open, onOpenChange }: BespokeBookingModalProps) {
  const [step, setStep] = useState(1);
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("job_offer");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("not_paid");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

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
        // Create a course enquiry (Job Offer)
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
        // Direct assignment: create pupil + lesson
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
                      <FormControl><Input placeholder="House number, street, town..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="postcode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl><Input placeholder="e.g. B1 1AA" {...field} /></FormControl>
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
                        <FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl><Textarea rows={2} placeholder="Any additional info..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex justify-end pt-2">
                    <Button type="button" onClick={goToStep2}>
                      Next: Assignment <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Form>
            )}

            {/* Step 2: Assignment */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">How should this booking be assigned?</Label>
                  <RadioGroup value={assignmentType} onValueChange={(v) => setAssignmentType(v as AssignmentType)} className="mt-2 space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <RadioGroupItem value="job_offer" id="assign-job" className="mt-0.5" />
                      <div>
                        <Label htmlFor="assign-job" className="font-medium cursor-pointer">Send as Job Offer</Label>
                        <p className="text-sm text-muted-foreground">
                          Send to all instructors covering {form.getValues("postcode") || "the pupil's area"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <RadioGroupItem value="instructor" id="assign-direct" className="mt-0.5" />
                      <div>
                        <Label htmlFor="assign-direct" className="font-medium cursor-pointer">Assign to specific instructor</Label>
                        <p className="text-sm text-muted-foreground">Pick an instructor from the list below</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {assignmentType === "instructor" && (
                  <div>
                    <Label>Select Instructor</Label>
                    <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose an instructor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.name} — {inst.home_postcode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={goToStep3}>
                    Next: Confirm <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="space-y-4">
                {assignmentType === "instructor" && (
                  <div>
                    <Label>Payment Status</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_paid">Not yet paid</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="rounded-lg border bg-muted/50 p-4 text-sm space-y-1">
                  <p><strong>Name:</strong> {form.getValues("customerName")}</p>
                  <p><strong>Address:</strong> {form.getValues("address")}</p>
                  <p><strong>Postcode:</strong> {form.getValues("postcode")}</p>
                  <p><strong>Transmission:</strong> {form.getValues("transmission") === "manual" ? "Manual" : "Automatic"}</p>
                  {form.getValues("customerEmail") && <p><strong>Email:</strong> {form.getValues("customerEmail")}</p>}
                  {form.getValues("customerPhone") && <p><strong>Phone:</strong> {form.getValues("customerPhone")}</p>}
                  <hr className="my-2 border-border" />
                  <p><strong>Course:</strong> {form.getValues("courseTitle")}</p>
                  <p><strong>Hours:</strong> {form.getValues("courseHours")}</p>
                  <p><strong>Cost:</strong> £{Number(form.getValues("totalCost")).toFixed(2)}</p>
                  <hr className="my-2 border-border" />
                  <p>
                    <strong>Assignment:</strong>{" "}
                    {assignmentType === "job_offer"
                      ? "Job Offer (sent to matching instructors)"
                      : selectedInstructor?.name || "—"}
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {assignmentType === "job_offer" ? "Create Job Offer" : "Complete Booking"}
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
