import { useState } from "react";
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
  const { cheapest, nearest, loading, error, refetch } = useFuelPrices(instructorId);
  const [mode, setMode] = useState<"cheapest" | "nearest">("cheapest");

  const displayStation = mode === "cheapest" ? cheapest : nearest;

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
      <div className={cn("", className)}>
         <div className="bg-white rounded-xl p-4 animate-pulse shadow-[0_2px_8px_rgba(20,37,66,0.08)] border border-border">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
               <div className="h-4 w-20 bg-gray-200 rounded" />
               <div className="h-3 w-28 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error or no data state
  if (error || (!cheapest && !nearest)) {
    return (
      <div className={cn("", className)}>
        <div 
           className="bg-white rounded-xl p-4 cursor-pointer active:scale-[0.99] transition-transform shadow-[0_2px_8px_rgba(20,37,66,0.08)] border border-border"
          onClick={handleCardClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
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

  const brandInfo = displayStation ? getBrandInfo(displayStation.brand) : null;
  const primaryPrice = displayStation?.prices.E10 || displayStation?.prices.E5;

  return (
    <div className={cn("", className)}>
      <div 
           className="bg-white rounded-xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform shadow-[0_2px_8px_rgba(20,37,66,0.08)] border border-border"
        onClick={handleCardClick}
      >
        {/* Header with Mode Toggle */}
           <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center">
              <Fuel className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            {/* Mode Toggle Buttons */}
            <div className="flex rounded-md overflow-hidden border border-border/50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("cheapest");
                }}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
                  mode === "cheapest" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                Cheapest
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("nearest");
                }}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
                  mode === "nearest" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                Nearest
              </button>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Main Content */}
        {displayStation && brandInfo && (
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
                  {mode === "cheapest" ? (
                    <>
                      <span className="text-xl font-bold text-foreground">
                        {formatPrice(primaryPrice)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {displayStation.prices.E10 ? "E10" : "E5"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-foreground">
                        {displayStation.distance_miles.toFixed(1)} mi
                      </span>
                      <span className="text-xs text-muted-foreground">away</span>
                    </>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground truncate">
                  {displayStation.name}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {mode === "cheapest" ? (
                    <>
                      <span>{displayStation.distance_miles.toFixed(1)} miles away</span>
                      {displayStation.prices.B7 && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Diesel {formatPrice(displayStation.prices.B7)}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <span>{formatPrice(primaryPrice)} {displayStation.prices.E10 ? "E10" : "E5"}</span>
                      {displayStation.prices.B7 && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Diesel {formatPrice(displayStation.prices.B7)}</span>
                        </>
                      )}
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
                  handleNavigate(displayStation);
                }}
              >
                <Navigation className="h-4 w-4" />
                Go
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
