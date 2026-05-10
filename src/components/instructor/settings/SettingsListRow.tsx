import { ReactNode } from "react";
import { IconChevronRight } from "@tabler/icons-react";

interface Props {
  icon: ReactNode;
  name: string;
  meta?: string;
  status?: ReactNode;
  onClick?: () => void;
  trailing?: ReactNode;
}

export function SettingsListRow({ icon, name, meta, status, onClick, trailing }: Props) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="sv2-row w-full text-left"
      style={{ background: "transparent", border: 0 }}
    >
      <span className="sv2-row-icon">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="sv2-row-name truncate block">{name}</span>
        {meta && <span className="sv2-row-meta truncate block">{meta}</span>}
      </span>
      {status}
      {trailing}
      {onClick && <IconChevronRight size={16} stroke={1.5} color="var(--color-text-tertiary)" />}
    </Tag>
  );
}
