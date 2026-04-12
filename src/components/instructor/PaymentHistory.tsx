import { useState, useEffect } from "react";
import { format } from "date-fns";
import { History, Trash2, User, PoundSterling, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PayoutStatusBadge } from "./PayoutStatusBadge";

interface PaymentRecord {
  id: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  recorded_at: string;
  payout_status: string | null;
  pupil: {
    name: string;
  };
}

interface PaymentHistoryProps {
  instructorId: string;
  limit?: number;
}

export function PaymentHistory({ instructorId, limit = 10 }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_history")
        .select(`
          id,
          amount,
          payment_method,
          notes,
          recorded_at,
          payout_status,
          pupils (name)
        `)
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .order("recorded_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedPayments = (data || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        payment_method: p.payment_method,
        notes: p.notes,
        recorded_at: p.recorded_at,
        payout_status: p.payout_status,
        pupil: {
          name: p.pupils?.name || "Unknown Pupil",
        },
      }));

      setPayments(formattedPayments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [instructorId]);

  const handleDelete = async (paymentId: string) => {
    setDeleting(paymentId);
    try {
      const { softDelete } = await import("@/lib/auditLogger");
      const payment = payments.find(p => p.id === paymentId);
      await softDelete("payment_history", paymentId, instructorId, payment ? { amount: payment.amount, pupil: payment.pupil.name } : null);

      setPayments(payments.filter(p => p.id !== paymentId));
      toast({
        title: "Payment deleted",
        description: "The payment record has been removed",
      });
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({
        title: "Error",
        description: "Failed to delete payment record",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Recent Payments
          </CardTitle>
          {payments.length > 0 && (
            <Badge variant="secondary" className="font-mono">
              Total: £{totalAmount.toFixed(2)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PoundSterling className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No payments recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-2xl border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{payment.pupil.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(payment.recorded_at), "dd MMM yyyy, HH:mm")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-primary">
                        £{Number(payment.amount).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {payment.payment_method}
                      </div>
                    </div>
                    <PayoutStatusBadge status={payment.payout_status} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={deleting === payment.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete payment record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the £{Number(payment.amount).toFixed(2)} payment from {payment.pupil.name}'s history. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(payment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
