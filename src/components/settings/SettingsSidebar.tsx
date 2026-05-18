import { useState, useMemo, useEffect, useCallback } from "react";
import { SIDEBAR_SECTIONS } from "@/config/settingsSections";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useSettingsStatus } from "@/hooks/useSettingsStatus";
import { SidebarNavItem } from "./SidebarNavItem";
import { DynamicIcon } from "./DynamicIcon";
import { getInitials } from "@/lib/formatJobOffer";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  activeSection: string;
  onSelect: (id: string) => void;
}

export function SettingsSidebar({ activeSection, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const { instructor, signOut } = useInstructorAuth();
  const { completionFlags, waitingCount } = useSettingsStatus();
  const instructorId = instructor?.id ?? null;

  // Persisted section order (DB primary, localStorage fallback)
  const ORDER_KEY = "dsm.settings.sidebar.sectionOrder";
  const [order, setOrder] = useState<string[]>(() => SIDEBAR_SECTIONS.map(s => s.id));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let dbOrder: string[] | null = null;
      if (instructorId) {
        try {
          const { data } = await supabase
            .from("instructors")
            .select("settings_sidebar_order")
            .eq("id", instructorId)
            .single();
          const arr = (data as { settings_sidebar_order?: unknown } | null)?.settings_sidebar_order;
          if (Array.isArray(arr) && arr.length > 0) dbOrder = arr as string[];
        } catch {}
      }
      if (cancelled) return;
      let next: string[] | null = dbOrder;
      if (!next) {
        try {
          const saved = localStorage.getItem(ORDER_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) next = parsed as string[];
          }
        } catch {}
      }
      if (next) {
        const known = SIDEBAR_SECTIONS.map(s => s.id);
        const valid = next.filter(id => known.includes(id));
        const missing = known.filter(id => !valid.includes(id));
        setOrder([...valid, ...missing]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [instructorId]);

  const saveOrder = useCallback(async (next: string[]) => {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(next)); } catch {}
    if (instructorId) {
      try {
        await supabase.from("instructors").update({ settings_sidebar_order: next }).eq("id", instructorId);
      } catch {}
    }
  }, [instructorId]);

  const orderedSections = useMemo(() => {
    const byId = new Map(SIDEBAR_SECTIONS.map(s => [s.id, s]));
    return order.map(id => byId.get(id)).filter((s): s is typeof SIDEBAR_SECTIONS[number] => Boolean(s));
  }, [order]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orderedSections;
    return orderedSections
      .map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(s => s.items.length > 0);
  }, [query, orderedSections]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const isReorderable = query.trim().length === 0;

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null); setDragOverId(null); return;
    }
    setOrder(prev => {
      const next = [...prev];
      const from = next.indexOf(dragId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      saveOrder(next);
      return next;
    });
    setDragId(null); setDragOverId(null);
  };

  const photoUrl = (instructor as { profile_image_url?: string | null } | null)?.profile_image_url ?? null;
  const initials = getInitials(instructor?.name ?? null);

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        backgroundColor: "#FFF",
        borderRight: "1px solid #DDE3ED",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Profile block */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #F2F4F8" }}>
        <div style={{ position: "relative", width: 50, marginBottom: 12 }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              style={{ width: 50, height: 50, borderRadius: 25, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 50, height: 50, borderRadius: 25, backgroundColor: "#1A52A0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700, color: "#FFF",
              }}
            >
              {initials}
            </div>
          )}
          <div
            style={{
              position: "absolute", bottom: 1, right: 1,
              width: 11, height: 11, borderRadius: "50%",
              backgroundColor: "#1D9E75", border: "2px solid #FFF",
            }}
          />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F2044" }}>
          {instructor?.name ?? ""}
        </div>
        <div style={{ fontSize: 11, fontWeight: 300, color: "#9CA3AF", marginTop: 2 }}>
          DVSA Approved Instructor
        </div>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            backgroundColor: "#FBEAEA", borderRadius: 20, padding: "2px 9px",
            fontSize: 10, fontWeight: 600, color: "#CC2229", marginTop: 7,
          }}
        >
          ★ Pro plan
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "11px 16px", borderBottom: "1px solid #F2F4F8" }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 7,
            backgroundColor: "#F2F4F8", borderRadius: 8, padding: "7px 10px",
          }}
        >
          <DynamicIcon name="search" color="#C4C9D4" size={13} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search settings…"
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: 12, color: "#0F2044", fontFamily: "inherit", flex: 1,
            }}
          />
        </div>
      </div>

      {/* Nav sections */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map(section => (
          <div key={section.id} style={{ padding: "10px 0 4px" }}>
            <div
              style={{
                fontSize: 10, fontWeight: 700, color: "#C4C9D4",
                letterSpacing: "0.07em", textTransform: "uppercase",
                padding: "0 16px 5px",
              }}
            >
              {section.label}
            </div>
            {section.items.map(item => (
              <SidebarNavItem
                key={item.id}
                item={item}
                isActive={activeSection === item.id}
                onClick={onSelect}
                completionFlags={completionFlags}
                waitingCount={waitingCount}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: 16, borderTop: "1px solid #F2F4F8" }}>
        <button
          type="button"
          onClick={() => void signOut()}
          style={{
            width: "100%", background: "transparent",
            border: "1.5px solid #DDE3ED", borderRadius: 8,
            padding: 9, fontSize: 13, fontWeight: 500, color: "#CC2229",
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <DynamicIcon name="log-out" size={13} color="#CC2229" />
          Sign out
        </button>
        <div
          style={{
            fontSize: 10, color: "#C4C9D4", textAlign: "center",
            marginTop: 9, fontWeight: 300,
          }}
        >
          Drive365 · © 2026 Drive365 Ltd
        </div>
      </div>
    </aside>
  );
}
