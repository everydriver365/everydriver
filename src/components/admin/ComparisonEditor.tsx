import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, Plus, Trash2, X, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useComparisonPlans,
  useComparisonFeatures,
  useUpdatePlan,
  useUpdateFeature,
  useCreateFeature,
  useDeleteFeature,
  type ComparisonPlan,
  type ComparisonFeature,
} from "@/hooks/useComparisonData";

export default function ComparisonEditor() {
  const { data: plans = [], isLoading: plansLoading } = useComparisonPlans();
  const { data: features = [], isLoading: featuresLoading } = useComparisonFeatures();
  const updatePlan = useUpdatePlan();
  const updateFeature = useUpdateFeature();
  const createFeature = useCreateFeature();
  const deleteFeature = useDeleteFeature();

  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planDraft, setPlanDraft] = useState<Partial<ComparisonPlan>>({});
  const [addingFeature, setAddingFeature] = useState(false);
  const [newFeature, setNewFeature] = useState({ category: "", feature_name: "" });

  const categories = [...new Set(features.map((f) => f.category))];

  const startEditPlan = (plan: ComparisonPlan) => {
    setEditingPlan(plan.id);
    setPlanDraft({ name: plan.name, price: plan.price, period: plan.period, cta_text: plan.cta_text, description: plan.description || "", is_popular: plan.is_popular });
  };

  const savePlan = async () => {
    if (!editingPlan) return;
    try {
      await updatePlan.mutateAsync({ id: editingPlan, ...planDraft });
      toast.success("Plan updated");
      setEditingPlan(null);
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const toggleFeatureValue = async (feat: ComparisonFeature, planSlug: string) => {
    const currentVal = feat.plan_values[planSlug];
    const newVal = typeof currentVal === "string" ? false : !currentVal;
    const newValues = { ...feat.plan_values, [planSlug]: newVal };
    try {
      await updateFeature.mutateAsync({ id: feat.id, plan_values: newValues });
    } catch {
      toast.error("Failed to update");
    }
  };

  const setFeatureText = async (feat: ComparisonFeature, planSlug: string, text: string) => {
    const newValues = { ...feat.plan_values, [planSlug]: text || false };
    try {
      await updateFeature.mutateAsync({ id: feat.id, plan_values: newValues });
    } catch {
      toast.error("Failed to update");
    }
  };

  const addNewFeature = async () => {
    if (!newFeature.category || !newFeature.feature_name) {
      toast.error("Category and feature name are required");
      return;
    }
    const maxOrder = Math.max(0, ...features.map((f) => f.display_order));
    const planValues: Record<string, boolean> = {};
    plans.forEach((p) => (planValues[p.slug] = false));
    try {
      await createFeature.mutateAsync({
        category: newFeature.category,
        feature_name: newFeature.feature_name,
        plan_values: planValues,
        display_order: maxOrder + 1,
      });
      toast.success("Feature added");
      setNewFeature({ category: "", feature_name: "" });
      setAddingFeature(false);
    } catch {
      toast.error("Failed to add feature");
    }
  };

  const removeFeature = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteFeature.mutateAsync(id);
      toast.success("Feature removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (plansLoading || featuresLoading) {
    return <div className="p-6 text-muted-foreground">Loading comparison data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Plan Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className={cn("border rounded-xl p-4 space-y-2", plan.is_popular && "border-primary")}>
                {editingPlan === plan.id ? (
                  <div className="space-y-2">
                    <Input value={planDraft.name || ""} onChange={(e) => setPlanDraft({ ...planDraft, name: e.target.value })} placeholder="Plan name" className="text-sm" />
                    <div className="flex gap-2">
                      <Input value={planDraft.price || ""} onChange={(e) => setPlanDraft({ ...planDraft, price: e.target.value })} placeholder="Price" className="text-sm" />
                      <Input value={planDraft.period || ""} onChange={(e) => setPlanDraft({ ...planDraft, period: e.target.value })} placeholder="Period" className="text-sm w-20" />
                    </div>
                    <Input value={planDraft.cta_text || ""} onChange={(e) => setPlanDraft({ ...planDraft, cta_text: e.target.value })} placeholder="CTA text" className="text-sm" />
                    <Input value={planDraft.description || ""} onChange={(e) => setPlanDraft({ ...planDraft, description: e.target.value })} placeholder="Description" className="text-sm" />
                    <div className="flex items-center gap-2">
                      <Switch checked={planDraft.is_popular || false} onCheckedChange={(v) => setPlanDraft({ ...planDraft, is_popular: v })} />
                      <span className="text-xs text-muted-foreground">Popular badge</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={savePlan} disabled={updatePlan.isPending}><Save className="h-3 w-3 mr-1" />Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingPlan(null)}><X className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground">{plan.name}</span>
                        {plan.is_popular && <Badge className="ml-2 text-[9px]">Popular</Badge>}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => startEditPlan(plan)}><Pencil className="h-3 w-3" /></Button>
                    </div>
                    <div className="text-xl font-black text-foreground">{plan.price}<span className="text-xs font-normal text-muted-foreground">{plan.period}</span></div>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Matrix Editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Feature Matrix</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddingFeature(!addingFeature)}>
            <Plus className="h-3 w-3 mr-1" />{addingFeature ? "Cancel" : "Add Feature"}
          </Button>
        </CardHeader>
        <CardContent>
          {addingFeature && (
            <div className="flex gap-2 mb-4 p-3 bg-muted/10 rounded-lg border">
              <Input
                value={newFeature.category}
                onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value })}
                placeholder="Category (e.g. Core)"
                className="text-sm"
                list="categories"
              />
              <datalist id="categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
              <Input
                value={newFeature.feature_name}
                onChange={(e) => setNewFeature({ ...newFeature, feature_name: e.target.value })}
                placeholder="Feature name"
                className="text-sm"
              />
              <Button size="sm" onClick={addNewFeature} disabled={createFeature.isPending}>Add</Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 w-48 text-xs text-muted-foreground font-medium">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} className="p-2 text-center min-w-[80px] text-xs font-bold text-foreground">{p.name}</th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <>
                    <tr key={cat + "-header"}>
                      <td colSpan={plans.length + 2} className="pt-4 pb-1 pl-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{cat}</span>
                      </td>
                    </tr>
                    {features
                      .filter((f) => f.category === cat)
                      .map((feat) => (
                        <tr key={feat.id} className="border-b border-border/20 hover:bg-muted/5">
                          <td className="p-2 text-xs text-foreground font-medium">{feat.feature_name}</td>
                          {plans.map((plan) => {
                            const val = feat.plan_values[plan.slug];
                            const isText = typeof val === "string";
                            return (
                              <td key={plan.id} className="p-1 text-center">
                                {isText ? (
                                  <Input
                                    className="text-xs text-center h-7 w-20 mx-auto"
                                    value={val}
                                    onChange={(e) => setFeatureText(feat, plan.slug, e.target.value)}
                                  />
                                ) : (
                                  <button
                                    onClick={() => toggleFeatureValue(feat, plan.slug)}
                                    className={cn(
                                      "w-6 h-6 rounded-md border mx-auto flex items-center justify-center transition-colors",
                                      val
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                        : "bg-muted/20 border-border text-muted-foreground/20 hover:border-muted-foreground/40"
                                    )}
                                  >
                                    {val ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-1">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive/50 hover:text-destructive" onClick={() => removeFeature(feat.id, feat.feature_name)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
