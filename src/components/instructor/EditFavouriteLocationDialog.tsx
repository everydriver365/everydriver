import { useState, useEffect } from "react";
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

interface FavouriteLocation {
  id: string;
  name: string;
  category: string;
  address: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  notes: string | null;
  is_favorite: boolean | null;
}

interface EditFavouriteLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: FavouriteLocation;
  onSaved?: () => void;
}

export function EditFavouriteLocationDialog({
  open,
  onOpenChange,
  location,
  onSaved
}: EditFavouriteLocationDialogProps) {
  const [name, setName] = useState(location.name);
  const [category, setCategory] = useState(location.category);
  const [postcode, setPostcode] = useState(location.postcode || "");
  const [address, setAddress] = useState(location.address || "");
  const [notes, setNotes] = useState(location.notes || "");
  const [isFavorite, setIsFavorite] = useState(location.is_favorite || false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ 
    lat: location.latitude, 
    lng: location.longitude 
  });

  // Reset form when location changes
  useEffect(() => {
    setName(location.name);
    setCategory(location.category);
    setPostcode(location.postcode || "");
    setAddress(location.address || "");
    setNotes(location.notes || "");
    setIsFavorite(location.is_favorite || false);
    setCoords({ lat: location.latitude, lng: location.longitude });
  }, [location]);

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
      
      // Auto-populate full address from postcode data if address is empty
      const addressParts = [
        data.result.parish,
        data.result.admin_ward,
        data.result.admin_district,
        data.result.region
      ].filter(Boolean);
      
      if (addressParts.length > 0 && !address.trim()) {
        setAddress(addressParts.join(', '));
      }
      
      toast.success("Location updated!");
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
      toast.error("Please verify the postcode");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("favourite_locations")
        .update({
          name: name.trim(),
          category,
          address: address.trim() || null,
          postcode: postcode.trim() || null,
          latitude: coords.lat,
          longitude: coords.lng,
          notes: notes.trim() || null,
          is_favorite: isFavorite
        })
        .eq("id", location.id);

      if (error) throw error;

      toast.success("Location updated");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Edit Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-location-name">Name *</Label>
            <Input
              id="edit-location-name"
              placeholder="e.g., Tolworth Test Centre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
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
            <Label htmlFor="edit-postcode">Postcode</Label>
            <div className="flex gap-2">
              <Input
                id="edit-postcode"
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
            <Label htmlFor="edit-address">Full Address (optional)</Label>
            <Input
              id="edit-address"
              placeholder="123 High Street, London"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes (optional)</Label>
            <Textarea
              id="edit-notes"
              placeholder="Any helpful notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-is-favorite">Mark as favourite</Label>
            <Switch
              id="edit-is-favorite"
              checked={isFavorite}
              onCheckedChange={setIsFavorite}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
