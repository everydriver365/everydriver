import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function AccessibleForumTopic() {
  const { id } = useParams();
  const [topic, setTopic] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: t }, { data: r }] = await Promise.all([
        supabase.from("accessible_forum_topics").select("*").eq("id", id).single(),
        supabase.from("accessible_forum_replies").select("*").eq("topic_id", id).order("created_at", { ascending: true }),
      ]);
      setTopic(t);
      setReplies(r || []);
      setLoading(false);
    })();
  }, [id]);

  const submitReply = async () => {
    if (!reply.trim() || !user) return;
    setPosting(true);
    const authorName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Member";
    const { data, error } = await supabase
      .from("accessible_forum_replies")
      .insert({ topic_id: id, body: reply.trim(), author_user_id: user.id, author_name: authorName })
      .select()
      .single();
    setPosting(false);
    if (error) {
      toast.error("Could not post reply");
      return;
    }
    setReplies([...replies, data]);
    setReply("");
    toast.success("Reply posted");
  };

  return (
    <MainLayout>
      <SEOHead title={topic?.title ? `${topic.title} — Forum` : "Forum topic"} description={topic?.body?.slice(0, 150)} />

      <section className="container max-w-3xl py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/accessible/forum"><ArrowLeft className="mr-2 h-4 w-4" /> Back to forum</Link>
        </Button>

        {loading || !topic ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            <Card className="p-6">
              <Badge variant="secondary" className="mb-2 capitalize">{topic.category}</Badge>
              <h1 className="mb-2 text-2xl font-bold">{topic.title}</h1>
              <p className="mb-4 text-sm text-muted-foreground">
                by {topic.author_name} · {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
              </p>
              <p className="whitespace-pre-wrap text-foreground">{topic.body}</p>
            </Card>

            <h2 className="mb-3 mt-6 text-lg font-semibold">{replies.length} {replies.length === 1 ? "reply" : "replies"}</h2>
            <div className="space-y-3">
              {replies.map((r) => (
                <Card key={r.id} className="p-4">
                  <p className="mb-1 text-sm font-medium">{r.author_name}</p>
                  <p className="mb-2 text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                  <p className="whitespace-pre-wrap text-sm">{r.body}</p>
                </Card>
              ))}
            </div>

            <Card className="mt-6 p-4">
              <h3 className="mb-3 font-semibold">Add a reply</h3>
              {user ? (
                <>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Share your thoughts…"
                    rows={4}
                  />
                  <Button onClick={submitReply} disabled={posting || !reply.trim()} className="mt-3">
                    {posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post reply
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Link to="/pupil/login" className="text-primary underline">Sign in</Link> to post a reply.
                </p>
              )}
            </Card>
          </>
        )}
      </section>
    </MainLayout>
  );
}
