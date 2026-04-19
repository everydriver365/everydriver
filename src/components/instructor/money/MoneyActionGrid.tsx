import { 
  QrCode, 
  Wallet, 
  Receipt, 
  Gift, 
  Car,
  Calculator
} from "lucide-react";
import { Link } from "react-router-dom";
import { haptics } from "@/lib/haptics";
import { WarmTile, WarmTileGrid, WarmTileCategory } from "../WarmTile";

interface MoneyActionGridProps {
  bonusEarned: number;
  onTakePayment: () => void;
}

export function MoneyActionGrid({ bonusEarned, onTakePayment }: MoneyActionGridProps) {
  const actions: Array<{
    id: string;
    label: string;
    sublabel: string;
    icon: typeof QrCode;
    category: WarmTileCategory;
    href?: string;
    onClick?: () => void;
    primary?: boolean;
  }> = [
    {
      id: "take-payment",
      label: "Take payment",
      sublabel: "QR or manual",
      icon: QrCode,
      category: "money",
      onClick: () => { haptics.selection(); onTakePayment(); },
      primary: true,
    },
    {
      id: "accounts",
      label: "Accounts",
      sublabel: "Income & outgoings",
      icon: Wallet,
      category: "money",
      href: "/instructor/accounts",
    },
    {
      id: "expenses",
      label: "Expenses",
      sublabel: "Track costs",
      icon: Receipt,
      category: "money",
      href: "/instructor/expenses",
    },
    {
      id: "bonus",
      label: "Bonus",
      sublabel: `£${bonusEarned} earned`,
      icon: Gift,
      category: "money",
      href: "/instructor/bonus",
    },
    {
      id: "mileage",
      label: "Mileage",
      sublabel: "Tax tracker",
      icon: Car,
      category: "money",
      href: "/instructor/mileage",
    },
    {
      id: "tax",
      label: "Tax summary",
      sublabel: "HMRC ready",
      icon: Calculator,
      category: "money",
      href: "/instructor/accounts?tab=tax",
    },
  ];

  return (
    <WarmTileGrid>
      {actions.map((action) => (
        <WarmTile
          key={action.id}
          icon={action.icon}
          title={action.label}
          subtitle={action.sublabel}
          category={action.category}
          primary={action.primary}
          to={action.href}
          onClick={action.onClick}
        />
      ))}
    </WarmTileGrid>
  );
}
