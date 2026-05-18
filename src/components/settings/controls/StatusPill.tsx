interface Props {
  value: boolean;
  onLabel?: string;
  offLabel?: string;
}

export function StatusPill({ value, onLabel = "Active", offLabel = "Inactive" }: Props) {
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "3px 9px",
        backgroundColor: value ? "#E6F1FB" : "#F2F4F8",
        color: value ? "#0C3D7A" : "#9CA3AF",
      }}
    >
      {value ? onLabel : offLabel}
    </span>
  );
}
