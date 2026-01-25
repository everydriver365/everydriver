import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Mail,
  RefreshCw,
  Send,
  Inbox,
  Archive,
  Trash2,
  Star,
  PenSquare,
  ChevronLeft,
  Loader2,
  FolderOpen,
  X,
  Reply,
  Forward,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

interface Email {
  id: string;
  uid: number;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  seen: boolean;
  folder: string;
}

interface EmailFolder {
  name: string;
  path: string;
  count: number;
  unseen: number;
}

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  INBOX: <Inbox className="h-4 w-4" />,
  Sent: <Send className="h-4 w-4" />,
  Drafts: <PenSquare className="h-4 w-4" />,
  Trash: <Trash2 className="h-4 w-4" />,
  Archive: <Archive className="h-4 w-4" />,
  Starred: <Star className="h-4 w-4" />,
};

export function AdminEmailClient() {
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Compose form
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchEmails(selectedFolder);
  }, [selectedFolder]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-email", {
        body: { action: "folders" },
      });

      if (error) throw error;
      if (data?.folders) {
        // Sort folders with INBOX first
        const sorted = data.folders.sort((a: EmailFolder, b: EmailFolder) => {
          if (a.path === "INBOX") return -1;
          if (b.path === "INBOX") return 1;
          return a.name.localeCompare(b.name);
        });
        setFolders(sorted);
      }
    } catch (err: any) {
      console.error("Error fetching folders:", err);
      toast.error("Failed to load folders");
    }
  };

  const fetchEmails = async (folder: string) => {
    setLoading(true);
    setSelectedEmail(null);

    try {
      const { data, error } = await supabase.functions.invoke("admin-email", {
        body: { action: "fetch", folder, limit: 30 },
      });

      if (error) throw error;
      if (data?.emails) {
        setEmails(data.emails);
      }
    } catch (err: any) {
      console.error("Error fetching emails:", err);
      toast.error("Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  const openEmail = async (email: Email) => {
    setLoadingEmail(true);
    setSelectedEmail(email);

    try {
      const { data, error } = await supabase.functions.invoke("admin-email", {
        body: { action: "read", folder: email.folder, uid: email.uid },
      });

      if (error) throw error;
      if (data?.email) {
        setSelectedEmail(data.email);
        // Update the email in the list to show as read
        setEmails((prev) =>
          prev.map((e) => (e.id === email.id ? { ...e, seen: true } : e))
        );
      }
    } catch (err: any) {
      console.error("Error reading email:", err);
    } finally {
      setLoadingEmail(false);
    }
  };

  const sendEmail = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-email", {
        body: {
          action: "send",
          to: composeTo.trim(),
          cc: composeCc.trim() || undefined,
          subject: composeSubject.trim(),
          body: composeBody.trim(),
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success("Email sent successfully");
        setComposeOpen(false);
        resetComposeForm();
        // Refresh sent folder if viewing it
        if (selectedFolder.toLowerCase().includes("sent")) {
          fetchEmails(selectedFolder);
        }
      }
    } catch (err: any) {
      console.error("Error sending email:", err);
      toast.error(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const deleteEmail = async (email: Email) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-email", {
        body: { action: "delete", folder: email.folder, uid: email.uid },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success("Email deleted");
        setEmails((prev) => prev.filter((e) => e.id !== email.id));
        if (selectedEmail?.id === email.id) {
          setSelectedEmail(null);
        }
      }
    } catch (err: any) {
      console.error("Error deleting email:", err);
      toast.error("Failed to delete email");
    }
  };

  const moveEmail = async (email: Email, toFolder: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-email", {
        body: {
          action: "move",
          uid: email.uid,
          fromFolder: email.folder,
          toFolder,
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(`Moved to ${toFolder}`);
        setEmails((prev) => prev.filter((e) => e.id !== email.id));
        if (selectedEmail?.id === email.id) {
          setSelectedEmail(null);
        }
        fetchFolders(); // Refresh folder counts
      }
    } catch (err: any) {
      console.error("Error moving email:", err);
      toast.error("Failed to move email");
    }
  };

  const resetComposeForm = () => {
    setComposeTo("");
    setComposeCc("");
    setComposeSubject("");
    setComposeBody("");
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    setComposeTo(selectedEmail.from.replace(/<|>/g, "").split(" ").pop() || selectedEmail.from);
    setComposeSubject(`Re: ${selectedEmail.subject.replace(/^Re:\s*/i, "")}`);
    setComposeBody(`\n\n--- Original Message ---\nFrom: ${selectedEmail.from}\nDate: ${format(new Date(selectedEmail.date), "PPpp")}\n\n${selectedEmail.body}`);
    setComposeOpen(true);
  };

  const handleForward = () => {
    if (!selectedEmail) return;
    setComposeTo("");
    setComposeSubject(`Fwd: ${selectedEmail.subject.replace(/^Fwd:\s*/i, "")}`);
    setComposeBody(`\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.from}\nDate: ${format(new Date(selectedEmail.date), "PPpp")}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`);
    setComposeOpen(true);
  };

  const unreadCount = emails.filter((e) => !e.seen).length;

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-blue-500" />
            Email
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={() => setComposeOpen(true)}
            >
              <PenSquare className="h-4 w-4 mr-1" />
              Compose
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                fetchFolders();
                fetchEmails(selectedFolder);
              }}
              disabled={loading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">info@everydriver.co.uk</p>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="flex h-full">
          {/* Folder sidebar */}
          <div className="w-40 border-r p-2 shrink-0">
            <ScrollArea className="h-full">
              <div className="space-y-0.5">
                {folders.map((folder) => (
                  <button
                    key={folder.path}
                    onClick={() => setSelectedFolder(folder.path)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
                      selectedFolder === folder.path
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {FOLDER_ICONS[folder.name] || <FolderOpen className="h-4 w-4" />}
                    <span className="flex-1 truncate">{folder.name}</span>
                    {folder.unseen > 0 && (
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                        {folder.unseen}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Email list / Email view */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedEmail ? (
              // Email view
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 p-2 border-b shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEmail(null)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" onClick={handleReply}>
                    <Reply className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleForward}>
                    <Forward className="h-4 w-4 mr-1" />
                    Forward
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEmail(selectedEmail)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {loadingEmail ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {selectedEmail.subject}
                        </h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          <p>From: {selectedEmail.from}</p>
                          <p>To: {selectedEmail.to}</p>
                          <p>
                            Date:{" "}
                            {format(new Date(selectedEmail.date), "PPpp")}
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="whitespace-pre-wrap text-sm">
                        {selectedEmail.body || "(No content)"}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              // Email list
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : emails.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No emails in this folder
                  </p>
                ) : (
                  <div className="divide-y">
                    {emails.map((email) => (
                      <button
                        key={email.id}
                        onClick={() => openEmail(email)}
                        className={cn(
                          "w-full text-left p-3 hover:bg-muted/50 transition-all",
                          !email.seen 
                            ? "bg-emerald-500/10 border-l-4 border-l-emerald-500" 
                            : "border-l-4 border-l-transparent"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-sm truncate",
                                  !email.seen && "font-bold text-emerald-600"
                                )}
                              >
                                {selectedFolder.toLowerCase().includes("sent") 
                                  ? `To: ${email.to || "Unknown"}`
                                  : (email.from.split("<")[0].trim() || email.from)}
                              </span>
                              {!email.seen && (
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                              )}
                            </div>
                            <p
                              className={cn(
                                "text-sm truncate",
                                !email.seen
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {email.subject}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {email.body?.substring(0, 80)}...
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            {formatDistanceToNow(new Date(email.date), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
        </div>
      </CardContent>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenSquare className="h-5 w-5" />
              Compose Email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
              <Label>To:</Label>
              <Input
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
              <Label>Cc:</Label>
              <Input
                value={composeCc}
                onChange={(e) => setComposeCc(e.target.value)}
                placeholder="cc@example.com (optional)"
              />
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
              <Label>Subject:</Label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your message..."
                className="min-h-[200px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setComposeOpen(false);
                resetComposeForm();
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={sendEmail} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
