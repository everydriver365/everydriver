import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface ParentChatProps {
  parentPhone: string;
  instructorId: string;
  instructorName: string;
  pupilId: string;
  childName: string;
}

interface Message {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export function ParentChat({ parentPhone, instructorId, instructorName, pupilId, childName }: ParentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initConversation();
  }, [parentPhone, instructorId, pupilId]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`parent-chat-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "parent_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    // Find or create conversation
    const { data: existing } = await (supabase as any)
      .from("parent_conversations")
      .select("id")
      .eq("parent_phone", parentPhone)
      .eq("instructor_id", instructorId)
      .eq("pupil_id", pupilId)
      .maybeSingle();

    let convId: string;
    if (existing) {
      convId = existing.id;
    } else {
      const { data: created, error } = await (supabase as any)
        .from("parent_conversations")
        .insert({ parent_phone: parentPhone, instructor_id: instructorId, pupil_id: pupilId })
        .select("id")
        .single();
      if (error || !created) { toast.error("Failed to start conversation"); return; }
      convId = created.id;
    }
    setConversationId(convId);

    // Fetch messages
    const { data: msgs } = await (supabase as any)
      .from("parent_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (msgs) setMessages(msgs);

    // Mark instructor messages as read
    await (supabase as any)
      .from("parent_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", convId)
      .eq("sender_type", "instructor")
      .is("read_at", null);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId) return;
    setSending(true);
    try {
      const { error } = await (supabase as any).from("parent_messages").insert({
        conversation_id: conversationId,
        sender_type: "parent",
        content: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage("");
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col" style={{ height: "400px" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <p className="text-sm font-semibold text-foreground">{instructorName}</p>
        <p className="text-[10px] text-muted-foreground">About {childName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Start a conversation with {instructorName}
          </p>
        )}
        {messages.map((msg) => {
          const isParent = msg.sender_type === "parent";
          return (
            <div key={msg.id} className={`flex ${isParent ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                  isParent
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[9px] mt-1 ${isParent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {format(parseISO(msg.created_at), "HH:mm")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="h-9 text-xs"
        />
        <Button
          size="sm"
          className="h-9 w-9 p-0 shrink-0"
          disabled={sending || !newMessage.trim()}
          onClick={handleSend}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
