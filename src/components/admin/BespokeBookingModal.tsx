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
import { Label } from "@/components/ui/label";
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
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

// Step 1 schema
const courseSchema = z.object({
  courseTitle: z.string().trim().min(1, "Course title is required").max(200),
  courseHours: z.coerce.number().min(1, "Must be at least 1 hour").max(500),
  totalCost: z.coerce.number().min(0.01, "Cost must be greater than 0"),
  customerName: z.string().trim().min(1, "Customer name is required").max(200),
  customerEmail: z.string().trim().email("Invalid email").max(255).or(z.literal("")),
  customerPhone: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(1000).optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

type PaymentMethod = "card" | "cash" | "bank_transfer";

interface BespokeBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BespokeBookingModal({ open, onOpenChange }: BespokeBookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseTitle: "",
      courseHours: 10,
      totalCost: 0,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
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
    setSelectedInstructorId("");
    setPaymentMethod("cash");
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
    if (!selectedInstructorId) {
      toast.error("Please select an instructor");
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const values = form.getValues();

      // 1. Create a pupil record for this customer
      const { data: pupil, error: pupilError } = await supabase
        .from("pupils")
        .insert({
          instructor_id: selectedInstructorId,
          name: values.customerName,
          email: values.customerEmail || null,
          phone: values.customerPhone || null,
          address: "Bespoke booking",
          postcode: "N/A",
          course_type: values.courseTitle,
          notes: values.notes || null,
        })
        .select("id")
        .single();

      if (pupilError) throw pupilError;

      // 2. Create the scheduled lesson
      const today = new Date().toISOString().split("T")[0];
      const { data: lesson, error: lessonError } = await supabase
        .from("scheduled_lessons")
        .insert({
          instructor_id: selectedInstructorId,
          pupil_id: pupil.id,
          lesson_date: today,
          start_time: "09:00",
          duration_minutes: values.courseHours * 60,
          lesson_type: values.courseTitle,
          status: "confirmed",
          payment_status: paymentMethod === "card" ? "not_paid" : "paid",
          amount_due: values.totalCost,
          notes: `Bespoke booking: ${values.courseTitle} (${values.courseHours}hrs) - Payment: ${paymentMethod}${values.notes ? `\n${values.notes}` : ""}`,
        })
        .select("id")
        .single();

      if (lessonError) throw lessonError;

      // 3. Record payment for cash/bank transfer
      if (paymentMethod !== "card") {
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

      // 4. For card payments, create a payment intent
      if (paymentMethod === "card") {
        const { data: intentData, error: intentError } = await supabase.functions.invoke(
          "payment-intent-create",
          {
            body: {
              pupilId: pupil.id,
              instructorId: selectedInstructorId,
              amount: values.totalCost,
              customerName: values.customerName,
              customerEmail: values.customerEmail || undefined,
            },
          }
        );

        if (intentError) throw intentError;

        toast.success(
          `Payment intent created (Ref: ${intentData?.orderRef}). Card payment can be completed separately.`
        );
      }

      setIsComplete(true);
      toast.success("Bespoke booking created successfully!");
    } catch (err) {
      console.error("Bespoke booking error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isComplete
              ? "Booking Created"
              : `Create Bespoke Booking — Step ${step} of 3`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Enter the course and customer details."}
            {step === 2 && "Choose which instructor to assign."}
            {step === 3 && "Select a payment method to complete."}
            {isComplete && "The booking has been saved successfully."}
          </DialogDescription>
        </DialogHeader>

        {isComplete ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="h-16 w-16 text-accent" />
            <p className="text-center text-muted-foreground">
              Booking for <strong>{form.getValues("customerName")}</strong> has been created
              and assigned to the selected instructor.
            </p>
            <Button onClick={() => handleClose(false)}>Close</Button>
          </div>
        ) : (
          <>
            {/* Step 1: Course Details */}
            {step === 1 && (
              <Form {...form}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="courseTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 30hr Intensive Course" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="courseHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hours</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="totalCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Cost (£)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step={0.01} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Optional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea rows={2} placeholder="Any additional info..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-2">
                    <Button type="button" onClick={goToStep2}>
                      Next: Assign Instructor <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Form>
            )}

            {/* Step 2: Assign Instructor */}
            {step === 2 && (
              <div className="space-y-4">
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
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={goToStep3}>
                    Next: Payment <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="card">Card (Online)</SelectItem>
                    </SelectContent>
                  </Select>
                  {paymentMethod === "card" && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      A payment intent will be created. You can send the customer a payment
                      link or take payment via the hosted card form.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/50 p-4 text-sm space-y-1">
                  <p><strong>Course:</strong> {form.getValues("courseTitle")}</p>
                  <p><strong>Hours:</strong> {form.getValues("courseHours")}</p>
                  <p><strong>Cost:</strong> £{Number(form.getValues("totalCost")).toFixed(2)}</p>
                  <p><strong>Customer:</strong> {form.getValues("customerName")}</p>
                  <p>
                    <strong>Instructor:</strong>{" "}
                    {instructors.find((i) => i.id === selectedInstructorId)?.name || "—"}
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Complete Booking
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
