import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  MessageSquare, Search, User, Loader2, Send, ChevronLeft, 
  Users, Car, Check, CheckCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  instructor_id: string;
  pupil_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  instructor?: { id: string; name: string; profile_image_url: string | null };
  pupil?: { id: string; name: string; phone: string | null };
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: "instructor" | "pupil";
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export function AdminMessagesManager() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          instructor:instructors(id, name, profile_image_url),
          pupil:pupils(id, name, phone)
        `)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Get unread counts for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .is("read_at", null);

          return {
            ...conv,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithUnread);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as "instructor" | "pupil"
      })));
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("admin-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
          if (selectedConversation) {
            fetchMessages(selectedConversation.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations, fetchMessages, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  const filteredConversations = conversations.filter(conv => {
    const query = searchQuery.toLowerCase();
    return (
      conv.instructor?.name.toLowerCase().includes(query) ||
      conv.pupil?.name.toLowerCase().includes(query)
    );
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(msg => {
      const date = format(new Date(msg.created_at), "yyyy-MM-dd");
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{conversations.length}</div>
            <div className="text-sm text-muted-foreground">Total Conversations</div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{totalUnread}</div>
            <div className="text-sm text-muted-foreground">Unread Messages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {conversations.filter(c => {
                const lastMsg = new Date(c.last_message_at);
                const now = new Date();
                return (now.getTime() - lastMsg.getTime()) < 24 * 60 * 60 * 1000;
              }).length}
            </div>
            <div className="text-sm text-muted-foreground">Active Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Messages View */}
      <Card className="h-[600px] flex flex-col overflow-hidden">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={cn(
            "w-full md:w-80 border-r flex flex-col",
            selectedConversation ? "hidden md:flex" : "flex"
          )}>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedConversation?.id === conv.id && "bg-muted"
                      )}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.instructor?.profile_image_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {conv.instructor?.name?.charAt(0) || "I"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{conv.instructor?.name || "Instructor"}</span>
                              <Badge variant="outline" className="text-xs">
                                <Car className="h-3 w-3 mr-1" />
                                ADI
                              </Badge>
                            </div>
                            {(conv.unread_count || 0) > 0 && (
                              <Badge className="bg-primary text-primary-foreground shrink-0">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate">{conv.pupil?.name || "Pupil"}</span>
                          </div>
                          {conv.last_message_preview && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {conv.last_message_preview}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(conv.last_message_at), "dd MMM, HH:mm")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Panel */}
          <div className={cn(
            "flex-1 flex flex-col",
            !selectedConversation ? "hidden md:flex" : "flex"
          )}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.instructor?.profile_image_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedConversation.instructor?.name?.charAt(0) || "I"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {selectedConversation.instructor?.name}
                      <Badge variant="outline" className="text-xs">Instructor</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedConversation.pupil?.name}
                      <Badge variant="outline" className="text-xs ml-1">Pupil</Badge>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No messages in this conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
                        <div key={date}>
                          <div className="flex items-center justify-center mb-4">
                            <Badge variant="secondary" className="text-xs">
                              {format(new Date(date), "EEEE, MMMM d")}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {msgs.map((msg) => {
                              const isInstructor = msg.sender_type === "instructor";
                              return (
                                <div
                                  key={msg.id}
                                  className={cn(
                                    "flex",
                                    isInstructor ? "justify-end" : "justify-start"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "max-w-[70%] rounded-2xl px-4 py-2",
                                      isInstructor
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-muted rounded-bl-md"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-xs",
                                          isInstructor 
                                            ? "border-primary-foreground/30 text-primary-foreground" 
                                            : ""
                                        )}
                                      >
                                        {isInstructor ? "Instructor" : "Pupil"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <div className={cn(
                                      "flex items-center justify-end gap-1 mt-1",
                                      isInstructor ? "text-primary-foreground/70" : "text-muted-foreground"
                                    )}>
                                      <span className="text-xs">
                                        {format(new Date(msg.created_at), "HH:mm")}
                                      </span>
                                      {isInstructor && (
                                        msg.read_at ? (
                                          <CheckCheck className="h-3 w-3" />
                                        ) : (
                                          <Check className="h-3 w-3" />
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

                {/* Admin View Notice */}
                <div className="p-4 border-t bg-muted/30">
                  <p className="text-sm text-center text-muted-foreground">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Viewing conversation as admin (read-only)
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
