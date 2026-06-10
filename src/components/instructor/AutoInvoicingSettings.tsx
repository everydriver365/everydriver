import { useEffect, useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

interface Props {
  instructorId: string;
}

export function AutoInvoicingSettings({ instructorId }: Props) {
  const { instructor, refreshInstructor } = useInstructorAuth();
  const [address, setAddress] = useState<string>("");
  const [vat, setVat] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAddress((instructor as any)?.invoice_business_address ?? "");
    setVat((instructor as any)?.invoice_vat_number ?? "");
  }, [instructor]);

  const enabled = (instructor as any)?.ai_auto_invoices_enabled ?? true;

  const updateField = async (patch: Record<string, any>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update(patch as any)
        .eq("id", instructorId);
      if (error) throw error;
      await refreshInstructor();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border/40 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Auto Invoicing</h3>
        {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Enable auto-invoicing</Label>
          <p className="text-xs text-muted-foreground">
            Automatically create and email weekly invoices for completed lessons.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => updateField({ ai_auto_invoices_enabled: v })}
          className="data-[state=checked]:bg-[#34C759]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Business address (shown on invoice)</Label>
        <Textarea
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onBlur={() => updateField({ invoice_business_address: address || null })}
          placeholder="123 Example Street, Town, Postcode"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">VAT number (optional)</Label>
        <Input
          value={vat}
          onChange={(e) => setVat(e.target.value)}
          onBlur={() => updateField({ invoice_vat_number: vat || null })}
          placeholder="GB123456789"
        />
      </div>
    </div>
  );
}
