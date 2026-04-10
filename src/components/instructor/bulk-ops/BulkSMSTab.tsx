import { useState, useEffect } from "react";
import { Send, Loader2, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pupil {
  id: string;
  name: string;
  phone: string | null;
  test_date: string | null;
  account_balance: number | null;
}

const TEMPLATES = [
  { label: "Holiday Notice", text: "Hi! Just a reminder that I'm on holiday from [DATE] to [DATE]. I'll be in touch when I'm back to reschedule any lessons. Thanks!" },
  { label: "Schedule Change", text: "Hi! Due to unforeseen circumstances, I need to make some changes to our upcoming lessons. Please check your schedule and let me know if the new times work for you." },
  { label: "Test Reminder", text: "Hi! Just a friendly reminder about your upcoming driving test. Make sure to get a good night's sleep and arrive early. You've got this! 🚗" },
  { label: "Payment Reminder", text: "Hi! This is a friendly reminder about your outstanding lesson balance. Please settle when you can. Thanks!" },
  { label: "Bank Holiday", text: "Hi! Just a heads up — there are no lessons on [DATE] due to the bank holiday. Your next lesson will be as normal the following week. 😊" },
];

interface BulkSMSTabProps {
  instructorId: string | undefined;
}

export function BulkSMSTab({ instructorId }: BulkSMSTabProps) {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedPupils, setSelectedPupils] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (instructorId) fetchPupils();
  }, [instructorId]);

  const fetchPupils = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pupils")
      .select("id, name, phone, test_date, account_balance")
      .eq("instructor_id", instructorId!)
      .is("deleted_at", null)
      .not("phone", "is", null)
      .order("name");
    setPupils(data || []);
    setSelectedPupils((data || []).map(p => p.id));
    setLoading(false);
  };

  const filteredPupils = pupils.filter(p => {
    if (filter === "test-date") return !!p.test_date;
    if (filter === "overdue") return (p.account_balance || 0) < 0;
    return true;
  });

  useEffect(() => {
    setSelectedPupils(filteredPupils.map(p => p.id));
  }, [filter]);

  const togglePupil = (id: string) => {
    setSelectedPupils(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSend = async () => {
    if (!message.trim() || selectedPupils.length === 0) return;
    setSending(true);
    try {
      const recipients = filteredPupils.filter(p => selectedPupils.includes(p.id) && p.phone);
      const results = await Promise.allSettled(
        recipients.map(p => supabase.functions.invoke("send-gap-sms", {
          body: { to: p.phone, message, pupilName: p.name },
        }))
      );
      const ok = results.filter(r => r.status === "fulfilled").length;
      const fail = results.filter(r => r.status === "rejected").length;
      if (ok > 0) toast.success(`Sent to ${ok} pupil${ok > 1 ? "s" : ""}`);
      if (fail > 0) toast.error(`Failed for ${fail} pupil${fail > 1 ? "s" : ""}`);
      setMessage("");
    } catch {
      toast.error("Failed to send messages");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Bulk SMS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map(t => (
            <Button key={t.label} variant="outline" size="sm" className="text-xs" onClick={() => setMessage(t.text)}>
              {t.label}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..." rows={4} />
          <div className="flex items-center justify-between">
            {message.length > 160 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">⚠ {Math.ceil(message.length / 153)} SMS segments — costs more</p>
            )}
            <p className={`text-xs text-right ml-auto ${message.length > 160 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
              {message.length}/{message.length <= 160 ? "160" : `${Math.ceil(message.length / 153) * 153}`} • {message.length <= 160 ? "1" : Math.ceil(message.length / 153)} SMS
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filter Audience
            </Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pupils</SelectItem>
                <SelectItem value="test-date">Has Test Date</SelectItem>
                <SelectItem value="overdue">Overdue Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="border rounded-none max-h-48 overflow-y-auto">
              <div className="flex justify-between p-2 border-b">
                <span className="text-xs text-muted-foreground">{selectedPupils.length}/{filteredPupils.length} selected</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setSelectedPupils(filteredPupils.map(p => p.id))}>All</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setSelectedPupils([])}>None</Button>
                </div>
              </div>
              {filteredPupils.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer" onClick={() => togglePupil(p.id)}>
                  <Checkbox checked={selectedPupils.includes(p.id)} />
                  <span className="flex-1 text-sm">{p.name}</span>
                  {(p.account_balance || 0) < 0 && <span className="text-xs text-destructive">£{Math.abs(p.account_balance || 0)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSend} disabled={sending || !message.trim() || selectedPupils.length === 0} className="w-full gap-2">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send to {selectedPupils.length} Pupil{selectedPupils.length !== 1 ? "s" : ""}
        </Button>
      </CardContent>
    </Card>
  );
}
