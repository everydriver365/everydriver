import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Copy, Check, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { QuickAddPupilButton, type QuickAddedPupil } from "@/components/instructor/pupils/QuickAddPupilButton";

interface InstructorOption {
  id: string;
  name: string | null;
}
interface PupilOption {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  postcode: string | null;
}

interface Props {
  scope: "admin" | "instructor";
  instructorId?: string | null; // pre-set when scope === "instructor"
  onCreated?: () => void;
}

export function CreateQuoteDialog({ scope, instructorId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [pupils, setPupils] = useState<PupilOption[]>([]);

  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(
    scope === "instructor" ? instructorId ?? null : null
  );
  const [pupilId, setPupilId] = useState<string>("none");
  const [form, setForm] = useState({
    pupil_name: "",
    email: "",
    phone: "",
    postcode: "",
    course_type: "",
    package_details: "",
    total_hours: "" as number | "",
    price: "" as number | "",
    deposit_amount: "" as number | "",
    schedule_notes: "",
    expires_days: 7,
  });


  useEffect(() => {
    if (!open) return;
    (async () => {
      if (scope === "admin") {
        const { data } = await supabase
          .from("instructors")
          .select("id, name")
          .eq("is_network_placeholder", false)
          .order("name", { ascending: true })
          .limit(1000);
        setInstructors((data as InstructorOption[]) || []);
      }
      const targetInstructor =
        scope === "instructor" ? instructorId ?? null : selectedInstructorId;
      if (targetInstructor) {
        const { data } = await supabase
          .from("pupils")
          .select("id, name, email, phone, postcode")
          .eq("instructor_id", targetInstructor)
          .eq("status", "active")
          .is("deleted_at", null)
          .order("name", { ascending: true })
          .limit(500);
        setPupils((data as PupilOption[]) || []);
      } else {
        setPupils([]);
      }
    })();
  }, [open, scope, instructorId, selectedInstructorId]);

  const reset = () => {
    setLink(null);
    setPupilId("none");
    setForm({
      pupil_name: "",
      email: "",
      phone: "",
      postcode: "",
      course_type: "",
      package_details: "",
      total_hours: "",
      price: "",
      deposit_amount: "",
      schedule_notes: "",
      expires_days: 7,
    });

    if (scope === "admin") setSelectedInstructorId(null);
  };

  const update = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onPickPupil = (id: string) => {
    setPupilId(id);
    if (id === "none") return;
    const p = pupils.find((x) => x.id === id);
    if (!p) return;
    setForm((f) => ({
      ...f,
      pupil_name: p.name || f.pupil_name,
      email: p.email || f.email,
      phone: p.phone || f.phone,
      postcode: p.postcode || f.postcode,
    }));
  };

  const issuerInstructorId =
    scope === "instructor" ? instructorId ?? null : selectedInstructorId;

  const canSubmit = useMemo(() => {
    return (
      !!issuerInstructorId &&
      form.pupil_name.trim().length > 0 &&
      Number(form.price) > 0
    );
  }, [issuerInstructorId, form.pupil_name, form.price]);

  const submit = async () => {
    if (!issuerInstructorId) {
      toast.error("Pick an instructor");
      return;
    }
    if (!form.pupil_name || !form.price) {
      toast.error("Pupil name and price are required");
      return;
    }
    setSubmitting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(form.expires_days || 7));

      const { data, error } = await supabase
        .from("quotes")
        .insert({
          instructor_id: issuerInstructorId,
          pupil_name: form.pupil_name,
          email: form.email || null,
          phone: form.phone || null,
          postcode: form.postcode || null,
          course_type: form.course_type || null,
          package_details: form.package_details || null,
          total_hours: form.total_hours || null,
          price: form.price,
          deposit_amount: form.deposit_amount || null,
          schedule_notes: form.schedule_notes || null,
          expires_at: expiresAt.toISOString(),
        })
        .select("token")
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/quote/${data.token}`;
      setLink(url);
      toast.success("Quote created. Share the link with your pupil.");
      onCreated?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to create quote");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> New quote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{link ? "Quote ready" : "Send a quote"}</DialogTitle>
          <DialogDescription>
            {link
              ? "Share this secure link with your pupil. They can review and accept it online."
              : "Create a bookable price estimate and send the link to the pupil."}
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-3">
            <div className="rounded-2xl border bg-muted p-4 space-y-3">
              <div className="flex gap-2">
                <Input value={link} readOnly className="text-xs" />
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Expires in {form.expires_days} days.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Create another
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            {scope === "admin" && (
              <div className="space-y-1.5">
                <Label>Instructor *</Label>
                <Select
                  value={selectedInstructorId ?? ""}
                  onValueChange={(v) => setSelectedInstructorId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name || i.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {issuerInstructorId && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Existing pupil (optional)</Label>
                  <QuickAddPupilButton
                    instructorId={issuerInstructorId}
                    onCreated={(p: QuickAddedPupil) => {
                      setPupils((arr) => [p, ...arr]);
                      setPupilId(p.id);
                      setForm((f) => ({
                        ...f,
                        pupil_name: p.name || f.pupil_name,
                        email: p.email || f.email,
                        phone: p.phone || f.phone,
                        postcode: p.postcode || f.postcode,
                      }));
                    }}
                  />
                </div>
                <Select value={pupilId} onValueChange={onPickPupil}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— none —</SelectItem>
                    {pupils.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name || p.email || p.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Pupil name *</Label>
              <Input
                value={form.pupil_name}
                onChange={(e) => update("pupil_name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Postcode</Label>
                <Input
                  value={form.postcode}
                  onChange={(e) => update("postcode", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Course type</Label>
                <Input
                  value={form.course_type}
                  onChange={(e) => update("course_type", e.target.value)}
                  placeholder="e.g. Intensive"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label>Hours</Label>
                <Input
                  type="number"
                  value={form.total_hours}
                  onChange={(e) => update("total_hours", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price (£) *</Label>
                <Input
                  type="number"
                  value={form.price}
                  placeholder="0.00"
                  onChange={(e) => update("price", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deposit (£)</Label>
                <Input
                  type="number"
                  value={form.deposit_amount}
                  onChange={(e) => update("deposit_amount", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expires (days)</Label>
                <Input
                  type="number"
                  value={form.expires_days}
                  onChange={(e) => update("expires_days", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Package details</Label>
              <Textarea
                rows={2}
                value={form.package_details}
                onChange={(e) => update("package_details", e.target.value)}
                placeholder="What's included…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Schedule notes</Label>
              <Textarea
                rows={2}
                value={form.schedule_notes}
                onChange={(e) => update("schedule_notes", e.target.value)}
                placeholder="Suggested times…"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!canSubmit || submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                Create quote
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
