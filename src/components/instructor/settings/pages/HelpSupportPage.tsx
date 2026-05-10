import { IconLifebuoy, IconBook2, IconMail } from "@tabler/icons-react";
import { SettingsListRow } from "../SettingsListRow";

export function HelpSupportPage() {
  return (
    <section className="sv2-card">
      <div style={{ marginBottom: 4 }}>
        <div className="sv2-section-title">Get help</div>
        <div className="sv2-section-sub">Read the docs or contact our team.</div>
      </div>
      <SettingsListRow
        icon={<IconBook2 size={16} stroke={1.5} />}
        name="Help centre"
        meta="Guides, tutorials and answers to common questions"
        onClick={() => window.open("https://drive365.co.uk/help", "_blank", "noopener")}
      />
      <SettingsListRow
        icon={<IconMail size={16} stroke={1.5} />}
        name="Email support"
        meta="Reply within one working day"
        onClick={() => { window.location.href = "mailto:support@drive365.co.uk"; }}
      />
      <SettingsListRow
        icon={<IconLifebuoy size={16} stroke={1.5} />}
        name="System status"
        meta="Check for current incidents"
        onClick={() => window.open("https://status.drive365.co.uk", "_blank", "noopener")}
      />
    </section>
  );
}
