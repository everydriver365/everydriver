import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Loader2, Search } from "lucide-react";

interface AddFavouriteLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  onSaved?: () => void;
}

export function AddFavouriteLocationDialog({
  open,
  onOpenChange,
  instructorId,
  onSaved
}: AddFavouriteLocationDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const lookupPostcode = async () => {
    if (!postcode.trim()) {
      toast.error("Please enter a postcode");
      return;
    }

    setLookingUp(true);
    try {
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s/g, ''))}`
      );
      
      if (!response.ok) {
        toast.error("Invalid postcode");
        return;
      }

      const data = await response.json();
      if (!data.result) {
        toast.error("Postcode not found");
        return;
      }

      setCoords({ lat: data.result.latitude, lng: data.result.longitude });
      setPostcode(data.result.postcode);
      toast.success("Location found!");
    } catch (error) {
      console.error("Postcode lookup error:", error);
      toast.error("Failed to look up postcode");
    } finally {
      setLookingUp(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a location name");
      return;
    }

    if (!coords) {
      toast.error("Please look up the postcode first");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("favourite_locations")
        .insert({
          instructor_id: instructorId,
          name: name.trim(),
          category,
          address: address.trim() || null,
          postcode: postcode.trim() || null,
          latitude: coords.lat,
          longitude: coords.lng,
          notes: notes.trim() || null,
          is_favorite: isFavorite
        });

      if (error) throw error;

      toast.success("Location saved");
      resetForm();
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("other");
    setPostcode("");
    setAddress("");
    setNotes("");
    setIsFavorite(false);
    setCoords(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Add Favourite Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="location-name">Name *</Label>
            <Input
              id="location-name"
              placeholder="e.g., Tolworth Test Centre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test_centre">Test Centre</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="pupil_home">Pupil Home</SelectItem>
                <SelectItem value="meeting_point">Meeting Point</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postcode">Postcode *</Label>
            <div className="flex gap-2">
              <Input
                id="postcode"
                placeholder="SW1A 1AA"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookupPostcode()}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={lookupPostcode}
                disabled={lookingUp}
              >
                {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {coords && (
              <p className="text-xs text-green-600">✓ Location verified</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Full Address (optional)</Label>
            <Input
              id="address"
              placeholder="123 High Street, London"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any helpful notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is-favorite">Mark as favorite</Label>
            <Switch
              id="is-favorite"
              checked={isFavorite}
              onCheckedChange={setIsFavorite}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !coords}>
            {saving ? "Saving..." : "Save Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
