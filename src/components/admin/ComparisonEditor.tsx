import { useState, useCallback } from "react";
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

  // Track local edits — only persisted on Save
  const [dirtyValues, setDirtyValues] = useState<Record<string, Record<string, boolean | string>>>({});
  const [saving, setSaving] = useState(false);

  const hasDirtyChanges = Object.keys(dirtyValues).length > 0;
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

  const toggleFeatureValue = useCallback((featId: string, planSlug: string, currentVal: boolean | string | undefined) => {
    const newVal = typeof currentVal === "string" ? false : !currentVal;
    setDirtyValues((prev) => ({
      ...prev,
      [featId]: { ...(prev[featId] || {}), [planSlug]: newVal },
    }));
  }, []);

  const setFeatureText = useCallback((featId: string, planSlug: string, text: string) => {
    setDirtyValues((prev) => ({
      ...prev,
      [featId]: { ...(prev[featId] || {}), [planSlug]: text || false },
    }));
  }, []);

  const getDisplayValue = (feat: ComparisonFeature, planSlug: string) => {
    if (dirtyValues[feat.id] && planSlug in dirtyValues[feat.id]) {
      return dirtyValues[feat.id][planSlug];
    }
    return feat.plan_values[planSlug] ?? false;
  };

  const saveAllChanges = async () => {
    setSaving(true);
    let successCount = 0;
    let failCount = 0;

    for (const [featId, slugUpdates] of Object.entries(dirtyValues)) {
      const feat = features.find((f) => f.id === featId);
      if (!feat) continue;
      const mergedValues = { ...feat.plan_values, ...slugUpdates };
      try {
        await updateFeature.mutateAsync({ id: featId, plan_values: mergedValues });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSaving(false);
    setDirtyValues({});

    if (failCount === 0) {
      toast.success(`${successCount} feature${successCount !== 1 ? "s" : ""} saved`);
    } else {
      toast.error(`${failCount} update${failCount !== 1 ? "s" : ""} failed`);
    }
  };

  const discardChanges = () => {
    setDirtyValues({});
    toast("Changes discarded");
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
      setDirtyValues((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
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
          <div className="flex gap-2">
            {hasDirtyChanges && (
              <>
                <Button size="sm" variant="ghost" onClick={discardChanges} disabled={saving}>
                  <X className="h-3 w-3 mr-1" />Discard
                </Button>
                <Button size="sm" onClick={saveAllChanges} disabled={saving}>
                  <Save className="h-3 w-3 mr-1" />{saving ? "Saving..." : `Save ${Object.keys(dirtyValues).length} change${Object.keys(dirtyValues).length !== 1 ? "s" : ""}`}
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => setAddingFeature(!addingFeature)}>
              <Plus className="h-3 w-3 mr-1" />{addingFeature ? "Cancel" : "Add Feature"}
            </Button>
          </div>
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
                      .map((feat) => {
                        const isDirty = !!dirtyValues[feat.id];
                        return (
                          <tr key={feat.id} className={cn("border-b border-border/20 hover:bg-muted/5", isDirty && "bg-warning/5")}>
                            <td className="p-2 text-xs text-foreground font-medium">
                              {feat.feature_name}
                              {isDirty && <span className="ml-1 text-warning text-[9px]">●</span>}
                            </td>
                            {plans.map((plan) => {
                              const val = getDisplayValue(feat, plan.slug);
                              const isText = typeof val === "string";
                              return (
                                <td key={plan.id} className="p-1 text-center">
                                  {isText ? (
                                    <Input
                                      className="text-xs text-center h-7 w-20 mx-auto"
                                      value={val}
                                      onChange={(e) => setFeatureText(feat.id, plan.slug, e.target.value)}
                                    />
                                  ) : (
                                    <button
                                      onClick={() => toggleFeatureValue(feat.id, plan.slug, val)}
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
                        );
                      })}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sticky save bar at bottom */}
          {hasDirtyChanges && (
            <div className="sticky bottom-0 mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                {Object.keys(dirtyValues).length} unsaved change{Object.keys(dirtyValues).length !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={discardChanges} disabled={saving}>Discard</Button>
                <Button size="sm" onClick={saveAllChanges} disabled={saving}>
                  <Save className="h-3 w-3 mr-1" />{saving ? "Saving..." : "Save All"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
