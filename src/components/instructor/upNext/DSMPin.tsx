/**
 * DSM-branded map pin: red teardrop with white center, soft shadow.
 * Pure inline SVG so it works as a Google Maps OverlayView child.
 */
export function DSMPin() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
      <svg width={28} height={36} viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.268 21.732 0 14 0Z"
          fill="#B23A3F"
        />
        <circle cx="14" cy="14" r="6" fill="white" />
      </svg>
      <div
        style={{
          width: 8,
          height: 3,
          borderRadius: 4,
          background: "rgba(0,0,0,0.18)",
          marginTop: -2,
        }}
      />
    </div>
  );
}
