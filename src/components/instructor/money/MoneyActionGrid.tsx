import { motion } from "framer-motion";
import { 
  QrCode, 
  Wallet, 
  Receipt, 
  Gift, 
  TrendingUp, 
  FileText,
  Car,
  Calculator
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface ActionItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  gradient: string;
  iconColor: string;
  size?: "normal" | "large";
  value?: string | number;
}

interface MoneyActionGridProps {
  bonusEarned: number;
  onTakePayment: () => void;
}

export function MoneyActionGrid({ bonusEarned, onTakePayment }: MoneyActionGridProps) {
  const actions: ActionItem[] = [
    {
      id: "take-payment",
      label: "Take Payment",
      sublabel: "QR or manual",
      icon: QrCode,
      onClick: onTakePayment,
      gradient: "from-emerald-500 to-teal-600",
      iconColor: "text-white",
      size: "large",
    },
    {
      id: "accounts",
      label: "Accounts",
      sublabel: "Income & outgoings",
      icon: Wallet,
      href: "/instructor/accounts",
      gradient: "from-violet-500 to-purple-600",
      iconColor: "text-white",
    },
    {
      id: "expenses",
      label: "Expenses",
      sublabel: "Track costs",
      icon: Receipt,
      href: "/instructor/expenses",
      gradient: "from-rose-500 to-pink-600",
      iconColor: "text-white",
    },
    {
      id: "bonus",
      label: "Bonus",
      value: `£${bonusEarned}`,
      icon: Gift,
      href: "/instructor/bonus",
      gradient: "from-amber-400 to-orange-500",
      iconColor: "text-white",
    },
    {
      id: "mileage",
      label: "Mileage",
      sublabel: "Tax tracker",
      icon: Car,
      href: "/instructor/mileage",
      gradient: "from-sky-500 to-blue-600",
      iconColor: "text-white",
    },
    {
      id: "tax",
      label: "Tax Summary",
      sublabel: "HMRC ready",
      icon: Calculator,
      href: "/instructor/accounts?tab=tax",
      gradient: "from-slate-600 to-slate-700",
      iconColor: "text-white",
    },
  ];

  const handleClick = (action: ActionItem) => {
    haptics.selection();
    if (action.onClick) {
      action.onClick();
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const isLarge = action.size === "large";
        
        const content = (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative overflow-hidden rounded-2xl p-3.5",
              "bg-gradient-to-br shadow-lg",
              "active:shadow-md transition-shadow",
              action.gradient,
              isLarge && "col-span-2 row-span-1"
            )}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
            
            <div className={cn(
              "relative z-10 flex",
              isLarge ? "flex-row items-center gap-3" : "flex-col items-start gap-2"
            )}>
              <div className={cn(
                "rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm",
                isLarge ? "h-12 w-12" : "h-9 w-9"
              )}>
                <Icon className={cn(
                  action.iconColor,
                  isLarge ? "h-6 w-6" : "h-4.5 w-4.5"
                )} />
              </div>
              
              <div className={isLarge ? "flex-1" : ""}>
                {action.value && (
                  <p className="text-xl font-bold text-white mb-0.5">{action.value}</p>
                )}
                <p className={cn(
                  "font-semibold text-white",
                  isLarge ? "text-base" : "text-xs"
                )}>
                  {action.label}
                </p>
                {action.sublabel && (
                  <p className={cn(
                    "text-white/70",
                    isLarge ? "text-xs" : "text-[10px]"
                  )}>
                    {action.sublabel}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );

        if (action.href) {
          return (
            <Link 
              key={action.id} 
              to={action.href}
              className={cn(isLarge && "col-span-2")}
              onClick={() => haptics.selection()}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={action.id}
            onClick={() => handleClick(action)}
            className={cn("text-left", isLarge && "col-span-2")}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
