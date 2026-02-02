import { Fuel, Navigation, MapPin, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFuelPrices, FuelStation } from "@/hooks/useFuelPrices";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface FuelFinderCardProps {
  instructorId: string | undefined;
  className?: string;
}

// Brand colors for visual identification
const brandColors: Record<string, string> = {
  "Tesco": "bg-blue-500",
  "Sainsbury's": "bg-orange-500",
  "Asda": "bg-green-500",
  "Morrisons": "bg-yellow-500",
  "BP": "bg-green-600",
  "Esso": "bg-blue-600",
  "Shell": "bg-yellow-400",
  "JET": "bg-purple-500",
  "Motor Fuel Group": "bg-gray-500",
  "Rontec": "bg-red-500",
  "SGN": "bg-teal-500",
  "Ascona": "bg-indigo-500",
};

function getBrandColor(brand: string): string {
  return brandColors[brand] || "bg-primary";
}

function formatPrice(price: number | undefined): string {
  if (!price) return "—";
  return `${price.toFixed(1)}p`;
}

export function FuelFinderCard({ instructorId, className }: FuelFinderCardProps) {
  const navigate = useNavigate();
  const { cheapest, loading, error, refetch, location } = useFuelPrices(instructorId);

  const handleNavigate = (station: FuelStation) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(mapsUrl, "_blank");
  };

  const handleCardClick = () => {
    navigate("/instructor/fuel");
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn("mx-4", className)}>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-200/50 dark:bg-amber-800/30" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-amber-200/50 dark:bg-amber-800/30 rounded" />
              <div className="h-3 w-32 bg-amber-200/50 dark:bg-amber-800/30 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error or no data state
  if (error || !cheapest) {
    return (
      <div className={cn("mx-4", className)}>
        <div 
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-4 cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Fuel className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Cheapest Fuel</h3>
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
    <div className={cn("mx-4", className)}>
      <div 
        className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-4 cursor-pointer active:scale-[0.99] transition-transform"
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-muted-foreground">CHEAPEST FUEL</span>
            {location && (
              <span className="text-xs text-muted-foreground/60">• {location}</span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Main Content */}
        <div className="flex items-center gap-3">
          {/* Brand Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md",
            getBrandColor(cheapest.brand)
          )}>
            {cheapest.brand.charAt(0)}
          </div>

          {/* Station Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(cheapest.prices.E10 || cheapest.prices.E5)}
              </span>
              <span className="text-xs text-muted-foreground font-medium">E10</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">
              {cheapest.name}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{cheapest.distance_miles.toFixed(1)} mi away</span>
            </div>
          </div>

          {/* Navigate Button */}
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate(cheapest);
            }}
          >
            <Navigation className="h-4 w-4" />
            Go
          </Button>
        </div>

        {/* Other Fuel Types */}
        {(cheapest.prices.B7 || cheapest.prices.E5) && (
          <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/30 flex items-center gap-4">
            {cheapest.prices.B7 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Diesel:</span>
                <span className="text-sm font-semibold text-foreground">{formatPrice(cheapest.prices.B7)}</span>
              </div>
            )}
            {cheapest.prices.E5 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">E5:</span>
                <span className="text-sm font-semibold text-foreground">{formatPrice(cheapest.prices.E5)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
