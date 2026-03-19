import { usePupilRetentionAlerts } from "./usePupilRetentionAlerts";
import { useMemo } from "react";

export interface PupilChurnRisk {
  pupilId: string;
  pupilName: string;
  riskScore: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: string[];
}

export function useChurnRiskScores(instructorId: string | null) {
  const { alerts, loading } = usePupilRetentionAlerts(instructorId);

  const riskScores = useMemo((): PupilChurnRisk[] => {
    return alerts.map((alert) => {
      let score = 0;
      const factors: string[] = [];

      if (alert.reason === "no_booking") {
        score += Math.min(alert.daysSinceLastLesson * 2, 60);
        factors.push(`${alert.daysSinceLastLesson} days without a booking`);
      }

      if (alert.reason === "multiple_cancellations") {
        score += Math.min((alert.cancellationCount || 0) * 12, 50);
        factors.push(`${alert.cancellationCount} recent cancellations`);
      }

      if (alert.reason === "declining_frequency") {
        score += 30;
        factors.push("Declining lesson frequency");
      }

      if (alert.severity === "critical") score += 20;

      score = Math.min(score, 100);

      let riskLevel: PupilChurnRisk["riskLevel"] = "low";
      if (score >= 80) riskLevel = "critical";
      else if (score >= 55) riskLevel = "high";
      else if (score >= 30) riskLevel = "medium";

      return {
        pupilId: alert.pupilId,
        pupilName: alert.pupilName,
        riskScore: score,
        riskLevel,
        factors,
      };
    });
  }, [alerts]);

  return { riskScores, loading };
}
