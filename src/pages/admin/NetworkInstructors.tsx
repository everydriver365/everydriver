import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Network, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/adminLogger";

interface NetworkRow {
  id: string;
  name: string | null;
  home_postcode: string | null;
  app_slug: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

export default function NetworkInstructors() {
  const [rows, setRows] = useState<NetworkRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [areaPrefix, setAreaPrefix] = useState("");
  const [loading, setLoading] = useState(true);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("instructors")
        .select("id, name, home_postcode, app_slug, created_at", { count: "exact" })
        .eq("is_network_placeholder", true)
        .order("home_postcode", { ascending: true, nullsFirst: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);
      if (areaPrefix.trim()) query = query.ilike("home_postcode", `${areaPrefix.trim()}%`);

      const { data, count, error } = await query;
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load network instructors");
        setLoading(false);
        return;
      }
      setRows((data ?? []) as NetworkRow[]);
      setTotal(count ?? 0);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page, search, areaPrefix]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const handlePromote = async (row: NetworkRow) => {
    if (!confirm(`Promote "${row.name}" out of the Drive365 Network section?\n\nThis clears the network-* slug so the instructor becomes a regular row in the main Instructors list. You can then assign a real auth account.`)) {
      return;
    }
    setPromotingId(row.id);
    const newSlug = (row.app_slug ?? "").replace(/^network-/, "promoted-");
    const { error } = await supabase
      .from("instructors")
      .update({ app_slug: newSlug })
      .eq("id", row.id);
    setPromotingId(null);
    if (error) {
      toast.error("Promotion failed");
      return;
    }
    toast.success(`Promoted ${row.name}`);
    logAdminAction({
      actionType: "network_instructor_promoted",
      description: `Promoted Drive365 Network instructor ${row.name} (${row.home_postcode ?? "?"}) out of network`,
      entityType: "instructor",
      entityId: row.id,
      metadata: { old_slug: row.app_slug, new_slug: newSlug },
    });
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setTotal((t) => Math.max(0, t - 1));
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Network className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Drive365 Network Instructors</h1>
            <p className="text-sm text-muted-foreground">
              Seeded placeholder coverage rows, one per UK postcode area. Visible to public search; hidden from the main admin Instructors list.
            </p>
          </div>
        </header>

        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Search by name</label>
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="e.g. James"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Postcode area (prefix)</label>
              <Input
                value={areaPrefix}
                onChange={(e) => {
                  setAreaPrefix(e.target.value.toUpperCase());
                  setPage(0);
                }}
                placeholder="e.g. AB, SW1, NW"
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{total.toLocaleString()}</span> placeholders
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No network placeholders match.</div>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.home_postcode ?? "—"} · {r.app_slug ?? "—"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePromote(r)}
                    disabled={promotingId === r.id}
                  >
                    {promotingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Promote"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages.toLocaleString()}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
