import { useState } from "react";
import { 
  Fuel, 
  Navigation, 
  MapPin, 
  RefreshCw,
  Filter,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useFuelPrices, FuelStation } from "@/hooks/useFuelPrices";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";

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

function createStationIcon(price: number | undefined, isNearest: boolean, isCheapest: boolean) {
  const priceText = price ? `${Math.round(price)}` : "—";
  const bgColor = isCheapest ? "#22c55e" : isNearest ? "#3b82f6" : "#f59e0b";
  const ringColor = isCheapest ? "#86efac" : isNearest ? "#93c5fd" : "#fcd34d";
  
  return divIcon({
    className: "fuel-marker",
    html: `
      <div style="position: relative;">
        <div style="padding: 4px 8px; border-radius: 8px; color: white; font-size: 12px; font-weight: bold; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); min-width: 40px; text-align: center;
          background-color: ${bgColor}; ${(isCheapest || isNearest) ? `box-shadow: 0 0 0 2px ${ringColor};` : ""}">
          ${priceText}
        </div>
        <div style="position: absolute; left: 50%; transform: translateX(-50%); 
          width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent;
          border-top: 4px solid ${bgColor};"></div>
      </div>
    `,
    iconSize: [50, 30],
    iconAnchor: [25, 30],
  });
}

function StationCard({ 
  station, 
  fuelType,
  isCheapest, 
  isNearest,
  onNavigate 
}: { 
  station: FuelStation;
  fuelType: string;
  isCheapest: boolean;
  isNearest: boolean;
  onNavigate: (station: FuelStation) => void;
}) {
  const price = station.prices[fuelType as keyof typeof station.prices];
  
  return (
    <div className={cn(
      "bg-card rounded-xl border p-4 flex items-center gap-3",
      isCheapest && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
      isNearest && !isCheapest && "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shrink-0",
        getBrandColor(station.brand)
      )}>
        {station.brand.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground text-sm truncate">{station.name}</h3>
          {isCheapest && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5">
              <TrendingDown className="h-3 w-3 mr-0.5" />
              Cheapest
            </Badge>
          )}
          {isNearest && !isCheapest && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5">
              Nearest
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="h-3 w-3" />
          <span>{station.distance_miles.toFixed(1)} mi</span>
          {station.postcode && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span>{station.postcode}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xl font-bold text-foreground">{formatPrice(price)}</div>
        <div className="text-[10px] text-muted-foreground uppercase">{fuelType}</div>
      </div>
      <Button
        size="icon"
        variant="secondary"
        className="shrink-0 h-10 w-10"
        onClick={() => onNavigate(station)}
      >
        <Navigation className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function InstructorFuel() {
  const { instructor } = useInstructorAuth();
  const { 
    stations, 
    cheapest, 
    nearest, 
    loading, 
    error, 
    refetch, 
    location,
    fuelType,
    setFuelType,
    useDeviceLocation,
    setUseDeviceLocation,
    locating,
  } = useFuelPrices(instructor?.id);
  
  const [activeTab, setActiveTab] = useState("list");

  const handleNavigate = (station: FuelStation) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(mapsUrl, "_blank");
  };

  const mapCenter = cheapest 
    ? [cheapest.lat, cheapest.lng] as [number, number]
    : [52.4862, -1.8904] as [number, number];

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Fuel className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            Fuel Finder
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              localStorage.removeItem("fuel_prices_cache");
              refetch();
            }}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {location && (
          <p className="text-xs text-muted-foreground">{location}</p>
        )}

        {/* Fuel Type Selector */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Fuel type:</span>
          <div className="flex gap-1">
            {["E10", "E5", "B7"].map((type) => (
              <Button
                key={type}
                size="sm"
                variant={fuelType === type ? "default" : "outline"}
                className="h-7 px-3 text-xs"
                onClick={() => setFuelType(type)}
              >
                {type === "B7" ? "Diesel" : type}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center">
            <Fuel className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Finding cheapest fuel nearby...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 text-center">
            <Fuel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {error === "No postcode configured"
                ? "Set your home postcode to find the cheapest fuel near you."
                : error === "Could not geocode postcode"
                  ? "We couldn't locate that postcode — please check it in settings."
                  : error}
            </p>
            <div className="flex items-center justify-center gap-2">
              {(error === "No postcode configured" || error === "Could not geocode postcode") && (
                <Button asChild>
                  <a href="/instructor/settings">Open settings</a>
                </Button>
              )}
              <Button variant="outline" onClick={refetch}>Try again</Button>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && stations.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="space-y-3">
              {nearest && (
                <div className="bg-card rounded-xl border bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 border-blue-200/50 dark:border-blue-800/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md",
                      getBrandColor(nearest.brand)
                    )}>
                      {nearest.brand.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Nearest</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{nearest.name}</p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-lg font-bold text-foreground">
                          {nearest.distance_miles.toFixed(1)} mi
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatPrice(nearest.prices[fuelType as keyof typeof nearest.prices] || nearest.prices.E10)}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                      onClick={() => handleNavigate(nearest)}
                    >
                      <Navigation className="h-4 w-4" />
                      Go
                    </Button>
                  </div>
                </div>
              )}

              {cheapest && (
                <div className="bg-card rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/50 dark:border-green-800/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md",
                      getBrandColor(cheapest.brand)
                    )}>
                      {cheapest.brand.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <TrendingDown className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Cheapest</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{cheapest.name}</p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-lg font-bold text-foreground">
                          {formatPrice(cheapest.prices[fuelType as keyof typeof cheapest.prices] || cheapest.prices.E10)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {cheapest.distance_miles.toFixed(1)} mi away
                        </span>
                      </div>
                    </div>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      onClick={() => handleNavigate(cheapest)}
                    >
                      <Navigation className="h-4 w-4" />
                      Go
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs for List/Map */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="list" className="flex-1">List</TabsTrigger>
                <TabsTrigger value="map" className="flex-1">Map</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-4 space-y-3">
                {stations.map((station, index) => (
                  <StationCard
                    key={`${station.brand}-${station.postcode}-${index}`}
                    station={station}
                    fuelType={fuelType}
                    isCheapest={cheapest?.lat === station.lat && cheapest?.lng === station.lng}
                    isNearest={nearest?.lat === station.lat && nearest?.lng === station.lng}
                    onNavigate={handleNavigate}
                  />
                ))}
              </TabsContent>

              <TabsContent value="map" className="mt-4">
                <div className="h-[400px] rounded-xl overflow-hidden border border-border">
                  <MapContainer
                    center={mapCenter}
                    zoom={12}
                    className="h-full w-full"
                    scrollWheelZoom={false}
                  >
                    <TileLayer url={getMapTileUrl()} attribution={getMapAttribution()} />
                    {stations.map((station, index) => {
                      const price = station.prices[fuelType as keyof typeof station.prices];
                      const isCheapest = cheapest?.lat === station.lat && cheapest?.lng === station.lng;
                      const isNearest = nearest?.lat === station.lat && nearest?.lng === station.lng;
                      
                      return (
                        <Marker
                          key={`${station.brand}-${station.postcode}-${index}`}
                          position={[station.lat, station.lng]}
                          icon={createStationIcon(price, isNearest && !isCheapest, isCheapest)}
                        >
                          <Popup>
                            <div className="p-2">
                              <h3 className="font-semibold">{station.name}</h3>
                              <p className="text-sm text-muted-foreground">{station.brand}</p>
                              <p className="text-lg font-bold mt-1">{formatPrice(price)}</p>
                              <p className="text-xs text-muted-foreground">{station.distance_miles.toFixed(1)} mi away</p>
                              <Button
                                size="sm"
                                className="mt-2 w-full gap-1"
                                onClick={() => handleNavigate(station)}
                              >
                                <Navigation className="h-3 w-3" />
                                Navigate
                              </Button>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </TabsContent>
            </Tabs>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Prices from UK CMA scheme • Updated every 30 minutes
              </p>
            </div>
          </>
        )}

        {/* No Results */}
        {!loading && !error && stations.length === 0 && (
          <div className="p-8 text-center">
            <Fuel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No fuel stations found within 15km</p>
            <p className="text-xs text-muted-foreground mt-2">
              Try setting your home postcode in settings
            </p>
          </div>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
