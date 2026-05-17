import { useEffect, useState } from "react";
import { Users, MapPin, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  instructors: number | null;
  areas: number | null;
  courses: number | null;
}

/**
 * Live trust strip showing real DB counts.
 * Per project rules: no hardcoded fallbacks — if a count is null we hide
 * that tile rather than invent a number.
 */
export function HomepageLiveStats() {
  const [stats, setStats] = useState<Stats>({ instructors: null, areas: null, courses: null });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ count: instructors }, areasRes, { count: courses }] = await Promise.all([
        supabase.from("public_instructors").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("public_instructors").select("home_postcode").eq("is_active", true),
        supabase.from("course_templates").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

      const areaSet = new Set<string>();
      (areasRes.data ?? []).forEach((r: { home_postcode: string | null }) => {
        const match = r.home_postcode?.match(/^[A-Za-z]+/);
        if (match) areaSet.add(match[0].toUpperCase());
      });

      if (!cancelled) {
        setStats({
          instructors: instructors ?? null,
          areas: areaSet.size || null,
          courses: courses ?? null,
        });
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return null;

  const tiles = [
    { icon: Users, value: stats.instructors, label: "DVSA-approved instructors", suffix: "+" },
    { icon: MapPin, value: stats.areas, label: "UK postcode areas covered", suffix: "" },
    { icon: GraduationCap, value: stats.courses, label: "Course options to choose from", suffix: "" },
  ].filter((t) => t.value !== null);

  if (tiles.length === 0) return null;

  return (
    <section className="bg-background py-6 sm:py-8 border-b border-border/40">
      <div className="container">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {tiles.map(({ icon: Icon, value, label, suffix }) => (
            <div
              key={label}
              className="flex items-center gap-3 sm:gap-4 rounded-2xl bg-card/50 px-3 py-3 sm:px-5 sm:py-4"
            >
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold text-foreground leading-none">
                  {value!.toLocaleString("en-GB")}
                  {suffix}
                </div>
                <div className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-tight">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
