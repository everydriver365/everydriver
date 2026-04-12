import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Download, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useVehicleService, SERVICE_TYPE_LABELS, ServiceHistoryEntry } from "@/hooks/useVehicleService";
import { toast } from "@/hooks/use-toast";

// UK tax year runs April 6 to April 5
function getTaxYears() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years: { value: string; label: string }[] = [];
  
  // If we're past April 6, current tax year is currentYear-currentYear+1
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  
  for (let i = 0; i < 5; i++) {
    const year = startYear - i;
    years.push({
      value: `${year}`,
      label: `${year}/${(year + 1).toString().slice(-2)}`,
    });
  }
  
  return years;
}

function getTaxYearRange(year: number) {
  return {
    start: new Date(year, 3, 6), // April 6
    end: new Date(year + 1, 3, 5), // April 5 next year
  };
}

interface CostCategory {
  key: string;
  label: string;
  types: string[];
}

const costCategories: CostCategory[] = [
  { key: "servicing", label: "Servicing", types: ["oil_change", "full_service", "brake_pads", "tyre_replacement", "battery"] },
  { key: "repairs", label: "Repairs", types: ["other"] },
  { key: "mot", label: "MOT", types: ["mot"] },
  { key: "insurance", label: "Insurance", types: [] }, // Not tracked in service history currently
];

export function VehicleCostSummary() {
  const { history, isLoading } = useVehicleService();
  const taxYears = getTaxYears();
  const [selectedYear, setSelectedYear] = useState(taxYears[0]?.value || "");

  const yearData = useMemo(() => {
    if (!selectedYear || !history.length) return { entries: [], totals: {} };
    
    const year = parseInt(selectedYear);
    const { start, end } = getTaxYearRange(year);
    
    const entries = history.filter((entry) => {
      const date = new Date(entry.service_date);
      return date >= start && date <= end;
    });

    const totals: Record<string, number> = {};
    costCategories.forEach((cat) => {
      totals[cat.key] = entries
        .filter((e) => cat.types.includes(e.service_type))
        .reduce((sum, e) => sum + (e.cost_gbp || 0), 0);
    });
    
    totals["total"] = entries.reduce((sum, e) => sum + (e.cost_gbp || 0), 0);

    return { entries, totals };
  }, [selectedYear, history]);

  const handleExportCSV = () => {
    if (!yearData.entries.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const year = parseInt(selectedYear);
    const headers = ["Date", "Category", "Service Type", "Vehicle", "Provider", "Cost (£)", "Notes"];
    
    const rows = yearData.entries.map((entry) => {
      const category = costCategories.find(c => c.types.includes(entry.service_type))?.label || "Other";
      const serviceName = entry.service_type === "other" 
        ? entry.custom_name || "Other" 
        : SERVICE_TYPE_LABELS[entry.service_type] || entry.service_type;
      
      return [
        format(new Date(entry.service_date), "yyyy-MM-dd"),
        category,
        serviceName,
        entry.vehicle?.registration || "",
        entry.provider || "",
        (entry.cost_gbp || 0).toFixed(2),
        (entry.notes || "").replace(/,/g, ";"),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
      "",
      `Total,,,,,${yearData.totals.total?.toFixed(2) || "0.00"},`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vehicle-costs-${year}-${year + 1}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "CSV exported successfully" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5" />
            Vehicle Costs (HMRC)
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Tax Year
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tax Year Selector */}
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select tax year" />
            </SelectTrigger>
            <SelectContent>
              {taxYears.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  Tax Year {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cost Summary */}
        <div className="grid grid-cols-2 gap-3">
          {costCategories.filter(c => yearData.totals[c.key] > 0 || c.key === "servicing").map((category) => (
            <div
              key={category.key}
              className="bg-muted/50 rounded-2xl p-3 text-center"
            >
              <p className="text-xs text-muted-foreground">{category.label}</p>
              <p className="text-lg font-bold">
                £{(yearData.totals[category.key] || 0).toFixed(0)}
              </p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-primary/10 rounded-2xl p-4 text-center border border-primary/20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Total Deductible</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            £{(yearData.totals.total || 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {yearData.entries.length} service record{yearData.entries.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Export Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleExportCSV}
          disabled={!yearData.entries.length}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV for HMRC
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Export includes all service records with costs for your self-assessment
        </p>
      </CardContent>
    </Card>
  );
}
