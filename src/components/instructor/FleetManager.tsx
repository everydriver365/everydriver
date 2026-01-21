import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Car, Plus, Star, AlertTriangle, Calendar, Gauge } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Vehicle {
  id: string;
  registration: string;
  make: string | null;
  model: string | null;
  year: number | null;
  transmission: string | null;
  is_primary: boolean;
  current_odometer_km: number;
  insurance_expiry: string | null;
  mot_expiry: string | null;
  tax_expiry: string | null;
  is_active: boolean;
}

interface FleetManagerProps {
  instructorId: string;
}

export function FleetManager({ instructorId }: FleetManagerProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    registration: "",
    make: "",
    model: "",
    year: "",
    transmission: "manual",
  });

  useEffect(() => {
    if (instructorId) fetchVehicles();
  }, [instructorId]);

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from("instructor_vehicles")
      .select("*")
      .eq("instructor_id", instructorId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false });

    if (!error) setVehicles(data || []);
    setLoading(false);
  };

  const handleAddVehicle = async () => {
    if (!form.registration) return;
    setSaving(true);

    const { error } = await supabase.from("instructor_vehicles").insert({
      instructor_id: instructorId,
      registration: form.registration.toUpperCase(),
      make: form.make || null,
      model: form.model || null,
      year: form.year ? parseInt(form.year) : null,
      transmission: form.transmission,
      is_primary: vehicles.length === 0,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add vehicle", variant: "destructive" });
    } else {
      toast({ title: "Vehicle added" });
      setDialogOpen(false);
      setForm({ registration: "", make: "", model: "", year: "", transmission: "manual" });
      fetchVehicles();
    }
    setSaving(false);
  };

  const handleSetPrimary = async (vehicleId: string) => {
    await supabase.from("instructor_vehicles").update({ is_primary: false }).eq("instructor_id", instructorId);
    await supabase.from("instructor_vehicles").update({ is_primary: true }).eq("id", vehicleId);
    fetchVehicles();
    toast({ title: "Primary vehicle updated" });
  };

  const getExpiryStatus = (date: string | null) => {
    if (!date) return null;
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return { variant: "destructive" as const, text: "Expired" };
    if (days < 14) return { variant: "destructive" as const, text: `${days}d left` };
    if (days < 30) return { variant: "secondary" as const, text: `${days}d left` };
    return null;
  };

  if (loading) return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Car className="h-5 w-5" /> Fleet ({vehicles.length})</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Vehicle</Button>
      </div>

      {vehicles.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No vehicles added yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((v) => (
            <Card key={v.id} className={v.is_primary ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="font-mono">{v.registration}</span>
                  {v.is_primary && <Badge variant="default"><Star className="h-3 w-3 mr-1" />Primary</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{v.make} {v.model} {v.year && `(${v.year})`}</p>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">{v.transmission}</Badge>
                  <Badge variant="outline"><Gauge className="h-3 w-3 mr-1" />{v.current_odometer_km.toLocaleString()} km</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {v.mot_expiry && getExpiryStatus(v.mot_expiry) && (
                    <Badge variant={getExpiryStatus(v.mot_expiry)!.variant}><AlertTriangle className="h-3 w-3 mr-1" />MOT {getExpiryStatus(v.mot_expiry)!.text}</Badge>
                  )}
                  {v.insurance_expiry && getExpiryStatus(v.insurance_expiry) && (
                    <Badge variant={getExpiryStatus(v.insurance_expiry)!.variant}>Insurance {getExpiryStatus(v.insurance_expiry)!.text}</Badge>
                  )}
                </div>
                {!v.is_primary && <Button size="sm" variant="outline" onClick={() => handleSetPrimary(v.id)}>Set as Primary</Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Registration</Label><Input placeholder="AB12 CDE" value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Make</Label><Input placeholder="Ford" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></div>
              <div><Label>Model</Label><Input placeholder="Fiesta" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Year</Label><Input type="number" placeholder="2022" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
              <div><Label>Transmission</Label>
                <Select value={form.transmission} onValueChange={(v) => setForm({ ...form, transmission: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVehicle} disabled={saving || !form.registration}>{saving ? "Adding..." : "Add Vehicle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
