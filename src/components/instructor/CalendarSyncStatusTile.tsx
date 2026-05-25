import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CalendarSync } from "lucide-react";
import { TileCard } from "@/components/instructor/ui";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  instructorId: string;
}

const FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';
const INNER: React.CSSProperties = { padding: 14, fontFamily: FONT };

const eyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.6,
  color: "#8a93a4",
  textTransform: "uppercase",
};

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function CalendarSyncStatusTile({ instructorId }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);

    const [{ data: conn }, { count: pCount }, { count: fCount }] = await Promise.all([
      supabase
        .from("instructor_google_service_calendar")
        .select("last_sync, is_active")
        .eq("instructor_id", instructorId)
        .maybeSingle(),
      supabase
        .from("scheduled_lessons")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .eq("calendar_sync_status", "pending"),
      supabase
        .from("scheduled_lessons")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .eq("calendar_sync_status", "failed"),
    ]);

    setConnected(!!conn?.is_active);
    setLastSync(conn?.last_sync ?? null);
    setPending(pCount ?? 0);
    setFailed(fCount ?? 0);
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { load(); }, [load]);

  const retry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetrying(true);
    try {
      await supabase.functions.invoke("process-calendar-queue", { body: {} });
      toast({ title: "Re-sync started", description: "Failed lessons are being retried." });
      setTimeout(load, 3000);
    } catch (err: any) {
      toast({ title: "Re-sync failed", description: err?.message ?? "Try again later", variant: "destructive" });
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <TileCard ariaLabel="Calendar sync loading">
        <div style={INNER} aria-busy="true">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={eyebrow}>Calendar sync</span>
          </div>
          <div style={{ height: 22, marginTop: 8, background: "#F2F4F8", borderRadius: 6, width: "60%" }} />
        </div>
      </TileCard>
    );
  }

  if (!connected) {
    return (
      <TileCard onClick={() => navigate("/instructor-app/settings/google-calendar")}
        ariaLabel="Connect Google Calendar">
        <div style={INNER}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "#EEF1F5", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CalendarSync size={18} color="#6B7280" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>Google Calendar</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Not connected</div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2952b3" }}>Connect →</span>
          </div>
        </div>
      </TileCard>
    );
  }

  if (failed > 0) {
    return (
      <TileCard onClick={retry} accentColor="red" ariaLabel="Calendar sync failures">
        <div style={INNER}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...eyebrow, color: "#991b1b" }}>Calendar sync</span>
            <ChevronRight size={16} color="#991b1b" />
          </div>
          <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
            {failed} lesson{failed === 1 ? "" : "s"} failed
          </div>
          <div style={{ fontSize: 12, color: "#c9302c", marginTop: 2, fontWeight: 600 }}>
            {retrying ? "Retrying…" : "Tap to retry"}
          </div>
        </div>
      </TileCard>
    );
  }

  if (pending > 0) {
    return (
      <TileCard accentColor="amber" ariaLabel="Calendar sync pending">
        <div style={INNER}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...eyebrow, color: "#92400e" }}>Calendar sync</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600, color: "#1F2937" }}>
            {pending} lesson{pending === 1 ? "" : "s"} pending
          </div>
          <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>Syncing shortly…</div>
        </div>
      </TileCard>
    );
  }

  return (
    <TileCard accentColor="green" ariaLabel="Calendar synced">
      <div style={INNER}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...eyebrow, color: "#2d8a4e" }}>Calendar sync</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
          Synced
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
          {formatRelative(lastSync)}
        </div>
      </div>
    </TileCard>
  );
}

export default CalendarSyncStatusTile;
