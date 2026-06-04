import { Badge, BadgeTone } from "./Badge";

const daysUntil = (dateStr: string | null | undefined): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return null;
  return Math.floor((d - Date.now()) / 86_400_000);
};

const expiryBadge = (dateStr: string | null | undefined, label: string): { tone: BadgeTone; text: string } => {
  const days = daysUntil(dateStr);
  if (days === null) return { tone: "grey", text: "Not set" };
  if (days < 0) return { tone: "red", text: `${label} expired` };
  if (days <= 90) return { tone: "amber", text: `${label} • ${days}d` };
  return { tone: "green", text: `${label} ✓` };
};

export function InstructorHeroCard({ instructor, passRate, activePupils }: { instructor: Record<string, any>; passRate?: number | null; activePupils?: number | null }) {
  const initials = (instructor.name || "?")
    .split(" ")
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = instructor.created_at
    ? new Date(instructor.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : null;

  const adiBadge = expiryBadge(instructor.adi_badge_expiry, "ADI");
  const dbsBadge = expiryBadge(instructor.dbs_certificate_expiry, "DBS");
  const insBadge = expiryBadge(instructor.car_insurance_expiry, "Insurance");

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB" }}>
      {/* Hero */}
      <div style={{ padding: 16, borderBottom: "1px solid #F3F4F6", textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "#1E4D9B", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700,
              overflow: "hidden",
            }}
          >
            {instructor.profile_image_url ? (
              <img src={instructor.profile_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : initials}
          </div>
          {instructor.is_active && (
            <div
              style={{
                position: "absolute", bottom: 0, right: 0,
                width: 16, height: 16, borderRadius: "50%",
                background: "#059669", border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 9,
              }}
            >
              ✓
            </div>
          )}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0A0E27" }}>{instructor.name || "Unnamed"}</div>
        <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>
          {[instructor.instructor_grade || "ADI", instructor.home_postcode, memberSince && `since ${memberSince}`]
            .filter(Boolean).join(" · ")}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #F3F4F6" }}>
        <Stat color="#059669" value={passRate != null ? `${passRate}%` : "—"} label="Pass rate" />
        <Stat value="—" label="Students" />
        <Stat value={instructor.cpd_hours_logged != null ? String(instructor.cpd_hours_logged) : "—"} label="CPD hrs" last />
      </div>

      {/* Fields */}
      <div style={{ padding: "4px 0" }}>
        <Field label="Status" value={
          <Badge tone={instructor.is_active ? "green" : "red"}>{instructor.is_active ? "Active" : "Suspended"}</Badge>
        }/>
        <Field label="Grade" value={
          instructor.instructor_grade
            ? <Badge tone="purple">{instructor.instructor_grade}</Badge>
            : <Badge tone="grey">—</Badge>
        }/>
        <Field label="Email" value={
          instructor.email
            ? <a href={`mailto:${instructor.email}`} style={{ color: "#0070C0", textDecoration: "none" }}>{instructor.email}</a>
            : "—"
        }/>
        <Field label="Phone" value={instructor.phone || "—"} />
        <Field label="ADI badge" value={
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {instructor.adi_badge_number || "—"}
            <Badge tone={adiBadge.tone}>{adiBadge.text}</Badge>
          </span>
        }/>
        <Field label="DBS" value={<Badge tone={dbsBadge.tone}>{dbsBadge.text}</Badge>} />
        <Field label="Insurance" value={<Badge tone={insBadge.tone}>{insBadge.text}</Badge>} />
      </div>
    </div>
  );
}

function Stat({ value, label, color, last }: { value: string; label: string; color?: string; last?: boolean }) {
  return (
    <div style={{
      padding: "8px 4px", textAlign: "center",
      borderRight: last ? "none" : "1px solid #F3F4F6",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: color || "#0A0E27" }}>{value}</div>
      <div style={{ fontSize: 8, color: "#9CA3AF", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "7px 12px", borderBottom: "1px solid #F3F4F6", fontSize: 11 }}>
      <div style={{ width: 80, fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>{label}</div>
      <div style={{ flex: 1, color: "#0A0E27", fontWeight: 500, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}
