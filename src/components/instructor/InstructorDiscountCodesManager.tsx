import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Plus, Copy, Trash2, Edit2, Share2, MessageSquare, Dices, Loader2 } from "lucide-react";

interface DiscountCode {
  id: string;
  instructor_id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  applies_to: string | null;
  min_purchase_amount: number | null;
  max_uses: number | null;
  times_used: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean | null;
  created_at: string;
}

interface Props {
  instructorId: string;
}

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const getStatus = (code: DiscountCode) => {
  if (!code.is_active) return { label: "Inactive", variant: "secondary" as const };
  if (code.valid_until && new Date(code.valid_until) < new Date()) return { label: "Expired", variant: "destructive" as const };
  if (code.max_uses && (code.times_used ?? 0) >= code.max_uses) return { label: "Maxed Out", variant: "outline" as const };
  return { label: "Active", variant: "default" as const };
};

export function InstructorDiscountCodesManager({ instructorId }: Props) {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    applies_to: "all",
    min_purchase_amount: 0,
    max_uses: null as number | null,
    valid_from: "",
    valid_until: "",
  });

  const fetchCodes = async () => {
    const { data } = await supabase
      .from("instructor_discount_codes")
      .select("*")
      .eq("instructor_id", instructorId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (data) setCodes(data);
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, [instructorId]);

  const resetForm = () => {
    setForm({ code: "", description: "", discount_type: "percentage", discount_value: 10, applies_to: "all", min_purchase_amount: 0, max_uses: null, valid_from: "", valid_until: "" });
    setEditingCode(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (c: DiscountCode) => {
    setEditingCode(c);
    setForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      applies_to: c.applies_to || "all",
      min_purchase_amount: c.min_purchase_amount ?? 0,
      max_uses: c.max_uses,
      valid_from: c.valid_from ? c.valid_from.slice(0, 16) : "",
      valid_until: c.valid_until ? c.valid_until.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast({ title: "Code is required", variant: "destructive" }); return; }
    if (form.discount_value <= 0) { toast({ title: "Value must be positive", variant: "destructive" }); return; }
    setSaving(true);

    const payload = {
      instructor_id: instructorId,
      code: form.code.toUpperCase().trim(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      applies_to: form.applies_to,
      min_purchase_amount: form.min_purchase_amount || 0,
      max_uses: form.max_uses || null,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
    };

    let error;
    if (editingCode) {
      ({ error } = await supabase.from("instructor_discount_codes").update(payload).eq("id", editingCode.id));
    } else {
      ({ error } = await supabase.from("instructor_discount_codes").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingCode ? "Code updated" : "Code created" });
      setDialogOpen(false);
      resetForm();
      fetchCodes();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("instructor_discount_codes").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", deleteId);
    setDeleteId(null);
    fetchCodes();
    toast({ title: "Code deleted" });
  };

  const toggleActive = async (c: DiscountCode) => {
    await supabase.from("instructor_discount_codes").update({ is_active: !c.is_active }).eq("id", c.id);
    fetchCodes();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `${code} copied to clipboard` });
  };

  const copyShareMessage = (c: DiscountCode) => {
    const msg = c.discount_type === "percentage"
      ? `Use code ${c.code} for ${c.discount_value}% off!`
      : `Use code ${c.code} for £${c.discount_value} off!`;
    navigator.clipboard.writeText(msg);
    toast({ title: "Share message copied!", description: "Paste into SMS or chat" });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{codes.length} discount code{codes.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Create Code</Button>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No discount codes yet. Create one to share with your pupils!
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => {
            const status = getStatus(c);
            return (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm">{c.code}</span>
                        <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {c.discount_type === "percentage" ? `${c.discount_value}% off` : `£${c.discount_value} off`}
                        {c.description ? ` · ${c.description}` : ""}
                        {c.times_used ? ` · Used ${c.times_used}x` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyCode(c.code)} title="Copy code">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyShareMessage(c)} title="Copy share message">
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(c.id)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit Discount Code" : "Create Discount Code"}</DialogTitle>
            <DialogDescription>Set up a promo code to share with pupils.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Code</Label>
              <div className="flex gap-2">
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER25" className="font-mono" />
                <Button variant="outline" size="icon" onClick={() => setForm({ ...form, code: generateCode() })} title="Generate random code">
                  <Dices className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description (optional)</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Summer promotion" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Value</Label>
                <Input type="number" min={1} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Applies to</Label>
              <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="courses">Courses only</SelectItem>
                  <SelectItem value="lessons">Lessons only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min spend (£)</Label>
                <Input type="number" min={0} value={form.min_purchase_amount} onChange={(e) => setForm({ ...form, min_purchase_amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max uses</Label>
                <Input type="number" min={1} value={form.max_uses ?? ""} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })} placeholder="Unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Valid from</Label>
                <Input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valid until</Label>
                <Input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingCode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete discount code?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
