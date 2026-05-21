import { useState, useEffect } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import blueTickIcon from "@/assets/blue_tick-removebg-preview.png";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
import { supabase } from "@/integrations/supabase/client";

interface TestRequestsTileProps {
  instructorId: string;
}

export function TestRequestsTile({ instructorId }: TestRequestsTileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { data: notificationCount = 0 } = useTestSwapNotifications(instructorId);

  const [watchedCentres, setWatchedCentres] = useState<string[]>([]);

  useEffect(() => {
    const fetchWatched = async () => {
      const { data } = await supabase
        .from("test_requests")
        .select("test_centre_name")
        .eq("instructor_id", instructorId)
        .eq("request_type", "want_test")
        .eq("status", "active");
      setWatchedCentres((data || []).map(r => r.test_centre_name).filter(Boolean));
    };
    fetchWatched();
  }, [instructorId]);

  return (
    <div className="mx-4 mt-3">
      <div className="rounded-2xl overflow-hidden shadow-sm border border-border/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-white px-4 py-3 relative overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={blueTickIcon} alt="Test Requests" className="h-9 w-9" />
              <div className="text-left">
                <span className="font-semibold text-sm">Tests</span>
                {notificationCount > 0 && (
                  <p className="text-white/70 text-[10px]">
                    {notificationCount} slot{notificationCount !== 1 ? "s" : ""} match your requests
                  </p>
                )}
                {notificationCount === 0 && watchedCentres.length > 0 && (
                  <p className="text-white/70 text-[10px]">Watching {watchedCentres.length} centre{watchedCentres.length !== 1 ? "s" : ""}</p>
                )}
                {notificationCount === 0 && watchedCentres.length === 0 && (
                  <p className="text-white/70 text-[10px]">No active requests</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notificationCount > 0 && (
                <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
              <ChevronDown className={cn("h-4 w-4 transition-transform", !isExpanded && "-rotate-90")} />
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="bg-card p-4 space-y-3">
            {watchedCentres.length > 0 ? (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Watching:</span> {watchedCentres.join(", ")}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                No active test requests. Create one from Test Swap to get alerts.
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/instructor/test-requests")}
              className="w-full gap-1"
            >
              Go to Test Swap <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
