import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  ShieldCheck,
  FileCheck2,
  CarFront,
  Upload,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Info,
} from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  instructorId: string;
}

type Status = "valid" | "expiring" | "expired" | "missing";

interface Form {
  adi_badge_number: string;
  adi_badge_expiry: string;
  adi_grade: string;
  adi_certificate_url: string | null;

  dbs_certificate_issued: string;
  dbs_certificate_expiry: string;
  dbs_certificate_url: string | null;

  driving_licence_number: string;
  driving_licence_expiry: string;

  insurance_provider: string;
  insurance_policy_number: string;
  car_insurance_expiry: string;
  insurance_certificate_url: string | null;

  years_experience_adi: string;
  additional_certifications: string[];
}

const EMPTY: Form = {
  adi_badge_number: "",
  adi_badge_expiry: "",
  adi_grade: "",
  adi_certificate_url: null,
  dbs_certificate_issued: "",
  dbs_certificate_expiry: "",
  dbs_certificate_url: null,
  driving_licence_number: "",
  driving_licence_expiry: "",
  insurance_provider: "",
  insurance_policy_number: "",
  car_insurance_expiry: "",
  insurance_certificate_url: null,
  years_experience_adi: "",
  additional_certifications: [],
};

const CERTS: { id: string; label: string }[] = [
  { id: "pass_plus", label: "Pass plus registered" },
  { id: "fleet_trainer", label: "Fleet trainer" },
  { id: "ordit", label: "Part 3 trainer / ORDIT" },
  { id: "taxi", label: "Taxi / private hire instructor" },
  { id: "disability", label: "Disability awareness training" },
  { id: "ev", label: "Electric vehicle training" },
];

function getStatus(expiry: string | null | undefined, hasFile = true): Status {
  if (!expiry || !hasFile) return "missing";
  const days = differenceInDays(parseISO(expiry), new Date());
  if (days < 0) return "expired";
  if (days <= 90) return "expiring";
  return "valid";
}

function StatusPill({ status, daysLabel }: { status: Status; daysLabel?: string }) {
  const map: Record<Status, { bg: string; fg: string; ring: string; icon: React.ReactNode; label: string }> = {
    valid:    { bg: "#ECFDF5", fg: "#047857", ring: "#A7F3D0", icon: <CheckCircle2 size={12} />, label: "Valid" },
    expiring: { bg: "#FFFBEB", fg: "#B45309", ring: "#FDE68A", icon: <Clock3 size={12} />,        label: daysLabel ?? "Expiring soon" },
    expired:  { bg: "#FEF2F2", fg: "#B91C1C", ring: "#FECACA", icon: <AlertTriangle size={12} />, label: "Expired" },
    missing:  { bg: "#FEF2F2", fg: "#B91C1C", ring: "#FECACA", icon: <AlertTriangle size={12} />, label: "Missing" },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium"
      style={{ background: s.bg, color: s.fg, border: `0.5px solid ${s.ring}`, borderRadius: 999 }}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function Field({
  label,
  children,
  hint,
}: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[12px] text-muted-foreground" style={{ fontWeight: 400 }}>{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="text-[11px] text-muted-foreground mt-1 block">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full h-9 px-3 text-sm bg-white border-0 rounded-[var(--portal-radius-md,10px)] outline-none focus:ring-2 focus:ring-[#2B7BC8]/30";
const inputStyle: React.CSSProperties = {
  border: "0.5px solid hsl(var(--border))",
  fontWeight: 400,
};

function FileField({
  url,
  bucket,
  pathPrefix,
  onChange,
}: {
  url: string | null;
  bucket: string;
  pathPrefix: string;
  onChange: (url: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be 10MB or less");
      return;
    }
    if (!/^(application\/pdf|image\/)/.test(file.type)) {
      toast.error("PDF or image only");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${pathPrefix}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      onChange(path);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const filename = url ? url.split("/").pop() : null;

  const view = async () => {
    if (!url) return;
    const { data } = await supabase.storage.from(bucket).createSignedUrl(url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (url) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 bg-white"
        style={{ border: "0.5px solid hsl(var(--border))", borderRadius: 10 }}
      >
        <FileCheck2 size={14} className="text-emerald-600 shrink-0" />
        <span className="text-[12px] truncate flex-1" style={{ fontWeight: 500 }}>{filename}</span>
        <button type="button" onClick={view} className="text-[11px] text-[#2B7BC8] inline-flex items-center gap-1">
          View <ExternalLink size={11} />
        </button>
        <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive">
          <Trash2 size={13} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 h-9 text-[12px] bg-white text-muted-foreground hover:bg-muted/40 transition"
        style={{ border: "0.5px dashed hsl(var(--border))", borderRadius: 10, fontWeight: 400 }}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        {busy ? "Uploading…" : "Upload PDF or image · max 10MB"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="application/pdf,image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
      />
    </>
  );
}

function CredentialCard({
  icon,
  title,
  status,
  statusLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  status: Status;
  statusLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="bg-white p-5"
      style={{ border: "0.5px solid hsl(var(--border))", borderRadius: "var(--portal-radius-lg, 12px)" }}
    >
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-7 h-7" style={{ background: "#F3F4F6", borderRadius: 8 }}>
            {icon}
          </span>
          <h3 className="text-[14px]" style={{ fontWeight: 500 }}>{title}</h3>
        </div>
        <StatusPill status={status} daysLabel={statusLabel} />
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function QualificationsEditor({ instructorId }: Props) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [original, setOriginal] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("instructors")
        .select(
          "adi_badge_number, adi_badge_expiry, adi_grade, adi_certificate_url, dbs_certificate_issued, dbs_certificate_expiry, dbs_certificate_url, driving_licence_number, driving_licence_expiry, insurance_provider, insurance_policy_number, car_insurance_expiry, insurance_certificate_url, years_experience_adi, additional_certifications"
        )
        .eq("id", instructorId)
        .single();
      if (error) {
        console.error(error);
      } else if (data) {
        const next: Form = {
          adi_badge_number: data.adi_badge_number || "",
          adi_badge_expiry: data.adi_badge_expiry || "",
          adi_grade: data.adi_grade || "",
          adi_certificate_url: data.adi_certificate_url,
          dbs_certificate_issued: (data as any).dbs_certificate_issued || "",
          dbs_certificate_expiry: data.dbs_certificate_expiry || "",
          dbs_certificate_url: (data as any).dbs_certificate_url,
          driving_licence_number: (data as any).driving_licence_number || "",
          driving_licence_expiry: (data as any).driving_licence_expiry || "",
          insurance_provider: (data as any).insurance_provider || "",
          insurance_policy_number: (data as any).insurance_policy_number || "",
          car_insurance_expiry: data.car_insurance_expiry || "",
          insurance_certificate_url: (data as any).insurance_certificate_url,
          years_experience_adi: (data as any).years_experience_adi?.toString() || "",
          additional_certifications: (data as any).additional_certifications || [],
        };
        setForm(next);
        setOriginal(next);
      }
      setLoading(false);
    })();
  }, [instructorId]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(original), [form, original]);

  const adiBadgeStatus  = getStatus(form.adi_badge_expiry, !!form.adi_badge_number);
  const dbsStatus       = getStatus(form.dbs_certificate_expiry, !!form.dbs_certificate_url);
  const licenceStatus   = getStatus(form.driving_licence_expiry, !!form.driving_licence_number);
  const insuranceStatus = getStatus(form.car_insurance_expiry, !!form.insurance_provider);

  const allStatuses = [adiBadgeStatus, dbsStatus, licenceStatus, insuranceStatus];
  const expiredCount  = allStatuses.filter((s) => s === "expired" || s === "missing").length;
  const expiringCount = allStatuses.filter((s) => s === "expiring").length;

  const overall: { status: Status; title: string; sub: string } =
    expiredCount > 0
      ? { status: "expired",  title: "Action needed", sub: `${expiredCount} document${expiredCount > 1 ? "s" : ""} expired or missing` }
      : expiringCount > 0
      ? { status: "expiring", title: `${expiringCount} document${expiringCount > 1 ? "s" : ""} expiring soon`, sub: "Renew within 90 days to stay verified" }
      : { status: "valid",    title: "Fully verified", sub: "All documents are valid" };

  const adiBadgeValid = !form.adi_badge_number || /^\d{6}$/.test(form.adi_badge_number);

  const SECTIONS: Record<string, (keyof Form)[]> = {
    adi: ["adi_badge_number", "adi_badge_expiry", "adi_grade", "adi_certificate_url"],
    dbs: ["dbs_certificate_issued", "dbs_certificate_expiry", "dbs_certificate_url"],
    licence: ["driving_licence_number", "driving_licence_expiry"],
    insurance: ["insurance_provider", "insurance_policy_number", "car_insurance_expiry", "insurance_certificate_url"],
    experience: ["years_experience_adi", "additional_certifications"],
  };

  const sectionDirty = (keys: (keyof Form)[]) =>
    keys.some((k) => JSON.stringify(form[k]) !== JSON.stringify(original[k]));

  const [savingSection, setSavingSection] = useState<string | null>(null);

  const saveSection = async (sectionKey: string) => {
    const keys = SECTIONS[sectionKey];
    if (sectionKey === "adi" && !adiBadgeValid) {
      toast.error("ADI badge number must be 6 digits");
      return;
    }
    setSavingSection(sectionKey);
    const payload: any = {};
    for (const k of keys) {
      let v: any = form[k];
      if (k === "years_experience_adi") v = v ? parseInt(v as string, 10) : null;
      else if (k === "additional_certifications") v = v ?? [];
      else if (typeof v === "string") v = v || null;
      payload[k] = v;
    }
    const { error } = await supabase.from("instructors").update(payload).eq("id", instructorId);
    setSavingSection(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOriginal((o) => ({ ...o, ...keys.reduce((a, k) => ({ ...a, [k]: form[k] }), {} as Partial<Form>) }));
    toast.success("Saved");
  };

  const SectionFooter = ({ sectionKey }: { sectionKey: string }) => {
    const keys = SECTIONS[sectionKey];
    const isDirty = sectionDirty(keys);
    const isSaving = savingSection === sectionKey;
    return (
      <div className="flex items-center justify-end gap-2 pt-3 mt-1" style={{ borderTop: "0.5px solid hsl(var(--border))" }}>
        {isDirty && (
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({ ...f, ...keys.reduce((a, k) => ({ ...a, [k]: original[k] }), {} as Partial<Form>) }))
            }
            className="h-8 px-3 text-[12px] bg-white hover:bg-muted/40"
            style={{ border: "0.5px solid hsl(var(--border))", borderRadius: 8, fontWeight: 500 }}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => saveSection(sectionKey)}
          disabled={!isDirty || isSaving}
          className="h-8 px-3 text-[12px] inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#111827", color: "#FFFFFF", borderRadius: 8, fontWeight: 500 }}
        >
          {isSaving && <Loader2 size={12} className="animate-spin" />}
          Save
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
      </div>
    );
  }

  const overallTone =
    overall.status === "valid"
      ? { bg: "#ECFDF5", border: "#A7F3D0", icon: <CheckCircle2 size={16} className="text-emerald-600" /> }
      : overall.status === "expiring"
      ? { bg: "#FFFBEB", border: "#FDE68A", icon: <Clock3 size={16} className="text-amber-600" /> }
      : { bg: "#FEF2F2", border: "#FECACA", icon: <AlertTriangle size={16} className="text-red-600" /> };

  return (
    <div className="pb-24">
      {/* Verification status banner */}
      <div
        className="flex items-center gap-3 px-4 py-3 mb-5"
        style={{ background: overallTone.bg, border: `0.5px solid ${overallTone.border}`, borderRadius: "var(--portal-radius-lg, 12px)" }}
      >
        {overallTone.icon}
        <div className="flex-1 min-w-0">
          <div className="text-[13px]" style={{ fontWeight: 500 }}>{overall.title}</div>
          <div className="text-[12px] text-muted-foreground">{overall.sub}</div>
        </div>
      </div>

      <div className="space-y-4">
        {/* ADI Badge */}
        <CredentialCard
          icon={<BadgeCheck size={15} className="text-[#2B7BC8]" />}
          title="ADI badge"
          status={adiBadgeStatus}
          statusLabel={
            form.adi_badge_expiry
              ? (() => {
                  const d = differenceInDays(parseISO(form.adi_badge_expiry), new Date());
                  if (d < 0) return "Expired";
                  if (d <= 90) return `${d} days left`;
                  return `Valid · ${format(parseISO(form.adi_badge_expiry), "d MMM yyyy")}`;
                })()
              : undefined
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Badge number">
              <input
                value={form.adi_badge_number}
                onChange={(e) => set("adi_badge_number", e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 digits"
                inputMode="numeric"
                className={inputCls}
                style={{
                  ...inputStyle,
                  borderColor: !adiBadgeValid ? "#B91C1C" : "hsl(var(--border))",
                }}
              />
            </Field>
            <Field label="Expiry date">
              <input
                type="date"
                value={form.adi_badge_expiry}
                onChange={(e) => set("adi_badge_expiry", e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </Field>
          </div>
          <Field label="ADI grade">
            <div className="inline-flex p-0.5 bg-[#F3F4F6]" style={{ borderRadius: 999 }}>
              {(["A", "B", "PDI"] as const).map((g) => {
                const active = g === "PDI" ? form.adi_grade.startsWith("PDI") : form.adi_grade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      if (g === "PDI") {
                        set("adi_grade", active ? "" : "PDI");
                      } else {
                        set("adi_grade", form.adi_grade === g ? "" : g);
                      }
                    }}
                    className="px-4 h-7 text-[12px] transition"
                    style={{
                      fontWeight: active ? 500 : 400,
                      background: active ? "#FFFFFF" : "transparent",
                      color: active ? "#111827" : "#6B7280",
                      borderRadius: 999,
                      boxShadow: active ? "0 0 0 0.5px hsl(var(--border))" : "none",
                    }}
                  >
                    {g === "PDI" ? "PDI" : `Grade ${g}`}
                  </button>
                );
              })}
            </div>
          </Field>
          {form.adi_grade.startsWith("PDI") && (
            <Field label="Pink licence (trainee) stage" hint="Tick the trainee licence you're currently on">
              <div className="flex flex-wrap gap-2">
                {([
                  { v: "PDI-1", label: "1st pink" },
                  { v: "PDI-2", label: "2nd pink" },
                  { v: "PDI-3", label: "3rd pink" },
                ] as const).map((p) => {
                  const checked = form.adi_grade === p.v;
                  return (
                    <button
                      key={p.v}
                      type="button"
                      onClick={() => set("adi_grade", checked ? "PDI" : p.v)}
                      className="inline-flex items-center gap-2 px-3 h-8 text-[12px] bg-white transition"
                      style={{
                        border: `0.5px solid ${checked ? "#EC4899" : "hsl(var(--border))"}`,
                        background: checked ? "#FDF2F8" : "#FFFFFF",
                        color: checked ? "#9D174D" : "#374151",
                        fontWeight: checked ? 500 : 400,
                        borderRadius: 999,
                      }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-4 h-4"
                        style={{
                          border: `1px solid ${checked ? "#EC4899" : "#D1D5DB"}`,
                          background: checked ? "#EC4899" : "#FFFFFF",
                          borderRadius: 4,
                          color: "#FFFFFF",
                        }}
                      >
                        {checked && <CheckCircle2 size={10} strokeWidth={3} />}
                      </span>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
          <Field label="Badge certificate">
            <FileField
              url={form.adi_certificate_url}
              bucket="compliance-documents"
              pathPrefix={`${instructorId}/adi-badge`}
              onChange={(u) => set("adi_certificate_url", u)}
            />
          </Field>
          <SectionFooter sectionKey="adi" />
        </CredentialCard>

        {/* DBS */}
        <CredentialCard
          icon={<ShieldCheck size={15} className="text-[#2B7BC8]" />}
          title="DBS / enhanced background check"
          status={dbsStatus}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date issued">
              <input
                type="date"
                value={form.dbs_certificate_issued}
                onChange={(e) => set("dbs_certificate_issued", e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </Field>
            <Field label="Expiry date">
              <input
                type="date"
                value={form.dbs_certificate_expiry}
                onChange={(e) => set("dbs_certificate_expiry", e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </Field>
          </div>
          <Field label="DBS certificate">
            <FileField
              url={form.dbs_certificate_url}
              bucket="compliance-documents"
              pathPrefix={`${instructorId}/dbs`}
              onChange={(u) => set("dbs_certificate_url", u)}
            />
          </Field>
          <SectionFooter sectionKey="dbs" />
        </CredentialCard>

        {/* Driving licence */}
        <CredentialCard
          icon={<FileCheck2 size={15} className="text-[#2B7BC8]" />}
          title="Driving licence"
          status={licenceStatus}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Licence number">
              <input
                value={form.driving_licence_number}
                onChange={(e) => set("driving_licence_number", e.target.value.toUpperCase())}
                placeholder="e.g. SMITH901125AB9CD"
                className={inputCls}
                style={inputStyle}
              />
            </Field>
            <Field label="Expiry date">
              <input
                type="date"
                value={form.driving_licence_expiry}
                onChange={(e) => set("driving_licence_expiry", e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </Field>
          </div>
          <SectionFooter sectionKey="licence" />
        </CredentialCard>

        {/* Insurance */}
        <CredentialCard
          icon={<CarFront size={15} className="text-[#2B7BC8]" />}
          title="Insurance"
          status={insuranceStatus}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Provider">
              <input
                value={form.insurance_provider}
                onChange={(e) => set("insurance_provider", e.target.value)}
                placeholder="e.g. Adrian Flux"
                className={inputCls}
                style={inputStyle}
              />
            </Field>
            <Field label="Policy number">
              <input
                value={form.insurance_policy_number}
                onChange={(e) => set("insurance_policy_number", e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </Field>
          </div>
          <Field label="Expiry date">
            <input
              type="date"
              value={form.car_insurance_expiry}
              onChange={(e) => set("car_insurance_expiry", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </Field>
          <Field label="Insurance certificate">
            <FileField
              url={form.insurance_certificate_url}
              bucket="compliance-documents"
              pathPrefix={`${instructorId}/insurance`}
              onChange={(u) => set("insurance_certificate_url", u)}
            />
          </Field>
          <SectionFooter sectionKey="insurance" />
        </CredentialCard>

        {/* Experience + extras */}
        <section
          className="bg-white p-5"
          style={{ border: "0.5px solid hsl(var(--border))", borderRadius: "var(--portal-radius-lg, 12px)" }}
        >
          <h3 className="text-[14px] mb-4" style={{ fontWeight: 500 }}>Experience & additional training</h3>
          <Field label="Years of experience as an ADI">
            <input
              type="number"
              min={0}
              max={60}
              value={form.years_experience_adi}
              onChange={(e) => set("years_experience_adi", e.target.value)}
              className={inputCls + " max-w-[140px]"}
              style={inputStyle}
            />
          </Field>
          <div className="mt-4">
            <span className="text-[12px] text-muted-foreground">Additional certifications</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {CERTS.map((c) => {
                const active = form.additional_certifications.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      set(
                        "additional_certifications",
                        active
                          ? form.additional_certifications.filter((x) => x !== c.id)
                          : [...form.additional_certifications, c.id]
                      )
                    }
                    className="px-3 h-8 text-[12px] transition"
                    style={{
                      borderRadius: 999,
                      border: `0.5px solid ${active ? "#2B7BC8" : "hsl(var(--border))"}`,
                      background: active ? "#EDF2FE" : "#FFFFFF",
                      color: active ? "#1E40AF" : "#374151",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {active && "✓ "}{c.label}
                  </button>
                );
              })}
            </div>
          </div>
          <SectionFooter sectionKey="experience" />
        </section>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-1 pt-1 text-[11px] text-muted-foreground">
          <Info size={12} className="mt-0.5 shrink-0" />
          <p>
            Documents are reviewed within 24 hours and only visible to drive365 staff for verification —
            never shared with learners.
          </p>
        </div>
      </div>

    </div>
  );
}
