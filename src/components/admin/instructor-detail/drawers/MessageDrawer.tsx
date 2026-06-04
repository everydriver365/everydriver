import { ActionDrawer } from "../ActionDrawer";

function toWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  else if (p.startsWith("00")) p = p.slice(2);
  else if (p.startsWith("0")) p = "44" + p.slice(1);
  return p.length >= 10 ? `https://wa.me/${p}` : null;
}

export function MessageDrawer({ instructor, onClose }: { instructor: Record<string, any>; onClose: () => void }) {
  const email = instructor.email as string | null;
  const phone = instructor.phone as string | null;
  const waUrl = toWhatsApp(phone);

  const Card = ({
    title, value, href, disabled, hint,
  }: { title: string; value: string; href?: string; disabled?: boolean; hint?: string }) => (
    <a
      href={disabled ? undefined : href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      onClick={(e) => { if (disabled) e.preventDefault(); }}
      style={{
        display: "block", padding: 14, borderRadius: 10,
        border: "1px solid " + (disabled ? "#E5E7EB" : "#C7D2FE"),
        background: disabled ? "#F9FAFB" : "#EEF2FF",
        textDecoration: "none", marginBottom: 10,
        color: disabled ? "#9CA3AF" : "#0F172A",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: disabled ? "#9CA3AF" : "#2D3FE7", letterSpacing: 0.5 }}>{title}</div>
      <div style={{ fontSize: 13, marginTop: 4, wordBreak: "break-all" }}>{value}</div>
      {hint && <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>{hint}</div>}
    </a>
  );

  return (
    <ActionDrawer title="Send a message" subtitle={instructor.name} onClose={onClose}>
      <Card
        title="Email"
        value={email || "Not set"}
        href={email ? `mailto:${email}` : undefined}
        disabled={!email}
        hint={email ? "Opens your default mail client." : "Add an email on the instructor profile."}
      />
      <Card
        title="WhatsApp"
        value={phone || "Not set"}
        href={waUrl ?? undefined}
        disabled={!waUrl}
        hint={waUrl ? "Opens WhatsApp Web/app." : "Add a phone number on the instructor profile."}
      />
    </ActionDrawer>
  );
}
