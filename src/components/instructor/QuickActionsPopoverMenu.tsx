import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer as DrawerPrimitive } from "vaul";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import {
  Calendar, Users, MapPin, PoundSterling, MessageSquare,
  UsersRound, X, Coffee, Clock, Star, Megaphone, ChevronRight,
} from "lucide-react";

interface QuickActionsPopoverMenuProps {
  open: boolean;
  onClose: () => void;
}

const PINNED_KEY = "pinned-quick-actions";

const quickActions = [
  { id: "add-lesson", label: "Add Lesson", icon: Calendar, color: "139 92 246", route: "/instructor/schedule?action=add" },
  { id: "add-pupil", label: "Add Pupil", icon: Users, color: "34 85 255", route: "/instructor/pupils?action=add" },
  { id: "track-live", label: "Track Live", icon: MapPin, color: "16 185 129", route: "/instructor/tracking" },
  { id: "take-payment", label: "Take Payment", icon: PoundSterling, color: "244 63 94", route: "/instructor/take-payment" },
  { id: "messages", label: "Messages", icon: MessageSquare, color: "6 182 212", route: "/instructor/messages?action=new" },
  { id: "nearby-adis", label: "Nearby ADIs", icon: UsersRound, color: "99 102 241", route: "/instructor/nearby-friends" },
  { id: "availability", label: "Availability", icon: Clock, color: "20 184 166", route: "/instructor/availability?action=add" },
  { id: "end-of-day", label: "End of Day", icon: Coffee, color: "99 102 241", route: "/instructor/end-of-day" },
  { id: "platform-updates", label: "Platform Updates", icon: Megaphone, color: "245 158 11", route: "/instructor/platform-updates" },
];

function loadPinned(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PINNED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function QuickActionsPopoverMenu({ open, onClose }: QuickActionsPopoverMenuProps) {
  const navigate = useNavigate();
  const [pinned, setPinned] = useState<string[]>(loadPinned);

  useEffect(() => {
    if (open) haptics.medium();
  }, [open]);

  const togglePin = useCallback((id: string) => {
    haptics.light();
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      localStorage.setItem(PINNED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleAction = (route: string) => {
    haptics.light();
    onClose();
    navigate(route);
  };

  const pinnedVisible = quickActions.filter(a => pinned.includes(a.id));
  const unpinnedVisible = quickActions.filter(a => !pinned.includes(a.id));

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(o) => { if (!o) onClose(); }}
      direction="left"
      shouldScaleBackground
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-[81] flex flex-col bg-background outline-none",
            "rounded-r-[18px] shadow-[8px_0_40px_rgba(0,0,0,0.18)]",
            "h-full"
          )}
          style={{ width: "min(86vw, 340px)" }}
        >
          <DrawerPrimitive.Title className="sr-only">Quick actions</DrawerPrimitive.Title>

          {/* Navy header */}
          <div
            className="flex items-center gap-3 px-4 pb-4 text-white"
            style={{
              backgroundColor: "hsl(var(--dsm-navy))",
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
            }}
          >
            <img
              src="/dsm-logo.png"
              alt=""
              className="h-9 w-9 rounded-[8px] object-contain bg-white/10 p-1"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold leading-tight">DSM</div>
              <div className="text-[11px] text-white/70 leading-tight">
                Driving School Manager
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Action list */}
          <div className="flex-1 overflow-auto ios-scroll px-2 pt-2">
            {pinnedVisible.length > 0 && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-3 pt-2 pb-1">
                  Pinned
                </p>
                <div className="flex flex-col gap-0.5">
                  {pinnedVisible.map((action, index) => (
                    <ActionRow
                      key={action.id}
                      action={action}
                      isActive={index === 0}
                      isPinned
                      onAction={handleAction}
                      onTogglePin={togglePin}
                    />
                  ))}
                </div>
              </>
            )}

            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-3 pt-3 pb-1">
              Quick Actions
            </p>
            <div className="flex flex-col gap-0.5">
              {unpinnedVisible.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  isActive={false}
                  isPinned={false}
                  onAction={handleAction}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-4 pt-3 pb-4 border-t border-border/60 text-center"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
          >
            <p className="text-[11px] text-muted-foreground">
              Driving School Manager
            </p>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

interface ActionRowProps {
  action: typeof quickActions[number];
  isActive: boolean;
  isPinned: boolean;
  onAction: (route: string) => void;
  onTogglePin: (id: string) => void;
}

function ActionRow({ action, isActive, isPinned, onAction, onTogglePin }: ActionRowProps) {
  const Icon = action.icon;
  return (
    <div
      className={cn(
        "flex items-center rounded-2xl transition-colors",
        isActive && "bg-[hsl(var(--dsm-accent-blue)/0.10)]"
      )}
    >
      <button
        onClick={() => onAction(action.route)}
        className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-2xl active:bg-muted/60 transition-colors text-left"
        style={{ minHeight: 56 }}
      >
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `rgba(${action.color}, 0.12)` }}
        >
          <Icon
            className="h-[18px] w-[18px]"
            style={{ color: `rgb(${action.color})` }}
            strokeWidth={2}
          />
        </div>
        <span
          className={cn(
            "flex-1 text-[15px] text-foreground",
            isActive ? "font-semibold" : "font-medium"
          )}
        >
          {action.label}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(action.id); }}
        className="p-2 mr-1 rounded-full active:bg-muted transition-colors shrink-0"
        aria-label={isPinned ? "Unpin action" : "Pin action"}
      >
        <Star
          className={cn(
            "h-4 w-4 transition-colors",
            isPinned ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40"
          )}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}
