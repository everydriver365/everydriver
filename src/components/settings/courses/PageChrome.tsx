import { ChevronLeft, Plus, Check, BookOpen, Loader2 } from "lucide-react";
import { tokens } from "./tokens";
import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "none", border: "none", padding: 0,
        color: tokens.mid, fontSize: 13, fontWeight: 500,
        cursor: "pointer", fontFamily: "inherit",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = tokens.navy)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = tokens.mid)}
    >
      <ChevronLeft size={14} />
      All settings
    </button>
  );
}

export type BreadcrumbItem = { label: string; href?: string; active?: boolean };

export function Breadcrumb({
  items, onNavigate,
}: { items: BreadcrumbItem[]; onNavigate: (href: string) => void }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginTop: 6 }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {i > 0 && <span style={{ color: tokens.muted }}>›</span>}
          {item.active || !item.href ? (
            <span style={{ color: tokens.navy, fontWeight: 600 }}>{item.label}</span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(item.href!)}
              style={{
                color: tokens.muted, background: "none", border: "none",
                padding: 0, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = tokens.navy)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = tokens.muted)}
            >
              {item.label}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeaderCard({
  title, subtitle, actions,
}: { title: string; subtitle: string; actions: ReactNode }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 18px", borderRadius: 14, background: tokens.white,
        border: `1px solid ${tokens.border}`, marginTop: 16,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: 12,
          background: tokens.blueLight, color: tokens.blue,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <BookOpen size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: tokens.navy, margin: 0, lineHeight: 1.25 }}>{title}</h1>
        <p style={{ fontSize: 12.5, color: tokens.mid, margin: "3px 0 0", lineHeight: 1.4 }}>{subtitle}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", width: "100%", justifyContent: "flex-end" }} className="hpb-actions">
        {actions}
      </div>
    </div>
  );
}

export function AddButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "9px 14px", borderRadius: 8,
        border: `1.5px solid ${tokens.border}`, background: tokens.white,
        color: tokens.navy, fontSize: 13, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = tokens.blue)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = tokens.border)}
    >
      <Plus size={14} />
      Add course
    </button>
  );
}

export function SaveButton({
  isDirty, saving, onPress,
}: { isDirty: boolean; saving: boolean; onPress: () => void }) {
  const enabled = isDirty && !saving;
  return (
    <button
      type="button"
      onClick={enabled ? onPress : undefined}
      disabled={!enabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "9px 16px", borderRadius: 8, border: "none",
        background: enabled ? tokens.red : tokens.disabled,
        color: tokens.white, fontSize: 13, fontWeight: 600,
        cursor: enabled ? "pointer" : "not-allowed", fontFamily: "inherit",
      }}
    >
      {saving ? (
        <>
          <Loader2 size={14} className="animate-spin" /> Saving…
        </>
      ) : (
        <>
          <Check size={14} /> Save changes
        </>
      )}
    </button>
  );
}
