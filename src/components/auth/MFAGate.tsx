// 2FA has been disabled project-wide per product decision.
// This component is now a pass-through to avoid any MFA enforcement.
export function MFAGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
