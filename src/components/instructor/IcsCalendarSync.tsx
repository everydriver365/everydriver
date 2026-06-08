import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, RefreshCw, Trash2, RotateCcw, ExternalLink, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";


interface Props {
  instructorId: string;
}

interface Subscription {
  id: string;
  url: string;
  label: string | null;
  is_active: boolean;
  last_polled_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_event_count: number | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function IcsCalendarSync({ instructorId }: Props) {
  const qc = useQueryClient();
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [polling, setPolling] = useState(false);

  // Token for outbound feed
  const tokenQuery = useQuery({
    queryKey: ["calendar-feed-token", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("calendar_feed_token")
        .eq("id", instructorId)
        .maybeSingle();
      if (error) throw error;
      return data?.calendar_feed_token ?? null;
    },
  });

  const subsQuery = useQuery({
    queryKey: ["ics-subscriptions", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_ics_subscriptions")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Subscription[];
    },
  });

  const feedUrl = useMemo(() => {
    const token = tokenQuery.data;
    if (!token) return "";
    return `${SUPABASE_URL}/functions/v1/instructor-calendar-feed?token=${token}`;
  }, [tokenQuery.data]);

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
    } catch {
      toast.error("Copy failed");
    }
  }

  async function rotateToken() {
    if (!confirm("Rotate calendar feed URL? Your calendar app will need re-subscribing.")) return;
    const token = crypto.getRandomValues(new Uint8Array(32));
    const hex = Array.from(token).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase
      .from("instructors")
      .update({ calendar_feed_token: hex })
      .eq("id", instructorId);
    if (error) return toast.error("Could not rotate URL");
    toast.success("URL rotated");
    qc.invalidateQueries({ queryKey: ["calendar-feed-token", instructorId] });
  }

  async function addSubscription() {
    const url = newUrl.trim();
    if (!url) return;
    if (!/^https?:\/\/|^webcal:\/\//i.test(url)) {
      toast.error("URL must start with https:// or webcal://");
      return;
    }
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from("instructor_ics_subscriptions")
        .insert({
          instructor_id: instructorId,
          url,
          label: newLabel.trim() || null,
          is_active: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      setNewUrl("");
      setNewLabel("");
      qc.invalidateQueries({ queryKey: ["ics-subscriptions", instructorId] });
      // Trigger immediate poll for this subscription
      void supabase.functions.invoke("poll-ics-subscriptions", {
        body: { subscriptionId: data.id },
      }).then(() => qc.invalidateQueries({ queryKey: ["ics-subscriptions", instructorId] }));
      toast.success("Calendar added — fetching events…");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function removeSubscription(id: string) {
    if (!confirm("Remove this calendar? Its busy events will be cleared from your availability.")) return;
    // Remove rows first
    await supabase
      .from("instructor_calendar_events")
      .delete()
      .eq("instructor_id", instructorId)
      .like("external_event_id", `ics:${id}:%`);
    const { error } = await supabase
      .from("instructor_ics_subscriptions")
      .delete()
      .eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["ics-subscriptions", instructorId] });
    toast.success("Calendar removed");
  }

  async function refreshAll() {
    setPolling(true);
    try {
      await supabase.functions.invoke("poll-ics-subscriptions", {
        body: { instructorId },
      });
      await new Promise((r) => setTimeout(r, 1500));
      qc.invalidateQueries({ queryKey: ["ics-subscriptions", instructorId] });
      toast.success("Refreshed");
    } finally {
      setPolling(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Outbound */}
      <Card className="p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold">Show your lessons in Google / Apple / Outlook</h3>
          <p className="text-sm text-muted-foreground">
            Copy your private DSM calendar link, then paste it once into your calendar app.
            New lessons appear automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Input value={feedUrl} readOnly className="font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={() => copy(feedUrl, "Feed URL")} title="Copy">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={rotateToken} title="Rotate URL">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">How to add this in Google Calendar / Apple / Outlook</summary>
          <div className="pt-2 space-y-2">
            <p><b>Google Calendar (web):</b> Other calendars → <b>+</b> → <b>From URL</b> → paste → Add.</p>
            <p><b>Apple (iPhone):</b> Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar → paste.</p>
            <p><b>Outlook (web):</b> Calendar → Add calendar → Subscribe from web → paste → Import.</p>
            <p>Your app polls on its own schedule (Google: a few hours; Apple: ~15 min).</p>
          </div>
        </details>
      </Card>

      {/* Inbound */}
      <Card className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">Block bookings around your personal events</h3>
            <p className="text-sm text-muted-foreground">
              Paste the secret iCal address of any calendar you want DSM to treat as busy.
              We poll every 5 minutes.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={polling}>
            <RefreshCw className={`h-4 w-4 mr-1 ${polling ? "animate-spin" : ""}`} />
            Refresh now
          </Button>
        </div>

        <div className="grid sm:grid-cols-[1fr_auto] gap-2">
          <div className="space-y-2">
            <Input
              placeholder="Label (e.g. Personal, Family)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Input
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <Button onClick={addSubscription} disabled={adding || !newUrl.trim()} className="self-end">
            Add calendar
          </Button>
        </div>

        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Where to find this in Google Calendar</summary>
          <div className="pt-2 space-y-1">
            <p>Google Calendar → click ⋯ next to your calendar → <b>Settings and sharing</b> → scroll to <b>Secret address in iCal format</b> → copy.</p>
            <p className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <a className="underline" href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noreferrer">
                Open Google Calendar settings
              </a>
            </p>
          </div>
        </details>

        <div className="space-y-2">
          {subsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (subsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No calendars added yet.</p>
          ) : (
            (subsQuery.data ?? []).map((s) => <SubRow key={s.id} sub={s} onRemove={removeSubscription} />)
          )}
        </div>
      </Card>
    </div>
  );
}

function SubRow({ sub, onRemove }: { sub: Subscription; onRemove: (id: string) => void }) {
  const status = sub.last_status;
  const Icon =
    status === "ok" ? CheckCircle2 : status === "error" ? AlertCircle : Clock;
  const colour =
    status === "ok" ? "text-green-600" : status === "error" ? "text-red-600" : "text-muted-foreground";
  return (
    <div className="border rounded-xl p-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 shrink-0 ${colour}`} />
          <span className="font-medium truncate">{sub.label || "Calendar"}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate font-mono mt-1">{sub.url}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {sub.last_polled_at
            ? `Last poll ${new Date(sub.last_polled_at).toLocaleString()} · ${sub.last_event_count ?? 0} events`
            : "Not yet polled"}
          {sub.last_error ? ` · ${sub.last_error}` : ""}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onRemove(sub.id)} title="Remove">
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
