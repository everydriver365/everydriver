import { useEffect, useState } from "react";
import { Users, MapPin, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live trust strip.
 * - Instructor count: live from DB (public_instructors).
 * - Postcode areas: full UK coverage (124 = total UK postcode areas).
 * - Course options: brand-level count across templates + instructor variants.
 */
const UK_POSTCODE_AREAS = 124;
const COURSE_OPTIONS = 15;

export function HomepageLiveStats() {
  const [instructors, setInstructors] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("public_instructors")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      if (!cancelled) setInstructors(count ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  if (instructors === null) return null;

  const tiles = [
    { icon: Users, value: instructors, label: "DVSA-approved instructors", suffix: "+" },
    { icon: MapPin, value: UK_POSTCODE_AREAS, label: "UK postcode areas covered", suffix: "" },
    { icon: GraduationCap, value: COURSE_OPTIONS, label: "Course options to choose from", suffix: "+" },
  ];

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
                  {value.toLocaleString("en-GB")}
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

