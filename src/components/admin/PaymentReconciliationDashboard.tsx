import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { RefreshCw, AlertTriangle, CheckCircle, Search, ArrowUpDown, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PaymentRecord {
  id: string;
  amount: number;
  created_at: string;
  notes: string | null;
  payment_method: string | null;
  pupil_id: string;
  instructor_id: string;
  pupil_name?: string;
  instructor_name?: string;
}

interface PaymentIntent {
  id: string;
  amount_pence: number;
  order_ref: string;
  status: string;
  provider: string;
  created_at: string;
  updated_at: string;
  pupil_id: string | null;
  instructor_id: string | null;
  gateway_response: any;
}

interface ReconciliationItem {
  type: "matched" | "history_only" | "intent_only" | "amount_mismatch";
  payment?: PaymentRecord;
  intent?: PaymentIntent;
  orderRef?: string;
  amountDiff?: number;
}

export function PaymentReconciliationDashboard() {
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("mismatches");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: history }, { data: intents }] = await Promise.all([
        supabase
          .from("payment_history")
          .select("id, amount, created_at, notes, payment_method, pupil_id, instructor_id")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("payment_intents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      if (!history || !intents) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Fetch pupil/instructor names
      const pupilIds = [...new Set([...history.map(h => h.pupil_id), ...intents.filter(i => i.pupil_id).map(i => i.pupil_id!)])];
      const instructorIds = [...new Set([...history.map(h => h.instructor_id), ...intents.filter(i => i.instructor_id).map(i => i.instructor_id!)])];

      const [{ data: pupils }, { data: instructors }] = await Promise.all([
        supabase.from("pupils").select("id, name").in("id", pupilIds.slice(0, 100)),
        supabase.from("instructors").select("id, name").in("id", instructorIds.slice(0, 100)),
      ]);

      const pupilMap = new Map((pupils || []).map(p => [p.id, p.name]));
      const instrMap = new Map((instructors || []).map(i => [i.id, i.name]));

      // Extract order references from payment_history notes
      const extractRef = (notes: string | null): string | null => {
        if (!notes) return null;
        // Match patterns like "Square payment pay_xxx — PUPIL-abc-123" or just order refs
        const match = notes.match(/(?:PUPIL-[A-Za-z0-9]+-\d+|ORD-[A-Za-z0-9-]+|BOOK-[A-Za-z0-9-]+)/);
        return match ? match[0] : null;
      };

      // Build maps by order reference
      const historyByRef = new Map<string, PaymentRecord>();
      const historyUnmatched: PaymentRecord[] = [];

      for (const h of history) {
        const enriched: PaymentRecord = {
          ...h,
          pupil_name: pupilMap.get(h.pupil_id) || "Unknown",
          instructor_name: instrMap.get(h.instructor_id) || "Unknown",
        };
        const ref = extractRef(h.notes);
        if (ref) {
          historyByRef.set(ref, enriched);
        } else {
          historyUnmatched.push(enriched);
        }
      }

      const intentByRef = new Map<string, PaymentIntent>();
      for (const i of intents) {
        intentByRef.set(i.order_ref, i);
      }

      const reconciled: ReconciliationItem[] = [];

      // Match intents to history
      for (const [ref, intent] of intentByRef) {
        const histRecord = historyByRef.get(ref);
        if (histRecord) {
          const intentAmount = intent.amount_pence / 100;
          const diff = Math.abs(histRecord.amount - intentAmount);
          if (diff > 0.01) {
            reconciled.push({
              type: "amount_mismatch",
              payment: histRecord,
              intent,
              orderRef: ref,
              amountDiff: histRecord.amount - intentAmount,
            });
          } else {
            reconciled.push({ type: "matched", payment: histRecord, intent, orderRef: ref });
          }
          historyByRef.delete(ref);
        } else {
          reconciled.push({ type: "intent_only", intent, orderRef: ref });
        }
      }

      // Remaining history with refs but no matching intent
      for (const [ref, h] of historyByRef) {
        reconciled.push({ type: "history_only", payment: h, orderRef: ref });
      }

      // History without any ref (card-method only flagged if recent)
      for (const h of historyUnmatched) {
        if (h.payment_method && ["card", "Apple Pay", "Google Pay"].includes(h.payment_method)) {
          reconciled.push({ type: "history_only", payment: h, orderRef: undefined });
        }
      }

      setItems(reconciled);
    } catch (err) {
      console.error("Reconciliation load error:", err);
      toast.error("Failed to load reconciliation data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(item => {
    if (tab === "mismatches") return item.type === "amount_mismatch";
    if (tab === "unrecorded") return item.type === "intent_only";
    if (tab === "orphaned") return item.type === "history_only";
    if (tab === "matched") return item.type === "matched";
    return true;
  }).filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.orderRef?.toLowerCase().includes(s) ||
      item.payment?.pupil_name?.toLowerCase().includes(s) ||
      item.payment?.instructor_name?.toLowerCase().includes(s) ||
      item.intent?.provider?.toLowerCase().includes(s)
    );
  });

  const counts = {
    mismatches: items.filter(i => i.type === "amount_mismatch").length,
    unrecorded: items.filter(i => i.type === "intent_only").length,
    orphaned: items.filter(i => i.type === "history_only").length,
    matched: items.filter(i => i.type === "matched").length,
  };

  const statusBadge = (type: ReconciliationItem["type"]) => {
    switch (type) {
      case "matched":
        return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge>;
      case "amount_mismatch":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Amount Mismatch</Badge>;
      case "intent_only":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300"><XCircle className="h-3 w-3 mr-1" />No History Record</Badge>;
      case "history_only":
        return <Badge variant="secondary"><ArrowUpDown className="h-3 w-3 mr-1" />No Intent Found</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5 text-primary" />
          Payment Reconciliation
        </CardTitle>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ref, pupil, instructor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4 w-full justify-start overflow-x-auto">
            <TabsTrigger value="mismatches" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Mismatches
              {counts.mismatches > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{counts.mismatches}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="unrecorded" className="gap-1">
              <XCircle className="h-3.5 w-3.5" /> Unrecorded
              {counts.unrecorded > 0 && <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-amber-100 text-amber-800">{counts.unrecorded}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="orphaned" className="gap-1">
              <ArrowUpDown className="h-3.5 w-3.5" /> Orphaned
              {counts.orphaned > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{counts.orphaned}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="matched" className="gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Matched
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{counts.matched}</Badge>
            </TabsTrigger>
          </TabsList>

          {["mismatches", "unrecorded", "orphaned", "matched"].map(tabKey => (
            <TabsContent key={tabKey} value={tabKey}>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading reconciliation data...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {tabKey === "mismatches" ? "✅ No amount mismatches found" :
                   tabKey === "unrecorded" ? "✅ All payment intents have matching history" :
                   tabKey === "orphaned" ? "✅ No orphaned history records" :
                   `${counts.matched} matched transactions`}
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {filtered.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {statusBadge(item.type)}
                          {item.orderRef && (
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-[200px]">{item.orderRef}</code>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {item.payment && (
                            <>
                              <span>History: <strong className="text-foreground">£{item.payment.amount.toFixed(2)}</strong></span>
                              <span>{item.payment.pupil_name}</span>
                              <span className="text-xs">{format(new Date(item.payment.created_at), "dd MMM yyyy HH:mm")}</span>
                            </>
                          )}
                          {item.intent && (
                            <>
                              <span>Intent: <strong className="text-foreground">£{(item.intent.amount_pence / 100).toFixed(2)}</strong></span>
                              <Badge variant="outline" className="text-xs h-5">{item.intent.provider}</Badge>
                              <Badge variant={item.intent.status === "completed" ? "outline" : "secondary"} className="text-xs h-5">{item.intent.status}</Badge>
                            </>
                          )}
                        </div>
                        {item.type === "amount_mismatch" && item.amountDiff !== undefined && (
                          <div className="text-xs text-destructive font-medium">
                            Difference: £{Math.abs(item.amountDiff).toFixed(2)} ({item.amountDiff > 0 ? "history higher" : "intent higher"})
                          </div>
                        )}
                        {item.payment?.payment_method && (
                          <span className="text-xs text-muted-foreground">Method: {item.payment.payment_method}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Total records analysed: {items.length}</span>
          <span className="text-destructive font-medium">{counts.mismatches} mismatches</span>
          <span className="text-amber-600">{counts.unrecorded} unrecorded</span>
          <span>{counts.orphaned} orphaned</span>
          <span className="text-green-600">{counts.matched} matched</span>
        </div>
      </CardContent>
    </Card>
  );
}
