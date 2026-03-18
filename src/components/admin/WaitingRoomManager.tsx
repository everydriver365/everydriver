import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Video, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WaitingRoomSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  title: string;
  notes: string | null;
  is_cancelled: boolean;
}

export function WaitingRoomManager() {
  const [zoomLink, setZoomLink] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sessions, setSessions] = useState<WaitingRoomSession[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // New session form
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newStartTime, setNewStartTime] = useState("19:00");
  const [newEndTime, setNewEndTime] = useState("20:00");
  const [newTitle, setNewTitle] = useState("The Waiting Room");
  const [newNotes, setNewNotes] = useState("");
  const [addingSession, setAddingSession] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchSessions();
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from("waiting_room_config")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (data) {
      setZoomLink(data.zoom_link || "");
      setDescription(data.description || "");
      setIsActive(data.is_active ?? true);
    }
    setLoading(false);
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("waiting_room_sessions")
      .select("*")
      .gte("session_date", new Date().toISOString().split("T")[0])
      .order("session_date", { ascending: true });

    setSessions(data || []);
  };

  const saveConfig = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("waiting_room_config")
      .upsert({
        id: "default",
        zoom_link: zoomLink,
        description,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast.error("Failed to save config");
    } else {
      toast.success("Waiting Room settings saved");
    }
    setSaving(false);
  };

  const addSession = async () => {
    if (!newDate) {
      toast.error("Please select a date");
      return;
    }
    setAddingSession(true);

    const { error } = await supabase.from("waiting_room_sessions").insert({
      session_date: format(newDate, "yyyy-MM-dd"),
      start_time: newStartTime,
      end_time: newEndTime,
      title: newTitle,
      notes: newNotes || null,
    });

    if (error) {
      toast.error("Failed to add session");
    } else {
      toast.success("Session added");
      setNewDate(undefined);
      setNewNotes("");
      fetchSessions();
    }
    setAddingSession(false);
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from("waiting_room_sessions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete session");
    } else {
      toast.success("Session removed");
      fetchSessions();
    }
  };

  const toggleCancelled = async (id: string, cancelled: boolean) => {
    await supabase.from("waiting_room_sessions").update({ is_cancelled: cancelled }).eq("id", id);
    fetchSessions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Config Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Waiting Room Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="space-y-2">
            <Label>Zoom Meeting Link</Label>
            <Input
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              placeholder="https://zoom.us/j/..."
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Description shown to instructors..."
            />
          </div>

          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Schedule Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new session */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-semibold">Add New Session</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDate ? format(newDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newDate}
                      onSelect={setNewDate}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Time</Label>
                <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes (optional)</Label>
              <Input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="e.g. Special guest this week" />
            </div>
            <Button onClick={addSession} disabled={addingSession} size="sm" className="gap-2">
              {addingSession ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add Session
            </Button>
          </div>

          {/* Sessions list */}
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming sessions scheduled.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className={cn("flex items-center justify-between rounded-lg border p-3", s.is_cancelled && "opacity-50")}>
                  <div>
                    <p className="text-sm font-medium">
                      {s.title} — {format(new Date(s.session_date + "T00:00:00"), "EEE dd MMM yyyy")}
                      {s.is_cancelled && <span className="ml-2 text-destructive text-xs">(Cancelled)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                      {s.notes && ` · ${s.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCancelled(s.id, !s.is_cancelled)}
                    >
                      {s.is_cancelled ? "Restore" : "Cancel"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSession(s.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
