import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, CreditCard, FileSpreadsheet } from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GoogleServiceAccountSetup } from "@/components/instructor/GoogleServiceAccountSetup";
import { SquareConnectSettings } from "@/components/instructor/SquareConnectSettings";
import { XeroExport } from "@/components/instructor/XeroExport";
import { IntegrationStatusBadge, IntegrationStatusKind } from "@/components/instructor/integrations/IntegrationStatusBadge";
import { useIntegrationStatuses } from "@/hooks/useIntegrationStatuses";

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
  );
}
