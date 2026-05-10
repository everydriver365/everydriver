import { Link } from "react-router-dom";
import { IconExternalLink, IconCreditCard } from "@tabler/icons-react";
import { StatusPill } from "../StatusPill";
import { SettingsListRow } from "../SettingsListRow";

export function PlanBillingPage() {
  return (
    <>
      <section className="sv2-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
          <div>
            <div className="sv2-section-title">Current plan</div>
            <div className="sv2-section-sub">Manage your subscription, payment method and invoices.</div>
          </div>
          <StatusPill variant="success">Active</StatusPill>
        </div>
        <Link to="/instructor/billing" className="sv2-btn primary" style={{ textDecoration: "none" }}>
          <IconExternalLink size={14} stroke={1.5} />
          Open Plan & billing
        </Link>
      </section>
      <section className="sv2-card">
        <div style={{ marginBottom: 4 }}>
          <div className="sv2-section-title">Payment method</div>
          <div className="sv2-section-sub">How you pay for your subscription.</div>
        </div>
        <SettingsListRow
          icon={<IconCreditCard size={16} stroke={1.5} />}
          name="Direct Debit"
          meta="Managed in Plan & billing"
          onClick={() => { window.location.href = "/instructor/billing"; }}
        />
      </section>
    </>
  );
}
