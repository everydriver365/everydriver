import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, ExternalLink, Send, X, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Scope = "instructor" | "admin";

interface QuoteRow {
  id: string;
  quote_ref: string;
  pupil_name: string;
  email: string | null;
  phone: string | null;
  postcode: string | null;
  course_type: string | null;
  package_details: string | null;
  schedule_notes: string | null;
  terms: string | null;
  total_hours: number | null;
  price_pence: number;
  deposit_pence: number;
  status: string;
  token: string;
  valid_until: string | null;
  expires_at: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  cancelled_at: string | null;
  decline_reason: string | null;
  created_at: string;
  instructor_id: string;
}

interface ActivityRow {
  id: string;
  event: string;
  actor_type: string;
  metadata: any;
  created_at: string;
}

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format((p ?? 0) / 100);

function statusTone(s: string) {
  switch (s) {
    case "accepted": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
    case "sent": case "viewed": return "bg-blue-500/10 text-blue-700 border-blue-500/30";
    case "draft": return "bg-amber-500/10 text-amber-700 border-amber-500/30";
    default: return "bg-muted text-muted-foreground border-muted";
  }
}

export default function QuoteDetailPage({ scope }: { scope: Scope }) {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: q }, { data: a }, { data: b }] = await Promise.all([
      supabase.from("quotes").select("*").eq("id", id).maybeSingle(),
      supabase.from("quote_activity_log").select("*").eq("quote_id", id).order("created_at", { ascending: false }),
      supabase.from("quote_bookings").select("*").eq("quote_id", id).maybeSingle(),
    ]);
    setQuote(q as any);
    setActivity((a as any) ?? []);
    setBooking(b);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const publicUrl = quote ? `${window.location.origin}/quote/${quote.token}` : "";

  const sendQuote = async () => {
    if (!quote) return;
    setBusy(true);
    const { error } = await supabase
      .from("quotes")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", quote.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Marked as sent. Share the link with your pupil.");
    load();
  };

  const cancel = async () => {
    if (!quote) return;
    if (!confirm("Cancel this quote? The pupil will no longer be able to accept it.")) return;
    setBusy(true);
    const { error } = await supabase
      .from("quotes")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", quote.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Quote cancelled");
    load();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!quote) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Button variant="ghost" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <p className="mt-6 text-center text-muted-foreground">Quote not found.</p>
      </div>
    );
  }

  const canSend = quote.status === "draft";
  const canCancel = ["draft", "sent", "viewed"].includes(quote.status);
  const listHref = scope === "admin" ? "/admin/quotes" : "/instructor/quotes";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to={listHref}><ArrowLeft className="h-4 w-4 mr-1" /> Quotes</Link>
            </Button>
            <div>
              <p className="text-xs text-muted-foreground">{quote.quote_ref}</p>
              <h1 className="text-2xl font-bold">{quote.pupil_name}</h1>
            </div>
            <Badge variant="outline" className={statusTone(quote.status)}>{quote.status}</Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={copyLink}><Copy className="h-4 w-4 mr-1" /> Copy link</Button>
            <Button asChild variant="outline" size="sm">
              <a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" /> Open</a>
            </Button>
            {canSend && (
              <Button size="sm" onClick={sendQuote} disabled={busy}>
                <Send className="h-4 w-4 mr-1" /> Mark as sent
              </Button>
            )}
            {canCancel && (
              <Button size="sm" variant="destructive" onClick={cancel} disabled={busy}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">Quote details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {quote.course_type && <Row label="Course" value={quote.course_type} />}
              {quote.total_hours != null && <Row label="Hours" value={`${quote.total_hours}h`} />}
              <Row label="Total price" value={<strong className="text-lg">{fmt(quote.price_pence)}</strong>} />
              {quote.deposit_pence > 0 && <Row label="Deposit" value={fmt(quote.deposit_pence)} />}
              {(quote.email || quote.phone || quote.postcode) && (
                <>
                  <Separator />
                  {quote.email && <Row label="Email" value={quote.email} />}
                  {quote.phone && <Row label="Phone" value={quote.phone} />}
                  {quote.postcode && <Row label="Postcode" value={quote.postcode} />}
                </>
              )}
              {quote.package_details && (<><Separator /><Row label="Package" value={<span className="whitespace-pre-wrap">{quote.package_details}</span>} /></>)}
              {quote.schedule_notes && (<Row label="Schedule" value={<span className="whitespace-pre-wrap">{quote.schedule_notes}</span>} />)}
              {quote.terms && (<Row label="Terms" value={<span className="whitespace-pre-wrap">{quote.terms}</span>} />)}
              {(quote.valid_until || quote.expires_at) && (
                <Row label="Valid until" value={format(new Date(quote.valid_until ?? quote.expires_at!), "dd/MM/yy")} />
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {booking && (
              <Card>
                <CardHeader><CardTitle className="text-base">Booking</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row label="Status" value={<Badge variant="secondary">{booking.status}</Badge>} />
                  <Row label="Accepted" value={formatDistanceToNow(new Date(booking.accepted_at), { addSuffix: true })} />
                  <Button asChild className="w-full mt-2" size="sm">
                    <Link to={`/instructor/scheduler?quoteBookingId=${booking.id}`}>Schedule lessons</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {activity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
                {activity.map((a) => (
                  <div key={a.id} className="text-sm flex items-start gap-2">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="font-medium capitalize">{a.event.replace(/_/g, " ")}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(a.created_at), "d MMM yyyy, HH:mm")} · {a.actor_type}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
