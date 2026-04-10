import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileCheck, Plus, Trash2, Users, CheckCircle, AlertCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DigitalWaiverManager() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [waiverType, setWaiverType] = useState("terms");
  const [contentHtml, setContentHtml] = useState("");

  const { data: waivers, isLoading } = useQuery({
    queryKey: ["digital-waivers", instructor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("digital_waivers")
        .select("*")
        .eq("instructor_id", instructor!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const { data: signatures } = useQuery({
    queryKey: ["waiver-signatures", instructor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waiver_signatures")
        .select("*, pupils(name), digital_waivers(title)")
        .eq("instructor_id", instructor!.id)
        .order("signed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const { data: pupils } = useQuery({
    queryKey: ["waiver-pupils", instructor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", instructor!.id)
        .is("deleted_at", null);
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("digital_waivers").insert({
        instructor_id: instructor!.id,
        title,
        waiver_type: waiverType,
        content_html: contentHtml,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digital-waivers"] });
      setShowCreate(false);
      setTitle("");
      setContentHtml("");
      toast.success("Waiver template created");
    },
    onError: () => toast.error("Failed to create waiver"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("digital_waivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digital-waivers"] });
      toast.success("Waiver deleted");
    },
  });

  const totalPupils = pupils?.length || 0;
  const signedPupilIds = new Set(signatures?.map(s => s.pupil_id));
  const unsignedCount = totalPupils - signedPupilIds.size;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <FileCheck className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{waivers?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold text-foreground">{signedPupilIds.size}</p>
            <p className="text-[10px] text-muted-foreground">Signed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertCircle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold text-foreground">{unsignedCount}</p>
            <p className="text-[10px] text-muted-foreground">Unsigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card>
              <CardHeader><CardTitle className="text-sm">New Waiver Template</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Waiver title" value={title} onChange={e => setTitle(e.target.value)} />
                <select
                  className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
                  value={waiverType}
                  onChange={e => setWaiverType(e.target.value)}
                >
                  <option value="terms">Terms & Conditions</option>
                  <option value="medical">Medical Declaration</option>
                  <option value="parental">Parental Consent</option>
                </select>
                <textarea
                  className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                  placeholder="Waiver content (HTML supported)"
                  value={contentHtml}
                  onChange={e => setContentHtml(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => createMutation.mutate()} disabled={!title || createMutation.isPending}>
                    Create
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> New Waiver Template
      </Button>

      {/* Waivers List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
      ) : (
        <div className="space-y-2">
          {waivers?.map(waiver => {
            const sigCount = signatures?.filter(s => s.waiver_id === waiver.id).length || 0;
            return (
              <Card key={waiver.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{waiver.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{waiver.waiver_type} • {sigCount} signed</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Reminder sent to unsigned pupils")}>
                      <Send className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(waiver.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!waivers?.length && (
            <p className="text-sm text-muted-foreground text-center py-4">No waiver templates yet. Create one above.</p>
          )}
        </div>
      )}

      {/* Recent Signatures */}
      {signatures && signatures.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Signatures</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {signatures.slice(0, 5).map(sig => (
              <div key={sig.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">{(sig as any).pupils?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{(sig as any).digital_waivers?.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(sig.signed_at).toLocaleDateString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
