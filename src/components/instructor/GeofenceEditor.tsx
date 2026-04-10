import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Plus, Trash2, Edit2, Shield, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  alert_on_enter: boolean;
  alert_on_exit: boolean;
  active_hours_start: string | null;
  active_hours_end: string | null;
  is_active: boolean;
}

interface GeofenceEditorProps {
  instructorId: string;
}

export function GeofenceEditor({ instructorId }: GeofenceEditorProps) {
  const [fences, setFences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Geofence | null>(null);
  const [form, setForm] = useState({
    name: "", latitude: "", longitude: "", radius_m: "200",
    alert_on_enter: true, alert_on_exit: true,
    active_hours_start: "", active_hours_end: "",
  });

  const fetchFences = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("geofences")
      .select("*")
      .eq("instructor_id", instructorId)
      .order("created_at", { ascending: false });
    setFences((data as Geofence[]) || []);
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { fetchFences(); }, [fetchFences]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", latitude: "", longitude: "", radius_m: "200", alert_on_enter: true, alert_on_exit: true, active_hours_start: "", active_hours_end: "" });
    setShowDialog(true);
  };

  const openEdit = (f: Geofence) => {
    setEditing(f);
    setForm({
      name: f.name, latitude: String(f.latitude), longitude: String(f.longitude),
      radius_m: String(f.radius_m), alert_on_enter: f.alert_on_enter, alert_on_exit: f.alert_on_exit,
      active_hours_start: f.active_hours_start || "", active_hours_end: f.active_hours_end || "",
    });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.name || !form.latitude || !form.longitude) {
      toast.error("Name, latitude and longitude are required");
      return;
    }

    const payload = {
      instructor_id: instructorId,
      name: form.name,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      radius_m: parseInt(form.radius_m) || 200,
      alert_on_enter: form.alert_on_enter,
      alert_on_exit: form.alert_on_exit,
      active_hours_start: form.active_hours_start || null,
      active_hours_end: form.active_hours_end || null,
    };

    if (editing) {
      const { error } = await supabase.from("geofences").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Geofence updated");
    } else {
      const { error } = await supabase.from("geofences").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Geofence created");
    }
    setShowDialog(false);
    fetchFences();
  };

  const toggleActive = async (f: Geofence) => {
    await supabase.from("geofences").update({ is_active: !f.is_active }).eq("id", f.id);
    fetchFences();
  };

  const deleteFence = async (id: string) => {
    await supabase.from("geofences").delete().eq("id", id);
    toast.success("Geofence deleted");
    fetchFences();
  };

  if (loading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Geofences
        </h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Add Zone
        </Button>
      </div>

      {fences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No geofences configured yet</p>
            <Button size="sm" className="mt-3" onClick={openCreate}>Create your first zone</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {fences.map(f => (
            <Card key={f.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-none ${f.is_active ? 'bg-primary/10' : 'bg-muted/50'}`}>
                      <MapPin className={`h-4 w-4 ${f.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.radius_m}m radius • {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {f.alert_on_enter && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Enter</Badge>}
                        {f.alert_on_exit && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Exit</Badge>}
                        {f.active_hours_start && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {f.active_hours_start}–{f.active_hours_end}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={f.is_active} onCheckedChange={() => toggleActive(f)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(f)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteFence(f.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Geofence" : "New Geofence"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Home Base" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Latitude</Label>
                <Input type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Radius (metres)</Label>
              <Input type="number" value={form.radius_m} onChange={e => setForm({...form, radius_m: e.target.value})} className="mt-1" />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.alert_on_enter} onCheckedChange={v => setForm({...form, alert_on_enter: v})} />
                <Label>Alert on enter</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.alert_on_exit} onCheckedChange={v => setForm({...form, alert_on_exit: v})} />
                <Label>Alert on exit</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Active from (optional)</Label>
                <Input type="time" value={form.active_hours_start} onChange={e => setForm({...form, active_hours_start: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label>Active until (optional)</Label>
                <Input type="time" value={form.active_hours_end} onChange={e => setForm({...form, active_hours_end: e.target.value})} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
