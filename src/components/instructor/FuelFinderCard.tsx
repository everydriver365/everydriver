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
const brandColors: Record<string, { bg: string; text: string }> = {
  "Tesco": { bg: "bg-blue-500", text: "T" },
  "Sainsbury's": { bg: "bg-orange-500", text: "S" },
  "Asda": { bg: "bg-green-500", text: "A" },
  "Morrisons": { bg: "bg-yellow-500", text: "M" },
  "BP": { bg: "bg-green-600", text: "BP" },
  "Esso": { bg: "bg-blue-600", text: "E" },
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
      <div className={cn("px-4", className)}>
        <div className="bg-card rounded-xl border border-border p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error or no data state
  if (error || !cheapest) {
    return (
      <div className={cn("px-4", className)}>
        <div 
          className="bg-card rounded-xl border border-border p-4 cursor-pointer active:scale-[0.99] transition-transform"
          onClick={handleCardClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Fuel className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Cheapest Fuel</h3>
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

  const brandInfo = getBrandInfo(cheapest.brand);
  const primaryPrice = cheapest.prices.E10 || cheapest.prices.E5;

  return (
    <div className={cn("px-4", className)}>
      <div 
        className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="px-4 py-2 border-b border-border/50 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cheapest Fuel Nearby</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Main Content */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Brand Badge */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm",
              brandInfo.bg
            )}>
              {brandInfo.text}
            </div>

            {/* Station Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">
                  {formatPrice(primaryPrice)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {cheapest.prices.E10 ? "E10" : "E5"}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground truncate">
                {cheapest.name}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{cheapest.distance_miles.toFixed(1)} miles away</span>
                {cheapest.prices.B7 && (
                  <>
                    <span className="mx-1">•</span>
                    <span>Diesel {formatPrice(cheapest.prices.B7)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Navigate Button */}
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate(cheapest);
              }}
            >
              <Navigation className="h-4 w-4" />
              Go
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
