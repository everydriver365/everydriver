import { useState } from "react";
import { Gift, Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";

export function ReferralCard() {
  const { instructor } = useInstructorAuth();
  const [copied, setCopied] = useState(false);
  const referralCode = instructor?.referral_code || instructor?.slug || "—";
  const referralLink = `${window.location.origin}/instructor/login?ref=${referralCode}`;

  const { data: stats } = useQuery({
    queryKey: ["instructor-referrals", instructor?.id],
    queryFn: async () => {
      if (!instructor?.id) return { total: 0, qualified: 0, pending: 0, earned: 0 };
      const { data, error } = await supabase
        .from("instructor_referrals")
        .select("status, reward_amount")
        .eq("referrer_id", instructor.id);
      if (error) throw error;
      return {
        total: data.length,
        qualified: data.filter(r => r.status === "qualified" || r.status === "rewarded").length,
        pending: data.filter(r => r.status === "pending" || r.status === "signed_up").length,
        earned: data.filter(r => r.status === "rewarded").reduce((s, r) => s + Number(r.reward_amount || 0), 0),
      };
    },
    enabled: !!instructor?.id,
  });

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="h-5 w-5 text-pink-500" />
          Refer & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Invite fellow instructors. Earn <strong>£10</strong> for each who stays 3+ months.
        </p>

        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="text-xs h-8" />
          <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={copyLink}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>

        {stats && stats.total > 0 && (
          <div className="flex gap-3 text-center">
            <div>
              <p className="text-lg font-semibold text-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Referred</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-600">{stats.qualified}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Qualified</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">£{stats.earned}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Earned</p>
            </div>
          </div>
        )}

        <Badge variant="outline" className="text-xs">
          Your code: {referralCode}
        </Badge>
      </CardContent>
    </Card>
  );
}
