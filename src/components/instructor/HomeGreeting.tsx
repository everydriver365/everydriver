import type { StatusSubtitleParts } from "@/lib/composeStatusSubtitle";

interface HomeGreetingProps {
  greeting: string;
  /** Legacy plain-string subtitle (kept for backwards compatibility). */
  statusSubtitle?: string;
  /** Preferred: structured subtitle so urgent fragment renders red. */
  statusParts?: StatusSubtitleParts;
}

const RED = "#C8434F";

export function HomeGreeting({ greeting, statusSubtitle, statusParts }: HomeGreetingProps) {
  return (
    <div style={{ padding: "6px 20px 0", marginBottom: 18 }}>
      <h1
        style={{
          fontSize: 30,
          fontWeight: 500,
          color: "#000000",
          letterSpacing: "-0.6px",
          lineHeight: 1.05,
          margin: "0 0 4px",
        }}
      >
        {greeting}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#000000",
          margin: 0,
        }}
      >
        {statusParts ? (
          <>
            {statusParts.calm}
            {statusParts.urgent && (
              <span style={{ color: RED, fontWeight: 500 }}>{statusParts.urgent}</span>
            )}
          </>
        ) : (
          statusSubtitle
        )}
      </p>
    </div>
  );
}
