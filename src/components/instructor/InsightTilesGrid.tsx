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
    <TileGrid variant="refined">
      <Tile
        variant="refined"
        id="fill-gaps"
        title="Fill gaps"
        icon={CalendarPlus}
        onClick={() => navigate("/instructor/gaps")}
        subtitle={
          fillGapsCount > 0
            ? `${fillGapsCount} open ${fillGapsCount === 1 ? "slot" : "slots"}`
            : "No open slots"
        }
      />
      <Tile
        variant="refined"
        id="vehicle-health"
        title="Vehicle health"
        icon={Car}
        onClick={() => navigate("/instructor/vehicle-health")}
        subtitle={
          faultCount > 0
            ? `${faultCount} ${faultCount === 1 ? "fault" : "faults"} detected`
            : "All clear"
        }
        liveDot={faultCount > 0}
      />
      <Tile
        variant="refined"
        id="smart-nudges"
        title="Smart nudges"
        icon={Sparkles}
        onClick={() => navigate("/instructor/nudges")}
        subtitle={
          nudgesCount > 0
            ? `${nudgesCount} ${nudgesCount === 1 ? "tip" : "tips"} ready`
            : "No suggestions"
        }
      />
      <Tile
        variant="refined"
        id="re-engage"
        title="Re-engage"
        icon={UserCheck}
        onClick={() => navigate("/instructor/dormant-pupils")}
        subtitle={
          dormantCount > 0
            ? `${dormantCount} dormant ${dormantCount === 1 ? "pupil" : "pupils"}`
            : "All caught up"
        }
        liveDot={dormantCount > 0}
      />
    </TileGrid>
  );
}
