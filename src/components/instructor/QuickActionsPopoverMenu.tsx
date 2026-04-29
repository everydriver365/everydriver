import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer as DrawerPrimitive } from "vaul";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import {
  CalendarPlus, UserPlus, MapPin, PoundSterling, MessageSquare, Clock,
} from "lucide-react";
import { DsmLogo } from "./ui/DsmLogo";
import { CloseButton } from "./ui/CloseButton";
import { QuickActionRow } from "./ui/QuickActionRow";

interface QuickActionsPopoverMenuProps {
  open: boolean;
  onClose: () => void;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

const quickActions = [
  { id: "add-lesson",   label: "Add lesson",   icon: CalendarPlus,  iconColor: "#8A5BC9", iconBackground: "#F1ECFA", route: "/instructor/schedule?action=add" },
  { id: "add-pupil",    label: "Add pupil",    icon: UserPlus,      iconColor: "#3B8B3B", iconBackground: "#E8F3E8", route: "/instructor/pupils?action=add" },
  { id: "track-live",   label: "Track live",   icon: MapPin,        iconColor: "#C8434F", iconBackground: "#FBEAEC", route: "/instructor/tracking" },
  { id: "take-payment", label: "Take payment", icon: PoundSterling, iconColor: "#3B8B3B", iconBackground: "#E8F3E8", route: "/instructor/take-payment" },
  { id: "messages",     label: "Messages",     icon: MessageSquare, iconColor: "#B8801F", iconBackground: "#FBF1DE", route: "/instructor/messages?action=new" },
  { id: "availability", label: "Availability", icon: Clock,         iconColor: "#2B7BC8", iconBackground: "#E6F1FB", route: "/instructor/availability?action=add" },
];

export function QuickActionsPopoverMenu({ open, onClose }: QuickActionsPopoverMenuProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) haptics.medium();
  }, [open]);

  const handleAction = (route: string) => {
    haptics.light();
    onClose();
    navigate(route);
  };

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(o) => { if (!o) onClose(); }}
      direction="left"
      shouldScaleBackground
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/45" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-[81] flex flex-col outline-none h-full overflow-hidden"
          )}
          style={{
            width: "min(100% - 32px, 340px)",
            background: "#FFFFFF",
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <DrawerPrimitive.Title className="sr-only">Quick actions</DrawerPrimitive.Title>

          {/* Header */}
          <div
            style={{
              padding: 16,
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderBottom: "0.5px solid #E5E5EA",
            }}
          >
            <DsmLogo size={24} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#000000",
                  letterSpacing: -0.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Driving School Manager
              </div>
            </div>
            <CloseButton onPress={onClose} ariaLabel="Close menu" />
          </div>

          {/* List section */}
          <div style={{ padding: 16, flex: 1, overflow: "hidden" }}>
            <div
              style={{
                fontFamily: FONT_STACK,
                fontSize: 11,
                fontWeight: 500,
                color: "#6E6E73",
                letterSpacing: 0.3,
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              Quick actions
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {quickActions.map((action) => (
                <QuickActionRow
                  key={action.id}
                  icon={action.icon}
                  iconColor={action.iconColor}
                  iconBackground={action.iconBackground}
                  label={action.label}
                  onPress={() => handleAction(action.route)}
                />
              ))}
            </div>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
