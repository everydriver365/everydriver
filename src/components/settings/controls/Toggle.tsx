interface Props { value: boolean; onChange: (v: boolean) => void }

export function Toggle({ value, onChange }: Props) {
  return (
    <div
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        backgroundColor: value ? "#1A52A0" : "#DDE3ED",
        position: "relative", cursor: "pointer",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute", top: 3,
          left: value ? 21 : 3,
          width: 16, height: 16, borderRadius: 8,
          backgroundColor: "#FFF",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}
