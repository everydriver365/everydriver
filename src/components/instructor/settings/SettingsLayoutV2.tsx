import { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { SettingsSidebar, SIDEBAR_GROUPS, type SidebarGroup } from "./SettingsSidebar";
import { SettingsDirtyProvider } from "./SettingsDirtyContext";
import { SettingsSaveBar } from "./SettingsSaveBar";
import type { SettingsCategory } from "./SettingsLayout";

import { QuickSettingsPage } from "./pages/QuickSettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginSecurityPage } from "./pages/LoginSecurityPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { VehiclePage } from "./pages/VehiclePage";
import { CredentialsPage } from "./pages/CredentialsPage";
import { MediaListingPage } from "./pages/MediaListingPage";
import { RatesCoveragePage } from "./pages/RatesCoveragePage";
import { AvailabilityPage } from "./pages/AvailabilityPage";
import { PhoneNumberPage } from "./pages/PhoneNumberPage";
import { CpdPage } from "./pages/CpdPage";
import { PlanBillingPage } from "./pages/PlanBillingPage";
import { DataExportPage } from "./pages/DataExportPage";
import { HelpSupportPage } from "./pages/HelpSupportPage";
import { CloseAccountPage } from "./pages/CloseAccountPage";

interface PageDef {
  title: string;
  subtitle: string;
  render: (instructorId: string) => ReactNode;
}

const PAGES: Record<string, PageDef> = {
  quick:           { title: "Quick settings",   subtitle: "Toggles you change often. Changes save automatically.",                            render: id => <QuickSettingsPage instructorId={id} /> },
  account:         { title: "Profile",          subtitle: "Your name, photo, contact details and bio",                                       render: id => <ProfilePage instructorId={id} /> },
  "login-security":{ title: "Login & security", subtitle: "Email, password, two-factor authentication and active sessions",                  render: () => <LoginSecurityPage /> },
  notifications:   { title: "Notifications",    subtitle: "Choose what to be notified about and how",                                        render: id => <NotificationsPage instructorId={id} /> },
  vehicle:         { title: "Vehicle",          subtitle: "Your teaching vehicle, MOT, road tax and insurance",                              render: id => <VehiclePage instructorId={id} /> },
  credentials:     { title: "Credentials",      subtitle: "Documents and qualifications drive365 needs to verify you. Reviewed within 24 hours, never shown to learners.", render: id => <CredentialsPage instructorId={id} /> },
  "media-listing": { title: "Media & listing",  subtitle: "Photos, video and how learners see your public profile",                          render: id => <MediaListingPage instructorId={id} /> },
  "rates-coverage":{ title: "Rates & coverage", subtitle: "Hourly rate, block discounts and the postcodes you cover",                        render: id => <RatesCoveragePage instructorId={id} /> },
  availability:    { title: "Availability",     subtitle: "Working hours, holidays, lesson length and buffer between lessons",               render: id => <AvailabilityPage instructorId={id} /> },
  "phone-number":  { title: "Phone number",     subtitle: "A landline number that routes calls to your AI receptionist or your mobile",       render: id => <PhoneNumberPage instructorId={id} /> },
  cpd:             { title: "CPD & training",   subtitle: "Continuing professional development you've logged this year",                     render: id => <CpdPage instructorId={id} /> },
  "plan-billing":  { title: "Plan & billing",   subtitle: "Current plan, payment method and invoice history",                                render: () => <PlanBillingPage /> },
  "data-export":   { title: "Data export",      subtitle: "Download your data as CSV or a full account backup",                              render: id => <DataExportPage instructorId={id} /> },
  "help-support":  { title: "Help & support",   subtitle: "Get help, talk to support or read the docs",                                      render: () => <HelpSupportPage /> },
  "close-account": { title: "Close account",    subtitle: "Permanently close your account and erase your data",                              render: () => <CloseAccountPage /> },
};

interface Props {
  instructorId: string;
  legacyCategories?: SettingsCategory[];
}

export function SettingsLayoutV2({ instructorId, legacyCategories = [] }: Props) {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const navigate = useNavigate();
  const id = categoryId ?? "account";
  const page = PAGES[id];

  // Build sidebar groups for any legacy categories not already present in the v2 groups.
  const v2Ids = new Set(SIDEBAR_GROUPS.flatMap(g => g.items.map(i => i.id)));
  const extraGroups: SidebarGroup[] = legacyCategories.length
    ? [{
        id: "more-areas",
        label: "More",
        items: legacyCategories
          .filter(c => !v2Ids.has(c.id))
          .map(c => ({ id: c.id, label: c.title, icon: c.icon as any })),
      }]
    : [];

  const legacy = legacyCategories.find(c => c.id === id);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/instructor");
  };

  return (
    <SettingsDirtyProvider>
      <div className="settings-v2 flex" style={{ minHeight: "calc(100vh - 56px)" }}>
        <SettingsSidebar extraGroups={extraGroups} />
        <main className="flex-1 min-w-0" style={{ padding: "24px 28px 80px" }}>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            style={{ marginBottom: 14 }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          {page ? (
            <>
              <header style={{ marginBottom: 18 }}>
                <h1 className="sv2-h1">{page.title}</h1>
                <p className="sv2-sub">{page.subtitle}</p>
              </header>
              <div className="space-y-4">{page.render(instructorId)}</div>
            </>
          ) : legacy ? (
            <>
              <header style={{ marginBottom: 18 }}>
                <h1 className="sv2-h1">{legacy.title}</h1>
                <p className="sv2-sub">{legacy.description}</p>
              </header>
              <div className="space-y-4">
                {legacy.sections.filter(s => s.visible !== false).map(s => (
                  <section
                    key={s.id}
                    id={s.id}
                    className="rounded-2xl bg-card border border-border/50 p-4 sm:p-5"
                  >
                    <header className="mb-3">
                      <h2 className="text-base font-semibold text-foreground">{s.title}</h2>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                      )}
                    </header>
                    <div>{s.render()}</div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>
              Settings page not found.
            </div>
          )}
        </main>
        <SettingsSaveBar />
      </div>
    </SettingsDirtyProvider>
  );
}
