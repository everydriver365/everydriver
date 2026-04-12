import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { PipelineLead } from "./LeadCard";

const STAGES = [
  { value: "new_lead", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "booked", label: "Booked" },
  { value: "active", label: "Active" },
  { value: "test_passed", label: "Test Passed" },
  { value: "lost", label: "Lost" },
];

interface AddLeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<PipelineLead>) => Promise<void>;
  editLead?: PipelineLead | null;
}

export function AddLeadSheet({ open, onOpenChange, onSubmit, editLead }: AddLeadSheetProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(editLead?.name || "");
  const [phone, setPhone] = useState(editLead?.phone || "");
  const [email, setEmail] = useState(editLead?.email || "");
  const [postcode, setPostcode] = useState(editLead?.postcode || "");
  const [courseType, setCourseType] = useState(editLead?.course_type || "");
  const [notes, setNotes] = useState(editLead?.notes || "");
  const [stage, setStage] = useState(editLead?.stage || "new_lead");

  // Reset form when editLead changes
  useState(() => {
    if (editLead) {
      setName(editLead.name);
      setPhone(editLead.phone || "");
      setEmail(editLead.email || "");
      setPostcode(editLead.postcode || "");
      setCourseType(editLead.course_type || "");
      setNotes(editLead.notes || "");
      setStage(editLead.stage);
    } else {
      setName(""); setPhone(""); setEmail(""); setPostcode("");
      setCourseType(""); setNotes(""); setStage("new_lead");
    }
  });

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        ...(editLead ? { id: editLead.id } : {}),
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        postcode: postcode.trim() || null,
        course_type: courseType.trim() || null,
        notes: notes.trim() || null,
        stage,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-2xl">
        <SheetHeader>
          <SheetTitle>{editLead ? "Edit Lead" : "Add New Lead"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07..." type="tel" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@..." type="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Postcode</Label>
              <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SW1A 1AA" />
            </div>
            <div>
              <Label>Course Type</Label>
              <Input value={courseType} onChange={(e) => setCourseType(e.target.value)} placeholder="e.g. Manual, Intensive" />
            </div>
          </div>
          <div>
            <Label>Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={saving || !name.trim()} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editLead ? "Save Changes" : "Add Lead"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
