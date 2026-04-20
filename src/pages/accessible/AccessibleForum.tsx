import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Plus, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = ["all", "general", "adaptations", "motability", "learning", "tests", "vehicles"] as const;

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

export default function AccessibleForum() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");

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

  const filtered = category === "all" ? topics : topics.filter((t) => t.category === category);

  return (
    <MainLayout>
      <SEOHead title="Accessible drivers forum — Drive365" description="Community forum for disabled drivers, learners and families." />

      <section className="border-b bg-secondary/30 py-8">
        <div className="container max-w-4xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Community forum</h1>
              <p className="text-muted-foreground">Share tips, ask questions, support each other.</p>
            </div>
            <Button asChild>
              <Link to="/accessible/forum/new"><Plus className="mr-2 h-4 w-4" /> New topic</Link>
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Badge
                key={c}
                variant={category === c ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setCategory(c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="container max-w-4xl py-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
            No topics yet. Be the first to start a discussion!
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => (
              <Link key={t.id} to={`/accessible/forum/${t.id}`}>
                <Card className="p-4 transition-all hover:border-primary hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {t.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                        <h3 className="truncate font-semibold">{t.title}</h3>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.body}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="capitalize">{t.category}</Badge>
                        <span>by {t.author_name}</span>
                        <span>·</span>
                        <span>{t.reply_count} {t.reply_count === 1 ? "reply" : "replies"}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(t.last_reply_at || t.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  );
}
