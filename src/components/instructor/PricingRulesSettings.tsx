import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, PoundSterling } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PricingRule {
  id: string;
  rule_name: string;
  rule_type: string;
  condition: Record<string, any>;
  adjustment_type: string;
  adjustment_value: number;
  is_active: boolean;
}

interface PricingRulesSettingsProps {
  instructorId: string;
}

const RULE_TYPES = [
  { value: "time_of_day", label: "Time of Day", desc: "e.g. Evening surcharge" },
  { value: "day_of_week", label: "Day of Week", desc: "e.g. Weekend premium" },
  { value: "postcode_zone", label: "Postcode Zone", desc: "e.g. Distance surcharge" },
  { value: "advance_notice", label: "Advance Notice", desc: "e.g. Last-minute premium" },
];

export function PricingRulesSettings({ instructorId }: PricingRulesSettingsProps) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: "",
    rule_type: "time_of_day",
    adjustment_type: "flat",
    adjustment_value: 5,
    condition_value: "",
  });

  useEffect(() => { fetchRules(); }, [instructorId]);

  const fetchRules = async () => {
    const { data } = await supabase
      .from("pricing_rules")
      .select("*")
      .eq("instructor_id", instructorId)
      .order("display_order");
    if (data) setRules(data.map(r => ({ ...r, condition: r.condition as Record<string, any> })));
    setLoading(false);
  };

  const addRule = async () => {
    if (!newRule.rule_name) return;
    setAdding(true);
    try {
      let condition: Record<string, any> = {};
      if (newRule.rule_type === "time_of_day") {
        condition = { after: newRule.condition_value || "17:00" };
      } else if (newRule.rule_type === "day_of_week") {
        condition = { days: newRule.condition_value.split(",").map(d => d.trim()) };
      } else if (newRule.rule_type === "postcode_zone") {
        condition = { postcodes: newRule.condition_value.split(",").map(p => p.trim()) };
      } else if (newRule.rule_type === "advance_notice") {
        condition = { within_hours: parseInt(newRule.condition_value) || 24 };
      }

      const { error } = await supabase.from("pricing_rules").insert({
        instructor_id: instructorId,
        rule_name: newRule.rule_name,
        rule_type: newRule.rule_type,
        condition: condition as any,
        adjustment_type: newRule.adjustment_type,
        adjustment_value: newRule.adjustment_value,
        display_order: rules.length,
      });

      if (error) throw error;
      setNewRule({ rule_name: "", rule_type: "time_of_day", adjustment_type: "flat", adjustment_value: 5, condition_value: "" });
      fetchRules();
      toast.success("Pricing rule added");
    } catch { toast.error("Failed to add rule"); }
    finally { setAdding(false); }
  };

  const toggleRule = async (id: string, active: boolean) => {
    await supabase.from("pricing_rules").update({ is_active: active }).eq("id", id);
    setRules(rs => rs.map(r => r.id === id ? { ...r, is_active: active } : r));
  };

  const deleteRule = async (id: string) => {
    await supabase.from("pricing_rules").delete().eq("id", id);
    setRules(rs => rs.filter(r => r.id !== id));
    toast.success("Rule removed");
  };

  const getConditionLabel = (rule: PricingRule) => {
    const c = rule.condition;
    switch (rule.rule_type) {
      case "time_of_day": return `After ${c.after || "17:00"}`;
      case "day_of_week": return (c.days as string[])?.join(", ") || "Weekends";
      case "postcode_zone": return (c.postcodes as string[])?.join(", ") || "Zones";
      case "advance_notice": return `Within ${c.within_hours || 24}h`;
      default: return "";
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PoundSterling className="h-5 w-5 text-primary" />
          Price Adjustment Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Automatically adjust lesson prices based on time, day, location, or booking notice.
        </p>

        {rules.map(rule => (
          <div key={rule.id} className="flex items-center gap-3 p-3 rounded-none border bg-card">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{rule.rule_name}</p>
                <Badge variant="outline" className="text-xs">{RULE_TYPES.find(t => t.value === rule.rule_type)?.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getConditionLabel(rule)} → {rule.adjustment_type === "flat" ? `+£${rule.adjustment_value}` : `+${rule.adjustment_value}%`}
              </p>
            </div>
            <Switch checked={rule.is_active} onCheckedChange={(v) => toggleRule(rule.id, v)} />
            <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        <div className="border-t pt-4 space-y-3">
          <Label className="text-sm font-medium">Add New Rule</Label>
          <Input value={newRule.rule_name} onChange={(e) => setNewRule(r => ({ ...r, rule_name: e.target.value }))} placeholder="e.g. Evening Surcharge" />
          <div className="grid grid-cols-2 gap-3">
            <Select value={newRule.rule_type} onValueChange={(v) => setNewRule(r => ({ ...r, rule_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={newRule.condition_value} onChange={(e) => setNewRule(r => ({ ...r, condition_value: e.target.value }))} 
              placeholder={newRule.rule_type === "time_of_day" ? "17:00" : newRule.rule_type === "day_of_week" ? "Sat,Sun" : newRule.rule_type === "advance_notice" ? "24" : "SW1,EC1"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={newRule.adjustment_type} onValueChange={(v) => setNewRule(r => ({ ...r, adjustment_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat (£)</SelectItem>
                <SelectItem value="percent">Percent (%)</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" value={newRule.adjustment_value} onChange={(e) => setNewRule(r => ({ ...r, adjustment_value: Number(e.target.value) }))} />
          </div>
          <Button onClick={addRule} disabled={adding || !newRule.rule_name} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Rule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
