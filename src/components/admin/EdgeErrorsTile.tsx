import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ChevronRight } from "lucide-react";

export function EdgeErrorsTile() {
  const [count, setCount] = useState<number | null>(null);
  const [has5xx, setHas5xx] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.functions.invoke("edge-function-error-stats");
      if (!error && data) {
        setCount(data.unhealthy_count ?? 0);
        setHas5xx((data.unhealthy ?? []).some((s: { errors_5xx: number }) => s.errors_5xx > 0));
      } else {
        setCount(0);
      }
    })();
  }, []);

  return (
    <Link to="/admin/edge-function-errors">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${has5xx ? "text-destructive" : count && count > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            <div>
              <div className="text-sm font-medium">Edge Errors (24h)</div>
              <div className="text-xs text-muted-foreground">
                {count === null ? "Loading…" : count === 0 ? "All healthy" : `${count} unhealthy`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {count !== null && count > 0 && (
              <Badge variant={has5xx ? "destructive" : "secondary"}>{count}</Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
