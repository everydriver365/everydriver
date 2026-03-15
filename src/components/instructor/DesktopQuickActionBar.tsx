import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Calendar, Users, PoundSterling, MapPin, MessageSquare,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

const actions = [
  { id: "add-lesson", label: "New Lesson", icon: Calendar, route: "/instructor/schedule?action=add", color: "text-violet-400" },
  { id: "add-pupil", label: "New Pupil", icon: Users, route: "/instructor/pupils?action=add", color: "text-blue-400" },
  { id: "take-payment", label: "Payment", icon: PoundSterling, route: "/instructor/take-payment", color: "text-rose-400" },
  { id: "track", label: "Track", icon: MapPin, route: "/instructor/tracking", color: "text-emerald-400" },
  { id: "message", label: "Message", icon: MessageSquare, route: "/instructor/messages?action=new", color: "text-cyan-400" },
];

export function DesktopQuickActionBar() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-0.5">
      {actions.map((action) => (
        <Tooltip key={action.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-white/50 hover:text-white hover:bg-white/10 gap-1.5 px-2 xl:px-3"
              onClick={() => navigate(action.route)}
            >
              <action.icon className="h-4 w-4 shrink-0" />
              <span className="hidden xl:inline text-xs font-medium">{action.label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs xl:hidden">
            {action.label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
