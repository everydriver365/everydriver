import { useEffect, useState } from "react";
import { format, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// DVSA Trigger thresholds (mirrors StandardsCheckTrigger.tsx)
export const DVSA_THRESHOLDS = {
  minorFaults: 5,
  seriousFaults: 0.5,
  physicalAction: 10,
  passRate: 55,
};

export interface DvsaTriggerSnapshot {
  loading: boolean;
  totalTests: number;
  avgMinorFaults: number;
  avgSeriousFaults: number;
  physicalActionRate: number;
  passRate: number;
  triggers: {
    minorFaults: boolean;
    seriousFaults: boolean;
    physicalAction: boolean;
    passRate: boolean;
  };
  triggersCount: number;
  standardsCheckRequired: boolean;
}

const EMPTY: DvsaTriggerSnapshot = {
  loading: true,
  totalTests: 0,
  avgMinorFaults: 0,
  avgSeriousFaults: 0,
  physicalActionRate: 0,
  passRate: 0,
  triggers: { minorFaults: false, seriousFaults: false, physicalAction: false, passRate: false },
  triggersCount: 0,
  standardsCheckRequired: false,
};

/**
 * Read-only DVSA trigger metrics for the banner. Does not write to
 * instructor_standards_check — the full StandardsCheckTrigger component
 * remains the single writer.
 */
export function useStandardsCheckMetrics(instructorId: string | undefined, refreshKey?: unknown) {
  const [snapshot, setSnapshot] = useState<DvsaTriggerSnapshot>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    if (!instructorId) return;

    (async () => {
      try {
        const periodEnd = new Date();
        const periodStart = subMonths(periodEnd, 12);
        const { data, error } = await supabase
          .from("driving_test_results")
          .select("total_minor_faults,total_serious_faults,total_dangerous_faults,examiner_took_action,result")
          .eq("instructor_id", instructorId)
          .eq("is_mock", false)
          .gte("test_date", format(periodStart, "yyyy-MM-dd"))
          .lte("test_date", format(periodEnd, "yyyy-MM-dd"));

        if (error) throw error;
        if (cancelled) return;

        const results = data || [];
        const total = results.length;
        if (total === 0) {
          setSnapshot({ ...EMPTY, loading: false });
          return;
        }

        const minorSum = results.reduce((s, r) => s + (r.total_minor_faults || 0), 0);
        const seriousSum = results.reduce(
          (s, r) => s + (r.total_serious_faults || 0) + (r.total_dangerous_faults || 0),
          0
        );
        const physical = results.filter((r) => r.examiner_took_action).length;
        const passes = results.filter((r) => r.result === "pass").length;

        const avgMinorFaults = minorSum / total;
        const avgSeriousFaults = seriousSum / total;
        const physicalActionRate = (physical / total) * 100;
        const passRate = (passes / total) * 100;

        const triggers = {
          minorFaults: avgMinorFaults >= DVSA_THRESHOLDS.minorFaults,
          seriousFaults: avgSeriousFaults >= DVSA_THRESHOLDS.seriousFaults,
          physicalAction: physicalActionRate >= DVSA_THRESHOLDS.physicalAction,
          passRate: passRate <= DVSA_THRESHOLDS.passRate,
        };
        const triggersCount = Object.values(triggers).filter(Boolean).length;

        setSnapshot({
          loading: false,
          totalTests: total,
          avgMinorFaults,
          avgSeriousFaults,
          physicalActionRate,
          passRate,
          triggers,
          triggersCount,
          standardsCheckRequired: triggersCount >= 3,
        });
      } catch (e) {
        console.error("useStandardsCheckMetrics", e);
        if (!cancelled) setSnapshot({ ...EMPTY, loading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [instructorId, refreshKey]);

  return snapshot;
}
