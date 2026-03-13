import { useState } from "react";
import { Share2, Download, Trophy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface PassShareCardProps {
  pupilName: string;
  passDate: string;
  instructorName: string;
  brandColour: string;
  instructorLogoUrl?: string | null;
}

export function PassShareCard({
  pupilName,
  passDate,
  instructorName,
  brandColour,
}: PassShareCardProps) {
  const [shared, setShared] = useState(false);

  const shareText = `🎉 I PASSED my driving test on ${passDate}! Huge thanks to ${instructorName} for the amazing instruction. #DrivingTest #IPassed #NewDriver`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "I Passed My Driving Test! 🎉",
          text: shareText,
        });
        setShared(true);
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      toast.success("Copied to clipboard — paste it on social media!");
      setTimeout(() => setShared(false), 3000);
    }
  };

  return (
    <Card
      className="overflow-hidden border-0"
      style={{ background: `linear-gradient(135deg, ${brandColour}, ${brandColour}dd)` }}
    >
      <CardContent className="p-6 text-center text-white">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-1">Congratulations, {pupilName}! 🎉</h3>
        <p className="text-white/80 text-sm mb-1">You passed your driving test!</p>
        <p className="text-white/60 text-xs mb-4">{passDate}</p>

        <Button
          onClick={handleShare}
          className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
        >
          {shared ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
          {shared ? "Shared!" : "Share Your Pass!"}
        </Button>
      </CardContent>
    </Card>
  );
}
