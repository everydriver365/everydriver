import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Clock, FileText, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Quote {
  id: string;
  pupil_name: string;
  course_type: string | null;
  total_hours: number | null;
  price: number;
  deposit_amount: number | null;
  package_details: string | null;
  schedule_notes: string | null;
  status: string;
  expires_at: string | null;
  instructor_id: string;
}

export default function QuoteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [instructorName, setInstructorName] = useState("");

  useEffect(() => {
    if (token) fetchQuote();
  }, [token]);

  const fetchQuote = async () => {
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data) {
        setQuote(null);
        return;
      }

      setQuote(data);

      // Fetch instructor name
      const { data: inst } = await supabase
        .from("instructors")
        .select("name")
        .eq("id", data.instructor_id)
        .single();

      if (inst) setInstructorName(inst.name);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!quote) return;
    setAccepting(true);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", quote.id);

      if (error) throw error;

      setQuote((q) => q ? { ...q, status: "accepted" } : null);
      toast.success("Quote accepted! Your instructor will be in touch to confirm your schedule.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept quote");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Quote Not Found</h2>
            <p className="text-sm text-muted-foreground mt-2">This quote may have expired or been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = quote.expires_at && new Date(quote.expires_at) < new Date();
  const isAccepted = quote.status === "accepted";

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-12">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {isAccepted ? "Quote Accepted ✓" : "Your Driving Lesson Quote"}
          </CardTitle>
          {instructorName && (
            <p className="text-sm text-muted-foreground">From {instructorName}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pupil</span>
            <span className="font-medium">{quote.pupil_name}</span>
          </div>

          {quote.course_type && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Course</span>
              <Badge variant="secondary">{quote.course_type}</Badge>
            </div>
          )}

          {quote.total_hours && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hours</span>
              <span className="font-medium">{quote.total_hours}h</span>
            </div>
          )}

          <div className="flex items-center justify-between text-lg">
            <span className="font-semibold">Total Price</span>
            <span className="font-bold text-primary">£{quote.price}</span>
          </div>

          {quote.deposit_amount && quote.deposit_amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deposit Required</span>
              <span className="font-medium">£{quote.deposit_amount}</span>
            </div>
          )}

          {quote.package_details && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <FileText className="h-4 w-4" />
                What's Included
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.package_details}</p>
            </div>
          )}

          {quote.schedule_notes && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <Clock className="h-4 w-4" />
                Suggested Schedule
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.schedule_notes}</p>
            </div>
          )}

          {isAccepted ? (
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <Check className="h-5 w-5" />
              <span className="font-medium">You've accepted this quote</span>
            </div>
          ) : isExpired ? (
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted text-muted-foreground">
              <AlertTriangle className="h-5 w-5" />
              <span>This quote has expired</span>
            </div>
          ) : (
            <Button onClick={handleAccept} disabled={accepting} className="w-full" size="lg">
              {accepting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Accept Quote
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
