import { useState, useRef, useEffect } from "react";
import { useWhatsAppMessages } from "@/hooks/useWhatsAppMessages";
import { WhatsAppConversation } from "@/hooks/useWhatsAppConversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Bot, User, Phone, Check, CheckCheck, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WhatsAppChatProps {
  conversation: WhatsAppConversation;
  onBack?: () => void;
}

export function WhatsAppChat({ conversation, onBack }: WhatsAppChatProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, toggleAI } = useWhatsAppMessages(conversation.id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate(message.trim(), {
      onError: () => toast.error("Failed to send message"),
    });
    setMessage("");
  };

  const handleToggleAI = (enabled: boolean) => {
    toggleAI.mutate(enabled, {
      onSuccess: () => toast.success(enabled ? "AI auto-reply enabled" : "AI auto-reply disabled — you're in control"),
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <Phone className="h-4 w-4 text-green-700 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {conversation.visitor_name || conversation.phone_number}
          </p>
          {conversation.visitor_name && (
            <p className="text-[11px] text-muted-foreground">{conversation.phone_number}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Label htmlFor="ai-toggle" className="text-xs text-muted-foreground">
            {conversation.ai_enabled ? "🤖 AI" : "👤 Manual"}
          </Label>
          <Switch
            id="ai-toggle"
            checked={conversation.ai_enabled}
            onCheckedChange={handleToggleAI}
          />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading && <p className="text-center text-muted-foreground text-sm">Loading…</p>}
        {messages.map((msg) => {
          const isOutbound = msg.direction === "outbound";
          const isAI = msg.sender_type === "ai";

          return (
            <div key={msg.id} className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
              <div className="max-w-[75%]">
                {isOutbound && isAI && (
                  <div className="flex items-center gap-1 justify-end mb-0.5">
                    <Bot className="h-3 w-3 text-blue-500" />
                    <span className="text-[10px] text-blue-500 font-medium">AI Reply</span>
                  </div>
                )}
                {isOutbound && msg.sender_type === "instructor" && (
                  <div className="flex items-center gap-1 justify-end mb-0.5">
                    <User className="h-3 w-3 text-orange-500" />
                    <span className="text-[10px] text-orange-500 font-medium">You</span>
                  </div>
                )}
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl text-sm",
                    isOutbound
                      ? isAI
                        ? "bg-blue-500/10 text-foreground rounded-br-md border border-blue-200 dark:border-blue-800"
                        : "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {msg.media_url && (
                    <div className="mb-2">
                      {msg.media_type === "image" && (
                        <img src={msg.media_url} alt="" className="rounded-lg max-w-full max-h-64 object-cover" />
                      )}
                      {(msg.media_type === "audio" || msg.media_type === "voice") && (
                        <audio controls src={msg.media_url} className="w-full" />
                      )}
                      {msg.media_type === "document" && (
                        <a href={msg.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded bg-background/50 text-xs underline">
                          📎 Open document
                        </a>
                      )}
                    </div>
                  )}
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  <div className={cn(
                    "flex items-center gap-1 mt-1",
                    isOutbound ? (isAI ? "justify-end" : "justify-end") : ""
                  )}>
                    <span className={cn(
                      "text-[10px]",
                      isOutbound ? (isAI ? "text-muted-foreground" : "text-primary-foreground/60") : "text-muted-foreground"
                    )}>
                      {format(new Date(msg.created_at), "HH:mm")}
                    </span>
                    {isOutbound && msg.sender_type === "instructor" && (
                      <span className="inline-flex items-center">
                        {msg.delivery_status === "sending" && (
                          <Loader2 className="h-3 w-3 animate-spin text-primary-foreground/50" />
                        )}
                        {msg.delivery_status === "sent" && (
                          <Check className="h-3 w-3 text-primary-foreground/50" />
                        )}
                        {msg.delivery_status === "delivered" && (
                          <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                        )}
                        {msg.delivery_status === "failed" && (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
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
          placeholder={conversation.ai_enabled ? "Type to reply manually…" : "Type a message…"}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!message.trim() || sendMessage.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
