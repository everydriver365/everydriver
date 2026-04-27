import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Truck, MapPin, Clock } from "lucide-react";

interface Offer {
  id: string;
  lesson_start: string;
  lesson_duration_minutes: number;
  lesson_price: number | null;
  pickup_postcode: string | null;
  notes: string | null;
  finders_fee_pct: number;
}

export default function CoverMarketplace() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    // RLS limits to offers where the user is a recipient
    const { data } = await supabase
      .from("cover_offers")
      .select("id, lesson_start, lesson_duration_minutes, lesson_price, pickup_postcode, notes, finders_fee_pct")
      .eq("status", "open")
      .order("lesson_start", { ascending: true });
    setOffers((data ?? []) as Offer[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const claim = async (id: string) => {
    setClaiming(id);
    const { data, error } = await supabase.functions.invoke("cover-offer-claim", { body: { offer_id: id } });
    setClaiming(null);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Failed to claim");
    } else {
      toast.success("Lesson claimed — added to your schedule.");
      await load();
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Truck className="h-7 w-7" /> Cover Marketplace</h1>
        <p className="text-muted-foreground">Lessons offered by nearby instructors. First to claim wins.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : offers.length === 0 ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">No open cover offers in your area.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <Card key={o.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>£{Number(o.lesson_price ?? 0).toFixed(0)} · {o.lesson_duration_minutes}min lesson</span>
                  <Badge variant="secondary">Fee {o.finders_fee_pct}%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(o.lesson_start).toLocaleString("en-GB")}</span>
                  {o.pickup_postcode && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {o.pickup_postcode}</span>}
                </div>
                {o.notes && <p className="text-xs text-muted-foreground">{o.notes}</p>}
                <Button size="sm" onClick={() => claim(o.id)} disabled={claiming === o.id} className="w-full">
                  {claiming === o.id ? "Claiming…" : "Claim this lesson"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
