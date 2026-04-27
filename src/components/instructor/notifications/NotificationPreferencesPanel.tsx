import { useInstructorNotificationSettings, type CategoryKey, type DeliveryCadence } from "@/hooks/useInstructorNotificationSettings";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface Props { instructorId: string }

const CADENCE_OPTS: { key: DeliveryCadence; label: string; sub: string }[] = [
  { key: "real_time", label: "Real-time", sub: "Instant alerts" },
  { key: "hourly", label: "Hourly", sub: "Batched digest" },
  { key: "daily", label: "Daily", sub: "One summary" },
  { key: "important_only", label: "Important", sub: "Only critical" },
];

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "test_swap", label: "Test swaps" },
  { key: "message", label: "Messages" },
  { key: "job", label: "Job offers" },
  { key: "system", label: "System" },
];

const TEXT = "#000";
const MUTED = "#6E6E73";
const HAIRLINE = "#E5E5EA";
const PAGE_BG = "#F2F2F4";
const CARD = "#FFF";

export default function NotificationPreferencesPanel({ instructorId }: Props) {
  const { settings, loading, update } = useInstructorNotificationSettings(instructorId);
  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const rules = settings.notification_rules;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <p className="m-0" style={{ fontSize: 11, fontWeight: 500, color: MUTED, letterSpacing: "0.3px", textTransform: "uppercase" }}>{title}</p>
      <div style={{ background: CARD, borderRadius: 12, padding: 12, border: `0.5px solid ${HAIRLINE}` }}>
        {children}
      </div>
    </div>
  );

  const Divider = () => <div style={{ height: 0.5, background: HAIRLINE, margin: "10px -12px 10px 44px" }} />;

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {/* Cadence */}
      <Section title="Delivery cadence">
        <div className="grid grid-cols-2" style={{ gap: 6 }}>
          {CADENCE_OPTS.map(o => {
            const active = settings.delivery_cadence === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => update({ delivery_cadence: o.key })}
                className="text-left"
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: active ? "#E6F1FB" : PAGE_BG,
                  border: active ? "1px solid #2B7BC8" : "1px solid transparent",
                }}
              >
                <p className="m-0" style={{ fontSize: 13, fontWeight: 500, color: active ? "#2B7BC8" : TEXT }}>{o.label}</p>
                <p className="m-0" style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{o.sub}</p>
              </button>
            );
          })}
        </div>
        <p className="m-0" style={{ fontSize: 11, color: MUTED, marginTop: 10 }}>
          Important only sends for payment failures, late cancellations, no-shows, and admin alerts. Other items still appear in your inbox.
        </p>
      </Section>

      {/* Quiet hours */}
      <Section title="Quiet hours">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="m-0" style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>Pause push during quiet hours</p>
            <p className="m-0" style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Notifications still appear in your inbox.</p>
          </div>
          <Switch
            checked={settings.quiet_hours_enabled}
            onCheckedChange={v => update({ quiet_hours_enabled: v })}
          />
        </div>
        {settings.quiet_hours_enabled && (
          <>
            <Divider />
            <div className="flex items-center gap-3" style={{ paddingLeft: 0 }}>
              <label className="flex-1">
                <p className="m-0" style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Start</p>
                <Input
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={e => update({ quiet_hours_start: e.target.value })}
                  className="h-9"
                />
              </label>
              <label className="flex-1">
                <p className="m-0" style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>End</p>
                <Input
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={e => update({ quiet_hours_end: e.target.value })}
                  className="h-9"
                />
              </label>
            </div>
          </>
        )}
      </Section>

      {/* Per-category mutes */}
      <Section title="Categories">
        {CATEGORIES.map((c, i) => (
          <div key={c.key}>
            <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
              <p className="m-0" style={{ fontSize: 14, color: TEXT }}>{c.label}</p>
              <Switch
                checked={!settings.category_mutes[c.key]}
                onCheckedChange={v => update({ category_mutes: { ...settings.category_mutes, [c.key]: !v } })}
              />
            </div>
            {i < CATEGORIES.length - 1 && <div style={{ height: 0.5, background: HAIRLINE }} />}
          </div>
        ))}
      </Section>

      {/* Smart filters */}
      <Section title="Smart filters">
        {/* Test horizon */}
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <p className="m-0" style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>Limit test slot horizon</p>
          <Switch
            checked={!!rules.test_horizon_enabled}
            onCheckedChange={v => update({ notification_rules: { ...rules, test_horizon_enabled: v } })}
          />
        </div>
        {rules.test_horizon_enabled && (
          <div style={{ marginBottom: 12 }}>
            <p className="m-0" style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Within {rules.test_horizon_weeks} weeks</p>
            <Slider
              value={[rules.test_horizon_weeks ?? 6]}
              min={1} max={12} step={1}
              onValueChange={([v]) => update({ notification_rules: { ...rules, test_horizon_weeks: v } })}
            />
          </div>
        )}
        <div style={{ height: 0.5, background: HAIRLINE, margin: "10px 0" }} />

        {/* Test distance */}
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <p className="m-0" style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>Limit test centre distance</p>
          <Switch
            checked={!!rules.test_distance_enabled}
            onCheckedChange={v => update({ notification_rules: { ...rules, test_distance_enabled: v } })}
          />
        </div>
        {rules.test_distance_enabled && (
          <div style={{ marginBottom: 12 }}>
            <p className="m-0" style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Within {rules.test_distance_miles} miles of home</p>
            <Slider
              value={[rules.test_distance_miles ?? 25]}
              min={5} max={60} step={5}
              onValueChange={([v]) => update({ notification_rules: { ...rules, test_distance_miles: v } })}
            />
          </div>
        )}
        <div style={{ height: 0.5, background: HAIRLINE, margin: "10px 0" }} />

        {/* Job min value */}
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <p className="m-0" style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>Minimum job value</p>
          <Switch
            checked={!!rules.job_min_value_enabled}
            onCheckedChange={v => update({ notification_rules: { ...rules, job_min_value_enabled: v } })}
          />
        </div>
        {rules.job_min_value_enabled && (
          <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: MUTED }}>£</span>
            <Input
              type="number"
              min={0} step={5}
              value={rules.job_min_value_pounds ?? 0}
              onChange={e => update({ notification_rules: { ...rules, job_min_value_pounds: Number(e.target.value) || 0 } })}
              className="h-9 max-w-[120px]"
            />
            <p className="m-0" style={{ fontSize: 12, color: MUTED }}>and above</p>
          </div>
        )}
        <div style={{ height: 0.5, background: HAIRLINE, margin: "10px 0" }} />

        {/* Dedupe repeat sender */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <p className="m-0" style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>Mute repeat sender</p>
            <p className="m-0" style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Combine repeat messages from the same pupil within an hour.</p>
          </div>
          <Switch
            checked={rules.dedupe_repeat_sender ?? true}
            onCheckedChange={v => update({ notification_rules: { ...rules, dedupe_repeat_sender: v } })}
          />
        </div>
      </Section>
    </div>
  );
}
