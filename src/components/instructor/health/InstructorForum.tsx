import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  MessageSquare, 
  Plus, 
  Bell, 
  Eye, 
  Clock, 
  ChevronRight,
  Send,
  Heart,
  Briefcase,
  Car,
  Users,
  Lightbulb,
  MessageCircle,
  Pin
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ForumTopic {
  id: string;
  instructor_id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  last_reply_at: string | null;
  created_at: string;
  instructor?: { name: string; profile_image_url: string | null };
}

interface ForumReply {
  id: string;
  topic_id: string;
  instructor_id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  instructor?: { name: string; profile_image_url: string | null };
}

interface ForumAlert {
  id: string;
  topic_id: string;
  reply_id: string | null;
  alert_type: string;
  is_read: boolean;
  created_at: string;
  topic?: { title: string };
}

const CATEGORIES = [
  { value: "all", label: "All Topics", icon: MessageSquare },
  { value: "health", label: "Health", icon: Heart },
  { value: "business", label: "Business", icon: Briefcase },
  { value: "vehicles", label: "Vehicles", icon: Car },
  { value: "students", label: "Students", icon: Users },
  { value: "tips", label: "Tips", icon: Lightbulb },
  { value: "general", label: "General", icon: MessageCircle },
];

export function InstructorForum() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();
  const instructorId = instructor?.id;
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [replyContent, setReplyContent] = useState("");

  // Fetch topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ["forum-topics", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("instructor_forum_topics")
        .select("id, instructor_id, title, content, category, is_pinned, is_locked, view_count, reply_count, last_reply_at, created_at")
        .order("is_pinned", { ascending: false })
        .order("last_reply_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch instructor names separately
      const instructorIds = [...new Set((data || []).map(t => t.instructor_id))];
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name, profile_image_url")
        .in("id", instructorIds);
      
      const instructorMap = new Map(instructors?.map(i => [i.id, i]) || []);
      
      return (data || []).map(t => ({
        ...t,
        instructor: instructorMap.get(t.instructor_id) || { name: "Unknown", profile_image_url: null }
      })) as ForumTopic[];
    },
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["forum-alerts", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];
      const { data, error } = await supabase
        .from("instructor_forum_alerts")
        .select("*, topic:instructor_forum_topics(title)")
        .eq("instructor_id", instructorId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as ForumAlert[];
    },
    enabled: !!instructorId,
  });

  // Fetch replies for selected topic
  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ["forum-replies", selectedTopic?.id],
    queryFn: async () => {
      if (!selectedTopic?.id) return [];
      const { data, error } = await supabase
        .from("instructor_forum_replies")
        .select("id, topic_id, instructor_id, content, is_solution, created_at")
        .eq("topic_id", selectedTopic.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      
      // Fetch instructor names
      const instructorIds = [...new Set((data || []).map(r => r.instructor_id))];
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name, profile_image_url")
        .in("id", instructorIds);
      
      const instructorMap = new Map(instructors?.map(i => [i.id, i]) || []);
      
      return (data || []).map(r => ({
        ...r,
        instructor: instructorMap.get(r.instructor_id) || { name: "Unknown", profile_image_url: null }
      })) as ForumReply[];
    },
    enabled: !!selectedTopic?.id,
  });

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async () => {
      if (!instructorId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("instructor_forum_topics")
        .insert({
          instructor_id: instructorId,
          title: newTitle,
          content: newContent,
          category: newCategory,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-topics"] });
      toast.success("Topic created!");
      setIsNewTopicOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewCategory("general");
    },
    onError: () => {
      toast.error("Failed to create topic");
    },
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async () => {
      if (!instructorId || !selectedTopic) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("instructor_forum_replies")
        .insert({
          topic_id: selectedTopic.id,
          instructor_id: instructorId,
          content: replyContent,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-replies", selectedTopic?.id] });
      queryClient.invalidateQueries({ queryKey: ["forum-topics"] });
      toast.success("Reply posted!");
      setReplyContent("");
    },
    onError: () => {
      toast.error("Failed to post reply");
    },
  });

  // Mark alert as read
  const markAlertReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("instructor_forum_alerts")
        .update({ is_read: true })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-alerts", instructorId] });
    },
  });

  // Real-time subscription for alerts
  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel(`forum-alerts-${instructorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "instructor_forum_alerts",
          filter: `instructor_id=eq.${instructorId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["forum-alerts", instructorId] });
          toast.info("You have a new forum reply!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, queryClient]);

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.icon || MessageCircle;
  };

  const unreadCount = alerts.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Instructor Forum
        </h2>
        <div className="flex items-center gap-2">
          {/* Alerts */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative h-9 w-9 p-0">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Forum Alerts
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No new alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <button
                      key={alert.id}
                      className="w-full p-3 rounded-2xl bg-muted/50 hover:bg-muted text-left"
                      onClick={() => {
                        markAlertReadMutation.mutate(alert.id);
                        // Find and open the topic
                        const topic = topics.find(t => t.id === alert.topic_id);
                        if (topic) setSelectedTopic(topic);
                      }}
                    >
                      <p className="text-sm font-medium truncate">{alert.topic?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        New {alert.alert_type} • {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* New Topic */}
          <Dialog open={isNewTopicOpen} onOpenChange={setIsNewTopicOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Topic</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Input
                    placeholder="Topic title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c.value !== "all").map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Textarea
                    placeholder="What would you like to discuss?"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => createTopicMutation.mutate()}
                  disabled={!newTitle || !newContent || createTopicMutation.isPending}
                >
                  {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Filter */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            return (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5 flex-shrink-0"
                onClick={() => setSelectedCategory(cat.value)}
              >
                <IconComp className="h-3.5 w-3.5" />
                {cat.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Topics List or Topic View */}
      {selectedTopic ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setSelectedTopic(null)}
              >
                ←
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {selectedTopic.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
                  <CardTitle className="text-base">{selectedTopic.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{selectedTopic.instructor?.name}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(selectedTopic.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Original Post */}
            <div className="p-3 bg-muted/30 rounded-2xl">
              <p className="text-sm whitespace-pre-wrap">{selectedTopic.content}</p>
            </div>

            {/* Replies */}
            {repliesLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Loading replies...</div>
            ) : replies.length > 0 ? (
              <div className="space-y-3 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground">{replies.length} Replies</p>
                {replies.map((reply) => (
                  <div key={reply.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reply.instructor?.profile_image_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {reply.instructor?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{reply.instructor?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Reply Input */}
            {!selectedTopic.is_locked && (
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1 h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && replyContent.trim()) {
                      e.preventDefault();
                      createReplyMutation.mutate();
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={() => createReplyMutation.mutate()}
                  disabled={!replyContent.trim() || createReplyMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {topicsLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Loading topics...</div>
            ) : topics.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No topics yet</p>
                <p className="text-xs text-muted-foreground">Be the first to start a discussion!</p>
              </div>
            ) : (
              <div className="divide-y">
                {topics.map((topic) => {
                  const CategoryIcon = getCategoryIcon(topic.category);
                  return (
                    <button
                      key={topic.id}
                      className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                      onClick={() => setSelectedTopic(topic)}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={topic.instructor?.profile_image_url || undefined} />
                        <AvatarFallback>
                          {topic.instructor?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {topic.is_pinned && <Pin className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                          <p className="text-sm font-medium truncate">{topic.title}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            <CategoryIcon className="h-2.5 w-2.5 mr-0.5" />
                            {CATEGORIES.find(c => c.value === topic.category)?.label}
                          </Badge>
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="h-3 w-3" />
                            {topic.reply_count}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="h-3 w-3" />
                            {topic.view_count}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(topic.last_reply_at || topic.created_at), { addSuffix: true })}
                        </p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 ml-auto" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
