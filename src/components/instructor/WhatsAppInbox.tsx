import { useState } from "react";
import { useWhatsAppConversations } from "@/hooks/useWhatsAppConversations";
import { WhatsAppChat } from "./WhatsAppChat";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageCircle, Bot, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface WhatsAppInboxProps {
  instructorId: string;
}

export function WhatsAppInbox({ instructorId }: WhatsAppInboxProps) {
  const isMobile = useIsMobile();
  const { conversations, isLoading } = useWhatsAppConversations(instructorId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.visitor_name?.toLowerCase().includes(q) || false) ||
      c.phone_number.includes(q) ||
      (c.last_message?.toLowerCase().includes(q) || false)
    );
  });

  const selected = conversations.find((c) => c.id === selectedId);

  // Mobile: show chat or list
  if (isMobile && selected) {
    return (
      <WhatsAppChat
        conversation={selected}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className={cn("flex gap-4", isMobile ? "flex-col" : "h-[600px]")}>
      {/* Conversation list */}
      <Card className={cn(isMobile ? "w-full" : "w-80 flex-shrink-0")}>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <ScrollArea className={cn(isMobile ? "max-h-[400px]" : "h-[calc(100%-50px)]")}>
          {isLoading ? (
            <p className="text-center text-muted-foreground text-sm py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No WhatsApp conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                When prospects message your WhatsApp number, conversations will appear here.
              </p>
            </div>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "w-full text-left px-3 py-3 border-b border-border hover:bg-muted/50 transition-colors",
                  selectedId === conv.id && "bg-muted"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">
                      {(conv.visitor_name || conv.phone_number).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">
                        {conv.visitor_name || conv.phone_number}
                      </span>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-1">
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {conv.ai_enabled ? (
                        <Bot className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      ) : (
                        <User className="h-3 w-3 text-orange-500 flex-shrink-0" />
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </Card>

      {/* Chat area (desktop only when not mobile) */}
      {!isMobile && (
        <Card className="flex-1">
          {selected ? (
            <WhatsAppChat conversation={selected} />
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a conversation to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
