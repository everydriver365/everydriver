import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, RefreshCw, Sparkles, Loader2, CheckCircle2, Pencil } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MeRow {
  id: string;
  full_name: string;
  current_centre_name: string | null;
  current_test_date: string | null;
  current_test_time: string | null;
  earliest_new_date: string;
  latest_new_date: string;
  has_test_booked: boolean;
}

interface MatchRow {
  id: string;
  first_name: string;
  current_centre_name: string | null;
  current_test_date: string;
  current_test_time: string | null;
  earliest_new_date: string;
  latest_new_date: string;
  has_test_booked: boolean;
  notes: string | null;
  created_at: string;
  already_requested: boolean;
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function TestSwapMatches() {
  const { signupId = "" } = useParams<{ signupId: string }>();
  const { toast } = useToast();

  const [me, setMe] = useState<MeRow | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<MatchRow | null>(null);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    if (!signupId) return;
    setLoading(true);

    const [meRes, matchesRes] = await Promise.all([
      supabase.rpc("get_public_test_swap_signup_self", { p_id: signupId }),
      supabase.rpc("get_test_swap_matches", { p_signup_id: signupId }),
    ]);

    const meRow = Array.isArray(meRes.data) ? meRes.data[0] : meRes.data;

    if (!meRow) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setMe(meRow as MeRow);
    setMatches(((matchesRes.data as MatchRow[] | null) ?? []));
    setLoading(false);
  }, [signupId]);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const handleRequest = async () => {
    if (!confirmTarget || !signupId) return;
    setRequesting(true);
    const { error } = await supabase.rpc("request_test_swap", {
      p_requester_signup_id: signupId,
      p_target_signup_id: confirmTarget.id,
    });
    if (error) {
      toast({ title: "Couldn't send request", description: error.message, variant: "destructive" });
      setRequesting(false);
      setConfirmTarget(null);
      return;
    }

    // Fire-and-forget email to the slot owner + confirmation to requester
    supabase.functions
      .invoke("notify-public-test-swap-request", {
        body: { requesterSignupId: signupId, targetSignupId: confirmTarget.id },
      })
      .catch(() => {});

    setMatches((prev) =>
      prev.map((m) => (m.id === confirmTarget.id ? { ...m, already_requested: true } : m))
    );
    setRequesting(false);
    setConfirmTarget(null);
    toast({
      title: "Swap request sent",
      description: `We've emailed ${confirmTarget.first_name} your details so they can get in touch.`,
    });
  };

  if (notFound) {
    return (
      <MainLayout>
        <section className="py-16">
          <div className="container max-w-2xl text-center">
            <h1 className="text-2xl font-bold mb-2">Registration not found</h1>
            <p className="text-muted-foreground mb-6">This swap link looks invalid or has expired.</p>
            <Button asChild><Link to="/test-swap/register">Register for a swap</Link></Button>
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEOHead
        title="Your Test Swap Matches | Drive365"
        description="See learners whose driving test dates fit your preferred window and request a swap."
      />

      <section className="py-10 md:py-14">
        <div className="container max-w-3xl">
          <Link
            to="/test-swap"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Test Swap
          </Link>

          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold">
              {me ? `Hi ${me.full_name.split(" ")[0]}, here are your matches` : "Your matches"}
            </h1>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {me && (
            <div className="rounded-2xl border bg-muted/30 p-4 mb-6 text-sm">
              <div className="font-medium mb-1">Your details</div>
              <div className="text-muted-foreground">
                {me.has_test_booked ? (
                  <>Current test: <span className="text-foreground">{me.current_centre_name ?? "—"} · {fmtDate(me.current_test_date)} {me.current_test_time?.slice(0,5)}</span></>
                ) : (
                  <>You haven't booked a test yet</>
                )}
                <span className="mx-2">·</span>
                Want a date between <span className="text-foreground">{fmtDate(me.earliest_new_date)}</span> and <span className="text-foreground">{fmtDate(me.latest_new_date)}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading matches…
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-2">No matches yet</h2>
              <p className="text-muted-foreground">
                We'll email you the moment a compatible swap appears. You can come back to this page anytime to check.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => {
                const compatible = me?.has_test_booked
                  ? "Looks like a good two-way swap"
                  : "Possible swap (you have no test booked)";
                return (
                  <div key={m.id} className="rounded-2xl border bg-card p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{m.first_name}</h3>
                          <Badge variant="secondary" className="text-xs">{compatible}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Their test: <span className="text-foreground">{fmtDate(m.current_test_date)}{m.current_test_time ? ` · ${m.current_test_time.slice(0,5)}` : ""}</span>
                          </div>
                          {m.current_centre_name && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {m.current_centre_name}
                            </div>
                          )}
                          <div className="text-xs">
                            They want a date between {fmtDate(m.earliest_new_date)} and {fmtDate(m.latest_new_date)}
                          </div>
                          {m.notes && (
                            <div className="text-xs italic">"{m.notes}"</div>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {m.already_requested ? (
                          <Button variant="outline" disabled className="gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Request sent
                          </Button>
                        ) : (
                          <Button onClick={() => setConfirmTarget(m)}>Request swap</Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <AlertDialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send swap request?</AlertDialogTitle>
            <AlertDialogDescription>
              We'll email {confirmTarget?.first_name} your name, phone number, email and current test details so they can arrange the swap with you. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={requesting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequest} disabled={requesting}>
              {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Send request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
