import { Drawer as DrawerPrimitive } from "vaul";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  route?: string;
  onClick?: () => void;
  color: string;
}

interface QuickActionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
}

export function QuickActionsDrawer({
  open,
  onOpenChange,
  actions,
  onActionClick,
}: QuickActionsDrawerProps) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="left"
      shouldScaleBackground
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px]" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-[71] flex flex-col bg-background outline-none",
            "rounded-r-[18px] shadow-[8px_0_40px_rgba(0,0,0,0.18)]",
            "h-full"
          )}
          style={{ width: "min(86vw, 340px)" }}
        >
          {/* Hidden a11y title */}
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
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Section label */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Quick Actions
            </p>
          </div>

          {/* Action list */}
          <div className="flex-1 overflow-auto ios-scroll px-2">
            <div className="flex flex-col gap-0.5">
              {actions.map((action, index) => {
                const Icon = action.icon;
                const isActive = index === 0;
                return (
                  <button
                    key={action.id}
                    onClick={() => onActionClick(action)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors",
                      "active:bg-muted",
                      isActive && "bg-[hsl(var(--dsm-accent-blue)/0.10)]"
                    )}
                    style={{ minHeight: 56 }}
                  >
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                        "bg-zinc-100 dark:bg-white/[0.08]"
                      )}
                    >
                      <Icon
                        className="h-[18px] w-[18px]"
                        style={{ color: "hsl(var(--dsm-text-primary))" }}
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
                );
              })}
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
