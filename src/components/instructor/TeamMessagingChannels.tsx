import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Plus, Hash, Send, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function TeamMessagingChannels({ instructorId }: { instructorId: string }) {
  const queryClient = useQueryClient();
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelDesc, setChannelDesc] = useState("");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: channels = [] } = useQuery({
    queryKey: ["team-channels"],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_channels")
        .select("*, team_channel_members(count)")
        .eq("is_archived", false)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["channel-messages", activeChannel?.id],
    queryFn: async () => {
      if (!activeChannel) return [];
      const { data } = await supabase
        .from("team_channel_messages")
        .select("*, instructors:sender_id(name)")
        .eq("channel_id", activeChannel.id)
        .order("created_at", { ascending: true })
        .limit(100);
      return data || [];
    },
    enabled: !!activeChannel,
  });

  // Realtime subscription
  useEffect(() => {
    if (!activeChannel) return;
    const channel = supabase
      .channel(`channel-${activeChannel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_channel_messages", filter: `channel_id=eq.${activeChannel.id}` }, () => {
        refetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChannel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createChannelMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("team_channels").insert({
        name: channelName,
        description: channelDesc,
        created_by: instructorId,
      }).select().single();
      if (error) throw error;
      // Auto-join
      await supabase.from("team_channel_members").insert({ channel_id: data.id, instructor_id: instructorId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-channels"] });
      setShowCreate(false);
      setChannelName("");
      setChannelDesc("");
      toast.success("Channel created");
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!activeChannel || !messageText.trim()) return;
      const { error } = await supabase.from("team_channel_messages").insert({
        channel_id: activeChannel.id,
        sender_id: instructorId,
        content: messageText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
    },
  });

  if (activeChannel) {
    return (
      <div className="flex flex-col h-[500px]">
        <div className="flex items-center gap-2 pb-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => setActiveChannel(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{activeChannel.name}</span>
        </div>
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {messages.map((msg: any) => (
            <div key={msg.id} className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">{msg.instructors?.name || "Unknown"}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), "HH:mm")}</span>
              </div>
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 pt-3 border-t">
          <Input
            placeholder={`Message #${activeChannel.name}`}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMutation.mutate()}
          />
          <Button size="icon" onClick={() => sendMutation.mutate()} disabled={!messageText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Team Channels
        </h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Channel
        </Button>
      </div>

      <div className="grid gap-2">
        {channels.map((ch: any) => (
          <Card key={ch.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveChannel(ch)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-none bg-primary/10 flex items-center justify-center">
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{ch.name}</p>
                {ch.description && <p className="text-xs text-muted-foreground truncate">{ch.description}</p>}
              </div>
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {ch.team_channel_members?.[0]?.count || 0}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {channels.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No channels yet. Create one to start chatting.</p>}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Channel name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
            <Input placeholder="Description (optional)" value={channelDesc} onChange={(e) => setChannelDesc(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={() => createChannelMutation.mutate()} disabled={!channelName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
