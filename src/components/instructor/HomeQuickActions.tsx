import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Plus, PoundSterling, Car, Heart } from "lucide-react";

interface HomeQuickActionsProps {
  onTakePayment?: () => void;
}

export function HomeQuickActions({ onTakePayment }: HomeQuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    { id: "fill-gaps", label: "Fill Gaps", icon: Calendar, iconColor: "text-violet-600", route: "/instructor/gaps" },
    { id: "track-live", label: "Track Live", icon: MapPin, iconColor: "text-emerald-600", route: "/instructor/traccar" },
    { id: "add-lesson", label: "Add Lesson", icon: Plus, iconColor: "text-blue-600", route: "/instructor/schedule?action=add" },
    { id: "take-payment", label: "Take Payment", icon: PoundSterling, iconColor: "text-rose-600", onClick: onTakePayment },
    { id: "find-my-car", label: "Find My Car", icon: Car, iconColor: "text-sky-600", route: "/instructor/find-my-car" },
    { id: "health-hub", label: "Health Hub", icon: Heart, iconColor: "text-pink-600", route: "/instructor/health" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const content = (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="flex flex-col items-center justify-center p-3 rounded-none border border-gray-200 bg-white shadow-[0_2px_8px_rgba(20,37,66,0.08)] active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Icon className={`h-4.5 w-4.5 ${action.iconColor}`} />
            </div>
            <span className="text-[11px] font-semibold text-foreground">{action.label}</span>
          </motion.div>
        );

        if (action.onClick) {
          return (
            <button key={action.id} onClick={action.onClick} className="text-left">
              {content}
            </button>
          );
        }

        return (
          <Link key={action.id} to={action.route!}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
