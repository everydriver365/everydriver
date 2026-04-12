import { useState, useEffect } from "react";
import { Clock, Percent, FileText, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CancellationPolicyEditorProps {
  instructorId: string;
}

const HOUR_OPTIONS = [
  { value: 2, label: "2 hours" },
  { value: 6, label: "6 hours" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "24 hours" },
  { value: 48, label: "48 hours" },
  { value: 72, label: "72 hours (3 days)" },
  { value: 168, label: "1 week" },
];

export function CancellationPolicyEditor({ instructorId }: CancellationPolicyEditorProps) {
  const [policyHours, setPolicyHours] = useState<number>(24);
  const [chargePercent, setChargePercent] = useState<number>(100);
  const [policyText, setPolicyText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, [instructorId]);

  const fetchPolicy = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("cancellation_policy_hours, cancellation_charge_percent, cancellation_policy_text")
        .eq("id", instructorId)
        .single();

      if (error) throw error;

      if (data) {
        setPolicyHours(data.cancellation_policy_hours ?? 24);
        setChargePercent(data.cancellation_charge_percent ?? 100);
        setPolicyText(data.cancellation_policy_text ?? "");
      }
    } catch (error) {
      console.error("Error fetching cancellation policy:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultText = () => {
    const hoursLabel = policyHours >= 24 
      ? `${Math.floor(policyHours / 24)} day${policyHours >= 48 ? 's' : ''}`
      : `${policyHours} hour${policyHours !== 1 ? 's' : ''}`;
    
    if (chargePercent === 0) {
      return `No cancellation fee applies. You may cancel your lesson at any time.`;
    } else if (chargePercent === 100) {
      return `Full lesson fee applies for cancellations made less than ${hoursLabel} before the scheduled lesson time.`;
    } else {
      return `A ${chargePercent}% cancellation fee applies for cancellations made less than ${hoursLabel} before the scheduled lesson time.`;
    }
  };

  const handleGenerateText = () => {
    setPolicyText(generateDefaultText());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({
          cancellation_policy_hours: policyHours,
          cancellation_charge_percent: chargePercent,
          cancellation_policy_text: policyText,
        })
        .eq("id", instructorId);

      if (error) throw error;

      toast({
        title: "Policy saved",
        description: "Your cancellation policy has been updated",
      });
    } catch (error) {
      console.error("Error saving policy:", error);
      toast({
        title: "Error",
        description: "Failed to save cancellation policy",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Cancellation Policy
        </CardTitle>
        <CardDescription>
          Set your terms for lesson cancellations and late notice fees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notice Period */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Minimum Notice Required
          </Label>
          <Select
            value={policyHours.toString()}
            onValueChange={(v) => setPolicyHours(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Cancellations with less notice than this will be subject to a fee
          </p>
        </div>

        {/* Charge Percentage */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Late Cancellation Charge: {chargePercent}%
          </Label>
          <Slider
            value={[chargePercent]}
            onValueChange={([v]) => setChargePercent(v)}
            min={0}
            max={100}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>No charge</span>
            <span>50%</span>
            <span>Full charge</span>
          </div>
        </div>

        {/* Policy Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Policy Wording</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateText}
              className="text-xs"
            >
              Generate from settings
            </Button>
          </div>
          <Textarea
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            placeholder="Enter your cancellation policy text..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This text will be shown to pupils when booking lessons
          </p>
        </div>

        {/* Preview */}
        <div className="rounded-2xl bg-muted/50 p-4 border">
          <p className="text-sm font-medium mb-1">Policy Preview</p>
          <p className="text-sm text-muted-foreground">
            {policyText || "No policy text set"}
          </p>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Policy
        </Button>
      </CardContent>
    </Card>
  );
}
