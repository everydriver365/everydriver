import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ArrowLeft, Check, CheckCheck, Send, User, Paperclip, X, File, Trash2, MoreVertical, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversationMessages, Conversation, Message } from "@/hooks/useMessaging";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence } from "framer-motion";
import { useSendViaWhatsApp } from "@/hooks/useSendViaWhatsApp";
import { Switch } from "@/components/ui/switch";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatWindowProps {
  conversation: Conversation;
  instructorId: string;
  onBack: () => void;
  onDelete?: () => void;
  pupilPhone?: string | null;
}

export function ChatWindow({ conversation, instructorId, onBack, onDelete, pupilPhone }: ChatWindowProps) {
  const { messages, loading, sendMessage, markAsRead, softDeleteMessage, softDeleteAllMessages, toggleUrgent } = useConversationMessages(
    conversation.id,
    "instructor"
  );
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendAsUrgent, setSendAsUrgent] = useState(false);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(!!pupilPhone);
  const { sendMessage: sendWhatsApp } = useSendViaWhatsApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { isOtherTyping, handleTyping, broadcastStopTyping } = useTypingIndicator({
    conversationId: conversation.id,
    userId: instructorId,
    userType: "instructor",
  });

  // Scroll to bottom on new messages or typing indicator
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOtherTyping]);

  // Mark messages as read when viewing
  useEffect(() => {
    markAsRead(instructorId);
  }, [instructorId, markAsRead]);

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
      const fileName = `${instructorId}/${Date.now()}.${fileExt}`;
      
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
    broadcastStopTyping();

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

    // Also send via WhatsApp/SMS if toggled on and phone available
    if (sendViaWhatsApp && pupilPhone && newMessage.trim()) {
      const waResult = await sendWhatsApp(pupilPhone, newMessage);
      if (waResult.success) {
        toast({
          title: `Sent via ${waResult.sent_via === "whatsapp" ? "WhatsApp" : "SMS"} ✓`,
        });
      }
    }

    const success = await sendMessage(newMessage, instructorId, {
      attachmentUrl: attachmentData?.url,
      attachmentType: attachmentData?.type,
      isUrgent: sendAsUrgent,
      pupilId: conversation.pupil_id,
    });

    if (success) {
      setNewMessage("");
      clearSelectedFile();
      setSendAsUrgent(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
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

  const handleClearMessages = async () => {
    setDeleting(true);
    try {
      const success = await softDeleteAllMessages();
      if (!success) throw new Error("Failed");
      toast({ title: "Messages cleared" });
      setShowClearDialog(false);
    } catch (error) {
      console.error("Error clearing messages:", error);
      toast({ title: "Failed to clear messages", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    setDeletingMessage(true);
    try {
      const success = await softDeleteMessage(messageToDelete);
      if (!success) throw new Error("Failed");
      toast({ title: "Message deleted" });
      setMessageToDelete(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({ title: "Failed to delete message", variant: "destructive" });
    } finally {
      setDeletingMessage(false);
    }
  };

  const handleDeleteConversation = async () => {
    setDeleting(true);
    try {
      // Soft delete all messages first
      await softDeleteAllMessages();

      // Then soft-mark the conversation (we keep it but clear it)
      toast({ title: "Conversation cleared" });
      setShowDeleteDialog(false);
      onDelete?.();
      onBack();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({ title: "Failed to delete conversation", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <Card className="h-[calc(100vh-14rem)] md:h-[calc(100vh-16rem)] flex flex-col">
      <CardHeader className="pb-2 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 touch-manipulation">
            <ArrowLeft className="h-5 w-5 pointer-events-none" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {conversation.pupil?.name?.charAt(0) || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{conversation.pupil?.name || "Unknown"}</h3>
            {isOtherTyping ? (
              <p className="text-sm text-primary animate-pulse">typing...</p>
            ) : conversation.pupil?.phone ? (
              <p className="text-sm text-muted-foreground">{conversation.pupil.phone}</p>
            ) : null}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="shrink-0 touch-manipulation md:hidden"
            aria-label="Close chat"
          >
            <X className="h-5 w-5 pointer-events-none" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowClearDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Messages
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
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
                    const isInstructor = message.sender_type === "instructor";
                    const isUrgent = message.is_urgent;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex group",
                          isInstructor ? "justify-end" : "justify-start"
                        )}
                      >
                        {/* Actions for instructor's own messages */}
                        {isInstructor && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-1 shrink-0 self-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleUrgent(message.id, { instructorId, pupilId: conversation.pupil_id })}
                              title={isUrgent ? "Remove urgent" : "Mark urgent"}
                            >
                              <AlertTriangle className={cn("h-3 w-3", isUrgent ? "text-destructive" : "text-muted-foreground")} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setMessageToDelete(message.id)}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        )}
                        {/* Urgent toggle for received messages */}
                        {!isInstructor && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-1 shrink-0 self-center order-last ml-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleUrgent(message.id, { instructorId, pupilId: conversation.pupil_id })}
                              title={isUrgent ? "Remove urgent" : "Mark urgent"}
                            >
                              <AlertTriangle className={cn("h-3 w-3", isUrgent ? "text-destructive" : "text-muted-foreground")} />
                            </Button>
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-3 py-2",
                            isInstructor
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md",
                            isUrgent && "ring-2 ring-destructive/60"
                          )}
                        >
                          {isUrgent && (
                            <div className={cn(
                              "flex items-center gap-1 mb-1 text-[10px] font-semibold",
                              isInstructor ? "text-primary-foreground/90" : "text-destructive"
                            )}>
                              <AlertTriangle className="h-3 w-3" />
                              URGENT
                            </div>
                          )}
                          {message.content && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          )}
                          {renderAttachment(message)}
                          <div
                            className={cn(
                              "flex items-center gap-1 mt-1",
                              isInstructor ? "justify-end" : "justify-start"
                            )}
                          >
                            <span
                              className={cn(
                                "text-[10px]",
                                isInstructor
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {format(new Date(message.created_at), "HH:mm")}
                            </span>
                            {isInstructor && (
                              <span className="inline-flex items-center" title={
                                message.read_at
                                  ? `Delivered ${message.delivered_at ? format(new Date(message.delivered_at), "HH:mm") : ""} · Read ${format(new Date(message.read_at), "HH:mm")}`
                                  : message.delivered_at
                                    ? `Delivered ${format(new Date(message.delivered_at), "HH:mm")}`
                                    : "Sent"
                              }>
                                {message.read_at ? (
                                  <CheckCheck className="h-3 w-3 text-sky-400" />
                                ) : message.delivered_at ? (
                                  <CheckCheck className="h-3 w-3 text-primary-foreground/50" />
                                ) : (
                                  <Check className="h-3 w-3 text-primary-foreground/50" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            <AnimatePresence>
              {isOtherTyping && (
                <TypingIndicator name={conversation.pupil?.name} />
              )}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      <CardContent className="p-2 border-t shrink-0 space-y-1.5">
        {/* WhatsApp toggle */}
        {pupilPhone && (
          <div className="flex items-center gap-2 px-1">
            <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Also send via WhatsApp</span>
            <Switch
              checked={sendViaWhatsApp}
              onCheckedChange={setSendViaWhatsApp}
              className="h-4 w-8 [&>span]:h-3 [&>span]:w-3 data-[state=checked]:bg-emerald-500"
            />
          </div>
        )}
        {/* File preview */}
        {selectedFile && (
          <div className="flex items-center gap-2 p-1.5 bg-muted rounded-lg">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-8 w-8 object-cover rounded" />
            ) : (
              <div className="h-8 w-8 bg-background rounded flex items-center justify-center">
                <File className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{selectedFile.name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-6 w-6"
              onClick={clearSelectedFile}
            >
              <X className="h-3 w-3" />
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
          <Button
            variant={sendAsUrgent ? "destructive" : "ghost"}
            size="icon"
            onClick={() => setSendAsUrgent(!sendAsUrgent)}
            title={sendAsUrgent ? "Sending as urgent" : "Mark as urgent"}
            className="shrink-0"
          >
            <AlertTriangle className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1 h-9 text-sm"
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

    {/* Clear Messages Dialog */}
    <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all messages?</AlertDialogTitle>
          <AlertDialogDescription>
            Messages will be hidden from view but retained in the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleClearMessages}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Clearing..." : "Clear Messages"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Delete Conversation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear this conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            All messages will be hidden from view but retained in the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteConversation}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Deleting..." : "Delete Chat"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Delete Single Message Dialog */}
    <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this message?</AlertDialogTitle>
          <AlertDialogDescription>
            This message will be hidden from view but retained in the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingMessage}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteMessage}
            disabled={deletingMessage}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deletingMessage ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}