import { ReactNode } from "react";
import { t } from "../tokens";

export function SettingField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: "#374151", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

interface InputProps {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: ReactNode;
}

export function SettingInput({ value, onChange, type = "text", placeholder, icon }: InputProps) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          border: `1.5px solid ${t.border}`,
          borderRadius: 9,
          padding: `10px ${icon ? "36px" : "12px"} 10px 12px`,
          fontSize: 13,
          color: t.navy,
          backgroundColor: t.white,
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = t.blue;
          e.target.style.boxShadow = "0 0 0 3px rgba(26,82,160,0.09)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = t.border;
          e.target.style.boxShadow = "none";
        }}
      />
      {icon && (
        <div style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: t.placeholder, pointerEvents: "none", display: "flex" }}>
          {icon}
        </div>
      )}
    </div>
  );
}

export function SettingTextarea({
  value, onChange, rows = 3, placeholder,
}: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      style={{
        width: "100%",
        border: `1.5px solid ${t.border}`,
        borderRadius: 9,
        padding: "10px 12px",
        fontSize: 13,
        color: t.navy,
        backgroundColor: t.white,
        fontFamily: "inherit",
        outline: "none",
        resize: "vertical",
        lineHeight: 1.6,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = t.blue;
        e.target.style.boxShadow = "0 0 0 3px rgba(26,82,160,0.09)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = t.border;
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

export function SettingSelect({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        border: `1.5px solid ${t.border}`,
        borderRadius: 9,
        padding: "10px 32px 10px 12px",
        fontSize: 13,
        color: t.navy,
        backgroundColor: t.white,
        fontFamily: "inherit",
        outline: "none",
        appearance: "none",
        cursor: "pointer",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
      }}
      onFocus={(e) => (e.target.style.borderColor = t.blue)}
      onBlur={(e) => (e.target.style.borderColor = t.border)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function SaveButton({
  isDirty, saving, onPress, label,
}: { isDirty: boolean; saving: boolean; onPress: () => void; label: string }) {
  const active = isDirty && !saving;
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={!isDirty || saving}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        backgroundColor: active ? t.red : t.border,
        border: "none",
        borderRadius: 9,
        padding: "10px 22px",
        fontSize: 13,
        fontWeight: 600,
        color: active ? t.white : t.muted,
        cursor: active ? "pointer" : "default",
        fontFamily: "inherit",
        marginTop: 20,
        transition: "background 0.15s",
      }}
    >
      {saving ? "Saving…" : (
        <>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={active ? t.white : t.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
