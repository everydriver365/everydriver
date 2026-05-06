import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Mail,
  Phone,
  MessageSquare,
  Inbox,
  CheckCircle2,
  XCircle,
  UserPlus,
  Clock,
  MapPin,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type EnquiryStatus = "new" | "contacted" | "converted" | "dismissed";

interface Enquiry {
  id: string;
  pupil_name: string;
  pupil_email: string;
  pupil_phone: string;
  pupil_postcode: string | null;
  course_name: string | null;
  course_hours: number | null;
  message: string | null;
  status: string;
  source: string | null;
  contacted_at: string | null;
  converted_pupil_id: string | null;
  created_at: string;
}

const STATUS_FILTERS: { key: "all" | EnquiryStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "converted", label: "Converted" },
  { key: "dismissed", label: "Dismissed" },
];

const STATUS_STYLES: Record<EnquiryStatus, { bg: string; fg: string; label: string }> = {
  new: { bg: "#DBEAFE", fg: "#1D4ED8", label: "New" },
  contacted: { bg: "#FEF3C7", fg: "#92400E", label: "Contacted" },
  converted: { bg: "#DCFCE7", fg: "#166534", label: "Converted" },
  dismissed: { bg: "#F3F4F6", fg: "#6B7280", label: "Dismissed" },
};

export default function InstructorEnquiries() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | EnquiryStatus>("all");
  const [smsTarget, setSmsTarget] = useState<Enquiry | null>(null);
  const [smsBody, setSmsBody] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["instructor-enquiries", instructorId],
    queryFn: async () => {
      if (!instructorId) return [] as Enquiry[];
      const { data, error } = await supabase
        .from("booking_enquiries")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Enquiry[];
    },
    enabled: !!instructorId,
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: enquiries.length, new: 0, contacted: 0, converted: 0, dismissed: 0 };
    enquiries.forEach((e) => {
      c[e.status] = (c[e.status] || 0) + 1;
    });
    return c;
  }, [enquiries]);

  const visible = useMemo(() => {
    if (filter === "all") return enquiries;
    return enquiries.filter((e) => e.status === filter);
  }, [enquiries, filter]);

  async function updateStatus(enquiry: Enquiry, status: EnquiryStatus) {
    setUpdatingId(enquiry.id);
    const patch: Record<string, unknown> = { status };
    if (status === "contacted") patch.contacted_at = new Date().toISOString();
    const { error } = await supabase
      .from("booking_enquiries")
      .update(patch)
      .eq("id", enquiry.id);
    setUpdatingId(null);
    if (error) {
      toast.error("Could not update enquiry");
      return;
    }
    toast.success(`Marked as ${status}`);
    queryClient.invalidateQueries({ queryKey: ["instructor-enquiries", instructorId] });
  }

  function handleCall(e: Enquiry) {
    if (!e.pupil_phone) return toast.error("No phone number");
    window.location.href = `tel:${e.pupil_phone}`;
    if (e.status === "new") updateStatus(e, "contacted");
  }

  function handleEmail(e: Enquiry) {
    if (!e.pupil_email) return toast.error("No email");
    const subject = encodeURIComponent(`Re: Driving lesson enquiry`);
    const body = encodeURIComponent(
      `Hi ${e.pupil_name.split(" ")[0]},\n\nThanks for your enquiry${e.course_name ? ` about ${e.course_name}` : ""}. ` +
        `I'd love to help you get on the road.\n\nWhen would suit you for a quick call?\n\nThanks,\n${instructor?.name || ""}`,
    );
    window.location.href = `mailto:${e.pupil_email}?subject=${subject}&body=${body}`;
    if (e.status === "new") updateStatus(e, "contacted");
  }

  function openSms(e: Enquiry) {
    if (!e.pupil_phone) return toast.error("No phone number");
    setSmsTarget(e);
    setSmsBody(
      `Hi ${e.pupil_name.split(" ")[0]}, thanks for your driving lesson enquiry. When's a good time to chat? - ${
        instructor?.name || "Your instructor"
      }`,
    );
  }

  function sendSms() {
    if (!smsTarget) return;
    const url = `sms:${smsTarget.pupil_phone}?&body=${encodeURIComponent(smsBody)}`;
    window.location.href = url;
    if (smsTarget.status === "new") updateStatus(smsTarget, "contacted");
    setSmsTarget(null);
  }

  return (
    <InstructorPortalLayout>
      <div style={{ background: "#F8F9FB", minHeight: "100%", padding: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Inbox size={16} color="#3730A3" strokeWidth={1.6} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.4px",
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              Enquiries
            </h1>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>
              Leads from your booking page — call, text or email and convert to a pupil.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {STATUS_FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  border: 0,
                  cursor: "pointer",
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  background: active ? "#111827" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#374151",
                  boxShadow: active ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                {f.label}
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    opacity: 0.75,
                  }}
                >
                  {counts[f.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Loader2 className="animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <Card>
            <CardContent style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>
              <Inbox size={28} style={{ margin: "0 auto 12px", color: "#9CA3AF" }} />
              <div style={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}>
                No enquiries{filter !== "all" ? ` in “${filter}”` : ""} yet
              </div>
              <div style={{ fontSize: 13 }}>
                When pupils submit your enquiry form, they'll show up here.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible.map((e) => {
              const status = (e.status as EnquiryStatus) in STATUS_STYLES
                ? (e.status as EnquiryStatus)
                : "new";
              const s = STATUS_STYLES[status];
              return (
                <Card key={e.id} style={{ border: "1px solid #E5E7EB", borderRadius: 16 }}>
                  <CardContent style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                            {e.pupil_name}
                          </div>
                          <Badge
                            style={{
                              background: s.bg,
                              color: s.fg,
                              border: 0,
                              fontWeight: 600,
                            }}
                          >
                            {s.label}
                          </Badge>
                          {e.course_name && (
                            <span style={{ fontSize: 12, color: "#6B7280" }}>
                              {e.course_name}
                              {e.course_hours ? ` · ${e.course_hours}h` : ""}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 12,
                            fontSize: 13,
                            color: "#4B5563",
                          }}
                        >
                          {e.pupil_phone && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Phone size={12} /> {e.pupil_phone}
                            </span>
                          )}
                          {e.pupil_email && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Mail size={12} /> {e.pupil_email}
                            </span>
                          )}
                          {e.pupil_postcode && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={12} /> {e.pupil_postcode}
                            </span>
                          )}
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#9CA3AF" }}>
                            <Clock size={12} />{" "}
                            {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        {e.message && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: 10,
                              background: "#F9FAFB",
                              borderRadius: 10,
                              fontSize: 13,
                              color: "#374151",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {e.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        borderTop: "1px solid #F3F4F6",
                        paddingTop: 12,
                      }}
                    >
                      <Button size="sm" variant="default" onClick={() => handleCall(e)} disabled={!e.pupil_phone}>
                        <Phone className="h-3.5 w-3.5 mr-1.5" /> Call
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openSms(e)} disabled={!e.pupil_phone}>
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Text
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleEmail(e)} disabled={!e.pupil_email}>
                        <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
                      </Button>
                      <div style={{ flex: 1 }} />
                      {status !== "converted" && (
                        <>
                          {status !== "contacted" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateStatus(e, "contacted")}
                              disabled={updatingId === e.id}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark contacted
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(e, "converted")}
                            disabled={updatingId === e.id}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Converted
                          </Button>
                          {status !== "dismissed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateStatus(e, "dismissed")}
                              disabled={updatingId === e.id}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Dismiss
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!smsTarget} onOpenChange={(o) => !o && setSmsTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Text {smsTarget?.pupil_name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={smsBody}
            onChange={(ev) => setSmsBody(ev.target.value)}
            rows={5}
            placeholder="Your message"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSmsTarget(null)}>
              Cancel
            </Button>
            <Button onClick={sendSms}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Open in Messages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </InstructorPortalLayout>
  );
}
