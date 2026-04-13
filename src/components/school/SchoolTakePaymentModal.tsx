import { useState } from "react";
import { PoundSterling, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { useToast } from "@/hooks/use-toast";
import { demoSchoolInstructors, demoSchoolPupils } from "@/data/demoSchoolData";

interface Props {
  open: boolean;
  onClose: () => void;
  instructorIds: string[];
}

export default function SchoolTakePaymentModal({ open, onClose, instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pupilId: "",
    instructorId: "",
    amount: "",
    method: "Card",
    notes: "",
  });

  const instructors = isDemo
    ? demoSchoolInstructors.map(i => ({ id: i.instructor_id, name: i.instructors.name }))
    : [];

  const pupils = isDemo ? demoSchoolPupils : [];

  const filteredPupils = form.instructorId
    ? pupils.filter(p => p.instructor_id === form.instructorId)
    : pupils;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pupilId || !form.amount || !form.instructorId) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);

    if (isDemo) {
      await new Promise(r => setTimeout(r, 800));
      toast({ title: "Demo mode", description: "Payment recorded (demo — no changes saved)." });
    } else {
      toast({ title: "Payment recorded", description: `£${form.amount} payment received.` });
    }

    setSaving(false);
    setForm({ pupilId: "", instructorId: "", amount: "", method: "Card", notes: "" });
    onClose();
  };

  const selectedPupil = pupils.find(p => p.id === form.pupilId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-primary" />
            Take a Payment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Instructor *</Label>
            <Select value={form.instructorId} onValueChange={v => setForm(f => ({ ...f, instructorId: v, pupilId: "" }))}>
              <SelectTrigger><SelectValue placeholder="Select instructor" /></SelectTrigger>
              <SelectContent>
                {instructors.map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pupil *</Label>
            <Select value={form.pupilId} onValueChange={v => setForm(f => ({ ...f, pupilId: v }))}>
              <SelectTrigger><SelectValue placeholder={form.instructorId ? "Select pupil" : "Select instructor first"} /></SelectTrigger>
              <SelectContent>
                {filteredPupils.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount (£) *</Label>
              <Input
                type="number"
                min="0.50"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Payment Link">Payment Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Payment reference or notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
