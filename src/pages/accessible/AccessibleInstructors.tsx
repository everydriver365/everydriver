import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccessibleLayout } from "@/components/accessible/AccessibleLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AccessibilityBadges } from "@/components/accessible/AccessibilityBadges";
import { Loader2, Search, MapPin } from "lucide-react";

interface Instructor {
  id: string;
  name: string;
  profile_image_url: string | null;
  home_postcode: string | null;
  hourly_rate: number | null;
  adaptations: string[];
  disability_experience: string[];
  bsl_signing: boolean;
  motability_friendly: boolean;
  accessibility_bio: string | null;
}

const ADAPTATION_TAGS = ["hand controls", "left-foot accelerator", "steering ball", "automatic only", "wheelchair stowage"];
const EXPERIENCE_TAGS = ["physical", "BSL", "autism/ADHD", "anxiety", "stroke recovery"];

export default function AccessibleInstructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [postcode, setPostcode] = useState("");
  const [bslOnly, setBslOnly] = useState(false);
  const [motabilityOnly, setMotabilityOnly] = useState(false);
  const [adaptation, setAdaptation] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("id,name,profile_image_url,home_postcode,hourly_rate,adaptations,disability_experience,bsl_signing,motability_friendly,accessibility_bio")
        .eq("accessibility_enabled", true)
        .order("name");
      setInstructors((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = instructors.filter((i) => {
    if (bslOnly && !i.bsl_signing) return false;
    if (motabilityOnly && !i.motability_friendly) return false;
    if (adaptation && !(i.adaptations || []).includes(adaptation)) return false;
    if (postcode && !(i.home_postcode || "").toLowerCase().includes(postcode.toLowerCase())) return false;
    return true;
  });

  return (
    <AccessibleLayout>
      <SEOHead title="Accessible driving instructors — Drive365" description="Find driving instructors with adapted vehicles, BSL signing and disability experience." />

      <section className="border-b bg-secondary/30 py-8">
        <div className="container max-w-5xl">
          <h1 className="mb-4 text-3xl font-bold">Accessible instructors</h1>
          <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm sm:flex-row">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => {}} className="gap-2"><Search className="h-4 w-4" /> Search</Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant={bslOnly ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setBslOnly(!bslOnly)}
            >
              BSL signing
            </Badge>
            <Badge
              variant={motabilityOnly ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setMotabilityOnly(!motabilityOnly)}
            >
              Motability friendly
            </Badge>
            {ADAPTATION_TAGS.map((a) => (
              <Badge
                key={a}
                variant={adaptation === a ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setAdaptation(adaptation === a ? null : a)}
              >
                {a}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="container max-w-5xl py-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
            No accessible instructors match your filters yet. Try widening your search.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((i) => (
              <Card key={i.id} className="p-4">
                <div className="flex gap-4">
                  {i.profile_image_url ? (
                    <img src={i.profile_image_url} alt={i.name} className="h-16 w-16 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                      {i.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{i.name}</h3>
                    <p className="text-sm text-muted-foreground">{i.home_postcode || "UK"}{i.hourly_rate ? ` · £${i.hourly_rate}/hr` : ""}</p>
                    {i.accessibility_bio && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{i.accessibility_bio}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <AccessibilityBadges
                    adaptations={i.adaptations}
                    experience={i.disability_experience}
                    bsl={i.bsl_signing}
                    motability={i.motability_friendly}
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to={`/i/${i.id}`}>View profile</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link to={`/book/${i.id}`}>Book</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </AccessibleLayout>
  );
}
