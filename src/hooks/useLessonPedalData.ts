import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PedalDataPoint {
  recorded_at: string;
  brake_pedal_pct: number | null;
  gear_position: number | null;
}

export interface BrakeAnalysis {
  smoothnessScore: number; // 0-100
  harshBrakeCount: number; // sudden 0→80%+ jumps
  avgBrakePressure: number;
  maxBrakePressure: number;
  brakeApplicationCount: number;
}

export interface GearAnalysis {
  reverseManoeuvreCount: number;
  avgReverseDurationSec: number;
  totalReverseSec: number;
  gearDistribution: Record<number, number>; // gear -> seconds spent
  gearChangeCount: number;
}

export interface PedalAnalysisResult {
  rawData: PedalDataPoint[];
  brake: BrakeAnalysis;
  gear: GearAnalysis;
}

function analyseBrakeData(data: PedalDataPoint[]): BrakeAnalysis {
  const brakePoints = data.filter(d => d.brake_pedal_pct != null);
  if (brakePoints.length < 2) {
    return { smoothnessScore: 100, harshBrakeCount: 0, avgBrakePressure: 0, maxBrakePressure: 0, brakeApplicationCount: 0 };
  }

  let harshCount = 0;
  let applicationCount = 0;
  let totalPressure = 0;
  let maxPressure = 0;
  let totalDelta = 0;

  for (let i = 1; i < brakePoints.length; i++) {
    const prev = brakePoints[i - 1].brake_pedal_pct!;
    const curr = brakePoints[i].brake_pedal_pct!;
    const delta = curr - prev;

    totalPressure += curr;
    if (curr > maxPressure) maxPressure = curr;

    // Harsh brake: jump from <20% to >80% in one interval
    if (prev < 20 && curr > 80) harshCount++;

    // Count distinct brake applications (transition from <5% to >10%)
    if (prev < 5 && curr > 10) applicationCount++;

    totalDelta += Math.abs(delta);
  }

  // Smoothness: penalise large average deltas and harsh events
  const avgDelta = totalDelta / (brakePoints.length - 1);
  const smoothnessScore = Math.max(0, Math.min(100, Math.round(
    100 - (avgDelta * 2) - (harshCount * 15)
  )));

  return {
    smoothnessScore,
    harshBrakeCount: harshCount,
    avgBrakePressure: Math.round(totalPressure / brakePoints.length),
    maxBrakePressure: Math.round(maxPressure),
    brakeApplicationCount: applicationCount,
  };
}

function analyseGearData(data: PedalDataPoint[]): GearAnalysis {
  const gearPoints = data.filter(d => d.gear_position != null);
  if (gearPoints.length < 2) {
    return { reverseManoeuvreCount: 0, avgReverseDurationSec: 0, totalReverseSec: 0, gearDistribution: {}, gearChangeCount: 0 };
  }

  const distribution: Record<number, number> = {};
  let reverseManoeuvres = 0;
  let totalReverseSec = 0;
  let currentReverseStart: Date | null = null;
  let gearChanges = 0;

  for (let i = 0; i < gearPoints.length; i++) {
    const gear = gearPoints[i].gear_position!;
    const time = new Date(gearPoints[i].recorded_at);

    // Time delta to next point (or estimate 10s for last point)
    const nextTime = i < gearPoints.length - 1
      ? new Date(gearPoints[i + 1].recorded_at)
      : new Date(time.getTime() + 10000);
    const durationSec = (nextTime.getTime() - time.getTime()) / 1000;

    distribution[gear] = (distribution[gear] || 0) + Math.min(durationSec, 30); // cap at 30s per interval

    // Track reverse manoeuvres (gear = -1 or 0 depending on device encoding)
    const isReverse = gear === -1 || gear === 0;
    if (isReverse && !currentReverseStart) {
      currentReverseStart = time;
      reverseManoeuvres++;
    } else if (!isReverse && currentReverseStart) {
      totalReverseSec += (time.getTime() - currentReverseStart.getTime()) / 1000;
      currentReverseStart = null;
    }

    // Count gear changes
    if (i > 0 && gearPoints[i - 1].gear_position !== gear) {
      gearChanges++;
    }
  }

  // Close open reverse manoeuvre
  if (currentReverseStart && gearPoints.length > 0) {
    const lastTime = new Date(gearPoints[gearPoints.length - 1].recorded_at);
    totalReverseSec += (lastTime.getTime() - currentReverseStart.getTime()) / 1000;
  }

  return {
    reverseManoeuvreCount: reverseManoeuvres,
    avgReverseDurationSec: reverseManoeuvres > 0 ? Math.round(totalReverseSec / reverseManoeuvres) : 0,
    totalReverseSec: Math.round(totalReverseSec),
    gearDistribution: distribution,
    gearChangeCount: gearChanges,
  };
}

export function useLessonPedalData(telematicsId: string | undefined) {
  return useQuery<PedalAnalysisResult>({
    queryKey: ["lesson-pedal-data", telematicsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_pedal_data")
        .select("recorded_at, brake_pedal_pct, gear_position")
        .eq("telematics_id", telematicsId!)
        .order("recorded_at", { ascending: true });

      if (error) throw error;

      const points: PedalDataPoint[] = (data || []).map(d => ({
        recorded_at: d.recorded_at,
        brake_pedal_pct: d.brake_pedal_pct != null ? Number(d.brake_pedal_pct) : null,
        gear_position: d.gear_position,
      }));

      return {
        rawData: points,
        brake: analyseBrakeData(points),
        gear: analyseGearData(points),
      };
    },
    enabled: !!telematicsId,
    staleTime: 10 * 60 * 1000,
  });
}
