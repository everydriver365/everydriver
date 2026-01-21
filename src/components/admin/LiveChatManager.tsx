import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Search,
  User,
  Clock,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  Circle,
  X,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { LiveChatWindow } from "@/components/live-chat/LiveChatWindow";
import { useLiveChatSessions, LiveChatSession } from "@/hooks/useLiveChat";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function LiveChatManager() {
  const [selectedSession, setSelectedSession] = useState<LiveChatSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { sessions, loading, refetch } = useLiveChatSessions("admin");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const { notify, requestPermission } = useChatNotifications({
    soundEnabled,
    browserNotificationsEnabled: notificationsEnabled,
  });

  // Fetch unread counts for each session
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
      .channel("admin_live_chat_notifications")
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
          setUnreadCounts((prev) => ({
            ...prev,
            [sessionId]: (prev[sessionId] || 0) + 1,
          }));
          
          // Find session to get visitor name
          const session = sessions.find((s) => s.id === sessionId);
          const visitorName = session?.visitor_name || "Visitor";
          
          // Play sound and show browser notification
          notify(
            `💬 New message from ${visitorName}`,
            content.length > 50 ? content.substring(0, 50) + "..." : content,
            () => {
              if (session) setSelectedSession(session);
            }
          );
          
          toast.info("New chat message received", {
            action: {
              label: "View",
              onClick: () => {
                if (session) setSelectedSession(session);
              },
            },
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_sessions",
          filter: "session_type=eq.admin",
        },
        (payload) => {
          const newSession = payload.new as LiveChatSession;
          notify(
            "🆕 New chat started!",
            `${newSession.visitor_name} wants to chat`,
            () => refetch()
          );
          toast.info("New chat started!");
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessions, refetch, notify]);

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
  const activeCount = sessions.filter((s) => s.status === "active").length;
  const offlineCount = sessions.filter((s) => s.status === "offline_message").length;

  return (
    <div className="space-y-6">
      {/* Notification Controls */}
      <div className="flex items-center justify-end gap-6">
        <div className="flex items-center gap-2">
          {soundEnabled ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          <Label htmlFor="sound-toggle" className="text-sm text-muted-foreground">Sound</Label>
          <Switch
            id="sound-toggle"
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
        </div>
        <div className="flex items-center gap-2">
          {notificationsEnabled ? <Bell className="h-4 w-4 text-muted-foreground" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          <Label htmlFor="notifications-toggle" className="text-sm text-muted-foreground">Browser Notifications</Label>
          <Switch
            id="notifications-toggle"
            checked={notificationsEnabled}
            onCheckedChange={(checked) => {
              if (checked) {
                requestPermission().then((granted) => {
                  setNotificationsEnabled(granted);
                  if (!granted) {
                    toast.error("Browser notifications are blocked. Please enable them in your browser settings.");
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-sm text-muted-foreground">Total Chats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Circle className="h-6 w-6 text-green-500 fill-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{offlineCount}</p>
              <p className="text-sm text-muted-foreground">Offline Messages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUnread}</p>
              <p className="text-sm text-muted-foreground">Unread</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="active" className="text-xs">
                  Active
                </TabsTrigger>
                <TabsTrigger value="offline" className="text-xs">
                  Offline
                </TabsTrigger>
                <TabsTrigger value="closed" className="text-xs">
                  Closed
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sessions */}
            <ScrollArea className="h-[400px]">
              <AnimatePresence>
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations found</p>
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
                            "w-full text-left p-3 rounded-lg border transition-colors",
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
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {session.visitor_email}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {unreadCounts[session.id] > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {unreadCounts[session.id]}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(session.updated_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge
                              variant={
                                session.status === "active"
                                  ? "default"
                                  : session.status === "offline_message"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {session.status === "offline_message"
                                ? "Offline"
                                : session.status}
                            </Badge>
                            {session.source_page && (
                              <span className="text-xs text-muted-foreground truncate">
                                {session.source_page}
                              </span>
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

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          {selectedSession ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedSession.visitor_name}
                      </CardTitle>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedSession.visitor_email}
                        </span>
                        {selectedSession.visitor_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedSession.visitor_phone}
                          </span>
                        )}
                        {selectedSession.source_page && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {selectedSession.source_page}
                          </span>
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
                        Close Chat
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
              <CardContent className="p-0 h-[450px]">
                <LiveChatWindow
                  sessionId={selectedSession.id}
                  userType="admin"
                  otherPartyName={selectedSession.visitor_name}
                />
              </CardContent>
            </>
          ) : (
            <CardContent className="h-[500px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">
                  Choose a chat from the list to start responding
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
