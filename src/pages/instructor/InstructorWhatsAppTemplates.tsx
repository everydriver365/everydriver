import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function InstructorWhatsAppTemplates() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const { templates, isLoading, createTemplate } = useWhatsAppTemplates(instructor?.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("utility");
  const [bodyText, setBodyText] = useState("");

  const handleCreate = () => {
    if (!name.trim() || !bodyText.trim()) {
      toast.error("Name and body required");
      return;
    }
    createTemplate.mutate({ name, category, body_text: bodyText, language: "en_GB" }, {
      onSuccess: () => {
        toast.success("Template submitted for approval");
        setOpen(false);
        setName(""); setBodyText(""); setCategory("utility");
      },
      onError: (e: any) => toast.error(e.message),
    });
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (s === "rejected") return "bg-red-500/10 text-red-700 dark:text-red-400";
    return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/instructor/settings/whatsapp")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Message Templates</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />New</Button>
      </header>

      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
        {!isLoading && templates.length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">No templates yet</p>
            <p className="text-sm text-muted-foreground mb-4">Templates let you send messages outside the 24-hour window — required by Meta for reminders & confirmations.</p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Create your first template</Button>
          </Card>
        )}
        {templates.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{t.category} · {t.language}</p>
              </div>
              <Badge className={statusColor(t.status)}>{t.status}</Badge>
            </div>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground bg-muted/30 rounded p-2">{t.body_text}</p>
            {t.rejection_reason && (
              <p className="text-xs text-destructive mt-2">Rejected: {t.rejection_reason}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">Created {format(new Date(t.created_at), "d MMM yyyy")}</p>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name (lowercase, no spaces)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "_"))} placeholder="lesson_reminder_24h" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="utility">Utility (reminders, confirmations)</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="authentication">Authentication (OTP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Hi {{1}}, your driving lesson is at {{2}} tomorrow. Reply STOP to opt out."
                rows={4}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Use {"{{1}}"}, {"{{2}}"} etc. for variables.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createTemplate.isPending}>
              {createTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
