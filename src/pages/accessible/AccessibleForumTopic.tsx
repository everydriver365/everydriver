import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ForumStyles } from "./AccessibleForum";

type Pillar = "purple" | "teal" | "blue" | "amber" | "pink" | "green" | "coral";

const PILLAR_COLOURS: Record<Pillar, { tint: string; dark: string; base: string }> = {
  purple: { tint: "#EEEDFE", dark: "#26215C", base: "#3C3489" },
  teal:   { tint: "#E1F5EE", dark: "#04342C", base: "#0F6E56" },
  blue:   { tint: "#E6F1FB", dark: "#042C53", base: "#185FA5" },
  amber:  { tint: "#FAEEDA", dark: "#412402", base: "#854F0B" },
  pink:   { tint: "#FBEAF0", dark: "#4B1528", base: "#993556" },
  green:  { tint: "#EAF3DE", dark: "#173404", base: "#3B6D11" },
  coral:  { tint: "#FAECE7", dark: "#4A1B0C", base: "#993C1D" },
};

const CATEGORY_LABELS: Record<string, { label: string; pillar: Pillar }> = {
  adaptations: { label: "Adaptations", pillar: "blue" },
  motability:  { label: "Motability", pillar: "pink" },
  dvla:        { label: "DVLA & licensing", pillar: "purple" },
  insurance:   { label: "Insurance", pillar: "teal" },
  learning:    { label: "Learning to drive", pillar: "coral" },
  wins:        { label: "Wins", pillar: "green" },
  meetups:     { label: "Meetups & events", pillar: "amber" },
  // legacy
  general:     { label: "Meetups & events", pillar: "amber" },
  tests:       { label: "Learning to drive", pillar: "coral" },
  vehicles:    { label: "Adaptations", pillar: "blue" },
};

const AVATAR_PILLARS: Pillar[] = ["purple", "teal", "blue", "pink", "amber", "coral", "green"];
const avatarFor = (name: string) => {
  const sum = [...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PILLARS[Math.abs(sum) % AVATAR_PILLARS.length];
};
const initials = (name: string) =>
  (name || "?").split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const REACTIONS_BASE: { emoji: string; label: string }[] = [
  { emoji: "❤️", label: "Heart" },
  { emoji: "🙌", label: "Cheer" },
  { emoji: "💡", label: "Helpful" },
  { emoji: "🤝", label: "Solidarity" },
  { emoji: "🎉", label: "Celebrate" },
];

interface Reply { id: string; body: string; author_name: string; author_user_id: string | null; created_at: string; }

export default function AccessibleForumTopic() {
  const { id } = useParams();
  const [topic, setTopic] = useState<any>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [myReactions, setMyReactions] = useState<Record<string, boolean>>({});
  const [helpful, setHelpful] = useState<Record<string, { count: number; mine: boolean }>>({});

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUser(data.user)); }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: t }, { data: r }] = await Promise.all([
        supabase.from("accessible_forum_topics").select("*").eq("id", id).single(),
        supabase.from("accessible_forum_replies").select("*").eq("topic_id", id).order("created_at", { ascending: true }),
      ]);
      setTopic(t);
      setReplies((r as any) || []);
      // Seed reactions from localStorage
      const stored = JSON.parse(localStorage.getItem(`or-rx-${id}`) || "{}");
      setReactions(stored.counts || {});
      setMyReactions(stored.mine || {});
      setHelpful(JSON.parse(localStorage.getItem(`or-help-${id}`) || "{}"));
      setLoading(false);
    })();
  }, [id]);

  // Restore draft
  useEffect(() => {
    if (!id) return;
    const draft = localStorage.getItem(`or-draft-${id}`);
    if (draft) setReply(draft);
  }, [id]);
  // Autosave draft
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => {
      if (reply) localStorage.setItem(`or-draft-${id}`, reply);
      else localStorage.removeItem(`or-draft-${id}`);
    }, 500);
    return () => clearTimeout(t);
  }, [reply, id]);

  const cat = topic ? (CATEGORY_LABELS[topic.category] || CATEGORY_LABELS.meetups) : CATEGORY_LABELS.meetups;
  const colours = PILLAR_COLOURS[cat.pillar];

  const sortedReplies = useMemo(() => {
    const list = [...replies];
    if (sort === "oldest") list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return list;
  }, [replies, sort]);

  const isWins = topic?.category === "wins";
  const reactionList = useMemo(() => {
    if (isWins) {
      // Move 🎉 first for Wins
      return [REACTIONS_BASE[4], ...REACTIONS_BASE.filter((_, i) => i !== 4)];
    }
    return REACTIONS_BASE;
  }, [isWins]);

  const toggleReaction = (emoji: string) => {
    setReactions((prev) => {
      const mine = !!myReactions[emoji];
      const next = { ...prev, [emoji]: Math.max(0, (prev[emoji] || 0) + (mine ? -1 : 1)) };
      const nextMine = { ...myReactions, [emoji]: !mine };
      localStorage.setItem(`or-rx-${id}`, JSON.stringify({ counts: next, mine: nextMine }));
      setMyReactions(nextMine);
      return next;
    });
  };

  const toggleHelpful = (replyId: string) => {
    setHelpful((prev) => {
      const cur = prev[replyId] || { count: 0, mine: false };
      const next = { ...prev, [replyId]: { count: Math.max(0, cur.count + (cur.mine ? -1 : 1)), mine: !cur.mine } };
      localStorage.setItem(`or-help-${id}`, JSON.stringify(next));
      return next;
    });
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !user) return;
    setPosting(true);
    const authorName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Member";
    const { data, error } = await supabase
      .from("accessible_forum_replies")
      .insert({ topic_id: id, body: reply.trim(), author_user_id: user.id, author_name: authorName })
      .select()
      .single();
    setPosting(false);
    if (error) { toast.error("Could not post reply"); return; }
    setReplies([...replies, data as Reply]);
    setReply("");
    setComposerOpen(false);
    localStorage.removeItem(`or-draft-${id}`);
    toast.success("Reply posted");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submitReply(e as any);
  };

  return (
    <AccessibleLayout>
      <SEOHead
        title={topic?.title ? `${topic.title} — Open Road community` : "Community thread"}
        description={topic?.body?.slice(0, 150)}
      />

      <div className="or-forum">
        <ForumStyles />
        <ThreadStyles />

        <main className="or-container or-thread-container" id="main">
          {/* Back row */}
          <div className="or-back-row">
            <Link to="/accessible/forum" className="or-back">
              <ArrowLeft size={14} aria-hidden="true" /> Community
            </Link>
            {topic && (
              <span className="or-cat-chip" style={{ background: colours.tint, color: colours.dark }}>
                {topic.is_pinned && isWins ? "✨ Celebrated" : cat.label}
              </span>
            )}
          </div>

          {loading || !topic ? (
            <div className="or-empty">Loading…</div>
          ) : (
            <article>
              <header>
                <h1 className="or-thread-h1">{topic.title}</h1>
                <div className="or-author-row">
                  <div
                    className="or-avatar"
                    style={{ width: 40, height: 40, fontSize: 14, background: PILLAR_COLOURS[avatarFor(topic.author_name)].tint, color: PILLAR_COLOURS[avatarFor(topic.author_name)].dark }}
                    aria-hidden="true"
                  >
                    {initials(topic.author_name)}
                  </div>
                  <div>
                    <div className="or-author-name">{topic.author_name}</div>
                    <div className="or-author-meta">
                      Posted {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
                      <span className="or-dot">·</span>
                      {topic.reply_count} {topic.reply_count === 1 ? "reply" : "replies"}
                    </div>
                  </div>
                </div>
              </header>

              <div className="or-body">{topic.body}</div>

              {/* Reactions */}
              <div className="or-reactions" role="group" aria-label="React to this post">
                {reactionList.map((r) => (
                  <button
                    key={r.emoji}
                    type="button"
                    onClick={() => toggleReaction(r.emoji)}
                    className={`or-reaction ${myReactions[r.emoji] ? "or-reaction--on" : ""}`}
                    aria-pressed={!!myReactions[r.emoji]}
                    aria-label={r.label}
                  >
                    <span aria-hidden="true">{r.emoji}</span>
                    <span>{reactions[r.emoji] || 0}</span>
                  </button>
                ))}
              </div>

              {/* Replies header */}
              <div className="or-replies-head">
                <h2 className="or-replies-h2">{replies.length} {replies.length === 1 ? "reply" : "replies"}</h2>
                <select
                  className="or-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  aria-label="Sort replies"
                >
                  <option value="recent">Most recent</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>

              {/* Replies */}
              <ol className="or-replies" aria-label="Replies">
                {sortedReplies.map((r) => {
                  const ap = avatarFor(r.author_name);
                  const isOP = r.author_user_id && topic.author_user_id && r.author_user_id === topic.author_user_id;
                  const help = helpful[r.id] || { count: 0, mine: false };
                  return (
                    <li key={r.id} className="or-reply">
                      <div className="or-author-row" style={{ marginBottom: 10 }}>
                        <div
                          className="or-avatar"
                          style={{ width: 32, height: 32, fontSize: 12, background: PILLAR_COLOURS[ap].tint, color: PILLAR_COLOURS[ap].dark }}
                          aria-hidden="true"
                        >
                          {initials(r.author_name)}
                        </div>
                        <div className="or-reply-meta">
                          <span className="or-author-name" style={{ fontSize: 13 }}>{r.author_name}</span>
                          {isOP && <span className="or-op-badge">OP</span>}
                          <span className="or-dot">·</span>
                          <span style={{ fontSize: 12, color: "var(--or-text-2)" }}>
                            {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="or-body or-body--reply">{r.body}</div>
                      <div className="or-reply-actions">
                        <button type="button" onClick={() => toggleHelpful(r.id)} className={`or-reply-action ${help.mine ? "or-reply-action--on" : ""}`} aria-pressed={help.mine}>
                          <span aria-hidden="true">❤️</span> Helpful{help.count > 0 ? ` (${help.count})` : ""}
                        </button>
                        <button
                          type="button"
                          className="or-reply-action"
                          onClick={() => { setComposerOpen(true); setReply((p) => (p ? p : `@${r.author_name.split(" ")[0]} `)); }}
                        >
                          Reply
                        </button>
                        <button type="button" className="or-reply-action" onClick={() => toast("Thanks — a moderator will review this post.")}>
                          Report
                        </button>
                      </div>
                    </li>
                  );
                })}
                {replies.length === 0 && (
                  <li className="or-empty" style={{ padding: "24px 0" }}>No replies yet. Be the first to weigh in.</li>
                )}
              </ol>

              {/* Composer */}
              <div className="or-composer">
                {!user ? (
                  <div className="or-composer-auth">
                    <Link to="/pupil/login" className="or-btn or-btn-teal">Sign in to reply</Link>
                    <Link to="/pupil/login" className="or-link-teal" style={{ fontSize: 12 }}>
                      Or create a free account
                    </Link>
                  </div>
                ) : !composerOpen ? (
                  <button type="button" className="or-composer-stub" onClick={() => setComposerOpen(true)}>
                    Add a reply…
                  </button>
                ) : (
                  <form onSubmit={submitReply}>
                    <label className="or-sr-only" htmlFor="or-reply-input">Reply</label>
                    <textarea
                      id="or-reply-input"
                      autoFocus
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Share your thoughts. Cmd/Ctrl + Enter to post."
                      rows={5}
                      className="or-textarea"
                      maxLength={4000}
                    />
                    <div className="or-composer-foot">
                      <span className="or-counter">{reply.length}/4000</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="or-btn or-btn-secondary" onClick={() => { setComposerOpen(false); setReply(""); localStorage.removeItem(`or-draft-${id}`); }}>
                          Cancel
                        </button>
                        <button type="submit" className="or-btn or-btn-teal" disabled={posting || reply.trim().length < 1}>
                          {posting ? "Posting…" : "Post reply"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </article>
          )}
        </main>
      </div>
    </AccessibleLayout>
  );
}

function ThreadStyles() {
  return (
    <style>{`
      .or-thread-container { max-width: 720px; }
      .or-back-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 12px; }
      .or-back { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--or-text-2); text-decoration: none; }
      .or-back:hover { color: #185FA5; }
      .or-thread-h1 { font: 500 20px/1.3 'Inter', sans-serif; color: #111; margin: 0 0 14px; }
      .or-author-row { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
      .or-author-name { font: 500 14px/1.3 'Inter', sans-serif; color: #111; }
      .or-author-meta { font-size: 12px; color: var(--or-text-2); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .or-body { font-size: 14px; line-height: 1.7; color: #2a2f3a; max-width: 65ch; white-space: pre-wrap; }
      .or-body--reply { font-size: 13px; }

      /* Reactions */
      .or-reactions { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; }
      .or-reaction { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 0.5px solid var(--or-border); border-radius: 100px; padding: 5px 12px; font: 400 12px/1 'Inter', sans-serif; cursor: pointer; transition: all .15s; color: #111; }
      .or-reaction:hover { border-color: #AFA9EC; }
      .or-reaction--on { background: #EEEDFE; border-color: #AFA9EC; color: #26215C; font-weight: 500; }

      /* Replies */
      .or-replies-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 28px; padding-bottom: 8px; border-bottom: 0.5px solid var(--or-border); }
      .or-replies-h2 { font: 500 16px/1 'Inter', sans-serif; margin: 0; color: #111; }
      .or-sort { font: 400 12px/1 'Inter', sans-serif; background: #fff; border: 0.5px solid var(--or-border); border-radius: 8px; padding: 6px 10px; color: var(--or-text-2); cursor: pointer; }
      .or-replies { list-style: none; margin: 0; padding: 0; }
      .or-reply { padding: 18px 0; border-bottom: 0.5px solid var(--or-border); }
      .or-reply:last-child { border-bottom: 0; }
      .or-reply-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .or-op-badge { background: #EEEDFE; color: #26215C; font: 500 10px/1 'Inter', sans-serif; padding: 2px 7px; border-radius: 100px; }
      .or-reply-actions { display: flex; gap: 14px; margin-top: 10px; }
      .or-reply-action { background: transparent; border: 0; padding: 0; font: 400 13px/1 'Inter', sans-serif; color: var(--or-text-2); cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
      .or-reply-action:hover { color: #185FA5; }
      .or-reply-action--on { color: #993556; font-weight: 500; }

      /* Composer */
      .or-composer { background: #fff; border: 0.5px solid var(--or-border); border-radius: 12px; padding: 14px; margin-top: 24px; }
      .or-composer-stub { width: 100%; text-align: left; background: transparent; border: 0; padding: 8px 4px; font: 400 14px/1 'Inter', sans-serif; color: var(--or-text-2); cursor: text; min-height: 40px; }
      .or-composer-auth { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 0; }
      .or-textarea { width: 100%; min-height: 110px; resize: vertical; padding: 12px; border: 0.5px solid var(--or-border); border-radius: 8px; font: 400 14px/1.6 'Inter', sans-serif; color: inherit; outline: none; }
      .or-textarea:focus { border-color: #AFA9EC; }
      .or-composer-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; gap: 8px; flex-wrap: wrap; }
      .or-counter { font-size: 11px; color: #9ca3af; }

      .or-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    `}</style>
  );
}
