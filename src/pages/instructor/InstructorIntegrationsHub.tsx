import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, CreditCard, FileSpreadsheet, Satellite, Wifi, WifiOff, Plug, ChevronRight, ChevronDown, ChevronUp, BookOpen, CheckCircle2, MinusCircle, Sparkles } from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GoogleServiceAccountSetup } from "@/components/instructor/GoogleServiceAccountSetup";
import { SquareConnectSettings } from "@/components/instructor/SquareConnectSettings";
import { XeroExport } from "@/components/instructor/XeroExport";
import { IntegrationStatusBadge, IntegrationStatusKind } from "@/components/instructor/integrations/IntegrationStatusBadge";
import { IntegrationInstructions } from "@/components/instructor/integrations/IntegrationInstructions";
import { useIntegrationStatuses } from "@/hooks/useIntegrationStatuses";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { formatDistanceToNow } from "date-fns";

const GOOGLE_STEPS = [
  {
    title: "Open Google Calendar settings",
    body: (
      <>
        Go to{" "}
        <a className="text-primary underline" href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noreferrer">
          calendar.google.com → Settings
        </a>
        , then pick the calendar you want to sync from the left sidebar.
      </>
    ),
  },
  {
    title: "Share with our service email",
    body: (
      <>Under <b>Share with specific people</b>, add the email shown below with permission set to <b>Make changes to events</b>.</>
    ),
  },
  {
    title: "Copy your Calendar ID",
    body: (
      <>Scroll to <b>Integrate calendar</b> and copy the <b>Calendar ID</b> (usually your Gmail address). Paste it into the field below and click <b>Test Connection</b>.</>
    ),
  },
  {
    title: "Connect & sync",
    body: <>Click <b>Connect Calendar</b>. Lessons will sync both ways automatically — use <b>Preview Sync</b> to see pending changes.</>,
  },
];

const SQUARE_STEPS = [
  {
    title: "Create or sign in to Square",
    body: (
      <>
        Don't have an account?{" "}
        <a className="text-primary underline" href="https://squareup.com/i/EVERYDRIVE" target="_blank" rel="noreferrer">
          Sign up free via our partner link
        </a>{" "}
        to get free processing on your first £1,000.
      </>
    ),
  },
  {
    title: "Click Connect Square Account",
    body: <>This opens Square in a popup. Sign in and approve access for Drive365 to take payments on your behalf.</>,
  },
  {
    title: "Verify the connection",
    body: <>Once approved you'll see <b>Square Connected</b> with your merchant ID. Pupil card payments now go straight to your Square account.</>,
  },
  {
    title: "Payouts & service fee",
    body: <>Square sends funds to your linked bank on its standard schedule. The platform Service Fee (1.5–2% + 25p) is deducted automatically.</>,
  },
];

const XERO_STEPS = [
  {
    title: "Choose a period",
    body: <>Pick <b>This Month</b> or <b>This Year</b> for expenses, or <b>Year Income</b> for invoices.</>,
  },
  {
    title: "Download the CSV",
    body: <>Click the export button. The file is formatted for Xero's standard import templates (Bills for expenses, Invoices for income).</>,
  },
  {
    title: "Import into Xero",
    body: (
      <>
        In Xero go to <b>Business → Bills to pay → Import</b> (or <b>Sales → Invoices → Import</b>), upload the CSV and map the columns Xero suggests. See the{" "}
        <a className="text-primary underline" href="https://central.xero.com/s/article/Import-bills-or-credit-notes" target="_blank" rel="noreferrer">
          Xero import guide
        </a>.
      </>
    ),
  },
  {
    title: "Mark as synced",
    body: <>After a successful import, click <b>Mark as Synced</b> so they aren't exported again. Use <b>Reset Sync State</b> if you need to re-export.</>,
  },
];


const TRACKER_STEPS = [
  {
    title: "Choose your tracking method",
    body: <>Use your <b>phone</b> for live tracking on the go, or pair a dedicated <b>hardware GPS device</b> for always-on vehicle tracking.</>,
  },
  {
    title: "Add a device",
    body: <>Open <b>Manage trackers</b> below to register a new GPS device or check existing ones.</>,
  },
  {
    title: "Verify it's reporting",
    body: <>A connected device shows a green dot and a recent <b>last seen</b> timestamp. If it's stale, check power and signal.</>,
  },
];

const TABS = [
  { id: "google-calendar", label: "Google Calendar", icon: Calendar, blurb: "Sync your lessons to your Google Calendar." },
  { id: "square", label: "Square", icon: CreditCard, blurb: "Accept card payments and receive automatic payouts." },
  { id: "trackers", label: "Trackers", icon: Satellite, blurb: "Manage GPS trackers and phone-based tracking." },
  { id: "xero", label: "Xero", icon: FileSpreadsheet, blurb: "Export invoices and expenses to your Xero accounting." },
];

const INTEGRATION_CONFIG: Record<string, { name: string; description: string; iconBg: string; iconColor: string; icon: any }> = {
  "google-calendar": {
    name: "Google Calendar",
    description: "Sync your lessons to your Google Calendar automatically",
    iconBg: "#EEF2FF", iconColor: "#4338CA", icon: Calendar,
  },
  square: {
    name: "Square",
    description: "Accept payments and sync transactions automatically",
    iconBg: "#F0FDF4", iconColor: "#16A34A", icon: CreditCard,
  },
  trackers: {
    name: "Trackers",
    description: "Connect GPS or OBD trackers to track lessons live",
    iconBg: "#FFF7ED", iconColor: "#EA580C", icon: Satellite,
  },
  xero: {
    name: "Xero",
    description: "Sync earnings and expenses to your Xero account",
    iconBg: "#EEF2FF", iconColor: "#4338CA", icon: FileSpreadsheet,
  },
};

function StatusPill({ status }: { status: IntegrationStatusKind }) {
  const map = {
    connected:    { bg: "#DCFCE7", color: "#16A34A", label: "Connected",     Icon: CheckCircle2 },
    disconnected: { bg: "#F3F4F6", color: "#6B7280", label: "Not connected", Icon: MinusCircle },
    available:    { bg: "#EEF2FF", color: "#4338CA", label: "Available",     Icon: Sparkles },
    loading:      { bg: "#F3F4F6", color: "#6B7280", label: "Checking…",     Icon: MinusCircle },
  } as const;
  const c = map[status];
  const Icon = c.Icon;
  return (
    <span style={{ backgroundColor: c.bg, color: c.color, borderRadius: 20, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>
      <Icon size={10} strokeWidth={2} />
      {c.label}
    </span>
  );
}

function formatLastSync(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

export default function InstructorIntegrationsHub() {
  const { instructor, refreshInstructor } = useInstructorAuth();
  const navigate = useNavigate();
  const instructorId = instructor?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "google-calendar");
  const [stepsExpanded, setStepsExpanded] = useState(true);

  const statuses = useIntegrationStatuses(instructorId, instructor);

  const onTabChange = (next: string) => {
    setTab(next);
    setSearchParams({ tab: next }, { replace: true });
  };

  if (!instructorId) return null;

  const statusByTab: Record<string, IntegrationStatusKind> = {
    "google-calendar": statuses.googleCalendar,
    square: statuses.square,
    trackers: statuses.trackers,
    xero: statuses.xero,
  };

  const trackerCount = statuses.trackerDevices.filter((d) => d.is_active !== false).length;

  const detailByTab: Record<string, string> = {
    "google-calendar":
      statuses.googleCalendar === "connected"
        ? `Last synced ${formatLastSync(statuses.googleLastSync) ?? "recently"}`
        : statuses.googleCalendar === "loading"
        ? "Checking connection…"
        : "Connect to start syncing lessons to your calendar.",
    square:
      statuses.square === "connected"
        ? `Merchant ID ending …${(statuses.squareMerchantId ?? "").slice(-6)}`
        : "Connect to take card payments and receive automatic payouts.",
    trackers:
      statuses.trackers === "connected"
        ? `${trackerCount} active device${trackerCount === 1 ? "" : "s"}`
        : statuses.trackers === "loading"
        ? "Checking devices…"
        : "No GPS hardware paired — phone tracking is always available.",
    xero: "Manual CSV export — no account linking required.",
  };

  const activeStatus = statusByTab[tab];
  const activeConfig = INTEGRATION_CONFIG[tab];
  const ActiveIcon = activeConfig.icon;
  const activeSteps =
    tab === "google-calendar" ? GOOGLE_STEPS
    : tab === "square" ? SQUARE_STEPS
    : tab === "trackers" ? TRACKER_STEPS
    : XERO_STEPS;

  return (
    <InstructorPortalLayout>
    <div className="instructor-portal min-h-screen" style={{ backgroundColor: "#F8F9FB" }}>
      <div className="max-w-5xl mx-auto" style={{ padding: 24 }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-3">
          <span style={{ fontSize: 13, color: "#9CA3AF" }}>Settings</span>
          <ChevronRight size={12} color="#D1D5DB" strokeWidth={2} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>Connections</span>
        </div>

        {/* Page header */}
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plug size={17} color="#3730A3" strokeWidth={1.5} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: -0.4, lineHeight: 1.1 }}>Connections</h1>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Manage Square, Google Calendar, GPS trackers and more</p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 2, backgroundColor: "#F3F4F6", borderRadius: 10, padding: 3, marginBottom: 20, overflowX: "auto" }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            const status = statusByTab[t.id];
            const dotColor = status === "connected" ? "#16A34A" : status === "available" ? "#4338CA" : status === "loading" ? "#9CA3AF" : "#DC2626";
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                style={{
                  padding: "7px 16px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6,
                  backgroundColor: isActive ? "#FFF" : "transparent",
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  border: "none", cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                <Icon size={13} color={isActive ? "#111827" : "#6B7280"} strokeWidth={1.6} />
                <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#111827" : "#6B7280" }}>{t.label}</span>
                <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor, display: "inline-block" }} />
              </button>
            );
          })}
        </div>

        {/* Status card */}
        <div style={{ backgroundColor: "#FFF", borderRadius: 12, border: "1px solid #ECEEF2", marginBottom: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: activeConfig.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ActiveIcon size={20} color={activeConfig.iconColor} strokeWidth={1.5} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{activeConfig.name}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{activeConfig.description}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{detailByTab[tab]}</div>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <StatusPill status={activeStatus} />
          </div>
        </div>

        {/* Setup steps card (collapsible) */}
        <div style={{ backgroundColor: "#FFF", borderRadius: 12, border: "1px solid #ECEEF2", overflow: "hidden", marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setStepsExpanded(!stepsExpanded)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", borderBottom: stepsExpanded ? "1px solid #ECEEF2" : "none",
              background: "transparent", border: "none", cursor: "pointer",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={14} color="#4338CA" strokeWidth={1.6} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>How to set this up</span>
            </span>
            {stepsExpanded
              ? <ChevronUp size={12} color="#9CA3AF" strokeWidth={2} />
              : <ChevronDown size={12} color="#9CA3AF" strokeWidth={2} />}
          </button>

          {stepsExpanded && (
            <>
              <div style={{ padding: "16px 20px" }}>
                {activeSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < activeSteps.length - 1 ? 16 : 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#3730A3" }}>{i + 1}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 3 }}>{step.title}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", lineHeight: "18px" }}>{step.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Existing functional setup component for the active tab (logic untouched) */}
        <div className="bg-card rounded-2xl border p-6 space-y-4">
          {tab === "google-calendar" && <GoogleServiceAccountSetup instructorId={instructorId} />}
          {tab === "square" && (
            <SquareConnectSettings
              instructorId={instructorId}
              squareMerchantId={(instructor as any)?.square_merchant_id}
              squareConnectedAt={(instructor as any)?.square_connected_at}
              onUpdate={() => {
                refreshInstructor();
                statuses.refresh();
              }}
            />
          )}
          {tab === "trackers" && (
            <div className="space-y-3">
              {statuses.trackerDevices.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  No GPS hardware devices registered yet. Phone-based tracking is always available during live lessons.
                </div>
              ) : (
                <ul className="divide-y rounded-xl border bg-background">
                  {statuses.trackerDevices.map((d) => {
                    const active = d.is_active !== false;
                    const lastSeen = d.last_seen_at
                      ? formatDistanceToNow(new Date(d.last_seen_at), { addSuffix: true })
                      : "never";
                    return (
                      <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {active ? (
                            <Wifi className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{d.device_name || "GPS Tracker"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {(d.tracking_provider || "phone")} · last seen {lastSeen}
                            </p>
                          </div>
                        </div>
                        <IntegrationStatusBadge status={active ? "connected" : "disconnected"} />
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => navigate("/instructor/gps-setup")}>Manage trackers</Button>
                <Button variant="outline" onClick={() => statuses.refresh()}>Refresh</Button>
              </div>
            </div>
          )}
          {tab === "xero" && <XeroExport instructorId={instructorId} />}
        </div>
      </div>
    </div>
    </InstructorPortalLayout>
  );
}
