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
  iconColor: string;
  iconBg: string;
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
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      size: "large",
    },
    {
      id: "accounts",
      label: "Accounts",
      sublabel: "Income & outgoings",
      icon: Wallet,
      href: "/instructor/accounts",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      id: "expenses",
      label: "Expenses",
      sublabel: "Track costs",
      icon: Receipt,
      href: "/instructor/expenses",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      id: "bonus",
      label: "Bonus",
      value: `£${bonusEarned}`,
      icon: Gift,
      href: "/instructor/bonus",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      id: "mileage",
      label: "Mileage",
      sublabel: "Tax tracker",
      icon: Car,
      href: "/instructor/mileage",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      id: "tax",
      label: "Tax Summary",
      sublabel: "HMRC ready",
      icon: Calculator,
      href: "/instructor/accounts?tab=tax",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
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
              "bg-card border border-border shadow-[0_2px_8px_rgba(20,37,66,0.08)]",
              "active:shadow-md transition-shadow",
              isLarge && "col-span-2 row-span-1"
            )}
          >
            <div className={cn(
              "relative z-10 flex",
              isLarge ? "flex-row items-center gap-3" : "flex-col items-start gap-2"
            )}>
              <div className={cn(
                "rounded-full flex items-center justify-center",
                action.iconBg,
                isLarge ? "h-12 w-12" : "h-9 w-9"
              )}>
                <Icon className={cn(
                  action.iconColor,
                  isLarge ? "h-6 w-6" : "h-4.5 w-4.5"
                )} />
              </div>
              
              <div className={isLarge ? "flex-1" : ""}>
                {action.value && (
                  <p className="text-xl font-bold text-foreground mb-0.5">{action.value}</p>
                )}
                <p className={cn(
                  "font-semibold text-foreground",
                  isLarge ? "text-base" : "text-xs"
                )}>
                  {action.label}
                </p>
                {action.sublabel && (
                  <p className={cn(
                    "text-muted-foreground",
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
