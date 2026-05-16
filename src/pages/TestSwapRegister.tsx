import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { CheckCircle2, Loader2, Check } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  swap,
  SwapRegisterHeader,
  SwapRegisterHero,
  SwapFormCard,
  SectionHeader,
  SwapField,
  SwapInfoBox,
  DateArrow,
  SwapFormFooter,
  swapInputClass,
  swapInputStyle,
} from "@/components/test-swap/register/SwapRegisterUI";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TestCentre {
  id: string;
  name: string;
}

const TEST_SWAP_LS_KEY = "test_swap_signup_id";

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
  const { signupId } = useParams<{ signupId?: string }>();
  const isEdit = !!signupId;

  const [centres, setCentres] = useState<TestCentre[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);

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

  // Load centres
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("test_centres")
        .select("id, name")
        .order("name");
      setCentres((data as TestCentre[] | null) ?? []);
    })();
  }, []);

  // Prefill in edit mode
  useEffect(() => {
    if (!signupId) return;
    (async () => {
      setLoadingExisting(true);
      const { data, error } = await supabase.rpc(
        "get_public_test_swap_signup_for_edit",
        { p_id: signupId }
      );
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) {
        toast({
          title: "Couldn't load your details",
          description: "This edit link may have expired.",
          variant: "destructive",
        });
        setLoadingExisting(false);
        return;
      }
      setForm({
        full_name: row.full_name ?? "",
        email: row.email ?? "",
        phone: row.phone ?? "",
        current_centre_id: row.current_centre_id ?? "",
        has_test_booked: row.has_test_booked ?? true,
        current_test_date: row.current_test_date ?? "",
        current_test_time: row.current_test_time
          ? String(row.current_test_time).slice(0, 5)
          : "",
        earliest_new_date: row.earliest_new_date ?? "",
        latest_new_date: row.latest_new_date ?? "",
        notes: row.notes ?? "",
        consent_given: true,
      });
      setLoadingExisting(false);
    })();
  }, [signupId, toast]);

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

    if (isEdit && signupId) {
      const { error } = await supabase.rpc("update_public_test_swap_signup", {
        p_id: signupId,
        p_payload: parsed.data as any,
      });
      setSubmitting(false);
      if (error) {
        toast({
          title: "Couldn't update",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      try {
        localStorage.setItem(TEST_SWAP_LS_KEY, signupId);
      } catch {}
      toast({ title: "Details updated", description: "Your swap details have been saved." });
      navigate(`/test-swap/matches/${signupId}`);
      return;
    }

    const { data: newId, error } = await supabase.rpc(
      "submit_public_test_swap_signup",
      { p_payload: parsed.data as any }
    );

    setSubmitting(false);

    if (error || !newId) {
      toast({
        title: "Couldn't submit",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      localStorage.setItem(TEST_SWAP_LS_KEY, String(newId));
    } catch {}
    navigate(`/test-swap/matches/${newId}`);
  };

  const backTo = isEdit && signupId ? `/test-swap/matches/${signupId}` : "/test-swap";
  const backLabel = isEdit ? "Back to my matches" : "Back to test swap";

  const heroTitle = isEdit ? "Edit your swap details" : "Register for a test swap";
  const heroSubtitle = isEdit
    ? "Update your test details or preferred date window. Changes take effect immediately."
    : "Free and secure. Tell us your current test details and the dates you'd prefer — we'll match you with another learner.";

  const canSubmit =
    !!form.full_name &&
    !!form.phone &&
    !!form.email &&
    !!form.earliest_new_date &&
    !!form.latest_new_date &&
    !!form.consent_given &&
    (!form.has_test_booked ||
      (!!form.current_centre_id && !!form.current_test_date && !!form.current_test_time));

  return (
    <div className="min-h-screen" style={{ background: swap.surface }}>
      <SEOHead
        title={isEdit ? "Edit Your Test Swap Details | Drive365" : "Register for a Driving Test Swap | Drive365"}
        description="Join the free Drive365 test swap pool. Tell us your current DVSA test date and the dates you'd prefer — we'll match you with another learner."
      />

      <SwapRegisterHeader backTo={backTo} backLabel={backLabel} />

      <main className="max-w-2xl mx-auto pb-16">
        {done ? (
          <div className="px-4 md:px-6 pt-10">
            <div
              className="bg-white p-8 text-center"
              style={{ border: `1px solid ${swap.border}`, borderRadius: 16 }}
            >
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: swap.blue }} />
              <h1 className="text-2xl font-bold mb-2" style={{ color: swap.navy }}>
                You're on the list
              </h1>
              <p className="mb-6" style={{ color: swap.mid }}>
                We'll email you as soon as we find a learner whose test date matches what
                you're after. Keep an eye on your inbox.
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => navigate("/test-swap")} variant="outline">
                  Back to Test Swap
                </Button>
                <Button onClick={() => navigate("/drive365")}>Drive365 home</Button>
              </div>
            </div>
          </div>
        ) : loadingExisting ? (
          <div
            className="flex items-center gap-2 py-16 justify-center"
            style={{ color: swap.mid }}
          >
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your details…
          </div>
        ) : (
          <>
            <SwapRegisterHero title={heroTitle} subtitle={heroSubtitle} />

            <form onSubmit={handleSubmit} className="px-4 md:px-6">
              <SwapFormCard>
                {/* ---------- Section 1: Contact ---------- */}
                <div className="p-6">
                  <SectionHeader
                    n={1}
                    color={swap.navy}
                    title="Your contact details"
                    subtitle="DVSA will call you on the number below — it must match the number on your DVSA booking"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <SwapField label="Full name" required htmlFor="full_name">
                      <input
                        id="full_name"
                        className={swapInputClass}
                        style={swapInputStyle}
                        value={form.full_name}
                        onChange={(e) => setField("full_name", e.target.value)}
                        maxLength={100}
                        placeholder="As it appears on your licence"
                        required
                      />
                    </SwapField>
                    <SwapField
                      label="Mobile number"
                      required
                      htmlFor="phone"
                      hint="Must match your DVSA booking"
                    >
                      <input
                        id="phone"
                        type="tel"
                        className={swapInputClass}
                        style={swapInputStyle}
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        maxLength={30}
                        placeholder="07700 900 000"
                        required
                      />
                    </SwapField>
                  </div>
                  <SwapField label="Email address" required htmlFor="email" className="mt-3">
                    <input
                      id="email"
                      type="email"
                      className={swapInputClass}
                      style={swapInputStyle}
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      maxLength={255}
                      placeholder="you@example.com"
                      required
                      readOnly={isEdit}
                    />
                    {isEdit && (
                      <p className="text-[11px] mt-1.5" style={{ color: swap.muted }}>
                        Email can't be changed here — contact us if you need to update it.
                      </p>
                    )}
                  </SwapField>
                </div>

                {/* ---------- Section 2: Current test ---------- */}
                <div className="p-6">
                  <SectionHeader
                    n={2}
                    color={swap.blue}
                    title="Your current test"
                    subtitle="The slot you want to swap away from"
                  />

                  <button
                    type="button"
                    onClick={() => setField("has_test_booked", !form.has_test_booked)}
                    className="flex items-start gap-3 w-full text-left mb-4 p-3.5"
                    style={{
                      background: form.has_test_booked ? swap.blueLight : swap.surface,
                      border: `1.5px solid ${form.has_test_booked ? swap.blue : swap.border}`,
                      borderRadius: 10,
                    }}
                  >
                    <span
                      className="flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        background: form.has_test_booked ? swap.blue : swap.white,
                        border: form.has_test_booked ? "none" : `1.5px solid ${swap.borderDark}`,
                      }}
                    >
                      {form.has_test_booked && (
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      )}
                    </span>
                    <span className="text-[13px] leading-snug" style={{ color: swap.charcoal }}>
                      I already have a test date booked and{" "}
                      <span className="font-semibold">want to swap it</span>
                    </span>
                  </button>

                  {form.has_test_booked && (
                    <div className="space-y-3">
                      <SwapField label="Current test centre" required>
                        <Select
                          value={form.current_centre_id}
                          onValueChange={(v) => setField("current_centre_id", v)}
                        >
                          <SelectTrigger
                            className={swapInputClass + " h-auto"}
                            style={swapInputStyle}
                          >
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
                      </SwapField>
                      <div className="grid gap-3 md:grid-cols-2">
                        <SwapField label="Current test date" required htmlFor="current_test_date">
                          <input
                            id="current_test_date"
                            type="date"
                            className={swapInputClass}
                            style={swapInputStyle}
                            value={form.current_test_date}
                            onChange={(e) => setField("current_test_date", e.target.value)}
                          />
                        </SwapField>
                        <SwapField label="Current test time" required htmlFor="current_test_time">
                          <input
                            id="current_test_time"
                            type="time"
                            className={swapInputClass}
                            style={swapInputStyle}
                            value={form.current_test_time}
                            onChange={(e) => setField("current_test_time", e.target.value)}
                          />
                        </SwapField>
                      </div>
                    </div>
                  )}
                </div>

                {/* ---------- Section 3: Preferred dates ---------- */}
                <div className="p-6">
                  <SectionHeader
                    n={3}
                    color={swap.red}
                    title="When would you like instead?"
                    subtitle="The date range you'd be happy to receive"
                  />

                  <SwapInfoBox>
                    Your{" "}
                    <span className="font-semibold">
                      booking reference, payment and special requirements
                    </span>{" "}
                    all stay the same. Only your test date, time and centre will change.
                  </SwapInfoBox>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end mb-3">
                    <SwapField label="Earliest date" required htmlFor="earliest_new_date">
                      <input
                        id="earliest_new_date"
                        type="date"
                        className={swapInputClass}
                        style={swapInputStyle}
                        value={form.earliest_new_date}
                        onChange={(e) => setField("earliest_new_date", e.target.value)}
                        required
                      />
                    </SwapField>
                    <DateArrow />
                    <SwapField label="Latest date" required htmlFor="latest_new_date">
                      <input
                        id="latest_new_date"
                        type="date"
                        className={swapInputClass}
                        style={swapInputStyle}
                        value={form.latest_new_date}
                        onChange={(e) => setField("latest_new_date", e.target.value)}
                        required
                      />
                    </SwapField>
                  </div>

                  <SwapField label="Anything else?" optional htmlFor="notes">
                    <Textarea
                      id="notes"
                      rows={4}
                      value={form.notes}
                      onChange={(e) => setField("notes", e.target.value)}
                      maxLength={1000}
                      placeholder="Other centres you'd accept, weekday vs weekend, morning or afternoon preference..."
                      className="rounded-[9px] border-[1.5px] text-sm bg-white"
                      style={{ borderColor: swap.border, color: swap.charcoal, minHeight: 96 }}
                    />
                  </SwapField>
                </div>
              </SwapFormCard>

              <SwapFormFooter
                consentGiven={form.consent_given}
                onConsentChange={(v) => setField("consent_given", v)}
                canSubmit={canSubmit}
                submitting={submitting}
                submitLabel={isEdit ? "Save changes" : "Join the swap pool"}
              />
            </form>
          </>
        )}
      </main>
    </div>
  );
}
