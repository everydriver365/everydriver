import { useState } from "react";
import { ContactRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useContactImport, type ImportedContact } from "@/hooks/useContactImport";

interface Props {
  onImport: (contact: ImportedContact) => void;
  /** Optional label override */
  label?: string;
  /** Visual variant: 'inline' (subtle ghost) or 'card' (full-width row). */
  variant?: "inline" | "card";
}

/**
 * Renders a button that opens the device's contact picker and returns the
 * selected contact (name / phone / email / address / postcode).
 *
 * Hidden when the current platform doesn't support contact picking
 * (iOS Safari, desktop browsers). On Capacitor native it uses the
 * @capacitor-community/contacts plugin; on Android Chrome it uses the
 * Contact Picker API.
 */
export function ImportFromContactsButton({
  onImport,
  label = "Import from contacts",
  variant = "inline",
}: Props) {
  const { supported, pickContact } = useContactImport();
  const [busy, setBusy] = useState(false);

  if (!supported) return null;

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const c = await pickContact();
      if (!c) {
        setBusy(false);
        return;
      }
      onImport(c);
      toast.success("Contact imported", {
        description: c.name || c.phone || c.email || "Details added",
      });
    } catch {
      toast.error("Could not import contact");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "12px 14px",
          borderRadius: 12,
          background: "#FFFFFF",
          border: "1px solid #E4E4E7",
          color: "#2B7BC8",
          fontSize: 14,
          fontWeight: 600,
          cursor: busy ? "default" : "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ContactRound size={16} strokeWidth={1.9} />
        )}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        background: "transparent",
        border: "1px solid #E4E4E7",
        color: "#2B7BC8",
        fontSize: 12,
        fontWeight: 600,
        cursor: busy ? "default" : "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {busy ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <ContactRound size={13} strokeWidth={1.9} />
      )}
      {label}
    </button>
  );
}
