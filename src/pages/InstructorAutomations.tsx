import { useState } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { AutomationCard, Automation } from "@/components/instructor/automations/AutomationCard";
import { AutomationBuilder } from "@/components/instructor/automations/AutomationBuilder";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Zap } from "lucide-react";
import { toast } from "sonner";

export default function InstructorAutomations() {
  const { instructor, loading: authLoading } = useInstructorAuth();
  const queryClient = useQueryClient();
  const [builderOpen, setBuilderOpen] = useState(false);

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["instructor-automations", instructor?.id],
    enabled: !!instructor?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_automations")
        .select("*")
        .eq("instructor_id", instructor!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Automation[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("instructor_automations")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["instructor-automations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instructor_automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-automations"] });
      toast.success("Automation deleted");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; trigger_type: string; action_type: string; action_config: Record<string, any> }) => {
      const { error } = await supabase.from("instructor_automations").insert({
        instructor_id: instructor!.id,
        name: data.name,
        trigger_type: data.trigger_type as any,
        action_type: data.action_type as any,
        action_config: data.action_config,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-automations"] });
      toast.success("Automation created!");
    },
    onError: () => toast.error("Failed to create automation"),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!instructor) return <Navigate to="/instructor/login" replace />;

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Automations</h1>
              <p className="text-sm text-muted-foreground">If this, then that rules</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setBuilderOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : automations.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Zap className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No automations yet</p>
            <Button variant="outline" onClick={() => setBuilderOpen(true)}>
              Create your first automation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((a) => (
              <AutomationCard
                key={a.id}
                automation={a}
                onToggle={(id, active) => toggleMutation.mutate({ id, active })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      <AutomationBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        onSubmit={(data) => createMutation.mutateAsync(data)}
      />
    </InstructorPortalLayout>
  );
}
