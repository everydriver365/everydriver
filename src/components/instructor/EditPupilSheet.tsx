import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Mic, Search, Loader2, X, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { PupilPackageCard } from "@/components/instructor/PupilPackageCard";
import { PupilRateEditor } from "@/components/instructor/PupilRateEditor";
import { PUPIL_SOURCE_OPTIONS } from "@/components/instructor/pupils/AddPupilSheet";
import { ImportFromContactsButton } from "@/components/instructor/pupils/ImportFromContactsButton";
import { titleCaseName } from "@/lib/titleCase";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import {
  formatPostcode,
  isValidEmailShape,
  isValidPhoneShape,
  isValidUkPostcode,
  checkName,
} from "@/lib/pupilFormValidation";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import { useQueryClient } from "@tanstack/react-query";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

// Design tokens (match premium tile design system)
const C = {
  bg: "#FFFFFF",
  hairline: "#E5E5EA",
  text: "#000000",
  muted: "#6E6E73",
  blue: "#2B7BC8",
  amber: "#B8801F",
  red: "#C8434F",
  greySurface: "#F2F2F4",
};

interface EditPupilSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupil: any | null;
  instructorId: string | null;
  onSaved?: () => void;
}

/* ---------- atoms ---------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: C.muted,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        margin: "0 0 6px",
        fontFamily: FONT_STACK,
      }}
    >
      {children}
    </p>
  );
}

function HelperText({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "warning";
}) {
  return (
    <p
      style={{
        fontSize: 11,
        margin: "6px 0 0",
        paddingLeft: 2,
        color: tone === "warning" ? C.amber : C.muted,
        fontFamily: FONT_STACK,
      }}
    >
      {children}
    </p>
  );
}

interface InputShellProps {
  invalid?: boolean;
  focused?: boolean;
  readOnly?: boolean;
  children: React.ReactNode;
}
function InputShell({ invalid, focused, readOnly, children }: InputShellProps) {
  return (
    <div
      style={{
        background: readOnly ? C.greySurface : "#FFFFFF",
        border: `0.5px solid ${
          invalid ? C.red : focused ? C.blue : C.hairline
        }`,
        borderRadius: 10,
        padding: "11px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "border-color 120ms ease",
      }}
    >
      {children}
    </div>
  );
}

const baseInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  fontFamily: FONT_STACK,
  fontSize: 15,
  fontWeight: 500,
  color: C.text,
  padding: 0,
};

/* ---------- mic button (bound to a single input) ---------- */
function MicButton({ onTranscript }: { onTranscript: (t: string) => void }) {
  const { isListening, isSupported, startListening, stopListening, transcript, resetTranscript } =
    useVoiceToText();
  const lastSentRef = useRef<string>("");

  // Forward each new final transcript chunk to the input.
  useEffect(() => {
    if (transcript && transcript !== lastSentRef.current) {
      lastSentRef.current = transcript;
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      aria-label={isListening ? "Stop dictation" : "Start dictation"}
      onClick={() => {
        if (isListening) {
          stopListening();
        } else {
          lastSentRef.current = "";
          resetTranscript();
          startListening();
        }
      }}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        color: isListening ? C.red : C.muted,
        display: "inline-flex",
      }}
    >
      <Mic size={16} strokeWidth={1.5} />
    </button>
  );
}

/* ---------- main sheet ---------- */

export function EditPupilSheet({
  open,
  onOpenChange,
  pupil,
  instructorId,
  onSaved,
}: EditPupilSheetProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state, hydrated whenever the pupil changes.
  const [form, setForm] = useState<any>({});
  const [initial, setInitial] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [postcodeManual, setPostcodeManual] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (pupil) {
      const theory_status =
        pupil.theory_test_passed === true ? "passed"
        : pupil.theory_test_passed === false ? "failed"
        : pupil.theory_test_date ? "booked"
        : "none";
      const today = new Date().toISOString().slice(0, 10);
      const practical_status =
        pupil.test_passed === true ? "passed"
        : (pupil.test_date && pupil.test_date >= today) ? "booked"
        : pupil.test_passed === false ? "failed"
        : "none";
      setForm({ ...pupil, theory_status, practical_status });
      setInitial({ ...pupil, theory_status, practical_status });
      setPostcodeManual(false);
      setFocused(null);
    }
  }, [pupil?.id]);

  // Load theory test centres list
  const [theoryCentres, setTheoryCentres] = useState<Array<{ id: string; name: string; postcode: string | null }>>([]);
  const [practicalCentres, setPracticalCentres] = useState<Array<{ id: string; name: string; postcode: string | null }>>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [theory, practical] = await Promise.all([
        supabase.from("theory_test_centres").select("id, name, postcode").eq("is_active", true).order("name"),
        supabase.from("test_centres").select("id, name, postcode").eq("is_active", true).order("name"),
      ]);
      if (!cancelled) {
        setTheoryCentres((theory.data || []) as any);
        setPracticalCentres((practical.data || []) as any);
      }
    })();
    return () => { cancelled = true; };
  }, []);


  // Computed
  const dirty = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initial);
  }, [form, initial]);

  const nameWarning = useMemo(() => checkName(form.name), [form.name]);
  const emailValid = useMemo(() => isValidEmailShape(form.email), [form.email]);
  const phoneValid = useMemo(() => isValidPhoneShape(form.phone), [form.phone]);
  const postcodeValid = useMemo(
    () => isValidUkPostcode(form.postcode),
    [form.postcode]
  );

  const nameTrim = (form.name || "").trim();
  const nameHardError = nameTrim.length === 0;
  // Mirror AddPupilSheet: pupils need at least one way to be reached.
  const hasContactMethod =
    !!(form.email && form.email.trim()) || !!(form.phone && form.phone.trim());

  const canSave = !saving && dirty && !nameHardError && hasContactMethod;

  /* ---- handlers ---- */

  const handleClose = () => {
    if (dirty && !saving) {
      const ok = window.confirm("Discard unsaved changes?");
      if (!ok) return;
    }
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!pupil || !instructorId || !canSave) return;
    setSaving(true);
    try {
      const toNumOrNull = (v: any) => {
        const s = String(v ?? "").trim();
        if (!s) return null;
        const n = parseFloat(s);
        return isNaN(n) ? null : n;
      };
      const isIntensive = form.source === "national_intensive";
      const cleaned: any = {
        name: titleCaseName(form.name),
        email: form.email?.trim() || null,
        phone: form.phone ? formatPhoneNumber(form.phone) : null,
        address: titleCaseName(form.address || ""),
        postcode: form.postcode ? formatPostcode(form.postcode) : null,
        lessons_completed: form.lessons_completed,
        progress: form.progress,
        notes: form.notes,
        what3words: form.what3words,
        parent_phone: form.parent_phone ? formatPhoneNumber(form.parent_phone) : null,
        parent_name: form.parent_name ? titleCaseName(form.parent_name) : null,
        date_of_birth: form.date_of_birth || null,
        profile_image_url: form.profile_image_url,
        // Newly editable fields
        sex: form.sex || null,
        transmission_type: form.transmission_type || null,
        previous_experience: form.previous_experience?.trim() || null,
        special_needs: form.special_needs?.trim() || null,
        payment_method: form.payment_method || "tbc",
        source: form.source || null,
        intensive_hours_paid: isIntensive ? toNumOrNull(form.intensive_hours_paid) : null,
        intensive_course_payout: isIntensive ? toNumOrNull(form.intensive_course_payout) : null,
        intensive_pupil_payment: isIntensive ? toNumOrNull(form.intensive_pupil_payment) : null,
        // Theory test
        theory_test_passed:
          form.theory_status === "passed" ? true
          : form.theory_status === "failed" ? false
          : null,
        theory_test_date: form.theory_test_date || null,
        theory_test_centre_id: form.theory_test_centre_id || null,
        theory_cert_number: form.theory_cert_number?.trim() || null,
        // Practical (driving) test
        test_passed:
          form.practical_status === "passed" ? true
          : form.practical_status === "failed" ? false
          : null,
        test_date: form.practical_status === "booked" ? (form.test_date || null) : (form.practical_status === "none" ? null : (form.test_date || null)),
        test_time: form.practical_status === "booked" ? (form.test_time || null) : null,
        test_centre_id: (form.practical_status === "booked" || form.practical_status === "passed" || form.practical_status === "failed") ? (form.test_centre_id || null) : null,
        test_result_date: (form.practical_status === "passed" || form.practical_status === "failed") ? (form.test_result_date || null) : null,
      };


      const { error } = await supabase
        .from("pupils")
        .update(cleaned)
        .eq("id", pupil.id);

      if (error) throw error;

      toast.success("Pupil updated");
      onOpenChange(false);
      onSaved?.();
      queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] });
    } catch (err) {
      console.error("Error updating pupil:", err);
      toast.error("Failed to update pupil");
    } finally {
      setSaving(false);
    }
  };

  /* ---- photo upload ---- */
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pupil) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${pupil.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("pupil-avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("pupil-avatars")
        .getPublicUrl(fileName);
      setForm((f: any) => ({ ...f, profile_image_url: publicUrl }));
      toast.success("Photo uploaded");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ---- voice append helpers ---- */
  const appendVoice = (field: "name" | "address") => (text: string) => {
    setForm((f: any) => {
      const current = (f[field] || "").trim();
      const next = current ? `${current} ${text}` : text;
      return { ...f, [field]: next };
    });
  };

  /* ---- render ---- */

  if (!pupil) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <SheetContent
        side="bottom"
        className="p-0 max-h-[100dvh] h-[100dvh] sm:max-w-2xl sm:mx-auto rounded-t-2xl border-0 overflow-hidden flex flex-col"
        style={{ background: C.bg }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Edit pupil</SheetTitle>
          <SheetDescription>Edit pupil details</SheetDescription>
        </SheetHeader>

        {/* Header bar */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `0.5px solid ${C.hairline}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
            background: C.bg,
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              padding: 4,
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 500,
              color: C.blue,
              fontFamily: FONT_STACK,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <h2
            style={{
              flex: 1,
              textAlign: "center",
              margin: 0,
              fontSize: 15,
              fontWeight: 500,
              color: C.text,
              letterSpacing: "-0.2px",
              fontFamily: FONT_STACK,
            }}
          >
            Edit pupil
          </h2>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              background: "transparent",
              border: "none",
              padding: 4,
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 500,
              color: C.blue,
              fontFamily: FONT_STACK,
              cursor: canSave ? "pointer" : saving ? "wait" : "not-allowed",
              opacity: canSave ? 1 : saving ? 0.6 : 0.4,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Scroll container */}
        <div style={{ flex: 1, overflowY: "auto", background: C.bg }}>
          {/* Avatar block */}
          <div
            style={{
              padding: "20px 16px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              borderBottom: `0.5px solid ${C.hairline}`,
            }}
          >
            <UserAvatar
              name={titleCaseName(form.name) || pupil.name}
              photoUrl={form.profile_image_url}
              size={72}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                background: "transparent",
                border: "none",
                padding: "6px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: uploading ? "wait" : "pointer",
                color: C.blue,
                fontFamily: FONT_STACK,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} strokeWidth={1.8} color={C.blue} />
              )}
              {form.profile_image_url ? "Change photo" : "Add photo"}
            </button>
          </div>

          {/* Form fields */}
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <ImportFromContactsButton
              variant="card"
              label="Replace from contacts"
              onImport={(c) =>
                setForm((prev: any) => ({
                  ...prev,
                  name: c.name || prev.name,
                  phone: c.phone ? formatPhoneNumber(c.phone) || c.phone : prev.phone,
                  email: c.email || prev.email,
                  address: c.address || prev.address,
                  postcode: c.postcode || prev.postcode,
                }))
              }
            />
            {/* Name */}
            <div>
              <Eyebrow>Name</Eyebrow>
              <InputShell
                invalid={nameHardError || !!nameWarning.code}
                focused={focused === "name"}
              >
                <input
                  style={baseInputStyle}
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  placeholder="Full name"
                  autoComplete="name"
                />
                <MicButton onTranscript={appendVoice("name")} />
              </InputShell>
              {nameWarning.code && (
                <HelperText tone="warning">{nameWarning.message}</HelperText>
              )}
            </div>

            {/* Email + Phone */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              <div>
                <Eyebrow>Email</Eyebrow>
                <InputShell invalid={!emailValid} focused={focused === "email"}>
                  <input
                    style={{ ...baseInputStyle, fontSize: 14 }}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={form.email || ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                  />
                </InputShell>
                {!emailValid && (
                  <HelperText tone="warning">Email format looks unusual</HelperText>
                )}
              </div>
              <div>
                <Eyebrow>Phone</Eyebrow>
                <InputShell invalid={!phoneValid} focused={focused === "phone"}>
                  <input
                    style={{ ...baseInputStyle, fontSize: 14 }}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="07XXX XXXXXX"
                    value={
                      focused === "phone"
                        ? form.phone || ""
                        : formatPhoneNumber(form.phone) || form.phone || ""
                    }
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    onFocus={() => setFocused("phone")}
                    onBlur={() => setFocused(null)}
                  />
                </InputShell>
                {!phoneValid && (
                  <HelperText tone="warning">Phone number format looks unusual</HelperText>
                )}
              </div>
            </div>
            {!hasContactMethod && (
              <HelperText tone="warning">
                Add at least an email or phone number so you can reach this pupil.
              </HelperText>
            )}

            {/* Address */}
            <div>
              <Eyebrow>Address</Eyebrow>
              <InputShell focused={focused === "address"}>
                <Search
                  size={16}
                  strokeWidth={1.5}
                  color={C.muted}
                  style={{ flexShrink: 0 }}
                />
                <div
                  style={{ flex: 1, minWidth: 0 }}
                  className="edit-pupil-address"
                  onFocus={() => setFocused("address")}
                  onBlur={() => setFocused(null)}
                >
                  <GoogleAddressAutocomplete
                    value={form.address || ""}
                    onChange={(address) => setForm({ ...form, address })}
                    onPostcodeChange={async (postcode) => {
                      setForm((prev: any) => ({ ...prev, postcode }));
                      setPostcodeManual(false);
                      try {
                        const { data } = await supabase.functions.invoke(
                          "convert-to-what3words",
                          { body: { postcode } }
                        );
                        if (data?.what3words) {
                          setForm((prev: any) => ({ ...prev, what3words: data.what3words }));
                        }
                      } catch (err) {
                        console.error("What3Words lookup failed:", err);
                      }
                    }}
                    placeholder="Start typing an address…"
                  />
                </div>
                <MicButton onTranscript={appendVoice("address")} />
              </InputShell>
              <HelperText>Search address — postcode fills automatically</HelperText>
              {/* Visually neutralise the autocomplete child input chrome */}
              <style>{`
                .edit-pupil-address input {
                  border: none !important;
                  outline: none !important;
                  background: transparent !important;
                  padding: 0 !important;
                  height: auto !important;
                  font-family: ${FONT_STACK};
                  font-size: 15px;
                  font-weight: 500;
                  color: ${C.text};
                  box-shadow: none !important;
                }
              `}</style>
            </div>

            {/* Postcode */}
            <div>
              <Eyebrow>Postcode</Eyebrow>
              <InputShell
                readOnly={!postcodeManual}
                focused={focused === "postcode"}
                invalid={!postcodeValid}
              >
                <input
                  style={{
                    ...baseInputStyle,
                    fontSize: 14,
                    color: postcodeManual ? C.text : C.muted,
                  }}
                  value={form.postcode || ""}
                  readOnly={!postcodeManual}
                  onClick={() => !postcodeManual && setPostcodeManual(true)}
                  onChange={(e) =>
                    setForm({ ...form, postcode: e.target.value.toUpperCase() })
                  }
                  onFocus={() => setFocused("postcode")}
                  onBlur={() => setFocused(null)}
                  placeholder="Auto-filled from address"
                  autoComplete="postal-code"
                />
              </InputShell>
              {!postcodeValid && (
                <HelperText tone="warning">Postcode format looks unusual</HelperText>
              )}
            </div>

            {/* What3Words (preserved) */}
            <div>
              <Eyebrow>What3Words</Eyebrow>
              <InputShell focused={focused === "what3words"}>
                <span style={{ color: C.muted, fontSize: 14, flexShrink: 0 }}>///</span>
                <input
                  style={{ ...baseInputStyle, fontSize: 14 }}
                  value={form.what3words || ""}
                  onChange={(e) => setForm({ ...form, what3words: e.target.value })}
                  onFocus={() => setFocused("what3words")}
                  onBlur={() => setFocused(null)}
                  placeholder="word.word.word"
                />
              </InputShell>
            </div>

            {/* Notes (preserved) */}
            <div>
              <Eyebrow>Notes</Eyebrow>
              <InputShell focused={focused === "notes"}>
                <textarea
                  style={{
                    ...baseInputStyle,
                    fontSize: 14,
                    minHeight: 72,
                    resize: "vertical",
                    fontWeight: 400,
                  }}
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  onFocus={() => setFocused("notes")}
                  onBlur={() => setFocused(null)}
                />
              </InputShell>
            </div>

            {/* Lead source */}
            <div
              style={{
                marginTop: 8,
                paddingTop: 16,
                borderTop: `0.5px solid ${C.hairline}`,
              }}
            >
              <Eyebrow>Lead source</Eyebrow>
              <InputShell focused={focused === "source"}>
                <select
                  style={{ ...baseInputStyle, fontSize: 14, appearance: "none" }}
                  value={form.source || ""}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  onFocus={() => setFocused("source")}
                  onBlur={() => setFocused(null)}
                >
                  <option value="">Select source…</option>
                  {PUPIL_SOURCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </InputShell>

              {form.source === "national_intensive" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <div>
                    <Eyebrow>Hours paid</Eyebrow>
                    <InputShell focused={focused === "ihp"}>
                      <input
                        style={{ ...baseInputStyle, fontSize: 14 }}
                        type="number"
                        inputMode="decimal"
                        value={form.intensive_hours_paid ?? ""}
                        onChange={(e) => setForm({ ...form, intensive_hours_paid: e.target.value })}
                        onFocus={() => setFocused("ihp")}
                        onBlur={() => setFocused(null)}
                        placeholder="e.g. 40"
                      />
                    </InputShell>
                  </div>
                  <div>
                    <Eyebrow>NI pays you</Eyebrow>
                    <InputShell focused={focused === "icp"}>
                      <input
                        style={{ ...baseInputStyle, fontSize: 14 }}
                        type="number"
                        inputMode="decimal"
                        value={form.intensive_course_payout ?? ""}
                        onChange={(e) => setForm({ ...form, intensive_course_payout: e.target.value })}
                        onFocus={() => setFocused("icp")}
                        onBlur={() => setFocused(null)}
                        placeholder="£ amount"
                      />
                    </InputShell>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Eyebrow>Pupil pays you (optional)</Eyebrow>
                    <InputShell focused={focused === "ipp"}>
                      <input
                        style={{ ...baseInputStyle, fontSize: 14 }}
                        type="number"
                        inputMode="decimal"
                        value={form.intensive_pupil_payment ?? ""}
                        onChange={(e) => setForm({ ...form, intensive_pupil_payment: e.target.value })}
                        onFocus={() => setFocused("ipp")}
                        onBlur={() => setFocused(null)}
                        placeholder="£ amount"
                      />
                    </InputShell>
                  </div>
                </div>
              )}
            </div>

            {/* Payment method */}
            <div
              style={{
                marginTop: 8,
                paddingTop: 16,
                borderTop: `0.5px solid ${C.hairline}`,
              }}
            >
              <Eyebrow>Payment method</Eyebrow>
              <InputShell focused={focused === "payment_method"}>
                <select
                  style={{ ...baseInputStyle, fontSize: 14, appearance: "none" }}
                  value={form.payment_method || "tbc"}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  onFocus={() => setFocused("payment_method")}
                  onBlur={() => setFocused(null)}
                >
                  <option value="tbc">TBC — decide later</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="send_link">Send payment link</option>
                  <option value="take_payment">Take payment now (QR)</option>
                  <option value="national_intensive">National Intensive</option>
                </select>
              </InputShell>
            </div>

            {/* Additional details */}
            <div
              style={{
                marginTop: 8,
                paddingTop: 16,
                borderTop: `0.5px solid ${C.hairline}`,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                <div>
                  <Eyebrow>Sex</Eyebrow>
                  <InputShell focused={focused === "sex"}>
                    <select
                      style={{ ...baseInputStyle, fontSize: 14, appearance: "none" }}
                      value={form.sex || ""}
                      onChange={(e) => setForm({ ...form, sex: e.target.value })}
                      onFocus={() => setFocused("sex")}
                      onBlur={() => setFocused(null)}
                    >
                      <option value="">Not set</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </InputShell>
                </div>
                <div>
                  <Eyebrow>Transmission</Eyebrow>
                  <InputShell focused={focused === "transmission_type"}>
                    <select
                      style={{ ...baseInputStyle, fontSize: 14, appearance: "none" }}
                      value={form.transmission_type || ""}
                      onChange={(e) => setForm({ ...form, transmission_type: e.target.value })}
                      onFocus={() => setFocused("transmission_type")}
                      onBlur={() => setFocused(null)}
                    >
                      <option value="">Not set</option>
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                    </select>
                  </InputShell>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <Eyebrow>Previous experience</Eyebrow>
                <InputShell focused={focused === "previous_experience"}>
                  <input
                    style={{ ...baseInputStyle, fontSize: 14 }}
                    value={form.previous_experience || ""}
                    onChange={(e) => setForm({ ...form, previous_experience: e.target.value })}
                    onFocus={() => setFocused("previous_experience")}
                    onBlur={() => setFocused(null)}
                    placeholder="e.g. 10 hours"
                  />
                </InputShell>
              </div>

              <div style={{ marginTop: 12 }}>
                <Eyebrow>Special needs / accessibility</Eyebrow>
                <InputShell focused={focused === "special_needs"}>
                  <textarea
                    style={{
                      ...baseInputStyle,
                      fontSize: 14,
                      minHeight: 60,
                      resize: "vertical",
                      fontWeight: 400,
                    }}
                    value={form.special_needs || ""}
                    onChange={(e) => setForm({ ...form, special_needs: e.target.value })}
                    onFocus={() => setFocused("special_needs")}
                    onBlur={() => setFocused(null)}
                    placeholder="Anything the instructor should know"
                  />
                </InputShell>
              </div>
            </div>



            {/* Parent / Guardian (preserved) */}
            <div
              style={{
                marginTop: 8,
                paddingTop: 16,
                borderTop: `0.5px solid ${C.hairline}`,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.text,
                  fontFamily: FONT_STACK,
                  margin: "0 0 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Users size={14} strokeWidth={1.6} color={C.muted} />
                Parent / guardian (for parent portal access)
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                <div>
                  <Eyebrow>Parent name</Eyebrow>
                  <InputShell focused={focused === "parent_name"}>
                    <input
                      style={{ ...baseInputStyle, fontSize: 14 }}
                      value={form.parent_name || ""}
                      onChange={(e) =>
                        setForm({ ...form, parent_name: e.target.value })
                      }
                      onFocus={() => setFocused("parent_name")}
                      onBlur={() => setFocused(null)}
                      placeholder="Parent's name"
                    />
                  </InputShell>
                </div>
                <div>
                  <Eyebrow>Parent phone</Eyebrow>
                  <InputShell focused={focused === "parent_phone"}>
                    <input
                      style={{ ...baseInputStyle, fontSize: 14 }}
                      type="tel"
                      inputMode="tel"
                      value={
                        focused === "parent_phone"
                          ? form.parent_phone || ""
                          : formatPhoneNumber(form.parent_phone) || form.parent_phone || ""
                      }
                      onChange={(e) =>
                        setForm({ ...form, parent_phone: e.target.value })
                      }
                      onFocus={() => setFocused("parent_phone")}
                      onBlur={() => setFocused(null)}
                      placeholder="07XXX XXXXXX"
                    />
                  </InputShell>
                  <InviteParentButton
                    pupilId={pupil?.id ?? null}
                    parentPhone={form.parent_phone}
                    parentPortalEnabled={pupil?.parent_portal_enabled !== false}
                    initialInvitedAt={pupil?.parent_invited_at ?? null}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <Eyebrow>Date of birth</Eyebrow>
                <InputShell focused={focused === "dob"}>
                  <input
                    style={{ ...baseInputStyle, fontSize: 14 }}
                    type="date"
                    value={form.date_of_birth || ""}
                    onChange={(e) =>
                      setForm({ ...form, date_of_birth: e.target.value })
                    }
                    onFocus={() => setFocused("dob")}
                    onBlur={() => setFocused(null)}
                  />
                </InputShell>
                <HelperText>
                  Parent signature required on T&amp;Cs for pupils under 18
                </HelperText>
              </div>

              {/* Theory test */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `0.5px solid ${C.hairline}` }}>
                <Eyebrow>Theory test status</Eyebrow>
                <InputShell focused={focused === "theory_status"}>
                  <select
                    style={{ ...baseInputStyle, fontSize: 14, appearance: "none" }}
                    value={form.theory_status || "none"}
                    onChange={(e) => setForm({ ...form, theory_status: e.target.value })}
                    onFocus={() => setFocused("theory_status")}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="none">Not taken</option>
                    <option value="booked">Booked</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Not passed</option>
                  </select>
                </InputShell>

                {(form.theory_status === "booked" || form.theory_status === "passed" || form.theory_status === "failed") && (
                  <div style={{ marginTop: 12 }}>
                    <Eyebrow>{form.theory_status === "booked" ? "Date booked" : "Test date"}</Eyebrow>
                    <InputShell focused={focused === "theory_test_date"}>
                      <input
                        style={{ ...baseInputStyle, fontSize: 14 }}
                        type="date"
                        value={form.theory_test_date || ""}
                        onChange={(e) => setForm({ ...form, theory_test_date: e.target.value })}
                        onFocus={() => setFocused("theory_test_date")}
                        onBlur={() => setFocused(null)}
                      />
                    </InputShell>
                  </div>
                )}

                {(form.theory_status === "booked" || form.theory_status === "passed") && (
                  <div style={{ marginTop: 12 }}>
                    <Eyebrow>Theory centre</Eyebrow>
                    <InputShell focused={focused === "theory_test_centre_id"}>
                      <select
                        style={{ ...baseInputStyle, fontSize: 14, appearance: "none" }}
                        value={form.theory_test_centre_id || ""}
                        onChange={(e) => setForm({ ...form, theory_test_centre_id: e.target.value || null })}
                        onFocus={() => setFocused("theory_test_centre_id")}
                        onBlur={() => setFocused(null)}
                      >
                        <option value="">Select a centre…</option>
                        {theoryCentres.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}{c.postcode ? ` · ${c.postcode}` : ""}
                          </option>
                        ))}
                      </select>
                    </InputShell>
                  </div>
                )}

                {form.theory_status === "passed" && (
                  <div style={{ marginTop: 12 }}>
                    <Eyebrow>Certificate number</Eyebrow>
                    <InputShell focused={focused === "theory_cert_number"}>
                      <input
                        style={{ ...baseInputStyle, fontSize: 14 }}
                        type="text"
                        placeholder="Optional"
                        value={form.theory_cert_number || ""}
                        onChange={(e) => setForm({ ...form, theory_cert_number: e.target.value })}
                        onFocus={() => setFocused("theory_cert_number")}
                        onBlur={() => setFocused(null)}
                      />
                    </InputShell>
                  </div>
                )}
              </div>
            </div>

            {/* Practical (driving) test */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `0.5px solid ${C.hairline}` }}>
              <Eyebrow>Driving test status</Eyebrow>
              <InputShell focused={focused === "practical_status"}>
                <select
                  style={{ ...baseInputStyle, fontSize: 14, appearance: "none" }}
                  value={form.practical_status || "none"}
                  onChange={(e) => setForm({ ...form, practical_status: e.target.value })}
                  onFocus={() => setFocused("practical_status")}
                  onBlur={() => setFocused(null)}
                >
                  <option value="none">Not booked</option>
                  <option value="booked">Booked</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Not passed</option>
                </select>
              </InputShell>

              {form.practical_status === "booked" && (
                <>
                  <div style={{ marginTop: 12 }}>
                    <Eyebrow>Test date</Eyebrow>
                    <InputShell focused={focused === "test_date"}>
                      <input
                        style={{ ...baseInputStyle, fontSize: 14 }}
                        type="date"
                        value={form.test_date || ""}
                        onChange={(e) => setForm({ ...form, test_date: e.target.value })}
                        onFocus={() => setFocused("test_date")}
                        onBlur={() => setFocused(null)}
                      />
                    </InputShell>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Eyebrow>Test time</Eyebrow>
                    <InputShell focused={focused === "test_time"}>
                      <input
                        style={{ ...baseInputStyle, fontSize: 14 }}
                        type="time"
                        value={form.test_time ? String(form.test_time).slice(0, 5) : ""}
                        onChange={(e) => setForm({ ...form, test_time: e.target.value })}
                        onFocus={() => setFocused("test_time")}
                        onBlur={() => setFocused(null)}
                      />
                    </InputShell>
                  </div>
                </>
              )}

              {(form.practical_status === "passed" || form.practical_status === "failed") && (
                <div style={{ marginTop: 12 }}>
                  <Eyebrow>Result date</Eyebrow>
                  <InputShell focused={focused === "test_result_date"}>
                    <input
                      style={{ ...baseInputStyle, fontSize: 14 }}
                      type="date"
                      value={form.test_result_date || ""}
                      onChange={(e) => setForm({ ...form, test_result_date: e.target.value })}
                      onFocus={() => setFocused("test_result_date")}
                      onBlur={() => setFocused(null)}
                    />
                  </InputShell>
                </div>
              )}

              {(form.practical_status === "booked" || form.practical_status === "passed" || form.practical_status === "failed") && (
                <div style={{ marginTop: 12 }}>
                  <Eyebrow>Test centre</Eyebrow>
                  <InputShell focused={focused === "test_centre_id"}>
                    <select
                      style={{ ...baseInputStyle, fontSize: 14, appearance: "none" }}
                      value={form.test_centre_id || ""}
                      onChange={(e) => setForm({ ...form, test_centre_id: e.target.value || null })}
                      onFocus={() => setFocused("test_centre_id")}
                      onBlur={() => setFocused(null)}
                    >
                      <option value="">Select a centre…</option>
                      {practicalCentres.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.postcode ? ` · ${c.postcode}` : ""}
                        </option>
                      ))}
                    </select>
                  </InputShell>
                </div>
              )}
            </div>




            {/* Lesson rates (1hr / 1.5hr / 2hr) */}
            {pupil && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 16,
                  borderTop: `0.5px solid ${C.hairline}`,
                }}
              >
                <PupilRateEditor
                  pupilId={pupil.id}
                  pupilName={pupil.name || "this pupil"}
                  currentCustomRate={pupil.custom_hourly_rate ?? null}
                  currentCustomRate90={pupil.custom_rate_90min ?? null}
                  currentCustomRate120={pupil.custom_rate_120min ?? null}
                  pupilPostcode={(form?.postcode ?? (pupil as any).postcode) ?? null}
                  instructorId={instructorId ?? undefined}
                  onSaved={() => onSaved?.()}
                />
              </div>
            )}

            {/* Lesson packages (preserved) */}
            {pupil && instructorId && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 16,
                  borderTop: `0.5px solid ${C.hairline}`,
                }}
              >
                <PupilPackageCard pupilId={pupil.id} instructorId={instructorId} />
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Invite parent button ---------- */

function InviteParentButton({
  pupilId,
  parentPhone,
  parentPortalEnabled,
  initialInvitedAt,
}: {
  pupilId: string | null;
  parentPhone: string | null | undefined;
  parentPortalEnabled: boolean;
  initialInvitedAt: string | null;
}) {
  const [sending, setSending] = useState(false);
  const [invitedAt, setInvitedAt] = useState<string | null>(initialInvitedAt);

  useEffect(() => {
    setInvitedAt(initialInvitedAt);
  }, [initialInvitedAt, pupilId]);

  const phoneOk = !!(parentPhone && parentPhone.replace(/\D/g, "").length >= 10);
  const disabled = !pupilId || !phoneOk || !parentPortalEnabled || sending;

  const handleClick = async () => {
    if (!pupilId) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-parent", {
        body: { pupil_id: pupilId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInvitedAt(new Date().toISOString());
      toast.success(`Invite sent to ${data?.sent_to ?? "parent"}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send invite";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const relativeInvited = invitedAt ? relativeTimeFrom(invitedAt) : null;

  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        style={{
          fontFamily: FONT_STACK,
          fontSize: 13,
          fontWeight: 600,
          padding: "8px 14px",
          borderRadius: 999,
          border: `1px solid ${C.hairline}`,
          background: disabled ? C.greySurface : "#EDF2FE",
          color: disabled ? C.muted : "#3D55A1",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {sending ? <Loader2 size={14} className="animate-spin" /> : null}
        {sending ? "Sending…" : invitedAt ? "Resend invite" : "Invite parent"}
      </button>
      {!parentPortalEnabled ? (
        <span style={{ fontSize: 12, color: C.muted, fontFamily: FONT_STACK }}>
          Parent portal is disabled for this pupil
        </span>
      ) : !phoneOk ? (
        <span style={{ fontSize: 12, color: C.muted, fontFamily: FONT_STACK }}>
          Save a parent phone number first
        </span>
      ) : relativeInvited ? (
        <span style={{ fontSize: 12, color: C.muted, fontFamily: FONT_STACK }}>
          Last invited {relativeInvited}
        </span>
      ) : null}
    </div>
  );
}

function relativeTimeFrom(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(iso).toLocaleDateString();
}
