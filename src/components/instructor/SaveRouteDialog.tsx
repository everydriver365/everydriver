import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bookmark, MapPin } from "lucide-react";

interface SaveRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  telematicsId: string;
  startLocation?: string;
  endLocation?: string;
  distanceKm?: number;
  onSaved?: () => void;
}

export function SaveRouteDialog({
  open,
  onOpenChange,
  instructorId,
  telematicsId,
  startLocation,
  endLocation,
  distanceKm,
  onSaved
}: SaveRouteDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a route name");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("saved_routes")
        .insert({
          instructor_id: instructorId,
          telematics_id: telematicsId,
          name: name.trim(),
          description: description.trim() || null,
          route_type: "recorded",
          start_location: startLocation || null,
          end_location: endLocation || null,
          distance_km: distanceKm || null
        });

      if (error) throw error;

      toast.success("Route saved successfully");
      setName("");
      setDescription("");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error("Failed to save route");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Save Route
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              placeholder="Add notes about this route..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {(startLocation || endLocation || distanceKm) && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              {startLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Start:</span>
                  <span className="truncate">{startLocation}</span>
                </div>
              )}
              {endLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">End:</span>
                  <span className="truncate">{endLocation}</span>
                </div>
              )}
              {distanceKm && (
                <div className="text-muted-foreground">
                  Distance: {distanceKm.toFixed(1)} km
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Route"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
