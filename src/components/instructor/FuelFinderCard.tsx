import { Fuel, Navigation, MapPin, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFuelPrices, FuelStation } from "@/hooks/useFuelPrices";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface FuelFinderCardProps {
  instructorId: string | undefined;
  className?: string;
}

const brandColors: Record<string, { bg: string; text: string }> = {
  "Tesco": { bg: "bg-primary", text: "T" },
  "Sainsbury's": { bg: "bg-orange-500", text: "S" },
  "Asda": { bg: "bg-green-500", text: "A" },
  "Morrisons": { bg: "bg-yellow-500", text: "M" },
  "BP": { bg: "bg-green-600", text: "BP" },
  "Esso": { bg: "bg-primary", text: "E" },
  "Shell": { bg: "bg-red-500", text: "SH" },
  "JET": { bg: "bg-purple-500", text: "J" },
  "Motor Fuel Group": { bg: "bg-slate-600", text: "MFG" },
  "Rontec": { bg: "bg-red-600", text: "R" },
  "SGN": { bg: "bg-teal-500", text: "SG" },
  "Ascona": { bg: "bg-indigo-500", text: "AS" },
};

function getBrandInfo(brand: string): { bg: string; text: string } {
  return brandColors[brand] || { bg: "bg-primary", text: brand.charAt(0) };
}

function formatPrice(price: number | undefined): string {
  if (!price) return "—";
  return `${price.toFixed(1)}p`;
}

interface StationRowProps {
  station: FuelStation;
  type: "cheapest" | "nearest";
  badges?: string[];
  onNavigate: (station: FuelStation) => void;
}

function StationRow({ station, type, badges, onNavigate }: StationRowProps) {
  const brandInfo = getBrandInfo(station.brand);
  const primaryPrice = station.prices.E10 || station.prices.E5;
  const isGreen = !badges && type === "cheapest";
  const isBlue = !badges && type === "nearest";

  return (
    <div className={cn(
      "px-4 py-3",
      isGreen && "bg-emerald-50/50",
      isBlue && "bg-primary/5",
      badges && "bg-gradient-to-r from-emerald-50/40 to-primary/5"
    )}>
      {/* Badge row */}
      <div className="flex items-center gap-1.5 mb-1.5">
        {(badges || [type === "cheapest" ? "Cheapest" : "Nearest"]).map((b) => (
          <span
            key={b}
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded",
              b === "Cheapest" && "bg-emerald-100 text-emerald-700",
              b === "Nearest" && "bg-primary/10 text-primary"
            )}
          >
            {b}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Brand Badge */}
        <div className={cn(
          "w-9 h-9 rounded-none flex items-center justify-center text-white font-bold text-[10px] shadow-sm shrink-0",
          brandInfo.bg
        )}>
          {brandInfo.text}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            {type === "cheapest" || badges ? (
              <>
                <span className="text-lg font-bold text-foreground">{formatPrice(primaryPrice)}</span>
                <span className="text-[11px] text-muted-foreground">{station.prices.E10 ? "E10" : "E5"}</span>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-foreground">{station.distance_miles.toFixed(1)} mi</span>
                <span className="text-[11px] text-muted-foreground">away</span>
              </>
            )}
          </div>
          <p className="text-xs font-medium text-foreground truncate">{station.name}</p>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            {type === "cheapest" || badges ? (
              <span>{station.distance_miles.toFixed(1)} mi away</span>
            ) : (
              <span>{formatPrice(primaryPrice)} {station.prices.E10 ? "E10" : "E5"}</span>
            )}
            {station.prices.B7 && (
              <>
                <span className="mx-0.5">•</span>
                <span>Diesel {formatPrice(station.prices.B7)}</span>
              </>
            )}
          </div>
        </div>

        {/* Go button */}
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 shrink-0 h-8 px-2.5 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(station);
          }}
        >
          <Navigation className="h-3.5 w-3.5" />
          Go
        </Button>
      </div>
    </div>
  );
}

export function FuelFinderCard({ instructorId, className }: FuelFinderCardProps) {
  const navigate = useNavigate();
  const { cheapest, nearest, loading, error, refetch } = useFuelPrices(instructorId);

  const handleNavigate = (station: FuelStation) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(mapsUrl, "_blank");
  };

  const handleCardClick = () => {
    navigate("/instructor/fuel");
  };

  const isSameStation = cheapest && nearest && cheapest.lat === nearest.lat && cheapest.lng === nearest.lng;

  if (loading) {
    return (
      <div className={cn("", className)}>
        <div className="bg-white rounded-none p-4 animate-pulse shadow-[0_2px_8px_rgba(20,37,66,0.08)] border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-28 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!cheapest && !nearest)) {
    return (
      <div className={cn("", className)}>
        <div
          className="bg-white rounded-none p-4 cursor-pointer active:scale-[0.99] transition-transform shadow-[0_2px_8px_rgba(20,37,66,0.08)] border border-border"
          onClick={handleCardClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Fuel className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Fuel Finder</h3>
                <p className="text-xs text-muted-foreground">
                  {error ? "Unable to load prices" : "No stations found nearby"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <div
        className="bg-white rounded-none overflow-hidden cursor-pointer active:scale-[0.99] transition-transform shadow-[0_2px_8px_rgba(20,37,66,0.08)] border border-border"
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center">
              <Fuel className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-foreground">Fuel Finder</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Station rows */}
        {isSameStation ? (
          <StationRow
            station={cheapest}
            type="cheapest"
            badges={["Cheapest", "Nearest"]}
            onNavigate={handleNavigate}
          />
        ) : (
          <>
            {cheapest && (
              <StationRow station={cheapest} type="cheapest" onNavigate={handleNavigate} />
            )}
            {nearest && (
              <div className={cn(cheapest && "border-t border-gray-100")}>
                <StationRow station={nearest} type="nearest" onNavigate={handleNavigate} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
