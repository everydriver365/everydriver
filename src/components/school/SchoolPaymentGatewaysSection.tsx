import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, ShieldCheck, Info } from "lucide-react";
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

  // Own gateway credentials
  const [squareAppId, setSquareAppId] = useState(schoolAny.own_square_app_id || "");
  const [squareAccessToken, setSquareAccessToken] = useState(schoolAny.own_square_access_token || "");
  const [squareLocationId, setSquareLocationId] = useState(schoolAny.own_square_location_id || "");
  const [stripePublishableKey, setStripePublishableKey] = useState(schoolAny.own_stripe_publishable_key || "");
  const [stripeSecretKey, setStripeSecretKey] = useState(schoolAny.own_stripe_secret_key || "");
  const [paypalClientId, setPaypalClientId] = useState(schoolAny.own_paypal_client_id || "");
  const [paypalSecret, setPaypalSecret] = useState(schoolAny.own_paypal_secret || "");

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

  const credentialsMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      if (isDemo) return;
      const { error } = await supabase
        .from("schools")
        .update(updates as any)
        .eq("id", school.id);
      if (error) throw error;
    },
    onSuccess: () => {
      onRefresh();
      toast.success("Credentials saved");
    },
    onError: () => toast.error("Failed to save credentials"),
  });

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    if (isDemo) {
      toast.success("Payment gateway mode updated (demo)");
      return;
    }
    modeMutation.mutate(newMode);
  };

  const saveSquare = () => {
    if (isDemo) { toast.success("Square credentials saved (demo)"); return; }
    credentialsMutation.mutate({
      own_square_app_id: squareAppId,
      own_square_access_token: squareAccessToken,
      own_square_location_id: squareLocationId,
    });
  };

  const saveStripe = () => {
    if (isDemo) { toast.success("Stripe credentials saved (demo)"); return; }
    credentialsMutation.mutate({
      own_stripe_publishable_key: stripePublishableKey,
      own_stripe_secret_key: stripeSecretKey,
    });
  };

  const savePaypal = () => {
    if (isDemo) { toast.success("PayPal credentials saved (demo)"); return; }
    credentialsMutation.mutate({
      own_paypal_client_id: paypalClientId,
      own_paypal_secret: paypalSecret,
    });
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

      {/* Own gateway credentials */}
      {mode === "own" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gateway Credentials</CardTitle>
            <CardDescription>
              Enter the API credentials for your preferred payment provider. You can configure multiple providers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="square">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="square" className="flex items-center gap-2">
                  <img src={squareLogo} alt="Square" className="h-4 w-4 object-contain" loading="lazy" />
                  Square
                </TabsTrigger>
                <TabsTrigger value="stripe" className="flex items-center gap-2">
                  <img src={stripeLogo} alt="Stripe" className="h-4 w-4 object-contain" loading="lazy" />
                  Stripe
                </TabsTrigger>
                <TabsTrigger value="paypal" className="flex items-center gap-2">
                  <img src={paypalLogo} alt="PayPal" className="h-4 w-4 object-contain" loading="lazy" />
                  PayPal
                </TabsTrigger>
              </TabsList>

              {/* Square */}
              <TabsContent value="square" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <img src={squareLogo} alt="Square" className="h-8 object-contain" loading="lazy" />
                  <Badge variant={squareAccessToken ? "default" : "secondary"}>
                    {squareAccessToken ? "Configured" : "Not Connected"}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Application ID</Label>
                    <Input value={squareAppId} onChange={(e) => setSquareAppId(e.target.value)} placeholder="sq0idp-..." className="h-9 font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Access Token</Label>
                    <Input type="password" value={squareAccessToken} onChange={(e) => setSquareAccessToken(e.target.value)} placeholder="EAAAl..." className="h-9 font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Location ID</Label>
                    <Input value={squareLocationId} onChange={(e) => setSquareLocationId(e.target.value)} placeholder="L..." className="h-9 font-mono text-xs" />
                  </div>
                  <Button onClick={saveSquare} disabled={credentialsMutation.isPending} size="sm" className="w-full">
                    {credentialsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Square Credentials
                  </Button>
                </div>
              </TabsContent>

              {/* Stripe */}
              <TabsContent value="stripe" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <img src={stripeLogo} alt="Stripe" className="h-8 object-contain" loading="lazy" />
                  <Badge variant={stripePublishableKey ? "default" : "secondary"}>
                    {stripePublishableKey ? "Configured" : "Not Connected"}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Publishable Key</Label>
                    <Input value={stripePublishableKey} onChange={(e) => setStripePublishableKey(e.target.value)} placeholder="pk_live_..." className="h-9 font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Secret Key</Label>
                    <Input type="password" value={stripeSecretKey} onChange={(e) => setStripeSecretKey(e.target.value)} placeholder="sk_live_..." className="h-9 font-mono text-xs" />
                  </div>
                  <Button onClick={saveStripe} disabled={credentialsMutation.isPending} size="sm" className="w-full">
                    {credentialsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Stripe Credentials
                  </Button>
                </div>
              </TabsContent>

              {/* PayPal */}
              <TabsContent value="paypal" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <img src={paypalLogo} alt="PayPal" className="h-8 object-contain" loading="lazy" />
                  <Badge variant={paypalClientId ? "default" : "secondary"}>
                    {paypalClientId ? "Configured" : "Not Connected"}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Client ID</Label>
                    <Input value={paypalClientId} onChange={(e) => setPaypalClientId(e.target.value)} placeholder="AV..." className="h-9 font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Secret</Label>
                    <Input type="password" value={paypalSecret} onChange={(e) => setPaypalSecret(e.target.value)} placeholder="EI..." className="h-9 font-mono text-xs" />
                  </div>
                  <Button onClick={savePaypal} disabled={credentialsMutation.isPending} size="sm" className="w-full">
                    {credentialsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save PayPal Credentials
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              <strong>How it works:</strong> When using the DSM Square account, payments are processed through the platform and a service commission is deducted before funds are settled to your school. When using your own gateway, payments go directly to your account with no platform commission — you only pay the provider's standard processing fees. Gateway credentials can be wired up to live processing later.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
