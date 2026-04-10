import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface HomeMoneyOverviewProps {
  instructorId: string | undefined;
}

interface PupilBalance {
  id: string;
  name: string;
  profile_image_url: string | null;
  balance: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  weeksOverdue?: number;
}

export function HomeMoneyOverview({ instructorId }: HomeMoneyOverviewProps) {
  const { data: pupils = [], isLoading } = useQuery({
    queryKey: ["pupil-balances", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];

      // Get pupils with their account balances
      const { data: pupilsData } = await supabase
        .from("pupils")
        .select(`
          id,
          name,
          profile_image_url,
          account_balance
        `)
        .eq("instructor_id", instructorId)
        .eq("status", "active")
        .order("name");

      if (!pupilsData) return [];

      // Get recent payments for each pupil
      const pupilIds = pupilsData.map(p => p.id);
      const { data: payments } = await supabase
        .from("payment_history")
        .select("pupil_id, amount, recorded_at")
        .in("pupil_id", pupilIds)
        .order("recorded_at", { ascending: false });

      // Group payments by pupil
      const paymentsByPupil = new Map<string, { date: string; amount: number }>();
      payments?.forEach(p => {
        if (!paymentsByPupil.has(p.pupil_id)) {
          paymentsByPupil.set(p.pupil_id, { date: p.recorded_at, amount: Number(p.amount) });
        }
      });

      // Calculate balances and map data
      const result: PupilBalance[] = pupilsData
        .map(pupil => {
          const balance = Number(pupil.account_balance || 0);
          const lastPayment = paymentsByPupil.get(pupil.id);
          
          // Calculate weeks overdue if balance is low and no recent payment
          let weeksOverdue = 0;
          if (balance < 50 && lastPayment) {
            const daysSincePayment = Math.floor(
              (Date.now() - new Date(lastPayment.date).getTime()) / (1000 * 60 * 60 * 24)
            );
            weeksOverdue = Math.floor(daysSincePayment / 7);
          }

          return {
            id: pupil.id,
            name: pupil.name,
            profile_image_url: pupil.profile_image_url,
            balance: Math.round(balance),
            lastPaymentDate: lastPayment?.date || null,
            lastPaymentAmount: lastPayment?.amount || null,
            weeksOverdue: weeksOverdue > 1 ? weeksOverdue : undefined,
          };
        })
        .filter(p => p.balance > 0 || p.weeksOverdue)
        .sort((a, b) => (b.weeksOverdue || 0) - (a.weeksOverdue || 0))
        .slice(0, 3);

      return result;
    },
    enabled: !!instructorId,
    staleTime: 60000,
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Money Overview</h3>
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-card rounded-none border p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-32 mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (pupils.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-2"
    >
      <h3 className="text-base font-semibold text-foreground">Money Overview</h3>
      
      <div className="space-y-2">
        {pupils.map((pupil, index) => (
          <Link key={pupil.id} to={`/instructor/pupils/${pupil.id}`}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.05 }}
              className="bg-card rounded-none border p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={pupil.profile_image_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {getInitials(pupil.name)}
                  </AvatarFallback>
                </Avatar>
                {pupil.lastPaymentAmount && !pupil.weeksOverdue && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-primary-foreground">✓</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">
                    {pupil.name}
                  </span>
                  <span className="font-bold text-foreground">
                    £{pupil.balance}
                  </span>
                  {pupil.lastPaymentAmount && (
                    <span className="text-sm text-muted-foreground">
                      from lessons
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  {pupil.weeksOverdue ? (
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue: {pupil.weeksOverdue} weeks
                    </span>
                  ) : pupil.lastPaymentDate ? (
                    <span className="text-muted-foreground">
                      Paid £{pupil.lastPaymentAmount} {formatDistanceToNow(new Date(pupil.lastPaymentDate), { addSuffix: true })}
                    </span>
                  ) : null}
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
