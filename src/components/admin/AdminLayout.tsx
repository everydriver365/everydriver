import { ReactNode } from "react";
import { 
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { HeaderSearchBox } from "@/components/HeaderSearchBox";

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  sectionTitle: string;
  groupTitle: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  tabCounts?: Record<string, number>;
}

export function AdminLayout({
  children,
  activeSection,
  sectionTitle,
  groupTitle,
  onSectionChange,
  onLogout,
  tabCounts = {},
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Navy Blue Header - Utility bar only */}
      <header className="sticky top-0 z-50 bg-[#142040]">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/everydriver-logo-v2.png" 
              alt="EveryDriver" 
              className="h-8"
            />
            <HeaderSearchBox variant="admin" />
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-gradient-to-r from-primary/[0.03] to-transparent px-6 py-2.5">
        <nav className="flex items-center text-sm text-muted-foreground">
          <button 
            onClick={() => onSectionChange("overview")}
            className="hover:text-foreground transition-colors"
          >
            Admin
          </button>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-muted-foreground">{groupTitle}</span>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-foreground font-medium">{sectionTitle}</span>
        </nav>
      </div>

      <main className="flex-1 p-6">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
