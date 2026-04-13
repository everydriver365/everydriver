import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import klarnaLogo from "@/assets/klarna-logo.svg";
import clearpayLogo from "@/assets/clearpay-logo.svg";
import type { SchoolRecord } from "@/hooks/useSchoolData";

interface SchoolBNPLSectionProps {
  school: SchoolRecord;
  onRefresh: () => void;
}

export default function SchoolBNPLSection({ school, onRefresh }: SchoolBNPLSectionProps) {
  const { isDemo } = useSchoolDemo();
  const [demoKlarna, setDemoKlarna] = useState(false);
  const [demoClearpay, setDemoClearpay] = useState(false);
  const [saving, setSaving] = useState(false);

  const klarnaEnabled = isDemo ? demoKlarna : !!(school as any).klarna_enabled;
  const clearpayEnabled = isDemo ? demoClearpay : !!(school as any).clearpay_enabled;

  const handleToggle = async (provider: "klarna" | "clearpay", value: boolean) => {
    if (isDemo) {
      if (provider === "klarna") setDemoKlarna(value);
      else setDemoClearpay(value);
      toast({ title: `${provider === "klarna" ? "Klarna" : "Clearpay"} ${value ? "enabled" : "disabled"}` });
      return;
    }

    setSaving(true);
    const col = provider === "klarna" ? "klarna_enabled" : "clearpay_enabled";
    const { error } = await supabase
      .from("schools")
      .update({ [col]: value } as any)
      .eq("id", school.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${provider === "klarna" ? "Klarna" : "Clearpay"} ${value ? "enabled" : "disabled"}` });
      onRefresh();
    }
    setSaving(false);
  };

  const providers = [
    {
      key: "klarna" as const,
      name: "Klarna",
      logo: klarnaLogo,
      enabled: klarnaEnabled,
      bgClass: "bg-[hsl(340,100%,85%)]/10",
      borderClass: "border-[hsl(340,100%,85%)]/30",
      description: "Let pupils spread the cost with Klarna's Pay in 3 or Pay Later options.",
      fee: "No upfront cost — Klarna fees apply per transaction.",
    },
    {
      key: "clearpay" as const,
      name: "Clearpay",
      logo: clearpayLogo,
      enabled: clearpayEnabled,
      bgClass: "bg-[hsl(155,95%,84%)]/10",
      borderClass: "border-[hsl(155,95%,84%)]/30",
      description: "Offer Clearpay's Pay in 4 instalments for bookings up to £1,200.",
      fee: "No upfront cost — Clearpay fees apply per transaction.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Buy Now, Pay Later</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enable BNPL options on your school's booking page so pupils can spread the cost of their courses.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {providers.map((p) => (
          <Card key={p.key} className={`${p.bgClass} ${p.borderClass}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <img src={p.logo} alt={p.name} className="h-10 w-10" />
                <div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{p.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={p.enabled ? "default" : "secondary"} className="text-xs">
                    {p.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Switch
                  checked={p.enabled}
                  onCheckedChange={(v) => handleToggle(p.key, v)}
                  disabled={saving}
                />
              </div>
              <p className="text-xs text-muted-foreground">{p.fee}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            When enabled, BNPL options will appear as payment methods on your school's public booking page.
            Pupils choose BNPL at checkout and complete the process with the provider directly.
            You receive the full payment upfront — the provider handles instalment collection.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
