import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BADGE_DEFINITIONS, PUPIL_FACING_BADGES, type BadgeKey } from "@/constants/rewardsConfig";

interface Props {
  instructorId: string;
  className?: string;
}

interface BadgeRow { badge_key: string; is_permanent: boolean }

/**
 * Drive 365 branded badge strip shown on the instructor's public mini-website.
 * Only renders pupil-facing badges (PUPIL_FACING_BADGES). Champion badges
 * persist across seasons (is_permanent=true).
 */
export function Drive365BadgeStrip({ instructorId, className }: Props) {
  const [keys, setKeys] = useState<Set<BadgeKey>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seasonYear = new Date().getUTCFullYear();
      const { data } = await supabase
        .from("instructor_badges")
        .select("badge_key, is_permanent, season_year")
        .eq("instructor_id", instructorId)
        .or(`season_year.eq.${seasonYear},is_permanent.eq.true`);

      if (cancelled) return;
      const set = new Set<BadgeKey>();
      ((data as BadgeRow[]) ?? []).forEach((r) => {
        if (PUPIL_FACING_BADGES.includes(r.badge_key as BadgeKey)) {
          set.add(r.badge_key as BadgeKey);
        }
      });
      setKeys(set);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [instructorId]);

  if (!loaded || keys.size === 0) return null;

  const visible = BADGE_DEFINITIONS.filter((b) => keys.has(b.key));

  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
        Drive 365 Verified
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map((b) => (
          <div
            key={b.key}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-amber-200 shadow-sm text-xs font-semibold text-slate-800"
            title={b.condition}
          >
            <span>{b.emoji}</span>
            <span>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
