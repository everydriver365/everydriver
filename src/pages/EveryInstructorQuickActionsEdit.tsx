import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reorder, motion } from "framer-motion";
import { ChevronLeft, GripVertical, Plus, Trash2, Search, Lock } from "lucide-react";
import { EveryInstructorLayout } from "@/components/layout/EveryInstructorLayout";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_QUICK_ACTIONS,
  MAX_HOME_ACTIONS,
  QuickActionId,
  loadQuickActionsPrefs,
  saveQuickActionsPrefs,
} from "@/lib/quickActionsPrefs";
import {
  QUICK_ACTIONS_BY_ID,
  QUICK_ACTIONS_CATALOG,
  QUICK_ACTION_CATEGORIES,
  TILE_TONE,
} from "@/lib/quickActionsCatalog";

export default function EveryInstructorQuickActionsEdit() {
  const navigate = useNavigate();

  const initial = useMemo(() => loadQuickActionsPrefs(), []);
  const [order, setOrder] = useState<QuickActionId[]>(initial.order);
  const [hidden, setHidden] = useState<QuickActionId[]>(initial.hidden);
  const [query, setQuery] = useState("");

  const isDirty =
    JSON.stringify(order) !== JSON.stringify(initial.order) ||
    JSON.stringify([...hidden].sort()) !==
      JSON.stringify([...initial.hidden].sort());

  const visibleCount = order.filter((id) => !hidden.includes(id)).length;
  const canSave = isDirty && visibleCount > 0;
  const atLimit = order.length >= MAX_HOME_ACTIONS;

  const toggleHidden = (id: QuickActionId) =>
    setHidden((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const removeFromHome = (id: QuickActionId) => {
    setOrder((p) => p.filter((x) => x !== id));
    setHidden((p) => p.filter((x) => x !== id));
  };

  const addToHome = (id: QuickActionId) => {
    if (order.includes(id) || atLimit) return;
    setOrder((p) => [...p, id]);
  };

  const handleSave = () => {
    if (!canSave) return;
    saveQuickActionsPrefs({ order, hidden });
    navigate(-1);
  };

  const handleBack = () => {
    if (isDirty && !window.confirm("Discard changes to your Quick Actions?")) return;
    navigate(-1);
  };

  const handleReset = () => {
    setOrder([...DEFAULT_QUICK_ACTIONS]);
    setHidden([]);
  };

  const q = query.trim().toLowerCase();
  const matches = (label: string, sub: string) =>
    !q || label.toLowerCase().includes(q) || sub.toLowerCase().includes(q);

  // Available = catalog tiles not currently on Home, grouped by category
  const availableByCat = useMemo(() => {
    const grouped: Record<string, typeof QUICK_ACTIONS_CATALOG> = {};
    for (const t of QUICK_ACTIONS_CATALOG) {
      if (order.includes(t.id)) continue;
      if (!matches(t.label, t.subtitle)) continue;
      (grouped[t.category] ||= []).push(t);
    }
    return grouped;
  }, [order, q]);

  return (
    <EveryInstructorLayout>
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="flex items-center justify-between px-2 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 px-2 py-1 text-[15px] font-medium"
            style={{ color: "#007AFF" }}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-[16px] font-semibold text-gray-900">
            Edit Quick Actions
          </h1>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-3 py-1 text-[15px] font-semibold disabled:opacity-40"
            style={{ color: "#007AFF" }}
          >
            Save
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actions"
              className="pl-9 h-10 rounded-[12px] bg-gray-100 border-0"
            />
          </div>
        </div>
      </header>

      <div className="px-5 pt-4 pb-32">
        {/* SHOWN ON HOME */}
        <div className="flex items-baseline justify-between mb-2 px-1">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">
            Shown on Home
          </h2>
          <span className="text-[12px] font-medium text-gray-500">
            {order.length} / {MAX_HOME_ACTIONS}
          </span>
        </div>

        <Reorder.Group
          axis="y"
          values={order}
          onReorder={setOrder}
          className="bg-white rounded-[12px] overflow-hidden divide-y divide-gray-100 shadow-sm"
        >
          {order.map((id) => {
            const meta = QUICK_ACTIONS_BY_ID[id];
            if (!meta) return null;
            const Icon = meta.icon;
            const tone = TILE_TONE[meta.tone];
            const isHidden = hidden.includes(id);
            return (
              <Reorder.Item
                key={id}
                value={id}
                className="bg-white"
                whileDrag={{
                  scale: 1.02,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                  zIndex: 10,
                }}
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <GripVertical className="h-5 w-5 text-gray-300 shrink-0 cursor-grab active:cursor-grabbing" />
                  <div
                    className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: tone.bg, opacity: isHidden ? 0.4 : 1 }}
                  >
                    <Icon className="h-[18px] w-[18px]" style={{ color: tone.fg }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[15px] font-medium ${
                        isHidden ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {meta.label}
                    </p>
                    <p className="text-[12px] text-gray-400 truncate">{meta.subtitle}</p>
                  </div>
                  <Switch
                    checked={!isHidden}
                    onCheckedChange={() => toggleHidden(id)}
                    aria-label={`Show ${meta.label}`}
                  />
                  <button
                    onClick={() => removeFromHome(id)}
                    className="p-1.5 -mr-1 text-gray-400 active:text-red-500"
                    aria-label={`Remove ${meta.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>

        {visibleCount === 0 && (
          <p className="text-[13px] text-red-500 mt-3 px-1">
            At least one Quick Action must stay visible.
          </p>
        )}
        {atLimit && (
          <p className="text-[12px] text-gray-500 mt-2 px-1">
            You've reached the {MAX_HOME_ACTIONS}-action limit. Remove one to add more.
          </p>
        )}

        {/* MORE ACTIONS */}
        <div className="mt-8">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-gray-500 mb-2 px-1">
            More Actions
          </h2>

          {QUICK_ACTION_CATEGORIES.map((cat) => {
            const items = availableByCat[cat];
            if (!items || items.length === 0) return null;
            return (
              <div key={cat} className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5 px-1">
                  {cat}
                </p>
                <div className="bg-white rounded-[12px] overflow-hidden divide-y divide-gray-100 shadow-sm">
                  {items.map((meta) => {
                    const Icon = meta.icon;
                    const tone = TILE_TONE[meta.tone];
                    return (
                      <div key={meta.id} className="flex items-center gap-3 px-3 py-3">
                        <div
                          className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                          style={{ backgroundColor: tone.bg }}
                        >
                          <Icon className="h-[18px] w-[18px]" style={{ color: tone.fg }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium text-gray-900 flex items-center gap-1.5">
                            {meta.label}
                            {meta.requiredFeature && (
                              <Lock className="h-3 w-3 text-gray-400" />
                            )}
                          </p>
                          <p className="text-[12px] text-gray-400 truncate">
                            {meta.subtitle}
                          </p>
                        </div>
                        <button
                          onClick={() => addToHome(meta.id)}
                          disabled={atLimit}
                          className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 active:scale-95 transition"
                          style={{ backgroundColor: "#007AFF" }}
                          aria-label={`Add ${meta.label}`}
                        >
                          <Plus className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {Object.keys(availableByCat).length === 0 && (
            <p className="text-[13px] text-gray-500 px-1">
              {q ? "No actions match your search." : "All actions are on Home."}
            </p>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleReset}
          className="mt-8 w-full text-center text-[15px] font-medium py-3 rounded-[12px] bg-white shadow-sm text-gray-700"
        >
          Reset to default
        </motion.button>
      </div>
    </EveryInstructorLayout>
  );
}
