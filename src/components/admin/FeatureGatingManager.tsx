import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Shield, Check, X, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  slug: string;
  features: string[];
}

interface Gate {
  id: string;
  menu_item_key: string;
  menu_item_label: string;
  menu_section: string;
  required_feature: string | null;
  is_locked_for_free: boolean;
  upgrade_message: string | null;
  display_order: number;
}

export function FeatureGatingManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [plansRes, gatesRes] = await Promise.all([
      supabase.from('subscription_plans').select('id, name, slug, features').order('display_order'),
      supabase.from('menu_feature_gates').select('*').order('display_order'),
    ]);
    setPlans((plansRes.data || []) as Plan[]);
    setGates(gatesRes.data || []);
    setLoading(false);
  };

  const planHasFeature = (plan: Plan, requiredFeature: string | null): boolean => {
    if (!requiredFeature) return true;
    if (!plan.features) return false;
    // Check for wildcard features
    if (plan.features.includes('all_max_features') || plan.features.includes('all_multi_features')) return true;
    return plan.features.includes(requiredFeature);
  };

  const updateGate = async (gateId: string, updates: Partial<Gate>) => {
    setSaving(gateId);
    const { error } = await supabase
      .from('menu_feature_gates')
      .update(updates)
      .eq('id', gateId);

    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success("Updated");
      setGates(prev => prev.map(g => g.id === gateId ? { ...g, ...updates } : g));
    }
    setSaving(null);
  };

  // Group gates by section
  const sections = gates.reduce<Record<string, Gate[]>>((acc, gate) => {
    (acc[gate.menu_section] = acc[gate.menu_section] || []).push(gate);
    return acc;
  }, {});

  if (loading) {
    return <div className="text-sm text-muted-foreground p-4">Loading feature gates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Feature Gating</h2>
          <p className="text-sm text-muted-foreground">
            Control which menu items each plan can access. Locked items show greyed out with an upgrade prompt.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {plans.map(plan => (
          <Badge key={plan.slug} variant="outline" className="gap-1">
            {plan.name}
          </Badge>
        ))}
        <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> Accessible</span>
        <span className="flex items-center gap-1 text-destructive"><X className="h-3 w-3" /> Locked</span>
      </div>

      {Object.entries(sections).map(([section, sectionGates]) => (
        <Card key={section}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{section}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">Menu Item</th>
                    <th className="text-left p-3 font-medium w-40">Required Feature</th>
                    {plans.map(plan => (
                      <th key={plan.slug} className="text-center p-3 font-medium w-20">{plan.name}</th>
                    ))}
                    <th className="text-center p-3 font-medium w-20">Locked</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionGates.map(gate => (
                    <tr key={gate.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="p-3 font-medium">{gate.menu_item_label}</td>
                      <td className="p-3">
                        <Input
                          value={gate.required_feature || ""}
                          onChange={(e) => {
                            setGates(prev => prev.map(g =>
                              g.id === gate.id ? { ...g, required_feature: e.target.value || null } : g
                            ));
                          }}
                          onBlur={() => updateGate(gate.id, { required_feature: gate.required_feature })}
                          placeholder="none"
                          className="h-7 text-xs"
                        />
                      </td>
                      {plans.map(plan => {
                        const hasAccess = planHasFeature(plan, gate.required_feature);
                        return (
                          <td key={plan.slug} className="text-center p-3">
                            {hasAccess ? (
                              <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                            ) : (
                              <Lock className="h-4 w-4 text-destructive/60 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center p-3">
                        <Switch
                          checked={gate.is_locked_for_free}
                          onCheckedChange={(checked) =>
                            updateGate(gate.id, { is_locked_for_free: checked })
                          }
                          disabled={saving === gate.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
