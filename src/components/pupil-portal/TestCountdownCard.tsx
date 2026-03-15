import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";

interface TestCountdownCardProps {
  pupilId: string;
  brandColour?: string;
}

export function TestCountdownCard({ pupilId, brandColour }: TestCountdownCardProps) {
  const color = brandColour || "hsl(var(--primary))";

  const { data: testDate } = useQuery({
    queryKey: ["pupil-test-countdown", pupilId],
    queryFn: async () => {
      // Check driving_test_results for upcoming tests (future date, not yet passed)
      const today = new Date().toISOString().split("T")[0];
      const { data } = await (supabase.from("driving_test_results") as any)
        .select("test_date")
        .eq("pupil_id", pupilId)
        .gte("test_date", today)
        .order("test_date", { ascending: true })
        .limit(1);
      
      if (data && data.length > 0) return data[0].test_date as string;
      return null;
    },
    staleTime: 10 * 60 * 1000,
  });

  if (!testDate) return null;

  const now = new Date();
  const test = new Date(testDate + "T09:00:00");
  const diffMs = test.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const progress = Math.max(0, Math.min(100, ((90 - daysLeft) / 90) * 100));
  const circumference = 2 * Math.PI * 38;
  const strokeDash = (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4"
    >
      {/* Progress ring */}
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 84 84" className="h-20 w-20 -rotate-90">
          <circle cx="42" cy="42" r="38" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle
            cx="42" cy="42" r="38" fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground leading-none">{daysLeft}</span>
          <span className="text-[10px] text-muted-foreground">days</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <CalendarCheck className="h-4 w-4" style={{ color }} />
          <span className="text-sm font-semibold text-foreground">Test Countdown</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your practical test is on{" "}
          <span className="font-medium text-foreground">
            {new Date(testDate).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        </p>
        {daysLeft <= 7 && (
          <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
            This week!
          </span>
        )}
      </div>
    </motion.div>
  );
}
