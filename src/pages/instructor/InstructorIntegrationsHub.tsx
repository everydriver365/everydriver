import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, CreditCard, FileSpreadsheet } from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GoogleServiceAccountSetup } from "@/components/instructor/GoogleServiceAccountSetup";
import { SquareConnectSettings } from "@/components/instructor/SquareConnectSettings";
import { XeroExport } from "@/components/instructor/XeroExport";
import { IntegrationStatusBadge, IntegrationStatusKind } from "@/components/instructor/integrations/IntegrationStatusBadge";
import { IntegrationInstructions } from "@/components/instructor/integrations/IntegrationInstructions";
import { useIntegrationStatuses } from "@/hooks/useIntegrationStatuses";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";

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


const TABS = [
  { id: "google-calendar", label: "Google Calendar", icon: Calendar, blurb: "Sync your lessons to your Google Calendar." },
  { id: "square", label: "Square", icon: CreditCard, blurb: "Accept card payments and receive automatic payouts." },
  { id: "xero", label: "Xero", icon: FileSpreadsheet, blurb: "Export invoices and expenses to your Xero accounting." },
];

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
  const instructorId = instructor?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "google-calendar");

  const statuses = useIntegrationStatuses(instructorId, instructor);

  const onTabChange = (next: string) => {
    setTab(next);
    setSearchParams({ tab: next }, { replace: true });
  };

  if (!instructorId) return null;

  const statusByTab: Record<string, IntegrationStatusKind> = {
    "google-calendar": statuses.googleCalendar,
    square: statuses.square,
    xero: statuses.xero,
  };

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
    xero: "Manual CSV export — no account linking required.",
  };

  return (
    <InstructorPortalLayout>
    <div className="instructor-portal min-h-screen bg-[#F4F7F6]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
          <p className="text-sm text-muted-foreground">Connect your calendar, payments and accounting in one place.</p>
        </div>

        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList className="grid grid-cols-3 w-full mb-6 h-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-2 py-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <IntegrationStatusBadge status={statusByTab[t.id]} className="ml-1" />
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.id} value={t.id}>
              <div className="bg-card rounded-2xl border p-6 space-y-4">
                <div className="flex items-start justify-between gap-3 pb-3 border-b">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{t.blurb}</p>
                    <p className="text-xs text-muted-foreground mt-1">{detailByTab[t.id]}</p>
                  </div>
                  <IntegrationStatusBadge status={statusByTab[t.id]} size="md" />
                </div>

                <IntegrationInstructions
                  steps={
                    t.id === "google-calendar"
                      ? GOOGLE_STEPS
                      : t.id === "square"
                      ? SQUARE_STEPS
                      : XERO_STEPS
                  }
                  defaultOpen={statusByTab[t.id] !== "connected"}
                />


                {t.id === "google-calendar" && <GoogleServiceAccountSetup instructorId={instructorId} />}
                {t.id === "square" && (
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
                {t.id === "xero" && <XeroExport instructorId={instructorId} />}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
    </InstructorPortalLayout>
  );
}
