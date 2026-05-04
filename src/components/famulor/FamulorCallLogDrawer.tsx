import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, MessageCircle, MessageSquare, PhoneCall, PhoneIncoming, PhoneOutgoing, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FamulorCallRow } from "@/hooks/useFamulorCalls";

const ACCENT = "#1A52A0";

interface Props {
  row: FamulorCallRow | null;
  onClose: () => void;
}

const STATUS_COLOUR: Record<string, string> = {
  completed: "#10B981",
  in_progress: "#3B82F6",
  no_answer: "#F59E0B",
  failed: "#EF4444",
  queued: "#6B7280",
};

interface TranscriptTurn {
  role?: string;
  speaker?: string;
  text?: string;
  content?: string;
  timestamp?: string;
}

function normaliseTranscript(t: any): TranscriptTurn[] {
  if (!t) return [];
  if (Array.isArray(t)) return t;
  if (Array.isArray(t.turns)) return t.turns;
  if (Array.isArray(t.messages)) return t.messages;
  return [];
}

export function FamulorCallLogDrawer({ row, onClose }: Props) {
  const open = row !== null;
  const turns = normaliseTranscript(row?.transcript);
  const colour = row ? STATUS_COLOUR[row.status] ?? "#6B7280" : "#6B7280";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {row && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {row.direction === "inbound" ? <PhoneIncoming className="h-4 w-4" /> : <PhoneOutgoing className="h-4 w-4" />}
                <span className="capitalize">{row.purpose.replace("_", " ")} call</span>
              </SheetTitle>
            </SheetHeader>

            <div className="mt-3 flex flex-wrap gap-2 items-center text-[12px]">
              <Badge style={{ backgroundColor: `${colour}1A`, color: colour, borderColor: `${colour}33` }} className="border">
                {(row.outcome ?? row.status).replace("_", " ")}
              </Badge>
              <span className="text-muted-foreground">{new Date(row.created_at).toLocaleString("en-GB")}</span>
              {row.duration_seconds != null && <span className="text-muted-foreground">· {Math.round(row.duration_seconds)}s</span>}
              {row.cost_pence != null && <span className="text-muted-foreground">· £{(row.cost_pence / 100).toFixed(2)}</span>}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <Field label="Phone">{row.phone_number ?? row.from_number ?? row.to_number ?? "—"}</Field>
              <Field label="Agent">{row.agent_name ?? "—"}</Field>
              <Field label="Direction" className="capitalize">{row.direction}</Field>
              <Field label="Famulor ID">
                <span className="font-mono text-[11px]">{(row as any).famulor_call_id ?? "—"}</span>
              </Field>
            </div>

            {row.summary && (
              <div className="mt-4 rounded-[12px] bg-[#F4F7F6] p-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-3 w-3" style={{ color: ACCENT }} />Summary
                </div>
                <div className="text-[13px] mt-1 whitespace-pre-wrap">{row.summary}</div>
              </div>
            )}

            {row.recording_url && (
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Recording</div>
                <audio controls src={row.recording_url} className="w-full" />
              </div>
            )}

            {turns.length > 0 && (
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Transcript</div>
                <div className="flex flex-col gap-2">
                  {turns.map((t, i) => {
                    const role = (t.role ?? t.speaker ?? "agent").toLowerCase();
                    const isAgent = role.includes("agent") || role.includes("assistant") || role.includes("ai");
                    return (
                      <div
                        key={i}
                        className={`max-w-[85%] px-3 py-2 rounded-[12px] text-[13px] ${
                          isAgent ? "self-start bg-[#EDF2FE] text-[#1A52A0]" : "self-end bg-white border border-[#E5E5EA]"
                        }`}
                      >
                        {t.text ?? t.content ?? ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {row.pupil_id && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/instructor/pupils?id=${row.pupil_id}`, "_blank")}
                  className="w-full"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open pupil
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-[12px] mt-0.5 ${className ?? ""}`}>{children}</div>
    </div>
  );
}
