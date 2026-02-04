import { ReactNode } from "react";

interface DesktopSectionLayoutProps {
  title: string;
  children: ReactNode;
  columns?: 1 | 2;
}

export function DesktopSectionLayout({ 
  title, 
  children, 
  columns = 2 
}: DesktopSectionLayoutProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className={columns === 2 ? "grid gap-3 md:grid-cols-2" : "space-y-3"}>
        {children}
      </div>
    </div>
  );
}
