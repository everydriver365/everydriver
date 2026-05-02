import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ChevronLeft,
  Send,
  Paperclip,
  X,
  File as FileIcon,
  Trash2,
  MoreVertical,
  AlertTriangle,
  MessageSquare,
  Mic,
} from "lucide-react";
import { useConversationMessages, Conversation, Message } from "@/hooks/useMessaging";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSendViaWhatsApp } from "@/hooks/useSendViaWhatsApp";
import { Switch } from "@/components/ui/switch";
import { pupilAvatarColor, pupilAvatarInitial } from "@/lib/pupilAvatarColor";
import { titleCaseName } from "@/lib/titleCase";
import { ReadReceipt, ReadReceiptStatus } from "@/components/instructor/chat/ReadReceipt";
import { TypingDots } from "@/components/instructor/chat/TypingDots";
import {
  QuickReplyStrip,
  DEFAULT_QUICK_REPLIES,
} from "@/components/instructor/chat/QuickReplyStrip";
import {
  DateSeparator,
  formatChatDate,
} from "@/components/instructor/chat/DateSeparator";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

const TEXT = "#000000";
const MUTED = "#6E6E73";
const BLUE = "#2B7BC8";
const PAGE_BG = "#F2F2F4";
const CARD_BG = "#FFFFFF";
const HAIRLINE = "0.5px solid #E5E5EA";
const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

function getReceiptStatus(m: Message): ReadReceiptStatus {
  // Optimistic local sends may have id starting with "tmp_" — degrade gracefully.
  if ((m as any).failed) return "failed";
  if ((m as any).pending) return "sending";
  if (m.read_at) return "read";
  if (m.delivered_at) return "delivered";
  return "sent";
}

export function ChatWindow({
  conversation,
  instructorId,
  onBack,
  onDelete,
  pupilPhone,
}: ChatWindowProps) {
  const navigate = useNavigate();
  const {
    messages,
    loading,
    sendMessage,
    markAsRead,
    softDeleteMessage,
    softDeleteAllMessages,
    toggleUrgent,
  } = useConversationMessages(conversation.id, "instructor");

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
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { isOtherTyping, handleTyping, broadcastStopTyping } = useTypingIndicator({
    conversationId: conversation.id,
    userId: instructorId,
    userType: "instructor",
  });

  // Auto-scroll on new messages or typing indicator
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isOtherTyping]);

  // Mark messages as read when viewing
  useEffect(() => {
    markAsRead(instructorId);
  }, [instructorId, markAsRead]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const uploadFile = async (
    file: File,
  ): Promise<{ url: string; type: string } | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${instructorId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-attachments").getPublicUrl(fileName);
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

  // Group messages by date
  const messageGroups = useMemo(() => {
    const groups: { dateKey: string; date: Date; messages: Message[] }[] = [];
    messages.forEach((msg) => {
      const d = new Date(msg.created_at);
      const dateStr = format(d, "yyyy-MM-dd");
      const existing = groups.find((g) => g.dateKey === dateStr);
      if (existing) existing.messages.push(msg);
      else groups.push({ dateKey: dateStr, date: d, messages: [msg] });
    });
    return groups;
  }, [messages]);

  const renderAttachment = (message: Message, isInstructor: boolean) => {
    if (!message.attachment_url) return null;
    if (message.attachment_type === "image") {
      return (
        <img
          src={message.attachment_url}
          alt="Attachment"
          style={{
            maxWidth: "100%",
            maxHeight: 200,
            borderRadius: 10,
            marginTop: 6,
            cursor: "pointer",
            display: "block",
          }}
          onClick={() => window.open(message.attachment_url!, "_blank")}
        />
      );
    }
    return (
      <a
        href={message.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 6,
          padding: "6px 8px",
          background: isInstructor ? "rgba(255,255,255,0.18)" : "#F2F2F4",
          borderRadius: 10,
          color: "inherit",
          textDecoration: "none",
          fontSize: 12,
        }}
      >
        <FileIcon size={14} strokeWidth={1.8} />
        <span>View attachment</span>
      </a>
    );
  };

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
      await softDeleteAllMessages();
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

  const handleVoiceNote = () => {
    // Reuse the existing attachment picker for voice notes (audio/* will be filtered)
    fileInputRef.current?.click();
  };

  const pupilName = titleCaseName(conversation.pupil?.name) || "Unknown";
  const pupilId = conversation.pupil?.id || conversation.pupil_id;
  const avatarColor = pupilAvatarColor(pupilId);
  const avatarInitial = pupilAvatarInitial(conversation.pupil?.name);
  const showQuickReplies = !newMessage.trim() && !selectedFile && !keyboardOpen;
  const canSend = !!(newMessage.trim() || selectedFile) && !sending;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 64px)",
          background: PAGE_BG,
          fontFamily: FONT_STACK,
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "10px 12px",
            background: CARD_BG,
            borderBottom: HAIRLINE,
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "sticky",
            top: 0,
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to inbox"
            style={{
              background: "transparent",
              border: "none",
              padding: 6,
              flexShrink: 0,
              cursor: "pointer",
              display: "inline-flex",
            }}
          >
            <ChevronLeft size={22} strokeWidth={2} color={BLUE} />
          </button>

          {/* Identity (tappable → pupil detail) */}
          <button
            type="button"
            onClick={() => pupilId && navigate(`/instructor/pupils/${pupilId}`)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              minWidth: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {conversation.pupil?.profile_image_url ? (
              <img
                src={conversation.pupil.profile_image_url}
                alt=""
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: avatarColor,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                {avatarInitial}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: TEXT,
                  letterSpacing: "-0.1px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {pupilName}
              </p>
              {isOtherTyping && (
                <p style={{ margin: 0, fontSize: 11, color: BLUE }}>typing…</p>
              )}
            </div>
          </button>

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More options"
                style={{
                  background: "#F2F2F4",
                  border: "none",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <MoreVertical size={16} strokeWidth={1.8} color={MUTED} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => pupilId && navigate(`/instructor/pupils/${pupilId}`)}
              >
                View pupil details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSendAsUrgent((v) => !v)}
              >
                <AlertTriangle
                  className="h-4 w-4 mr-2"
                  color={sendAsUrgent ? "#C8434F" : undefined}
                />
                {sendAsUrgent ? "Don't mark next as urgent" : "Mark next message urgent"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowClearDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear messages
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 12px",
            background: PAGE_BG,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 32,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: `2px solid ${MUTED}`,
                  borderTopColor: "transparent",
                  animation: "chat-spin 0.8s linear infinite",
                }}
              />
              <style>{`@keyframes chat-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "32px 16px",
                gap: 10,
                margin: "auto",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "#FBF1DE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquare size={24} strokeWidth={2} color="#B8801F" />
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: TEXT }}>
                Start chatting with {pupilName.split(" ")[0] || "this pupil"}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: MUTED, lineHeight: 1.4 }}>
                Say hello, schedule a lesson, or check in
              </p>
            </div>
          ) : (
            messageGroups.map((group, gi) => (
              <div key={group.dateKey}>
                <DateSeparator date={group.date} />
                {!formatChatDate(group.date) && gi !== 0 && (
                  <div style={{ height: 4 }} />
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {group.messages.map((message, mi) => {
                    const isInstructor = message.sender_type === "instructor";
                    const isUrgent = message.is_urgent;
                    const prev = group.messages[mi - 1];
                    const consecutive =
                      prev &&
                      prev.sender_type === message.sender_type &&
                      new Date(message.created_at).getTime() -
                        new Date(prev.created_at).getTime() <
                        60_000;
                    const status: ReadReceiptStatus = getReceiptStatus(message);
                    const wrapperGap = consecutive ? 2 : 8;

                    return (
                      <div
                        key={message.id}
                        style={{
                          marginTop: wrapperGap,
                          display: "flex",
                          justifyContent: isInstructor ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (isInstructor) setMessageToDelete(message.id);
                            else
                              toggleUrgent(message.id, {
                                instructorId,
                                pupilId: conversation.pupil_id,
                              });
                          }}
                          style={{
                            maxWidth: "75%",
                            background: isInstructor ? BLUE : CARD_BG,
                            color: isInstructor ? "#FFFFFF" : TEXT,
                            borderRadius: isInstructor
                              ? "14px 14px 4px 14px"
                              : "14px 14px 14px 4px",
                            padding: "8px 12px",
                            outline: isUrgent
                              ? `2px solid rgba(200,67,79,0.65)`
                              : "none",
                          }}
                        >
                          {isUrgent && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 10,
                                fontWeight: 500,
                                marginBottom: 3,
                                color: isInstructor
                                  ? "rgba(255,255,255,0.95)"
                                  : "#C8434F",
                                letterSpacing: "0.4px",
                              }}
                            >
                              <AlertTriangle size={11} strokeWidth={2} />
                              URGENT
                            </div>
                          )}
                          {message.content && (
                            <p
                              style={{
                                margin: "0 0 3px",
                                fontSize: 14,
                                lineHeight: 1.3,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {message.content}
                            </p>
                          )}
                          {renderAttachment(message, isInstructor)}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 4,
                              marginTop: 2,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                color: isInstructor
                                  ? "rgba(255,255,255,0.75)"
                                  : MUTED,
                              }}
                            >
                              {format(new Date(message.created_at), "HH:mm")}
                            </span>
                            {isInstructor && <ReadReceipt status={status} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          {isOtherTyping && messages.length > 0 && <TypingDots />}
        </div>

        {/* Composer area */}
        <div style={{ background: CARD_BG, flexShrink: 0 }}>
          {/* WhatsApp toggle (preserved) */}
          {pupilPhone && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px 0",
              }}
            >
              <MessageSquare size={13} strokeWidth={1.8} color="#3B8B3B" />
              <span style={{ fontSize: 11, color: MUTED }}>
                Also send via WhatsApp
              </span>
              <Switch
                checked={sendViaWhatsApp}
                onCheckedChange={setSendViaWhatsApp}
                className="h-4 w-8 [&>span]:h-3 [&>span]:w-3 data-[state=checked]:bg-emerald-500"
              />
            </div>
          )}

          {/* File preview (preserved) */}
          {selectedFile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: PAGE_BG,
                  borderRadius: 12,
                  padding: 6,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      background: CARD_BG,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileIcon size={16} strokeWidth={1.8} color={MUTED} />
                  </div>
                )}
                <p
                  style={{
                    flex: 1,
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 500,
                    color: TEXT,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedFile.name}
                </p>
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  aria-label="Remove attachment"
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 4,
                    cursor: "pointer",
                  }}
                >
                  <X size={14} strokeWidth={1.8} color={MUTED} />
                </button>
              </div>
            </div>
          )}

          {/* Quick replies */}
          {showQuickReplies && (
            <QuickReplyStrip
              replies={DEFAULT_QUICK_REPLIES}
              onSelect={(text) => {
                setNewMessage((cur) => (cur ? `${cur} ${text}` : text));
                inputRef.current?.focus();
              }}
            />
          )}

          {/* Composer row */}
          <div
            style={{
              padding: "8px 12px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt,audio/*"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              aria-label="Attach file"
              style={{
                background: PAGE_BG,
                border: "none",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: sending ? "not-allowed" : "pointer",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <Paperclip size={16} strokeWidth={2} color={MUTED} />
            </button>

            <div
              style={{
                background: PAGE_BG,
                borderRadius: 12,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: 1,
                minWidth: 0,
              }}
            >
              <input
                ref={inputRef}
                placeholder="Type a message"
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setKeyboardOpen(true)}
                onBlur={() => setKeyboardOpen(false)}
                disabled={sending}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: TEXT,
                  fontFamily: FONT_STACK,
                }}
              />
              <button
                type="button"
                onClick={handleVoiceNote}
                aria-label="Voice note"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  flexShrink: 0,
                }}
              >
                <Mic size={18} strokeWidth={1.8} color={MUTED} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
              style={{
                background: BLUE,
                border: "none",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canSend ? "pointer" : "not-allowed",
                opacity: canSend ? 1 : 0.4,
                flexShrink: 0,
                padding: 0,
              }}
            >
              {uploading ? (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid #FFFFFF",
                    borderTopColor: "transparent",
                    animation: "chat-spin 0.8s linear infinite",
                  }}
                />
              ) : (
                <Send size={16} strokeWidth={2} color="#FFFFFF" />
              )}
            </button>
          </div>
        </div>
      </div>

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
      <AlertDialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be hidden from view but retained in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingMessage}>
              Cancel
            </AlertDialogCancel>
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
