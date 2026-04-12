import { Calendar, CalendarPlus, BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface QuietDayEmptyProps {
  className?: string;
}

const quickActions = [
  { icon: CalendarPlus, label: "Add Lesson", route: "/instructor/diary" },
  { icon: Clock, label: "Availability", route: "/instructor/availability" },
  { icon: BarChart3, label: "Earnings", route: "/instructor/accounts" },
];

export function QuietDayEmpty({ className = "" }: QuietDayEmptyProps) {
  return (
    <div className={`text-center ${className}`}>
      <div className="bg-card border border-border/40 rounded-2xl p-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-muted/50 rounded-2xl mb-4">
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        
        <h3 className="font-medium text-foreground text-base mb-1">
          No lessons scheduled
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Use this time for admin, training, or filling gaps.
        </p>
        
        {/* Quick action buttons */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.route} to={action.route}>
                <button className="flex flex-col items-center gap-1.5 px-4 py-2.5 bg-muted/30 rounded-2xl text-foreground transition-colors hover:bg-muted/50">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] font-medium">{action.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
        
        {/* Main actions */}
        <div className="flex flex-col gap-2">
          <Link to="/instructor/diary">
            <Button className="w-full rounded-2xl">
              Book a Lesson
            </Button>
          </Link>
          <Link to="/instructor/schedule">
            <Button variant="outline" className="w-full rounded-2xl">
              View Schedule
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
