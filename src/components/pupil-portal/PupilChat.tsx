import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ArrowLeft, Check, CheckCheck, MessageCircle, Send, Paperclip, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useConversationMessages, Message } from "@/hooks/useMessaging";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PupilChatProps {
  pupilId: string;
  pupilName?: string;
  instructorId: string;
  instructorName: string;
  onBack?: () => void;
}

export function PupilChat({ pupilId, pupilName, instructorId, instructorName, onBack }: PupilChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get or create conversation
  useEffect(() => {
    const getOrCreateConversation = async () => {
      try {
        // Check for existing conversation
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("instructor_id", instructorId)
          .eq("pupil_id", pupilId)
          .single();

        if (existing) {
          setConversationId(existing.id);
        } else {
          // Create new conversation
          const { data: newConv, error } = await supabase
            .from("conversations")
            .insert({
              instructor_id: instructorId,
              pupil_id: pupilId,
            })
            .select("id")
            .single();

          if (!error && newConv) {
            setConversationId(newConv.id);
          }
        }
      } catch (error) {
        console.error("Error getting conversation:", error);
      } finally {
        setLoading(false);
      }
    };

    getOrCreateConversation();
  }, [pupilId, instructorId]);

  const { messages, sendMessage, markAsRead } = useConversationMessages(conversationId, "pupil");

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (conversationId) {
      markAsRead(pupilId);
    }
  }, [conversationId, pupilId, markAsRead]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: string } | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${pupilId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      const attachmentType = file.type.startsWith("image/") ? "image" : "file";
      return { url: publicUrl, type: attachmentType };
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload file",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    setSending(true);
    setUploading(!!selectedFile);

    let attachmentData: { url: string; type: string } | null = null;
    
    if (selectedFile) {
      attachmentData = await uploadFile(selectedFile);
      if (!attachmentData && !newMessage.trim()) {
        setSending(false);
        setUploading(false);
        return;
      }
    }

    setUploading(false);

    const success = await sendMessage(newMessage, pupilId, {
      attachmentUrl: attachmentData?.url,
      attachmentType: attachmentData?.type,
      instructorId: instructorId,
      pupilName: pupilName || "Pupil",
    });

    if (success) {
      setNewMessage("");
      clearSelectedFile();
      inputRef.current?.focus();
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    
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

  const renderAttachment = (message: Message) => {
    if (!message.attachment_url) return null;

    if (message.attachment_type === "image") {
      return (
        <img
          src={message.attachment_url}
          alt="Attachment"
          className="max-w-full rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxHeight: "200px" }}
          onClick={() => window.open(message.attachment_url!, "_blank")}
        />
      );
    }

    return (
      <a
        href={message.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 bg-background/20 rounded-lg hover:bg-background/30 transition-colors"
      >
        <File className="h-4 w-4" />
        <span className="text-sm underline">View attachment</span>
      </a>
    );
  };

  const messageGroups = groupMessagesByDate(messages);

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {instructorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{instructorName}</h3>
            <p className="text-sm text-muted-foreground">Your Instructor</p>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Send a message to your instructor</p>
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
                    const isPupil = message.sender_type === "pupil";
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isPupil ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2",
                            isPupil
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          {message.content && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          )}
                          {renderAttachment(message)}
                          <div
                            className={cn(
                              "flex items-center gap-1 mt-1",
                              isPupil ? "justify-end" : "justify-start"
                            )}
                          >
                            <span
                              className={cn(
                                "text-[10px]",
                                isPupil
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {format(new Date(message.created_at), "HH:mm")}
                            </span>
                            {isPupil && (
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

      <CardContent className="p-3 border-t shrink-0 space-y-2">
        {/* File preview */}
        {selectedFile && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-12 w-12 object-cover rounded" />
            ) : (
              <div className="h-12 w-12 bg-background rounded flex items-center justify-center">
                <File className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={clearSelectedFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={(!newMessage.trim() && !selectedFile) || sending}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}