import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reorder, motion } from "framer-motion";
import {
  ChevronLeft,
  CalendarPlus,
  MessageCircle,
  Clock,
  PoundSterling,
  CalendarDays,
  Users,
  Wallet,
  ClipboardCheck,
  GripVertical,
} from "lucide-react";
import { EveryInstructorLayout } from "@/components/layout/EveryInstructorLayout";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_QUICK_ACTIONS,
  QuickActionId,
  loadQuickActionsPrefs,
  saveQuickActionsPrefs,
} from "@/lib/quickActionsPrefs";

const META: Record<
  QuickActionId,
  { label: string; icon: any; accent: string; subtitle: string }
> = {
  "add-lesson": { label: "Add lesson", icon: CalendarPlus, accent: "#007AFF", subtitle: "Schedule a new booking" },
  message: { label: "Message", icon: MessageCircle, accent: "#5856D6", subtitle: "Open inbox" },
  "fill-gap": { label: "Fill gap", icon: Clock, accent: "#FF9500", subtitle: "Find pupils for free slots" },
  payment: { label: "Payment", icon: PoundSterling, accent: "#34C759", subtitle: "Take a payment" },
  schedule: { label: "Schedule", icon: CalendarDays, accent: "#007AFF", subtitle: "View your diary" },
  pupils: { label: "Pupils", icon: Users, accent: "#5856D6", subtitle: "Your learners" },
  earnings: { label: "Earnings", icon: Wallet, accent: "#34C759", subtitle: "Money & invoices" },
  tests: { label: "Tests", icon: ClipboardCheck, accent: "#FF9500", subtitle: "Test bookings" },
};

export default function EveryInstructorQuickActionsEdit() {
  const navigate = useNavigate();

  const initial = useMemo(() => loadQuickActionsPrefs(), []);
  const [order, setOrder] = useState<QuickActionId[]>(initial.order);
  const [hidden, setHidden] = useState<QuickActionId[]>(initial.hidden);

  const isDirty =
    JSON.stringify(order) !== JSON.stringify(initial.order) ||
    JSON.stringify([...hidden].sort()) !==
      JSON.stringify([...initial.hidden].sort());

  const visibleCount = order.filter((id) => !hidden.includes(id)).length;
  const canSave = isDirty && visibleCount > 0;

  const toggleHidden = (id: QuickActionId) => {
    setHidden((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!canSave) return;
    saveQuickActionsPrefs({ order, hidden });
    navigate(-1);
  };

  const handleBack = () => {
    if (
      isDirty &&
      !window.confirm("Discard changes to your Quick Actions?")
    ) {
      return;
    }
    navigate(-1);
  };

  const handleReset = () => {
    setOrder(DEFAULT_QUICK_ACTIONS);
    setHidden([]);
  };

  return (
    <EveryInstructorLayout>
      {/* Header */}
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
      </header>

      <div className="px-5 pt-5 pb-32">
        <p className="text-[13px] text-gray-500 mb-3 px-1">
          Drag to reorder. Use the toggle to show or hide an action on your
          home screen.
        </p>

        <Reorder.Group
          axis="y"
          values={order}
          onReorder={setOrder}
          className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm"
        >
          {order.map((id) => {
            const meta = META[id];
            const Icon = meta.icon;
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
                  <GripVertical
                    className="h-5 w-5 text-gray-300 shrink-0 cursor-grab active:cursor-grabbing"
                    aria-hidden
                  />
                  <div
                    className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: meta.accent,
                      opacity: isHidden ? 0.4 : 1,
                    }}
                  >
                    <Icon className="h-[18px] w-[18px] text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[15px] font-medium ${
                        isHidden ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {meta.label}
                    </p>
                    <p className="text-[12px] text-gray-400 truncate">
                      {meta.subtitle}
                    </p>
                  </div>
                  <Switch
                    checked={!isHidden}
                    onCheckedChange={() => toggleHidden(id)}
                    aria-label={`Show ${meta.label}`}
                  />
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

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleReset}
          className="mt-6 w-full text-center text-[15px] font-medium py-3 rounded-xl bg-white shadow-sm text-gray-700"
        >
          Reset to default
        </motion.button>
      </div>
    </EveryInstructorLayout>
  );
}
