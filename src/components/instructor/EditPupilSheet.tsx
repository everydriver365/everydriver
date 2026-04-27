import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Mic, Search, Loader2, X, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { PupilPackageCard } from "@/components/instructor/PupilPackageCard";
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
      setForm({ ...pupil });
      setInitial({ ...pupil });
      setPostcodeManual(false);
      setFocused(null);
    }
  }, [pupil?.id]);

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

  const canSave = !saving && dirty && !nameHardError;

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
      const cleaned = {
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
            </div>

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
