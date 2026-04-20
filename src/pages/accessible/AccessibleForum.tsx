import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import { Search, Pin, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Pillar = "purple" | "teal" | "blue" | "amber" | "pink" | "green" | "coral";

interface Topic {
  id: string;
  title: string;
  body: string;
  category: string;
  author_name: string;
  reply_count: number;
  last_reply_at: string | null;
  created_at: string;
  is_pinned: boolean;
}

// Spec categories (display order)
const CATEGORIES: { key: string; label: string; pillar: Pillar }[] = [
  { key: "all", label: "All topics", pillar: "purple" },
  { key: "adaptations", label: "Adaptations", pillar: "blue" },
  { key: "motability", label: "Motability", pillar: "pink" },
  { key: "dvla", label: "DVLA & licensing", pillar: "purple" },
  { key: "insurance", label: "Insurance", pillar: "teal" },
  { key: "learning", label: "Learning to drive", pillar: "coral" },
  { key: "wins", label: "Wins", pillar: "green" },
  { key: "meetups", label: "Meetups & events", pillar: "amber" },
];

// Map legacy DB values into the new category set
const CATEGORY_ALIASES: Record<string, string> = {
  general: "meetups",
  tests: "learning",
  vehicles: "adaptations",
};

const normaliseCategory = (c: string) => CATEGORY_ALIASES[c] || c;

const findCat = (key: string) =>
  CATEGORIES.find((c) => c.key === normaliseCategory(key)) || CATEGORIES[CATEGORIES.length - 1];

const PILLAR_COLOURS: Record<Pillar, { tint: string; dark: string; base: string }> = {
  purple: { tint: "#EEEDFE", dark: "#26215C", base: "#3C3489" },
  teal:   { tint: "#E1F5EE", dark: "#04342C", base: "#0F6E56" },
  blue:   { tint: "#E6F1FB", dark: "#042C53", base: "#185FA5" },
  amber:  { tint: "#FAEEDA", dark: "#412402", base: "#854F0B" },
  pink:   { tint: "#FBEAF0", dark: "#4B1528", base: "#993556" },
  green:  { tint: "#EAF3DE", dark: "#173404", base: "#3B6D11" },
  coral:  { tint: "#FAECE7", dark: "#4A1B0C", base: "#993C1D" },
};

const AVATAR_PILLARS: Pillar[] = ["purple", "teal", "blue", "pink", "amber", "coral", "green"];
const avatarFor = (name: string) => {
  const sum = [...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PILLARS[Math.abs(sum) % AVATAR_PILLARS.length];
};
const initials = (name: string) =>
  (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const relTime = (iso: string) => {
  const d = new Date(iso);
  const days = (Date.now() - d.getTime()) / 86400000;
  if (days < 7) return formatDistanceToNow(d, { addSuffix: false }).replace(/^about /, "") + " ago";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export default function AccessibleForum() {
  const [params, setParams] = useSearchParams();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const activeKey = params.get("category") || "all";

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("accessible_forum_topics")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("last_reply_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      setTopics((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let out = topics;
    if (activeKey !== "all") out = out.filter((t) => normaliseCategory(t.category) === activeKey);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((t) => `${t.title} ${t.body} ${t.author_name}`.toLowerCase().includes(q));
    }
    return out;
  }, [topics, activeKey, query]);

  const setCat = (k: string) => {
    const next = new URLSearchParams(params);
    if (k === "all") next.delete("category");
    else next.set("category", k);
    setParams(next, { replace: true });
  };

  return (
    <AccessibleLayout>
      <SEOHead title="Community — Open Road" description="Open Road forum: real advice from disabled drivers, learners and families." />

      <div className="or-forum">
        <ForumStyles />

        <main className="or-container" id="main">
          {/* Header */}
          <div className="or-fhead">
            <div>
              <h1 className="or-h1">Community</h1>
              <p className="or-sub">Real advice from drivers who get it.</p>
            </div>
            <Link to="/accessible/forum/new" className="or-btn or-btn-teal or-fhead-cta">
              <Plus size={16} aria-hidden="true" /> New post
            </Link>
          </div>

          {/* Search */}
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="or-search"
          >
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search posts, topics, people…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search community"
            />
          </form>

          {/* Category chips */}
          <nav className="or-chips" aria-label="Filter by category">
            {CATEGORIES.map((c) => {
              const active = activeKey === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  className={`or-chip ${active ? "or-chip--active" : ""}`}
                  onClick={() => setCat(c.key)}
                  aria-pressed={active}
                >
                  {c.label}
                </button>
              );
            })}
          </nav>

          {/* Pinned guideline notice */}
          <Link to="/accessible/forum?category=all" className="or-pinned" aria-label="Community guidelines">
            <Pin size={14} aria-hidden="true" />
            <div>
              <div className="or-pinned-t1">Pinned · Community guidelines</div>
              <div className="or-pinned-t2">A safe, kind space. Read before posting.</div>
            </div>
          </Link>

          {/* Thread list */}
          {loading ? (
            <ul className="or-thread-list" aria-busy="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="or-thread-row">
                  <div className="or-skel-avatar" />
                  <div style={{ flex: 1 }}>
                    <div className="or-skel-line" style={{ width: "60%", height: 12 }} />
                    <div className="or-skel-line" style={{ width: "85%", height: 14, marginTop: 8 }} />
                    <div className="or-skel-line" style={{ width: "40%", height: 11, marginTop: 8 }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="or-empty">
              {query ? (
                <>No posts match “{query}”. Try fewer words or a different category.</>
              ) : (
                <>
                  No threads in this category yet. Be the first —{" "}
                  <Link to="/accessible/forum/new" className="or-link-teal">+ Start a post</Link>.
                </>
              )}
            </div>
          ) : (
            <ul className="or-thread-list">
              {filtered.map((t) => {
                const cat = findCat(t.category);
                const colours = PILLAR_COLOURS[cat.pillar];
                const avatar = PILLAR_COLOURS[avatarFor(t.author_name)];
                return (
                  <li key={t.id}>
                    <Link to={`/accessible/forum/${t.id}`} className="or-thread-row">
                      <div
                        className="or-avatar"
                        style={{ background: avatar.tint, color: avatar.dark }}
                        aria-hidden="true"
                      >
                        {initials(t.author_name)}
                      </div>
                      <div className="or-thread-main">
                        <span
                          className="or-cat-chip"
                          style={{ background: colours.tint, color: colours.dark }}
                        >
                          {t.is_pinned && cat.key === "wins" ? "✨ Celebrated" : cat.label}
                        </span>
                        <h3 className="or-thread-title">{t.title}</h3>
                        <div className="or-thread-meta">
                          <span>{t.author_name}</span>
                          <span className="or-dot">·</span>
                          <span>{t.reply_count} {t.reply_count === 1 ? "reply" : "replies"}</span>
                          <span className="or-dot">·</span>
                          <span>{relTime(t.last_reply_at || t.created_at)}</span>
                        </div>
                      </div>
                      <div className="or-thread-side" aria-hidden="true">
                        <div className="or-thread-side-eyebrow">Latest</div>
                        <div className="or-thread-side-name">{t.author_name.split(" ")[0]}</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </main>

        {/* Floating action button on mobile */}
        <Link to="/accessible/forum/new" className="or-fab" aria-label="Create new post">
          <Plus size={22} />
        </Link>
      </div>
    </AccessibleLayout>
  );
}

export function ForumStyles() {
  return (
    <style>{`
      .or-forum {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px; line-height: 1.6; color: #1c1c1c;
        background: #fafafa; padding: 24px 0 80px;
        --or-border: rgba(15,15,30,0.10);
        --or-text-2: #5b6473;
        --or-grey-bg: #f3f4f6;
      }
      .or-container { max-width: 760px; margin: 0 auto; padding: 0 16px; }

      .or-h1 { font-size: 18px; font-weight: 500; margin: 0 0 4px; color: #111; }
      .or-sub { font-size: 13px; color: var(--or-text-2); margin: 0; }

      .or-fhead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
      .or-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 40px; padding: 0 14px; border-radius: 8px; font: 500 13px/1 'Inter', sans-serif; border: 0; cursor: pointer; text-decoration: none; transition: opacity .15s; }
      .or-btn:hover { opacity: 0.9; }
      .or-btn-teal { background: #0F6E56; color: #fff; }
      .or-btn-secondary { background: #fff; color: #26215C; border: 0.5px solid #AFA9EC; }

      /* Search */
      .or-search { display: flex; align-items: center; gap: 8px; background: var(--or-grey-bg); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }
      .or-search svg { color: var(--or-text-2); flex-shrink: 0; }
      .or-search input { flex: 1; background: transparent; border: 0; outline: none; font: inherit; color: inherit; }
      .or-search input::placeholder { color: #9ca3af; }

      /* Chips */
      .or-chips { display: flex; gap: 6px; margin-bottom: 18px; overflow-x: auto; flex-wrap: wrap; padding-bottom: 2px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
      .or-chips::-webkit-scrollbar { display: none; }
      .or-chip { white-space: nowrap; height: 28px; padding: 0 12px; border-radius: 100px; font: 400 12px/1 'Inter', sans-serif; background: var(--or-grey-bg); color: var(--or-text-2); border: 0; cursor: pointer; transition: all .15s; }
      .or-chip:hover { background: #e5e7eb; }
      .or-chip--active { background: #3C3489; color: #fff; font-weight: 500; }
      .or-chip--active:hover { background: #3C3489; opacity: 0.92; }

      /* Pinned */
      .or-pinned { display: flex; gap: 12px; padding: 12px; background: #FAEEDA; border-radius: 8px; margin-bottom: 4px; text-decoration: none; }
      .or-pinned svg { color: #854F0B; margin-top: 2px; flex-shrink: 0; }
      .or-pinned-t1 { font: 500 13px/1.4 'Inter', sans-serif; color: #633806; }
      .or-pinned-t2 { font-size: 12px; color: #854F0B; margin-top: 2px; }

      /* Thread list */
      .or-thread-list { list-style: none; margin: 0; padding: 0; }
      .or-thread-list > li { border-bottom: 0.5px solid var(--or-border); }
      .or-thread-list > li:last-child { border-bottom: 0; }
      .or-thread-row { display: flex; gap: 12px; padding: 14px 0; text-decoration: none; color: inherit; align-items: flex-start; }
      .or-thread-row:hover .or-thread-title { color: #185FA5; }
      .or-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font: 500 13px/1 'Inter', sans-serif; flex-shrink: 0; }
      .or-thread-main { flex: 1; min-width: 0; }
      .or-cat-chip { display: inline-block; padding: 2px 8px; border-radius: 100px; font: 500 10px/1.4 'Inter', sans-serif; }
      .or-thread-title { font: 500 14px/1.35 'Inter', sans-serif; color: #111; margin: 4px 0 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; transition: color .15s; }
      .or-thread-meta { font-size: 12px; color: var(--or-text-2); margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .or-dot { color: #d1d5db; }
      .or-thread-side { flex-shrink: 0; text-align: right; min-width: 70px; }
      .or-thread-side-eyebrow { font-size: 11px; color: #9ca3af; margin-bottom: 2px; }
      .or-thread-side-name { font-size: 11px; color: var(--or-text-2); }
      @media (max-width: 480px) { .or-thread-side { display: none; } }

      /* Empty / loading */
      .or-empty { padding: 40px 16px; text-align: center; color: var(--or-text-2); font-size: 13px; }
      .or-link-teal { color: #0F6E56; font-weight: 500; text-decoration: none; }
      .or-link-teal:hover { text-decoration: underline; }
      .or-skel-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6); background-size: 200% 100%; animation: orPulse 1.4s infinite; flex-shrink: 0; }
      .or-skel-line { background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6); background-size: 200% 100%; animation: orPulse 1.4s infinite; border-radius: 4px; }
      @keyframes orPulse { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

      /* FAB on mobile */
      .or-fab { display: none; position: fixed; bottom: 24px; right: 20px; width: 52px; height: 52px; border-radius: 50%; background: #3C3489; color: #fff; align-items: center; justify-content: center; box-shadow: none; border: 0.5px solid rgba(0,0,0,0.05); z-index: 30; text-decoration: none; }
      @media (max-width: 600px) {
        .or-fhead-cta { display: none; }
        .or-fab { display: inline-flex; }
      }

      @media (prefers-reduced-motion: reduce) {
        .or-skel-avatar, .or-skel-line { animation: none; }
      }
    `}</style>
  );
}
