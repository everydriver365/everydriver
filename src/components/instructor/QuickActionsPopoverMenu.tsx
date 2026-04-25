import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer as DrawerPrimitive } from "vaul";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import dsmLogo from "@/assets/dsm-logo.png";
import {
  Calendar, Users, MapPin, PoundSterling, MessageSquare,
  X, Clock, Star,
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
  { id: "availability", label: "Availability", icon: Clock, color: "20 184 166", route: "/instructor/availability?action=add" },
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

  // Sort: pinned first, preserving original order within each group
  const sortedActions = [
    ...quickActions.filter(a => pinned.includes(a.id)),
    ...quickActions.filter(a => !pinned.includes(a.id)),
  ];

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

          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 pb-3 bg-background border-b border-border"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)",
            }}
          >
            <img
              src={dsmLogo}
              alt="DSM"
              className="h-9 w-auto object-contain"
            />
            <div className="flex-1 min-w-0" />
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center bg-muted active:bg-muted/70 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {/* Section label */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Quick Actions
            </p>
          </div>

          {/* 2-column tile grid — no scroll */}
          <div className="flex-1 overflow-hidden px-3">
            <div className="grid grid-cols-2 gap-2.5">
              {sortedActions.map((action) => {
                const Icon = action.icon;
                const isPinned = pinned.includes(action.id);
                return (
                  <div key={action.id} className="relative">
                    <button
                      onClick={() => handleAction(action.route)}
                      className={cn(
                        "w-full aspect-square flex flex-col items-center justify-center gap-2",
                        "rounded-2xl border border-border/60 bg-card",
                        "active:scale-[0.97] active:bg-muted/60 transition-all",
                        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                      )}
                    >
                      <div
                        className="h-11 w-11 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `rgba(${action.color}, 0.12)` }}
                      >
                        <Icon
                          className="h-[20px] w-[20px]"
                          style={{ color: `rgb(${action.color})` }}
                          strokeWidth={2}
                        />
                      </div>
                      <span className="text-[12.5px] font-medium text-foreground text-center leading-tight px-1">
                        {action.label}
                      </span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(action.id); }}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full active:bg-muted transition-colors"
                      aria-label={isPinned ? "Unpin action" : "Pin action"}
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          isPinned ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
                        )}
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-4 pt-3 pb-3 border-t border-border/60 text-center mt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
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
