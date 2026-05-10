import { Link } from "react-router-dom";
import {
  IconCalendarTime, IconEyeOff, IconUserCheck,
  IconPhoneIncoming, IconRoute, IconMapPin, IconChevronRight,
} from "@tabler/icons-react";
import { useQuickSettings } from "@/hooks/useQuickSettings";
import { QuickToggleRow } from "../QuickToggleRow";
import { useInstructorPhoneNumber, type RoutingMode } from "@/hooks/useInstructorPhoneNumber";

export function QuickSettingsPage({ instructorId }: { instructorId: string }) {
  const { data, loading, update } = useQuickSettings(instructorId);
  const { data: phone, update: updatePhone } = useInstructorPhoneNumber(instructorId);

  if (loading || !data) {
    return <div className="sv2-card" style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>Loading…</div>;
  }

  return (
    <>
      <section className="sv2-card">
        <div style={{ marginBottom: 4 }}>
          <div className="sv2-section-title">Status</div>
          <div className="sv2-section-sub">Visible to learners and accepting work.</div>
        </div>
        <QuickToggleRow
          icon={<IconCalendarTime size={16} stroke={1.5} />}
          name="Available for new bookings"
          meta="When off, your calendar is paused for new requests."
          checked={!data.availability_paused}
          onChange={(v) => update("availability_paused", !v)}
        />
        <QuickToggleRow
          icon={<IconEyeOff size={16} stroke={1.5} />}
          name="Show on public listing"
          meta="Turn off to temporarily hide from search and your mini-website."
          checked={data.is_active}
          onChange={(v) => update("is_active", v)}
        />
      </section>

      <section className="sv2-card">
        <div style={{ marginBottom: 4 }}>
          <div className="sv2-section-title">Bookings & calls</div>
          <div className="sv2-section-sub">Day-to-day controls for how pupils reach you.</div>
        </div>
        <QuickToggleRow
          icon={<IconUserCheck size={16} stroke={1.5} />}
          name="Pupil self-service booking"
          meta="Let pupils book, cancel and reschedule themselves."
          checked={data.pupil_self_booking_enabled}
          onChange={(v) => update("pupil_self_booking_enabled", v)}
        />
        <QuickToggleRow
          icon={<IconPhoneIncoming size={16} stroke={1.5} />}
          name="AI call answering"
          meta="Divert incoming calls to your AI receptionist when you're teaching."
          checked={data.ai_call_divert_enabled}
          onChange={(v) => update("ai_call_divert_enabled", v)}
        />
        {phone && (
          <div className="sv2-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconPhoneIncoming size={16} stroke={1.5} />
              <div className="flex-1 min-w-0">
                <div className="sv2-row-name">Landline routing</div>
                <div className="sv2-row-meta" style={{ fontFamily: "monospace" }}>{phone.phone_number}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {(["ai", "mobile", "schedule"] as RoutingMode[]).map((mode) => {
                const active = phone.routing_mode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => !active && updatePhone("routing_mode", mode)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      border: `1px solid ${active ? "var(--portal-accent, #2B7BC8)" : "var(--color-border, #e5e7eb)"}`,
                      background: active ? "var(--portal-accent, #2B7BC8)" : "transparent",
                      color: active ? "#fff" : "var(--color-text-primary)",
                      cursor: active ? "default" : "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {mode === "schedule" ? "Schedule" : mode === "ai" ? "AI" : "Mobile"}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="sv2-card">
        <div style={{ marginBottom: 4 }}>
          <div className="sv2-section-title">Tracking</div>
          <div className="sv2-section-sub">GPS and route recording for the next lesson.</div>
        </div>
        <QuickToggleRow
          icon={<IconMapPin size={16} stroke={1.5} />}
          name="Live GPS tracking"
          meta="Share your live position with pupils en route."
          checked={(data.tracking_mode ?? "off") !== "off"}
          onChange={(v) => update("tracking_mode", v ? "phone" : "off")}
        />
        <QuickToggleRow
          icon={<IconRoute size={16} stroke={1.5} />}
          name="Auto-record routes"
          meta="Start recording the route automatically at the beginning of each lesson."
          checked={data.auto_start_tracker}
          onChange={(v) => update("auto_start_tracker", v)}
        />
      </section>

      <section className="sv2-card">
        <div style={{ marginBottom: 4 }}>
          <div className="sv2-section-title">Open full settings</div>
          <div className="sv2-section-sub">Need more control? Jump to the relevant page.</div>
        </div>
        <ShortcutLink to="/instructor/settings/availability"  label="Working hours & lesson length" />
        <ShortcutLink to="/instructor/settings/notifications" label="Notification preferences" />
        <ShortcutLink to="/instructor/settings/media-listing" label="Public listing & media" />
      </section>
    </>
  );
}

function ShortcutLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="sv2-row"
      style={{ textDecoration: "none", color: "var(--color-text-primary)" }}
    >
      <span className="flex-1 min-w-0 sv2-row-name">{label}</span>
      <IconChevronRight size={16} stroke={1.5} color="var(--color-text-tertiary)" />
    </Link>
  );
}
