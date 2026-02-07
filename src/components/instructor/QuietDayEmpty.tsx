import { Calendar, ClipboardList, Award, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface QuietDayEmptyProps {
  className?: string;
}

const quickActions = [
  { icon: ClipboardList, label: "Waitlist", route: "/instructor/waitlist" },
  { icon: Award, label: "Tests", route: "/instructor/test-results" },
  { icon: Settings, label: "Settings", route: "/instructor/settings" },
];

export function QuietDayEmpty({ className = "" }: QuietDayEmptyProps) {
  return (
    <div className={`mx-4 text-center ${className}`}>
      <div className="bg-card border border-border p-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-muted/50 mb-4">
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
                <button className="flex flex-col items-center gap-1 px-4 py-2 bg-muted/30 text-foreground transition-colors">
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
            <Button className="w-full">
              Book a Lesson
            </Button>
          </Link>
          <Link to="/instructor/schedule">
            <Button variant="outline" className="w-full">
              View Schedule
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
