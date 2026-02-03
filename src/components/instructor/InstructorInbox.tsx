import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { MessageCircle, Search, User, Plus, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMessaging, Conversation } from "@/hooks/useMessaging";
import { ChatWindow } from "./ChatWindow";
import { AdminChatWindow } from "./AdminChatWindow";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pupil {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface InstructorInboxProps {
  instructorId: string;
}

export function InstructorInbox({ instructorId }: InstructorInboxProps) {
  const { conversations, loading, getTotalUnreadCount, getOrCreateConversation, fetchConversations } = useMessaging(instructorId);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loadingPupils, setLoadingPupils] = useState(false);
  const [pupilSearchQuery, setPupilSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pupils");
  const [showAdminChat, setShowAdminChat] = useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);

  const filteredConversations = conversations.filter((conv) =>
    conv.pupil?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = getTotalUnreadCount();

  // Fetch admin unread count
  useEffect(() => {
    const fetchAdminUnread = async () => {
      try {
        // Get the admin conversation for this instructor
        const { data: conv } = await supabase
          .from("admin_conversations")
          .select("id")
          .eq("instructor_id", instructorId)
          .maybeSingle();

        if (conv) {
          const { count } = await supabase
            .from("admin_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("sender_type", "admin")
            .is("read_at", null);

          setAdminUnreadCount(count || 0);
        }
      } catch (error) {
        console.error("Error fetching admin unread:", error);
      }
    };

    fetchAdminUnread();

    // Subscribe to admin messages
    const channel = supabase
      .channel("admin-messages-badge")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_messages",
        },
        () => {
          fetchAdminUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId]);

  // Fetch instructor's pupils when dialog opens
  useEffect(() => {
    if (showNewChatDialog) {
      fetchPupils();
    }
  }, [showNewChatDialog]);

  const fetchPupils = async () => {
    setLoadingPupils(true);
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name, phone, email")
        .eq("instructor_id", instructorId)
        .order("name");

      if (error) throw error;
      setPupils(data || []);
    } catch (error) {
      console.error("Error fetching pupils:", error);
      toast.error("Failed to load pupils");
    } finally {
      setLoadingPupils(false);
    }
  };

  const handleStartChat = async (pupil: Pupil) => {
    const conversationId = await getOrCreateConversation(pupil.id);
    if (conversationId) {
      // Find or create the conversation object
      await fetchConversations();
      const conv = conversations.find(c => c.id === conversationId) || {
        id: conversationId,
        instructor_id: instructorId,
        pupil_id: pupil.id,
        last_message_at: new Date().toISOString(),
        last_message_preview: null,
        created_at: new Date().toISOString(),
        pupil: {
          id: pupil.id,
          name: pupil.name,
          phone: pupil.phone,
        },
      };
      setSelectedConversation(conv);
      setShowNewChatDialog(false);
      setPupilSearchQuery("");
    } else {
      toast.error("Failed to start conversation");
    }
  };

  const filteredPupils = pupils.filter((pupil) =>
    pupil.name.toLowerCase().includes(pupilSearchQuery.toLowerCase()) ||
    pupil.email?.toLowerCase().includes(pupilSearchQuery.toLowerCase()) ||
    pupil.phone?.includes(pupilSearchQuery)
  );

  // Filter out pupils who already have conversations
  const existingPupilIds = conversations.map(c => c.pupil_id);
  const availablePupils = filteredPupils.filter(p => !existingPupilIds.includes(p.id));

  const handleDeleteConversation = () => {
    setSelectedConversation(null);
    fetchConversations();
  };

  // Show pupil chat window
  if (selectedConversation) {
    return (
      <ChatWindow
        conversation={selectedConversation}
        instructorId={instructorId}
        onBack={() => setSelectedConversation(null)}
        onDelete={handleDeleteConversation}
      />
    );
  }

  // Show admin chat window
  if (showAdminChat) {
    return (
      <AdminChatWindow
        instructorId={instructorId}
        onBack={() => {
          setShowAdminChat(false);
          // Refresh admin unread count
          setAdminUnreadCount(0);
        }}
      />
    );
  }

  return (
    <>
      <Card className="h-[calc(100vh-8rem)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageCircle className="h-5 w-5" />
              Messages
              {(totalUnread + adminUnreadCount) > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {totalUnread + adminUnreadCount}
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 space-y-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between gap-2">
              <TabsList className="grid grid-cols-2 flex-1">
                <TabsTrigger value="pupils" className="relative text-sm">
                  Pupils
                  {totalUnread > 0 && (
                    <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]">
                      {totalUnread}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="admin" className="relative text-sm">
                  Admin
                  {adminUnreadCount > 0 && (
                    <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]">
                      {adminUnreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              {activeTab === "pupils" && (
                <Button size="sm" onClick={() => setShowNewChatDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              )}
            </div>

            <TabsContent value="pupils" className="mt-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[calc(100vh-18rem)]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm mb-4">Start a new chat with one of your pupils</p>
                    <Button size="sm" variant="outline" onClick={() => setShowNewChatDialog(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Start New Chat
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={cn(
                          "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3",
                          conversation.unread_count && conversation.unread_count > 0 && "bg-primary/5"
                        )}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conversation.pupil?.name?.charAt(0) || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "font-medium truncate",
                              conversation.unread_count && conversation.unread_count > 0 && "font-semibold"
                            )}>
                              {conversation.pupil?.name || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={cn(
                              "text-sm truncate",
                              conversation.unread_count && conversation.unread_count > 0 
                                ? "text-foreground" 
                                : "text-muted-foreground"
                            )}>
                              {conversation.last_message_preview || "No messages yet"}
                            </p>
                            {conversation.unread_count && conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="shrink-0 h-5 min-w-[20px] px-1.5">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="admin" className="mt-3 space-y-3">
              <button
                onClick={() => setShowAdminChat(true)}
                className="w-full p-4 rounded-lg border hover:bg-muted/50 transition-colors flex items-center gap-4"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">EveryDriver Support</h3>
                    {adminUnreadCount > 0 && (
                      <Badge variant="destructive">{adminUnreadCount}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Contact the admin team for help
                  </p>
                </div>
              </button>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Need Help?</h4>
                <p className="text-sm text-muted-foreground">
                  Message our admin team for assistance with:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Account or billing questions</li>
                  <li>• Technical issues</li>
                  <li>• Feature requests</li>
                  <li>• General enquiries</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search pupils..."
                value={pupilSearchQuery}
                onChange={(e) => setPupilSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[300px]">
              {loadingPupils ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : availablePupils.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{filteredPupils.length === 0 ? "No pupils found" : "All pupils already have conversations"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availablePupils.map((pupil) => (
                    <button
                      key={pupil.id}
                      onClick={() => handleStartChat(pupil)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {pupil.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{pupil.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {pupil.email || pupil.phone || "No contact info"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}