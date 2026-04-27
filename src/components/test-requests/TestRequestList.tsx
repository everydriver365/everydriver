import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Calendar, Clock, MapPin, Pencil, Trash2, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { TestRequestForm, type TestRequestData } from "./TestRequestForm";
import { TypeBadge, StatusIndicator, IconActionButton, MetaRow } from "./shared/swapPills";
import { OffersStrip, type OffersStripState } from "./shared/OffersStrip";
import { formatSwapDate, formatSwapTime, formatTestCentre, postedAgoLabel } from "./shared/formatSwap";
import { EmptyState } from "@/components/instructor/EmptyState";

interface TestRequestListProps {
  instructorId?: string;
  pupilId?: string;
  onNewRequest?: () => void;
}

export function TestRequestList({ instructorId, pupilId, onNewRequest }: TestRequestListProps) {
  const queryClient = useQueryClient();
  const [editingRequest, setEditingRequest] = useState<TestRequestData | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["test-requests", instructorId, pupilId],
    queryFn: async () => {
      let query = supabase
        .from("test_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (pupilId) query = query.eq("pupil_id", pupilId);
      else if (instructorId) query = query.eq("instructor_id", instructorId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!(instructorId || pupilId),
  });

  const requestIds = (requests ?? []).map((r) => r.id);
  const { data: offerCounts } = useQuery({
    queryKey: ["test-request-offer-counts", requestIds],
    queryFn: async () => {
      if (!requestIds.length) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from("test_swap_offers")
        .select("test_request_id, status")
        .in("test_request_id", requestIds)
        .eq("status", "pending");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((o) => {
        counts[o.test_request_id] = (counts[o.test_request_id] ?? 0) + 1;
      });
      return counts;
    },
    enabled: requestIds.length > 0,
  });

  const handleCancel = async (id: string) => {
    if (!confirm("Delete this swap request?")) return;
    const { error } = await supabase
      .from("test_requests")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast({ title: "Error cancelling", variant: "destructive" });
    } else {
      toast({ title: "Request cancelled" });
      queryClient.invalidateQueries({ queryKey: ["test-requests"] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requests?.length) {
    return (
      <>
        <EmptyState
          icon={ArrowLeftRight}
          title="No swap requests"
          subtitle="Create one to find a better test slot"
          iconBg="#E6F1FB"
          iconColor="#2B7BC8"
        />
        {onNewRequest && (
          <button
            type="button"
            onClick={onNewRequest}
            style={{
              marginTop: 12,
              width: "100%",
              background: "#2B7BC8",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "12px 0",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            New request
          </button>
        )}
      </>
    );
  }

  const renderOffersStrip = (req: typeof requests[number]) => {
    if (req.status === "cancelled") return null;
    const count = offerCounts?.[req.id] ?? 0;

    let state: OffersStripState | null = null;
    if (req.status === "matched") state = "matched";
    else if (req.status === "expired") state = "expired";
    else if (req.status === "paused") state = "paused";
    else if (req.status === "active") {
      if (req.request_type === "want_test") state = count > 0 ? "with-offers" : "waiting";
      else if (req.request_type === "have_test") state = "visible";
    }
    if (!state) return null;

    const subtitle =
      state === "waiting" ? postedAgoLabel(req.created_at) : undefined;

    return (
      <OffersStrip
        state={state}
        count={count}
        subtitle={subtitle}
        onPress={state === "with-offers" || state === "matched" || state === "paused" ? () => {
          // Existing offers/matches review path — open edit dialog as functional fallback
          // (dedicated review screen wired upstream when available)
          setEditingRequest(req as TestRequestData);
        } : undefined}
      />
    );
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {requests.map((req) => {
          const isEditable = req.status === "active" || req.status === "paused";
          return (
            <div
              key={req.id}
              style={{
                background: "#FFFFFF",
                border: "0.5px solid #E5E5EA",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: 14 }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <TypeBadge type={req.request_type} />
                      <StatusIndicator status={req.status} />
                    </div>
                    <h3 style={{
                      fontSize: 15, fontWeight: 500, color: "#000000",
                      letterSpacing: "-0.2px", margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {formatTestCentre(req.test_centre_name)}
                    </h3>
                  </div>
                  {isEditable && (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <IconActionButton ariaLabel="Edit request" onClick={() => setEditingRequest(req as TestRequestData)}>
                        <Pencil size={13} strokeWidth={2} color="#6E6E73" />
                      </IconActionButton>
                      <IconActionButton ariaLabel="Delete request" onClick={() => handleCancel(req.id)}>
                        <Trash2 size={13} strokeWidth={2} color="#6E6E73" />
                      </IconActionButton>
                    </div>
                  )}
                </div>

                {/* Meta rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <MetaRow
                    icon={<Calendar size={14} strokeWidth={1.8} />}
                    label={formatSwapDate(req.test_date, req.date_range_end)}
                  />
                  <MetaRow
                    icon={<Clock size={14} strokeWidth={1.8} />}
                    label={formatSwapTime(req.test_time, req.time_range_end)}
                  />
                  {req.test_centre_name && (
                    <MetaRow
                      icon={<MapPin size={14} strokeWidth={1.8} />}
                      label={req.test_centre_name}
                    />
                  )}
                  {req.notes && (
                    <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>{req.notes}</p>
                  )}
                </div>
              </div>

              {renderOffersStrip(req)}
            </div>
          );
        })}
      </div>

      <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden gap-0 border-none [&>button.absolute]:hidden">
          <DialogTitle className="sr-only">Edit test request</DialogTitle>
          {editingRequest && (
            <TestRequestForm
              instructorId={instructorId}
              pupilId={pupilId}
              mode={pupilId ? "pupil" : "instructor"}
              editData={editingRequest}
              onSuccess={() => setEditingRequest(null)}
              onCancel={() => setEditingRequest(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
