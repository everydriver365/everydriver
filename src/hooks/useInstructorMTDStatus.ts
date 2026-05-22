import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getCurrentTaxYear,
  getNextDeadline,
  getQuarterForDate,
  type NextDeadline,
} from "@/lib/mtdDeadlines";

export interface InstructorMTDStatus {
  enrolled: boolean;
  loading: boolean;
  error: string | null;
  nextDeadline: NextDeadline | null;
  currentQuarterSubmitted: boolean;
}

const INITIAL: InstructorMTDStatus = {
  enrolled: false,
  loading: true,
  error: null,
  nextDeadline: null,
  currentQuarterSubmitted: false,
};

/**
 * Reads the instructor's MTD enrolment from `mtd_instructor_settings`. When
 * enrolled, computes the next quarterly filing deadline dynamically and
 * checks `mtd_quarterly_periods` for whether the current quarter has been
 * submitted. Never invents data — missing row = not submitted.
 */
export function useInstructorMTDStatus(instructorId: string | undefined): InstructorMTDStatus {
  const [state, setState] = useState<InstructorMTDStatus>(INITIAL);

  useEffect(() => {
    if (!instructorId) {
      setState({ ...INITIAL, loading: false });
      return;
    }
    let cancelled = false;
    (async () => {
      const settingsRes = await supabase
        .from("mtd_instructor_settings")
        .select("is_mtd_enrolled")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (cancelled) return;

      if (settingsRes.error) {
        setState({
          ...INITIAL,
          loading: false,
          error: settingsRes.error.message,
        });
        return;
      }

      const enrolled = settingsRes.data?.is_mtd_enrolled === true;
      if (!enrolled) {
        setState({ ...INITIAL, loading: false, enrolled: false });
        return;
      }

      const now = new Date();
      const nextDeadline = getNextDeadline(now);
      const taxYear = getCurrentTaxYear(now);
      const currentQuarter = getQuarterForDate(now);

      const periodRes = await supabase
        .from("mtd_quarterly_periods")
        .select("status")
        .eq("instructor_id", instructorId)
        .eq("tax_year", taxYear)
        .eq("quarter", currentQuarter)
        .maybeSingle();

      if (cancelled) return;

      const currentQuarterSubmitted = periodRes.data?.status === "submitted";

      setState({
        enrolled: true,
        loading: false,
        error: periodRes.error ? periodRes.error.message : null,
        nextDeadline,
        currentQuarterSubmitted,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  return state;
}
