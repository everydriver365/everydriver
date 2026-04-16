import { motion } from "framer-motion";
import { ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Pupil {
  id: string;
  name: string;
  account_balance: number | null;
  phone: string | null;
  profile_image_url?: string | null;
}

interface PupilBalancesListProps {
  pupils: Pupil[];
  limit?: number;
}

export function PupilBalancesList({ pupils, limit = 5 }: PupilBalancesListProps) {
  // Sort by balance (debt first, then credit)
  const sortedPupils = [...pupils]
    .sort((a, b) => (a.account_balance || 0) - (b.account_balance || 0))
    .slice(0, limit);

  const getBalanceStatus = (balance: number | null) => {
    if (balance === null || balance === 0) return "neutral";
    if (balance < 0) return "debt";
    return "credit";
  };

  const getBalanceIcon = (status: string) => {
    switch (status) {
      case "debt":
        return <AlertCircle className="h-4 w-4 text-rose-500" />;
      case "credit":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (sortedPupils.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No pupil accounts to display
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {sortedPupils.map((pupil, index) => {
        const balance = pupil.account_balance || 0;
        const status = getBalanceStatus(balance);

        return (
          <motion.div
            key={pupil.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`/instructor/pupils?pupil=${pupil.id}`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl",
                "bg-card/50 hover:bg-card/80 transition-colors",
                "border border-border/50"
              )}
            >
              {/* Avatar */}
              <Avatar className={cn(
                "h-10 w-10 shrink-0",
              )}>
                <AvatarImage src={pupil.profile_image_url || undefined} alt={pupil.name} />
                <AvatarFallback className={cn(
                  "text-sm font-semibold",
                  status === "debt" && "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                  status === "credit" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  status === "neutral" && "bg-muted text-muted-foreground"
                )}>
                  {getInitials(pupil.name)}
                </AvatarFallback>
              </Avatar>

              {/* Name and status */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{pupil.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getBalanceIcon(status)}
                  <span className="text-xs text-muted-foreground">
                    {status === "debt" && "Owes money"}
                    {status === "credit" && "In credit"}
                    {status === "neutral" && "Balanced"}
                  </span>
                </div>
              </div>

              {/* Balance */}
              <div className="text-right">
                <p className={cn(
                  "font-semibold",
                  status === "debt" && "text-rose-600 dark:text-rose-400",
                  status === "credit" && "text-emerald-600 dark:text-emerald-400",
                  status === "neutral" && "text-muted-foreground"
                )}>
                  {balance < 0 ? "-" : ""}£{Math.abs(balance).toFixed(2)}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </Link>
          </motion.div>
        );
      })}

      {pupils.length > limit && (
        <Link
          to="/instructor/accounts"
          className="block text-center text-sm text-primary font-medium py-2 hover:underline"
        >
          View all {pupils.length} pupils →
        </Link>
      )}
    </div>
  );
}
