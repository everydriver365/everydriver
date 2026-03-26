import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  name: string;
  type: "pupil" | "instructor" | "page" | "lesson";
  subtitle?: string;
  href?: string;
}

interface HeaderSearchBoxProps {
  variant: "instructor" | "admin";
  instructorId?: string;
}

export function HeaderSearchBox({ variant, instructorId }: HeaderSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Live search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const items: SearchResult[] = [];
      const lowerQ = query.toLowerCase();

      if (variant === "instructor" && instructorId) {
        // Search pupils
        const { data: pupils } = await supabase
          .from("pupils")
          .select("id, name, lessons_completed, progress")
          .eq("instructor_id", instructorId)
          .ilike("name", `%${query}%`)
          .limit(6);

        if (pupils) {
          items.push(
            ...pupils.map((p) => ({
              id: p.id,
              name: p.name,
              type: "pupil" as const,
              subtitle: `${p.lessons_completed || 0} lessons · ${p.progress || 0}%`,
            }))
          );
        }

        // Search scheduled lessons by pupil name
        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, pupil:pupils!inner(name)")
          .eq("instructor_id", instructorId)
          .ilike("pupils.name", `%${query}%`)
          .gte("lesson_date", new Date().toISOString().split("T")[0])
          .order("lesson_date", { ascending: true })
          .limit(4);

        if (lessons) {
          items.push(
            ...lessons.map((l: any) => ({
              id: l.id,
              name: `Lesson: ${l.pupil?.name || "Unknown"}`,
              type: "lesson" as const,
              subtitle: `${l.lesson_date} at ${l.start_time || "TBC"}`,
              href: "/instructor/schedule",
            }))
          );
        }

        // Search pages / nav
        const instructorPages = [
          { label: "Dashboard", href: "/instructor" },
          { label: "Schedule", href: "/instructor/schedule" },
          { label: "Availability", href: "/instructor/availability" },
          { label: "Pending Scheduling", href: "/instructor/pending-scheduling" },
          { label: "Pupils", href: "/instructor/pupils" },
          { label: "Test Results", href: "/instructor/test-results" },
          { label: "Jobs", href: "/instructor/jobs" },
          { label: "Payments", href: "/instructor/pay" },
          { label: "Accounts", href: "/instructor/accounts" },
          { label: "Expenses", href: "/instructor/expenses" },
          { label: "Fill Gaps", href: "/instructor/gaps" },
          { label: "Saved Routes", href: "/instructor/routes" },
          { label: "Messages", href: "/instructor/messages" },
          { label: "Contact Admin", href: "/instructor/admin-chat" },
          { label: "Visitor Chats", href: "/instructor/visitor-chats" },
          { label: "Mini Website", href: "/instructor/website" },
          { label: "Domains", href: "/instructor/domains" },
          { label: "GPS Tracking", href: "/instructor/tracking" },
          { label: "Settings", href: "/instructor/settings" },
          { label: "Settings — Profile", href: "/instructor/settings" },
          { label: "Settings — Notifications", href: "/instructor/settings" },
          { label: "Settings — Appearance", href: "/instructor/settings" },
          { label: "Settings — Layout Style", href: "/instructor/settings" },
          { label: "Settings — Branding", href: "/instructor/settings" },
          { label: "Settings — Payment Setup", href: "/instructor/settings" },
          { label: "Settings — Availability", href: "/instructor/settings" },
          { label: "Settings — Calendar Sync", href: "/instructor/settings" },
          { label: "Settings — GPS & Tracking", href: "/instructor/settings" },
          { label: "Settings — Integrations", href: "/instructor/settings" },
        ];
        const matchedPages = instructorPages.filter((p) =>
          p.label.toLowerCase().includes(lowerQ)
        );
        items.push(
          ...matchedPages.map((p) => ({
            id: p.href,
            name: p.label,
            type: "page" as const,
            subtitle: "Page",
            href: p.href,
          }))
        );
      }

      if (variant === "admin") {
        const { data: instructors } = await supabase
          .from("instructors")
          .select("id, name, email")
          .ilike("name", `%${query}%`)
          .limit(8);

        if (instructors) {
          items.push(
            ...instructors.map((i) => ({
              id: i.id,
              name: i.name || "Unnamed",
              type: "instructor" as const,
              subtitle: i.email || "",
            }))
          );
        }

        // Admin pages & settings
        const adminPages = [
          { label: "Overview", section: "overview" },
          { label: "Live Map", section: "live-map" },
          { label: "Analytics", section: "analytics" },
          { label: "Commission", section: "commission" },
          { label: "Leaderboard", section: "leaderboard" },
          { label: "Email Inbox", section: "email" },
          { label: "Enquiries & Callbacks", section: "enquiries" },
          { label: "Instructor Support", section: "instructor-messages" },
          { label: "Visitor Chats", section: "live-chat" },
          { label: "Campaigns", section: "campaigns" },
          { label: "Instructors", section: "instructors" },
          { label: "Pupil Records", section: "pupil-records" },
          { label: "Compliance", section: "compliance" },
          { label: "Subscribers", section: "subscribers" },
          { label: "Courses", section: "courses" },
          { label: "All Bookings", section: "bookings" },
          { label: "Payments", section: "payments" },
          { label: "Upsells", section: "upsells" },
          { label: "Discount Codes", section: "discount-codes" },
          { label: "Site Settings", section: "site-settings" },
          { label: "Settings — Site Settings", section: "site-settings" },
          { label: "Settings — PWA Config", section: "pwa-apps" },
          { label: "Settings — Activity Log", section: "activity-log" },
          { label: "Settings — Notes", section: "admin-notes" },
          { label: "PWA Config", section: "pwa-apps" },
          { label: "Activity Log", section: "activity-log" },
          { label: "Notes", section: "admin-notes" },
        ];
        const matchedAdminPages = adminPages.filter((p) =>
          p.label.toLowerCase().includes(lowerQ)
        );
        items.push(
          ...matchedAdminPages.map((p) => ({
            id: `admin-${p.section}`,
            name: p.label,
            type: "page" as const,
            subtitle: "Admin Page",
            href: `/admin?section=${p.section}`,
          }))
        );
      }

      setResults(items);
      setOpen(items.length > 0 || query.length >= 2);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, variant, instructorId]);

  const handleSelect = (item: SearchResult) => {
    if (item.href) {
      navigate(item.href);
    } else if (item.type === "pupil") {
      navigate(`/instructor/pupils?pupil=${item.id}`);
    } else if (item.type === "instructor") {
      navigate(`/admin?section=instructors&id=${item.id}`);
    }
    setQuery("");
    setOpen(false);
  };

  const handleSearchClick = () => {
    if (variant === "instructor") {
      navigate("/instructor/pupils");
    } else {
      navigate("/admin?section=instructors");
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-56 rounded-lg border-0 bg-white text-black placeholder:text-black/50 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black text-xs transition-colors"
          >
            ✕
          </button>
        )}
      </div>
      <Button
        size="sm"
        onClick={handleSearchClick}
        className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
      >
        <Search className="h-3.5 w-3.5" />
        Search
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-80 bg-popover border border-border rounded-xl shadow-xl z-[100] max-h-72 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">Searching...</div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-1 p-4">
              <Search className="h-5 w-5 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          ) : (
            <div className="p-1">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                    {item.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate text-popover-foreground">{item.name}</div>
                    {item.subtitle && (
                      <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                    )}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
