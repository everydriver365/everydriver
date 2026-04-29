interface HomeGreetingProps {
  greeting: string;
  statusSubtitle: string;
}

export function HomeGreeting({ greeting, statusSubtitle }: HomeGreetingProps) {
  return (
    <div style={{ padding: "6px 20px 0", marginBottom: 14 }}>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 500,
          color: "#000000",
          letterSpacing: "-0.5px",
          lineHeight: 1.1,
          margin: "0 0 4px",
        }}
      >
        {greeting}
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "#6E6E73",
          margin: 0,
        }}
      >
        {statusSubtitle}
      </p>
    </div>
  );
}
