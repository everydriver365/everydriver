import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { SettingsDirtyProvider } from "@/components/instructor/settings/SettingsDirtyContext";
import { SettingsSaveBar } from "@/components/instructor/settings/SettingsSaveBar";
import { AREA_GROUPS, useAreaSections, LEGACY_ID_MAP, ALL_ITEM_IDS, type AreaItem, type AreaGroup } from "./areas";

interface Props {
  instructorId: string;
}

/**
 * Desktop Settings shell — single sidebar (6 grouped areas) + detail pane
 * with a hero summary card and a stack of section cards. URL is
 * /instructor/settings/:itemId.
 */
export function SettingsShellV3({ instructorId: _ }: Props) {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId?: string }>();
  const [search, setSearch] = useState("");

  // Resolve current item — fall back through legacy map, then default to "profile".
  const requested = categoryId ?? "profile";
  const itemId = ALL_ITEM_IDS.has(requested)
    ? requested
    : (LEGACY_ID_MAP[requested] ?? "profile");

  const { activeItem, activeGroup } = useMemo<{ activeItem?: AreaItem; activeGroup?: AreaGroup }>(() => {
    for (const g of AREA_GROUPS) {
      const found = g.items.find(i => i.id === itemId);
      if (found) return { activeItem: found, activeGroup: g };
    }
    return {};
  }, [itemId]);

  // Keep the URL in sync with the resolved V3 id so the breadcrumb (and
  // sidebar active state) always reflects the real item/group.
  useEffect(() => {
    if (categoryId && categoryId !== itemId) {
      navigate(`/instructor/settings/${itemId}`, { replace: true });
    }
  }, [categoryId, itemId, navigate]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return AREA_GROUPS;
    return AREA_GROUPS
      .map(g => ({
        ...g,
        items: g.items.filter(i =>
          i.label.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q),
        ),
      }))
      .filter(g => g.items.length > 0);
  }, [search]);

  return (
    <SettingsDirtyProvider>
      <div
        className="instructor-portal flex w-full"
        style={{ background: "var(--d2-bg, #F4F7F6)", minHeight: "calc(100vh - 56px)" }}
      >
        {/* Sidebar */}
        <aside
          className="shrink-0 border-r"
          style={{
            width: 260,
            borderColor: "hsl(var(--border) / 0.5)",
            background: "var(--card, #fff)",
            position: "sticky",
            top: 56,
            alignSelf: "flex-start",
            maxHeight: "calc(100vh - 56px)",
            overflowY: "auto",
          }}
        >
          <div className="p-4">
            <h2 className="text-base font-semibold mb-3">Settings</h2>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search settings"
                className="w-full pl-8 pr-2 py-1.5 text-[13px] rounded-xl border bg-background focus:outline-none focus:ring-2"
                style={{ borderColor: "hsl(var(--border) / 0.6)" }}
              />
            </div>

            {filteredGroups.map(group => (
              <div key={group.id} className="mb-4">
                <div
                  className="px-2 mb-1.5"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  {group.label}
                </div>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeItem?.id === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => navigate(`/instructor/settings/${item.id}`)}
                          className="w-full flex items-center gap-2 text-left transition-colors"
                          style={{
                            padding: "7px 10px",
                            borderRadius: 12,
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? "#2B7BC8" : "hsl(var(--foreground))",
                            background: isActive ? "#2B7BC81A" : "transparent",
                            position: "relative",
                          }}
                        >
                          {isActive && (
                            <span
                              aria-hidden
                              style={{
                                position: "absolute",
                                left: 0, top: 6, bottom: 6, width: 3,
                                borderRadius: 999,
                                background: "#2B7BC8",
                              }}
                            />
                          )}
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Detail pane */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[880px] mx-auto px-0 sm:px-6 py-6 pb-24">
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="flex items-center flex-wrap gap-1 text-[13px] text-muted-foreground">
                <li>
                  <button
                    type="button"
                    onClick={() => { navigate("/instructor"); window.scrollTo({ top: 0 }); }}
                    className="hover:text-foreground hover:underline underline-offset-2 transition-colors"
                  >
                    Dashboard
                  </button>
                </li>
                <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
                <li>
                  <button
                    type="button"
                    onClick={() => { navigate("/instructor/settings/profile"); window.scrollTo({ top: 0 }); }}
                    className="hover:text-foreground hover:underline underline-offset-2 transition-colors"
                  >
                    Settings
                  </button>
                </li>
                {activeGroup && (
                  <>
                    <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          const first = activeGroup.items[0];
                          if (first) {
                            navigate(`/instructor/settings/${first.id}`);
                            window.scrollTo({ top: 0 });
                          }
                        }}
                        className="hover:text-foreground hover:underline underline-offset-2 transition-colors"
                      >
                        {activeGroup.label}
                      </button>
                    </li>
                  </>
                )}
                {activeItem && (
                  <>
                    <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
                    <li aria-current="page">
                      <button
                        type="button"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="text-foreground font-medium hover:underline underline-offset-2"
                      >
                        {activeItem.label}
                      </button>
                    </li>
                  </>
                )}
              </ol>
            </nav>

            {activeItem ? (
              <ItemDetail item={activeItem} />
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Settings page not found.
              </div>
            )}
          </div>
        </main>

        <SettingsSaveBar />
      </div>
    </SettingsDirtyProvider>
  );
}

function ItemDetail({ item }: { item: AreaItem }) {
  const sections = useAreaSections(item);
  const Icon = item.icon;

  return (
    <>
      {/* Hero summary card */}
      <section
        className="rounded-2xl border p-5 mb-4 bg-card"
        style={{ borderColor: "hsl(var(--border) / 0.5)" }}
      >
        <div className="flex items-start gap-4">
          <span
            className="inline-flex items-center justify-center rounded-2xl shrink-0"
            style={{
              width: 48, height: 48,
              backgroundColor: item.iconBg, color: item.iconColor,
            }}
          >
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold leading-tight truncate">{item.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
          </div>
        </div>
        {item.hero && <div className="mt-4">{item.hero()}</div>}
      </section>

      {/* Sections */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground"
               style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
            Nothing to configure here yet.
          </div>
        ) : sections.map(s => (
          <section
            key={s.id}
            id={s.id}
            className="rounded-2xl border bg-card p-5"
            style={{ borderColor: "hsl(var(--border) / 0.5)" }}
          >
            <header className="mb-3">
              <h2 className="text-[15px] font-semibold">{s.title}</h2>
              {s.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              )}
            </header>
            <div>{s.render()}</div>
          </section>
        ))}
      </div>
    </>
  );
}
