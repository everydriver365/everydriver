import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, CheckCheck, Check } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { TypingIndicator } from "./TypingIndicator";
import { useLiveChat, LiveChatMessage } from "@/hooks/useLiveChat";
import { cn } from "@/lib/utils";

interface LiveChatWindowProps {
  sessionId: string;
  userType: "visitor" | "admin" | "instructor";
  userId?: string;
  userName?: string;
  otherPartyName?: string;
}

export function LiveChatWindow({
  sessionId,
  userType,
  userId,
  userName,
  otherPartyName,
}: LiveChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    session,
    messages,
    loading,
    sending,
    otherTyping,
    sendMessage,
    handleTyping,
  } = useLiveChat(sessionId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, otherTyping]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const success = await sendMessage(newMessage, userType, userId);
    if (success) {
      setNewMessage("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping(userType, userId);
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: LiveChatMessage[]) => {
    const groups: { date: string; messages: LiveChatMessage[] }[] = [];

    msgs.forEach((msg) => {
      const dateStr = format(new Date(msg.created_at), "yyyy-MM-dd");
      const existing = groups.find((g) => g.date === dateStr);
      if (existing) {
        existing.messages.push(msg);
      } else {
        groups.push({ date: dateStr, messages: [msg] });
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session?.status === "closed") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
          <CheckCheck className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium">Chat Ended</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This conversation has been closed
        </p>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);
  const isOwnMessage = (msg: LiveChatMessage) => msg.sender_type === userType;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>Start the conversation by sending a message!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messageGroups.map((group) => (
              <div key={group.date}>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {format(new Date(group.date), "MMMM d, yyyy")}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "flex",
                        isOwnMessage(msg) ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2",
                          isOwnMessage(msg)
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1",
                            isOwnMessage(msg) ? "justify-end" : "justify-start"
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs",
                              isOwnMessage(msg)
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {format(new Date(msg.created_at), "HH:mm")}
                          </span>
                          {isOwnMessage(msg) && (
                            msg.read_at ? (
                              <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                            ) : (
                              <Check className="h-3 w-3 text-primary-foreground/70" />
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {otherTyping && <TypingIndicator name={otherPartyName} />}
        </AnimatePresence>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
