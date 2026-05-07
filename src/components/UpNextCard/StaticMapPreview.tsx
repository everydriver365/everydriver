import { memo } from "react";

interface StaticMapPreviewProps {
  hasDestination: boolean;
  height?: number;
}

/**
 * Stylised SVG map illustration. NOT a real map — purely a visual cue.
 * The live Google Map is rendered inside the fullscreen modal, not here.
 */
function StaticMapPreviewBase({ hasDestination, height = 110 }: StaticMapPreviewProps) {
  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: "100%",
        height,
        background: "#F0EDE6",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 320 120"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        {/* Park / green spaces */}
        <path
          d="M 18 12 Q 50 4 86 18 T 138 32 L 130 60 Q 90 70 56 58 T 12 44 Z"
          fill="#E0E8D5"
          opacity={0.7}
        />
        <path
          d="M 220 80 Q 260 70 295 86 L 305 118 L 210 116 Z"
          fill="#E0E8D5"
          opacity={0.6}
        />

        {/* Roads */}
        <path d="M -10 80 Q 80 60 160 70 T 330 58" stroke="#D8D5CB" strokeWidth={3} fill="none" />
        <path d="M 30 -10 Q 50 40 80 70 T 130 130" stroke="#D8D5CB" strokeWidth={2.5} fill="none" />
        <path d="M 200 -10 Q 210 40 240 70 T 290 130" stroke="#D8D5CB" strokeWidth={2.5} fill="none" />
        <path d="M -10 30 Q 70 38 150 28 T 330 22" stroke="#D8D5CB" strokeWidth={2} fill="none" />
        <path d="M 60 110 Q 140 96 220 104 T 330 100" stroke="#D8D5CB" strokeWidth={2} fill="none" />

        {/* Route line current → destination */}
        {hasDestination && (
          <path
            d="M 60 78 Q 130 50 200 60 T 258 64"
            stroke="#1E6FB8"
            strokeWidth={2}
            strokeDasharray="4 3"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Current location marker */}
        <circle cx={60} cy={78} r={7} fill="#1D9E75" />
        <circle cx={60} cy={78} r={2.5} fill="#FFFFFF" />

        {/* Destination pin */}
        {hasDestination && (
          <g transform="translate(258 60)">
            <path
              d="M 0 14 L -6 2 A 7 7 0 1 1 6 2 Z"
              fill="#C8242C"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            <circle cx={0} cy={-2} r={2.5} fill="#FFFFFF" />
          </g>
        )}
      </svg>
    </div>
  );
}

export const StaticMapPreview = memo(StaticMapPreviewBase);
