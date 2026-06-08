import { useMemo, useState, KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Search, ArrowLeft } from "lucide-react";
import { SettingsDirtyProvider } from "@/components/instructor/settings/SettingsDirtyContext";
import { SettingsSaveBar } from "@/components/instructor/settings/SettingsSaveBar";
import { AREA_GROUPS, useAreaSections, LEGACY_ID_MAP, ALL_ITEM_IDS, type AreaItem, type AreaGroup } from "./areas";

interface Props {
  instructorId: string;
}

/**
 * Desktop Settings — single centered column.
 * - No inner sidebar (kills the dual-rail "messy" layout).
 * - /instructor/settings           → grid landing with search.
 * - /instructor/settings/:itemId   → breadcrumb + back link + ItemDetail.
 */
export function SettingsShellV3({ instructorId: _ }: Props) {
  const { categoryId } = useParams<{ categoryId?: string }>();

  const resolvedId = categoryId
    ? (ALL_ITEM_IDS.has(categoryId) ? categoryId : LEGACY_ID_MAP[categoryId])
    : undefined;

  const { activeItem, activeGroup } = useMemo<{ activeItem?: AreaItem; activeGroup?: AreaGroup }>(() => {
    if (!resolvedId) return {};
    for (const g of AREA_GROUPS) {
      const found = g.items.find(i => i.id === resolvedId);
      if (found) return { activeItem: found, activeGroup: g };
    }
    return {};
  }, [resolvedId]);

  return (
    <SettingsDirtyProvider>
      <div
        className="instructor-portal w-full"
        style={{ background: "var(--d2-bg, #F4F7F6)", minHeight: "calc(100vh - 56px)" }}
      >
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 pb-24">
          {activeItem ? (
            <DetailView item={activeItem} group={activeGroup} />
          ) : (
            <SettingsLanding />
          )}
        </div>
        <SettingsSaveBar />
      </div>
    </SettingsDirtyProvider>
  );
}

/* ---------- Landing ---------- */

function SettingsLanding() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return AREA_GROUPS;
    return AREA_GROUPS
      .map(g => ({
        ...g,
        items: g.items.filter(i =>
          i.label.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.title ?? "").toLowerCase().includes(q),
        ),
      }))
      .filter(g => g.items.length > 0);
  }, [search]);

  const flatMatches = useMemo(
    () => filteredGroups.flatMap(g => g.items),
    [filteredGroups],
  );

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && flatMatches.length === 1) {
      navigate(`/instructor/settings/${flatMatches[0].id}`);
    }
  };

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold leading-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, teaching setup, payments, communication and more.
        </p>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Search settings"
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-[#2D3FE7]/30"
          style={{ borderColor: "hsl(var(--border) / 0.6)" }}
        />
      </div>

      {filteredGroups.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground"
             style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
          No settings match "{search}".
        </div>
      ) : (
        <div className="space-y-7">
          {filteredGroups.map(group => (
            <section key={group.id}>
              <div
                className="px-1 mb-2"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {group.label}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/instructor/settings/${item.id}`)}
                      className="group text-left rounded-2xl border bg-card p-4 transition-all hover:shadow-sm hover:-translate-y-px"
                      style={{ borderColor: "hsl(var(--border) / 0.5)" }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="inline-flex items-center justify-center rounded-xl shrink-0"
                          style={{
                            width: 36, height: 36,
                            backgroundColor: item.iconBg, color: item.iconColor,
                          }}
                        >
                          <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold truncate">{item.label}</div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- Detail ---------- */

function DetailView({ item, group }: { item: AreaItem; group?: AreaGroup }) {
  const navigate = useNavigate();

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center flex-wrap gap-1 text-[13px] text-muted-foreground">
          <li>
            <button
              type="button"
              onClick={() => navigate("/instructor/settings")}
              aria-label="Back to all settings"
              className="inline-flex items-center gap-1 -ml-1 px-1.5 py-0.5 rounded-md hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Settings</span>
            </button>
          </li>
          {group && (
            <>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li>{group.label}</li>
            </>
          )}
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li aria-current="page" className="text-foreground font-medium">{item.label}</li>
        </ol>
      </nav>

      <ItemDetail item={item} />
    </>
  );
}

function ItemDetail({ item }: { item: AreaItem }) {
  const sections = useAreaSections(item);
  const Icon = item.icon;

  return (
    <>
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
