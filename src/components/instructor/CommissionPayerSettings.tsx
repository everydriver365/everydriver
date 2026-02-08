import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, User, Loader2 } from "lucide-react";

interface CommissionPayerSettingsProps {
  instructorId: string;
  initialPayer?: string | null;
}

export function CommissionPayerSettings({ instructorId, initialPayer }: CommissionPayerSettingsProps) {
  const [payer, setPayer] = useState(initialPayer || "pupil");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const updatePayer = async (newPayer: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ commission_payer: newPayer })
        .eq("id", instructorId);
      if (error) throw error;
      setPayer(newPayer);
      toast({ title: `Commission payer updated to ${newPayer === 'instructor' ? 'Instructor' : 'Pupil'}` });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Choose who absorbs the card payment commission fee on digital payments.
      </p>

      <div className="flex gap-2">
        <Button
          variant={payer !== 'instructor' ? 'default' : 'outline'}
          size="sm"
          className="flex-1 gap-1.5"
          disabled={saving}
          onClick={() => updatePayer('pupil')}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <User className="h-3.5 w-3.5" />}
          Pupil Pays
        </Button>
        <Button
          variant={payer === 'instructor' ? 'default' : 'outline'}
          size="sm"
          className="flex-1 gap-1.5"
          disabled={saving}
          onClick={() => updatePayer('instructor')}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
          I Pay
        </Button>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        {payer === 'instructor' ? (
          <p>You absorb the commission fee. Pupils pay the exact lesson price with no added charges.</p>
        ) : (
          <p>The commission fee is added to the pupil's payment total. Your earnings remain unchanged.</p>
        )}
      </div>
    </div>
  );
}
