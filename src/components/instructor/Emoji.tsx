import { CSSProperties } from "react";
import { getEmojiFor } from "./iconEmojiMap";

interface EmojiProps {
  /** Lucide icon name (e.g. "Briefcase") OR a raw emoji glyph */
  name: string;
  /** Pixel size — matches Lucide's default (24) when omitted */
  size?: number;
  /** Accessible label. Defaults to the icon name. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const EMOJI_STACK = `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif`;

/**
 * Renders a native system emoji. If `name` is a Lucide icon name with a
 * mapped emoji, that emoji is used; if `name` is already an emoji glyph
 * (or anything not in the map), it's rendered as-is.
 *
 * Emojis carry their own colour, so any `text-*` colour classes are
 * intentionally ignored — pass `style={{ fontSize }}` or `size` to scale.
 */
export function Emoji({ name, size = 18, label, className, style }: EmojiProps) {
  const glyph = getEmojiFor(name) ?? name;
  return (
    <span
      role="img"
      aria-label={label ?? name}
      className={className}
      style={{
        fontFamily: EMOJI_STACK,
        fontSize: size,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontStyle: "normal",
        fontWeight: "normal",
        ...style,
      }}
    >
      {glyph}
    </span>
  );
}
