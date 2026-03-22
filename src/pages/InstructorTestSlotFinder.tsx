import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Bell, CalendarSearch, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function InstructorTestSlotFinder() {
  const qc = useQueryClient();
  const [newCentre, setNewCentre] = useState("");
  const [newDate, setNewDate] = useState("");

  const { data: watches = [], isLoading } = useQuery({
    queryKey: ["test-slot-watches"],
    queryFn: async () => {
      const { data: instructor } = await supabase
        .from("instructors")
        .select("id")
        .single();
      if (!instructor) return [];
      const { data, error } = await supabase
        .from("test_slot_watches")
        .select("*")
        .eq("instructor_id", instructor.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addWatch = useMutation({
    mutationFn: async () => {
      const { data: instructor } = await supabase
        .from("instructors")
        .select("id")
        .single();
      if (!instructor) throw new Error("No instructor found");
      const { error } = await supabase.from("test_slot_watches").insert({
        instructor_id: instructor.id,
        test_centre: newCentre,
        current_test_date: newDate || null,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-slot-watches"] });
      setNewCentre("");
      setNewDate("");
      toast.success("Test slot watch added");
    },
    onError: () => toast.error("Failed to add watch"),
  });

  const removeWatch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("test_slot_watches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-slot-watches"] });
      toast.success("Watch removed");
    },
  });

  return (
    <InstructorShell title="DVSA Test Slot Finder" subtitle="Monitor for earlier test dates">
      <div className="space-y-6">
        {/* Info card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <CalendarSearch className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">How it works</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add a test centre and your pupil's current test date. We'll monitor for earlier cancellation slots 
                and notify you when one becomes available. You can then rebook to the earlier date.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add new watch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Test Slot Watch
            </CardTitle>
            <CardDescription>Enter the test centre name and current booked date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="centre">Test Centre</Label>
                <Input
                  id="centre"
                  placeholder="e.g. Goodmayes, Barking"
                  value={newCentre}
                  onChange={(e) => setNewCentre(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Current Test Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() => addWatch.mutate()}
              disabled={!newCentre.trim() || addWatch.isPending}
              size="sm"
            >
              <Search className="h-4 w-4 mr-1" /> Start Monitoring
            </Button>
          </CardContent>
        </Card>

        {/* Active watches */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" /> Active Watches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : watches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active watches. Add one above to get started.</p>
            ) : (
              <div className="space-y-3">
                {watches.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{w.test_centre}</p>
                      <div className="flex items-center gap-2">
                        {w.current_test_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Current: {format(new Date(w.current_test_date), "dd MMM yyyy")}
                          </span>
                        )}
                        <Badge variant={w.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {w.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWatch.mutate(w.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </InstructorShell>
  );
}
