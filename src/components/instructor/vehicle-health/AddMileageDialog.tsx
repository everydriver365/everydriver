import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Briefcase, Home, MapPin } from "lucide-react";
import { useMileageLogs } from "@/hooks/useMileageLogs";

interface AddMileageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMileageDialog({ open, onOpenChange }: AddMileageDialogProps) {
  const { addManualEntry } = useMileageLogs();
  const [formData, setFormData] = useState({
    log_date: format(new Date(), "yyyy-MM-dd"),
    distance_miles: "",
    trip_type: "business" as "business" | "personal",
    purpose: "",
    start_location: "",
    end_location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const distanceMiles = parseFloat(formData.distance_miles);
    if (isNaN(distanceMiles) || distanceMiles <= 0) return;

    setIsSubmitting(true);
    try {
      // Convert miles to km for storage
      const distanceKm = distanceMiles / 0.621371;
      
      await addManualEntry.mutateAsync({
        log_date: formData.log_date,
        distance_km: distanceKm,
        trip_type: formData.trip_type,
        purpose: formData.purpose || undefined,
        start_location: formData.start_location || undefined,
        end_location: formData.end_location || undefined,
      });

      // Reset form
      setFormData({
        log_date: format(new Date(), "yyyy-MM-dd"),
        distance_miles: "",
        trip_type: "business",
        purpose: "",
        start_location: "",
        end_location: "",
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Mileage Entry</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="log_date">Date</Label>
              <Input
                id="log_date"
                type="date"
                value={formData.log_date}
                onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="distance_miles">Distance (miles)</Label>
              <Input
                id="distance_miles"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={formData.distance_miles}
                onChange={(e) => setFormData({ ...formData, distance_miles: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Trip Type</Label>
            <RadioGroup
              value={formData.trip_type}
              onValueChange={(v) => setFormData({ ...formData, trip_type: v as "business" | "personal" })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="business" id="business" />
                <Label htmlFor="business" className="flex items-center gap-1 cursor-pointer">
                  <Briefcase className="h-4 w-4 text-green-600" />
                  Business
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="personal" id="personal" />
                <Label htmlFor="personal" className="flex items-center gap-1 cursor-pointer">
                  <Home className="h-4 w-4 text-[#0075c9]" />
                  Personal
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose (optional)</Label>
            <Input
              id="purpose"
              placeholder="e.g. Driving lesson, Test centre visit"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_location" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> From
              </Label>
              <Input
                id="start_location"
                placeholder="Start location"
                value={formData.start_location}
                onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_location" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> To
              </Label>
              <Input
                id="end_location"
                placeholder="End location"
                value={formData.end_location}
                onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.distance_miles}>
              {isSubmitting ? "Adding..." : "Add Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
