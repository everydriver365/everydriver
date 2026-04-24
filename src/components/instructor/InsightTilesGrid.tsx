import { useNavigate } from "react-router-dom";
import { CalendarPlus, Car, Sparkles, UserCheck } from "lucide-react";
import { Tile, TileGrid } from "./Tile";

interface InsightTilesGridProps {
  gapCount?: number;
}

export function InsightTilesGrid({ gapCount = 0 }: InsightTilesGridProps) {
  const navigate = useNavigate();

  return (
    <TileGrid>
      <Tile
        id="fill-gaps"
        title="Fill gaps"
        icon={CalendarPlus}
        onClick={() => navigate("/instructor/gaps")}
        metricValue={gapCount}
        metricUnit="open"
      />
      <Tile
        id="vehicle-health"
        title="Vehicle health"
        icon={Car}
        onClick={() => navigate("/instructor/vehicle-health")}
        subtitle="View status"
      />
      <Tile
        id="smart-nudges"
        title="Smart nudges"
        icon={Sparkles}
        onClick={() => navigate("/instructor/nudges")}
        subtitle="Suggested actions"
      />
      <Tile
        id="re-engage"
        title="Re-engage"
        icon={UserCheck}
        onClick={() => navigate("/instructor/dormant-pupils")}
        subtitle="Dormant pupils"
        liveDot
      />
    </TileGrid>
  );
}
