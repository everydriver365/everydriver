import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInHours, format } from "date-fns";
import { PoundSterling, ArrowLeftRight, CalendarPlus, UserCheck, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSoonestPendingOffer } from "./useSoonestPendingOffer";
import { useGapSuggestions } from "./useGapSuggestions";
import { useChurnRiskScores } from "./useChurnRiskScore";

export type NextActionTone = "amber" | "blue" | "green" | "purple";

export interface NextBestAction {
  rank: number;
  title: string;
  subtitle: string;
  verb: string;
  icon: LucideIcon;
  tone: NextActionTone;
  iconBg: string;
  iconFg: string;
  /** Soft tinted background gradient start for the hero card. */
  cardBg: string;
  /** Hairline border tint. */
  cardBorder: string;
  onPress: () => void;
  snoozeKey: string;
}

interface OutstandingDebt {
  pupilId: string;
  pupilName: string;
  amount: number;
  lastLessonDate: string | null;
}

const SNOOZE_PREFIX = "dsm:next-action-snooze";

function isSnoozed(key: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(key);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < 24 * 60 * 60 * 1000;
}

/**
 * Composes existing hooks into a single highest-priority "do this next"
 * action. Returns null when nothing actionable surfaces.
 */
export function useNextBestAction(instructorId: string | undefined): NextBestAction | null {
  const navigate = useNavigate();

  // Rank 1 — outstanding pupil debt (>= £20 in last 7 days)
  const [debt, setDebt] = useState<OutstandingDebt | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!instructorId) {
      setDebt(null);
      return;
    }
    (async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data } = await supabase
        .from("pupils")
        .select("id, name, account_balance")
        .eq("instructor_id", instructorId)
        .lt("account_balance", -20) // owes more than £20
        .order("account_balance", { ascending: true })
        .limit(1);
      if (cancelled) return;
      const row = data?.[0] as any;
      if (!row) {
        setDebt(null);
        return;
      }
      setDebt({
        pupilId: row.id,
        pupilName: row.name,
        amount: Math.abs(Number(row.account_balance)),
        lastLessonDate: null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  // Rank 2 — pending swap offer expiring soon
  const { data: pendingOffer } = useSoonestPendingOffer(instructorId);

  // Rank 3 — gap suggestions
  const { data: gaps } = useGapSuggestions(instructorId);

  // Rank 4 — churn risk (re-engage)
  const { riskScores } = useChurnRiskScores(instructorId ?? null);

  return useMemo<NextBestAction | null>(() => {
    // Rank 1
    if (debt && debt.amount >= 20) {
      const key = `${SNOOZE_PREFIX}:debt:${debt.pupilId}`;
      if (!isSnoozed(key)) {
        return {
          rank: 1,
          title: `Chase £${debt.amount.toFixed(0)} from ${debt.pupilName}`,
          subtitle: "Outstanding balance",
          verb: "Chase",
          icon: PoundSterling,
          tone: "amber",
          iconBg: "rgba(184,128,31,0.10)",
          iconFg: "#B8801F",
          cardBg: "#FFF8EC",
          cardBorder: "rgba(184,128,31,0.22)",
          onPress: () => navigate(`/instructor/pay?pupilId=${debt.pupilId}`),
          snoozeKey: key,
        };
      }
    }

    // Rank 2
    if (pendingOffer) {
      const ageHours = differenceInHours(new Date(), new Date(pendingOffer.created_at));
      const remaining = Math.max(24 - ageHours, 1);
      if (ageHours < 24) {
        const key = `${SNOOZE_PREFIX}:offer:${pendingOffer.id}`;
        if (!isSnoozed(key)) {
          return {
            rank: 2,
            title: "Respond to swap offer",
            subtitle: `Expires in ~${remaining}h`,
            verb: "Respond",
            icon: ArrowLeftRight,
            tone: "blue",
            iconBg: "rgba(43,123,200,0.10)",
            iconFg: "#2B7BC8",
            cardBg: "#EFF6FF",
            cardBorder: "rgba(43,123,200,0.22)",
            onPress: () => navigate("/instructor/test-requests"),
            snoozeKey: key,
          };
        }
      }
    }

    // Rank 3 — gap with waiting pupils
    const usefulGap = (gaps ?? []).find(
      (g) => g.durationMinutes >= 90 && g.suggestedPupils.length > 0
    );
    if (usefulGap) {
      const key = `${SNOOZE_PREFIX}:gap:${usefulGap.date}`;
      if (!isSnoozed(key)) {
        return {
          rank: 3,
          title: `Offer ${format(new Date(usefulGap.date), "EEE d MMM")} gap`,
          subtitle: `${usefulGap.suggestedPupils.length} pupil${usefulGap.suggestedPupils.length === 1 ? "" : "s"} could fill it`,
          verb: "Offer",
          icon: CalendarPlus,
          tone: "green",
          iconBg: "rgba(59,139,59,0.10)",
          iconFg: "#3B8B3B",
          cardBg: "#EEF7EE",
          cardBorder: "rgba(59,139,59,0.22)",
          onPress: () => navigate("/instructor/gaps"),
          snoozeKey: key,
        };
      }
    }

    // Rank 4 — re-engage at-risk pupil
    const atRisk = riskScores.find((r) => r.riskLevel === "critical" || r.riskLevel === "high");
    if (atRisk) {
      const key = `${SNOOZE_PREFIX}:churn:${atRisk.pupilId}`;
      if (!isSnoozed(key)) {
        return {
          rank: 4,
          title: `Re-engage ${atRisk.pupilName}`,
          subtitle: atRisk.factors[0] ?? "At risk of dropping off",
          verb: "Re-engage",
          icon: UserCheck,
          tone: "purple",
          iconBg: "rgba(138,91,201,0.10)",
          iconFg: "#8A5BC9",
          cardBg: "#F5EFFB",
          cardBorder: "rgba(138,91,201,0.22)",
          onPress: () => navigate(`/instructor/pupils/${atRisk.pupilId}`),
          snoozeKey: key,
        };
      }
    }

    return null;
  }, [debt, pendingOffer, gaps, riskScores, navigate]);
}

export function snoozeNextBestAction(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(Date.now()));
}
