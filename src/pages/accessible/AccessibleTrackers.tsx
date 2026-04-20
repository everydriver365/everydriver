import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Radio, Check, ExternalLink, Wrench } from "lucide-react";

interface Tracker {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  features: string[];
  supports_adaptations: boolean;
  price_monthly: number | null;
  price_one_off: number | null;
  fitting_required: boolean;
  image_url: string | null;
  affiliate_url: string | null;
}

export default function AccessibleTrackers() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("accessible_trackers")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      setTrackers((data as any) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <AccessibleLayout>
      <SEOHead title="Trackers for adapted cars — Drive365 Accessible" description="Compare vehicle trackers suitable for adapted, Motability and disabled drivers." />

      <section className="border-b bg-secondary/30 py-8">
        <div className="container max-w-5xl">
          <h1 className="mb-2 text-3xl font-bold">Trackers for adapted cars</h1>
          <p className="text-muted-foreground">Vehicle trackers and dashcams that work with Motability and adapted vehicles — for safety, theft recovery and journey logging.</p>
        </div>
      </section>

      <section className="container max-w-5xl py-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trackers.map((t) => (
              <Card key={t.id} className="flex flex-col p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Radio className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">{t.brand}</p>
                  </div>
                </div>

                {t.description && <p className="mb-3 text-sm text-muted-foreground">{t.description}</p>}

                {t.features?.length > 0 && (
                  <ul className="mb-4 space-y-1.5 text-sm">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {t.supports_adaptations && <Badge variant="secondary" className="text-xs">Adaptation friendly</Badge>}
                  {t.fitting_required && <Badge variant="outline" className="gap-1 text-xs"><Wrench className="h-3 w-3" /> Fitting required</Badge>}
                </div>

                <div className="mt-auto">
                  {(t.price_monthly || t.price_one_off) && (
                    <p className="mb-2 text-lg font-bold">
                      {t.price_monthly ? `£${t.price_monthly}/mo` : `£${t.price_one_off}`}
                    </p>
                  )}
                  {t.affiliate_url ? (
                    <Button asChild className="w-full">
                      <a href={t.affiliate_url} target="_blank" rel="noopener noreferrer">
                        Learn more <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>Coming soon</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </AccessibleLayout>
  );
}
