import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Search,
  User,
  Clock,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  X,
  ArrowLeft,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { LiveChatWindow } from "@/components/live-chat/LiveChatWindow";
import { useLiveChatSessions, LiveChatSession } from "@/hooks/useLiveChat";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface VisitorChatManagerProps {
  instructorId: string;
}

export function VisitorChatManager({ instructorId }: VisitorChatManagerProps) {
  const isMobile = useIsMobile();
  const [selectedSession, setSelectedSession] = useState<LiveChatSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { sessions, loading, refetch } = useLiveChatSessions("instructor", instructorId);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const { notify, requestPermission } = useChatNotifications({
    soundEnabled,
    browserNotificationsEnabled: notificationsEnabled,
  });

  // Fetch unread counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const counts: Record<string, number> = {};
      for (const session of sessions) {
        const { count } = await supabase
          .from("live_chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("session_id", session.id)
          .eq("sender_type", "visitor")
          .is("read_at", null);
        counts[session.id] = count || 0;
      }
      setUnreadCounts(counts);
    };

    if (sessions.length > 0) {
      fetchUnreadCounts();
    }
  }, [sessions]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`instructor_live_chat_${instructorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: "sender_type=eq.visitor",
        },
        (payload) => {
          const sessionId = payload.new.session_id as string;
          const content = payload.new.content as string;
          // Check if this session belongs to this instructor
          const session = sessions.find((s) => s.id === sessionId);
          if (session) {
            setUnreadCounts((prev) => ({
              ...prev,
              [sessionId]: (prev[sessionId] || 0) + 1,
            }));
            
            // Play sound and show browser notification
            notify(
              `💬 New message from ${session.visitor_name}`,
              content.length > 50 ? content.substring(0, 50) + "..." : content,
              () => setSelectedSession(session)
            );
            
            toast.info("New visitor message", {
              description: "A visitor is waiting for your reply",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_sessions",
          filter: `instructor_id=eq.${instructorId}`,
        },
        (payload) => {
          const newSession = payload.new as LiveChatSession;
          notify(
            "🆕 New visitor chat!",
            `${newSession.visitor_name} wants to chat with you`,
            () => refetch()
          );
          toast.info("New visitor chat started!");
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessions, instructorId, refetch, notify]);

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.visitor_email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && session.status === "active") ||
      (activeTab === "offline" && session.status === "offline_message") ||
      (activeTab === "closed" && session.status === "closed");

    return matchesSearch && matchesTab;
  });

  const handleCloseSession = async (sessionId: string) => {
    try {
      await supabase
        .from("live_chat_sessions")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", sessionId);
      toast.success("Chat closed");
      refetch();
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    } catch (error) {
      toast.error("Failed to close chat");
    }
  };

  const handleSelectSession = async (session: LiveChatSession) => {
    setSelectedSession(session);
    // Mark messages as read
    await supabase
      .from("live_chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("session_id", session.id)
      .eq("sender_type", "visitor")
      .is("read_at", null);
    setUnreadCounts((prev) => ({ ...prev, [session.id]: 0 }));
  };

  const totalUnread = Object.values(unreadCounts).reduce((sum, c) => sum + c, 0);

  // Mobile: Show either list or chat
  if (isMobile && selectedSession) {
    return (
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedSession(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <CardTitle className="text-base">
                {selectedSession.visitor_name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {selectedSession.visitor_email}
              </p>
            </div>
            {selectedSession.status !== "closed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCloseSession(selectedSession.id)}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100vh-200px)]">
          <LiveChatWindow
            sessionId={selectedSession.id}
            userType="instructor"
            userId={instructorId}
            otherPartyName={selectedSession.visitor_name}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification Controls */}
      <div className="flex items-center justify-end gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {soundEnabled ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          <Label htmlFor="sound-toggle-instructor" className="text-sm text-muted-foreground">Sound</Label>
          <Switch
            id="sound-toggle-instructor"
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
        </div>
        <div className="flex items-center gap-2">
          {notificationsEnabled ? <Bell className="h-4 w-4 text-muted-foreground" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          <Label htmlFor="notifications-toggle-instructor" className="text-sm text-muted-foreground">Notifications</Label>
          <Switch
            id="notifications-toggle-instructor"
            checked={notificationsEnabled}
            onCheckedChange={(checked) => {
              if (checked) {
                requestPermission().then((granted) => {
                  setNotificationsEnabled(granted);
                  if (!granted) {
                    toast.error("Notifications blocked. Enable in browser settings.");
                  }
                });
              } else {
                setNotificationsEnabled(false);
              }
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">Total Chats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalUnread}</p>
              <p className="text-xs text-muted-foreground">Unread</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {sessions.filter((s) => s.status === "offline_message").length}
              </p>
              <p className="text-xs text-muted-foreground">Offline Messages</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-3")}>
        {/* Sessions List */}
        <Card className={isMobile ? "" : "col-span-1"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Visitor Chats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="active" className="text-xs">
                  Active
                </TabsTrigger>
                <TabsTrigger value="offline" className="text-xs">
                  Offline
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="h-[300px]">
              <AnimatePresence>
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chats yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <button
                          onClick={() => handleSelectSession(session)}
                          className={cn(
                            "w-full text-left p-3 rounded-2xl border transition-colors",
                            selectedSession?.id === session.id
                              ? "bg-primary/5 border-primary"
                              : "hover:bg-muted/50 border-transparent"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {session.visitor_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(session.updated_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                            {unreadCounts[session.id] > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {unreadCounts[session.id]}
                              </Badge>
                            )}
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window (Desktop) */}
        {!isMobile && (
          <Card className="col-span-2">
            {selectedSession ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {selectedSession.visitor_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {selectedSession.visitor_email}
                          {selectedSession.visitor_phone && (
                            <>
                              <Phone className="h-3 w-3 ml-2" />
                              {selectedSession.visitor_phone}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedSession.status !== "closed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseSession(selectedSession.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Close
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedSession(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-[400px]">
                  <LiveChatWindow
                    sessionId={selectedSession.id}
                    userType="instructor"
                    userId={instructorId}
                    otherPartyName={selectedSession.visitor_name}
                  />
                </CardContent>
              </>
            ) : (
              <CardContent className="h-[450px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Select a conversation</p>
                  <p className="text-sm">
                    Choose a chat from the list to respond
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
