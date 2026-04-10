import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { Car, Briefcase, User, Download, FileText, Route, TrendingUp, PoundSterling } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FleetMileageTrackerProps {
  instructorId: string;
}

interface MileageEntry {
  id: string;
  log_date: string;
  distance_km: number;
  trip_type: "business" | "personal";
  purpose: string | null;
  start_location: string | null;
  end_location: string | null;
  is_auto_logged: boolean;
  pupil?: { name: string } | null;
}

const kmToMiles = (km: number) => +(km * 0.621371).toFixed(1);

export function FleetMileageTracker({ instructorId }: FleetMileageTrackerProps) {
  const [range, setRange] = useState<"7" | "14" | "30" | "90">("30");
  const queryClient = useQueryClient();

  const fromDate = useMemo(() => subDays(new Date(), parseInt(range)).toISOString().split("T")[0], [range]);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["fleet-mileage", instructorId, range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mileage_logs")
        .select("id, log_date, distance_km, trip_type, purpose, start_location, end_location, is_auto_logged, pupil:pupil_id(name)")
        .eq("instructor_id", instructorId)
        .gte("log_date", fromDate)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return (data || []) as MileageEntry[];
    },
  });

  const toggleTripType = useMutation({
    mutationFn: async ({ id, tripType }: { id: string; tripType: "business" | "personal" }) => {
      const { error } = await supabase
        .from("mileage_logs")
        .update({ trip_type: tripType })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-mileage"] });
      toast.success("Trip type updated");
    },
  });

  // Summary calculations
  const summary = useMemo(() => {
    const businessMiles = logs
      .filter(l => l.trip_type === "business")
      .reduce((s, l) => s + kmToMiles(l.distance_km), 0);
    const personalMiles = logs
      .filter(l => l.trip_type === "personal")
      .reduce((s, l) => s + kmToMiles(l.distance_km), 0);
    const totalMiles = businessMiles + personalMiles;
    // HMRC: 45p first 10k, 25p after
    const hmrcDeduction = businessMiles <= 10000
      ? businessMiles * 0.45
      : 10000 * 0.45 + (businessMiles - 10000) * 0.25;
    return { businessMiles: +businessMiles.toFixed(1), personalMiles: +personalMiles.toFixed(1), totalMiles: +totalMiles.toFixed(1), hmrcDeduction: +hmrcDeduction.toFixed(2) };
  }, [logs]);

  const exportCSV = () => {
    const rows = [["Date", "Distance (mi)", "Type", "Purpose", "From", "To", "Pupil", "Auto-logged"]];
    logs.forEach(l => {
      rows.push([
        l.log_date,
        String(kmToMiles(l.distance_km)),
        l.trip_type,
        l.purpose || "",
        l.start_location || "",
        l.end_location || "",
        l.pupil?.name || "",
        l.is_auto_logged ? "Yes" : "No",
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mileage-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pw, 30, "F");
    doc.setFontSize(18);
    doc.setTextColor(255);
    doc.text("Mileage Report", pw / 2, 16, { align: "center" });
    doc.setFontSize(9);
    doc.text(`${format(new Date(fromDate), "d MMM yyyy")} — ${format(new Date(), "d MMM yyyy")}`, pw / 2, 24, { align: "center" });

    doc.setTextColor(0);
    doc.setFontSize(11);
    let y = 40;
    doc.text(`Total: ${summary.totalMiles} mi`, 14, y);
    doc.text(`Business: ${summary.businessMiles} mi`, 14, y + 7);
    doc.text(`Personal: ${summary.personalMiles} mi`, 14, y + 14);
    doc.text(`HMRC Deduction: £${summary.hmrcDeduction.toFixed(2)}`, 14, y + 21);

    const tableRows = logs.map(l => [
      format(new Date(l.log_date), "dd MMM yyyy"),
      `${kmToMiles(l.distance_km)} mi`,
      l.trip_type,
      l.purpose || "—",
      l.pupil?.name || "—",
    ]);

    autoTable(doc, {
      startY: y + 30,
      head: [["Date", "Distance", "Type", "Purpose", "Pupil"]],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`mileage-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF downloaded");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          Mileage Tracker
        </h2>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as any)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border z-50">
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-3 text-center">
            <Car className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{summary.totalMiles}</p>
            <p className="text-[10px] text-muted-foreground">Total Miles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Briefcase className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
            <p className="text-xl font-bold text-emerald-600">{summary.businessMiles}</p>
            <p className="text-[10px] text-muted-foreground">Business Miles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <User className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold text-primary">{summary.personalMiles}</p>
            <p className="text-[10px] text-muted-foreground">Personal Miles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <PoundSterling className="h-4 w-4 mx-auto text-amber-600 mb-1" />
            <p className="text-xl font-bold text-amber-600">£{summary.hmrcDeduction.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">HMRC Deduction</p>
          </CardContent>
        </Card>
      </div>

      {/* Trip list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Journey Log</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No mileage data for this period</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-none"
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {kmToMiles(log.distance_km)} mi
                      </span>
                      <Badge
                        variant={log.trip_type === "business" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {log.trip_type === "business" ? "Business" : "Personal"}
                      </Badge>
                      {log.is_auto_logged && (
                        <Badge variant="outline" className="text-[10px]">GPS</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>{format(new Date(log.log_date), "dd MMM yyyy")}</span>
                      {log.pupil?.name && <span>· {log.pupil.name}</span>}
                      {log.purpose && <span>· {log.purpose}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-muted-foreground">Personal</span>
                    <Switch
                      checked={log.trip_type === "business"}
                      onCheckedChange={(checked) =>
                        toggleTripType.mutate({
                          id: log.id,
                          tripType: checked ? "business" : "personal",
                        })
                      }
                    />
                    <span className="text-[10px] text-muted-foreground">Business</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Export CSV/PDF to email to your accountant. HMRC rate: 45p/mi (first 10,000), 25p/mi thereafter.
      </p>
    </div>
  );
}
