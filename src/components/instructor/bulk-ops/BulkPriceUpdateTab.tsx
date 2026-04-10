import { useState, useEffect } from "react";
import { PoundSterling, Loader2, Check } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pupil {
  id: string;
  name: string;
  custom_hourly_rate: number | null;
}

interface BulkPriceUpdateTabProps {
  instructorId: string | undefined;
}

export function BulkPriceUpdateTab({ instructorId }: BulkPriceUpdateTabProps) {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedPupils, setSelectedPupils] = useState<string[]>([]);
  const [newPrice, setNewPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (instructorId) fetchPupils();
  }, [instructorId]);

  const fetchPupils = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pupils")
      .select("id, name, custom_hourly_rate")
      .eq("instructor_id", instructorId!)
      .is("deleted_at", null)
      .order("name");
    setPupils(data || []);
    setSelectedPupils((data || []).map(p => p.id));
    setLoading(false);
  };

  const togglePupil = (id: string) => {
    setSelectedPupils(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleUpdate = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    if (selectedPupils.length === 0) {
      toast.error("Select at least one pupil");
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.allSettled(
        selectedPupils.map(id =>
          supabase.from("pupils").update({ custom_hourly_rate: price }).eq("id", id)
        )
      );
      const ok = results.filter(r => r.status === "fulfilled").length;
      toast.success(`Updated price for ${ok} pupil${ok > 1 ? "s" : ""} to £${price}`);
      fetchPupils();
      setNewPrice("");
    } catch {
      toast.error("Failed to update prices");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PoundSterling className="h-4 w-4 text-primary" />
          Bulk Price Update
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Set a new lesson price for multiple pupils at once.</p>

        <div className="space-y-1">
          <Label className="text-xs">New Lesson Price (£)</Label>
          <Input type="number" step="0.50" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="e.g. 38.00" />
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="border rounded-none max-h-48 overflow-y-auto">
            <div className="flex justify-between p-2 border-b">
              <span className="text-xs text-muted-foreground">{selectedPupils.length}/{pupils.length} selected</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setSelectedPupils(pupils.map(p => p.id))}>All</Button>
                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setSelectedPupils([])}>None</Button>
              </div>
            </div>
            {pupils.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer" onClick={() => togglePupil(p.id)}>
                <Checkbox checked={selectedPupils.includes(p.id)} />
                <span className="flex-1 text-sm">{p.name}</span>
                <span className="text-xs text-muted-foreground">£{p.custom_hourly_rate || 0}</span>
              </div>
            ))}
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={saving || !newPrice || selectedPupils.length === 0} className="w-full gap-2">
              <Check className="h-4 w-4" />
              Update {selectedPupils.length} Pupil{selectedPupils.length !== 1 ? "s" : ""} to £{newPrice || "..."}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Price Update</AlertDialogTitle>
              <AlertDialogDescription>
                This will change the lesson price for {selectedPupils.length} pupil{selectedPupils.length !== 1 ? "s" : ""} to £{newPrice}. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUpdate} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
