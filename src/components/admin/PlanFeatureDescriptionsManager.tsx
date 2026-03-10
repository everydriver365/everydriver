import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FeatureDescription {
  id: string;
  feature_key: string;
  display_name: string;
  short_description: string;
  long_description: string;
  icon_name: string;
  display_order: number;
}

const defaultFeature: Omit<FeatureDescription, "id"> = {
  feature_key: "",
  display_name: "",
  short_description: "",
  long_description: "",
  icon_name: "",
  display_order: 0,
};

export function PlanFeatureDescriptionsManager() {
  const [features, setFeatures] = useState<FeatureDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FeatureDescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    const { data, error } = await supabase
      .from("plan_feature_descriptions")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) {
      setFeatures(data as FeatureDescription[]);
    }
    setLoading(false);
  };

  const handleEdit = (feature: FeatureDescription) => {
    setEditing({ ...feature });
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditing({ id: "", ...defaultFeature, display_order: features.length });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;

    const payload = {
      feature_key: editing.feature_key,
      display_name: editing.display_name,
      short_description: editing.short_description,
      long_description: editing.long_description,
      icon_name: editing.icon_name,
      display_order: editing.display_order,
    };

    if (isCreating) {
      const { error } = await supabase.from("plan_feature_descriptions").insert(payload);
      if (error) {
        toast.error("Failed to create feature description");
        return;
      }
      toast.success("Feature description created");
    } else {
      const { error } = await supabase
        .from("plan_feature_descriptions")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Failed to update feature description");
        return;
      }
      toast.success("Feature description updated");
    }

    setIsDialogOpen(false);
    setEditing(null);
    fetchFeatures();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feature description?")) return;
    const { error } = await supabase.from("plan_feature_descriptions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Deleted");
    fetchFeatures();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Feature Descriptions</h3>
          <p className="text-sm text-muted-foreground">
            Edit the text shown on plan detail pages for each feature
          </p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add Feature
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Display Name</TableHead>
...
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Add Feature" : "Edit Feature"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Feature Key</Label>
                <Input
                  value={editing.feature_key}
                  onChange={(e) => setEditing({ ...editing, feature_key: e.target.value })}
                  placeholder="e.g. diary"
                  disabled={!isCreating}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={editing.display_name}
                  onChange={(e) => setEditing({ ...editing, display_name: e.target.value })}
                  placeholder="e.g. Smart Diary"
                />
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input
                  value={editing.short_description}
                  onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
                  placeholder="One-liner for pricing cards"
                />
              </div>
              <div className="space-y-2">
                <Label>Long Description</Label>
                <Textarea
                  value={editing.long_description}
                  onChange={(e) => setEditing({ ...editing, long_description: e.target.value })}
                  placeholder="Detailed description for plan detail page"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon Name</Label>
                  <Input
                    value={editing.icon_name}
                    onChange={(e) => setEditing({ ...editing, icon_name: e.target.value })}
                    placeholder="e.g. Calendar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={editing.display_order}
                    onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isCreating ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
