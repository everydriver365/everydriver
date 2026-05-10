import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  IconIdBadge2,
  IconShieldCheck,
  IconLicense,
  IconUmbrella,
  IconFileCertificate,
  IconReceipt,
  IconCircleCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconChevronDown,
  IconUpload,
  IconTrash,
  IconExternalLink,
  IconLoader2,
  IconCheck,
  IconInfoCircle,
} from "@tabler/icons-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSettingsDirty } from "../SettingsDirtyContext";

type Status = "valid" | "expiring" | "expired" | "missing";

interface Form {
  adi_badge_number: string;
  adi_badge_expiry: string;
  adi_grade: string; // "A" | "B" | "PDI" | "PDI-1" | "PDI-2" | "PDI-3"
  adi_certificate_url: string | null;

  dbs_certificate_issued: string;
  dbs_certificate_expiry: string;
  dbs_certificate_url: string | null;

  driving_licence_number: string;
  driving_licence_expiry: string;
  driving_licence_front_url: string | null;
  driving_licence_back_url: string | null;

  insurance_provider: string;
  insurance_policy_number: string;
  car_insurance_expiry: string;
  insurance_certificate_url: string | null;

  car_mot_expiry: string;
  mot_certificate_url: string | null;

  car_tax_expiry: string;
  road_tax_reference: string;

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
  driving_licence_front_url: null,
  driving_licence_back_url: null,
  insurance_provider: "",
  insurance_policy_number: "",
  car_insurance_expiry: "",
  insurance_certificate_url: null,
  car_mot_expiry: "",
  mot_certificate_url: null,
  car_tax_expiry: "",
  road_tax_reference: "",
  years_experience_adi: "",
  additional_certifications: [],
};

const CERTS = [
  { id: "pass_plus", label: "Pass plus registered" },
  { id: "fleet_trainer", label: "Fleet trainer" },
  { id: "ordit", label: "Part 3 trainer / ORDIT" },
  { id: "taxi", label: "Taxi / private hire" },
  { id: "disability", label: "Disability awareness" },
  { id: "ev", label: "Electric vehicle" },
];

function getStatus(expiry: string | null | undefined, hasFile = true): Status {
  if (!expiry || !hasFile) return "missing";
  const days = differenceInDays(parseISO(expiry), new Date());
  if (days < 0) return "expired";
  if (days <= 90) return "expiring";
  return "valid";
}

function statusMeta(status: Status, expiry?: string | null) {
  if (status === "valid" && expiry) {
    return {
      label: `Valid until ${format(parseISO(expiry), "d MMM yyyy")}`,
      tone: "valid" as const,
    };
  }
  if (status === "expiring" && expiry) {
    const days = differenceInDays(parseISO(expiry), new Date());
    return { label: `Expires in ${days} day${days === 1 ? "" : "s"}`, tone: "expiring" as const };
  }
  if (status === "expired") return { label: "Expired", tone: "expired" as const };
  return { label: "Missing", tone: "missing" as const };
}

function StatusPill({ status, expiry }: { status: Status; expiry?: string | null }) {
  const { label, tone } = statusMeta(status, expiry);
  const palette: Record<string, { bg: string; fg: string; ring: string; Icon: any }> = {
    valid:    { bg: "#ECFDF5", fg: "#047857", ring: "#A7F3D0", Icon: IconCircleCheck },
    expiring: { bg: "#FFFBEB", fg: "#B45309", ring: "#FDE68A", Icon: IconAlertTriangle },
    expired:  { bg: "#FEF2F2", fg: "#B91C1C", ring: "#FECACA", Icon: IconAlertCircle },
    missing:  { bg: "#FEF2F2", fg: "#B91C1C", ring: "#FECACA", Icon: IconAlertCircle },
  };
  const p = palette[tone];
  const I = p.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px]"
      style={{
        background: p.bg,
        color: p.fg,
        border: `0.5px solid ${p.ring}`,
        borderRadius: 999,
        fontWeight: 500,
      }}
    >
      <I size={11} stroke={2} />
      {label}
    </span>
  );
}

function OverallPill({ statuses }: { statuses: Status[] }) {
  const expired = statuses.filter(s => s === "expired" || s === "missing").length;
  const expiring = statuses.filter(s => s === "expiring").length;
  if (expired > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px]"
        style={{ background: "#FEF2F2", color: "#B91C1C", border: "0.5px solid #FECACA", borderRadius: 999, fontWeight: 500 }}>
        <IconAlertCircle size={13} stroke={2} />
        Action required
      </span>
    );
  }
  if (expiring > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px]"
        style={{ background: "#FFFBEB", color: "#B45309", border: "0.5px solid #FDE68A", borderRadius: 999, fontWeight: 500 }}>
        <IconAlertTriangle size={13} stroke={2} />
        {expiring} need{expiring === 1 ? "s" : ""} attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px]"
      style={{ background: "#ECFDF5", color: "#047857", border: "0.5px solid #A7F3D0", borderRadius: 999, fontWeight: 500 }}>
      <IconCircleCheck size={13} stroke={2} />
      All verified
    </span>
  );
}

const inputCls =
  "w-full h-9 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#2B7BC8]/30";
const inputStyle: React.CSSProperties = {
  border: "0.5px solid hsl(var(--border))",
  borderRadius: "var(--portal-radius-sm, 10px)",
  fontWeight: 400,
};

function Field({ label, children, hint, full }: { label: string; children: React.ReactNode; hint?: string; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <span className="text-[12px] text-muted-foreground" style={{ fontWeight: 400 }}>{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="text-[11px] text-muted-foreground mt-1 block">{hint}</span>}
    </label>
  );
}

function FileField({
  url, bucket, pathPrefix, onChange, placeholder,
}: {
  url: string | null;
  bucket: string;
  pathPrefix: string;
  onChange: (url: string | null) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) return toast.error("File must be 10MB or less");
    if (!/^(application\/pdf|image\/)/.test(file.type)) return toast.error("PDF or image only");
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

  const view = async () => {
    if (!url) return;
    const { data } = await supabase.storage.from(bucket).createSignedUrl(url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (url) {
    const filename = url.split("/").pop();
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white"
        style={{ border: "0.5px solid hsl(var(--border))", borderRadius: "var(--portal-radius-sm, 10px)" }}>
        <IconFileCertificate size={14} className="text-emerald-600 shrink-0" />
        <span className="text-[12px] truncate flex-1" style={{ fontWeight: 500 }}>{filename}</span>
        <button type="button" onClick={view} className="text-[11px] text-[#2B7BC8] inline-flex items-center gap-1">
          View <IconExternalLink size={11} />
        </button>
        <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive">
          <IconTrash size={13} />
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
        className="w-full flex items-center justify-center gap-2 h-16 text-[12px] bg-white text-muted-foreground hover:bg-muted/40 transition"
        style={{ border: "0.5px dashed hsl(var(--border))", borderRadius: "var(--portal-radius-sm, 10px)", fontWeight: 400 }}
      >
        {busy ? <IconLoader2 size={13} className="animate-spin" /> : <IconUpload size={13} />}
        {busy ? "Uploading…" : (placeholder ?? "Upload PDF or image · max 10MB")}
      </button>
      <input ref={ref} type="file" accept="application/pdf,image/*" hidden
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
    </>
  );
}

interface RowDef {
  id: string;
  Icon: any;
  name: string;
  meta: string;
  status: Status;
  expiry?: string | null;
  body: React.ReactNode;
}

function ExpandableRow({
  row, isOpen, onToggle, isLast,
}: { row: RowDef; isOpen: boolean; onToggle: () => void; isLast: boolean }) {
  const Icon = row.Icon;
  return (
    <div style={{ borderTop: "0.5px solid hsl(var(--border))" }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/30 transition-colors px-1 -mx-1"
        style={{ borderRadius: 8 }}
      >
        <span className="inline-flex items-center justify-center shrink-0"
          style={{ width: 32, height: 32, background: "#F3F4F6", borderRadius: 8 }}>
          <Icon size={16} className="text-foreground/70" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] truncate" style={{ fontWeight: 500 }}>{row.name}</span>
          {row.meta && <span className="block text-[12px] text-muted-foreground truncate">{row.meta}</span>}
        </span>
        <StatusPill status={row.status} expiry={row.expiry} />
        <IconChevronDown size={16} className="text-muted-foreground transition-transform shrink-0"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {isOpen && (
        <div
          className="mb-3 mt-1"
          style={{
            background: "var(--color-background-secondary, #FAFAFA)",
            border: "0.5px solid hsl(var(--border))",
            borderRadius: "var(--portal-radius-md, 12px)",
            padding: "1rem 1.25rem",
          }}
        >
          {row.body}
        </div>
      )}
      {isLast && <div style={{ borderBottom: "0.5px solid hsl(var(--border))" }} />}
    </div>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="bg-white"
      style={{
        background: "var(--color-background-primary, #FFFFFF)",
        border: "0.5px solid hsl(var(--border))",
        borderRadius: "var(--portal-radius-lg, 12px)",
        padding: "1.25rem 1.5rem",
      }}
    >
      <h2 className="text-[13px] mb-2 text-muted-foreground" style={{ fontWeight: 500, letterSpacing: 0.2 }}>
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

export function CredentialsPage({ instructorId }: { instructorId: string }) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [original, setOriginal] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const { register, setDirty } = useSettingsDirty();

  const formRef = useRef(form);
  const originalRef = useRef(original);
  formRef.current = form;
  originalRef.current = original;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("instructors")
        .select(
          "adi_badge_number, adi_badge_expiry, adi_grade, adi_certificate_url, dbs_certificate_issued, dbs_certificate_expiry, dbs_certificate_url, driving_licence_number, driving_licence_expiry, driving_licence_front_url, driving_licence_back_url, insurance_provider, insurance_policy_number, car_insurance_expiry, insurance_certificate_url, car_mot_expiry, mot_certificate_url, car_tax_expiry, road_tax_reference, years_experience_adi, additional_certifications"
        )
        .eq("id", instructorId)
        .single();
      if (error) console.error(error);
      else if (data) {
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
          driving_licence_front_url: (data as any).driving_licence_front_url ?? null,
          driving_licence_back_url: (data as any).driving_licence_back_url ?? null,
          insurance_provider: (data as any).insurance_provider || "",
          insurance_policy_number: (data as any).insurance_policy_number || "",
          car_insurance_expiry: data.car_insurance_expiry || "",
          insurance_certificate_url: (data as any).insurance_certificate_url,
          car_mot_expiry: (data as any).car_mot_expiry || "",
          mot_certificate_url: (data as any).mot_certificate_url ?? null,
          car_tax_expiry: (data as any).car_tax_expiry || "",
          road_tax_reference: (data as any).road_tax_reference || "",
          years_experience_adi: (data as any).years_experience_adi?.toString() || "",
          additional_certifications: (data as any).additional_certifications || [],
        };
        setForm(next);
        setOriginal(next);
      }
      setLoading(false);
    })();
  }, [instructorId]);

  const set = useCallback(<K extends keyof Form>(k: K, v: Form[K]) => {
    setForm(f => ({ ...f, [k]: v }));
  }, []);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(original), [form, original]);

  // Register save/reset with the sticky save bar
  useEffect(() => {
    register("credentials", {
      save: async () => {
        const f = formRef.current;
        if (f.adi_badge_number && !/^\d{6}$/.test(f.adi_badge_number)) {
          toast.error("ADI badge number must be 6 digits");
          throw new Error("invalid badge");
        }
        const payload: any = {
          adi_badge_number: f.adi_badge_number || null,
          adi_badge_expiry: f.adi_badge_expiry || null,
          adi_grade: f.adi_grade || null,
          adi_certificate_url: f.adi_certificate_url,
          dbs_certificate_issued: f.dbs_certificate_issued || null,
          dbs_certificate_expiry: f.dbs_certificate_expiry || null,
          dbs_certificate_url: f.dbs_certificate_url,
          driving_licence_number: f.driving_licence_number || null,
          driving_licence_expiry: f.driving_licence_expiry || null,
          driving_licence_front_url: f.driving_licence_front_url,
          driving_licence_back_url: f.driving_licence_back_url,
          insurance_provider: f.insurance_provider || null,
          insurance_policy_number: f.insurance_policy_number || null,
          car_insurance_expiry: f.car_insurance_expiry || null,
          insurance_certificate_url: f.insurance_certificate_url,
          car_mot_expiry: f.car_mot_expiry || null,
          mot_certificate_url: f.mot_certificate_url,
          car_tax_expiry: f.car_tax_expiry || null,
          road_tax_reference: f.road_tax_reference || null,
          years_experience_adi: f.years_experience_adi ? parseInt(f.years_experience_adi, 10) : null,
          additional_certifications: f.additional_certifications ?? [],
        };
        const { error } = await supabase.from("instructors").update(payload).eq("id", instructorId);
        if (error) {
          toast.error(error.message);
          throw error;
        }
        setOriginal(formRef.current);
        toast.success("Credentials saved");
      },
      reset: () => setForm(originalRef.current),
    });
    return () => register("credentials", null);
  }, [register, instructorId]);

  useEffect(() => {
    setDirty("credentials", dirty);
  }, [dirty, setDirty]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <IconLoader2 className="animate-spin" size={18} />
      </div>
    );
  }

  const adiBadgeStatus  = getStatus(form.adi_badge_expiry, !!form.adi_badge_number);
  const dbsStatus       = getStatus(form.dbs_certificate_expiry, !!form.dbs_certificate_url);
  const licenceStatus   = getStatus(form.driving_licence_expiry, !!form.driving_licence_number);
  const insuranceStatus = getStatus(form.car_insurance_expiry, !!form.insurance_provider);
  const motStatus       = getStatus(form.car_mot_expiry, !!form.mot_certificate_url);
  const taxStatus       = getStatus(form.car_tax_expiry, !!form.car_tax_expiry);

  const allStatuses: Status[] = [adiBadgeStatus, dbsStatus, licenceStatus, insuranceStatus, motStatus, taxStatus];

  const adiBadgeValid = !form.adi_badge_number || /^\d{6}$/.test(form.adi_badge_number);
  const grade = form.adi_grade.startsWith("PDI") ? "PDI" : form.adi_grade;
  const pinkStage = form.adi_grade.startsWith("PDI-") ? form.adi_grade : "";

  const adiMeta = [
    form.adi_badge_number ? `No. ${form.adi_badge_number}` : "No badge added",
    grade ? (grade === "PDI" ? "PDI" : `Grade ${grade}`) : null,
    pinkStage ? pinkStage.replace("PDI-", "Pink stage ") : null,
  ].filter(Boolean).join(" · ");

  const credRows: RowDef[] = [
    {
      id: "adi",
      Icon: IconIdBadge2,
      name: "ADI badge",
      meta: adiMeta,
      status: adiBadgeStatus,
      expiry: form.adi_badge_expiry || null,
      body: (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Badge number">
            <input
              value={form.adi_badge_number}
              onChange={(e) => set("adi_badge_number", e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6 digits"
              inputMode="numeric"
              className={inputCls}
              style={{ ...inputStyle, borderColor: !adiBadgeValid ? "#B91C1C" : "hsl(var(--border))" }}
            />
          </Field>
          <Field label="Expiry date">
            <input type="date" value={form.adi_badge_expiry}
              onChange={(e) => set("adi_badge_expiry", e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Grade">
            <div className="inline-flex p-0.5 bg-white" style={{ border: "0.5px solid hsl(var(--border))", borderRadius: 999 }}>
              {(["A", "B", "PDI"] as const).map((g) => {
                const active = grade === g;
                return (
                  <button key={g} type="button"
                    onClick={() => set("adi_grade", g === "PDI" ? "PDI" : g)}
                    className="px-3 h-7 text-[12px] transition"
                    style={{
                      fontWeight: active ? 500 : 400,
                      background: active ? "#111827" : "transparent",
                      color: active ? "#FFFFFF" : "#6B7280",
                      borderRadius: 999,
                    }}>
                    {g === "PDI" ? "PDI" : `Grade ${g}`}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Pink licence stage">
            <select
              value={pinkStage}
              disabled={grade !== "PDI"}
              onChange={(e) => set("adi_grade", e.target.value || "PDI")}
              className={inputCls}
              style={{ ...inputStyle, opacity: grade !== "PDI" ? 0.5 : 1 }}
            >
              <option value="">Not applicable</option>
              <option value="PDI-1">1st pink licence</option>
              <option value="PDI-2">2nd pink licence</option>
              <option value="PDI-3">3rd pink licence</option>
            </select>
          </Field>
          <Field label="Badge certificate" full>
            <FileField url={form.adi_certificate_url} bucket="compliance-documents"
              pathPrefix={`${instructorId}/adi-badge`}
              onChange={(u) => set("adi_certificate_url", u)} />
          </Field>
        </div>
      ),
    },
    {
      id: "dbs",
      Icon: IconShieldCheck,
      name: "DBS check",
      meta: form.dbs_certificate_expiry
        ? `Expires ${format(parseISO(form.dbs_certificate_expiry), "d MMM yyyy")}`
        : "Enhanced background check",
      status: dbsStatus,
      expiry: form.dbs_certificate_expiry || null,
      body: (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date issued">
            <input type="date" value={form.dbs_certificate_issued}
              onChange={(e) => set("dbs_certificate_issued", e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Expiry date">
            <input type="date" value={form.dbs_certificate_expiry}
              onChange={(e) => set("dbs_certificate_expiry", e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="DBS certificate" full>
            <FileField url={form.dbs_certificate_url} bucket="compliance-documents"
              pathPrefix={`${instructorId}/dbs`}
              onChange={(u) => set("dbs_certificate_url", u)} />
          </Field>
        </div>
      ),
    },
    {
      id: "licence",
      Icon: IconLicense,
      name: "Driving licence",
      meta: form.driving_licence_number || "Photo card licence",
      status: licenceStatus,
      expiry: form.driving_licence_expiry || null,
      body: (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Licence number">
            <input value={form.driving_licence_number}
              onChange={(e) => set("driving_licence_number", e.target.value.toUpperCase())}
              placeholder="e.g. SMITH901125AB9CD"
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Expiry date">
            <input type="date" value={form.driving_licence_expiry}
              onChange={(e) => set("driving_licence_expiry", e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Licence photo (front)">
            <FileField url={form.driving_licence_front_url} bucket="compliance-documents"
              pathPrefix={`${instructorId}/licence-front`}
              onChange={(u) => set("driving_licence_front_url", u)}
              placeholder="Upload front · max 10MB" />
          </Field>
          <Field label="Licence photo (back)">
            <FileField url={form.driving_licence_back_url} bucket="compliance-documents"
              pathPrefix={`${instructorId}/licence-back`}
              onChange={(u) => set("driving_licence_back_url", u)}
              placeholder="Upload back · max 10MB" />
          </Field>
        </div>
      ),
    },
    {
      id: "insurance",
      Icon: IconUmbrella,
      name: "Insurance",
      meta: form.insurance_provider || "Tuition insurance",
      status: insuranceStatus,
      expiry: form.car_insurance_expiry || null,
      body: (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Provider">
            <input value={form.insurance_provider}
              onChange={(e) => set("insurance_provider", e.target.value)}
              placeholder="e.g. Adrian Flux"
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Policy number">
            <input value={form.insurance_policy_number}
              onChange={(e) => set("insurance_policy_number", e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Expiry date">
            <input type="date" value={form.car_insurance_expiry}
              onChange={(e) => set("car_insurance_expiry", e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Insurance certificate" full>
            <FileField url={form.insurance_certificate_url} bucket="compliance-documents"
              pathPrefix={`${instructorId}/insurance`}
              onChange={(u) => set("insurance_certificate_url", u)} />
          </Field>
        </div>
      ),
    },
  ];

  const vehicleRows: RowDef[] = [
    {
      id: "mot",
      Icon: IconFileCertificate,
      name: "MOT certificate",
      meta: form.car_mot_expiry
        ? `Expires ${format(parseISO(form.car_mot_expiry), "d MMM yyyy")}`
        : "Annual roadworthiness test",
      status: motStatus,
      expiry: form.car_mot_expiry || null,
      body: (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry date">
            <input type="date" value={form.car_mot_expiry}
              onChange={(e) => set("car_mot_expiry", e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="MOT certificate" full>
            <FileField url={form.mot_certificate_url} bucket="compliance-documents"
              pathPrefix={`${instructorId}/mot`}
              onChange={(u) => set("mot_certificate_url", u)} />
          </Field>
        </div>
      ),
    },
    {
      id: "tax",
      Icon: IconReceipt,
      name: "Road tax",
      meta: form.car_tax_expiry
        ? `Expires ${format(parseISO(form.car_tax_expiry), "d MMM yyyy")}`
        : "Vehicle excise duty",
      status: taxStatus,
      expiry: form.car_tax_expiry || null,
      body: (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry date">
            <input type="date" value={form.car_tax_expiry}
              onChange={(e) => set("car_tax_expiry", e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Reference number (optional)">
            <input value={form.road_tax_reference}
              onChange={(e) => set("road_tax_reference", e.target.value)}
              placeholder="V11 reference"
              className={inputCls} style={inputStyle} />
          </Field>
        </div>
      ),
    },
  ];

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div className="space-y-4 pb-24">
      {/* Page-content header strip with overall status pill */}
      <div className="flex items-center justify-end -mt-2">
        <OverallPill statuses={allStatuses} />
      </div>

      {/* Instructor credentials */}
      <CardSection title="Instructor credentials">
        {credRows.map((r, i) => (
          <ExpandableRow
            key={r.id}
            row={r}
            isOpen={openId === r.id}
            onToggle={() => toggle(r.id)}
            isLast={i === credRows.length - 1}
          />
        ))}
      </CardSection>

      {/* Vehicle documents */}
      <CardSection title="Vehicle documents">
        {vehicleRows.map((r, i) => (
          <ExpandableRow
            key={r.id}
            row={r}
            isOpen={openId === r.id}
            onToggle={() => toggle(r.id)}
            isLast={i === vehicleRows.length - 1}
          />
        ))}
      </CardSection>

      {/* Experience & specialisms */}
      <CardSection title="Experience & specialisms">
        <div className="pt-3" style={{ borderTop: "0.5px solid hsl(var(--border))" }}>
          <Field label="Years as an ADI">
            <input
              type="number" min={0} max={60}
              value={form.years_experience_adi}
              onChange={(e) => set("years_experience_adi", e.target.value)}
              className={inputCls}
              style={{ ...inputStyle, maxWidth: 200 }}
            />
          </Field>
          <div className="mt-4">
            <span className="text-[12px] text-muted-foreground" style={{ fontWeight: 400 }}>Additional certifications</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {CERTS.map((c) => {
                const active = form.additional_certifications.includes(c.id);
                return (
                  <button
                    key={c.id} type="button"
                    onClick={() =>
                      set("additional_certifications",
                        active
                          ? form.additional_certifications.filter((x) => x !== c.id)
                          : [...form.additional_certifications, c.id])
                    }
                    className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] transition"
                    style={{
                      borderRadius: 999,
                      border: `0.5px solid ${active ? "#111827" : "hsl(var(--border))"}`,
                      background: active ? "#F3F4F6" : "#FFFFFF",
                      color: active ? "#111827" : "#6B7280",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {active && <IconCheck size={12} stroke={2.5} />}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardSection>

      <div className="flex items-start gap-2 px-1 pt-1 text-[11px] text-muted-foreground">
        <IconInfoCircle size={12} className="mt-0.5 shrink-0" />
        <p>Documents are reviewed within 24 hours and only visible to drive365 staff for verification — never shared with learners.</p>
      </div>
    </div>
  );
}
