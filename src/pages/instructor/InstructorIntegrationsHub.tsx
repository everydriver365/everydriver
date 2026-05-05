import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, CreditCard, FileSpreadsheet } from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GoogleServiceAccountSetup } from "@/components/instructor/GoogleServiceAccountSetup";
import { SquareConnectSettings } from "@/components/instructor/SquareConnectSettings";
import { XeroExport } from "@/components/instructor/XeroExport";

const TABS = [
  { id: "google-calendar", label: "Google Calendar", icon: Calendar, blurb: "Sync your lessons to your Google Calendar." },
  { id: "square", label: "Square", icon: CreditCard, blurb: "Accept card payments and receive automatic payouts." },
  { id: "xero", label: "Xero", icon: FileSpreadsheet, blurb: "Export invoices and expenses to your Xero accounting." },
];

export default function InstructorIntegrationsHub() {
  const { instructor, refreshInstructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "google-calendar");

  const onTabChange = (next: string) => {
    setTab(next);
    setSearchParams({ tab: next }, { replace: true });
  };

  if (!instructorId) return null;

  return (
    <div className="instructor-portal min-h-screen bg-[#F4F7F6]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
          <p className="text-sm text-muted-foreground">Connect your calendar, payments and accounting in one place.</p>
        </div>

        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList className="grid grid-cols-3 w-full mb-6 h-auto">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-2 py-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TABS.map(t => (
            <TabsContent key={t.id} value={t.id}>
              <div className="bg-card rounded-2xl border p-6 space-y-4">
                <p className="text-sm text-muted-foreground">{t.blurb}</p>
                {t.id === "google-calendar" && <GoogleServiceAccountSetup instructorId={instructorId} />}
                {t.id === "square" && (
                  <SquareConnectSettings
                    instructorId={instructorId}
                    squareMerchantId={(instructor as any)?.square_merchant_id}
                    squareConnectedAt={(instructor as any)?.square_connected_at}
                    onUpdate={refreshInstructor}
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
