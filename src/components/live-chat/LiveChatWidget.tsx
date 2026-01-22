import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PreChatForm, PreChatFormData } from "./PreChatForm";
import { LiveChatWindow } from "./LiveChatWindow";
import { useCreateLiveChatSession } from "@/hooks/useLiveChat";
import { cn } from "@/lib/utils";

interface LiveChatWidgetProps {
  sessionType: "admin" | "instructor";
  instructorId?: string;
  instructorName?: string;
  primaryColor?: string;
}

export function LiveChatWidget({
  sessionType,
  instructorId,
  instructorName,
  primaryColor,
}: LiveChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorInfo, setVisitorInfo] = useState<PreChatFormData | null>(null);
  const { createSession, creating } = useCreateLiveChatSession();

  // Persist session in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`live_chat_session_${sessionType}_${instructorId || "admin"}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSessionId(data.sessionId);
        setVisitorInfo(data.visitorInfo);
      } catch (e) {
        localStorage.removeItem(`live_chat_session_${sessionType}_${instructorId || "admin"}`);
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

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  const brandStyles = primaryColor
    ? { "--widget-primary": primaryColor } as React.CSSProperties
    : {};

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40"
          >
            <Button
              size="lg"
              onClick={() => setIsOpen(true)}
              className={cn(
                "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow",
                primaryColor && "hover:opacity-90"
              )}
              style={primaryColor ? { backgroundColor: primaryColor } : {}}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            {isMinimized && sessionId && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                1
              </Badge>
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
            className="fixed bottom-20 md:bottom-6 right-2 left-2 md:left-auto md:right-6 z-40 md:w-[380px] max-h-[70vh] md:max-h-none"
            style={brandStyles}
          >
            <Card className="overflow-hidden shadow-2xl border-0">
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 text-white"
                style={{ backgroundColor: primaryColor || "hsl(var(--primary))" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {instructorName || "Live Chat"}
                    </h3>
                    <p className="text-xs text-white/80">
                      {sessionId ? "We're here to help" : "Start a conversation"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={handleMinimize}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={handleClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="h-[50vh] md:h-[400px] max-h-[400px] bg-background">
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
