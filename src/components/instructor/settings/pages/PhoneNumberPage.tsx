import { useState } from "react";
import { IconPhone, IconRobot, IconDeviceMobile, IconCalendarTime, IconTrash, IconPlus } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useInstructorPhoneNumber, type RoutingMode } from "@/hooks/useInstructorPhoneNumber";

interface Props { instructorId: string; }

const ROUTES: { id: RoutingMode; title: string; sub: string; icon: typeof IconRobot }[] = [
  { id: "ai", title: "AI receptionist", sub: "All calls answered by your AI receptionist.", icon: IconRobot },
  { id: "mobile", title: "My mobile", sub: "All calls forwarded straight to your mobile.", icon: IconDeviceMobile },
  { id: "schedule", title: "Schedule-based", sub: "AI during lessons (with buffer), mobile otherwise.", icon: IconCalendarTime },
];

export function PhoneNumberPage({ instructorId }: Props) {
  const { data, loading, busy, update, searchNumbers, provision, addByo, release } =
    useInstructorPhoneNumber(instructorId);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [byoOpen, setByoOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) {
    return (
      <>
        <section className="sv2-card">
          <div style={{ marginBottom: 8 }}>
            <div className="sv2-section-title">Get a landline number</div>
            <div className="sv2-section-sub">A dedicated number you can put on your website, business cards and Google profile. Calls route to your AI receptionist or your mobile based on rules you choose.</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <button type="button" className="sv2-row text-left" style={{ background: "transparent", border: "0.5px solid var(--color-border)", borderRadius: 12, padding: 14, cursor: "pointer" }} onClick={() => setProvisionOpen(true)}>
              <span className="sv2-row-icon"><IconPhone size={16} stroke={1.5} /></span>
              <span className="flex-1 min-w-0">
                <span className="sv2-row-name block">Provision a UK number</span>
                <span className="sv2-row-meta block">We buy a 01/02/03 number on Twilio. ~£2.50/mo.</span>
              </span>
            </button>
            <button type="button" className="sv2-row text-left" style={{ background: "transparent", border: "0.5px solid var(--color-border)", borderRadius: 12, padding: 14, cursor: "pointer" }} onClick={() => setByoOpen(true)}>
              <span className="sv2-row-icon"><IconPlus size={16} stroke={1.5} /></span>
              <span className="flex-1 min-w-0">
                <span className="sv2-row-name block">Bring your own number</span>
                <span className="sv2-row-meta block">Use an existing landline. We'll show you how to forward it.</span>
              </span>
            </button>
          </div>
        </section>
        <ProvisionDialog open={provisionOpen} onOpenChange={setProvisionOpen} busy={busy} onSearch={searchNumbers} onProvision={provision} />
        <ByoDialog open={byoOpen} onOpenChange={setByoOpen} busy={busy} onSave={addByo} />
      </>
    );
  }

  return (
    <>
      <section className="sv2-card">
        <div style={{ marginBottom: 8 }}>
          <div className="sv2-section-title">Your number</div>
          <div className="sv2-section-sub">
            {data.provider === "twilio_provisioned" ? "Provisioned and managed for you." : "Your own landline, routed via us."}
          </div>
        </div>
        <div className="sv2-row">
          <span className="sv2-row-icon"><IconPhone size={16} stroke={1.5} /></span>
          <span className="flex-1 min-w-0">
            <span className="sv2-row-name block" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: 0.2 }}>{data.phone_number}</span>
            <span className="sv2-row-meta block">
              {data.monthly_cost_pence ? `£${(data.monthly_cost_pence / 100).toFixed(2)}/mo · ` : ""}
              {data.provider === "twilio_provisioned" ? "Twilio managed" : "Bring your own"}
            </span>
          </span>
        </div>
      </section>

      <section className="sv2-card">
        <div style={{ marginBottom: 8 }}>
          <div className="sv2-section-title">Routing</div>
          <div className="sv2-section-sub">Choose how incoming calls are answered. Saves immediately.</div>
        </div>
        <div className="rounded-[12px] border border-[var(--color-border)] overflow-hidden">
          {ROUTES.map((r, i) => {
            const Icon = r.icon;
            const selected = data.routing_mode === r.id;
            return (
              <button key={r.id} type="button" disabled={busy}
                onClick={() => update("routing_mode", r.id)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[#FAFAFA] disabled:opacity-60"
                style={{ borderTop: i === 0 ? "none" : "0.5px solid var(--color-border)", background: selected ? "#F4F8FF" : "transparent" }}
                aria-pressed={selected}>
                <span className="flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, borderRadius: 8, background: "#F1F4F8", color: "#3D55A1" }}>
                  <Icon size={16} stroke={1.5} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-medium text-[var(--color-text-primary)]">{r.title}</span>
                  <span className="block text-[12px] text-[var(--color-text-tertiary)]">{r.sub}</span>
                </span>
                {selected && <span className="text-[12px] font-medium" style={{ color: "#1A52A0" }}>Selected</span>}
              </button>
            );
          })}
        </div>
      </section>

      {(data.routing_mode === "mobile" || data.routing_mode === "schedule") && (
        <section className="sv2-card">
          <div style={{ marginBottom: 8 }}>
            <div className="sv2-section-title">Forward to mobile</div>
            <div className="sv2-section-sub">Number we ring when routing sends a call to your phone.</div>
          </div>
          <input
            className="sv2-input"
            type="tel"
            placeholder="+44 7700 900000"
            defaultValue={data.forward_to_mobile ?? ""}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (data.forward_to_mobile ?? "")) update("forward_to_mobile", v || null);
            }}
          />
        </section>
      )}

      {data.provider === "byo_forwarded" && (
        <section className="sv2-card">
          <div style={{ marginBottom: 8 }}>
            <div className="sv2-section-title">How to point your landline here</div>
            <div className="sv2-section-sub">Set up call forwarding with your telco so calls reach our routing service.</div>
          </div>
          <ol className="space-y-2 text-[13px] text-[var(--color-text-secondary)] pl-5 list-decimal">
            <li>Sign in to your telco's account portal (BT, Sky, Virgin, etc.).</li>
            <li>Find <strong>Call diversion</strong> or <strong>Call forwarding</strong>.</li>
            <li>Set "Forward all calls" to your routing number. We'll show this once provisioning is wired.</li>
            <li>Save and test by ringing your landline from another phone.</li>
          </ol>
        </section>
      )}

      <section className="sv2-card">
        <div style={{ marginBottom: 8 }}>
          <div className="sv2-section-title" style={{ color: "var(--color-text-danger, #C8434F)" }}>Danger zone</div>
          <div className="sv2-section-sub">
            {data.provider === "twilio_provisioned"
              ? "Releases the number on Twilio. You won't be able to recover this exact number."
              : "Removes this landline from routing. Your telco settings are unchanged."}
          </div>
        </div>
        <button type="button" disabled={busy}
          onClick={() => setReleaseOpen(true)}
          className="sv2-btn"
          style={{ borderColor: "var(--color-text-danger, #C8434F)", color: "var(--color-text-danger, #C8434F)" }}>
          <IconTrash size={14} stroke={1.5} className="inline mr-1" />
          {data.provider === "twilio_provisioned" ? "Release number" : "Remove landline"}
        </button>
      </section>

      <AlertDialog open={releaseOpen} onOpenChange={setReleaseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{data.provider === "twilio_provisioned" ? "Release this number?" : "Remove this landline?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {data.provider === "twilio_provisioned"
                ? "This permanently releases the number. Anyone calling it will get an unobtainable tone."
                : "Routing will stop. Your telco's own forwarding rules are not changed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void release().then(() => setReleaseOpen(false)); }}>
              {busy ? "Working…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------- Provision dialog ----------
function ProvisionDialog({
  open, onOpenChange, busy, onSearch, onProvision,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; busy: boolean;
  onSearch: (areaCode: string) => Promise<{ phoneNumber: string; friendlyName: string; locality?: string }[]>;
  onProvision: (phoneNumber: string) => Promise<void>;
}) {
  const [areaCode, setAreaCode] = useState("");
  const [results, setResults] = useState<{ phoneNumber: string; friendlyName: string; locality?: string }[] | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const r = await onSearch(areaCode.replace(/\D/g, ""));
      setResults(r);
    } finally { setSearching(false); }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) { setResults(null); setAreaCode(""); } onOpenChange(v); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Provision a UK number</AlertDialogTitle>
          <AlertDialogDescription>Enter a UK area code (e.g. 020 for London, 0161 for Manchester). We'll show available numbers from Twilio.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input className="sv2-input flex-1" placeholder="020" value={areaCode} onChange={(e) => setAreaCode(e.target.value)} />
            <button type="button" className="sv2-btn" onClick={handleSearch} disabled={searching || !areaCode}>
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          {results && results.length === 0 && (
            <p className="text-[13px] text-muted-foreground">No numbers found for that area code. Try another.</p>
          )}
          {results && results.length > 0 && (
            <div className="rounded-[12px] border border-[var(--color-border)] overflow-hidden">
              {results.map((n, i) => (
                <button key={n.phoneNumber} type="button" disabled={busy}
                  onClick={() => onProvision(n.phoneNumber).then(() => onOpenChange(false))}
                  className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-[#FAFAFA] disabled:opacity-60"
                  style={{ borderTop: i === 0 ? "none" : "0.5px solid var(--color-border)" }}>
                  <span>
                    <span className="block text-[14px] font-medium tabular-nums">{n.friendlyName}</span>
                    {n.locality && <span className="block text-[12px] text-muted-foreground">{n.locality}</span>}
                  </span>
                  <span className="text-[12px] font-medium" style={{ color: "#1A52A0" }}>Buy</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------- BYO dialog ----------
function ByoDialog({
  open, onOpenChange, busy, onSave,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; busy: boolean;
  onSave: (landline: string, mobile: string) => Promise<void>;
}) {
  const [landline, setLandline] = useState("");
  const [mobile, setMobile] = useState("");
  const valid = /^\+?[\d\s-]{7,}$/.test(landline) && /^\+?[\d\s-]{7,}$/.test(mobile);

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) { setLandline(""); setMobile(""); } onOpenChange(v); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bring your own landline</AlertDialogTitle>
          <AlertDialogDescription>Enter the landline number you'll be advertising and the mobile we should forward to when routing chooses your phone.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div>
            <label className="sv2-label">Landline number</label>
            <input className="sv2-input" type="tel" placeholder="+44 1962 123 456" value={landline} onChange={(e) => setLandline(e.target.value)} />
          </div>
          <div>
            <label className="sv2-label">Forward to mobile</label>
            <input className="sv2-input" type="tel" placeholder="+44 7700 900000" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy || !valid} onClick={(e) => { e.preventDefault(); void onSave(landline.replace(/\s/g, ""), mobile.replace(/\s/g, "")).then(() => onOpenChange(false)); }}>
            {busy ? "Saving…" : "Save"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
