import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Calendar, 
  Users, 
  Briefcase, 
  CreditCard, 
  Settings,
  LogOut,
  Receipt,
  Navigation,
  MapPin
} from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/instructor", label: "Dashboard", icon: Home },
  { href: "/instructor/schedule", label: "Schedule", icon: Calendar },
  { href: "/instructor/pupils", label: "Pupils", icon: Users },
  { href: "/instructor/jobs", label: "Jobs", icon: Briefcase },
  { href: "/instructor/pay", label: "Payments", icon: CreditCard },
  { href: "/instructor/expenses", label: "Expenses", icon: Receipt },
  { href: "/instructor/gaps", label: "Fill Gaps", icon: MapPin },
  { href: "/instructor/track-lesson", label: "Track Lesson", icon: Navigation },
  { href: "/instructor/settings", label: "Settings", icon: Settings },
];

interface InstructorPortalLayoutProps {
  children: ReactNode;
}

export function InstructorPortalLayout({ children }: InstructorPortalLayoutProps) {
  const { instructor, signOut, loading } = useInstructorAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Mobile Header - matches nav bar color */}
        <header className="sticky top-0 z-40 bg-nav border-b border-nav-foreground/10">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-nav-foreground/20">
                <AvatarImage src={instructor?.profile_image_url || undefined} />
                <AvatarFallback className="bg-nav-foreground text-nav text-xs font-semibold">
                  {instructor?.name?.charAt(0) || "I"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm text-nav-foreground">{instructor?.name || "Instructor"}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-nav-foreground hover:bg-nav-foreground/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="px-4 py-4">
          {children}
        </main>

        <InstructorBottomNav />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card fixed h-full">
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={instructor?.profile_image_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {instructor?.name?.charAt(0) || "I"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{instructor?.name || "Instructor"}</p>
                <p className="text-xs text-muted-foreground truncate">{instructor?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="container py-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
