import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, MapPin, Loader2 } from "lucide-react";

interface RouteUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  onUploaded?: () => void;
}

interface ParsedWaypoint {
  latitude: number;
  longitude: number;
  name?: string;
}

export function RouteUploader({ open, onOpenChange, instructorId, onUploaded }: RouteUploaderProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [waypoints, setWaypoints] = useState<ParsedWaypoint[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseGPX = (content: string): ParsedWaypoint[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/xml");
    const points: ParsedWaypoint[] = [];

    // Parse track points
    const trkpts = doc.querySelectorAll("trkpt");
    trkpts.forEach((pt) => {
      const lat = parseFloat(pt.getAttribute("lat") || "0");
      const lon = parseFloat(pt.getAttribute("lon") || "0");
      if (lat && lon) {
        points.push({ latitude: lat, longitude: lon });
      }
    });

    // Parse waypoints
    const wpts = doc.querySelectorAll("wpt");
    wpts.forEach((pt) => {
      const lat = parseFloat(pt.getAttribute("lat") || "0");
      const lon = parseFloat(pt.getAttribute("lon") || "0");
      const nameEl = pt.querySelector("name");
      if (lat && lon) {
        points.push({ 
          latitude: lat, 
          longitude: lon, 
          name: nameEl?.textContent || undefined 
        });
      }
    });

    // Parse route points
    const rtepts = doc.querySelectorAll("rtept");
    rtepts.forEach((pt) => {
      const lat = parseFloat(pt.getAttribute("lat") || "0");
      const lon = parseFloat(pt.getAttribute("lon") || "0");
      if (lat && lon) {
        points.push({ latitude: lat, longitude: lon });
      }
    });

    return points;
  };

  const parseKML = (content: string): ParsedWaypoint[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/xml");
    const points: ParsedWaypoint[] = [];

    // Parse coordinates from LineStrings
    const coordinates = doc.querySelectorAll("coordinates");
    coordinates.forEach((coordEl) => {
      const coords = coordEl.textContent?.trim().split(/\s+/) || [];
      coords.forEach((coord) => {
        const [lon, lat] = coord.split(",").map(parseFloat);
        if (lat && lon) {
          points.push({ latitude: lat, longitude: lon });
        }
      });
    });

    return points;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["gpx", "kml"].includes(extension || "")) {
      toast.error("Please upload a GPX or KML file");
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    try {
      const content = await selectedFile.text();
      let parsed: ParsedWaypoint[] = [];

      if (extension === "gpx") {
        parsed = parseGPX(content);
      } else if (extension === "kml") {
        parsed = parseKML(content);
      }

      if (parsed.length === 0) {
        toast.error("No valid coordinates found in file");
        setFile(null);
        return;
      }

      setWaypoints(parsed);
      toast.success(`Found ${parsed.length} points in route`);
      
      // Auto-fill name from filename if empty
      if (!name) {
        setName(selectedFile.name.replace(/\.(gpx|kml)$/i, ""));
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse file");
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const calculateDistance = (points: ParsedWaypoint[]): number => {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const R = 6371; // Earth's radius in km
      const dLat = (points[i].latitude - points[i - 1].latitude) * Math.PI / 180;
      const dLon = (points[i].longitude - points[i - 1].longitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + 
                Math.cos(points[i - 1].latitude * Math.PI / 180) * 
                Math.cos(points[i].latitude * Math.PI / 180) * 
                Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return total;
  };

  const handleUpload = async () => {
    if (!name.trim()) {
      toast.error("Please enter a route name");
      return;
    }

    if (waypoints.length === 0) {
      toast.error("Please upload a valid GPX or KML file");
      return;
    }

    setUploading(true);
    try {
      const distance = calculateDistance(waypoints);
      const startPoint = waypoints[0];
      const endPoint = waypoints[waypoints.length - 1];

      // Create the route
      const { data: route, error: routeError } = await supabase
        .from("saved_routes")
        .insert({
          instructor_id: instructorId,
          name: name.trim(),
          description: description.trim() || null,
          route_type: "uploaded",
          start_location: `${startPoint.latitude.toFixed(4)}, ${startPoint.longitude.toFixed(4)}`,
          end_location: `${endPoint.latitude.toFixed(4)}, ${endPoint.longitude.toFixed(4)}`,
          distance_km: Math.round(distance * 10) / 10
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Insert waypoints
      const waypointInserts = waypoints.map((wp, index) => ({
        route_id: route.id,
        sequence: index + 1,
        latitude: wp.latitude,
        longitude: wp.longitude,
        name: wp.name || null
      }));

      const { error: waypointsError } = await supabase
        .from("saved_route_waypoints")
        .insert(waypointInserts);

      if (waypointsError) throw waypointsError;

      toast.success("Route uploaded successfully");
      resetForm();
      onOpenChange(false);
      onUploaded?.();
    } catch (error) {
      console.error("Error uploading route:", error);
      toast.error("Failed to upload route");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setFile(null);
    setWaypoints([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Route
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Route File (GPX or KML)</Label>
            <div 
              className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx,.kml"
                onChange={handleFileChange}
                className="hidden"
              />
              {parsing ? (
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              ) : file ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{waypoints.length} points</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload GPX or KML file
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-name">Route Name *</Label>
            <Input
              id="route-name"
              placeholder="e.g., Test Centre Route A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-description">Description (optional)</Label>
            <Textarea
              id="route-description"
              placeholder="Notes about this route..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {waypoints.length > 0 && (
            <div className="bg-muted/50 rounded-2xl p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span>Start: {waypoints[0].latitude.toFixed(4)}, {waypoints[0].longitude.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span>End: {waypoints[waypoints.length - 1].latitude.toFixed(4)}, {waypoints[waypoints.length - 1].longitude.toFixed(4)}</span>
              </div>
              <div className="text-muted-foreground">
                Distance: ~{calculateDistance(waypoints).toFixed(1)} km
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || waypoints.length === 0}>
            {uploading ? "Uploading..." : "Upload Route"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
