import { useState, useEffect } from "react";
import { Camera, Car, Calendar, X, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VehicleToEdit {
  id: string;
  registration: string;
  make: string | null;
  model: string | null;
  year: number | null;
  transmission: string | null;
  current_odometer_km: number | null;
  mot_expiry: string | null;
  insurance_expiry: string | null;
  tax_expiry: string | null;
  next_service_due_km: number | null;
  is_primary: boolean;
  image_url?: string | null;
}

interface EditVehicleDialogProps {
  vehicle: VehicleToEdit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditVehicleDialog({ vehicle, open, onOpenChange, onSuccess }: EditVehicleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    registration: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    transmission: "manual" as "manual" | "automatic",
    current_odometer_km: 0,
    mot_expiry: "",
    insurance_expiry: "",
    tax_expiry: "",
    next_service_due_km: 0,
    is_primary: false,
  });

  // Populate form when vehicle changes
  useEffect(() => {
    if (vehicle) {
      setFormData({
        registration: vehicle.registration || "",
        make: vehicle.make || "",
        model: vehicle.model || "",
        year: vehicle.year || new Date().getFullYear(),
        transmission: (vehicle.transmission as "manual" | "automatic") || "manual",
        current_odometer_km: vehicle.current_odometer_km || 0,
        mot_expiry: vehicle.mot_expiry || "",
        insurance_expiry: vehicle.insurance_expiry || "",
        tax_expiry: vehicle.tax_expiry || "",
        next_service_due_km: vehicle.next_service_due_km || 0,
        is_primary: vehicle.is_primary || false,
      });
      setImagePreview(vehicle.image_url || null);
      setImageFile(null);
    }
  }, [vehicle]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = async () => {
    if (!vehicle?.id || !formData.registration.trim()) {
      toast.error("Please enter a registration number");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | null | undefined = undefined;

      // Upload new image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `vehicles/${vehicle.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("instructor-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("instructor-images")
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      } else if (imagePreview === null && vehicle.image_url) {
        // Image was removed
        imageUrl = null;
      }

      // Update vehicle
      const updateData: Record<string, any> = {
        registration: formData.registration.toUpperCase().replace(/\s/g, ""),
        make: formData.make || null,
        model: formData.model || null,
        year: formData.year || null,
        transmission: formData.transmission,
        current_odometer_km: formData.current_odometer_km || 0,
        mot_expiry: formData.mot_expiry || null,
        insurance_expiry: formData.insurance_expiry || null,
        tax_expiry: formData.tax_expiry || null,
        next_service_due_km: formData.next_service_due_km || null,
        is_primary: formData.is_primary,
      };

      if (imageUrl !== undefined) {
        updateData.image_url = imageUrl;
      }

      const { error } = await supabase
        .from("instructor_vehicles")
        .update(updateData)
        .eq("id", vehicle.id);

      if (error) throw error;

      toast.success("Vehicle updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as any).message)
          : "Failed to update vehicle";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicle?.id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("instructor_vehicles")
        .delete()
        .eq("id", vehicle.id);

      if (error) throw error;

      toast.success("Vehicle deleted");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("Failed to delete vehicle");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Edit Vehicle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Vehicle Photo</Label>
            {imagePreview ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                <img
                  src={imagePreview}
                  alt="Vehicle preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-video rounded-2xl border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Tap to upload photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>

          {/* Registration */}
          <div className="space-y-2">
            <Label htmlFor="registration">Registration Number *</Label>
            <Input
              id="registration"
              placeholder="AB12 CDE"
              value={formData.registration}
              onChange={(e) => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
              className="uppercase font-mono text-lg tracking-wider"
            />
          </div>

          {/* Make & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                placeholder="e.g. Ford"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="e.g. Fiesta"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          {/* Year & Transmission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Transmission</Label>
              <Select
                value={formData.transmission}
                onValueChange={(value) =>
                  setFormData({ ...formData, transmission: value as "manual" | "automatic" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Odometer */}
          <div className="space-y-2">
            <Label htmlFor="odometer">Current Mileage (miles)</Label>
            <Input
              id="odometer"
              type="number"
              min="0"
              value={formData.current_odometer_km || ""}
              onChange={(e) => setFormData({ ...formData, current_odometer_km: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          {/* Compliance Dates */}
          <div className="border-t pt-4 space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Calendar className="h-4 w-4" />
              Compliance Dates
            </Label>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mot_expiry" className="text-sm">MOT Expiry</Label>
                <Input
                  id="mot_expiry"
                  type="date"
                  value={formData.mot_expiry}
                  onChange={(e) => setFormData({ ...formData, mot_expiry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance_expiry" className="text-sm">Insurance Expiry</Label>
                <Input
                  id="insurance_expiry"
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_expiry" className="text-sm">Road Tax Expiry</Label>
                <Input
                  id="tax_expiry"
                  type="date"
                  value={formData.tax_expiry}
                  onChange={(e) => setFormData({ ...formData, tax_expiry: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label htmlFor="next_service">Next Service Due (miles)</Label>
            <Input
              id="next_service"
              type="number"
              min="0"
              value={formData.next_service_due_km || ""}
              onChange={(e) => setFormData({ ...formData, next_service_due_km: parseInt(e.target.value) || 0 })}
              placeholder="e.g. 50000"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  disabled={isSubmitting || isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {formData.registration}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || isDeleting || !formData.registration.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
