import { useState, useEffect, useRef, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  id: string;
  title: string;
  category: string;
  display_order: number;
}

interface Assignment {
  feature_id: string;
  plan_slug: string;
}

const PLAN_SLUGS = ["free", "pro", "max", "multi", "enterprise"];
const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  max: "Max",
  multi: "Multi",
  enterprise: "Enterprise",
};

export function PlanFeatureMatrixManager() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [assignments, setAssignments] = useState<Set<string>>(new Set());
  const [savedAssignments, setSavedAssignments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const makeKey = (featureId: string, planSlug: string) => `${featureId}:${planSlug}`;

  const hasChanges = (() => {
    if (assignments.size !== savedAssignments.size) return true;
    for (const key of assignments) {
      if (!savedAssignments.has(key)) return true;
    }
    return false;
  })();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [featuresRes, assignmentsRes] = await Promise.all([
      supabase
        .from("feature_showcase_items")
        .select("id, title, category, display_order")
        .order("category")
        .order("display_order"),
      supabase
        .from("feature_plan_assignments")
        .select("feature_id, plan_slug"),
    ]);

    if (featuresRes.error || assignmentsRes.error) {
      toast.error("Failed to load data");
      return;
    }

    setFeatures(featuresRes.data || []);
    const set = new Set<string>();
    (assignmentsRes.data || []).forEach((a: Assignment) => set.add(makeKey(a.feature_id, a.plan_slug)));
    setAssignments(new Set(set));
    setSavedAssignments(new Set(set));
    setLoading(false);
  };

  const handleToggle = (featureId: string, planSlug: string) => {
    const key = makeKey(featureId, planSlug);
    setAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    // Clear "just saved" indicator when making new changes
    setJustSaved(false);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  };

  const handleSave = async () => {
    setSaving(true);

    // Calculate diffs
    const toAdd: { feature_id: string; plan_slug: string }[] = [];
    const toRemove: { feature_id: string; plan_slug: string }[] = [];

    for (const key of assignments) {
      if (!savedAssignments.has(key)) {
        const [feature_id, plan_slug] = key.split(":");
        toAdd.push({ feature_id, plan_slug });
      }
    }
    for (const key of savedAssignments) {
      if (!assignments.has(key)) {
        const [feature_id, plan_slug] = key.split(":");
        toRemove.push({ feature_id, plan_slug });
      }
    }

    let hasError = false;

    // Batch delete
    for (const item of toRemove) {
      const { error } = await supabase
        .from("feature_plan_assignments")
        .delete()
        .eq("feature_id", item.feature_id)
        .eq("plan_slug", item.plan_slug);
      if (error) hasError = true;
    }

    // Batch insert
    if (toAdd.length > 0) {
      const { error } = await supabase
        .from("feature_plan_assignments")
        .insert(toAdd);
      if (error) hasError = true;
    }

    if (hasError) {
      toast.error("Some changes failed to save");
    } else {
      setSavedAssignments(new Set(assignments));
      setJustSaved(true);
      toast.success(`Saved ${toAdd.length + toRemove.length} changes`);
      savedTimerRef.current = setTimeout(() => setJustSaved(false), 4000);
    }

    setSaving(false);
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group features by category
  const grouped: Record<string, Feature[]> = {};
  features.forEach((f) => {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  });

  const changeCount = (() => {
    let count = 0;
    for (const key of assignments) {
      if (!savedAssignments.has(key)) count++;
    }
    for (const key of savedAssignments) {
      if (!assignments.has(key)) count++;
    }
    return count;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Plan Feature Matrix</h2>
          <p className="text-sm text-muted-foreground">
            Tick which features are included in each plan, then hit Save.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {justSaved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
            {hasChanges && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                {changeCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium min-w-[250px]">Feature</th>
                {PLAN_SLUGS.map((slug) => (
                  <th key={slug} className="text-center py-3 px-3 font-medium w-24">
                    {PLAN_LABELS[slug]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([category, items]) => {
                const isCollapsed = collapsedCategories.has(category);
                const assignedCount = items.reduce((acc, f) => {
                  return acc + PLAN_SLUGS.filter((s) => assignments.has(makeKey(f.id, s))).length;
                }, 0);

                return (
                  <Fragment key={`cat-${category}`}>
                    <tr
                      className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      <td colSpan={PLAN_SLUGS.length + 1} className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isCollapsed && "-rotate-90"
                          )} />
                          <span className="font-semibold text-foreground">{category}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                            {items.length} features · {assignedCount} assigned
                          </Badge>
                        </div>
                      </td>
                    </tr>
                    {!isCollapsed && items.map((feature) => (
                      <tr key={feature.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-2.5 px-4 pl-8 text-muted-foreground">{feature.title}</td>
                        {PLAN_SLUGS.map((slug) => {
                          const key = makeKey(feature.id, slug);
                          const isChanged = assignments.has(key) !== savedAssignments.has(key);
                          return (
                            <td key={slug} className={cn(
                              "text-center py-2.5 px-3",
                              isChanged && "bg-amber-500/10"
                            )}>
                              <Checkbox
                                checked={assignments.has(key)}
                                onCheckedChange={() => handleToggle(feature.id, slug)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
