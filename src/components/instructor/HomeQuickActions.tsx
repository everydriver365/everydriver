import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Plus, PoundSterling, Car, Heart, ChevronRight, Megaphone } from "lucide-react";

interface HomeQuickActionsProps {
  onTakePayment?: () => void;
}

export function HomeQuickActions({ onTakePayment }: HomeQuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    { id: "fill-gaps", label: "Fill Gaps", subtitle: "Schedule gaps", icon: Calendar, iconColor: "text-violet-600", route: "/instructor/gaps" },
    { id: "track-live", label: "Track Live", subtitle: "GPS tracking", icon: MapPin, iconColor: "text-emerald-600", route: "/instructor/tracking" },
    { id: "add-lesson", label: "Add Lesson", subtitle: "New booking", icon: Plus, iconColor: "text-primary", route: "/instructor/schedule?action=add" },
    { id: "take-payment", label: "Take Payment", subtitle: "Record income", icon: PoundSterling, iconColor: "text-rose-600", onClick: onTakePayment },
    { id: "find-my-car", label: "Find My Car", subtitle: "Car location", icon: Car, iconColor: "text-sky-600", route: "/instructor/find-my-car" },
    { id: "health-hub", label: "Health Hub", subtitle: "Wellness tips", icon: Heart, iconColor: "text-pink-600", route: "/instructor/health" },
    { id: "test-requests", label: "Test Swap", subtitle: "Swap a test", icon: Calendar, iconColor: "text-amber-600", route: "/instructor/test-requests" },
    { id: "find-nearby", label: "Find Nearby", subtitle: "Toilets, food & more", icon: MapPin, iconColor: "text-sky-600", route: "/instructor/find-nearby" },
    { id: "platform-updates", label: "Updates", subtitle: "News & ideas", icon: Megaphone, iconColor: "text-indigo-600", route: "/instructor/platform-updates" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const content = (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-card rounded-none border p-4 hover:bg-muted/50 transition-colors h-full"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-none bg-primary/10 flex items-center justify-center">
                <Icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.subtitle}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
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
