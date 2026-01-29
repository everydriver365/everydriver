import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Users,
  Calendar,
  CreditCard,
  Settings,
  Home,
  Search,
  FileText,
  Bell,
  Wallet,
  Car,
  MapPin,
  UserPlus,
  Send,
  QrCode,
  Globe,
  BarChart3,
  CalendarDays,
  Navigation,
  Receipt,
  HelpCircle,
  BriefcaseBusiness,
} from "lucide-react";

interface CommandAction {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  group: "navigation" | "actions" | "settings";
  keywords?: string[];
}

interface CommandPaletteProps {
  variant?: "instructor" | "admin";
}

export function CommandPalette({ variant = "instructor" }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Load recent actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`recentActions_${variant}`);
    if (stored) {
      setRecentActions(JSON.parse(stored));
    }
  }, [variant]);

  const recordAction = useCallback((id: string) => {
    setRecentActions(prev => {
      const updated = [id, ...prev.filter(a => a !== id)].slice(0, 5);
      localStorage.setItem(`recentActions_${variant}`, JSON.stringify(updated));
      return updated;
    });
  }, [variant]);

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const instructorActions: CommandAction[] = useMemo(() => [
    // Navigation
    { id: "home", label: "Dashboard", icon: Home, action: () => navigate("/instructor"), group: "navigation", keywords: ["home", "main"] },
    { id: "schedule", label: "Schedule", icon: CalendarDays, action: () => navigate("/instructor/schedule"), group: "navigation", keywords: ["calendar", "lessons", "appointments"] },
    { id: "pupils", label: "All Pupils", icon: Users, action: () => navigate("/instructor/pupils"), group: "navigation", keywords: ["students", "learners"] },
    { id: "diary", label: "Diary", icon: Calendar, action: () => navigate("/instructor/diary"), group: "navigation", keywords: ["calendar", "planner"] },
    { id: "pay", label: "Payments", icon: Wallet, action: () => navigate("/instructor/pay"), group: "navigation", keywords: ["money", "balance"] },
    { id: "expenses", label: "Expenses", icon: Receipt, action: () => navigate("/instructor/expenses"), group: "navigation", keywords: ["costs", "spending"] },
    { id: "gaps", label: "Find Gaps", icon: Search, action: () => navigate("/instructor/gaps"), group: "navigation", keywords: ["availability", "empty", "slots"] },
    { id: "jobs", label: "Job Offers", icon: BriefcaseBusiness, action: () => navigate("/instructor/jobs"), group: "navigation", keywords: ["work", "opportunities"] },
    { id: "live-tracking", label: "Live Tracking", icon: Navigation, action: () => navigate("/instructor/traccar"), group: "navigation", keywords: ["gps", "driving", "route", "traccar", "track", "lesson", "pupils", "map", "realtime", "monitor"] },
    { id: "performance", label: "Performance", icon: BarChart3, action: () => navigate("/instructor/performance"), group: "navigation", keywords: ["stats", "analytics", "metrics"] },
    { id: "settings", label: "Settings", icon: Settings, action: () => navigate("/instructor/settings"), group: "navigation" },
    
    // Quick Actions
    { id: "add-pupil", label: "Add New Pupil", icon: UserPlus, action: () => navigate("/instructor/pupils?action=add"), group: "actions", shortcut: "⌘P", keywords: ["create", "new", "student"] },
    { id: "take-payment", label: "Take Payment", icon: CreditCard, action: () => navigate("/instructor/pay?action=take"), group: "actions", shortcut: "⌘$", keywords: ["charge", "collect"] },
    { id: "send-reminder", label: "Send Payment Reminder", icon: Send, action: () => navigate("/instructor/pay?action=reminder"), group: "actions", keywords: ["sms", "message", "notify"] },
    { id: "show-qr", label: "Show Payment QR", icon: QrCode, action: () => navigate("/instructor/pay?action=qr"), group: "actions", keywords: ["scan", "code"] },
    { id: "my-website", label: "My Website", icon: Globe, action: () => navigate("/instructor/settings?tab=website"), group: "actions", keywords: ["site", "page", "profile"] },
    { id: "vehicle", label: "Vehicle Health", icon: Car, action: () => navigate("/instructor/settings?tab=vehicle"), group: "actions", keywords: ["car", "mileage", "service"] },
    
    // Settings
    { id: "notifications", label: "Notifications", icon: Bell, action: () => navigate("/instructor/settings?tab=notifications"), group: "settings" },
    { id: "help", label: "Help & Support", icon: HelpCircle, action: () => navigate("/instructor/settings?tab=help"), group: "settings" },
  ], [navigate]);

  const adminActions: CommandAction[] = useMemo(() => [
    { id: "overview", label: "Dashboard", icon: Home, action: () => navigate("/admin"), group: "navigation" },
    { id: "instructors", label: "Manage Instructors", icon: Users, action: () => navigate("/admin?section=instructors"), group: "navigation" },
    { id: "courses", label: "Course Templates", icon: FileText, action: () => navigate("/admin?section=courses"), group: "navigation" },
    { id: "hero", label: "Hero Section", icon: Globe, action: () => navigate("/admin?section=hero"), group: "navigation" },
    { id: "settings", label: "Site Settings", icon: Settings, action: () => navigate("/admin?section=site-settings"), group: "navigation" },
    
    { id: "add-instructor", label: "Add Instructor", icon: UserPlus, action: () => navigate("/admin?section=instructors&action=add"), group: "actions" },
  ], [navigate]);

  const actions = variant === "instructor" ? instructorActions : adminActions;

  const handleSelect = (action: CommandAction) => {
    recordAction(action.id);
    action.action();
    setOpen(false);
  };

  const recentItems = actions.filter(a => recentActions.includes(a.id));
  const navigationItems = actions.filter(a => a.group === "navigation");
  const actionItems = actions.filter(a => a.group === "actions");
  const settingsItems = actions.filter(a => a.group === "settings");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {recentItems.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentItems.map(action => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                  className="flex items-center gap-2"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                      {action.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigation">
          {navigationItems.map(action => (
            <CommandItem
              key={action.id}
              onSelect={() => handleSelect(action)}
              className="flex items-center gap-2"
            >
              <action.icon className="h-4 w-4 text-muted-foreground" />
              <span>{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {actionItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              {actionItems.map(action => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                  className="flex items-center gap-2"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                      {action.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {settingsItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              {settingsItems.map(action => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                  className="flex items-center gap-2"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{action.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
