import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  duration_minutes: number;
  event_type: string;
  link_url: string | null;
  link_label: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  duration_minutes: 60,
  event_type: "online_webinar",
  link_url: "",
  link_label: "Join Event",
  is_active: true,
};

export function AdminEventsManager() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("admin_events")
      .select("*")
      .order("event_date", { ascending: true });
    if (data) setEvents(data as AdminEvent[]);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (e: AdminEvent) => {
    setEditingId(e.id);
    setForm({
      title: e.title,
      description: e.description || "",
      event_date: e.event_date ? format(new Date(e.event_date), "yyyy-MM-dd'T'HH:mm") : "",
      duration_minutes: e.duration_minutes,
      event_type: e.event_type,
      link_url: e.link_url || "",
      link_label: e.link_label || "Join Event",
      is_active: e.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.event_date) {
      toast.error("Title and date are required");
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      event_date: new Date(form.event_date).toISOString(),
      duration_minutes: form.duration_minutes,
      event_type: form.event_type,
      link_url: form.link_url || null,
      link_label: form.link_label || null,
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase.from("admin_events").update(payload).eq("id", editingId);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Event updated");
    } else {
      const { error } = await supabase.from("admin_events").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Event created");
    }
    setDialogOpen(false);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await supabase.from("admin_events").delete().eq("id", id);
    toast.success("Event deleted");
    fetchEvents();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Event</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>{format(new Date(e.event_date), "dd MMM yyyy HH:mm")}</TableCell>
                <TableCell className="capitalize">{e.event_type.replace(/_/g, " ")}</TableCell>
                <TableCell>{e.is_active ? "✓" : "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && !loading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No events yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Event" : "New Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })} />
              </div>
            </div>
            <div>
              <Label>Event Type</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online_webinar">Online Webinar</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                  <SelectItem value="show">Show / Exhibition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Link URL</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Link Label</Label>
              <Input value={form.link_label} onChange={(e) => setForm({ ...form, link_label: e.target.value })} placeholder="Join Event" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={handleSave}>{editingId ? "Update Event" : "Create Event"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
