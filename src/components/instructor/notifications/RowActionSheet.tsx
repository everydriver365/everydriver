import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Check, BellOff, Clock, MailOpen, Mail } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isUnread: boolean;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onSnooze: () => void;
  onMuteType: () => void;
  typeLabel: string;
}

export default function RowActionSheet({
  open, onOpenChange, isUnread, onMarkRead, onMarkUnread, onSnooze, onMuteType, typeLabel,
}: Props) {
  const items = [
    isUnread
      ? { key: "read", label: "Mark as read", icon: MailOpen, action: onMarkRead }
      : { key: "unread", label: "Mark as unread", icon: Mail, action: onMarkUnread },
    { key: "snooze", label: "Snooze", icon: Clock, action: onSnooze },
    { key: "mute", label: `Mute ${typeLabel}`, icon: BellOff, action: onMuteType },
  ];
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-base font-medium">Quick actions</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 flex flex-col gap-1">
          {items.map(i => {
            const Icon = i.icon;
            return (
              <button
                key={i.key}
                type="button"
                onClick={() => { i.action(); onOpenChange(false); }}
                className="w-full flex items-center gap-3 rounded-[10px] px-3 py-3 active:bg-[#F2F2F4] hover:bg-[#F2F2F4] text-left"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-[9px]" style={{ background: "#F2F2F4" }}>
                  <Icon className="w-5 h-5" style={{ color: "#000" }} strokeWidth={1.8} />
                </div>
                <p className="m-0 flex-1 text-[14px] font-medium" style={{ color: "#000", letterSpacing: "-0.1px" }}>{i.label}</p>
                {i.key === "read" || i.key === "unread" ? (
                  <Check className="w-4 h-4" style={{ color: "transparent" }} />
                ) : null}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
