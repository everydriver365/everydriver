import { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  sectionTitle: string;
  groupTitle: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

export function AdminLayout({
  children,
  sectionTitle,
  groupTitle,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>{groupTitle}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{sectionTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
