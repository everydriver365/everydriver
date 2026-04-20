import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["general", "adaptations", "motability", "learning", "tests", "vehicles"];

export default function AccessibleForumNew() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const submit = async () => {
    if (!user || !title.trim() || !body.trim()) return;
    setPosting(true);
    const authorName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Member";
    const { data, error } = await supabase
      .from("accessible_forum_topics")
      .insert({ title: title.trim(), body: body.trim(), category, author_user_id: user.id, author_name: authorName })
      .select()
      .single();
    setPosting(false);
    if (error) {
      toast.error("Could not post topic");
      return;
    }
    toast.success("Topic posted");
    navigate(`/accessible/forum/${data.id}`);
  };

  return (
    <MainLayout>
      <SEOHead title="Start a topic — Accessible forum" description="Start a new topic in the Drive365 Accessible community." />
      <section className="container max-w-2xl py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/accessible/forum"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
        </Button>
        <Card className="p-6">
          <h1 className="mb-4 text-2xl font-bold">Start a topic</h1>
          {!user ? (
            <p className="text-sm text-muted-foreground">
              <Link to="/pupil/login" className="text-primary underline">Sign in</Link> to start a topic.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's on your mind?" />
              </div>
              <div>
                <Label htmlFor="cat">Category</Label>
                <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 capitalize">
                  {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Share details, ask a question, offer support…" />
              </div>
              <Button onClick={submit} disabled={posting || !title.trim() || !body.trim()} className="w-full">
                {posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post topic
              </Button>
            </div>
          )}
        </Card>
      </section>
    </MainLayout>
  );
}
