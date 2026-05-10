import { useNavigate, useParams } from "react-router-dom";
import {
  IconBolt,
  IconUser, IconShieldLock, IconBell,
  IconCar, IconCertificate, IconPhoto, IconCoin, IconCalendar, IconPhone,
  IconBook, IconCreditCard, IconDownload,
  IconHelpCircle, IconUserOff,
  IconSettings,
} from "@tabler/icons-react";
type TablerIcon = typeof IconUser;

export interface SidebarItem {
  id: string;          // category id used in the URL
  sectionId?: string;  // optional sub-section anchor (currently unused for routing)
  label: string;
  icon: TablerIcon;
}
export interface SidebarGroup {
  id: string;
  label: string;
  items: SidebarItem[];
}

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    id: "quick", label: "Quick settings", items: [
      { id: "quick", label: "Today's controls", icon: IconBolt },
    ],
  },
  {
    id: "account", label: "Account", items: [
      { id: "account",         label: "Profile",          icon: IconUser },
      { id: "login-security",  label: "Login & security", icon: IconShieldLock },
      { id: "notifications",   label: "Notifications",    icon: IconBell },
    ],
  },
  {
    id: "teaching", label: "Teaching", items: [
      { id: "vehicle",          label: "Vehicle",            icon: IconCar },
      { id: "credentials",      label: "Credentials",        icon: IconCertificate },
      { id: "media-listing",    label: "Media & listing",    icon: IconPhoto },
      { id: "rates-coverage",   label: "Rates & coverage",   icon: IconCoin },
      { id: "availability",     label: "Availability",       icon: IconCalendar },
      { id: "phone-number",     label: "Phone number",       icon: IconPhone },
    ],
  },
  {
    id: "activity", label: "Activity", items: [
      { id: "cpd",            label: "CPD & training", icon: IconBook },
      { id: "plan-billing",   label: "Plan & billing", icon: IconCreditCard },
      { id: "data-export",    label: "Data export",    icon: IconDownload },
    ],
  },
  {
    id: "more", label: "More", items: [
      { id: "help-support",   label: "Help & support", icon: IconHelpCircle },
      { id: "close-account",  label: "Close account",  icon: IconUserOff },
    ],
  },
];

export function SettingsSidebar() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId?: string }>();
  const active = categoryId ?? "account";

  return (
    <aside
      style={{
        width: 220,
        background: "var(--color-background-secondary)",
        padding: "16px 12px",
        borderRight: "0.5px solid var(--color-border)",
        minHeight: "calc(100vh - 56px)",
      }}
      className="shrink-0"
    >
      {SIDEBAR_GROUPS.map(group => (
        <div key={group.id} style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--color-text-tertiary)",
              padding: "0 8px 6px",
            }}
          >
            {group.label}
          </div>
          <ul style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/instructor/settings/${item.id}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", textAlign: "left",
                      padding: "6px 8px", borderRadius: "var(--border-radius-md)",
                      fontSize: 13, fontWeight: isActive ? 500 : 400,
                      color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                      background: isActive ? "var(--color-background-primary)" : "transparent",
                      border: isActive ? "0.5px solid var(--color-border)" : "0.5px solid transparent",
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={16} stroke={1.5} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div style={{ borderTop: "0.5px solid var(--color-border)", marginTop: 12, paddingTop: 12 }}>
        <button
          type="button"
          onClick={() => navigate("/instructor/settings/all")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "6px 8px", borderRadius: "var(--border-radius-md)",
            background: "transparent", border: 0,
            fontSize: 12, color: "var(--color-text-tertiary)", cursor: "pointer",
          }}
        >
          <IconSettings size={14} stroke={1.5} />
          All other settings
        </button>
      </div>
    </aside>
  );
}
