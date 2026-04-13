import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { PoundSterling, Plus, CheckCircle, AlertTriangle, XCircle, Gift, Loader2, Zap } from "lucide-react";
import { format } from "date-fns";

interface School {
  id: string;
  name: string;
  franchise_fee_amount: number | null;
}

interface FeeRecord {
  id: string;
  school_id: string;
  instructor_id: string;
  period_start: string;
  period_end: string;
  amount: number;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  instructors?: { name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  paid: { label: "Paid", variant: "default", icon: CheckCircle },
  late: { label: "Late", variant: "destructive", icon: AlertTriangle },
  not_paid: { label: "Not Paid", variant: "outline", icon: XCircle },
  free: { label: "Free", variant: "secondary", icon: Gift },
};

export function AdminSchoolFranchiseFees() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);

  // Add fee form state
  const [newFee, setNewFee] = useState({ instructor_id: "", period_start: "", period_end: "", amount: "", notes: "" });
  const [bulkMonth, setBulkMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("schools").select("id, name, franchise_fee_amount").then(({ data }) => {
      if (data) setSchools(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedSchoolId) return;
    setLoading(true);
    // Fetch fees
    supabase
      .from("school_franchise_fees")
      .select("*, instructors(name)")
      .eq("school_id", selectedSchoolId)
      .order("period_start", { ascending: false })
      .then(({ data }) => {
        setFees((data as unknown as FeeRecord[]) || []);
        setLoading(false);
      });
    // Fetch school instructors
    supabase
      .from("school_instructors")
      .select("instructor_id, instructors(id, name)")
      .eq("school_id", selectedSchoolId)
      .then(({ data }) => {
        if (data) {
          setInstructors(data.map((si: any) => ({ id: si.instructor_id, name: si.instructors?.name || "Unknown" })));
        }
      });
  }, [selectedSchoolId]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return fees;
    return fees.filter(f => f.status === statusFilter);
  }, [fees, statusFilter]);

  const summary = useMemo(() => {
    const totalDue = fees.filter(f => f.status !== "free").reduce((s, f) => s + Number(f.amount), 0);
    const totalPaid = fees.filter(f => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
    const overdue = fees.filter(f => f.status === "late").length;
    const unpaid = fees.filter(f => f.status === "not_paid").length;
    return { totalDue, totalPaid, overdue, unpaid };
  }, [fees]);

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);

  const handleAddFee = async () => {
    if (!newFee.instructor_id || !newFee.period_start || !newFee.period_end || !newFee.amount) {
      toast.error("Fill all required fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("school_franchise_fees").insert({
      school_id: selectedSchoolId,
      instructor_id: newFee.instructor_id,
      period_start: newFee.period_start,
      period_end: newFee.period_end,
      amount: parseFloat(newFee.amount),
      notes: newFee.notes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Fee added");
    setAddOpen(false);
    setNewFee({ instructor_id: "", period_start: "", period_end: "", amount: "", notes: "" });
    refreshFees();
  };

  const handleBulkGenerate = async () => {
    if (!bulkMonth || instructors.length === 0) return;
    const [year, month] = bulkMonth.split("-").map(Number);
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
    const amount = selectedSchool?.franchise_fee_amount || 0;

    setSaving(true);
    const rows = instructors.map(i => ({
      school_id: selectedSchoolId,
      instructor_id: i.id,
      period_start: start,
      period_end: end,
      amount,
    }));
    const { error } = await supabase.from("school_franchise_fees").insert(rows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Generated ${rows.length} fee records`);
    setBulkOpen(false);
    refreshFees();
  };

  const updateStatus = async (id: string, status: string, paidAt?: string) => {
    const update: any = { status };
    if (status === "paid") update.paid_at = paidAt || new Date().toISOString();
    if (status === "free") update.amount = 0;
    const { error } = await supabase.from("school_franchise_fees").update(update).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status updated to ${STATUS_CONFIG[status]?.label}`);
    refreshFees();
  };

  const refreshFees = () => {
    supabase
      .from("school_franchise_fees")
      .select("*, instructors(name)")
      .eq("school_id", selectedSchoolId)
      .order("period_start", { ascending: false })
      .then(({ data }) => setFees((data as unknown as FeeRecord[]) || []));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Select a school" />
          </SelectTrigger>
          <SelectContent>
            {schools.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSchoolId && (
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
              <Zap className="h-4 w-4 mr-1" /> Bulk Generate
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Fee
            </Button>
          </div>
        )}
      </div>

      {selectedSchoolId && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Due</p>
                <p className="text-2xl font-bold">£{summary.totalDue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">£{summary.totalPaid.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{summary.overdue}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Unpaid</p>
                <p className="text-2xl font-bold text-amber-600">{summary.unpaid}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm">Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="not_paid">Not Paid</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No fee records found</TableCell></TableRow>
                    ) : filtered.map(fee => {
                      const cfg = STATUS_CONFIG[fee.status] || STATUS_CONFIG.not_paid;
                      const Icon = cfg.icon;
                      return (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{(fee.instructors as any)?.name || "—"}</TableCell>
                          <TableCell className="text-sm">{format(new Date(fee.period_start), "MMM yyyy")}</TableCell>
                          <TableCell>£{Number(fee.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={cfg.variant} className="gap-1">
                              <Icon className="h-3 w-3" /> {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{fee.paid_at ? format(new Date(fee.paid_at), "dd MMM yyyy") : "—"}</TableCell>
                          <TableCell className="text-sm capitalize">{fee.payment_method || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              {fee.status !== "paid" && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus(fee.id, "paid")}>
                                  Mark Paid
                                </Button>
                              )}
                              {fee.status !== "free" && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus(fee.id, "free")}>
                                  Mark Free
                                </Button>
                              )}
                              {fee.status === "not_paid" && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => updateStatus(fee.id, "late")}>
                                  Mark Late
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Fee Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Franchise Fee</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Instructor</Label>
              <Select value={newFee.instructor_id} onValueChange={v => setNewFee(p => ({ ...p, instructor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select instructor" /></SelectTrigger>
                <SelectContent>
                  {instructors.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Period Start</Label><Input type="date" value={newFee.period_start} onChange={e => setNewFee(p => ({ ...p, period_start: e.target.value }))} /></div>
              <div><Label>Period End</Label><Input type="date" value={newFee.period_end} onChange={e => setNewFee(p => ({ ...p, period_end: e.target.value }))} /></div>
            </div>
            <div><Label>Amount (£)</Label><Input type="number" step="0.01" value={newFee.amount} onChange={e => setNewFee(p => ({ ...p, amount: e.target.value }))} placeholder={selectedSchool?.franchise_fee_amount?.toString() || "0"} /></div>
            <div><Label>Notes</Label><Textarea value={newFee.notes} onChange={e => setNewFee(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFee} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Fee"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Generate Fees</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Generate fee records for all {instructors.length} instructor(s) in this school for a given month.
            Default amount: £{selectedSchool?.franchise_fee_amount?.toFixed(2) || "0.00"}
          </p>
          <div><Label>Month</Label><Input type="month" value={bulkMonth} onChange={e => setBulkMonth(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkGenerate} disabled={saving || instructors.length === 0}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Generate ${instructors.length} Records`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
