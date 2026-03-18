import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Send, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function AbandonedCheckoutTracker() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();

  const { data: checkouts, isLoading } = useQuery({
    queryKey: ["abandoned-checkouts", instructor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abandoned_checkouts")
        .select("*")
        .eq("instructor_id", instructor!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!instructor?.id,
  });

  const resendMutation = useMutation({
    mutationFn: async (checkoutId: string) => {
      // Reset reminder_sent_at to null so the edge function picks it up again
      const { error } = await supabase
        .from("abandoned_checkouts")
        .update({ reminder_sent_at: null })
        .eq("id", checkoutId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-checkouts"] });
      toast.success("Reminder will be sent shortly");
    },
  });

  const total = checkouts?.length || 0;
  const converted = checkouts?.filter(c => c.converted_at).length || 0;
  const pending = checkouts?.filter(c => !c.converted_at && !c.reminder_sent_at).length || 0;
  const reminded = checkouts?.filter(c => !c.converted_at && c.reminder_sent_at).length || 0;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <ShoppingCart className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold text-foreground">{pending}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Send className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold text-foreground">{reminded}</p>
            <p className="text-[10px] text-muted-foreground">Reminded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold text-foreground">{conversionRate}%</p>
            <p className="text-[10px] text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
      ) : (
        <div className="space-y-2">
          {checkouts?.map(checkout => (
            <Card key={checkout.id} className={checkout.converted_at ? "opacity-60" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{checkout.pupil_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {checkout.pupil_email || checkout.pupil_phone || "No contact"} • {formatDistanceToNow(new Date(checkout.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {checkout.converted_at ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" /> Converted
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => resendMutation.mutate(checkout.id)}
                      disabled={resendMutation.isPending}
                    >
                      <Send className="h-3 w-3 mr-1" /> Remind
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!checkouts?.length && (
            <p className="text-sm text-muted-foreground text-center py-4">No abandoned checkouts tracked yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
