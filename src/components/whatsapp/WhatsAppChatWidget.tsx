import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minimize2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WhatsAppChatWidgetProps {
  instructorId?: string;
  instructorName?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  direction: string;
  sender_type: string;
  created_at: string;
}

// WhatsApp SVG icon
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const STORAGE_KEY = "whatsapp_widget_session";

export function WhatsAppChatWidget({ instructorId, instructorName }: WhatsAppChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore session
  useEffect(() => {
    const key = `${STORAGE_KEY}_${instructorId || "admin"}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setConversationId(data.conversationId);
        setVisitorName(data.visitorName);
        setVisitorPhone(data.visitorPhone);
        setHasStarted(true);
      } catch { localStorage.removeItem(key); }
    }
  }, [instructorId]);

  // Fetch messages
  useEffect(() => {
    if (!conversationId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as ChatMessage[]);
    };
    fetchMessages();

    const channel = supabase
      .channel(`wa-widget-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "whatsapp_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorPhone.trim()) return;
    setSending(true);

    try {
      // Create conversation
      const { data: conv, error: convErr } = await supabase
        .from("whatsapp_conversations")
        .insert({
          phone_number: visitorPhone.trim(),
          visitor_name: visitorName.trim(),
          instructor_id: instructorId || null,
          ai_enabled: true,
        })
        .select("id")
        .single();

      if (convErr) throw convErr;

      setConversationId(conv.id);
      setHasStarted(true);
      localStorage.setItem(`${STORAGE_KEY}_${instructorId || "admin"}`, JSON.stringify({
        conversationId: conv.id,
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim(),
      }));
    } catch (err) {
      console.error("Failed to start chat:", err);
      toast.error("Failed to start chat");
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || !conversationId) return;
    const content = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    try {
      // Log inbound message from visitor
      await supabase.from("whatsapp_messages").insert({
        conversation_id: conversationId,
        content,
        direction: "inbound",
        sender_type: "visitor",
      });

      // Update conversation timestamp
      await supabase.from("whatsapp_conversations").update({
        last_message_at: new Date().toISOString(),
      }).eq("id", conversationId);

      // Trigger AI reply via edge function
      supabase.functions.invoke("whatsapp-webhook", {
        body: {
          widget_message: true,
          conversation_id: conversationId,
          message: content,
          visitor_name: visitorName,
          visitor_phone: visitorPhone,
          instructor_id: instructorId,
        },
      }).catch(err => console.error("AI reply error:", err));
    } catch (err) {
      console.error("Send failed:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => { setIsOpen(false); setIsMinimized(false); };
  const handleMinimize = () => { setIsMinimized(true); setIsOpen(false); };

  return (
    <>
      {/* FAB — bottom-left */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-40"
          >
            <Button
              size="lg"
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow text-white"
              style={{ backgroundColor: "#25D366" }}
            >
              <WhatsAppIcon className="h-6 w-6" />
            </Button>
            {isMinimized && conversationId && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-6 left-2 right-2 md:right-auto md:left-6 z-40 md:w-[380px]"
          >
            <Card className="overflow-hidden shadow-2xl border-0">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: "#25D366" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <WhatsAppIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{instructorName || "WhatsApp Chat"}</h3>
                    <p className="text-xs text-white/80">Usually replies instantly</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={handleMinimize}>
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="h-[50vh] md:h-[400px] max-h-[400px] bg-background flex flex-col">
                {!hasStarted ? (
                  /* Pre-chat form */
                  <form onSubmit={handleStartChat} className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">
                      <p className="font-medium">👋 Hi there!</p>
                      <p className="mt-1 text-xs">Enter your details to start chatting. Our AI assistant will help you instantly!</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wa-name" className="text-xs">Your Name</Label>
                      <Input id="wa-name" value={visitorName} onChange={e => setVisitorName(e.target.value)} placeholder="John Smith" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wa-phone" className="text-xs">Phone Number</Label>
                      <Input id="wa-phone" type="tel" value={visitorPhone} onChange={e => setVisitorPhone(e.target.value)} placeholder="07700 900000" required />
                    </div>
                    <Button type="submit" className="w-full text-white" style={{ backgroundColor: "#25D366" }} disabled={sending}>
                      {sending ? "Starting…" : "Start Chat"}
                    </Button>
                  </form>
                ) : (
                  /* Chat */
                  <>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                      {messages.length === 0 && (
                        <p className="text-center text-muted-foreground text-xs mt-8">Send a message to get started!</p>
                      )}
                      {messages.map(msg => {
                        const isOutbound = msg.direction === "outbound";
                        return (
                          <div key={msg.id} className={cn("flex", isOutbound ? "justify-start" : "justify-end")}>
                            <div className={cn(
                              "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                              isOutbound
                                ? "bg-muted text-foreground rounded-bl-md"
                                : "text-white rounded-br-md"
                            )} style={!isOutbound ? { backgroundColor: "#25D366" } : undefined}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className={cn("text-[10px] mt-1", isOutbound ? "text-muted-foreground" : "text-white/70")}>
                                {format(new Date(msg.created_at), "HH:mm")}
                                {isOutbound && msg.sender_type === "ai" && " · 🤖 AI"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
                      <Input
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder="Type a message…"
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!inputMessage.trim() || sending}
                        className="text-white"
                        style={{ backgroundColor: "#25D366" }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
