import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Search, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH_KEY = "instructor-settings-sidebar-width";
const SIDEBAR_COLLAPSED_KEY = "instructor-settings-sidebar-collapsed";
const SIDEBAR_MIN = 160;
const SIDEBAR_MAX = 360;
const SIDEBAR_DEFAULT = 192;

export interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  sections: SettingsSectionDef[];
}

export interface SettingsSectionDef {
  id: string;
  title: string;
  description?: string;
  render: () => ReactNode;
  /** Hide this section if the predicate returns false. */
  visible?: boolean;
}

interface SettingsLayoutProps {
  categories: SettingsCategory[];
  search: string;
  onSearchChange: (v: string) => void;
}

/**
 * Two-pane Settings shell.
 *
 * Desktop (≥md): persistent left rail of categories + right pane content.
 * Mobile (<md): drill-down — index shows category list, /:categoryId shows that
 * category's sections with a back chevron.
 */
export function SettingsLayout({ categories, search, onSearchChange }: SettingsLayoutProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId?: string }>();

  const lower = search.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!lower) return categories;
    return categories
      .map((cat) => {
        const sections = cat.sections.filter(
          (s) =>
            s.title.toLowerCase().includes(lower) ||
            (s.description?.toLowerCase().includes(lower) ?? false) ||
            cat.title.toLowerCase().includes(lower),
        );
        return { ...cat, sections };
      })
      .filter((c) => c.sections.length > 0);
  }, [categories, lower]);

  const activeCategory =
    filteredCategories.find((c) => c.id === categoryId) ?? filteredCategories[0];

  // Desktop sidebar state — declared unconditionally to satisfy rules of hooks.
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === "undefined") return SIDEBAR_DEFAULT;
    const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return stored >= SIDEBAR_MIN && stored <= SIDEBAR_MAX ? stored : SIDEBAR_DEFAULT;
  });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  });
  const draggingRef = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX - 16));
      setSidebarWidth(next);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
      } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [sidebarWidth]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  // ── MOBILE: drill-down ─────────────────────────────────────────────
  if (isMobile) {
    if (!categoryId) {
      return (
        <div className="space-y-4 pb-24">
          <SearchBar value={search} onChange={onSearchChange} />
          <CategoryList
            categories={filteredCategories}
            onSelect={(id) => navigate(`/instructor/settings/${id}`)}
          />
        </div>
      );
    }

    if (!activeCategory) {
      return (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Settings category not found.
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-24">
        <button
          type="button"
          onClick={() => navigate("/instructor/settings")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Settings
        </button>
        <CategoryHeader category={activeCategory} />
        <SectionsPane sections={activeCategory.sections} />
      </div>
    );
  }

  return (
    <div className="flex gap-0 pb-12 relative">
      {!collapsed && (
        <>
          <aside className="shrink-0" style={{ width: sidebarWidth }}>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <SearchBar value={search} onChange={onSearchChange} />
              </div>
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <CategoryList
                categories={filteredCategories}
                activeId={activeCategory?.id}
                onSelect={(id) => navigate(`/instructor/settings/${id}`)}
                compact
              />
            </div>
          </aside>
          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={startDrag}
            onDoubleClick={() => {
              setSidebarWidth(SIDEBAR_DEFAULT);
              try { window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(SIDEBAR_DEFAULT)); } catch {}
            }}
            title="Drag to resize · double-click to reset"
            className="mx-2 w-1.5 cursor-col-resize rounded-full bg-transparent hover:bg-border/80 active:bg-border transition-colors"
          />
        </>
      )}
      {collapsed && (
        <button
          type="button"
          onClick={toggleCollapsed}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          className="shrink-0 mr-3 inline-flex items-center justify-center h-10 w-10 rounded-xl bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors self-start"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}
      <main className="flex-1 min-w-0">
        {activeCategory ? (
          <div className="space-y-4">
            <CategoryHeader category={activeCategory} />
            <SectionsPane sections={activeCategory.sections} />
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No matching settings.
          </div>
        )}
      </main>
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search settings"
        className="pl-9 h-10 rounded-xl bg-card"
      />
    </div>
  );
}

function CategoryList({
  categories,
  activeId,
  onSelect,
  compact,
}: {
  categories: SettingsCategory[];
  activeId?: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card overflow-hidden border border-border/50">
      {categories.map((cat, idx) => {
        const Icon = cat.icon;
        const isActive = activeId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              "w-full flex items-center gap-3 text-left transition-colors",
              compact ? "px-3 py-2.5" : "px-4 py-3.5",
              idx > 0 && "border-t border-border/40",
              isActive ? "bg-accent" : "hover:bg-accent/50",
            )}
          >
            <span
              className="inline-flex items-center justify-center rounded-xl shrink-0"
              style={{
                width: 36,
                height: 36,
                backgroundColor: cat.iconBg,
                color: cat.iconColor,
              }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-medium text-foreground truncate">
                {cat.title}
              </span>
              {!compact && (
                <span className="block text-xs text-muted-foreground truncate">
                  {cat.description}
                </span>
              )}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

function CategoryHeader({ category }: { category: SettingsCategory }) {
  const Icon = category.icon;
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex items-center justify-center rounded-xl shrink-0"
        style={{ width: 40, height: 40, backgroundColor: category.iconBg, color: category.iconColor }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-foreground leading-tight truncate">
          {category.title}
        </h1>
        <p className="text-sm text-muted-foreground truncate">{category.description}</p>
      </div>
    </div>
  );
}

function SectionsPane({ sections }: { sections: SettingsSectionDef[] }) {
  const visible = sections.filter((s) => s.visible !== false);
  if (visible.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Nothing here yet.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {visible.map((s) => (
        <section
          key={s.id}
          id={s.id}
          className="rounded-2xl bg-card border border-border/50 p-4 sm:p-5"
        >
          <header className="mb-3">
            <h2 className="text-base font-semibold text-foreground">{s.title}</h2>
            {s.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
            )}
          </header>
          <div>{s.render()}</div>
        </section>
      ))}
    </div>
  );
}
