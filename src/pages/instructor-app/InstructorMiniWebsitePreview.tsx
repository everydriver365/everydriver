import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Tablet, Monitor, ExternalLink, RefreshCw, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { cn } from "@/lib/utils";

type Device = "mobile" | "tablet" | "desktop";

const DEVICE_FRAMES: Record<Device, { label: string; icon: typeof Smartphone; width: number; height: number }> = {
  mobile: { label: "Mobile", icon: Smartphone, width: 390, height: 780 },
  tablet: { label: "Tablet", icon: Tablet, width: 820, height: 1100 },
  desktop: { label: "Desktop", icon: Monitor, width: 1280, height: 800 },
};

const PAGES = [
  { path: "", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/services", label: "Services" },
  { path: "/courses", label: "Courses" },
  { path: "/reviews", label: "Reviews" },
  { path: "/contact", label: "Contact" },
];

/**
 * Live preview of the instructor's mini-site, rendered in an iframe at
 * `/i/{app_slug}{page}` so the preview is always pixel-identical to
 * what pupils will see — no parallel mock layout to drift out of sync.
 */
export default function InstructorMiniWebsitePreview() {
  const { instructor, loading } = useInstructorAuth();
  const [device, setDevice] = useState<Device>("mobile");
  const [page, setPage] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);

  // Default to desktop on wider screens
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
      setDevice("desktop");
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!instructor?.app_slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="text-center max-w-sm space-y-3">
          <h1 className="text-xl font-semibold">No mini-site yet</h1>
          <p className="text-sm text-muted-foreground">
            Finish onboarding to generate your mini-site and a unique link.
          </p>
          <Button asChild>
            <Link to="/instructor-app/onboarding">Continue setup</Link>
          </Button>
        </div>
      </div>
    );
  }

  const slug = instructor.app_slug;
  const previewUrl = `/i/${slug}${page}?preview=1`;
  const liveUrl = `${window.location.origin}/i/${slug}${page}`;
  const frame = DEVICE_FRAMES[device];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/instructor/website">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>

          <div className="flex items-center gap-2 mr-auto">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold">Live preview</h1>
            <Badge variant="secondary" className="text-xs font-mono">
              {slug}.everydriver.co.uk
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <a href={liveUrl} target="_blank" rel="noopener noreferrer">
              Open live
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>

        {/* Page + device switcher */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {PAGES.map((p) => {
              const isActive = page === p.path;
              return (
                <button
                  key={p.path}
                  type="button"
                  onClick={() => setPage(p.path)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-1 bg-muted rounded-full p-1">
            {(Object.keys(DEVICE_FRAMES) as Device[]).map((d) => {
              const D = DEVICE_FRAMES[d];
              const isActive = device === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={D.label}
                >
                  <D.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{D.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Device frame */}
      <main className="flex-1 flex items-start justify-center p-4 sm:p-8 overflow-auto">
        <div
          className={cn(
            "bg-background shadow-2xl border border-border overflow-hidden transition-all duration-300",
            device === "mobile" && "rounded-[2.5rem] border-[10px] border-foreground/80",
            device === "tablet" && "rounded-[1.75rem] border-[10px] border-foreground/80",
            device === "desktop" && "rounded-xl"
          )}
          style={{
            width: `min(${frame.width}px, 100%)`,
            height: `min(${frame.height}px, calc(100vh - 200px))`,
          }}
        >
          <iframe
            key={`${reloadKey}-${page}`}
            src={previewUrl}
            title="Mini-site preview"
            className="w-full h-full border-0 bg-background"
            loading="lazy"
          />
        </div>
      </main>
    </div>
  );
}
