import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tile, Pill, TileGrid } from "@/components/instructor/ui";

interface SlotOfferRow {
  id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  status: "open" | "filled" | "expired" | "cancelled";
  expires_at: string | null;
  pupil_id: string | null;
  recipient_count?: number;
  claimer_name?: string | null;
}

interface ActiveGapOffersListProps {
  instructorId: string;
}

const formatTime = (t: string) => {
  const [h, m] = t.split(":");
  const hh = parseInt(h, 10);
  const ampm = hh >= 12 ? "pm" : "am";
  const h12 = hh % 12 || 12;
  return `${h12}:${m}${ampm}`;
};

const formatDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

const useCountdown = (target: string | null) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return "expired";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

function OfferRow({ offer, onCancel }: { offer: SlotOfferRow; onCancel: (id: string) => void }) {
  const remaining = useCountdown(offer.status === "open" ? offer.expires_at : null);

  const title = `${formatDate(offer.lesson_date)} · ${formatTime(offer.start_time)}–${formatTime(offer.end_time)}`;
  const subtitleParts: string[] = [`${offer.recipient_count ?? 0} notified`];
  if (offer.status === "filled" && offer.claimer_name) subtitleParts.push(`Claimed by ${offer.claimer_name}`);
  const subtitle = subtitleParts.join(" · ");

  const eyebrow =
    offer.status === "open" && remaining
      ? remaining === "expired" ? "Expired" : `Expires in ${remaining}`
      : undefined;

  const pillColor: "amber" | "green" | "grey" =
    offer.status === "open" ? "amber" : offer.status === "filled" ? "green" : "grey";

  const trailing = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <Pill color={pillColor} label={offer.status} />
      {offer.status === "open" && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCancel(offer.id); }}
          style={{
            background: "transparent",
            border: "none",
            color: "#c9302c",
            fontSize: 11,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <XCircle size={12} /> Cancel
        </button>
      )}
    </div>
  );

  return (
    <Tile
      variant="list"
      icon="ti-bolt"
      iconColor={offer.status === "filled" ? "green" : offer.status === "open" ? "amber" : "grey"}
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      trailing={trailing}
      selected={offer.status === "filled" || offer.status === "expired" || offer.status === "cancelled"}
    />
  );
}

export function ActiveGapOffersList({ instructorId }: ActiveGapOffersListProps) {
  const [offers, setOffers] = useState<SlotOfferRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
    const { data: rows } = await supabase
      .from("slot_offers")
      .select("id, lesson_date, start_time, end_time, status, expires_at, pupil_id, created_at")
      .eq("instructor_id", instructorId)
      .in("status", ["open", "filled"])
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false });

    if (!rows) { setOffers([]); setLoading(false); return; }

    // Recipient counts
    const ids = rows.map((r) => r.id);
    const { data: recipientRows } = await supabase
      .from("slot_offer_recipients")
      .select("slot_offer_id")
      .in("slot_offer_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const counts = new Map<string, number>();
    (recipientRows ?? []).forEach((r) => {
      counts.set(r.slot_offer_id, (counts.get(r.slot_offer_id) ?? 0) + 1);
    });

    // Claimer names
    const claimerIds = rows.map((r) => r.pupil_id).filter((x): x is string => !!x);
    const claimers = new Map<string, string>();
    if (claimerIds.length) {
      const { data: pupilRows } = await supabase
        .from("pupils")
        .select("id, name")
        .in("id", claimerIds);
      (pupilRows ?? []).forEach((p) => claimers.set(p.id, p.name));
    }

    setOffers(rows.map((r) => ({
      ...r,
      status: r.status as SlotOfferRow["status"],
      recipient_count: counts.get(r.id) ?? 0,
      claimer_name: r.pupil_id ? claimers.get(r.pupil_id) ?? null : null,
    })));
    setLoading(false);
  };

  useEffect(() => {
    if (!instructorId) return;
    fetchOffers();

    const ch = supabase
      .channel(`gap-offers-${instructorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "slot_offers", filter: `instructor_id=eq.${instructorId}` }, fetchOffers)
      .on("postgres_changes", { event: "*", schema: "public", table: "slot_offer_recipients", filter: `instructor_id=eq.${instructorId}` }, fetchOffers)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const handleCancel = async (id: string) => {
    // Fetch active recipients first so we can notify them after cancel
    const { data: activeRecipients } = await supabase
      .from("slot_offer_recipients")
      .select("pupil_id, slot_offer:slot_offers!inner(lesson_date, start_time)")
      .eq("slot_offer_id", id)
      .is("claimed_at", null)
      .is("declined_at", null);

    const { error } = await supabase
      .from("slot_offers")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) { toast.error("Could not cancel offer"); return; }

    // Fire push notifications (best-effort, don't block UI)
    (activeRecipients ?? []).forEach((r: any) => {
      supabase.functions.invoke("notify-pupil", {
        body: {
          pupilId: r.pupil_id,
          type: "slot_offer_cancelled",
          data: {
            type: "slot_offer_cancelled",
            offer_id: id,
            date: r.slot_offer?.lesson_date,
            start_time: r.slot_offer?.start_time,
          },
        },
      }).catch((e) => console.error("[ActiveGapOffersList] notify-pupil cancel", e));
    });

    toast.success("Offer cancelled");
    fetchOffers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (offers.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-1">
        Active gap offers
      </h3>
      <div className="space-y-2">
        {offers.map((o) => <OfferRow key={o.id} offer={o} onCancel={handleCancel} />)}
      </div>
    </section>
  );
}
