import { useEffect, useState } from "react";
import { Gift, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ReferralCounts {
  total: number;
  completed: number;
  pending: number;
}

export function ReferralStatsWidget() {
  const { instructor } = useInstructorAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<ReferralCounts>({ total: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructor?.id) return;

    const fetchReferrals = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pupil_referrals")
        .select("status")
        .eq("instructor_id", instructor.id);

      if (!error && data) {
        setCounts({
          total: data.length,
          completed: data.filter((r) => r.status === "completed").length,
          pending: data.filter((r) => r.status === "pending").length,
        });
      }
      setLoading(false);
    };

    fetchReferrals();
  }, [instructor?.id]);

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <Gift className="h-4 w-4 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="font-medium text-sm text-foreground">Referrals</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-around mb-3">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg font-semibold text-foreground">{counts.total}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg font-semibold text-emerald-600">{counts.completed}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Done</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg font-semibold text-amber-600">{counts.pending}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-7 gap-1"
              onClick={() => navigate("/instructor/settings")}
            >
              Manage Referrals <ChevronRight className="h-3 w-3" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
