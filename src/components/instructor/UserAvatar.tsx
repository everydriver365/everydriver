import { getInitials } from "@/lib/formatJobOffer";

// System-friendly deterministic palette (light mobile aesthetic).
const PALETTE = [
  "#8A5BC9", // purple
  "#2B7BC8", // blue
  "#33A06F", // green
  "#D89D2A", // amber
  "#C8434F", // red
  "#5E6AD2", // indigo
  "#1F8FA0", // teal
  "#B4538B", // pink
  "#7A6A4F", // taupe
  "#3F7AAE", // steel blue
];

// djb2 hash — stable across platforms.
function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

interface UserAvatarProps {
  name: string | null | undefined;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, photoUrl, size = 36, className }: UserAvatarProps) {
  const initials = getInitials(name);
  const colour = PALETTE[djb2(name ?? "?") % PALETTE.length];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name ?? ""}
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: colour,
        color: "#FFFFFF",
        fontSize: Math.round(size / 3),
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
      aria-label={name ?? "User"}
    >
      {initials}
    </div>
  );
}
