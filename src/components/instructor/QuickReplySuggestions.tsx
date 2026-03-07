import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QuickReplySuggestionsProps {
  instructorId: string | undefined;
  pupilId: string;
  recentMessages: Array<{ role: string; content: string }>;
  onSelect: (reply: string) => void;
}

export function QuickReplySuggestions({
  instructorId,
  pupilId,
  recentMessages,
  onSelect,
}: QuickReplySuggestionsProps) {
  const [replies, setReplies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!instructorId || !pupilId || recentMessages.length === 0) return;
    fetchReplies();
  }, [instructorId, pupilId, recentMessages.length]);

  const fetchReplies = async () => {
    if (!instructorId || !pupilId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quick-replies", {
        body: {
          instructor_id: instructorId,
          pupil_id: pupilId,
          recent_messages: recentMessages.slice(-5),
        },
      });
      if (!error && data?.replies) {
        setReplies(data.replies);
      }
    } catch (e) {
      console.error("Quick replies error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || replies.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none"
    >
      <Zap className="h-3 w-3 text-amber-500 flex-shrink-0" />
      {replies.map((reply, i) => (
        <button
          key={i}
          onClick={() => onSelect(reply)}
          className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[12px] font-medium whitespace-nowrap hover:bg-primary/20 transition-colors flex-shrink-0"
        >
          {reply}
        </button>
      ))}
    </motion.div>
  );
}
