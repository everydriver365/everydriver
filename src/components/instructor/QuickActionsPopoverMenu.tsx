import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer as DrawerPrimitive } from "vaul";
import { haptics } from "@/lib/haptics";
import {
  CalendarPlus, UserPlus, MapPin, PoundSterling, MessageSquare, Clock,
} from "lucide-react";
import { QuickActionTile } from "./ui/QuickActionTile";

interface QuickActionsPopoverMenuProps {
  open: boolean;
  onClose: () => void;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

type ActionId =
  | "add-lesson"
  | "add-pupil"
  | "track-live"
  | "take-payment"
  | "messages"
  | "availability";

const quickActions = [
  { id: "add-lesson"   as ActionId, label: "Add lesson",   icon: CalendarPlus,  iconColor: "#8A5BC9", iconBackground: "#F1ECFA", route: "/instructor/schedule?action=add" },
  { id: "add-pupil"    as ActionId, label: "Add pupil",    icon: UserPlus,      iconColor: "#3B8B3B", iconBackground: "#E8F3E8", route: "/instructor/pupils?action=add" },
  { id: "track-live"   as ActionId, label: "Track live",   icon: MapPin,        iconColor: "#C8434F", iconBackground: "#FBEAEC", route: "/instructor/tracking" },
  { id: "take-payment" as ActionId, label: "Take payment", icon: PoundSterling, iconColor: "#3B8B3B", iconBackground: "#E8F3E8", route: "/instructor/take-payment" },
  { id: "messages"     as ActionId, label: "Messages",     icon: MessageSquare, iconColor: "#B8801F", iconBackground: "#FBF1DE", route: "/instructor/messages?action=new" },
  { id: "availability" as ActionId, label: "Availability", icon: Clock,         iconColor: "#2B7BC8", iconBackground: "#E6F1FB", route: "/instructor/availability?action=add" },
];

/** Re-order the grid based on the current route so the most relevant action is first. */
function orderForPath(pathname: string): ActionId[] {
  if (pathname.startsWith("/instructor/pupils")) {
    return ["add-pupil", "add-lesson", "messages", "take-payment", "track-live", "availability"];
  }
  if (pathname.startsWith("/instructor/schedule")) {
    return ["add-lesson", "availability", "add-pupil", "take-payment", "track-live", "messages"];
  }
  if (pathname.startsWith("/instructor/messages")) {
    return ["messages", "add-lesson", "add-pupil", "take-payment", "track-live", "availability"];
  }
  if (pathname.startsWith("/instructor/take-payment") || pathname.startsWith("/instructor/payments")) {
    return ["take-payment", "add-lesson", "messages", "add-pupil", "track-live", "availability"];
  }
  if (pathname.startsWith("/instructor/tracking")) {
    return ["track-live", "add-lesson", "messages", "take-payment", "add-pupil", "availability"];
  }
  // Default (home + everything else)
  return ["add-lesson", "take-payment", "add-pupil", "track-live", "messages", "availability"];
}

export function QuickActionsPopoverMenu({ open, onClose }: QuickActionsPopoverMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (open) haptics.medium();
  }, [open]);

  const orderedActions = useMemo(() => {
    const order = orderForPath(location.pathname);
    const map = new Map(quickActions.map((a) => [a.id, a]));
    return order.map((id) => map.get(id)!).filter(Boolean);
  }, [location.pathname]);

  const handleAction = (route: string) => {
    onClose();
    navigate(route);
  };

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(o) => { if (!o) onClose(); }}
      shouldScaleBackground
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/45" />
        <DrawerPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-[81] flex flex-col outline-none"
          style={{
            background: "#FFFFFF",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          }}
        >
          <DrawerPrimitive.Title className="sr-only">Quick actions</DrawerPrimitive.Title>

          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 8, paddingBottom: 4 }}>
            <span
              aria-hidden
              style={{
                width: 36,
                height: 5,
                borderRadius: 999,
                background: "#D1D1D6",
              }}
            />
          </div>

          {/* Caption */}
          <div
            style={{
              padding: "8px 20px 4px",
              fontFamily: FONT_STACK,
              fontSize: 11,
              fontWeight: 500,
              color: "#6E6E73",
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            Quick actions
          </div>

          {/* 3-column grid */}
          <div
            style={{
              padding: "8px 12px 8px",
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 4,
            }}
          >
            {orderedActions.map((action) => (
              <QuickActionTile
                key={action.id}
                icon={action.icon}
                iconColor={action.iconColor}
                iconBackground={action.iconBackground}
                label={action.label}
                onPress={() => handleAction(action.route)}
              />
            ))}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
