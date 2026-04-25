import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Plus, PoundSterling, Car, Heart, Megaphone, Camera, Accessibility } from "lucide-react";
import { WarmTile, WarmTileGrid, WarmTileCategory } from "./WarmTile";

interface HomeQuickActionsProps {
  onTakePayment?: () => void;
}

export function HomeQuickActions({ onTakePayment }: HomeQuickActionsProps) {
  const navigate = useNavigate();

  const actions: Array<{
    id: string;
    label: string;
    subtitle: string;
    icon: typeof Calendar;
    category: WarmTileCategory;
    route?: string;
    onClick?: () => void;
    primary?: boolean;
  }> = [
    { id: "fill-gaps", label: "Fill gaps", subtitle: "Schedule gaps", icon: Calendar, category: "schedule", route: "/instructor/gaps" },
    { id: "track-live", label: "Track live", subtitle: "GPS tracking", icon: MapPin, category: "urgent", route: "/instructor/tracking", primary: true },
    { id: "add-lesson", label: "Add lesson", subtitle: "New booking", icon: Plus, category: "schedule", route: "/instructor/schedule?action=add" },
    { id: "take-payment", label: "Take payment", subtitle: "Record a payment", icon: PoundSterling, category: "money", onClick: onTakePayment },
    { id: "find-my-car", label: "Find my car", subtitle: "Car location", icon: Car, category: "schedule", route: "/instructor/find-my-car" },
    { id: "health-hub", label: "Health hub", subtitle: "Wellness tips", icon: Heart, category: "neutral", route: "/instructor/health" },
    { id: "test-requests", label: "Test swap", subtitle: "Swap a test", icon: Calendar, category: "schedule", route: "/instructor/test-requests" },
    { id: "find-nearby", label: "Find nearby", subtitle: "Toilets, food & more", icon: MapPin, category: "schedule", route: "/instructor/find-nearby" },
    { id: "dashcam", label: "Dashcam", subtitle: "View footage", icon: Camera, category: "neutral", onClick: () => window.open("https://www.kinesisfleetpro.com/#/login;next=%2Fstatus", "_blank", "noopener,noreferrer") },
    { id: "accessibility", label: "Accessibility", subtitle: "Text size & contrast", icon: Accessibility, category: "neutral", route: "/instructor/accessibility" },
    { id: "platform-updates", label: "Updates", subtitle: "News & ideas", icon: Megaphone, category: "neutral", route: "/instructor/platform-updates" },
  ];

  return (
    <WarmTileGrid>
      {actions.map((action) => (
        <WarmTile
          key={action.id}
          icon={action.icon}
          title={action.label}
          subtitle={action.subtitle}
          category={action.category}
          primary={action.primary}
          to={action.route}
          onClick={action.onClick}
        />
      ))}
    </WarmTileGrid>
  );
}
