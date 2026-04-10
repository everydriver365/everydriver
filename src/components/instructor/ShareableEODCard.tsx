import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ShareableEODCardProps {
  summary: string;
  data: {
    lessonsCompleted: number;
    earnings: number;
    milesDriven: number;
  };
  instructorName?: string;
}

export function ShareableEODCard({ summary, data, instructorName }: ShareableEODCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const shareText = `📊 End of Day Summary${instructorName ? ` — ${instructorName}` : ""}

🚗 ${data.lessonsCompleted} lessons completed
💷 £${data.earnings} earned  
🛣️ ${data.milesDriven} miles driven

${summary}

#DrivingInstructor #EDApp`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "End of Day Summary",
          text: shareText,
        });
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          fallbackCopy();
        }
      }
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {/* Preview card */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-none p-5 text-white"
      >
        <div className="flex items-center gap-2 mb-3">
          <Moon className="h-4 w-4 opacity-80" />
          <span className="text-xs font-medium opacity-80">End of Day</span>
          {instructorName && (
            <span className="text-xs opacity-60 ml-auto">{instructorName}</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.lessonsCompleted}</div>
            <div className="text-[10px] opacity-70">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">£{data.earnings}</div>
            <div className="text-[10px] opacity-70">Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.milesDriven}</div>
            <div className="text-[10px] opacity-70">Miles</div>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed opacity-90 line-clamp-3">{summary}</p>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleShare}
          size="sm"
          className="flex-1 gap-2"
          variant="outline"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
        <Button
          onClick={fallbackCopy}
          size="sm"
          variant="ghost"
          className="gap-2"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
