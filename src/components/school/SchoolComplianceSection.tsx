import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { format, differenceInDays } from "date-fns";

interface Props {
  instructorIds: string[];
}

interface Instructor {
  id: string;
  name: string;
  adi_badge_number: string | null;
  adi_badge_expiry: string | null;
  dbs_certificate_expiry: string | null;
}

function expiryStatus(date: string | null): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (!date) return { label: "Not set", variant: "secondary" };
  const days = differenceInDays(new Date(date), new Date());
  if (days < 0) return { label: "Expired", variant: "destructive" };
  if (days < 30) return { label: `${days}d left`, variant: "destructive" };
  if (days < 90) return { label: `${days}d left`, variant: "default" };
  return { label: format(new Date(date), "dd MMM yyyy"), variant: "secondary" };
}

export default function SchoolComplianceSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setInstructors([
        { id: "1", name: "John Smith", adi_badge_number: "ADI123456", adi_badge_expiry: new Date(Date.now() + 60 * 86400000).toISOString(), dbs_certificate_expiry: "2025-01-15" },
        { id: "2", name: "Sarah Jones", adi_badge_number: "ADI789012", adi_badge_expiry: new Date(Date.now() + 20 * 86400000).toISOString(), dbs_certificate_expiry: "2024-06-01" },
      ]);
      setLoading(false);
      return;
    }
    if (!instructorIds.length) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("instructors")
        .select("id, name, adi_badge_number, adi_badge_expiry, dbs_certificate_expiry")
        .in("id", instructorIds);
      setInstructors((data as Instructor[]) || []);
      setLoading(false);
    };
    fetch();
  }, [instructorIds, isDemo]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Compliance Dashboard</h2>
        <p className="text-muted-foreground">DBS & ADI licence status for your instructors</p>
      </div>
      {instructors.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No instructors found</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {instructors.map((i) => {
            const adi = expiryStatus(i.adi_badge_expiry);
            return (
              <Card key={i.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {i.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>ADI Licence</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{i.adi_badge_number || "—"}</span>
                      <Badge variant={adi.variant}>{adi.label}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>DBS Expiry</span>
                    <div className="flex items-center gap-2">
                      {i.dbs_certificate_expiry ? <span className="text-muted-foreground">{format(new Date(i.dbs_certificate_expiry), "dd MMM yyyy")}</span> : <span className="text-muted-foreground">—</span>}
                    </div>
                  </div>
                  {adi.variant === "destructive" && (
                    <div className="flex items-center gap-1 text-destructive text-xs mt-1">
                      <AlertTriangle className="h-3 w-3" /> Action required
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
