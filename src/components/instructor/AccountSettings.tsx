import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Calculator, Fuel, PoundSterling, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AccountSettingsProps {
  instructorId: string;
}

interface AccountData {
  tax_code: string;
  hourly_rate: number;
  vehicle_mpg: number;
  fuel_cost_per_litre: number;
}

export function AccountSettings({ instructorId }: AccountSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AccountData>({
    tax_code: "1257L",
    hourly_rate: 40,
    vehicle_mpg: 40,
    fuel_cost_per_litre: 1.45,
  });

  useEffect(() => {
    fetchAccountData();
  }, [instructorId]);

  const fetchAccountData = async () => {
    try {
      const { data: instructor, error } = await supabase
        .from("instructors")
        .select("tax_code, hourly_rate, vehicle_mpg, fuel_cost_per_litre")
        .eq("id", instructorId)
        .single();

      if (error) throw error;

      setData({
        tax_code: instructor.tax_code || "1257L",
        hourly_rate: instructor.hourly_rate || 40,
        vehicle_mpg: instructor.vehicle_mpg || 40,
        fuel_cost_per_litre: instructor.fuel_cost_per_litre || 1.45,
      });
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({
          tax_code: data.tax_code,
          hourly_rate: data.hourly_rate,
          vehicle_mpg: data.vehicle_mpg,
          fuel_cost_per_litre: data.fuel_cost_per_litre,
        })
        .eq("id", instructorId);

      if (error) throw error;

      toast.success("Account settings saved");
    } catch (error) {
      console.error("Error saving account data:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <p className="text-muted-foreground">
          Configure your tax and vehicle details for accurate earnings calculations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tax Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Tax Information
            </CardTitle>
            <CardDescription>Your HMRC tax details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tax_code">Tax Code</Label>
              <Input
                id="tax_code"
                value={data.tax_code}
                onChange={(e) => setData({ ...data, tax_code: e.target.value.toUpperCase() })}
                placeholder="e.g. 1257L"
              />
              <p className="text-xs text-muted-foreground">
                Your personal tax code from HMRC (e.g., 1257L)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PoundSterling className="h-5 w-5 text-success" />
              Earnings Rate
            </CardTitle>
            <CardDescription>Your hourly teaching rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (£)</Label>
              <Input
                id="hourly_rate"
                type="number"
                min="0"
                step="0.50"
                value={data.hourly_rate}
                onChange={(e) => setData({ ...data, hourly_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle MPG */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-500" />
              Vehicle Efficiency
            </CardTitle>
            <CardDescription>Miles per gallon for your vehicle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_mpg">Miles Per Gallon (MPG)</Label>
              <Input
                id="vehicle_mpg"
                type="number"
                min="0"
                step="0.1"
                value={data.vehicle_mpg}
                onChange={(e) => setData({ ...data, vehicle_mpg: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Average MPG for your teaching vehicle
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Cost */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Fuel className="h-5 w-5 text-amber-500" />
              Fuel Cost
            </CardTitle>
            <CardDescription>Current fuel price</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fuel_cost">Cost Per Litre (£)</Label>
              <Input
                id="fuel_cost"
                type="number"
                min="0"
                step="0.01"
                value={data.fuel_cost_per_litre}
                onChange={(e) => setData({ ...data, fuel_cost_per_litre: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Current price of fuel per litre
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>
    </div>
  );
}
