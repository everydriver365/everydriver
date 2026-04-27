import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function PassReport() {
  const { pupilId: paramId } = useParams<{ pupilId: string }>();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pupilId, setPupilId] = useState<string | null>(paramId ?? null);

  useEffect(() => {
    void (async () => {
      let id = paramId ?? null;
      if (!id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: p } = await supabase.from("pupils").select("id, pass_report_url").eq("auth_user_id", user.id).maybeSingle();
          id = p?.id ?? null;
          setUrl(p?.pass_report_url ?? null);
        }
      } else {
        const { data: p } = await supabase.from("pupils").select("pass_report_url").eq("id", id).maybeSingle();
        setUrl(p?.pass_report_url ?? null);
      }
      setPupilId(id);
      setLoading(false);
    })();
  }, [paramId]);

  const generate = async () => {
    if (!pupilId) return;
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-pass-report", { body: { pupil_id: pupilId } });
    setGenerating(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Failed");
    } else {
      setUrl((data as { url: string }).url);
      toast.success("Report ready!");
    }
  };

  const share = async () => {
    if (!url) return;
    if (navigator.share) await navigator.share({ title: "I passed!", text: "Check out my driver report 🚗", url });
    else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
  };

  if (loading) return <div className="container mx-auto py-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Your Driver Report</h1>
      {!url ? (
        <Card><CardContent className="pt-6 text-center space-y-4">
          <p className="text-muted-foreground">Generate your celebration report — hours, miles, and competencies mastered.</p>
          <Button onClick={generate} disabled={generating || !pupilId}>{generating ? "Generating…" : "Generate report"}</Button>
        </CardContent></Card>
      ) : (
        <>
          <Card><CardContent className="pt-4">
            <iframe src={url} className="w-full h-[600px] rounded border" title="Driver Report" />
          </CardContent></Card>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline"><a href={url} download><Download className="h-4 w-4 mr-1" /> Download</a></Button>
            <Button onClick={share}><Share2 className="h-4 w-4 mr-1" /> Share</Button>
          </div>
        </>
      )}
    </div>
  );
}
