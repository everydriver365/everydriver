import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  ShieldCheck,
  BadgeCheck,
  XCircle,
  ExternalLink,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CREDENTIAL_LABELS } from "@/hooks/useMyVerifications";

interface Row {
  id: string;
  instructor_id: string;
  credential_type: string;
  value: string | null;
  document_url: string | null;
  expires_at: string | null;
  status: string;
  admin_notes: string | null;
  submitted_at: string;
  instructor: { name: string; email: string | null } | null;
}

type Tab = "pending" | "verified" | "rejected" | "all";

export default function AdminInstructorVerifications() {
  const [tab, setTab] = useState<Tab>("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("instructor_verifications")
      .select("id,instructor_id,credential_type,value,document_url,expires_at,status,admin_notes,submitted_at, instructor:instructors(name,email)")
      .order("submitted_at", { ascending: false })
      .limit(200);
    if (tab !== "all") q = q.eq("status", tab);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setRows((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const viewDoc = async (row: Row) => {
    if (!row.document_url) return;
    if (signedUrls[row.id]) {
      window.open(signedUrls[row.id], "_blank");
      return;
    }
    const { data, error } = await supabase.storage
      .from("instructor-credentials")
      .createSignedUrl(row.document_url, 60 * 10);
    if (error || !data?.signedUrl) {
      toast.error("Couldn't open document");
      return;
    }
    setSignedUrls((s) => ({ ...s, [row.id]: data.signedUrl }));
    window.open(data.signedUrl, "_blank");
  };

  const decide = async (row: Row, status: "verified" | "rejected") => {
    setBusyId(row.id);
    const note = noteDraft[row.id] ?? row.admin_notes ?? null;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("instructor_verifications")
      .update({
        status,
        admin_notes: note,
        verified_by: u.user?.id ?? null,
        verified_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "verified" ? "Approved" : "Rejected");
    void load();
  };

  const counts = useMemo(() => {
    const c = { pending: 0, verified: 0, rejected: 0 };
    rows.forEach((r) => {
      if (r.status in c) (c as any)[r.status]++;
    });
    return c;
  }, [rows]);

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/admin" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 grid place-items-center">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Instructor verifications</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and approve credential submissions to award the Verified Pro badge.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList>
                <TabsTrigger value="pending">Pending {tab === "pending" && rows.length > 0 ? `(${rows.length})` : ""}</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              <Filter className="h-6 w-6 mx-auto mb-2 opacity-50" />
              Nothing to review.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold">
                          {row.instructor?.name ?? row.instructor_id.slice(0, 8)}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {CREDENTIAL_LABELS[row.credential_type as keyof typeof CREDENTIAL_LABELS] ?? row.credential_type}
                        </Badge>
                        <Badge
                          className={
                            row.status === "verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : row.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {row.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {row.instructor?.email ?? ""} · Submitted {new Date(row.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Reference</p>
                      <p className="font-medium">{row.value || "—"}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Expires</p>
                      <p className="font-medium">{row.expires_at || "—"}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Document</p>
                      {row.document_url ? (
                        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => viewDoc(row)}>
                          Open <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      ) : (
                        <p>—</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Textarea
                      placeholder="Note to instructor (optional, shown if rejected)"
                      defaultValue={row.admin_notes ?? ""}
                      onChange={(e) => setNoteDraft((d) => ({ ...d, [row.id]: e.target.value }))}
                      className="text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === row.id}
                      onClick={() => decide(row, "rejected")}
                    >
                      <XCircle className="h-4 w-4 mr-1.5" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={busyId === row.id}
                      onClick={() => decide(row, "verified")}
                    >
                      {busyId === row.id ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <BadgeCheck className="h-4 w-4 mr-1.5" />
                      )}
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
