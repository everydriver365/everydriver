import { useState, useEffect } from "react";
import { Save, Plus, Trash2, GripVertical } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HomepageFeature {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
  detailed_content: string | null;
}

// Popular icon options for driving school context
const POPULAR_ICONS = [
  "Calendar", "MapPin", "Award", "Users", "Car", "Clock", "CheckCircle", 
  "Shield", "Star", "Heart", "ThumbsUp", "Zap", "Target", "TrendingUp",
  "CreditCard", "Phone", "Mail", "MessageCircle", "BookOpen", "GraduationCap",
  "Navigation", "Route", "Gauge", "AlertCircle", "Bell", "Settings",
  "FileText", "Clipboard", "BarChart", "PieChart", "Activity", "Eye"
];

// Get icon component by name
const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[iconName];
  return IconComponent || LucideIcons.HelpCircle;
};

export function HomepageFeaturesManager() {
  const [features, setFeatures] = useState<HomepageFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFeature, setEditingFeature] = useState<HomepageFeature | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("homepage_features")
      .select("*")
      .order("display_order");

    if (error) {
      console.error("Error fetching features:", error);
      toast.error("Failed to load features");
    } else {
      setFeatures(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (feature: HomepageFeature) => {
    setEditingFeature({ ...feature });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    const maxOrder = features.length > 0 
      ? Math.max(...features.map(f => f.display_order)) 
      : 0;
    
    setEditingFeature({
      id: "",
      title: "",
      description: "",
      icon_name: "Star",
      display_order: maxOrder + 1,
      is_active: true,
      detailed_content: null,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingFeature) return;
    if (!editingFeature.title.trim() || !editingFeature.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);

    try {
      if (editingFeature.id) {
        // Update existing
        const { error } = await supabase
          .from("homepage_features")
          .update({
            title: editingFeature.title,
            description: editingFeature.description,
            icon_name: editingFeature.icon_name,
            display_order: editingFeature.display_order,
            is_active: editingFeature.is_active,
            detailed_content: editingFeature.detailed_content,
          })
          .eq("id", editingFeature.id);

        if (error) throw error;
        toast.success("Feature updated");
      } else {
        // Create new
        const { error } = await supabase
          .from("homepage_features")
          .insert({
            title: editingFeature.title,
            description: editingFeature.description,
            icon_name: editingFeature.icon_name,
            display_order: editingFeature.display_order,
            is_active: editingFeature.is_active,
            detailed_content: editingFeature.detailed_content,
          });

        if (error) throw error;
        toast.success("Feature created");
      }

      setDialogOpen(false);
      fetchFeatures();
    } catch (error) {
      console.error("Error saving feature:", error);
      toast.error("Failed to save feature");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature?")) return;

    const { error } = await supabase
      .from("homepage_features")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete feature");
    } else {
      toast.success("Feature deleted");
      setDialogOpen(false);
      fetchFeatures();
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const index = features.findIndex(f => f.id === id);
    if (
      (direction === "up" && index === 0) || 
      (direction === "down" && index === features.length - 1)
    ) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const current = features[index];
    const swap = features[swapIndex];

    try {
      await Promise.all([
        supabase
          .from("homepage_features")
          .update({ display_order: swap.display_order })
          .eq("id", current.id),
        supabase
          .from("homepage_features")
          .update({ display_order: current.display_order })
          .eq("id", swap.id),
      ]);
      fetchFeatures();
    } catch (error) {
      toast.error("Failed to reorder");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Homepage Features</h2>
          <p className="text-sm text-muted-foreground">
            Manage the "Everything You Need to Learn to Drive" section
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Feature
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature, index) => {
          const IconComponent = getIconComponent(feature.icon_name);
          return (
            <Card
              key={feature.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !feature.is_active ? "opacity-50" : ""
              }`}
              onClick={() => handleEdit(feature)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorder(feature.id, "up");
                      }}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </Button>
                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorder(feature.id, "down");
                      }}
                      disabled={index === features.length - 1}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </Button>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent flex-shrink-0">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{feature.title}</h3>
                      {!feature.is_active && (
                        <span className="text-xs text-muted-foreground">(Hidden)</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {feature.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Icon: {feature.icon_name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFeature?.id ? "Edit Feature" : "Add Feature"}
            </DialogTitle>
            <DialogDescription>
              Configure a feature card for the homepage
            </DialogDescription>
          </DialogHeader>

          {editingFeature && (
            <div className="space-y-4 py-4">
              {/* Icon Picker */}
              <div className="space-y-2">
                <Label>Icon</Label>
                <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                    >
                      {(() => {
                        const IconComponent = getIconComponent(editingFeature.icon_name);
                        return <IconComponent className="h-5 w-5" />;
                      })()}
                      <span>{editingFeature.icon_name}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search icons..." />
                      <CommandList>
                        <CommandEmpty>No icon found.</CommandEmpty>
                        <CommandGroup heading="Popular Icons">
                          <div className="grid grid-cols-6 gap-1 p-2">
                            {POPULAR_ICONS.map((iconName) => {
                              const IconComponent = getIconComponent(iconName);
                              return (
                                <button
                                  key={iconName}
                                  className={`flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${
                                    editingFeature.icon_name === iconName
                                      ? "bg-accent text-accent-foreground"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    setEditingFeature({
                                      ...editingFeature,
                                      icon_name: iconName,
                                    });
                                    setIconPickerOpen(false);
                                  }}
                                  title={iconName}
                                >
                                  <IconComponent className="h-5 w-5" />
                                </button>
                              );
                            })}
                          </div>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingFeature.title}
                  onChange={(e) =>
                    setEditingFeature({
                      ...editingFeature,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Live Availability"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea
                  value={editingFeature.description}
                  onChange={(e) =>
                    setEditingFeature({
                      ...editingFeature,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description shown on the card..."
                  rows={2}
                />
              </div>

              {/* Detailed Content for Modal */}
              <div className="space-y-2">
                <Label>Detailed Content (Modal Popup)</Label>
                <p className="text-xs text-muted-foreground">
                  Extended information shown when users click "Tap for more info". Use blank lines to separate paragraphs.
                </p>
                <Textarea
                  value={editingFeature.detailed_content || ""}
                  onChange={(e) =>
                    setEditingFeature({
                      ...editingFeature,
                      detailed_content: e.target.value || null,
                    })
                  }
                  placeholder="Enter detailed paragraphs about this feature...

Separate paragraphs with blank lines.

This content will appear in a modal popup when users click 'Tap for more info'."
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Show on Homepage</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle visibility without deleting
                  </p>
                </div>
                <Switch
                  checked={editingFeature.is_active}
                  onCheckedChange={(checked) =>
                    setEditingFeature({
                      ...editingFeature,
                      is_active: checked,
                    })
                  }
                />
              </div>

              {/* Preview */}
              <div className="rounded-lg border p-4 bg-card">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    {(() => {
                      const IconComponent = getIconComponent(editingFeature.icon_name);
                      return <IconComponent className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">
                      {editingFeature.title || "Feature Title"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {editingFeature.description || "Feature description..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </Button>
                {editingFeature.id && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(editingFeature.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
