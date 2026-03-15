import { useState } from "react";
import { Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Props {
  instructorId: string;
  instructorName: string;
}

export function WaitlistJoinCard({ instructorId, instructorName }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    if (!phone.trim() && !email.trim()) { toast.error("Please enter phone or email"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("waitlist_entries").insert({
        instructor_id: instructorId,
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        preferred_days: selectedDays,
      } as any);
      if (error) throw error;
      setSubmitted(true);
      toast.success("You've been added to the waiting list!");
    } catch {
      toast.error("Failed to join waiting list");
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center space-y-2">
          <Clock className="h-8 w-8 text-primary mx-auto" />
          <h3 className="font-semibold">You're on the list!</h3>
          <p className="text-sm text-muted-foreground">{instructorName} will contact you when a slot opens up.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          Join Waiting List
        </CardTitle>
        <CardDescription>{instructorName} is currently fully booked. Join the waiting list to be notified when a slot opens.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Your Name *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Preferred Days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleDay(day)}>
                <Checkbox checked={selectedDays.includes(day)} />
                <span className="text-xs">{day}</span>
              </div>
            ))}
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="w-full gap-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Join Waiting List
        </Button>
      </CardContent>
    </Card>
  );
}
