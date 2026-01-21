import { useState, useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { MessageCircle, Search, User, Send, Check, CheckCheck, ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  useAdminInstructorChats, 
  useAdminConversationMessages,
  AdminConversation,
  AdminMessage 
} from "@/hooks/useAdminMessaging";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { cn } from "@/lib/utils";

export function AdminInstructorMessagesManager() {
  const { conversations, loading, getTotalUnreadCount } = useAdminInstructorChats();
  const { user } = useAdminAuth();
  const [selectedConversation, setSelectedConversation] = useState<AdminConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.instructor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = getTotalUnreadCount();

  if (selectedConversation) {
    return (
      <AdminChatView
        conversation={selectedConversation}
        adminId={user?.id || ""}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Instructor Messages
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalUnread}
              </Badge>
            )}
          </CardTitle>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-18rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No instructor messages yet</p>
              <p className="text-sm">Instructors can message you from their portal</p>
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
                    {conversation.instructor?.profile_image_url ? (
                      <AvatarImage src={conversation.instructor.profile_image_url} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {conversation.instructor?.name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "font-medium truncate",
                        conversation.unread_count && conversation.unread_count > 0 && "font-semibold"
                      )}>
                        {conversation.instructor?.name || "Unknown Instructor"}
                      </span>
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                        </span>
                      )}
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
      </CardContent>
    </Card>
  );
}

interface AdminChatViewProps {
  conversation: AdminConversation;
  adminId: string;
  onBack: () => void;
}

function AdminChatView({ conversation, adminId, onBack }: AdminChatViewProps) {
  const { messages, loading, sending, sendMessage, markAsRead } = useAdminConversationMessages(
    conversation.id, 
    conversation.instructor_id
  );
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const success = await sendMessage(newMessage, adminId);
    if (success) {
      setNewMessage("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupMessagesByDate = (msgs: AdminMessage[]) => {
    const groups: { date: string; messages: AdminMessage[] }[] = [];
    
    msgs.forEach((msg) => {
      const dateStr = format(new Date(msg.created_at), "yyyy-MM-dd");
      const existingGroup = groups.find((g) => g.date === dateStr);
      
      if (existingGroup) {
        existingGroup.messages.push(msg);
      } else {
        groups.push({ date: dateStr, messages: [msg] });
      }
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            {conversation.instructor?.profile_image_url ? (
              <AvatarImage src={conversation.instructor.profile_image_url} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {conversation.instructor?.name?.charAt(0) || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{conversation.instructor?.name || "Unknown"}</h3>
            <p className="text-sm text-muted-foreground">Instructor</p>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messageGroups.map((group) => (
              <div key={group.date}>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {format(new Date(group.date), "EEEE, d MMMM yyyy")}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.messages.map((message) => {
                    const isAdmin = message.sender_type === "admin";
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isAdmin ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2",
                            isAdmin
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <div
                            className={cn(
                              "flex items-center gap-1 mt-1",
                              isAdmin ? "justify-end" : "justify-start"
                            )}
                          >
                            <span
                              className={cn(
                                "text-[10px]",
                                isAdmin
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {format(new Date(message.created_at), "HH:mm")}
                            </span>
                            {isAdmin && (
                              message.read_at ? (
                                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                              ) : (
                                <Check className="h-3 w-3 text-primary-foreground/70" />
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

      <CardContent className="p-3 border-t shrink-0">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a reply..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
