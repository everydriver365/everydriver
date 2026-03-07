import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { haptics } from "@/lib/haptics";
import { LucideIcon } from "lucide-react";

interface ContextAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  separator?: boolean;
}

interface HapticContextMenuProps {
  children: React.ReactNode;
  actions: ContextAction[];
}

export function HapticContextMenu({ children, actions }: HapticContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        onPointerDown={() => {
          // Haptic on long-press start
        }}
        asChild
      >
        <div
          onContextMenu={() => haptics.medium()}
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 rounded-[14px] shadow-xl border-border/50 backdrop-blur-xl bg-popover/95 p-1">
        {actions.map((action, i) => (
          <React.Fragment key={i}>
            {action.separator && i > 0 && <ContextMenuSeparator />}
            <ContextMenuItem
              onClick={() => {
                haptics.light();
                action.onClick();
              }}
              className={`rounded-[10px] ${action.destructive ? "text-destructive focus:text-destructive" : ""}`}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </ContextMenuItem>
          </React.Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
