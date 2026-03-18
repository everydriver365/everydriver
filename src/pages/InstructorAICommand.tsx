import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Mic, MicOff, Send } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function InstructorAICommand() {
  const { instructor, loading } = useInstructorAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { data: recentCommands = [] } = useQuery({
    queryKey: ["ai-command-logs", instructor?.id],
    enabled: !!instructor?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_command_logs")
        .select("command_text, result, created_at")
        .eq("instructor_id", instructor!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech not supported"); return; }
    const r = new SR(); r.lang = "en-GB"; r.interimResults = false;
    r.onresult = (e: any) => { setInput(e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recognitionRef.current = r; r.start(); setListening(true);
  };

  const send = async () => {
    if (!input.trim() || !instructor?.id || sending) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(""); setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-command-center", {
        body: { command: userMsg.content, instructor_id: instructor.id, conversation_history: newMsgs.slice(-10) },
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: "assistant", content: data?.result || data?.error || "Done!" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong." }]);
    } finally { setSending(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!instructor) return <Navigate to="/instructor/login" replace />;

  return (
    <InstructorPortalLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] pb-16">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Command Centre</h1>
            <p className="text-sm text-muted-foreground">Talk to your business</p>
          </div>
        </div>

        <ScrollArea className="flex-1 mb-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Try commands like:</p>
              <div className="space-y-1.5 max-w-xs mx-auto">
                {["Book Sarah for Thursday 2pm", "Show this week's earnings", "What's tomorrow's schedule?", "Create a todo: order cones"].map((ex, i) => (
                  <button key={i} onClick={() => setInput(ex)} className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && <div className="flex justify-start"><div className="bg-muted rounded-2xl px-3.5 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={listening ? () => { recognitionRef.current?.stop(); setListening(false); } : startListening} className={listening ? "text-destructive" : ""}>
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a command..." onKeyDown={(e) => e.key === "Enter" && send()} className="flex-1" />
          <Button size="icon" onClick={send} disabled={!input.trim() || sending}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
