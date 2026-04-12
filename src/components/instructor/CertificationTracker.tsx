import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Award, Plus, BookOpen, Car, GraduationCap, Trophy, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const MILESTONE_TYPES = [
  { value: "theory_ready", label: "Theory Ready", icon: BookOpen, color: "text-blue-500" },
  { value: "practical_ready", label: "Practical Ready", icon: Car, color: "text-green-500" },
  { value: "course_complete", label: "Course Complete", icon: GraduationCap, color: "text-purple-500" },
  { value: "hours_milestone", label: "Hours Milestone", icon: Clock, color: "text-amber-500" },
  { value: "test_passed", label: "Test Passed", icon: Trophy, color: "text-primary" },
];

export function CertificationTracker() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();
  const [showAward, setShowAward] = useState(false);
  const [selectedPupil, setSelectedPupil] = useState("");
  const [milestoneType, setMilestoneType] = useState("theory_ready");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const { data: certifications, isLoading } = useQuery({
    queryKey: ["certifications", instructor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pupil_certifications")
        .select("*, pupils(name)")
        .eq("instructor_id", instructor!.id)
        .order("awarded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const { data: pupils } = useQuery({
    queryKey: ["cert-pupils", instructor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", instructor!.id)
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const awardMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pupil_certifications").insert({
        pupil_id: selectedPupil,
        instructor_id: instructor!.id,
        milestone_type: milestoneType,
        title: title || MILESTONE_TYPES.find(m => m.value === milestoneType)?.label || milestoneType,
        notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      setShowAward(false);
      setSelectedPupil("");
      setTitle("");
      setNotes("");
      toast.success("Milestone awarded!");
    },
    onError: () => toast.error("Failed to award milestone"),
  });

  // Group by pupil for timeline view
  const pupilCerts = new Map<string, any[]>();
  certifications?.forEach(cert => {
    const name = (cert as any).pupils?.name || "Unknown";
    const existing = pupilCerts.get(name) || [];
    existing.push(cert);
    pupilCerts.set(name, existing);
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {["theory_ready", "practical_ready", "test_passed"].map(type => {
          const mt = MILESTONE_TYPES.find(m => m.value === type)!;
          const Icon = mt.icon;
          const count = certifications?.filter(c => c.milestone_type === type).length || 0;
          return (
            <Card key={type}>
              <CardContent className="p-3 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${mt.color}`} />
                <p className="text-lg font-bold text-foreground">{count}</p>
                <p className="text-[10px] text-muted-foreground">{mt.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button size="sm" onClick={() => setShowAward(!showAward)} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Award Milestone
      </Button>

      {/* Award Form */}
      <AnimatePresence>
        {showAward && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <select
                  className="w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm"
                  value={selectedPupil}
                  onChange={e => setSelectedPupil(e.target.value)}
                >
                  <option value="">Select pupil...</option>
                  {pupils?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                  className="w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm"
                  value={milestoneType}
                  onChange={e => setMilestoneType(e.target.value)}
                >
                  {MILESTONE_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <Input placeholder="Custom title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
                <Input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => awardMutation.mutate()} disabled={!selectedPupil || awardMutation.isPending}>
                    <Award className="h-4 w-4 mr-1" /> Award
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAward(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline by Pupil */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
      ) : (
        <div className="space-y-3">
          {Array.from(pupilCerts.entries()).map(([pupilName, certs]) => (
            <Card key={pupilName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{pupilName}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="relative pl-4 border-l-2 border-primary/20 space-y-3">
                  {certs.map(cert => {
                    const mt = MILESTONE_TYPES.find(m => m.value === cert.milestone_type);
                    const Icon = mt?.icon || Award;
                    return (
                      <div key={cert.id} className="relative">
                        <div className={`absolute -left-[21px] w-3 h-3 rounded-full bg-background border-2 border-primary`} />
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${mt?.color || "text-primary"}`} />
                          <p className="text-sm font-medium text-foreground">{cert.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{format(new Date(cert.awarded_at), "d MMM yyyy")}</p>
                        {cert.notes && <p className="text-xs text-muted-foreground mt-0.5">{cert.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          {!certifications?.length && (
            <p className="text-sm text-muted-foreground text-center py-4">No milestones awarded yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
