import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Check,
  X,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  Star,
  RefreshCw,
  Upload,
  Search,
  AlertCircle,
} from "lucide-react";

type ModStatus = "pending" | "approved" | "rejected";

interface ReviewRow {
  id: string;
  instructor_id: string;
  reviewer_name: string;
  reviewer_email: string | null;
  reviewer_location: string | null;
  review_text: string;
  rating: number;
  review_date: string | null;
  course_hours: number;
  is_verified: boolean | null;
  is_visible: boolean | null;
  moderation_status: ModStatus;
  moderation_note: string | null;
  created_at: string;
  instructors: { name: string | null } | null;
}

type FilterStatus = "pending" | "approved" | "rejected" | "all";

const STATUS_META: Record<ModStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewModeration() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Record<ModStatus, number>>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ReviewRow | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ReviewRow>>({});

  async function refresh() {
    setLoading(true);

    // counts
    const statuses: ModStatus[] = ["pending", "approved", "rejected"];
    const countResults = await Promise.all(
      statuses.map((s) =>
        supabase
          .from("course_reviews")
          .select("id", { count: "exact", head: true })
          .eq("moderation_status", s)
      )
    );
    setCounts({
      pending: countResults[0].count ?? 0,
      approved: countResults[1].count ?? 0,
      rejected: countResults[2].count ?? 0,
    });

    // list
    let query = supabase
      .from("course_reviews")
      .select(
        "id, instructor_id, reviewer_name, reviewer_email, reviewer_location, review_text, rating, review_date, course_hours, is_verified, is_visible, moderation_status, moderation_note, created_at, instructors:instructor_id(name)"
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (filter !== "all") query = query.eq("moderation_status", filter);

    const { data, error } = await query;
    setLoading(false);

    if (error) {
      toast({
        title: "Could not load reviews",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setRows((data ?? []) as unknown as ReviewRow[]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        r.reviewer_name?.toLowerCase().includes(q) ||
        r.reviewer_email?.toLowerCase().includes(q) ||
        r.reviewer_location?.toLowerCase().includes(q) ||
        r.review_text?.toLowerCase().includes(q) ||
        r.instructors?.name?.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  async function setStatus(row: ReviewRow, status: ModStatus) {
    setBusyId(row.id);
    const { error } = await supabase
      .from("course_reviews")
      .update({
        moderation_status: status,
        is_visible: status === "approved",
      })
      .eq("id", row.id);
    setBusyId(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Review ${status}` });
    refresh();
  }

  async function toggleVisible(row: ReviewRow) {
    setBusyId(row.id);
    const { error } = await supabase
      .from("course_reviews")
      .update({ is_visible: !row.is_visible })
      .eq("id", row.id);
    setBusyId(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: row.is_visible ? "Hidden" : "Shown" });
    refresh();
  }

  async function deleteRow(row: ReviewRow) {
    if (!confirm(`Delete review by ${row.reviewer_name}? This cannot be undone.`)) return;
    setBusyId(row.id);
    const { error } = await supabase.from("course_reviews").delete().eq("id", row.id);
    setBusyId(null);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Review deleted" });
    setRows((rs) => rs.filter((r) => r.id !== row.id));
  }

  function openEdit(row: ReviewRow) {
    setEditing(row);
    setEditDraft({
      reviewer_name: row.reviewer_name,
      reviewer_location: row.reviewer_location,
      review_text: row.review_text,
      rating: row.rating,
      review_date: row.review_date,
      moderation_note: row.moderation_note,
    });
  }

  async function saveEdit() {
    if (!editing) return;
    const text = (editDraft.review_text ?? "").trim();
    const name = (editDraft.reviewer_name ?? "").trim();
    const rating = Math.max(1, Math.min(5, Number(editDraft.rating) || editing.rating));
    if (!name || text.length < 5) {
      toast({
        title: "Name and review text are required",
        variant: "destructive",
      });
      return;
    }
    setBusyId(editing.id);
    const { error } = await supabase
      .from("course_reviews")
      .update({
        reviewer_name: name.slice(0, 120),
        reviewer_location: (editDraft.reviewer_location ?? "").slice(0, 120) || null,
        review_text: text.slice(0, 4000),
        rating,
        review_date: editDraft.review_date || null,
        moderation_note: (editDraft.moderation_note ?? "").slice(0, 500) || null,
      })
      .eq("id", editing.id);
    setBusyId(null);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Review updated" });
    setEditing(null);
    refresh();
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Review Moderation</h1>
            <p className="text-sm text-muted-foreground">
              Approve, reject, hide or edit pupil reviews across all instructors.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/review-import">
                <Upload className="h-4 w-4 mr-2" />
                Bulk import
              </Link>
            </Button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "all"] as FilterStatus[]).map((s) => {
            const isActive = filter === s;
            const count =
              s === "all"
                ? counts.pending + counts.approved + counts.rejected
                : counts[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span
                  className={`ml-2 inline-flex items-center justify-center min-w-[20px] px-1.5 h-5 rounded-full text-xs ${
                    isActive ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          <div className="relative ml-auto w-full sm:w-72">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, text, instructor…"
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* List */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">
              {loading ? "Loading…" : `${filteredRows.length} review${filteredRows.length === 1 ? "" : "s"}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!loading && filteredRows.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No reviews match this view.</p>
              </div>
            )}

            {filteredRows.map((r) => {
              const meta = STATUS_META[r.moderation_status];
              const isBusy = busyId === r.id;
              return (
                <div
                  key={r.id}
                  className="rounded-lg border bg-card p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">{r.reviewer_name}</span>
                        <Stars rating={r.rating} />
                        <Badge variant="outline" className={`text-xs ${meta.className}`}>
                          {meta.label}
                        </Badge>
                        {r.is_visible === false && (
                          <Badge variant="outline" className="text-xs bg-muted">
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>
                          For:{" "}
                          <Link
                            to={`/admin/instructors/${r.instructor_id}`}
                            className="underline hover:text-foreground"
                          >
                            {r.instructors?.name ?? "Unknown instructor"}
                          </Link>
                        </span>
                        {r.reviewer_location && <span>📍 {r.reviewer_location}</span>}
                        {r.reviewer_email && <span>✉ {r.reviewer_email}</span>}
                        <span>Submitted {fmtDate(r.created_at)}</span>
                        {r.review_date && <span>Lesson date {fmtDate(r.review_date)}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 shrink-0">
                      {r.moderation_status !== "approved" && (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={isBusy}
                          onClick={() => setStatus(r, "approved")}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {r.moderation_status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => setStatus(r, "rejected")}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      )}
                      {r.moderation_status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => toggleVisible(r)}
                        >
                          {r.is_visible ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" /> Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" /> Show
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={isBusy}
                        onClick={() => deleteRow(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{r.review_text}</p>

                  {r.moderation_note && (
                    <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">
                      Note: {r.moderation_note}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit review</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Reviewer name</Label>
                  <Input
                    value={editDraft.reviewer_name ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, reviewer_name: e.target.value }))}
                    maxLength={120}
                  />
                </div>
                <div>
                  <Label className="text-xs">Location</Label>
                  <Input
                    value={editDraft.reviewer_location ?? ""}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, reviewer_location: e.target.value }))
                    }
                    maxLength={120}
                  />
                </div>
                <div>
                  <Label className="text-xs">Rating</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={editDraft.rating ?? 5}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, rating: parseInt(e.target.value) }))
                    }
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {"★".repeat(n)} ({n})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Review date</Label>
                  <Input
                    type="date"
                    value={editDraft.review_date ?? ""}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, review_date: e.target.value || null }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Review text</Label>
                <Textarea
                  rows={5}
                  value={editDraft.review_text ?? ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, review_text: e.target.value }))}
                  maxLength={4000}
                />
              </div>
              <div>
                <Label className="text-xs">Internal note (not shown publicly)</Label>
                <Input
                  value={editDraft.moderation_note ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, moderation_note: e.target.value }))
                  }
                  maxLength={500}
                  placeholder="e.g. Edited typos, verified via WhatsApp"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={!!busyId}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
