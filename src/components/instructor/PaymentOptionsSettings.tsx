import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import klarnaLogo from "@/assets/klarna-logo.svg";
import clearpayLogo from "@/assets/clearpay-logo.svg";

interface PaymentOptionsSettingsProps {
  instructorId: string;
  compact?: boolean;
}

export function PaymentOptionsSettings({ instructorId, compact = false }: PaymentOptionsSettingsProps) {
  const { subscription, refreshInstructor } = useInstructorAuth();
  const [klarnaEnabled, setKlarnaEnabled] = useState(false);
  const [clearpayEnabled, setClearpayEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const isPro = subscription?.features?.includes("payment_tracking") ?? false;

  useEffect(() => {
    fetchSettings();
  }, [instructorId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("klarna_enabled, clearpay_enabled")
        .eq("id", instructorId)
        .single();
      if (error) throw error;
      setKlarnaEnabled(data.klarna_enabled ?? false);
      setClearpayEnabled(data.clearpay_enabled ?? false);
    } catch (e) {
      console.error("Error fetching BNPL settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (field: "klarna_enabled" | "clearpay_enabled", value: boolean) => {
    if (!isPro) return;
    const setter = field === "klarna_enabled" ? setKlarnaEnabled : setClearpayEnabled;
    setter(value);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ [field]: value })
        .eq("id", instructorId);
      if (error) throw error;
      await refreshInstructor();
      toast.success(value ? "Enabled" : "Disabled");
    } catch (e) {
      setter(!value);
      console.error("Error toggling BNPL:", e);
      toast.error("Failed to update");
    }
  };

  if (loading) return null;

  const content = (
    <div className="space-y-4">
      {/* Klarna */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={klarnaLogo} alt="Klarna" className="h-5 w-5" />
            <Label className="text-sm font-medium">Pay in 3</Label>
            {!isPro && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <Switch
            checked={klarnaEnabled}
            onCheckedChange={(v) => toggleSetting("klarna_enabled", v)}
            disabled={!isPro}
          />
        </div>
        {!isPro && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" /> Pro plan required
          </p>
        )}
        {klarnaEnabled && isPro && (
          <div className="flex items-start gap-2 p-3 bg-pink-50 dark:bg-pink-950/30 rounded-none border border-pink-200 dark:border-pink-800">
            <Info className="h-4 w-4 mt-0.5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
            <div className="text-xs text-pink-800 dark:text-pink-300">
              <p>Klarna charges <strong>3.29% + 20p</strong> per transaction. These fees are deducted from your payment.</p>
            </div>
          </div>
        )}
      </div>

      {/* Clearpay */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={clearpayLogo} alt="Clearpay" className="h-5 w-5" />
            <Label className="text-sm font-medium">Pay in 4</Label>
            {!isPro && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <Switch
            checked={clearpayEnabled}
            onCheckedChange={(v) => toggleSetting("clearpay_enabled", v)}
            disabled={!isPro}
          />
        </div>
        {!isPro && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" /> Pro plan required
          </p>
        )}
        {clearpayEnabled && isPro && (
          <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-none border border-emerald-200 dark:border-emerald-800">
            <Info className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="text-xs text-emerald-800 dark:text-emerald-300">
              <p>Clearpay charges <strong>4–6% + 30p</strong> per transaction. These fees are deducted from your payment.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (compact) return content;

  return (
    <Card>
      <CardHeader className="pb-3 px-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          💳 Payment Options
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Offer Buy Now, Pay Later on your mini-website
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">{content}</CardContent>
    </Card>
  );
}
