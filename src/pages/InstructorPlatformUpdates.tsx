import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Megaphone, ThumbsUp, ThumbsDown, Plus, Sparkles, Bug, Wrench, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  feature: { label: "New Feature", icon: Sparkles, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  improvement: { label: "Improvement", icon: Wrench, color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  bugfix: { label: "Bug Fix", icon: Bug, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-muted text-muted-foreground" },
  planned: { label: "Planned", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  completed: { label: "Done", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  declined: { label: "Declined", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

export default function InstructorPlatformUpdates() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("updates");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Fetch platform updates
  const { data: updates = [] } = useQuery({
    queryKey: ["platform-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_updates")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch feature suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ["feature-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_suggestions")
        .select("*")
        .order("upvotes", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch current user's votes
  const { data: myVotes = [] } = useQuery({
    queryKey: ["my-suggestion-votes", instructor?.id],
    queryFn: async () => {
      if (!instructor?.id) return [];
      const { data, error } = await supabase
        .from("feature_suggestion_votes")
        .select("suggestion_id, vote")
        .eq("instructor_id", instructor.id);
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const myVoteMap = new Map(myVotes.map((v: any) => [v.suggestion_id, v.vote]));

  // Submit suggestion
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("feature_suggestions").insert({
        instructor_id: instructor!.id,
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-suggestions"] });
      setNewTitle("");
      setNewDescription("");
      setShowForm(false);
      toast.success("Suggestion submitted!");
    },
    onError: () => toast.error("Failed to submit suggestion"),
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ suggestionId, vote }: { suggestionId: string; vote: 1 | -1 }) => {
      const existing = myVoteMap.get(suggestionId);
      if (existing === vote) {
        // Remove vote
        const { error } = await supabase
          .from("feature_suggestion_votes")
          .delete()
          .eq("suggestion_id", suggestionId)
          .eq("instructor_id", instructor!.id);
        if (error) throw error;
      } else if (existing) {
        // Change vote
        const { error } = await supabase
          .from("feature_suggestion_votes")
          .update({ vote })
          .eq("suggestion_id", suggestionId)
          .eq("instructor_id", instructor!.id);
        if (error) throw error;
      } else {
        // New vote
        const { error } = await supabase.from("feature_suggestion_votes").insert({
          suggestion_id: suggestionId,
          instructor_id: instructor!.id,
          vote,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["my-suggestion-votes"] });
    },
  });

  return (
    <InstructorPortalLayout>
      <div className="space-y-5 pb-24">
        <InstructorPageHeader
          lucideIcon={Megaphone}
          title="Platform Updates"
          subtitle="What's new & share your ideas"
        />

        <IOSSegmentedControl
          segments={[
            { value: "updates", label: "What's New" },
            { value: "suggestions", label: "Feature Ideas" },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === "updates" && (
          <div className="space-y-3">
            {updates.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No updates yet — check back soon!</CardContent></Card>
            )}
            {updates.map((u: any, i: number) => {
              const cat = CATEGORY_CONFIG[u.category] || CATEGORY_CONFIG.feature;
              const CatIcon = cat.icon;
              return (
                <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cat.color}>
                          <CatIcon className="h-3 w-3 mr-1" />
                          {cat.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{format(new Date(u.created_at), "d MMM yyyy")}</span>
                      </div>
                      <h3 className="font-semibold text-sm">{u.title}</h3>
                      <p className="text-sm text-muted-foreground">{u.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {tab === "suggestions" && (
          <div className="space-y-3">
            {/* Submit new */}
            {!showForm ? (
              <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Suggest a Feature
              </Button>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Input placeholder="Feature title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                  <Textarea placeholder="Describe your idea…" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!newTitle.trim() || submitMutation.isPending} onClick={() => submitMutation.mutate()}>
                      Submit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {suggestions.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No suggestions yet — be the first!</CardContent></Card>
            )}
            {suggestions.map((s: any, i: number) => {
              const net = (s.upvotes || 0) - (s.downvotes || 0);
              const myVote = myVoteMap.get(s.id);
              const status = STATUS_CONFIG[s.status] || STATUS_CONFIG.open;
              return (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Vote column */}
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => voteMutation.mutate({ suggestionId: s.id, vote: 1 })}
                            className={`p-1.5 rounded-lg transition-colors ${myVote === 1 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "text-muted-foreground hover:bg-muted"}`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <span className={`text-sm font-bold ${net > 0 ? "text-emerald-600" : net < 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                            {net}
                          </span>
                          <button
                            onClick={() => voteMutation.mutate({ suggestionId: s.id, vote: -1 })}
                            className={`p-1.5 rounded-lg transition-colors ${myVote === -1 ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30" : "text-muted-foreground hover:bg-muted"}`}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate">{s.title}</h3>
                            <Badge variant="secondary" className={`text-[10px] shrink-0 ${status.color}`}>{status.label}</Badge>
                          </div>
                          {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                          <span className="text-[11px] text-muted-foreground">{format(new Date(s.created_at), "d MMM yyyy")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
