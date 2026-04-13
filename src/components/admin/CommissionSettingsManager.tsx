import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, PoundSterling, Percent } from "lucide-react";
import { toast } from "sonner";

interface CommissionConfig {
  id: string;
  commission_type: string;
  rate_percent: number;
  fixed_fee_pence: number;
  is_active: boolean;
}

export function CommissionSettingsManager() {
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery<CommissionConfig[]>({
    queryKey: ["platform-commission-config-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_commission_config")
        .select("*")
        .order("commission_type");
      if (error) throw error;
      return (data || []) as CommissionConfig[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Commission & Fee Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the platform commission rates applied to digital payments and subscriptions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {configs?.map((config) => (
          <CommissionConfigCard key={config.id} config={config} />
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> When <em>commission_payer</em> is set to "pupil" on an instructor,
            the admin fee (percentage + fixed) is added on top of the payment amount at checkout.
            When set to "instructor", the fee is absorbed by the instructor and deducted from their payout. This is a platform service fee, not a payment surcharge.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CommissionConfigCard({ config }: { config: CommissionConfig }) {
  const queryClient = useQueryClient();
  const [ratePercent, setRatePercent] = useState(config.rate_percent.toString());
  const [fixedFeePence, setFixedFeePence] = useState(config.fixed_fee_pence.toString());
  const [isActive, setIsActive] = useState(config.is_active);

  const isDirty =
    ratePercent !== config.rate_percent.toString() ||
    fixedFeePence !== config.fixed_fee_pence.toString() ||
    isActive !== config.is_active;

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("platform_commission_config")
        .update({
          rate_percent: parseFloat(ratePercent) || 0,
          fixed_fee_pence: parseInt(fixedFeePence) || 0,
          is_active: isActive,
        })
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-commission-config-admin"] });
      queryClient.invalidateQueries({ queryKey: ["platform-commission-config"] });
      toast.success(`${config.commission_type === "payment" ? "Payment" : "Subscription"} commission updated`);
    },
    onError: () => {
      toast.error("Failed to update commission settings");
    },
  });

  const exampleAmount = 40;
  const rate = parseFloat(ratePercent) || 0;
  const fixed = (parseInt(fixedFeePence) || 0) / 100;
  const exampleFee = Math.round((exampleAmount * (rate / 100) + fixed) * 100) / 100;

  const typeLabel = config.commission_type === "payment" ? "Payment" : config.commission_type === "school_payment" ? "School Payment" : "Subscription";
  const typeIcon = config.commission_type === "payment" ? "💳" : config.commission_type === "school_payment" ? "🏫" : "📦";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">{typeIcon}</span>
            {typeLabel} Commission
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <CardDescription>
          Fee applied to {config.commission_type === "payment" ? "digital pupil payments" : config.commission_type === "school_payment" ? "school payments via platform account" : "instructor subscriptions"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Percent className="h-3 w-3" />
              Rate (%)
            </Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={ratePercent}
              onChange={(e) => setRatePercent(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <PoundSterling className="h-3 w-3" />
              Fixed Fee (pence)
            </Label>
            <Input
              type="number"
              step="1"
              min="0"
              value={fixedFeePence}
              onChange={(e) => setFixedFeePence(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {/* Live example */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Example on £{exampleAmount} payment:</p>
          <p>Fee: £{exampleAmount} × {rate}% + {(parseInt(fixedFeePence) || 0)}p = <span className="font-semibold text-foreground">£{exampleFee.toFixed(2)}</span></p>
          <p>Pupil charged: <span className="font-semibold text-foreground">£{(exampleAmount + exampleFee).toFixed(2)}</span></p>
        </div>

        <Button
          onClick={() => mutation.mutate()}
          disabled={!isDirty || mutation.isPending}
          className="w-full"
          size="sm"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
