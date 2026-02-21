import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Package, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";

interface LessonPackage {
  id: string;
  name: string;
  total_hours: number;
  price: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface LessonPackageManagerProps {
  instructorId: string;
}

export function LessonPackageManager({ instructorId }: LessonPackageManagerProps) {
  const [packages, setPackages] = useState<LessonPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<LessonPackage | null>(null);
  const [form, setForm] = useState({
    name: "",
    total_hours: "",
    price: "",
    description: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, [instructorId]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_packages")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPackage(null);
    setForm({ name: "", total_hours: "", price: "", description: "", is_active: true });
    setSheetOpen(true);
  };

  const handleOpenEdit = (pkg: LessonPackage) => {
    setEditingPackage(pkg);
    setForm({
      name: pkg.name,
      total_hours: String(pkg.total_hours),
      price: String(pkg.price),
      description: pkg.description || "",
      is_active: pkg.is_active,
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.total_hours || !form.price) {
      toast.error("Please fill in name, hours and price");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        instructor_id: instructorId,
        name: form.name,
        total_hours: parseFloat(form.total_hours),
        price: parseFloat(form.price),
        description: form.description || null,
        is_active: form.is_active,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from("lesson_packages")
          .update(payload)
          .eq("id", editingPackage.id);
        if (error) throw error;
        toast.success("Package updated");
      } else {
        const { error } = await supabase.from("lesson_packages").insert(payload);
        if (error) throw error;
        toast.success("Package created");
      }

      setSheetOpen(false);
      fetchPackages();
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg: LessonPackage) => {
    if (!confirm(`Delete "${pkg.name}"?`)) return;
    try {
      const { error } = await supabase.from("lesson_packages").delete().eq("id", pkg.id);
      if (error) throw error;
      toast.success("Package deleted");
      fetchPackages();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Lesson Packages
        </h3>
        <Button size="sm" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Package
        </Button>
      </div>

      {packages.length === 0 && !loading ? (
        <EmptyState
          icon={Package}
          title="No packages yet"
          description="Create pre-paid lesson packages for your pupils to purchase"
          actionLabel="Create Package"
          onAction={handleOpenAdd}
          compact
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{pkg.name}</h4>
                      <Badge variant={pkg.is_active ? "default" : "secondary"} className="text-xs">
                        {pkg.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-primary mt-1">£{pkg.price}</p>
                    <p className="text-sm text-muted-foreground">{pkg.total_hours} hours</p>
                    {pkg.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pkg.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(pkg)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(pkg)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingPackage ? "Edit Package" : "New Package"}</SheetTitle>
            <SheetDescription>
              {editingPackage ? "Update this lesson package" : "Create a new pre-paid lesson package"}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label>Package Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 10-Hour Block"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Total Hours</Label>
                <Input
                  type="number"
                  value={form.total_hours}
                  onChange={(e) => setForm({ ...form, total_hours: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Price (£)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="350"
                />
              </div>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Perfect for new learners..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Active (visible to pupils)</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : editingPackage ? "Update Package" : "Create Package"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
