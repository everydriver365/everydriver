import { ReactNode } from "react";

interface ParentLayoutProps {
  children: ReactNode;
}

/**
 * Wrapper layout for the Parent portal.
 * The ParentPortal component already manages its own bottom nav and header,
 * so this is a lightweight shell for future expansion (e.g. shared header).
 */
export function ParentLayout({ children }: ParentLayoutProps) {
  return <>{children}</>;
}
