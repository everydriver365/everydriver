import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { PreChatForm, PreChatFormData } from "./PreChatForm";
import { LiveChatWindow } from "./LiveChatWindow";
import { useCreateLiveChatSession } from "@/hooks/useLiveChat";
import { useInstructorOnlineStatus } from "@/hooks/useInstructorOnlineStatus";
import { cn } from "@/lib/utils";

interface EmbeddedLiveChatProps {
  sessionType: "admin" | "instructor";
  instructorId?: string;
  instructorName?: string;
  title?: string;
  description?: string;
}

export function EmbeddedLiveChat({
  sessionType,
  instructorId,
  instructorName,
  title = "Chat With Us",
  description = "Get instant answers to your questions",
}: EmbeddedLiveChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorInfo, setVisitorInfo] = useState<PreChatFormData | null>(null);
  const { createSession, creating } = useCreateLiveChatSession();
  const instructorOnline = useInstructorOnlineStatus(instructorId);

  // Check for existing session
  useEffect(() => {
    const stored = localStorage.getItem(
      `live_chat_session_${sessionType}_${instructorId || "admin"}`
    );
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSessionId(data.sessionId);
        setVisitorInfo(data.visitorInfo);
      } catch (e) {
        localStorage.removeItem(
          `live_chat_session_${sessionType}_${instructorId || "admin"}`
        );
      }
    }
  }, [sessionType, instructorId]);

  const handlePreChatSubmit = async (data: PreChatFormData) => {
    const newSessionId = await createSession({
      sessionType,
      instructorId,
      visitorName: data.name,
      visitorEmail: data.email,
      visitorPhone: data.phone,
      sourcePage: window.location.pathname,
      initialMessage: data.message,
    });

    if (newSessionId) {
      setSessionId(newSessionId);
      setVisitorInfo(data);
      localStorage.setItem(
        `live_chat_session_${sessionType}_${instructorId || "admin"}`,
        JSON.stringify({ sessionId: newSessionId, visitorInfo: data })
      );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-primary-foreground/80">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[450px]">
          {!sessionId ? (
            <PreChatForm
              onSubmit={handlePreChatSubmit}
              loading={creating}
              instructorName={instructorName}
            />
          ) : (
            <LiveChatWindow
              sessionId={sessionId}
              userType="visitor"
              userName={visitorInfo?.name}
              otherPartyName={instructorName || "Support"}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
