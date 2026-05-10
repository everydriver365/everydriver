import { IconCircleCheck, IconAlertTriangle, IconAlertCircle } from "@tabler/icons-react";

type Variant = "success" | "warning" | "danger";

const ICON: Record<Variant, typeof IconCircleCheck> = {
  success: IconCircleCheck,
  warning: IconAlertTriangle,
  danger: IconAlertCircle,
};

export function StatusPill({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  const Icon = ICON[variant];
  return (
    <span className={`sv2-pill ${variant}`}>
      <Icon size={11} stroke={1.75} />
      {children}
    </span>
  );
}
