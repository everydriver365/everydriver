import { LucideIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getEmojiFor } from "./iconEmojiMap";

interface DesktopNavigationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  to?: string;
  onClick?: () => void;
  showChevron?: boolean;
}

export function DesktopNavigationCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  to,
  onClick,
  showChevron = true,
}: DesktopNavigationCardProps) {
  const content = (
    <div
      className="flex items-center gap-4 p-4 bg-card shadow-premium hover:shadow-premium-lg transition-shadow duration-200 cursor-pointer group tabular-nums"
      style={{ borderRadius: 12 }}
    >
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", iconBgColor)}>
        {(() => {
          const iconName = (Icon as { displayName?: string; name?: string }).displayName
            ?? (Icon as { name?: string }).name
            ?? "";
          const emoji = getEmojiFor(iconName);
          if (emoji) {
            return (
              <span
                role="img"
                aria-label={iconName}
                style={{
                  fontFamily: `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`,
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                {emoji}
              </span>
            );
          }
          return <Icon className={cn("w-5 h-5", iconColor)} />;
        })()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      {showChevron && (
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      )}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
}
