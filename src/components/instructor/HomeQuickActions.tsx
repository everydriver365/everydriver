import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Plus, PoundSterling } from "lucide-react";

interface HomeQuickActionsProps {
  onTakePayment?: () => void;
}

export function HomeQuickActions({ onTakePayment }: HomeQuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      id: "fill-gaps",
      label: "Fill Gaps",
      icon: Calendar,
      iconColor: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-900/30",
      borderColor: "border-violet-200 dark:border-violet-800",
      route: "/instructor/gaps",
    },
    {
      id: "track-live",
      label: "Track Live",
      icon: MapPin,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      route: "/instructor/traccar",
    },
    {
      id: "add-lesson",
      label: "Add Lesson",
      icon: Plus,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      route: "/instructor/schedule?action=add",
    },
    {
      id: "take-payment",
      label: "Take Payment",
      icon: PoundSterling,
      iconColor: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-900/30",
      borderColor: "border-rose-200 dark:border-rose-800",
      onClick: onTakePayment,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const content = (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={`flex items-center gap-2.5 p-3 rounded-xl border ${action.borderColor} ${action.bgColor} active:scale-[0.98] transition-transform`}
          >
            <Icon className={`h-5 w-5 ${action.iconColor}`} />
            <span className="text-sm font-medium text-foreground">{action.label}</span>
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
