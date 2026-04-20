import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Phone, Globe, ShieldCheck, Wrench } from "lucide-react";

interface Garage {
  id: string;
  name: string;
  city: string | null;
  postcode: string | null;
  phone: string | null;
  website: string | null;
  services: string[];
  motability_approved: boolean;
  verified: boolean;
  description: string | null;
}

export default function AccessibleGarages() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [motabilityOnly, setMotabilityOnly] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("accessible_garages")
        .select("*")
        .order("name");
      setGarages((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = garages.filter((g) => {
    if (motabilityOnly && !g.motability_approved) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${g.name} ${g.city || ""} ${g.postcode || ""} ${(g.services || []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <AccessibleLayout>
      <SEOHead title="Adapted vehicle garages — Drive365 Accessible" description="UK directory of WAV converters, hand-control fitters and Motability garages." />

      <section className="border-b bg-secondary/30 py-8">
        <div className="container max-w-5xl">
          <h1 className="mb-2 text-3xl font-bold">Adapted vehicle garages</h1>
          <p className="mb-4 text-muted-foreground">UK specialists in wheelchair conversion, hand controls and Motability servicing.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input placeholder="Search by name, city, postcode or service" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Badge
              variant={motabilityOnly ? "default" : "outline"}
              className="cursor-pointer self-start"
              onClick={() => setMotabilityOnly(!motabilityOnly)}
            >
              <ShieldCheck className="mr-1 h-3 w-3" /> Motability only
            </Badge>
          </div>
        </div>
      </section>

      <section className="container max-w-5xl py-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((g) => (
              <Card key={g.id} className="p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">{g.name}</h3>
                    {(g.city || g.postcode) && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {[g.city, g.postcode].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  {g.motability_approved && (
                    <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Motability</Badge>
                  )}
                </div>
                {g.description && <p className="mb-3 text-sm text-muted-foreground">{g.description}</p>}
                {g.services?.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {g.services.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        <Wrench className="mr-1 h-3 w-3" /> {s}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {g.phone && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${g.phone}`}><Phone className="mr-2 h-3 w-3" /> {g.phone}</a>
                    </Button>
                  )}
                  {g.website && (
                    <Button asChild size="sm" variant="outline">
                      <a href={g.website} target="_blank" rel="noopener noreferrer"><Globe className="mr-2 h-3 w-3" /> Visit website</a>
                    </Button>
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
