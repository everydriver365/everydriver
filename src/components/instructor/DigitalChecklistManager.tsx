import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardCheck, Plus, Trash2, CheckCircle2, Circle, FileText, Camera, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SignaturePad } from "@/components/instructor/SignaturePad";
import { format } from "date-fns";

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

interface ChecklistTemplate {
  id: string;
  title: string;
  checklist_type: string;
  items: ChecklistItem[];
  is_active: boolean;
}

export function DigitalChecklistManager({ instructorId }: { instructorId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showFill, setShowFill] = useState<ChecklistTemplate | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("pre_lesson");
  const [newItems, setNewItems] = useState<ChecklistItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [fillResponses, setFillResponses] = useState<Record<string, boolean>>({});
  const [fillSignature, setFillSignature] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["checklist-templates", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        items: (t.items as any) || [],
      })) as ChecklistTemplate[];
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["checklist-submissions", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_submissions")
        .select("*, checklist_templates(title, checklist_type)")
        .eq("instructor_id", instructorId)
        .order("submitted_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("checklist_templates").insert({
        instructor_id: instructorId,
        title: newTitle,
        checklist_type: newType,
        items: newItems as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      setShowCreate(false);
      setNewTitle("");
      setNewItems([]);
      toast.success("Checklist template created");
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!showFill) return;
      const { error } = await supabase.from("checklist_submissions").insert({
        template_id: showFill.id,
        instructor_id: instructorId,
        responses: fillResponses as any,
        signature_url: fillSignature,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-submissions"] });
      setShowFill(null);
      setFillResponses({});
      setFillSignature(null);
      toast.success("Checklist submitted");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("checklist_templates").update({ is_active: false }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      toast.success("Template removed");
    },
  });

  const typeLabels: Record<string, string> = {
    pre_lesson: "Pre-Lesson",
    post_lesson: "Post-Lesson",
    incident: "Incident Report",
    vehicle_check: "Vehicle Check",
    end_of_day: "End of Day",
  };

  const addItem = () => {
    if (!newItemLabel.trim()) return;
    setNewItems([...newItems, { id: crypto.randomUUID(), label: newItemLabel.trim(), required: true }]);
    setNewItemLabel("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Digital Checklists
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <FileText className="h-4 w-4 mr-1" />
            History
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </Button>
        </div>
      </div>

      {/* Templates */}
      <div className="grid gap-3">
        {templates.map((t) => (
          <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
            setShowFill(t);
            const initial: Record<string, boolean> = {};
            t.items.forEach((item) => (initial[item.id] = false));
            setFillResponses(initial);
          }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{t.title}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{typeLabels[t.checklist_type] || t.checklist_type}</Badge>
                  <span className="text-xs text-muted-foreground">{t.items.length} items</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(t.id); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No checklist templates yet. Create one to get started.</p>
        )}
      </div>

      {/* History */}
      {showHistory && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {submissions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{s.checklist_templates?.title || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(s.submitted_at), "dd MMM yyyy HH:mm")}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {s.status}
                </Badge>
              </div>
            ))}
            {submissions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No submissions yet</p>}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Checklist Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Template title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <select className="w-full rounded-none border p-2 text-sm bg-background" value={newType} onChange={(e) => setNewType(e.target.value)}>
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="space-y-2">
              <p className="text-sm font-medium">Checklist Items</p>
              {newItems.map((item, i) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{item.label}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNewItems(newItems.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="Add item..." value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} />
                <Button variant="outline" size="sm" onClick={addItem}>Add</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createMutation.mutate()} disabled={!newTitle || newItems.length === 0}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fill Checklist Dialog */}
      <Dialog open={!!showFill} onOpenChange={() => setShowFill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{showFill?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {showFill?.items.map((item) => (
              <button key={item.id} className="flex items-center gap-3 w-full text-left p-2 rounded-none hover:bg-secondary transition-colors" onClick={() => setFillResponses((r) => ({ ...r, [item.id]: !r[item.id] }))}>
                {fillResponses[item.id] ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Signature (optional)</p>
              <SignaturePad onSignatureChange={setFillSignature} height={100} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => submitMutation.mutate()}>Submit Checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
