/**
 * Tiny shimmer placeholder used by the instructor mobile home while
 * react-query is loading. Mirrors the iOS-consistency shimmer pattern
 * (mem://style/ios-consistency-patterns) without pulling in another lib.
 */

export function Shimmer({
  width = "100%",
  height = 14,
  radius = 6,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.06) 100%)",
        backgroundSize: "200% 100%",
        animation: "mhdsm-shimmer 1.2s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// Inject keyframes once.
if (typeof document !== "undefined" && !document.getElementById("mhdsm-shimmer-kf")) {
  const s = document.createElement("style");
  s.id = "mhdsm-shimmer-kf";
  s.textContent = `@keyframes mhdsm-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
  document.head.appendChild(s);
}
