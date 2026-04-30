import { useNavigate } from "react-router-dom";
import { CalendarPlus, Car, Sparkles, UserCheck } from "lucide-react";
import { InstructorTile, InstructorTileGrid } from "./InstructorTile";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { useDormantPupilsCount } from "@/hooks/useDormantPupilsCount";
import { useSmartNudgesCount } from "@/hooks/useSmartNudgesCount";
import { useDemoMode } from "@/context/DemoModeContext";
import { demoStats } from "@/data/demoModeData";

interface InsightTilesGridProps {
  instructorId?: string;
  gapCount?: number;
}

export function InsightTilesGrid({ instructorId, gapCount = 0 }: InsightTilesGridProps) {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();

  const { devices } = useVehicleHealth();
  const liveFaultCount = devices.flatMap((d) => d.last_fault_codes || []).length;

  const { data: liveDormantCount = 0 } = useDormantPupilsCount(
    isDemoMode ? undefined : instructorId
  );
  const { data: liveNudgesCount = 0 } = useSmartNudgesCount(
    isDemoMode ? undefined : instructorId
  );

  const faultCount = isDemoMode ? demoStats.vehicleFaults : liveFaultCount;
  const dormantCount = isDemoMode ? demoStats.dormantPupils : liveDormantCount;
  const nudgesCount = isDemoMode ? demoStats.smartNudges : liveNudgesCount;
  const fillGapsCount = isDemoMode ? 2 : gapCount;

  return (
    <InstructorTileGrid>
      <InstructorTile
        icon={CalendarPlus}
        title="Fill gaps"
        category="schedule"
        onPress={() => navigate("/instructor/gaps")}
        count={fillGapsCount > 0 ? fillGapsCount : undefined}
        badgeVariant="green"
        subtitle={
          fillGapsCount > 0
            ? `${fillGapsCount} open ${fillGapsCount === 1 ? "slot" : "slots"} this week`
            : "No open slots this week"
        }
      />
      <InstructorTile
        icon={Car}
        title="Vehicle health"
        category="location"
        onPress={() => navigate("/instructor/vehicle-health")}
        count={faultCount > 0 ? faultCount : undefined}
        badgeVariant="red"
        subtitle={
          faultCount > 0
            ? `${faultCount} fault${faultCount === 1 ? "" : "s"} detected`
            : "All clear"
        }
        liveDot={faultCount > 0}
      />
      <InstructorTile
        icon={Sparkles}
        title="Smart tips"
        category="insights"
        onPress={() => navigate("/instructor/nudges")}
        count={nudgesCount > 0 ? nudgesCount : undefined}
        badgeVariant="purple"
        subtitle={
          nudgesCount > 0
            ? `${nudgesCount} suggestion${nudgesCount === 1 ? "" : "s"} ready`
            : "No suggestions"
        }
      />
      <InstructorTile
        icon={UserCheck}
        title="Needs attention"
        category="money"
        onPress={() => navigate("/instructor/dormant-pupils")}
        count={dormantCount > 0 ? dormantCount : undefined}
        badgeVariant="amber"
        subtitle={
          dormantCount > 0
            ? `${dormantCount} dormant ${dormantCount === 1 ? "pupil" : "pupils"}`
            : "All caught up"
        }
        liveDot={dormantCount > 0}
      />
    </InstructorTileGrid>
  );
}
