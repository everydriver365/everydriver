import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Package, AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface PupilPackage {
  id: string;
  hours_purchased: number;
  hours_remaining: number;
  status: string;
  purchased_at: string;
  expires_at: string | null;
  lesson_packages: {
    name: string;
    price: number;
    total_hours: number;
  } | null;
}

interface LessonPackageDef {
  id: string;
  name: string;
  total_hours: number;
  price: number;
}

interface PupilPackageCardProps {
  pupilId: string;
  instructorId: string;
}

export function PupilPackageCard({ pupilId, instructorId }: PupilPackageCardProps) {
  const [packages, setPackages] = useState<PupilPackage[]>([]);
  const [availablePackages, setAvailablePackages] = useState<LessonPackageDef[]>([]);
  const [buySheetOpen, setBuySheetOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPupilPackages();
    fetchAvailablePackages();
  }, [pupilId]);

  const fetchPupilPackages = async () => {
    const { data } = await supabase
      .from("pupil_packages")
      .select("*, lesson_packages(name, price, total_hours)")
      .eq("pupil_id", pupilId)
      .order("purchased_at", { ascending: false });

    setPackages(data || []);
  };

  const fetchAvailablePackages = async () => {
    const { data } = await supabase
      .from("lesson_packages")
      .select("id, name, total_hours, price")
      .eq("instructor_id", instructorId)
      .eq("is_active", true);

    setAvailablePackages(data || []);
  };

  const handleAssignPackage = async () => {
    if (!selectedPackageId) return;
    setSaving(true);
    try {
      const pkg = availablePackages.find((p) => p.id === selectedPackageId);
      if (!pkg) return;

      const { error } = await supabase.from("pupil_packages").insert({
        pupil_id: pupilId,
        instructor_id: instructorId,
        package_id: selectedPackageId,
        hours_purchased: pkg.total_hours,
        hours_remaining: pkg.total_hours,
        status: "active",
      });

      if (error) throw error;
      toast.success(`${pkg.name} assigned`);
      setBuySheetOpen(false);
      setSelectedPackageId("");
      fetchPupilPackages();
    } catch (error) {
      console.error("Error assigning package:", error);
      toast.error("Failed to assign package");
    } finally {
      setSaving(false);
    }
  };

  const activePackages = packages.filter((p) => p.status === "active");

  if (activePackages.length === 0 && packages.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Package className="h-4 w-4 text-primary" /> Packages
          </h4>
          <Button variant="ghost" size="sm" onClick={() => setBuySheetOpen(true)} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Assign
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">No packages assigned</p>
        <BuyPackageSheet
          open={buySheetOpen}
          onOpenChange={setBuySheetOpen}
          packages={availablePackages}
          selectedId={selectedPackageId}
          onSelect={setSelectedPackageId}
          onConfirm={handleAssignPackage}
          saving={saving}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Package className="h-4 w-4 text-primary" /> Packages
        </h4>
        <Button variant="ghost" size="sm" onClick={() => setBuySheetOpen(true)} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Assign
        </Button>
      </div>

      {activePackages.map((pkg) => {
        const percent = pkg.hours_purchased > 0
          ? ((pkg.hours_purchased - pkg.hours_remaining) / pkg.hours_purchased) * 100
          : 0;
        const isLow = pkg.hours_remaining <= 2;

        return (
          <Card key={pkg.id} className="border-border">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{pkg.lesson_packages?.name || "Package"}</span>
                <Badge variant={isLow ? "destructive" : "default"} className="text-xs">
                  {pkg.hours_remaining}h left
                </Badge>
              </div>
              <Progress value={percent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{pkg.hours_purchased - pkg.hours_remaining}h used</span>
                <span>{pkg.hours_purchased}h total</span>
              </div>
              {isLow && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Running low — consider renewing
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <BuyPackageSheet
        open={buySheetOpen}
        onOpenChange={setBuySheetOpen}
        packages={availablePackages}
        selectedId={selectedPackageId}
        onSelect={setSelectedPackageId}
        onConfirm={handleAssignPackage}
        saving={saving}
      />
    </div>
  );
}

function BuyPackageSheet({
  open,
  onOpenChange,
  packages,
  selectedId,
  onSelect,
  onConfirm,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  packages: LessonPackageDef[];
  selectedId: string;
  onSelect: (v: string) => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Assign Package</SheetTitle>
          <SheetDescription>Select a pre-paid package to assign to this pupil</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active packages. Create packages in Settings → Lesson Packages.
            </p>
          ) : (
            <>
              <Select value={selectedId} onValueChange={onSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} — {pkg.total_hours}h — £{pkg.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onConfirm} disabled={!selectedId || saving} className="w-full">
                {saving ? "Assigning..." : "Assign Package"}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
