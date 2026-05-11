import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, Check, X } from "lucide-react";
import { toast } from "sonner";
import { CustomDomainAuditLog } from "@/components/admin/CustomDomainAuditLog";

type QueueRow = {
  id: string;
  instructor_id: string;
  domain: string;
  dns_verified_at: string;
  ssl_added_at: string | null;
  status: string;
  admin_notes: string | null;
  instructors?: { name: string | null; email: string | null } | null;
};

export default function CustomDomainQueue() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "added" | "skipped" | "all">("pending");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("custom_domain_admin_queue" as any)
      .select("*, instructors(name, email)")
      .order("dns_verified_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const mark = async (id: string, status: "added" | "skipped" | "pending") => {
    const patch: any = { status };
    if (status === "added") patch.ssl_added_at = new Date().toISOString();
    const { error } = await supabase.from("custom_domain_admin_queue" as any).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${status}`);
    load();
  };

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copied");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Domain Queue</h1>
          <p className="text-muted-foreground">
            Instructor domains verified by DNS — add them in Project Settings → Domains to issue SSL.
          </p>
        </div>
        <div className="flex gap-2">
          {(["pending", "added", "skipped", "all"] as const).map((s) => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}
      {!loading && rows.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">No domains in this view.</CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  {r.domain}
                  <Badge variant={r.status === "added" ? "default" : r.status === "skipped" ? "secondary" : "outline"}>
                    {r.status}
                  </Badge>
                </span>
                <Button size="sm" variant="ghost" onClick={() => copy(r.domain)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-muted-foreground">
                {r.instructors?.name || "Unknown instructor"} · {r.instructors?.email || "—"}
              </div>
              <div className="text-muted-foreground">
                DNS verified {new Date(r.dns_verified_at).toLocaleString()}
                {r.ssl_added_at && ` · SSL added ${new Date(r.ssl_added_at).toLocaleString()}`}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" asChild>
                  <a
                    href="https://lovable.dev/projects/ca10d01e-cc99-4c0b-9186-351c493398b9/settings/domains"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" /> Open Domain Settings
                  </a>
                </Button>
                {r.status !== "added" && (
                  <Button size="sm" onClick={() => mark(r.id, "added")}>
                    <Check className="h-3 w-3 mr-1" /> Mark added
                  </Button>
                )}
                {r.status !== "skipped" && (
                  <Button size="sm" variant="ghost" onClick={() => mark(r.id, "skipped")}>
                    <X className="h-3 w-3 mr-1" /> Skip
                  </Button>
                )}
                {r.status !== "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => mark(r.id, "pending")}>
                    Reopen
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CustomDomainAuditLog />
    </div>
  );
}
