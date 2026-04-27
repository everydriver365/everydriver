import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReceiptData {
  id: string;
  amount: number;
  recorded_at: string;
  payment_method: string | null;
  notes: string | null;
  pupil_name?: string;
  instructor_name?: string;
  instructor_adi_number?: string | null;
  lesson_summary?: string | null;
}

interface PupilPaymentReceiptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string | null;
  pupilId: string;
}

export function PupilPaymentReceiptSheet({
  open,
  onOpenChange,
  paymentId,
  pupilId,
}: PupilPaymentReceiptSheetProps) {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !paymentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: payment } = await (supabase as any)
        .from("payment_history")
        .select(
          "id, amount, recorded_at, payment_method, notes, instructor_id, scheduled_lessons:lesson_id(lesson_date, start_time, lesson_type)"
        )
        .eq("id", paymentId)
        .maybeSingle();

      if (!payment || cancelled) {
        setLoading(false);
        return;
      }

      const [{ data: pupil }, { data: instructor }] = await Promise.all([
        (supabase as any).from("pupils").select("name").eq("id", pupilId).maybeSingle(),
        (supabase as any)
          .from("instructors")
          .select("name, adi_number")
          .eq("id", payment.instructor_id)
          .maybeSingle(),
      ]);

      const lesson = payment.scheduled_lessons;
      const lessonSummary = lesson?.lesson_date
        ? `${format(parseISO(lesson.lesson_date), "EEE d MMM yyyy")}${
            lesson.start_time ? ` at ${lesson.start_time.slice(0, 5)}` : ""
          }${lesson.lesson_type ? ` · ${lesson.lesson_type}` : ""}`
        : null;

      if (!cancelled) {
        setData({
          id: payment.id,
          amount: payment.amount,
          recorded_at: payment.recorded_at,
          payment_method: payment.payment_method,
          notes: payment.notes,
          pupil_name: pupil?.name,
          instructor_name: instructor?.name,
          instructor_adi_number: instructor?.adi_number,
          lesson_summary: lessonSummary,
        });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, paymentId, pupilId]);

  const handlePrint = () => {
    if (!data) return;
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) {
      toast.error("Pop-up blocked. Allow pop-ups to download a receipt.");
      return;
    }
    w.document.write(receiptHtml(data));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  const handleShare = async () => {
    if (!data) return;
    const text = `Receipt #${data.id.slice(0, 8)} · £${Math.abs(data.amount).toFixed(
      2
    )} · ${format(parseISO(data.recorded_at), "d MMM yyyy")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Payment receipt", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Receipt summary copied");
      }
    } catch {
      // user cancelled
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Payment receipt</DrawerTitle>
          <DrawerDescription>
            Save or share this as proof of payment.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          {loading || !data ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Amount
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  £{Math.abs(data.amount).toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Date" value={format(parseISO(data.recorded_at), "d MMM yyyy")} />
                <Field label="Time" value={format(parseISO(data.recorded_at), "HH:mm")} />
                <Field label="Method" value={data.payment_method ?? "—"} />
                <Field label="Type" value={data.amount > 0 ? "Credit" : "Charge"} />
                <Field label="Pupil" value={data.pupil_name ?? "—"} />
                <Field
                  label="Instructor"
                  value={
                    data.instructor_name
                      ? `${data.instructor_name}${
                          data.instructor_adi_number ? ` · ADI ${data.instructor_adi_number}` : ""
                        }`
                      : "—"
                  }
                />
                {data.lesson_summary && (
                  <div className="col-span-2">
                    <Field label="Linked lesson" value={data.lesson_summary} />
                  </div>
                )}
                {data.notes && (
                  <div className="col-span-2">
                    <Field label="Notes" value={data.notes} />
                  </div>
                )}
                <div className="col-span-2">
                  <Field label="Transaction ID" value={data.id} mono />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-6 pt-2 flex gap-2 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={handleShare} disabled={!data}>
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
          <Button className="flex-1" onClick={handlePrint} disabled={!data}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm text-foreground ${mono ? "font-mono break-all" : ""}`}>{value}</p>
    </div>
  );
}

function receiptHtml(d: ReceiptData) {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Receipt ${d.id.slice(0, 8)}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;padding:32px;color:#0f172a;max-width:520px;margin:auto}
    h1{font-size:18px;margin:0 0 4px}.muted{color:#64748b;font-size:12px}
    .amt{font-size:32px;font-weight:700;margin:12px 0}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    td{padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:13px;vertical-align:top}
    td:first-child{color:#64748b;width:40%}
    .footer{margin-top:24px;font-size:11px;color:#94a3b8}
  </style></head><body>
    <h1>Payment receipt</h1>
    <div class="muted">${format(parseISO(d.recorded_at), "EEEE d MMMM yyyy 'at' HH:mm")}</div>
    <div class="amt">£${Math.abs(d.amount).toFixed(2)}</div>
    <table>
      <tr><td>Type</td><td>${d.amount > 0 ? "Credit" : "Charge"}</td></tr>
      <tr><td>Method</td><td>${escape(d.payment_method ?? "—")}</td></tr>
      <tr><td>Pupil</td><td>${escape(d.pupil_name ?? "—")}</td></tr>
      <tr><td>Instructor</td><td>${escape(d.instructor_name ?? "—")}${
        d.instructor_adi_number ? ` · ADI ${escape(d.instructor_adi_number)}` : ""
      }</td></tr>
      ${d.lesson_summary ? `<tr><td>Linked lesson</td><td>${escape(d.lesson_summary)}</td></tr>` : ""}
      ${d.notes ? `<tr><td>Notes</td><td>${escape(d.notes)}</td></tr>` : ""}
      <tr><td>Transaction ID</td><td style="font-family:monospace;font-size:11px">${d.id}</td></tr>
    </table>
    <p class="footer">This receipt was generated automatically. Any platform processing fees are shown as a Service Fee in line with UK Payment Services Regulations 2017.</p>
  </body></html>`;
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
