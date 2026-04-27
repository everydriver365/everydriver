import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gift, Copy, MessageCircle } from "lucide-react";

export default function PupilReferrals() {
  const [code, setCode] = useState<string | null>(null);
  const [refs, setRefs] = useState<Array<{ id: string; status: string; created_at: string; credit_awarded_at: string | null; referrer_credit_amount: number }>>([]);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: pupil } = await supabase.from("pupils").select("id, referral_code").eq("auth_user_id", user.id).maybeSingle();
      if (pupil) {
        setCode(pupil.referral_code);
        const { data: r } = await supabase
          .from("pupil_referrals")
          .select("id, status, created_at, credit_awarded_at, referrer_credit_amount")
          .eq("referrer_pupil_id", pupil.id)
          .order("created_at", { ascending: false });
        setRefs(r ?? []);
      }
    })();
  }, []);

  const link = code ? `https://drive365.co.uk/r/${code}` : "";
  const totalEarned = refs.filter(r => r.credit_awarded_at).reduce((a, r) => a + Number(r.referrer_credit_amount ?? 0), 0);

  const copy = async () => { await navigator.clipboard.writeText(link); toast.success("Link copied"); };
  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Learning to drive? My instructor's brilliant — and you'll get £10 off your first lesson. ${link}`)}`, "_blank");

  return (
    <div className="container mx-auto py-8 max-w-2xl space-y-6">
      <Card className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <CardContent className="pt-8 text-center space-y-2">
          <Gift className="h-12 w-12 mx-auto" />
          <h1 className="text-3xl font-bold">Earn £10. Give £10.</h1>
          <p className="text-sm opacity-90">When a friend books their first lesson, you both get £10 credit.</p>
        </CardContent>
      </Card>

      {code && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Your referral link</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="font-mono text-sm bg-muted p-3 rounded break-all">{link}</div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={copy} variant="outline"><Copy className="h-4 w-4 mr-1" /> Copy</Button>
              <Button onClick={whatsapp}><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Your referrals <Badge variant="secondary">£{totalEarned.toFixed(0)} earned</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {refs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Share your link to earn your first £10.</p>
          ) : (
            <div className="space-y-2">
              {refs.map(r => (
                <div key={r.id} className="flex items-center justify-between text-sm border rounded p-2">
                  <span>{new Date(r.created_at).toLocaleDateString("en-GB")}</span>
                  <Badge variant={r.credit_awarded_at ? "default" : "secondary"}>{r.credit_awarded_at ? `+£${Number(r.referrer_credit_amount).toFixed(0)}` : r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
