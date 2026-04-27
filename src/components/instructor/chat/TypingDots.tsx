/**
 * Premium-tile typing indicator: three dots in a white pill, staggered opacity pulse.
 */
export function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-end",
        gap: 6,
        marginTop: 4,
      }}
      aria-label="Typing"
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          padding: "8px 12px",
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#6E6E73",
              animation: `chat-typing-dot 1.5s infinite`,
              animationDelay: `${i * 0.2}s`,
              display: "inline-block",
              opacity: 0.3,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes chat-typing-dot {
        0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-2px); }
      }`}</style>
    </div>
  );
}
