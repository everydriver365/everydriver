import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, Clock, MapPin, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TestSwapOfferDialog } from "./TestSwapOfferDialog";
import { TypeBadge, StatusIndicator, MetaRow } from "./shared/swapPills";
import { formatSwapDate, formatSwapTime, formatTestCentre } from "./shared/formatSwap";
import { EmptyState } from "@/components/instructor/EmptyState";

interface SwapBoardProps {
  instructorId?: string;
}

export function SwapBoard({ instructorId }: SwapBoardProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["test-requests-board"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_requests")
        .select("*")
        .eq("status", "active")
        .order("test_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filtered = (requests ?? []).filter((r) => !instructorId || r.instructor_id !== instructorId);

  if (!filtered.length) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No swaps available right now"
        subtitle="Check back later — instructors post swaps regularly"
        iconBg="#E6F1FB"
        iconColor="#2B7BC8"
      />
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((req) => (
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
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <TypeBadge type={req.request_type} />
                <StatusIndicator status={req.status} />
              </div>
              <h3 style={{
                fontSize: 15, fontWeight: 500, color: "#000000",
                letterSpacing: "-0.2px", margin: "0 0 12px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {formatTestCentre(req.test_centre_name)}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                <MetaRow icon={<Calendar size={14} strokeWidth={1.8} />} label={formatSwapDate(req.test_date, req.date_range_end)} />
                <MetaRow icon={<Clock size={14} strokeWidth={1.8} />} label={formatSwapTime(req.test_time, req.time_range_end)} />
                {req.test_centre_name && (
                  <MetaRow icon={<MapPin size={14} strokeWidth={1.8} />} label={req.test_centre_name} />
                )}
                {req.notes && (
                  <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>{req.notes}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequestId(req.id)}
                style={{
                  width: "100%",
                  background: "#2B7BC8",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 0",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Offer to swap
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedRequestId && (
        <TestSwapOfferDialog
          requestId={selectedRequestId}
          instructorId={instructorId}
          open={!!selectedRequestId}
          onOpenChange={(open) => { if (!open) setSelectedRequestId(null); }}
        />
      )}
    </>
  );
}
