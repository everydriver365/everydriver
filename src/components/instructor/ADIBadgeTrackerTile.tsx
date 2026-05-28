import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ExternalLink } from "lucide-react";
import { differenceInCalendarDays, parseISO, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { TileCard } from "@/components/instructor/ui";
import { Icon3D } from "@/components/Icon3D";

interface ADIBadgeTrackerTileProps {
  instructorId: string;
}

const FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';
const SETTINGS_ROUTE = "/instructor/settings/account";
const RENEW_URL = "https://www.gov.uk/renew-adi-badge";

const BadgeIcon = () => <Icon3D name="adi-badge" size={44} />;

interface AdiData {
  adi_badge_number: string | null;
  adi_badge_expiry: string | null;
  adi_grade: string | null;
}

export function ADIBadgeTrackerTile({ instructorId }: ADIBadgeTrackerTileProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<AdiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: row } = await supabase
        .from("instructors")
        .select("adi_badge_number, adi_badge_expiry, adi_grade")
        .eq("id", instructorId)
        .maybeSingle();
      if (!cancelled) {
        setData((row as AdiData) ?? { adi_badge_number: null, adi_badge_expiry: null, adi_grade: null });
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [instructorId]);

  if (loading) {
    return (
      <TileCard ariaLabel="ADI badge loading">
        <div style={inner}>
          <div style={{ height: 36, background: "#F2F4F8", borderRadius: 10, width: "60%" }} />
        </div>
      </TileCard>
    );
  }

  const expiryStr = data?.adi_badge_expiry ?? null;
  const badgeNum = data?.adi_badge_number ?? null;
  const grade = data?.adi_grade ?? null;

  // ─── Not set ──────────────────────────────────────────────────────────────
  if (!expiryStr) {
    return (
      <TileCard onClick={() => navigate(SETTINGS_ROUTE)} ariaLabel="Add ADI badge details">
        <div style={inner}>
          <div style={row}>
            <BadgeIcon />
            <div style={textCol}>
              <div style={titleStyle}>ADI Badge</div>
              <div style={subStyle}>Badge details not set</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#2952b3", fontSize: 11, fontWeight: 600 }}>
              Add details<ChevronRight size={12} />
            </div>
          </div>
        </div>
      </TileCard>
    );
  }

  const expiryDate = parseISO(expiryStr);
  const today = new Date();
  const daysLeft = differenceInCalendarDays(expiryDate, today);
  const expiryFormatted = format(expiryDate, "d MMM yyyy");

  // ─── Expired ──────────────────────────────────────────────────────────────
  if (daysLeft <= 0) {
    return (
      <TileCard accentColor="red" ariaLabel="ADI badge expired">
        <div style={inner}>
          <div style={row}>
            <BadgeIcon />
            <div style={textCol}>
              <div style={titleStyle}>ADI Badge — EXPIRED</div>
              <div style={subStyle}>Expired {expiryFormatted}</div>
            </div>
            <Badge label="EXPIRED" bg="#fbe8e8" fg="#c9302c" />
          </div>
          <RenewButton />
        </div>
      </TileCard>
    );
  }

  // ─── Urgent (≤30 days) ────────────────────────────────────────────────────
  if (daysLeft <= 30) {
    return (
      <TileCard accentColor="red" ariaLabel={`ADI badge expires in ${daysLeft} days`}>
        <div style={inner}>
          <div style={row}>
            <BadgeIcon />
            <div style={textCol}>
              <div style={titleStyle}>ADI Badge — Renew now</div>
              <div style={subStyle}>Expires {expiryFormatted}</div>
            </div>
            <Badge label={`${daysLeft} ${daysLeft === 1 ? "day" : "days"}`} bg="#fbe8e8" fg="#c9302c" />
          </div>
          <RenewButton />
        </div>
      </TileCard>
    );
  }

  // ─── Renew soon (31–90 days) ──────────────────────────────────────────────
  if (daysLeft <= 90) {
    return (
      <TileCard accentColor="amber" onClick={() => navigate(SETTINGS_ROUTE)} ariaLabel={`ADI badge expires in ${daysLeft} days`}>
        <div style={inner}>
          <div style={row}>
            <BadgeIcon />
            <div style={textCol}>
              <div style={titleStyle}>ADI Badge</div>
              <div style={subStyle}>Renew by {expiryFormatted}</div>
            </div>
            <Badge label={`${daysLeft} days`} bg="#fff3e0" fg="#d97706" />
          </div>
        </div>
      </TileCard>
    );
  }

  // ─── Valid (>90 days) ─────────────────────────────────────────────────────
  return (
    <TileCard onClick={() => navigate(SETTINGS_ROUTE)} ariaLabel="ADI badge valid">
      <div style={inner}>
        <div style={row}>
          <BadgeIcon />
          <div style={textCol}>
            <div style={titleStyle}>ADI Badge</div>
            <div style={subStyle}>
              {badgeNum ? `${badgeNum} · ` : ""}Valid until {expiryFormatted}
            </div>
          </div>
          {grade && <Badge label={`Grade ${grade}`} bg="#e8eefb" fg="#2952b3" />}
        </div>
      </div>
    </TileCard>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function IconBox({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 9, background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 10,
      background: bg, color: fg, letterSpacing: 0.3, textTransform: "uppercase",
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function RenewButton() {
  return (
    <a
      href={RENEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        width: "100%", padding: "10px 14px", borderRadius: 9,
        background: "#c9302c", color: "#ffffff", fontSize: 13, fontWeight: 600,
        textDecoration: "none", fontFamily: FONT,
      }}
    >
      Renew on GOV.UK <ExternalLink size={13} />
    </a>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const inner: React.CSSProperties = { padding: 14, fontFamily: FONT };
const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12 };
const textCol: React.CSSProperties = { flex: 1, minWidth: 0 };
const titleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#1a1a1f", lineHeight: 1.3 };
const subStyle: React.CSSProperties = { fontSize: 11, color: "#888888", lineHeight: 1.3, marginTop: 2 };

export default ADIBadgeTrackerTile;
