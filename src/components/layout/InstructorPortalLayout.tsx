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
  MapPin,
  ArrowLeft,
  Eye,
  EyeOff,
  Moon,
  Sun
} from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/CommandPalette";
import logoDark from "@/assets/logo-instructor-dark.png";

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
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

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

  // Check if on main dashboard (don't show back button)
  const showBackButton = location.pathname !== "/instructor";

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Mobile Header - matches nav bar color with logo */}
        <header className="sticky top-0 z-40 bg-nav border-b border-nav-foreground/10">
          <div className="flex items-center justify-between px-4 h-14">
            {/* Left: Back button + Logo */}
            <div className="flex items-center gap-2">
              {showBackButton && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/instructor")}
                  className="text-nav-foreground hover:bg-nav-foreground/10 -ml-2 h-8 w-8"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <img 
                src={logoDark} 
                alt="Logo" 
                className="h-7 object-contain"
              />
            </div>
            
            {/* Right: Theme, Settings, Visibility, Avatar */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-nav-foreground hover:bg-nav-foreground/10 h-8 w-8"
              >
                {resolvedTheme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/instructor/settings")}
                className="text-nav-foreground hover:bg-nav-foreground/10 h-8 w-8"
              >
                <Settings className="h-5 w-5" />
              </Button>
              {instructor?.is_active !== undefined && (
                <Badge 
                  variant="secondary" 
                  className={`gap-1 text-xs ${instructor.is_active ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"}`}
                >
                  {instructor.is_active ? (
                    <>
                      <Eye className="h-3 w-3" />
                      <span className="hidden xs:inline">Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      <span className="hidden xs:inline">Hidden</span>
                    </>
                  )}
                </Badge>
              )}
              <Avatar className="h-9 w-9 border-2 border-nav-foreground/30">
                <AvatarImage src={instructor?.profile_image_url || undefined} />
                <AvatarFallback className="bg-nav-foreground text-nav text-xs font-semibold">
                  {instructor?.name?.charAt(0) || "I"}
                </AvatarFallback>
              </Avatar>
            </div>
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
    <>
      <CommandPalette variant="instructor" />
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
    </>
  );
}
