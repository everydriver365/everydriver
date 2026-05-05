import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Camera, ChevronDown, AlertTriangle, Upload, Plus, X,
  Check, ExternalLink, Mail, Phone, Shield, Smartphone,
} from "lucide-react";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";

// ---------- palette ----------
const ramp: Record<string, { bg: string; text: string }> = {
  blue:   { bg: "#85B7EB", text: "#042C53" },
  coral:  { bg: "#F0997B", text: "#4A1B0C" },
  green:  { bg: "#C0DD97", text: "#173404" },
  pink:   { bg: "#ED93B1", text: "#4B1528" },
  purple: { bg: "#AFA9EC", text: "#26215C" },
  amber:  { bg: "#FAC775", text: "#412402" },
};

// ---------- mock profile ----------
const initialProfile = {
  personal: {
    firstName: "Ken",
    lastName: "Drinkwater",
    email: "info@drive365.co.uk",
    emailVerified: true,
    phone: "07000 000 000",
    phoneVerified: true,
    address: "14 Cherry Tree Lane, Kings Langley, WD4 8RF",
    timezone: "Europe/London",
    avatarColor: "blue",
    photoUrl: null as string | null,
  },
  business: {
    dvsaBadge: "123456",
    dvsaGrade: "A",
    dvsaType: "ADI",
    tradingName: "Ken Driving",
    bio: "Ten years teaching learners across Hertfordshire. Calm, patient, and known for getting nervous drivers test-ready.",
    dbsUploaded: false,
    serviceAreas: ["Watford", "Kings Langley", "Hemel Hempstead"],
  },
  vehicle: {
    make: "Vauxhall",
    model: "Corsa",
    reg: "KD24 ABC",
    transmission: "manual" as "manual" | "automatic" | "both",
    dualControls: true,
    insuranceExpiry: "2027-01-14",
  },
  notifications: {
    newBooking:      { email: true,  sms: true,  push: true },
    lessonReminder:  { email: true,  sms: false, push: true },
    paymentReceived: { email: true,  sms: false, push: true },
    paymentFailed:   { email: true,  sms: true,  push: true },
    pupilCancelled:  { email: true,  sms: true,  push: false },
    pupilDormant21d: { email: true,  sms: false, push: false },
    testResult:      { email: true,  sms: false, push: true },
    weeklySummary:   { email: true,  sms: false, push: false },
    marketing:       { email: false, sms: false, push: false },
  },
  security: {
    passwordLastChanged: "2026-01-26",
    twoFactor: true,
    twoFactorMethod: "authenticator",
    activeSessions: 3,
    loginAlerts: true,
  },
  integrations: [
    { id: "square",    name: "Square",            connected: true,  description: "Take card payments and auto-payouts.",                  color: "#00C2A0" },
    { id: "whatsapp",  name: "WhatsApp Business", connected: true,  description: "Send messages and reminders via WhatsApp.",             color: "#25D366" },
    { id: "gcal",      name: "Google Calendar",   connected: false, description: "Two-way sync your DSM schedule with Google Calendar.", color: "#4285F4" },
    { id: "apple-cal", name: "Apple Calendar",    connected: false, description: "Subscribe to your DSM schedule on iPhone.",             color: "#000000" },
    { id: "mailchimp", name: "Mailchimp",         connected: false, description: "Email broadcasts to your pupil list.",                  color: "#FFE01B" },
    { id: "ttp",      name: "Theory Test Pro",   connected: false, description: "Set theory practice for your pupils.",                  color: "#0EA5E9" },
  ],
};

type Profile = typeof initialProfile;
type NotifKey = keyof Profile["notifications"];

const SECTIONS = [
  { id: "personal",      label: "Personal" },
  { id: "business",      label: "Business" },
  { id: "vehicle",       label: "Vehicle" },
  { id: "notifications", label: "Notifications" },
  { id: "security",      label: "Security" },
  { id: "integrations",  label: "Integrations" },
  { id: "danger",        label: "Danger zone" },
];

// ---------- shared style helpers ----------
const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "0.5px solid #E2E8F0",
  borderRadius: 12,
  overflow: "hidden",
};
const fieldRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: 14,
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "0.5px solid #E2E8F0",
};
const label: React.CSSProperties = { fontSize: 11, color: "#64748B" };
const inputCss: React.CSSProperties = {
  background: "#F8FAFC",
  border: "0.5px solid #E2E8F0",
  borderRadius: 6,
  padding: "7px 10px",
  fontSize: 12,
  color: "#0F172A",
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
};
const verifiedPill: React.CSSProperties = {
  background: "#ECFDF5",
  color: "#047857",
  fontSize: 9,
  fontWeight: 600,
  padding: "2px 7px",
  borderRadius: 6,
  letterSpacing: "0.4px",
};

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", margin: 0 }}>{title}</h3>
      <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{subtitle}</div>
    </div>
  );
}

function Toggle({ on, onChange, color = "#4F46E5" }: { on: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 28, height: 16, borderRadius: 999,
        background: on ? color : "#CBD5E1",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 150ms ease",
      }}
      aria-pressed={on}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 14 : 2,
        width: 12, height: 12, borderRadius: "50%", background: "#fff",
        transition: "left 150ms ease",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function OutlineBtn({ children, onClick, color = "#0F172A", style }: {
  children: React.ReactNode; onClick?: () => void; color?: string; style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "#fff", border: "0.5px solid #CBD5E1",
        color, fontSize: 11, fontWeight: 500,
        padding: "5px 10px", borderRadius: 6, cursor: "pointer",
        ...style,
      }}
    >{children}</button>
  );
}

// ---------- main ----------
export default function InstructorProfileDesktop() {
  const { instructor, signOut } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [dirty, setDirty] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [highlightField, setHighlightField] = useState<string | null>(null);
  const [completionAnim, setCompletionAnim] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Patch helper
  function patch<K extends keyof Profile>(key: K, value: Partial<Profile[K]>) {
    setProfile((p) => ({ ...p, [key]: { ...(p[key] as object), ...value } } as Profile));
    setDirty(true);
  }
  function patchNotif(k: NotifKey, channel: "email" | "sms" | "push", v: boolean) {
    setProfile((p) => ({
      ...p,
      notifications: { ...p.notifications, [k]: { ...p.notifications[k], [channel]: v } },
    }));
    setDirty(true);
  }

  // Profile completion
  const completion = useMemo(() => {
    const fields = [
      !!profile.personal.firstName,
      !!profile.personal.lastName,
      !!profile.personal.email,
      !!profile.personal.phone,
      !!profile.personal.address,
      !!profile.business.dvsaBadge,
      !!profile.business.tradingName,
      !!profile.business.bio,
      profile.business.dbsUploaded,
      !!profile.vehicle.make,
      !!profile.personal.photoUrl,
    ];
    const total = fields.length;
    const done = fields.filter(Boolean).length;
    return Math.round((done / total) * 100);
  }, [profile]);

  const missing = useMemo(() => {
    const out: { key: string; label: string; section: string }[] = [];
    if (!profile.business.dbsUploaded) out.push({ key: "dbs", label: "+ DBS check", section: "business" });
    if (!profile.business.bio || profile.business.bio.length < 30) out.push({ key: "bio", label: "+ Bio", section: "business" });
    if (!profile.personal.photoUrl) out.push({ key: "photo", label: "+ Photo", section: "personal" });
    return out.slice(0, 2);
  }, [profile]);

  // Animate completion bar in
  useEffect(() => {
    const id = requestAnimationFrame(() => setCompletionAnim(completion));
    return () => cancelAnimationFrame(id);
  }, [completion]);

  // Section observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).dataset.sectionId;
          if (id) {
            setActiveSection(id);
            history.replaceState(null, "", `#${id}`);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.1, 0.5] }
    );
    SECTIONS.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function scrollToSection(id: string) {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function jumpToField(section: string, fieldKey: string) {
    scrollToSection(section);
    setHighlightField(fieldKey);
    setTimeout(() => setHighlightField(null), 1500);
  }

  function handleSave() {
    setDirty(false);
    toast.success("Profile updated");
  }

  const initials = `${profile.personal.firstName[0] || ""}${profile.personal.lastName[0] || ""}`.toUpperCase();
  const avatarColor = ramp[profile.personal.avatarColor] || ramp.blue;

  return (
    <DashboardShell
      userInitials={initials}
      userName={`${profile.personal.firstName} ${profile.personal.lastName}`.trim()}
      notificationCount={notificationCount}
      onSignOut={signOut}
      onAskED={() => { /* noop */ }}
      onBell={() => { /* noop */ }}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: 24,
        maxWidth: 1180,
        margin: "0 auto",
      }}>
        {/* Section nav */}
        <aside style={{ position: "sticky", top: 80, alignSelf: "start" }}>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 14 }}>
            Settings / <span style={{ color: "#0F172A", fontWeight: 500 }}>Profile</span>
          </div>
          <div style={{
            fontSize: 10, color: "#94A3B8", textTransform: "uppercase",
            letterSpacing: "0.6px", marginBottom: 8,
          }}>JUMP TO</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {SECTIONS.map((s) => {
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: active ? 500 : 400,
                    background: active ? "#EEF2FF" : "transparent",
                    color: active ? "#4F46E5" : "#64748B",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 120ms ease",
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget.style.background = "#F8FAFC"); }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget.style.background = "transparent"); }}
                >{s.label}</button>
              );
            })}
          </nav>
        </aside>

        {/* Form column */}
        <div style={{ minWidth: 0 }}>
          {/* Header card */}
          <div style={{ ...card, padding: 18, marginBottom: 18, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: avatarColor.bg, color: avatarColor.text,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 500,
              }}>{initials}</div>
              <button style={{
                position: "absolute", bottom: -2, right: -2,
                width: 22, height: 22, borderRadius: "50%",
                background: "#fff", border: "0.5px solid #E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", padding: 0,
              }} aria-label="Change photo">
                <Camera size={11} color="#0F172A" />
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 500, color: "#0F172A" }}>
                  {profile.personal.firstName} {profile.personal.lastName}
                </span>
                <span style={verifiedPill}>VERIFIED</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                DVSA-approved instructor · Watford, UK
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                Member since March 2024 · 2,184 lessons taught
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <OutlineBtn onClick={() => window.open("/", "_blank")}>
                <ExternalLink size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
                View public site
              </OutlineBtn>
              <button
                disabled={!dirty}
                onClick={handleSave}
                style={{
                  background: dirty ? "#4F46E5" : "#fff",
                  color: dirty ? "#fff" : "#94A3B8",
                  border: dirty ? "none" : "0.5px solid #E2E8F0",
                  fontSize: 11, fontWeight: 500,
                  padding: "5px 12px", borderRadius: 6,
                  cursor: dirty ? "pointer" : "default",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {dirty && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />}
                Save changes
              </button>
            </div>
          </div>

          {/* Completion */}
          <div style={{ ...card, padding: "12px 14px", marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#0F172A" }}>
                  Profile {completion}% complete
                </div>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                  Add {missing.length} more details to unlock priority listing on the public marketplace.
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {missing.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => jumpToField(m.section, m.key)}
                    style={{
                      background: "#FEF3C7", color: "#B45309",
                      fontSize: 9, fontWeight: 500,
                      padding: "2px 7px", borderRadius: 6,
                      border: "none", cursor: "pointer",
                    }}
                  >{m.label}</button>
                ))}
              </div>
            </div>
            <div style={{
              height: 4, background: "#F1F5F9", borderRadius: 2,
              marginTop: 10, overflow: "hidden",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionAnim}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ height: "100%", background: "#4F46E5" }}
              />
            </div>
          </div>

          {/* PERSONAL */}
          <section
            ref={(el) => (sectionRefs.current.personal = el)}
            data-section-id="personal"
            id="personal"
            style={{ marginBottom: 24, scrollMarginTop: 80 }}
          >
            <SectionHeader title="Personal" subtitle="Your name, contact and account essentials." />
            <div style={card}>
              <div style={fieldRow}>
                <span style={label}>Full name</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input style={inputCss} value={profile.personal.firstName}
                    onChange={(e) => patch("personal", { firstName: e.target.value })} />
                  <input style={inputCss} value={profile.personal.lastName}
                    onChange={(e) => patch("personal", { lastName: e.target.value })} />
                </div>
              </div>

              <div style={fieldRow}>
                <span style={label}>Email</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input style={inputCss} value={profile.personal.email}
                    onChange={(e) => patch("personal", { email: e.target.value })} />
                  {profile.personal.emailVerified && <span style={verifiedPill}>VERIFIED</span>}
                </div>
              </div>

              <div style={fieldRow}>
                <span style={label}>Phone</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input style={inputCss} value={profile.personal.phone}
                    onChange={(e) => patch("personal", { phone: e.target.value })} />
                  {profile.personal.phoneVerified && <span style={verifiedPill}>VERIFIED</span>}
                </div>
              </div>

              <div style={fieldRow}>
                <span style={label}>Address</span>
                <div>
                  <input style={inputCss} value={profile.personal.address}
                    onChange={(e) => patch("personal", { address: e.target.value })} />
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                    Used for invoices and tax. Never shown publicly.
                  </div>
                </div>
              </div>

              <div style={{ ...fieldRow, borderBottom: "none" }}>
                <span style={label}>Timezone</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input style={{ ...inputCss, paddingRight: 26 }} value={profile.personal.timezone}
                      onChange={(e) => patch("personal", { timezone: e.target.value })} />
                    <ChevronDown size={12} style={{
                      position: "absolute", right: 8, top: "50%",
                      transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none",
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap" }}>Auto-detected</span>
                </div>
              </div>
            </div>
          </section>

          {/* BUSINESS */}
          <section
            ref={(el) => (sectionRefs.current.business = el)}
            data-section-id="business"
            id="business"
            style={{ marginBottom: 24, scrollMarginTop: 80 }}
          >
            <SectionHeader title="Business" subtitle="Credentials and details shown on invoices and your public site." />
            <div style={card}>
              <div style={fieldRow}>
                <span style={label}>DVSA badge</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input style={{ ...inputCss, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                    value={profile.business.dvsaBadge}
                    onChange={(e) => patch("business", { dvsaBadge: e.target.value })} />
                  <span style={verifiedPill}>{profile.business.dvsaType} · GRADE {profile.business.dvsaGrade}</span>
                </div>
              </div>

              <div style={fieldRow}>
                <span style={label}>Trading name</span>
                <input style={inputCss} value={profile.business.tradingName}
                  onChange={(e) => patch("business", { tradingName: e.target.value })} />
              </div>

              <div style={{
                ...fieldRow,
                background: highlightField === "bio" ? "#FFFBEB" : undefined,
                transition: "background 600ms ease",
              }}>
                <span style={label}>Bio</span>
                <div>
                  <textarea
                    style={{ ...inputCss, minHeight: 50, fontSize: 11, lineHeight: 1.45, resize: "vertical" }}
                    value={profile.business.bio}
                    maxLength={240}
                    onChange={(e) => patch("business", { bio: e.target.value })}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>Shown on your public booking site.</span>
                    <span style={{
                      fontSize: 10, fontFamily: "ui-monospace, monospace",
                      color: profile.business.bio.length >= 240 ? "#BE123C" : "#94A3B8",
                    }}>{profile.business.bio.length} / 240</span>
                  </div>
                </div>
              </div>

              <div style={{
                ...fieldRow,
                background: highlightField === "dbs" ? "#FFFBEB" : undefined,
                transition: "background 600ms ease",
              }}>
                <span style={label}>DBS check</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {profile.business.dbsUploaded ? (
                    <div style={{ flex: 1, fontSize: 11, color: "#0F172A" }}>
                      ✓ Uploaded — DBS-2024-001234.pdf · Expires Jun 2027{" "}
                      <button style={{
                        background: "none", border: "none", color: "#4F46E5",
                        fontSize: 11, cursor: "pointer", padding: 0, marginLeft: 6,
                      }}>Replace</button>
                    </div>
                  ) : (
                    <div style={{
                      flex: 1, display: "flex", alignItems: "center", gap: 6,
                      background: "#FEF3C7", color: "#B45309",
                      padding: "7px 10px", borderRadius: 6, fontSize: 11,
                    }}>
                      <AlertTriangle size={12} />
                      Not uploaded — upload to verify
                    </div>
                  )}
                  {!profile.business.dbsUploaded && (
                    <OutlineBtn onClick={() => { patch("business", { dbsUploaded: true }); toast.success("DBS uploaded"); }}>
                      <Upload size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
                      Upload PDF
                    </OutlineBtn>
                  )}
                </div>
              </div>

              <ServiceAreasRow
                areas={profile.business.serviceAreas}
                onChange={(areas) => patch("business", { serviceAreas: areas })}
              />
            </div>
          </section>

          {/* VEHICLE */}
          <section
            ref={(el) => (sectionRefs.current.vehicle = el)}
            data-section-id="vehicle"
            id="vehicle"
            style={{ marginBottom: 24, scrollMarginTop: 80 }}
          >
            <SectionHeader title="Vehicle" subtitle="Your tuition vehicle, shown to pupils on booking." />
            <div style={card}>
              <div style={fieldRow}>
                <span style={label}>Make / model</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input style={inputCss} value={profile.vehicle.make}
                    onChange={(e) => patch("vehicle", { make: e.target.value })} />
                  <input style={inputCss} value={profile.vehicle.model}
                    onChange={(e) => patch("vehicle", { model: e.target.value })} />
                </div>
              </div>

              <div style={fieldRow}>
                <span style={label}>Registration</span>
                <input style={{ ...inputCss, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", textTransform: "uppercase" }}
                  value={profile.vehicle.reg}
                  onChange={(e) => patch("vehicle", { reg: e.target.value.toUpperCase() })} />
              </div>

              <div style={fieldRow}>
                <span style={label}>Transmission</span>
                <div style={{ display: "inline-flex", border: "0.5px solid #E2E8F0", borderRadius: 6, overflow: "hidden", background: "#F8FAFC", width: "fit-content" }}>
                  {(["manual", "automatic", "both"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => patch("vehicle", { transmission: t })}
                      style={{
                        background: profile.vehicle.transmission === t ? "#4F46E5" : "transparent",
                        color: profile.vehicle.transmission === t ? "#fff" : "#64748B",
                        border: "none", fontSize: 11, padding: "6px 14px",
                        cursor: "pointer", textTransform: "capitalize",
                      }}
                    >{t}</button>
                  ))}
                </div>
              </div>

              <div style={fieldRow}>
                <span style={label}>Dual controls</span>
                <Toggle on={profile.vehicle.dualControls}
                  onChange={(v) => patch("vehicle", { dualControls: v })} />
              </div>

              <div style={fieldRow}>
                <span style={label}>Vehicle photo</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{
                    width: 80, height: 50, borderRadius: 6,
                    border: "0.5px dashed #CBD5E1", background: "#F8FAFC",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: "#94A3B8",
                  }}>Drag & drop</div>
                  <button style={{ background: "none", border: "none", color: "#4F46E5", fontSize: 11, cursor: "pointer", padding: 0 }}>Replace</button>
                </div>
              </div>

              <div style={{ ...fieldRow, borderBottom: "none" }}>
                <span style={label}>Insurance expiry</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="date" style={{ ...inputCss, width: 160 }}
                    value={profile.vehicle.insuranceExpiry}
                    onChange={(e) => patch("vehicle", { insuranceExpiry: e.target.value })} />
                  <InsuranceStatus expiry={profile.vehicle.insuranceExpiry} />
                </div>
              </div>
            </div>
          </section>

          {/* NOTIFICATIONS */}
          <section
            ref={(el) => (sectionRefs.current.notifications = el)}
            data-section-id="notifications"
            id="notifications"
            style={{ marginBottom: 24, scrollMarginTop: 80 }}
          >
            <SectionHeader title="Notifications" subtitle="Choose how DSM keeps you in the loop." />
            <div style={card}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 60px 60px 60px",
                padding: "10px 16px", borderBottom: "0.5px solid #E2E8F0",
                fontSize: 9, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.6px",
              }}>
                <span />
                <span style={{ textAlign: "center" }}>Email</span>
                <span style={{ textAlign: "center" }}>SMS</span>
                <span style={{ textAlign: "center" }}>Push</span>
              </div>
              {(Object.entries(NOTIF_LABELS) as [NotifKey, { title: string; sub: string }][]).map(([k, meta], i, arr) => (
                <div key={k} style={{
                  display: "grid", gridTemplateColumns: "1fr 60px 60px 60px",
                  padding: "12px 16px", alignItems: "center",
                  borderBottom: i === arr.length - 1 ? "none" : "0.5px solid #E2E8F0",
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#0F172A" }}>{meta.title}</div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>{meta.sub}</div>
                  </div>
                  {(["email", "sms", "push"] as const).map((c) => (
                    <div key={c} style={{ display: "flex", justifyContent: "center" }}>
                      <Toggle on={profile.notifications[k][c]} onChange={(v) => patchNotif(k, c, v)} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* SECURITY */}
          <section
            ref={(el) => (sectionRefs.current.security = el)}
            data-section-id="security"
            id="security"
            style={{ marginBottom: 24, scrollMarginTop: 80 }}
          >
            <SectionHeader title="Security" subtitle="Keep your account safe." />
            <div style={card}>
              <SecurityRow
                title="Password"
                sub="Last changed 14 weeks ago"
                subAmber
                action={<OutlineBtn>Change password</OutlineBtn>}
              />
              <SecurityRow
                title={<>Two-factor authentication <span style={verifiedPill}>ON</span></>}
                sub="Code via authenticator app · Recovery codes generated"
                action={<Toggle on={profile.security.twoFactor} onChange={(v) => patch("security", { twoFactor: v })} />}
              />
              <SecurityRow
                title="Active sessions"
                sub="3 devices · iPhone (this), Mac, iPad"
                action={<OutlineBtn>Manage</OutlineBtn>}
              />
              <SecurityRow
                title="Login alerts"
                sub="Email me whenever a new device signs in"
                action={<Toggle on={profile.security.loginAlerts} onChange={(v) => patch("security", { loginAlerts: v })} />}
              />
              <SecurityRow
                title="Recovery codes"
                sub="Last viewed 3 months ago"
                last
                action={
                  <div style={{ display: "flex", gap: 6 }}>
                    <OutlineBtn>View</OutlineBtn>
                    <OutlineBtn>Regenerate</OutlineBtn>
                  </div>
                }
              />
            </div>
          </section>

          {/* INTEGRATIONS */}
          <section
            ref={(el) => (sectionRefs.current.integrations = el)}
            data-section-id="integrations"
            id="integrations"
            style={{ marginBottom: 24, scrollMarginTop: 80 }}
          >
            <SectionHeader title="Integrations" subtitle="Connect external tools to speed up your workflow." />
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
            }}>
              {profile.integrations.map((it) => (
                <div key={it.id} style={{
                  background: "#fff", border: "0.5px solid #E2E8F0",
                  borderRadius: 8, padding: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: it.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: it.color === "#FFE01B" ? "#000" : "#fff",
                      fontSize: 14, fontWeight: 700,
                    }}>{it.name[0]}</div>
                    {it.connected && <span style={verifiedPill}>CONNECTED</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{it.name}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, marginBottom: 10, lineHeight: 1.4 }}>
                    {it.description}
                  </div>
                  {it.connected ? (
                    <OutlineBtn
                      onClick={() => {
                        setProfile((p) => ({
                          ...p,
                          integrations: p.integrations.map((x) =>
                            x.id === it.id ? { ...x, connected: false } : x),
                        }));
                        toast(`${it.name} disconnected`);
                      }}
                      style={{ width: "100%" }}
                    >Disconnect</OutlineBtn>
                  ) : (
                    <button
                      onClick={() => {
                        setProfile((p) => ({
                          ...p,
                          integrations: p.integrations.map((x) =>
                            x.id === it.id ? { ...x, connected: true } : x),
                        }));
                        toast.success(`${it.name} connected`);
                      }}
                      style={{
                        background: "#4F46E5", color: "#fff", border: "none",
                        fontSize: 11, fontWeight: 500,
                        padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                        width: "100%",
                      }}
                    >Connect</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* DANGER ZONE */}
          <section
            ref={(el) => (sectionRefs.current.danger = el)}
            data-section-id="danger"
            id="danger"
            style={{ marginBottom: 40, scrollMarginTop: 80 }}
          >
            <SectionHeader title="Danger zone" subtitle="These actions are permanent. Take a breath first." />
            <div style={{ ...card, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#0F172A" }}>Delete account</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  Permanently remove your account and all pupil data. This cannot be undone.
                </div>
              </div>
              <OutlineBtn color="#BE123C" onClick={() => setDeleteOpen(true)}>Delete account</OutlineBtn>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky save bar */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            style={{
              position: "fixed", bottom: 16, right: 16, zIndex: 50,
              background: "#0F172A", color: "#fff",
              borderRadius: 10, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 8px 24px rgba(15,23,42,0.2)",
              fontSize: 12,
            }}
          >
            <span>Unsaved changes</span>
            <button onClick={() => { setProfile(initialProfile); setDirty(false); }}
              style={{ background: "transparent", color: "#CBD5E1", border: "none", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave}
              style={{ background: "#4F46E5", color: "#fff", border: "none", fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 6, cursor: "pointer" }}>Save</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete dialog */}
      <AnimatePresence>
        {deleteOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(15,23,42,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
            }}
            onClick={() => setDeleteOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: 12, padding: 24,
                width: "100%", maxWidth: 440,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 500, color: "#0F172A", marginBottom: 6 }}>Delete account</div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16, lineHeight: 1.5 }}>
                This permanently deletes your pupils, lessons, payment history, and public booking site. There is no recovery.
              </div>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>
                Type <span style={{ fontWeight: 500, color: "#0F172A" }}>{profile.personal.email}</span> to confirm
              </div>
              <input
                style={inputCss}
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
                placeholder={profile.personal.email}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <OutlineBtn onClick={() => { setDeleteOpen(false); setDeleteEmail(""); }}>Cancel</OutlineBtn>
                <button
                  disabled={deleteEmail !== profile.personal.email}
                  onClick={() => { toast.error("Account deletion requested"); setDeleteOpen(false); }}
                  style={{
                    background: deleteEmail === profile.personal.email ? "#BE123C" : "#FCA5A5",
                    color: "#fff", border: "none", fontSize: 11, fontWeight: 500,
                    padding: "6px 12px", borderRadius: 6,
                    cursor: deleteEmail === profile.personal.email ? "pointer" : "not-allowed",
                  }}
                >Delete account</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

// ---------- subcomponents ----------

const NOTIF_LABELS: Record<keyof Profile["notifications"], { title: string; sub: string }> = {
  newBooking:      { title: "New booking from a pupil",    sub: "When a pupil books a new lesson" },
  lessonReminder:  { title: "Lesson reminder",             sub: "Pre-lesson nudge for both sides" },
  paymentReceived: { title: "Payment received",            sub: "Card or cash settled" },
  paymentFailed:   { title: "Payment failed",              sub: "Declined card or chargeback" },
  pupilCancelled:  { title: "Pupil cancelled",             sub: "When a pupil cancels a booked lesson" },
  pupilDormant21d: { title: "Pupil hasn't booked in 21 days", sub: "Re-engagement signal" },
  testResult:      { title: "Test result outcome",         sub: "Pass or fail recorded" },
  weeklySummary:   { title: "Weekly summary",              sub: "Earnings, lessons, retention digest" },
  marketing:       { title: "Marketing & product updates", sub: "Tips, new features, occasional offers" },
};

function SecurityRow({ title, sub, action, last, subAmber }: {
  title: React.ReactNode; sub: string; action: React.ReactNode; last?: boolean; subAmber?: boolean;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 16px", gap: 12,
      borderBottom: last ? "none" : "0.5px solid #E2E8F0",
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 10, color: subAmber ? "#B45309" : "#64748B", marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{action}</div>
    </div>
  );
}

function ServiceAreasRow({ areas, onChange }: {
  areas: string[]; onChange: (areas: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    const v = draft.trim();
    if (v && !areas.includes(v)) onChange([...areas, v]);
    setDraft(""); setAdding(false);
  }

  return (
    <div style={{ ...fieldRow, borderBottom: "none" }}>
      <span style={label}>Service area</span>
      <div style={{
        background: "#F8FAFC", border: "0.5px solid #E2E8F0", borderRadius: 6,
        padding: 8, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
      }}>
        {areas.map((a) => (
          <span key={a} style={{
            background: "#EEF2FF", color: "#4F46E5",
            fontSize: 11, padding: "2px 8px", borderRadius: 5,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            {a}
            <button
              onClick={() => onChange(areas.filter((x) => x !== a))}
              style={{ background: "none", border: "none", color: "#4F46E5", opacity: 0.6, cursor: "pointer", padding: 0, display: "flex" }}
            ><X size={10} /></button>
          </span>
        ))}
        {adding ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(""); setAdding(false); }
              if (e.key === "Backspace" && draft === "" && areas.length > 0) {
                onChange(areas.slice(0, -1));
              }
            }}
            placeholder="Town or postcode"
            style={{ ...inputCss, width: 140, padding: "2px 6px", fontSize: 11, height: 22, background: "#fff" }}
          />
        ) : (
          <button onClick={() => setAdding(true)} style={{
            background: "transparent", border: "0.5px dashed #CBD5E1",
            color: "#64748B", fontSize: 11, padding: "2px 8px", borderRadius: 5,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3,
          }}>
            <Plus size={10} /> Add area
          </button>
        )}
      </div>
    </div>
  );
}

function InsuranceStatus({ expiry }: { expiry: string }) {
  const exp = new Date(expiry);
  const now = new Date();
  const months = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  let style = { bg: "#ECFDF5", color: "#047857" }, label = "Valid";
  if (months < 0) { style = { bg: "#FCEBEB", color: "#791F1F" }; label = "Expired"; }
  else if (months < 2) { style = { bg: "#FEF3C7", color: "#B45309" }; label = "Expires soon"; }
  else label = `Valid · ${Math.floor(months)} months left`;
  return (
    <span style={{
      background: style.bg, color: style.color,
      fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 6,
    }}>{label}</span>
  );
}
