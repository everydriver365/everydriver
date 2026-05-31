import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Check, Clock, FileText, AlertTriangle, X, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";

interface QuoteData {
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
  valid_until: string | null;
  expires_at: string | null;
  accepted_at: string | null;
}
interface Instructor {
  id: string;
  business_name: string | null;
  name: string | null;
  profile_image_url: string | null;
  brand_colour: string | null;
  phone: string | null;
  email: string | null;
  location_name: string | null;
}

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format((p ?? 0) / 100);

export default function QuoteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "accept" | "decline">(null);
  const [showDecline, setShowDecline] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("quote-public-get", { body: { token } });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        setQuote((data as any).quote);
        setInstructor((data as any).instructor);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setBusy("accept");
    try {
      const { data, error } = await supabase.functions.invoke("quote-accept", { body: { token } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Quote accepted. We'll be in touch shortly.");
      setQuote((q) => (q ? { ...q, status: "accepted", accepted_at: new Date().toISOString() } : null));
    } catch (e: any) {
      toast.error(e?.message || "Failed to accept");
    } finally {
      setBusy(null);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    setBusy("decline");
    try {
      const { data, error } = await supabase.functions.invoke("quote-decline", {
        body: { token, reason: reason || null },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Thanks — we've let your instructor know.");
      setQuote((q) => (q ? { ...q, status: "declined" } : null));
      setShowDecline(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to decline");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Quote not found</h2>
            <p className="text-sm text-muted-foreground mt-2">
              This quote link may have expired or been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validUntil = quote.valid_until ?? quote.expires_at;
  const expired = quote.status === "expired" || (!!validUntil && new Date(validUntil) < new Date() && quote.status !== "accepted");
  const accepted = quote.status === "accepted";
  const declined = quote.status === "declined";
  const cancelled = quote.status === "cancelled";

  const brand = instructor?.brand_colour || "#2D3FE7";
  const businessName = instructor?.business_name || instructor?.name || "Your instructor";

  return (
    <div className="min-h-screen bg-muted/40 flex items-start justify-center p-4 pt-8 pb-16">
      <Helmet>
        <title>Quote {quote.quote_ref} · {businessName}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content={`Driving lesson quote from ${businessName}`} />
      </Helmet>

      <div className="w-full max-w-xl space-y-4">
        {/* Instructor header */}
        {instructor && (
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="h-2" style={{ background: brand }} />
            <CardContent className="pt-4 flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={instructor.profile_image_url ?? undefined} />
                <AvatarFallback>{(businessName ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-semibold truncate">{businessName}</div>
                {instructor.location_name && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {instructor.location_name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Quote {quote.quote_ref}</p>
                <CardTitle className="text-xl mt-1">Your driving lesson quote</CardTitle>
              </div>
              {accepted && <Badge className="bg-emerald-600 hover:bg-emerald-600">Accepted</Badge>}
              {declined && <Badge variant="secondary">Declined</Badge>}
              {cancelled && <Badge variant="secondary">Cancelled</Badge>}
              {expired && !accepted && !declined && !cancelled && <Badge variant="secondary">Expired</Badge>}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Row label="Pupil" value={quote.pupil_name} />
            {quote.course_type && <Row label="Course" value={<Badge variant="secondary">{quote.course_type}</Badge>} />}
            {quote.total_hours != null && <Row label="Hours" value={`${quote.total_hours}h`} />}

            <div className="rounded-2xl border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total price</span>
                <span className="text-2xl font-bold" style={{ color: brand }}>{fmt(quote.price_pence)}</span>
              </div>
              {quote.deposit_pence > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deposit required</span>
                  <span className="font-medium">{fmt(quote.deposit_pence)}</span>
                </div>
              )}
            </div>

            {quote.package_details && (
              <InfoBlock icon={<FileText className="h-4 w-4" />} title="What's included">
                {quote.package_details}
              </InfoBlock>
            )}
            {quote.schedule_notes && (
              <InfoBlock icon={<Clock className="h-4 w-4" />} title="Suggested schedule">
                {quote.schedule_notes}
              </InfoBlock>
            )}
            {quote.terms && (
              <InfoBlock icon={<FileText className="h-4 w-4" />} title="Terms">
                {quote.terms}
              </InfoBlock>
            )}

            {validUntil && !accepted && !expired && !cancelled && !declined && (
              <p className="text-xs text-center text-muted-foreground">
                Valid until {format(new Date(validUntil), "d MMM yyyy")}
              </p>
            )}

            {accepted ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-4 text-center">
                <Check className="h-6 w-6 mx-auto mb-1" />
                <p className="font-medium">You've accepted this quote</p>
                <p className="text-sm opacity-80 mt-1">Your instructor will be in touch shortly to schedule your lessons.</p>
                {instructor && (
                  <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                    {instructor.phone && <a href={`tel:${instructor.phone}`} className="inline-flex items-center gap-1 hover:underline"><Phone className="h-3.5 w-3.5" />{instructor.phone}</a>}
                    {instructor.email && <a href={`mailto:${instructor.email}`} className="inline-flex items-center gap-1 hover:underline"><Mail className="h-3.5 w-3.5" />Email</a>}
                  </div>
                )}
              </div>
            ) : expired || declined || cancelled ? (
              <div className="rounded-xl bg-muted text-muted-foreground p-4 text-center text-sm">
                {expired ? "This quote has expired." : declined ? "You've declined this quote." : "This quote has been cancelled."}
              </div>
            ) : showDecline ? (
              <div className="space-y-2">
                <Textarea
                  rows={3}
                  placeholder="Optional — let your instructor know why"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDecline(false)} disabled={busy === "decline"}>
                    Back
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={handleDecline} disabled={busy === "decline"}>
                    {busy === "decline" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                    Confirm decline
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <Button onClick={handleAccept} disabled={!!busy} size="lg" style={{ background: brand }}>
                  {busy === "accept" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Accept quote
                </Button>
                <Button variant="ghost" size="lg" onClick={() => setShowDecline(true)} disabled={!!busy}>
                  Decline
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Drive365
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function InfoBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm font-medium mb-1">{icon}{title}</div>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{children}</p>
    </div>
  );
}
