import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TestCentre {
  id: string;
  name: string;
}

const signupSchema = z
  .object({
    full_name: z.string().trim().min(2, "Please enter your name").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
    phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
    current_centre_id: z.string().uuid().optional().nullable(),
    current_centre_name: z.string().max(120).optional().nullable(),
    has_test_booked: z.boolean(),
    current_test_date: z.string().optional().nullable(),
    current_test_time: z.string().optional().nullable(),
    earliest_new_date: z.string().min(1, "Required"),
    latest_new_date: z.string().min(1, "Required"),
    notes: z.string().max(1000).optional().nullable(),
    consent_given: z.literal(true, {
      errorMap: () => ({ message: "You must agree to be contacted" }),
    }),
  })
  .refine(
    (v) =>
      !v.has_test_booked ||
      (!!v.current_test_date && !!v.current_test_time && !!v.current_centre_id),
    {
      message: "Please give your current test centre, date and time",
      path: ["current_test_date"],
    }
  )
  .refine((v) => new Date(v.latest_new_date) >= new Date(v.earliest_new_date), {
    message: "Latest date must be on or after earliest date",
    path: ["latest_new_date"],
  });

export default function TestSwapRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [centres, setCentres] = useState<TestCentre[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    current_centre_id: "" as string,
    has_test_booked: true,
    current_test_date: "",
    current_test_time: "",
    earliest_new_date: "",
    latest_new_date: "",
    notes: "",
    consent_given: false,
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("test_centres")
        .select("id, name")
        .order("name");
      setCentres((data as TestCentre[] | null) ?? []);
    })();
  }, []);

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const centreName =
      centres.find((c) => c.id === form.current_centre_id)?.name ?? null;

    const parsed = signupSchema.safeParse({
      ...form,
      current_centre_id: form.current_centre_id || null,
      current_centre_name: centreName,
      current_test_date: form.current_test_date || null,
      current_test_time: form.current_test_time || null,
      notes: form.notes || null,
    });

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      toast({
        title: "Please check the form",
        description: first?.message ?? "Some fields need attention.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("public_test_swap_signups")
      .insert(parsed.data as any);

    setSubmitting(false);

    if (error) {
      toast({
        title: "Couldn't submit",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setDone(true);
  };

  return (
    <MainLayout>
      <SEOHead
        title="Register for a Driving Test Swap | Drive365"
        description="Join the free Drive365 test swap pool. Tell us your current DVSA test date and the dates you'd prefer — we'll match you with another learner."
      />

      <section className="py-10 md:py-14">
        <div className="container max-w-2xl">
          <Link
            to="/test-swap"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Test Swap
          </Link>

          {done ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">You're on the list</h1>
              <p className="text-muted-foreground mb-6">
                We'll email you as soon as we find a learner whose test date
                matches what you're after. Keep an eye on your inbox.
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => navigate("/test-swap")} variant="outline">
                  Back to Test Swap
                </Button>
                <Button onClick={() => navigate("/drive365")}>Drive365 home</Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Register for a test swap
              </h1>
              <p className="text-muted-foreground mb-8">
                Free and secure. Tell us your current test details and the dates
                you'd prefer, and we'll match you with another learner.
              </p>

              <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-2xl border bg-card p-6 md:p-8"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="full_name">Full name *</Label>
                    <Input
                      id="full_name"
                      value={form.full_name}
                      onChange={(e) => setField("full_name", e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Mobile number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      maxLength={30}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="has_test_booked"
                      checked={form.has_test_booked}
                      onCheckedChange={(c) =>
                        setField("has_test_booked", c === true)
                      }
                    />
                    <Label
                      htmlFor="has_test_booked"
                      className="text-sm font-normal leading-tight"
                    >
                      I already have a test date booked and want to swap it
                    </Label>
                  </div>

                  {form.has_test_booked && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label>Current test centre *</Label>
                        <Select
                          value={form.current_centre_id}
                          onValueChange={(v) => setField("current_centre_id", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your test centre" />
                          </SelectTrigger>
                          <SelectContent>
                            {centres.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="current_test_date">Current test date *</Label>
                        <Input
                          id="current_test_date"
                          type="date"
                          value={form.current_test_date}
                          onChange={(e) =>
                            setField("current_test_date", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="current_test_time">Current test time *</Label>
                        <Input
                          id="current_test_time"
                          type="time"
                          value={form.current_test_time}
                          onChange={(e) =>
                            setField("current_test_time", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h2 className="font-semibold mb-3">When would you like to test instead?</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="earliest_new_date">Earliest acceptable date *</Label>
                      <Input
                        id="earliest_new_date"
                        type="date"
                        value={form.earliest_new_date}
                        onChange={(e) =>
                          setField("earliest_new_date", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="latest_new_date">Latest acceptable date *</Label>
                      <Input
                        id="latest_new_date"
                        type="date"
                        value={form.latest_new_date}
                        onChange={(e) =>
                          setField("latest_new_date", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Label htmlFor="notes">Anything else? (optional)</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    maxLength={1000}
                    placeholder="Other test centres you'd accept, weekday vs weekend preference, etc."
                  />
                </div>

                <div className="flex items-start gap-2 border-t pt-6">
                  <Checkbox
                    id="consent_given"
                    checked={form.consent_given}
                    onCheckedChange={(c) =>
                      setField("consent_given", c === true)
                    }
                    required
                  />
                  <Label
                    htmlFor="consent_given"
                    className="text-sm font-normal leading-tight"
                  >
                    I agree to be contacted about potential swap matches and
                    accept the{" "}
                    <Link to="/privacy-policy" className="underline">
                      privacy policy
                    </Link>
                    .
                  </Label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Join the swap pool
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
