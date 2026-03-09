import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, CheckCheck, Check, UserRound } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { TypingIndicator } from "./TypingIndicator";
import { QuickReplySuggestions, TOTAL_QUICK_REPLY_STEPS } from "./QuickReplySuggestions";
import { InstructorChatCards, parseCardsFromMessage } from "./InstructorChatCards";
import { CourseChatCards, parseCourseCardsFromMessage } from "./CourseChatCards";
import { useLiveChat, LiveChatMessage } from "@/hooks/useLiveChat";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LiveChatWindowProps {
  sessionId: string;
  userType: "visitor" | "admin" | "instructor";
  userId?: string;
  userName?: string;
  otherPartyName?: string;
  instructorId?: string;
}

export function LiveChatWindow({
  sessionId,
  userType,
  userId,
  userName,
  otherPartyName,
  instructorId,
}: LiveChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [showAgentButton, setShowAgentButton] = useState(false);
  const [quickReplyStep, setQuickReplyStep] = useState(0);
  const [quickReplyDone, setQuickReplyDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    session,
    messages,
    loading,
    sending,
    otherTyping,
    sendMessage,
    handleTyping,
  } = useLiveChat(sessionId);

  // Resume quick reply step based on existing visitor messages
  useEffect(() => {
    if (userType === "visitor" && messages.length > 0 && quickReplyStep === 0 && !quickReplyDone) {
      const visitorMessages = messages.filter(m => m.sender_type === "visitor");
      const count = visitorMessages.length;
      if (count >= TOTAL_QUICK_REPLY_STEPS) {
        setQuickReplyDone(true);
      } else if (count > 0) {
        setQuickReplyStep(count);
      }
    }
  }, [messages, userType, quickReplyStep, quickReplyDone]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, otherTyping]);

  // Check if "agent" was ever mentioned in the conversation (persist across re-renders)
  useEffect(() => {
    if (userType === "visitor" && messages.some(m => 
      m.sender_type === "visitor" && /\bagent\b/i.test(m.content)
    )) {
      setShowAgentButton(true);
    }
  }, [messages, userType]);

  const triggerAIReceptionist = async (visitorMessage: string) => {
    if (userType !== "visitor") return;
    try {
      if (instructorId) {
        await supabase.functions.invoke("ai-receptionist", {
          body: { session_id: sessionId, message: visitorMessage, instructor_id: instructorId },
        });
      } else {
        await supabase.functions.invoke("ai-admin-receptionist", {
          body: { session_id: sessionId, message: visitorMessage },
        });
      }
    } catch (e) {
      console.error("AI receptionist error:", e);
    }
  };

  const handleSendAgentRequest = async () => {
    const agentMessage = "I'd like to speak to a real person please";
    await sendMessage(agentMessage, userType, userId);
  };

  const handleQuickReplySelect = async (text: string) => {
    if (sending) return;
    const success = await sendMessage(text, userType, userId);
    if (success) {
      const nextStep = quickReplyStep + 1;
      setQuickReplyStep(nextStep);
      if (nextStep >= TOTAL_QUICK_REPLY_STEPS) {
        setQuickReplyDone(true);
      }
      // Trigger AI receptionist
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = setTimeout(() => {
        triggerAIReceptionist(text);
      }, 5000);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();

    // Free-text message hides quick replies
    if (userType === "visitor" && !quickReplyDone) {
      setQuickReplyDone(true);
    }

    // Check if message contains "agent" keyword
    if (userType === "visitor" && /\bagent\b/i.test(messageText)) {
      setShowAgentButton(true);
    }

    const success = await sendMessage(messageText, userType, userId);
    if (success) {
      setNewMessage("");
      inputRef.current?.focus();

      // If visitor, trigger AI receptionist after 5 seconds if no human reply
      if (userType === "visitor") {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = setTimeout(() => {
          triggerAIReceptionist(messageText);
        }, 5000);
      }
    }
  };

  // Cancel AI trigger if human replies
  useEffect(() => {
    if (userType === "visitor" && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender_type !== "visitor" && aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    }
  }, [messages, userType]);

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
          <div className="text-center py-8 px-4 space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Welcome to EveryDriver!</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Looking for driving lessons near you? Pop in your <span className="font-medium text-primary">postcode</span> and we'll show you available courses in your area — or just ask us anything!
              </p>
            </div>
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
                      {(() => {
                        const isOwn = isOwnMessage(msg);
                        const parsedInstructor = !isOwn ? parseCardsFromMessage(msg.content) : null;
                        const parsedCourse = !isOwn ? parseCourseCardsFromMessage(parsedInstructor?.text || msg.content) : null;
                        const displayText = parsedCourse ? parsedCourse.text : (parsedInstructor ? parsedInstructor.text : msg.content);
                        const instructorCards = parsedInstructor?.cards || null;
                        const courseCards = parsedCourse?.courseCards || null;

                        return (
                          <div className={cn("max-w-[80%] space-y-2")}>
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2",
                                isOwn
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {displayText}
                              </p>
                              <div
                                className={cn(
                                  "flex items-center gap-1 mt-1",
                                  isOwn ? "justify-end" : "justify-start"
                                )}
                              >
                                <span
                                  className={cn(
                                    "text-xs",
                                    isOwn
                                      ? "text-primary-foreground/70"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {format(new Date(msg.created_at), "HH:mm")}
                                </span>
                                {isOwn && (
                                  msg.read_at ? (
                                    <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                                  ) : (
                                    <Check className="h-3 w-3 text-primary-foreground/70" />
                                  )
                                )}
                              </div>
                            </div>
                            {courseCards && <CourseChatCards courses={courseCards} />}
                            {!courseCards && instructorCards && <InstructorChatCards instructors={instructorCards} />}
                          </div>
                        );
                      })()}
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

      {/* Quick Reply Suggestions */}
      {userType === "visitor" && !quickReplyDone && quickReplyStep < TOTAL_QUICK_REPLY_STEPS && (
        <QuickReplySuggestions
          currentStep={quickReplyStep}
          onSelect={handleQuickReplySelect}
          disabled={sending}
        />
      )}

      {/* Input */}
      <div className="p-4 border-t bg-background space-y-2">
        {showAgentButton && userType === "visitor" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-sm"
            onClick={handleSendAgentRequest}
            disabled={sending}
          >
            <UserRound className="h-4 w-4" />
            Speak to an Agent
          </Button>
        )}
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
