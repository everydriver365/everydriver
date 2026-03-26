import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
import { PoundSterling, CheckCircle, Clock, User, Loader2, Send, ChevronDown, ChevronRight, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingPayment {
  id: string;
  amount: number;
  payment_method: string;
  recorded_at: string;
  notes: string | null;
  instructor_id: string;
  instructor_name: string;
  pupil_name: string;
}

interface CompletedPayout {
  id: string;
  instructor_id: string;
  amount: number;
  payment_ids: string[];
  notes: string | null;
  transferred_at: string;
  created_at: string;
  instructor_name: string;
}

export function AdminInstructorPayouts() {
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [payouts, setPayouts] = useState<CompletedPayout[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [transferNotes, setTransferNotes] = useState("");
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    const { data, error } = await supabase
      .from("payment_history")
      .select("id, amount, payment_method, recorded_at, notes, instructor_id, pupils(name), instructors:instructor_id(name)")
      .eq("payout_status", "pending")
      .is("deleted_at", null)
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending payments:", error);
      return;
    }

    setPending((data || []).map((p: any) => ({
      id: p.id,
      amount: p.amount,
      payment_method: p.payment_method,
      recorded_at: p.recorded_at,
      notes: p.notes,
      instructor_id: p.instructor_id,
      instructor_name: p.instructors?.name || "Unknown",
      pupil_name: p.pupils?.name || "Unknown",
    })));
  }, []);

  const fetchPayouts = useCallback(async () => {
    const { data, error } = await supabase
      .from("instructor_payouts")
      .select("id, instructor_id, amount, payment_ids, notes, transferred_at, created_at, instructors:instructor_id(name)")
      .order("transferred_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching payouts:", error);
      return;
    }

    setPayouts((data || []).map((p: any) => ({
      ...p,
      instructor_name: p.instructors?.name || "Unknown",
    })));
  }, []);

  useEffect(() => {
    Promise.all([fetchPending(), fetchPayouts()]).finally(() => setLoading(false));

    const channel = supabase
      .channel("admin-payouts")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_history" }, () => fetchPending())
      .on("postgres_changes", { event: "*", schema: "public", table: "instructor_payouts" }, () => fetchPayouts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPending, fetchPayouts]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllForInstructor = (instructorId: string) => {
    const ids = pending.filter(p => p.instructor_id === instructorId).map(p => p.id);
    setSelected(prev => {
      const next = new Set(prev);
      const allSelected = ids.every(id => next.has(id));
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const handleTransfer = async () => {
    if (selected.size === 0) return;
    setTransferring(true);

    try {
      const selectedPayments = pending.filter(p => selected.has(p.id));
      
      // Group by instructor
      const byInstructor = selectedPayments.reduce((acc, p) => {
        if (!acc[p.instructor_id]) acc[p.instructor_id] = [];
        acc[p.instructor_id].push(p);
        return acc;
      }, {} as Record<string, PendingPayment[]>);

      for (const [instructorId, payments] of Object.entries(byInstructor)) {
        const total = payments.reduce((s, p) => s + Number(p.amount), 0);
        const paymentIds = payments.map(p => p.id);

        // Create payout record
        const { error: payoutError } = await supabase
          .from("instructor_payouts")
          .insert({
            instructor_id: instructorId,
            amount: total,
            payment_ids: paymentIds,
            notes: transferNotes || null,
          });

        if (payoutError) throw payoutError;

        // Update payment_history records
        const { error: updateError } = await supabase
          .from("payment_history")
          .update({ payout_status: "transferred", transferred_at: new Date().toISOString() })
          .in("id", paymentIds);

        if (updateError) throw updateError;
      }

      toast.success(`${selected.size} payment(s) marked as transferred`);
      setSelected(new Set());
      setTransferNotes("");
      setConfirmOpen(false);
      fetchPending();
      fetchPayouts();
    } catch (error) {
      console.error("Error transferring:", error);
      toast.error("Failed to mark payments as transferred");
    } finally {
      setTransferring(false);
    }
  };

  // Group pending by instructor
  const groupedPending = pending.reduce((acc, p) => {
    if (!acc[p.instructor_id]) acc[p.instructor_id] = { name: p.instructor_name, payments: [] };
    acc[p.instructor_id].payments.push(p);
    return acc;
  }, {} as Record<string, { name: string; payments: PendingPayment[] }>);

  const selectedTotal = pending.filter(p => selected.has(p.id)).reduce((s, p) => s + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PoundSterling className="h-5 w-5 text-primary" />
          Instructor Payouts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              Pending
              {pending.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex-1">
              Paid
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-4">
            {selected.size > 0 && (
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3">
                <span className="text-sm font-medium">
                  {selected.size} payment(s) selected — £{selectedTotal.toFixed(2)}
                </span>
                <Button size="sm" onClick={() => setConfirmOpen(true)}>
                  <Send className="h-4 w-4 mr-1.5" />
                  Mark as Transferred
                </Button>
              </div>
            )}

            {Object.keys(groupedPending).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">All payments have been transferred</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {Object.entries(groupedPending).map(([instructorId, group]) => {
                    const groupTotal = group.payments.reduce((s, p) => s + Number(p.amount), 0);
                    const allSelected = group.payments.every(p => selected.has(p.id));
                    return (
                      <div key={instructorId} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => selectAllForInstructor(instructorId)}
                          className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={allSelected} />
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{group.name}</span>
                            <Badge variant="outline" className="text-xs">{group.payments.length}</Badge>
                          </div>
                          <span className="font-semibold text-sm">£{groupTotal.toFixed(2)}</span>
                        </button>
                        <div className="divide-y">
                          {group.payments.map(payment => (
                            <label
                              key={payment.id}
                              className="flex items-center justify-between p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={selected.has(payment.id)}
                                  onCheckedChange={() => toggleSelect(payment.id)}
                                />
                                <div>
                                  <div className="text-sm font-medium">£{Number(payment.amount).toFixed(2)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    from {payment.pupil_name} • {format(new Date(payment.recorded_at), "dd MMM yyyy, HH:mm")}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs capitalize border-amber-500/30 bg-amber-500/10 text-amber-600">
                                <Clock className="h-3 w-3 mr-1" />
                                {payment.payment_method}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="paid" className="mt-4">
            {payouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PoundSterling className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No completed payouts yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {payouts.map(payout => (
                    <div key={payout.id} className="border rounded-lg">
                      <button
                        onClick={() => setExpandedPayout(expandedPayout === payout.id ? null : payout.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedPayout === payout.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                            <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">{payout.instructor_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(payout.transferred_at), "dd MMM yyyy, HH:mm")} • {payout.payment_ids.length} payment(s)
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-600">£{Number(payout.amount).toFixed(2)}</span>
                          {payout.notes?.includes("Auto-paid via Square") ? (
                            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto-paid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          )}
                        </div>
                      </button>
                      {expandedPayout === payout.id && (
                        <div className="border-t p-3 bg-muted/30 text-xs text-muted-foreground space-y-1">
                          <p><strong>Payment IDs:</strong> {payout.payment_ids.length} records</p>
                          {payout.notes && <p><strong>Notes:</strong> {payout.notes}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Transfer</AlertDialogTitle>
              <AlertDialogDescription>
                Mark {selected.size} payment(s) totalling £{selectedTotal.toFixed(2)} as transferred to instructor(s)?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Optional notes (e.g. bank transfer ref)..."
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              rows={2}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleTransfer} disabled={transferring}>
                {transferring ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                Confirm Transfer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
