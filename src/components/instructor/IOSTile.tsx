import React, { ReactNode, HTMLAttributes } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * IOSTile — canonical "Waiting Room" style tile.
 * Single source of truth for instructor portal tiles.
 *
 * Tokens:
 *  - bg #FFFFFF, border 0.5px #E4E4E7, radius 14
 *  - padding 14px 16px (compact) / 16px (standard)
 *  - icon roundel 44x44, radius 12, #E8ECF1 bg, #2A394F icon
 *  - primary text #18181B 15/500 Inter, secondary #71717A 12/400 Inter
 *  - chevron #A1A1AA 18px
 */
interface IOSTileRootProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  interactive?: boolean;
  compact?: boolean;
  noPadding?: boolean;
  className?: string;
}

function IOSTileRoot({
  children,
  interactive = false,
  compact = false,
  noPadding = false,
  className,
  onClick,
  ...rest
}: IOSTileRootProps) {
  const padding = noPadding ? undefined : compact ? "14px 16px" : "16px";
  return (
    <motion.div
      onClick={onClick}
      whileTap={interactive || onClick ? { scale: 0.99, backgroundColor: "#F4F4F5" } : undefined}
      whileHover={interactive || onClick ? { backgroundColor: "#FAFAFA" } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        border: "0.5px solid #E4E4E7",
        boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.06)",
        padding,
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: interactive || onClick ? "pointer" : undefined,
        fontFamily: "Inter, -apple-system, 'SF Pro Text', sans-serif",
      }}
      className={cn(
        "outline-none focus-visible:ring-2 focus-visible:ring-[#2A394F]",
        className
      )}
      tabIndex={interactive || onClick ? 0 : undefined}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

interface IOSTileIconProps {
  children: ReactNode;
  bg?: string;
  className?: string;
}
function IOSTileIcon({ children, bg = "#E8ECF1", className }: IOSTileIconProps) {
  return (
    <div
      className={cn("flex items-center justify-center shrink-0", className)}
      style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: bg }}
    >
      {children}
    </div>
  );
}

interface IOSTileBodyProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  badgeColor?: { bg: string; fg: string };
}
function IOSTileBody({ title, subtitle, badge, badgeColor }: IOSTileBodyProps) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "#18181B",
            fontFamily: "Inter, sans-serif",
            margin: 0,
          }}
        >
          {title}
        </p>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: "2px 7px",
              borderRadius: 4,
              backgroundColor: badgeColor?.bg ?? "#DBEAFE",
              color: badgeColor?.fg ?? "#1E40AF",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: "#71717A",
            marginTop: 2,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function IOSTileChevron() {
  return <ChevronRight size={18} strokeWidth={2} color="#A1A1AA" style={{ flexShrink: 0 }} />;
}

export const IOSTile = Object.assign(IOSTileRoot, {
  Icon: IOSTileIcon,
  Body: IOSTileBody,
  Chevron: IOSTileChevron,
});

/**
 * IOSTileGroup — grouped list container with indented dividers between children.
 * Wraps children in a single canonical tile; dividers indent to align under text.
 */
interface IOSTileGroupProps {
  header?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
}
export function IOSTileGroup({ header, footer, children, className }: IOSTileGroupProps) {
  const arr = React.Children.toArray(children);
  return (
    <div className={className}>
      {header && (
        <p className="text-[13px] font-normal text-muted-foreground uppercase tracking-wide px-4 pb-1.5">
          {header}
        </p>
      )}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: "0.5px solid #E4E4E7",
          overflow: "hidden",
        }}
      >
        {arr.map((child, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ height: 0.5, backgroundColor: "#E4E4E7", marginLeft: 72 }} />}
            {child}
          </React.Fragment>
        ))}
      </div>
      {footer && (
        <p className="text-[13px] text-muted-foreground px-4 pt-1.5">{footer}</p>
      )}
    </div>
  );
}
