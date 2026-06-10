import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldCheck, Info, Lock } from "lucide-react";
import { toast } from "sonner";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import type { SchoolRecord } from "@/hooks/useSchoolData";

import squareLogo from "@/assets/square-logo.png";
import stripeLogo from "@/assets/stripe-logo.png";
import paypalLogo from "@/assets/paypal-logo.png";

interface Props {
  school: SchoolRecord;
  onRefresh: () => void;
}

export default function SchoolPaymentGatewaysSection({ school, onRefresh }: Props) {
  const { isDemo } = useSchoolDemo();
  const queryClient = useQueryClient();

  const schoolAny = school as any;
  const [mode, setMode] = useState<string>(schoolAny.payment_gateway_mode || "platform");

  // Connection status only — secret credentials are NEVER fetched to the client.
  // Publishable keys / app IDs are public and safe to display.
  const squareConnected = !!schoolAny.own_square_app_id;
  const stripeConnected = !!schoolAny.own_stripe_publishable_key;
  const paypalConnected = !!schoolAny.own_paypal_client_id;

  // Fetch commission config for school_payment
  const { data: commission } = useQuery({
    queryKey: ["platform-commission-config", "school_payment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_commission_config")
        .select("*")
        .eq("commission_type", "school_payment")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const modeMutation = useMutation({
    mutationFn: async (newMode: string) => {
      if (isDemo) return;
      const { error } = await supabase
        .from("schools")
        .update({ payment_gateway_mode: newMode } as any)
        .eq("id", school.id);
      if (error) throw error;
    },
    onSuccess: () => {
      onRefresh();
      toast.success("Payment gateway mode updated");
    },
    onError: () => toast.error("Failed to update gateway mode"),
  });

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    if (isDemo) {
      toast.success("Payment gateway mode updated (demo)");
      return;
    }
    modeMutation.mutate(newMode);
  };

  const commissionRate = commission?.rate_percent ?? 3.5;
  const commissionFixed = commission?.fixed_fee_pence ?? 20;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Payment Gateways</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how your school processes digital payments from pupils.
        </p>
      </div>

      {/* Mode selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Processing Mode</CardTitle>
          <CardDescription>
            Select whether to use the platform's managed payment processing or connect your own gateway.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mode} onValueChange={handleModeChange} className="space-y-4">
            {/* Platform mode */}
            <label
              className={`flex items-start gap-4 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                mode === "platform"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <RadioGroupItem value="platform" className="mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Use DSM Square Account</span>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Accept card payments instantly via the platform's managed Square account. A small service commission applies.
                </p>
                <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                    Commission Rate
                  </p>
                  <p className="text-muted-foreground">
                    {commissionRate}% + {commissionFixed}p per transaction — set by platform admin
                  </p>
                  <p className="text-muted-foreground">
                    Example: on a £40 payment → £{((40 * commissionRate / 100) + commissionFixed / 100).toFixed(2)} fee
                  </p>
                </div>
              </div>
            </label>

            {/* Own gateway mode */}
            <label
              className={`flex items-start gap-4 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                mode === "own"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <RadioGroupItem value="own" className="mt-1" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold text-foreground">Use Your Own Gateway</span>
                <p className="text-sm text-muted-foreground">
                  Connect your own Square, Stripe, or PayPal account. No platform commission — you pay the gateway's standard fees directly.
                </p>
              </div>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Gateway connection status (no secrets exposed) */}
      {mode === "own" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected Gateways</CardTitle>
            <CardDescription>
              Connection status for your payment providers. Secret credentials are stored securely on the server and are never displayed here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <GatewayRow logo={squareLogo} name="Square" connected={squareConnected} />
            <GatewayRow logo={stripeLogo} name="Stripe" connected={stripeConnected} />
            <GatewayRow logo={paypalLogo} name="PayPal" connected={paypalConnected} />

            <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2 mt-4">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                For security, gateway secret keys can only be set up by the platform team. Contact support to connect or update a gateway.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              <strong>How it works:</strong> When using the DSM Square account, payments are processed through the platform and a service commission is deducted before funds are settled to your school. When using your own gateway, payments go directly to your account with no platform commission — you only pay the provider's standard processing fees.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function GatewayRow({ logo, name, connected }: { logo: string; name: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <img src={logo} alt={name} className="h-6 object-contain" loading="lazy" />
        <span className="font-medium text-sm">{name}</span>
      </div>
      <Badge variant={connected ? "default" : "secondary"}>
        {connected ? "Connected" : "Not connected"}
      </Badge>
    </div>
  );
}
