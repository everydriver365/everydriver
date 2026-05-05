import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import { Search, Info, Lock, Inbox } from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useModules, ModuleDef, ModuleStatus } from "@/context/ModulesContext";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";

const CATEGORIES = ["All", "Teaching", "Business", "Communication", "Website"] as const;
type Cat = typeof CATEGORIES[number];

function ModuleIcon({ name, color }: { name: string; color: string }) {
  const Cmp = (Icons as any)[name] ?? Icons.Box;
  return <Cmp size={15} strokeWidth={1.75} color={color} />;
}

function Toggle({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 28, height: 16, borderRadius: 999,
        background: on ? "var(--d2-indigo)" : "transparent",
        border: on ? "0.5px solid var(--d2-indigo)" : "0.5px solid var(--d2-border)",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 150ms ease-out, border-color 150ms ease-out",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: "absolute", top: 1.5, left: on ? 13 : 1.5,
          width: 12, height: 12, borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          transition: "left 150ms ease-out",
        }}
      />
    </button>
  );
}

function StatusBadge({ status }: { status: ModuleStatus }) {
  if (status === "locked") {
    return (
      <span style={{ fontSize: 10, fontWeight: 500, color: "#3C3489", cursor: "pointer" }}>
        Upgrade to unlock →
      </span>
    );
  }
  if (status === "off") {
    return (
      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "#F1F5F9", color: "#64748B" }}>
        Off
      </span>
    );
  }
  return (
    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "#ECFDF5", color: "#047857" }}>
      Active
    </span>
  );
}

function ModuleCard({ m, onToggle, onLockedClick }: { m: ModuleDef; onToggle: () => void; onLockedClick: () => void }) {
  const isOn = m.status === "active" || m.status === "beta";
  const isLocked = m.status === "locked";
  const isBeta = m.status === "beta";
  const iconBg = isOn ? "var(--d2-indigo-bg)" : "#F1F5F9";
  const iconColor = isOn ? "var(--d2-indigo)" : "#94A3B8";

  return (
    <div
      onClick={isLocked ? onLockedClick : undefined}
      className="d2-card transition-colors"
      style={{
        padding: 12,
        opacity: m.status === "off" ? 0.7 : 1,
        cursor: isLocked ? "pointer" : "default",
        display: "flex", flexDirection: "column", gap: 8,
      }}
    >
      <div className="flex items-start justify-between" style={{ gap: 8 }}>
        <div
          style={{
            width: 30, height: 30, borderRadius: 7,
            background: iconBg, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ModuleIcon name={m.icon} color={iconColor} />
        </div>
        <div className="flex items-center gap-1.5">
          {isBeta && (
            <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 999, background: "#FEF3C7", color: "#B45309" }}>
              BETA
            </span>
          )}
          {isLocked ? (
            <span
              className="flex items-center gap-1"
              style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 999, background: "#EEDFE", color: "#3C3489" }}
            >
              <Lock size={9} strokeWidth={2.25} />
              {(m.requiredPlan || "PRO").toUpperCase()}
            </span>
          ) : (
            <Toggle on={isOn} onClick={onToggle} />
          )}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--d2-text-1)", lineHeight: 1.3 }}>{m.name}</div>
        <div style={{
          fontSize: 11, color: "var(--d2-text-2)", lineHeight: 1.4, marginTop: 2,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {m.description}
        </div>
      </div>
      <div onClick={isLocked ? onLockedClick : undefined}>
        <StatusBadge status={m.status} />
      </div>
    </div>
  );
}

export default function InstructorModules() {
  const navigate = useNavigate();
  const { instructor, signOut } = useInstructorAuth();
  const { modules, toggle, setActive } = useModules();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Cat>("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter(m => {
      if (cat !== "All" && m.category !== cat) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    });
  }, [modules, search, cat]);

  const activeCount = modules.filter(m => m.status === "active" || m.status === "beta").length;
  const totalCount = modules.length;

  const handleToggle = (m: ModuleDef) => {
    const prev = m.status;
    const next = toggle(m.id);
    if (next === "locked") return;
    const nowActive = next !== "off";
    toast(nowActive ? `${m.name} added to your sidebar` : `${m.name} removed from your sidebar`, {
      duration: 4000,
      action: { label: "Undo", onClick: () => setActive(m.id, prev !== "off") },
    });
  };

  const handleSignOut = async () => { await signOut(); navigate("/instructor-app/login"); };

  const initials = (instructor?.name || "")
    .split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "ID";

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || "Instructor"}
      notificationCount={notificationCount}
      onSignOut={handleSignOut}
      onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
      onBell={() => navigate("/instructor/notifications")}
    >
      <div className="flex flex-col" style={{ gap: 16 }}>
        {/* Header */}
        <div>
          <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--d2-text-3)" }}>
            <span>Settings</span><span>/</span><span>Modules</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--d2-text-1)", marginTop: 4, letterSpacing: "-0.3px" }}>
            Modules
          </h1>
          <p style={{ fontSize: 13, color: "var(--d2-text-2)", marginTop: 4, maxWidth: 640 }}>
            Turn features on and off as you need them. Toggling a module adds or removes it from your sidebar.
          </p>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 flex-1"
            style={{ background: "#F8FAFC", border: "0.5px solid var(--d2-border)", borderRadius: 8, padding: "0 10px", height: 32 }}
          >
            <Search size={13} style={{ color: "var(--d2-text-3)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules"
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 12, color: "var(--d2-text-1)" }}
            />
          </div>
          <div
            className="flex items-center"
            style={{ background: "#F1F5F9", borderRadius: 8, padding: 3, gap: 2 }}
          >
            {CATEGORIES.map(c => {
              const active = c === cat;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  style={{
                    padding: "4px 10px", borderRadius: 6,
                    background: active ? "#fff" : "transparent",
                    color: active ? "var(--d2-text-1)" : "var(--d2-text-2)",
                    fontSize: 11, fontWeight: active ? 500 : 400,
                    boxShadow: active ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                    transition: "all 150ms ease-out",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary strip */}
        <div
          className="flex items-center gap-2"
          style={{ background: "#EEF2FF", color: "#4338CA", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}
        >
          <Info size={13} />
          <span>
            <strong style={{ fontWeight: 600 }}>{activeCount} of {totalCount}</strong> modules active. Streamline your sidebar by switching off ones you don't use.
          </span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center" style={{ padding: "48px 16px", gap: 8 }}>
            <Inbox size={28} color="var(--d2-text-3)" strokeWidth={1.5} />
            <div style={{ fontSize: 13, color: "var(--d2-text-2)" }}>No modules match your search</div>
            <button
              onClick={() => { setSearch(""); setCat("All"); }}
              style={{ fontSize: 12, color: "var(--d2-indigo)", fontWeight: 500 }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div
            className="grid"
            style={{
              gap: 12,
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
            }}
          >
            {filtered.map(m => (
              <ModuleCard
                key={m.id}
                m={m}
                onToggle={() => handleToggle(m)}
                onLockedClick={() => navigate(`/instructor/billing?highlight=${encodeURIComponent(m.id)}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
