import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllBookingUpsells, BookingUpsell } from "@/hooks/useBookingUpsells";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  Loader2,
  Zap,
  Calendar,
  CalendarSearch,
  Clock,
  Star,
  Shield,
  Rocket,
  Gift,
  Award,
  Target,
  BookOpen,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

const ICON_OPTIONS = [
  { value: "Zap", label: "Lightning" },
  { value: "Calendar", label: "Calendar" },
  { value: "CalendarSearch", label: "Calendar Search" },
  { value: "Clock", label: "Clock" },
  { value: "Star", label: "Star" },
  { value: "Shield", label: "Shield" },
  { value: "Rocket", label: "Rocket" },
  { value: "Gift", label: "Gift" },
  { value: "Award", label: "Award" },
  { value: "Target", label: "Target" },
  { value: "BookOpen", label: "Book" },
];

const COLOR_OPTIONS = [
  { value: "#10b981", label: "Emerald" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
];

interface UpsellFormData {
  name: string;
  short_description: string;
  full_description: string;
  price: string;
  refund_policy: string;
  icon_name: string;
  badge_text: string;
  highlight_color: string;
  is_active: boolean;
  is_featured: boolean;
}

const defaultFormData: UpsellFormData = {
  name: "",
  short_description: "",
  full_description: "",
  price: "",
  refund_policy: "",
  icon_name: "Zap",
  badge_text: "",
  highlight_color: "#10b981",
  is_active: true,
  is_featured: false,
};

export function BookingUpsellsManager() {
  const queryClient = useQueryClient();
  const { data: upsells, isLoading, error } = useAllBookingUpsells();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUpsell, setEditingUpsell] = useState<BookingUpsell | null>(null);
  const [deletingUpsell, setDeletingUpsell] = useState<BookingUpsell | null>(null);
  const [formData, setFormData] = useState<UpsellFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (editingUpsell) {
      setFormData({
        name: editingUpsell.name,
        short_description: editingUpsell.short_description,
        full_description: editingUpsell.full_description || "",
        price: String(editingUpsell.price),
        refund_policy: editingUpsell.refund_policy || "",
        icon_name: editingUpsell.icon_name || "Zap",
        badge_text: editingUpsell.badge_text || "",
        highlight_color: editingUpsell.highlight_color || "#10b981",
        is_active: editingUpsell.is_active,
        is_featured: editingUpsell.is_featured,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [editingUpsell]);

  const handleSave = async () => {
    if (!formData.name || !formData.short_description || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsSaving(true);

    try {
      const upsellData = {
        name: formData.name,
        short_description: formData.short_description,
        full_description: formData.full_description || null,
        price: priceNum,
        refund_policy: formData.refund_policy || null,
        icon_name: formData.icon_name,
        badge_text: formData.badge_text || null,
        highlight_color: formData.highlight_color,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };

      if (editingUpsell) {
        const { error } = await supabase
          .from("booking_upsells")
          .update(upsellData)
          .eq("id", editingUpsell.id);

        if (error) throw error;
        toast.success("Upsell updated successfully");
      } else {
        const maxOrder = upsells?.reduce((max, u) => Math.max(max, u.display_order), 0) || 0;
        const { error } = await supabase
          .from("booking_upsells")
          .insert({ ...upsellData, display_order: maxOrder + 1 });

        if (error) throw error;
        toast.success("Upsell created successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["all-booking-upsells"] });
      queryClient.invalidateQueries({ queryKey: ["booking-upsells"] });
      setIsDialogOpen(false);
      setEditingUpsell(null);
    } catch (err) {
      console.error("Error saving upsell:", err);
      toast.error("Failed to save upsell");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUpsell) return;

    try {
      const { error } = await supabase
        .from("booking_upsells")
        .delete()
        .eq("id", deletingUpsell.id);

      if (error) throw error;

      toast.success("Upsell deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["all-booking-upsells"] });
      queryClient.invalidateQueries({ queryKey: ["booking-upsells"] });
    } catch (err) {
      console.error("Error deleting upsell:", err);
      toast.error("Failed to delete upsell");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingUpsell(null);
    }
  };

  const handleToggleActive = async (upsell: BookingUpsell) => {
    try {
      const { error } = await supabase
        .from("booking_upsells")
        .update({ is_active: !upsell.is_active })
        .eq("id", upsell.id);

      if (error) throw error;

      toast.success(`Upsell ${upsell.is_active ? "deactivated" : "activated"}`);
      queryClient.invalidateQueries({ queryKey: ["all-booking-upsells"] });
      queryClient.invalidateQueries({ queryKey: ["booking-upsells"] });
    } catch (err) {
      console.error("Error toggling upsell:", err);
      toast.error("Failed to update upsell");
    }
  };

  const getIcon = (iconName: string | null): React.ComponentType<{ className?: string }> => {
    if (!iconName) return Zap;
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon || Zap;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load upsells. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Booking Upsells</h2>
          <p className="text-muted-foreground">
            Manage add-on services offered during the booking process
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingUpsell(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Upsell
        </Button>
      </div>

      {upsells && upsells.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upsells yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first booking upsell to offer additional services to customers.
            </p>
            <Button
              onClick={() => {
                setEditingUpsell(null);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Upsell
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {upsells?.map((upsell) => {
            const Icon = getIcon(upsell.icon_name);
            return (
              <Card
                key={upsell.id}
                className={!upsell.is_active ? "opacity-60" : undefined}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground cursor-move">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${upsell.highlight_color}20`,
                        color: upsell.highlight_color || "#10b981",
                      }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{upsell.name}</h3>
                        {upsell.badge_text && (
                          <Badge variant="secondary" className="text-xs">
                            {upsell.badge_text}
                          </Badge>
                        )}
                        {upsell.is_featured && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            Featured
                          </Badge>
                        )}
                        {!upsell.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {upsell.short_description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg">
                        £{Number(upsell.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={upsell.is_active}
                        onCheckedChange={() => handleToggleActive(upsell)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingUpsell(upsell);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeletingUpsell(upsell);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUpsell ? "Edit Upsell" : "Create New Upsell"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Guaranteed Earlier Test"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (£) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="49.99"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description *</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) =>
                  setFormData({ ...formData, short_description: e.target.value })
                }
                placeholder="Brief description shown on the card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_description">Full Description</Label>
              <Textarea
                id="full_description"
                value={formData.full_description}
                onChange={(e) =>
                  setFormData({ ...formData, full_description: e.target.value })
                }
                placeholder="Detailed description shown when expanded"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund_policy">Refund Policy</Label>
              <Textarea
                id="refund_policy"
                value={formData.refund_policy}
                onChange={(e) =>
                  setFormData({ ...formData, refund_policy: e.target.value })
                }
                placeholder="Describe the money-back guarantee terms"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={formData.icon_name}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon_name: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => {
                      const IconComponent = getIcon(icon.value);
                      return (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Highlight Color</Label>
                <Select
                  value={formData.highlight_color}
                  onValueChange={(value) =>
                    setFormData({ ...formData, highlight_color: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge">Badge Text</Label>
                <Input
                  id="badge"
                  value={formData.badge_text}
                  onChange={(e) =>
                    setFormData({ ...formData, badge_text: e.target.value })
                  }
                  placeholder="e.g., POPULAR"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked })
                  }
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label>Preview</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isPreviewOpen ? "Hide" : "Show"} Preview
                </Button>
              </div>

              {isPreviewOpen && (
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${formData.highlight_color}20`,
                          color: formData.highlight_color,
                        }}
                      >
                        {(() => {
                          const PreviewIcon = getIcon(formData.icon_name);
                          return <PreviewIcon className="h-6 w-6" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">
                            {formData.name || "Upsell Name"}
                          </h4>
                          {formData.badge_text && (
                            <Badge variant="secondary" className="text-xs">
                              {formData.badge_text}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formData.short_description || "Short description"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          £{formData.price || "0.00"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingUpsell(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingUpsell ? "Save Changes" : "Create Upsell"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Upsell</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingUpsell?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
