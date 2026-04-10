import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ArrowLeft, Check, CheckCheck, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInstructorAdminChat, AdminMessage } from "@/hooks/useAdminMessaging";
import { cn } from "@/lib/utils";

interface AdminChatWindowProps {
  instructorId: string;
  onBack?: () => void;
}

export function AdminChatWindow({ instructorId, onBack }: AdminChatWindowProps) {
  const { messages, loading, sending, sendMessage, markAsRead } = useInstructorAdminChat(instructorId);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const success = await sendMessage(newMessage);
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

  const groupMessagesByDate = (msgs: AdminMessage[]) => {
    const groups: { date: string; messages: AdminMessage[] }[] = [];
    
    msgs.forEach((msg) => {
      const dateStr = format(new Date(msg.created_at), "yyyy-MM-dd");
      const existingGroup = groups.find((g) => g.date === dateStr);
      
      if (existingGroup) {
        existingGroup.messages.push(msg);
      } else {
        groups.push({ date: dateStr, messages: [msg] });
      }
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">EveryDriver Support</h3>
            <p className="text-sm text-muted-foreground">Admin Team</p>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center px-4">
            <ShieldCheck className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">Contact Support</p>
            <p className="text-sm">Send a message to the EveryDriver admin team</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messageGroups.map((group) => (
              <div key={group.date}>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {format(new Date(group.date), "EEEE, d MMMM yyyy")}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.messages.map((message) => {
                    const isInstructor = message.sender_type === "instructor";
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isInstructor ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-none px-4 py-2",
                            isInstructor
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <div
                            className={cn(
                              "flex items-center gap-1 mt-1",
                              isInstructor ? "justify-end" : "justify-start"
                            )}
                          >
                            <span
                              className={cn(
                                "text-[10px]",
                                isInstructor
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {format(new Date(message.created_at), "HH:mm")}
                            </span>
                            {isInstructor && (
                              message.read_at ? (
                                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                              ) : (
                                <Check className="h-3 w-3 text-primary-foreground/70" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <CardContent className="p-3 border-t shrink-0">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message to admin..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
