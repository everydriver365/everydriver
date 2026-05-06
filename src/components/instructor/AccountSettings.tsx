import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Calculator, 
  Fuel, 
  PoundSterling, 
  FileText, 
  ChevronDown,
  Car,
  Home,
  Phone,
  Wifi,
  Shirt,
  GraduationCap,
  Shield,
  Wrench,
  Receipt,
  Info
} from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { Skeleton } from "@/components/ui/skeleton";
import { RecurringExpensesManager } from "./RecurringExpensesManager";
import { PaymentOptionsSettings } from "./PaymentOptionsSettings";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AccountSettingsProps {
  instructorId: string;
}

type FuelType = "petrol" | "diesel" | "electric";

interface AccountData {
  tax_code: string;
  hourly_rate: number;
  vehicle_mpg: number;
  fuel_cost_per_litre: number;
  fuel_type: FuelType;
  battery_kwh: number;
  electricity_cost_per_kwh: number;
}

// HMRC Allowable Deductions for Driving Instructors
const ALLOWABLE_DEDUCTIONS = [
  { 
    id: 'vehicle_costs',
    label: 'Vehicle Running Costs', 
    description: 'Fuel, servicing, repairs, MOT, road tax',
    icon: Car,
    defaultSelected: true 
  },
  { 
    id: 'vehicle_lease',
    label: 'Vehicle Lease/Finance', 
    description: 'Car lease payments or finance interest',
    icon: Car,
    defaultSelected: true 
  },
  { 
    id: 'insurance',
    label: 'Business Insurance', 
    description: 'Car insurance, public liability, professional indemnity',
    icon: Shield,
    defaultSelected: true 
  },
  { 
    id: 'phone',
    label: 'Phone & Communications', 
    description: 'Mobile phone, business calls (proportion)',
    icon: Phone,
    defaultSelected: true 
  },
  { 
    id: 'home_office',
    label: 'Use of Home as Office', 
    description: 'Proportion of utilities, council tax for business use',
    icon: Home,
    defaultSelected: false 
  },
  { 
    id: 'broadband',
    label: 'Internet/Broadband', 
    description: 'Business proportion of internet costs',
    icon: Wifi,
    defaultSelected: false 
  },
  { 
    id: 'training',
    label: 'Training & CPD', 
    description: 'Standards check training, CPD courses',
    icon: GraduationCap,
    defaultSelected: true 
  },
  { 
    id: 'adi_license',
    label: 'ADI License & Badges', 
    description: 'License renewal, badge fees',
    icon: Receipt,
    defaultSelected: true 
  },
  { 
    id: 'uniform',
    label: 'Uniform/Clothing', 
    description: 'Branded clothing with business logo',
    icon: Shirt,
    defaultSelected: false 
  },
  { 
    id: 'equipment',
    label: 'Teaching Equipment', 
    description: 'Dual controls, mirrors, teaching aids',
    icon: Wrench,
    defaultSelected: true 
  },
  { 
    id: 'franchise',
    label: 'Franchise Fees', 
    description: 'Monthly franchise or school fees',
    icon: Receipt,
    defaultSelected: false 
  },
  { 
    id: 'accountant',
    label: 'Accountancy Fees', 
    description: 'Fees for completing tax returns',
    icon: Calculator,
    defaultSelected: false 
  },
];

export function AccountSettings({ instructorId }: AccountSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AccountData>({
    tax_code: "1257L",
    hourly_rate: 40,
    vehicle_mpg: 40,
    fuel_cost_per_litre: 1.45,
  });
  const [selectedDeductions, setSelectedDeductions] = useState<string[]>(
    ALLOWABLE_DEDUCTIONS.filter(d => d.defaultSelected).map(d => d.id)
  );
  const [deductionsOpen, setDeductionsOpen] = useState(false);

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

  const toggleDeduction = (id: string) => {
    setSelectedDeductions(prev => 
      prev.includes(id) 
        ? prev.filter(d => d !== id)
        : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 px-1">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Account Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your tax and vehicle details for accurate earnings calculations
        </p>
      </div>

      {/* Mobile-optimized grid - single column on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tax Settings */}
        <Card>
          <CardHeader className="pb-3 px-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Tax Information
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your HMRC tax details</CardDescription>
          </CardHeader>
          <CardContent className="px-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="tax_code" className="text-sm">Tax Code</Label>
              <Input
                id="tax_code"
                value={data.tax_code}
                onChange={(e) => setData({ ...data, tax_code: e.target.value.toUpperCase() })}
                placeholder="e.g. 1257L"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Your personal tax code from HMRC
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Rate */}
        <Card>
          <CardHeader className="pb-3 px-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <PoundSterling className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              Earnings Rate
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your hourly teaching rate</CardDescription>
          </CardHeader>
          <CardContent className="px-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate" className="text-sm">Hourly Rate (£)</Label>
              <Input
                id="hourly_rate"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.50"
                value={data.hourly_rate}
                onChange={(e) => setData({ ...data, hourly_rate: parseFloat(e.target.value) || 0 })}
                className="h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle MPG */}
        <Card>
          <CardHeader className="pb-3 px-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Vehicle Efficiency
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Miles per gallon</CardDescription>
          </CardHeader>
          <CardContent className="px-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="vehicle_mpg" className="text-sm">Miles Per Gallon</Label>
              <Input
                id="vehicle_mpg"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={data.vehicle_mpg}
                onChange={(e) => setData({ ...data, vehicle_mpg: parseFloat(e.target.value) || 0 })}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Average MPG for your vehicle
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Cost */}
        <Card>
          <CardHeader className="pb-3 px-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Fuel className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              Fuel Cost
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Current fuel price</CardDescription>
          </CardHeader>
          <CardContent className="px-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="fuel_cost" className="text-sm">Cost Per Litre (£)</Label>
              <Input
                id="fuel_cost"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={data.fuel_cost_per_litre}
                onChange={(e) => setData({ ...data, fuel_cost_per_litre: parseFloat(e.target.value) || 0 })}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Current price per litre
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Options (Klarna/Clearpay) */}
      <PaymentOptionsSettings instructorId={instructorId} />

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>

      {/* Allowable Deductions Section */}
      <Card className="border-dashed">
        <Collapsible open={deductionsOpen} onOpenChange={setDeductionsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Allowable Deductions
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {selectedDeductions.length} selected
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    HMRC-approved expenses you can claim
                  </CardDescription>
                </div>
                <ExpandChevron isExpanded={deductionsOpen} size={20} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="px-4 pt-0 pb-4">
              {/* Info Banner */}
              <div className="flex items-start gap-2 p-3 mb-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30">
                <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <p className="text-xs text-primary/80 dark:text-primary/70">
                  Select the expenses you claim against your income. These are tracked in your expense records and recurring costs below.
                </p>
              </div>

              {/* Deductions Grid - Mobile optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALLOWABLE_DEDUCTIONS.map((deduction) => {
                  const Icon = deduction.icon;
                  const isSelected = selectedDeductions.includes(deduction.id);
                  
                  return (
                    <div
                      key={deduction.id}
                      onClick={() => toggleDeduction(deduction.id)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-primary/5 border-primary/30' 
                          : 'bg-card border-border hover:bg-muted/30'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleDeduction(deduction.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {deduction.label}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {deduction.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => setSelectedDeductions(ALLOWABLE_DEDUCTIONS.map(d => d.id))}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => setSelectedDeductions([])}
                >
                  Clear All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => setSelectedDeductions(ALLOWABLE_DEDUCTIONS.filter(d => d.defaultSelected).map(d => d.id))}
                >
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Recurring Business Expenses */}
      <div className="pt-4 border-t">
        <RecurringExpensesManager instructorId={instructorId} />
      </div>
    </div>
  );
}
