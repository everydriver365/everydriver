import { useState, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeadCard, PipelineLead } from "./LeadCard";
import { AddLeadSheet } from "./AddLeadSheet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { triggerAutomations } from "@/utils/triggerAutomations";

const STAGES = [
  { value: "new_lead", label: "New Lead", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "quoted", label: "Quoted", color: "bg-orange-500" },
  { value: "booked", label: "Booked", color: "bg-purple-500" },
  { value: "active", label: "Active", color: "bg-green-500" },
  { value: "test_passed", label: "Test Passed", color: "bg-emerald-500" },
  { value: "lost", label: "Lost", color: "bg-muted-foreground" },
];

interface KanbanBoardProps {
  instructorId: string;
}

export function KanbanBoard({ instructorId }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editLead, setEditLead] = useState<PipelineLead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["pipeline-leads", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_leads")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as PipelineLead[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (lead: Partial<PipelineLead>) => {
      if (lead.id) {
        const { error } = await supabase
          .from("pipeline_leads")
          .update({
            name: lead.name!,
            phone: lead.phone,
            email: lead.email,
            postcode: lead.postcode,
            course_type: lead.course_type,
            notes: lead.notes,
            stage: lead.stage as any,
          })
          .eq("id", lead.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pipeline_leads")
          .insert({
            instructor_id: instructorId,
            name: lead.name!,
            phone: lead.phone,
            email: lead.email,
            postcode: lead.postcode,
            course_type: lead.course_type,
            notes: lead.notes,
            stage: (lead.stage || "new_lead") as any,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
      toast.success("Lead saved");
    },
    onError: () => toast.error("Failed to save lead"),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase
        .from("pipeline_leads")
        .update({ stage: stage as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] }),
    onError: () => toast.error("Failed to move lead"),
  });

  const handleConvert = useCallback(async (lead: PipelineLead) => {
    try {
      const { error } = await supabase.from("pupils").insert({
        instructor_id: instructorId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        address: lead.postcode || "TBC",
        postcode: lead.postcode || "TBC",
        course_type: lead.course_type,
        notes: lead.notes,
      });
      if (error) throw error;

      await supabase
        .from("pipeline_leads")
        .update({ stage: "active" as any })
        .eq("id", lead.id);

      queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
      toast.success(`${lead.name} converted to pupil!`);

      // Fire automation for new enquiry/conversion
      triggerAutomations({
        triggerType: "new_enquiry",
        instructorId,
        pupilName: lead.name,
        context: { pupil_phone: lead.phone },
      });
    } catch {
      toast.error("Failed to convert lead");
    }
  }, [instructorId, queryClient]);

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) moveMutation.mutate({ id: leadId, stage });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Badge variant="secondary">{leads.length} leads</Badge>
        <Button size="sm" onClick={() => { setEditLead(null); setAddSheetOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Lead
        </Button>
      </div>

      {/* Mobile: vertical columns; Desktop: horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.value);
          return (
            <div
              key={stage.value}
              className={`min-w-[260px] w-[260px] shrink-0 snap-start rounded-[10px] p-3 transition-colors ${
                dragOverStage === stage.value ? "bg-primary/5 border-primary/30 border" : "bg-card border border-border/40"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.value); }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => handleDrop(e, stage.value)}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                <span className="text-[13px] font-medium">{stage.label}</span>
                <Badge variant="outline" className="ml-auto text-[11px]">{stageLeads.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[80px]">
                {stageLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onConvert={handleConvert}
                    onEdit={(l) => { setEditLead(l); setAddSheetOpen(true); }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AddLeadSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onSubmit={(data) => upsertMutation.mutateAsync(data)}
        editLead={editLead}
      />
    </>
  );
}
