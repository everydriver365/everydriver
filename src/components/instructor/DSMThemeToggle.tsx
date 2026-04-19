import { Sun, Moon } from "lucide-react";
import { useInstructorTheme } from "@/context/InstructorThemeContext";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** Force a colour for the icon (e.g. white on coloured headers). */
  iconColor?: string;
  size?: number;
}

/**
 * Sun/moon toggle for the DSM instructor app.
 * Persists preference to localStorage via InstructorThemeContext.
 */
export function DSMThemeToggle({ className, iconColor, size = 18 }: Props) {
  const { mode, toggle } = useInstructorTheme();
  const isDark = mode === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={cn(
        "inline-flex items-center justify-center rounded-full h-8 w-8",
        className,
      )}
      style={{
        background: iconColor ? "rgba(255,255,255,0.15)" : "transparent",
      }}
    >
      <Icon
        size={size}
        strokeWidth={1.6}
        color={iconColor ?? "currentColor"}
        style={{ strokeLinecap: "round", strokeLinejoin: "round" }}
      />
    </button>
  );
}
