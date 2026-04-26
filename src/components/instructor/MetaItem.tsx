import { LucideIcon } from "lucide-react";

interface MetaItemProps {
  icon: LucideIcon;
  label: string;
  urgent?: boolean;
}

export function MetaItem({ icon: Icon, label, urgent = false }: MetaItemProps) {
  const colour = urgent ? "#C8434F" : "#6E6E73";
  return (
    <div className="flex items-center" style={{ gap: 5, flexShrink: 0 }}>
      <Icon size={13} strokeWidth={1.8} color={colour} />
      <span style={{ fontSize: 12, color: colour, lineHeight: 1.2 }}>{label}</span>
    </div>
  );
}

export function MetaBullet() {
  return (
    <span
      aria-hidden
      style={{
        width: 3,
        height: 3,
        borderRadius: "50%",
        backgroundColor: "#C7C7CC",
        flexShrink: 0,
      }}
    />
  );
}
