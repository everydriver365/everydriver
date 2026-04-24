import { useNavigate } from "react-router-dom";
import { CalendarPlus, Car, Sparkles, UserCheck } from "lucide-react";
import { Tile, TileGrid } from "./Tile";
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

  // Live data sources
  const { devices } = useVehicleHealth();
  const liveFaultCount = devices.flatMap((d) => d.last_fault_codes || []).length;

  const { data: liveDormantCount = 0 } = useDormantPupilsCount(
    isDemoMode ? undefined : instructorId
  );
  const { data: liveNudgesCount = 0 } = useSmartNudgesCount(
    isDemoMode ? undefined : instructorId
  );

  // Demo override
  const faultCount = isDemoMode ? demoStats.vehicleFaults : liveFaultCount;
  const dormantCount = isDemoMode ? demoStats.dormantPupils : liveDormantCount;
  const nudgesCount = isDemoMode ? demoStats.smartNudges : liveNudgesCount;
  const fillGapsCount = isDemoMode ? 2 : gapCount;

  return (
    <TileGrid>
      <Tile
        id="fill-gaps"
        title="Fill gaps"
        icon={CalendarPlus}
        onClick={() => navigate("/instructor/gaps")}
        metricValue={fillGapsCount > 0 ? fillGapsCount : undefined}
        metricUnit={fillGapsCount > 0 ? "open" : undefined}
        subtitle={fillGapsCount > 0 ? undefined : "No open slots"}
      />
      <Tile
        id="vehicle-health"
        title="Vehicle health"
        icon={Car}
        onClick={() => navigate("/instructor/vehicle-health")}
        metricValue={faultCount > 0 ? faultCount : undefined}
        metricUnit={faultCount > 0 ? (faultCount === 1 ? "fault" : "faults") : undefined}
        subtitle={faultCount > 0 ? undefined : "All clear"}
        liveDot={faultCount > 0}
      />
      <Tile
        id="smart-nudges"
        title="Smart nudges"
        icon={Sparkles}
        onClick={() => navigate("/instructor/nudges")}
        metricValue={nudgesCount > 0 ? nudgesCount : undefined}
        metricUnit={nudgesCount > 0 ? (nudgesCount === 1 ? "tip" : "tips") : undefined}
        subtitle={nudgesCount > 0 ? undefined : "No suggestions"}
      />
      <Tile
        id="re-engage"
        title="Re-engage"
        icon={UserCheck}
        onClick={() => navigate("/instructor/dormant-pupils")}
        metricValue={dormantCount > 0 ? dormantCount : undefined}
        metricUnit={dormantCount > 0 ? "dormant" : undefined}
        subtitle={dormantCount > 0 ? undefined : "All caught up"}
        liveDot={dormantCount > 0}
      />
    </TileGrid>
  );
}
