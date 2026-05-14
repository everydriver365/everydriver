import { useState } from "react";
import { z } from "zod";
import { ArrowRight, Clock, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface InstructorLite {
  id: string;
  name: string;
  profile_image_url: string | null;
  brand_colour: string | null;
  typical_response_hours?: number | null;
}

export interface EnquiryFormValues {
  name: string;
  email: string;
  phone: string;
  postcode: string;
  message: string;
}

interface Props {
  instructor: InstructorLite;
  submitting: boolean;
  onSubmit: (values: EnquiryFormValues) => void | Promise<void>;
}

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  postcode: z.string().trim().max(10).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

const D365_PRIMARY = "#142040";
const D365_TEXT = "#0f172a";
const D365_TEXT_MUTED = "#5b6577";
const D365_BORDER = "#e3e7ee";
const D365_FILL = "#f7f8fb";
const D365_TINT = "#eef1f8";
const D365_SUCCESS = "#16a34a";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function EnquiryForm({ instructor, submitting, onSubmit }: Props) {
  const firstName = instructor.name.split(/\s+/)[0] || instructor.name;
  const responseHours = instructor.typical_response_hours ?? 24;
  const accent = instructor.brand_colour || D365_PRIMARY;

  const [values, setValues] = useState<EnquiryFormValues>({
    name: "", email: "", phone: "", postcode: "", message: "",
  });

  const set = <K extends keyof EnquiryFormValues>(k: K, v: EnquiryFormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const handle = async () => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Please check the form");
      return;
    }
    await onSubmit({
      ...values,
      postcode: values.postcode.toUpperCase(),
    });
  };

  return (
    <div
      className="drive365-brand mx-auto w-full"
      style={{
        maxWidth: 520,
        background: "#ffffff",
        borderRadius: 16,
        border: `1px solid ${D365_BORDER}`,
        padding: 28,
        color: D365_TEXT,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 overflow-hidden rounded-full flex items-center justify-center text-white font-semibold"
          style={{ width: 44, height: 44, background: D365_PRIMARY, fontSize: 14 }}
        >
          {instructor.profile_image_url ? (
            <img src={instructor.profile_image_url} alt={instructor.name} className="w-full h-full object-cover" />
          ) : (
            initials(instructor.name)
          )}
        </div>
        <div className="min-w-0">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: D365_PRIMARY, lineHeight: 1.3, margin: 0 }}>
            Send {firstName} an enquiry
          </h2>
          <p style={{ fontSize: 13, color: D365_TEXT_MUTED, marginTop: 4, lineHeight: 1.45 }}>
            No payment now — {firstName} will be in touch to arrange lessons that suit you.
          </p>
          <span
            className="inline-flex items-center gap-1.5 mt-2"
            style={{
              background: D365_TINT, color: D365_PRIMARY,
              padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
            }}
          >
            <Clock size={12} />
            Usually replies within {responseHours} hours
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: D365_BORDER, margin: "20px 0 22px" }} />

      {/* Fields */}
      <div className="space-y-3.5">
        <Field label="Your name" required>
          <Input value={values.name} onChange={(v) => set("name", v)} placeholder="Jane Smith" autoComplete="name" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Email" required>
            <Input type="email" value={values.email} onChange={(v) => set("email", v)} placeholder="jane@example.com" autoComplete="email" />
          </Field>
          <Field label="Phone" required>
            <Input type="tel" value={values.phone} onChange={(v) => set("phone", v)} placeholder="07…" autoComplete="tel" />
          </Field>
        </div>

        <Field label="Postcode" optional>
          <Input
            value={values.postcode}
            onChange={(v) => set("postcode", v.toUpperCase())}
            placeholder="SO22"
            autoComplete="postal-code"
          />
        </Field>

        <Field label={`Anything ${firstName} should know?`} optional>
          <textarea
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            rows={4}
            placeholder="Preferred days, experience, test booked, etc."
            style={{
              width: "100%", background: D365_FILL, border: `1px solid ${D365_BORDER}`,
              borderRadius: 10, padding: "10px 12px", fontSize: 14, color: D365_TEXT,
              fontFamily: "inherit", resize: "vertical", outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = accent; }}
            onBlur={(e) => { e.currentTarget.style.background = D365_FILL; e.currentTarget.style.borderColor = D365_BORDER; }}
          />
        </Field>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handle}
        disabled={submitting}
        className="w-full mt-5 flex items-center justify-center gap-2 transition-colors"
        style={{
          background: D365_PRIMARY, color: "#fff", fontWeight: 600, fontSize: 15,
          padding: "13px 16px", borderRadius: 10, border: "none", cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.7 : 1,
        }}
        onMouseOver={(e) => { if (!submitting) e.currentTarget.style.background = "#0c1730"; }}
        onMouseOut={(e) => { e.currentTarget.style.background = D365_PRIMARY; }}
      >
        {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
        Send enquiry
        {!submitting && <ArrowRight size={16} />}
      </button>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-5 mt-4" style={{ color: D365_TEXT_MUTED, fontSize: 12 }}>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={13} style={{ color: D365_SUCCESS }} /> No spam, ever
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Lock size={13} /> Details kept private
        </span>
      </div>
    </div>
  );
}

function Field({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontSize: 13, fontWeight: 600, color: D365_TEXT }}>
          {label}{required ? " *" : ""}
        </span>
        {optional && (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: D365_TEXT_MUTED }}>
            OPTIONAL
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

function Input({
  value, onChange, type = "text", placeholder, autoComplete,
}: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string; autoComplete?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      style={{
        width: "100%", background: D365_FILL, border: `1px solid ${D365_BORDER}`,
        borderRadius: 10, padding: "10px 12px", fontSize: 14, color: D365_TEXT,
        fontFamily: "inherit", outline: "none",
      }}
      onFocus={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = D365_PRIMARY; }}
      onBlur={(e) => { e.currentTarget.style.background = D365_FILL; e.currentTarget.style.borderColor = D365_BORDER; }}
    />
  );
}
