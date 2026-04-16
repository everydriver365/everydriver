import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

interface IOSSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  snapPoints?: number[];
  defaultSnap?: number;
}

export function IOSSheet({
  open,
  onOpenChange,
  children,
  snapPoints = [0.5, 1],
  defaultSnap = 0.5,
}: IOSSheetProps) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      activeSnapPoint={undefined}
      shouldScaleBackground
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[14px] bg-card",
            "shadow-[0_-8px_40px_rgba(0,0,0,0.15),0_-2px_10px_rgba(0,0,0,0.06)]"
          )}
        >
          {/* iOS-style grab handle — exact Apple spec */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-9 h-[5px] rounded-[2.5px] bg-[#c7c7cc] dark:bg-[#48484a]" />
          </div>
          {children}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

export function IOSSheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-4 pb-2 pt-1 text-center", className)}
      {...props}
    />
  );
}

export function IOSSheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-[17px] font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function IOSSheetBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-1 overflow-auto ios-scroll px-4 pb-8", className)}
      {...props}
    />
  );
}
