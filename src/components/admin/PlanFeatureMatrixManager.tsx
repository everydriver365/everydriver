import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const makeKey = (featureId: string, planSlug: string) => `${featureId}:${planSlug}`;

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
    setAssignments(set);
    setLoading(false);
  };

  const handleToggle = async (featureId: string, planSlug: string) => {
    const key = makeKey(featureId, planSlug);
    const isChecked = assignments.has(key);

    setToggling((prev) => new Set(prev).add(key));

    if (isChecked) {
      const { error } = await supabase
        .from("feature_plan_assignments")
        .delete()
        .eq("feature_id", featureId)
        .eq("plan_slug", planSlug);

      if (error) {
        toast.error("Failed to remove assignment");
      } else {
        setAssignments((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    } else {
      const { error } = await supabase
        .from("feature_plan_assignments")
        .insert({ feature_id: featureId, plan_slug: planSlug });

      if (error) {
        toast.error("Failed to add assignment");
      } else {
        setAssignments((prev) => new Set(prev).add(key));
      }
    }

    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(key);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Plan Feature Matrix</h2>
        <p className="text-sm text-muted-foreground">
          Tick which features are included in each plan. Changes save automatically.
        </p>
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
              {Object.entries(grouped).map(([category, items]) => (
                <>
                  <tr key={`cat-${category}`} className="bg-muted/30">
                    <td colSpan={PLAN_SLUGS.length + 1} className="py-2 px-4 font-semibold text-foreground">
                      {category}
                    </td>
                  </tr>
                  {items.map((feature) => (
                    <tr key={feature.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-2.5 px-4 pl-8 text-muted-foreground">{feature.title}</td>
                      {PLAN_SLUGS.map((slug) => {
                        const key = makeKey(feature.id, slug);
                        return (
                          <td key={slug} className="text-center py-2.5 px-3">
                            <Checkbox
                              checked={assignments.has(key)}
                              onCheckedChange={() => handleToggle(feature.id, slug)}
                              disabled={toggling.has(key)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
