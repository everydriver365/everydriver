import { useState, useEffect } from "react";
import { Gift, Copy, Check, Users, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ReferralCardProps {
  pupilId: string;
  instructorId: string;
  instructorSlug?: string;
  brandColour?: string | null;
}

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  pointsEarned: number;
}

export function ReferralCard({ pupilId, instructorId, instructorSlug, brandColour }: ReferralCardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<ReferralData | null>(null);

  useEffect(() => {
    fetchReferralData();
  }, [pupilId]);

  const fetchReferralData = async () => {
    try {
      // Get pupil's referral code
      const { data: pupil, error: pupilError } = await supabase
        .from("pupils")
        .select("referral_code")
        .eq("id", pupilId)
        .single();

      if (pupilError) throw pupilError;

      // Get referral statistics
      const { data: referrals, error: referralsError } = await supabase
        .from("pupil_referrals")
        .select("status, bonus_points_awarded")
        .eq("referrer_pupil_id", pupilId);

      if (referralsError) throw referralsError;

      const pendingReferrals = referrals?.filter(r => r.status === "pending").length || 0;
      const completedReferrals = referrals?.filter(r => r.status === "completed").length || 0;
      const pointsEarned = referrals?.reduce((sum, r) => sum + (r.bonus_points_awarded || 0), 0) || 0;

      setData({
        referralCode: pupil.referral_code || "",
        totalReferrals: referrals?.length || 0,
        pendingReferrals,
        completedReferrals,
        pointsEarned,
      });
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!data?.referralCode) return;
    
    try {
      await navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      toast({ title: t("rewards.codeCopied") });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const shareReferral = async () => {
    if (!data?.referralCode) return;

    const shareUrl = instructorSlug 
      ? `${window.location.origin}/p/${instructorSlug}?ref=${data.referralCode}`
      : `${window.location.origin}?ref=${data.referralCode}`;

    const shareData = {
      title: t("pupil.referFriend"),
      text: `Use my referral code ${data.referralCode} to get started!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyCode();
        }
      }
    } else {
      copyCode();
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.referralCode) return null;

  const primaryColor = brandColour || '#1e3a5f';

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div 
        className="h-2"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}99)` }}
      />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-5 w-5" style={{ color: primaryColor }} />
          {t("pupil.referFriend")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code Display */}
        <div className="flex items-center gap-2">
          <div 
            className="flex-1 px-4 py-3 rounded-lg text-center font-mono text-lg font-bold tracking-wider"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            {data.referralCode}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={copyCode}
            className="h-12 w-12"
          >
            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>

        {/* Share Button */}
        <Button 
          className="w-full"
          onClick={shareReferral}
          style={{ backgroundColor: primaryColor }}
        >
          <Share2 className="h-4 w-4 mr-2" />
          {t("rewards.shareCode")}
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold" style={{ color: primaryColor }}>
              {data.completedReferrals}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">Completed</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold text-amber-500">
              {data.pendingReferrals}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">Pending</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold text-emerald-500">
              {data.pointsEarned}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">Points</div>
          </div>
        </div>

        {/* How it works */}
        <div className="pt-2 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{t("rewards.howItWorks")}:</p>
          <ul className="space-y-1 pl-4 list-disc">
            <li>Share your code with friends</li>
            <li>Earn points when they book lessons</li>
            <li>Redeem points for free lessons!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
