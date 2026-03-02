import { useState, useRef, useEffect } from "react";
import { useInstructorDirectMessages } from "@/hooks/useInstructorDirectMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface InstructorDirectChatProps {
  instructorId: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string | null;
  onBack: () => void;
}

export function InstructorDirectChat({
  instructorId,
  friendId,
  friendName,
  friendAvatar,
  onBack,
}: InstructorDirectChatProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, markAsRead } = useInstructorDirectMessages(
    instructorId,
    friendId
  );

  useEffect(() => {
    markAsRead.mutate();
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate(message.trim());
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {friendAvatar ? (
            <img src={friendAvatar} alt={friendName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-primary">
              {friendName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span className="font-semibold text-foreground">{friendName}</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading && <p className="text-center text-muted-foreground text-sm">Loading…</p>}
        {messages.map((msg) => {
          const isMine = msg.sender_id === instructorId;
          return (
            <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                <p>{msg.content}</p>
                <p className={cn("text-[10px] mt-1", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                  {format(new Date(msg.created_at), "HH:mm")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!message.trim() || sendMessage.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
