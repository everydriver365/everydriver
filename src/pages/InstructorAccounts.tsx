import { useState, useEffect } from "react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/components/instructor/AccountSettings";
import { EarningsCalculator } from "@/components/instructor/EarningsCalculator";
import { ExpenseCategoryChart } from "@/components/instructor/ExpenseCategoryChart";
import { TaxYearReport } from "@/components/instructor/TaxYearReport";
import { LessonMileageTracker } from "@/components/instructor/LessonMileageTracker";
import { AccountingExport } from "@/components/instructor/accounting-export/AccountingExport";
import { AnnualBusinessReport } from "@/components/instructor/AnnualBusinessReport";
import { supabase } from "@/integrations/supabase/client";
import { Settings, TrendingUp, PieChart, FileText, Car, FileSpreadsheet, BarChart3, Wallet } from "lucide-react";

export default function InstructorAccounts() {
  const { instructor } = useInstructorAuth();
  const [activeTab, setActiveTab] = useState("earnings");
  const [accountSettings, setAccountSettings] = useState({
    tax_code: "1257L",
    hourly_rate: 40,
    vehicle_mpg: 40,
    fuel_cost_per_litre: 1.45,
  });

  useEffect(() => {
    if (instructor?.id) {
      fetchAccountSettings();
    }
  }, [instructor?.id]);

  const fetchAccountSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("tax_code, hourly_rate, vehicle_mpg, fuel_cost_per_litre")
        .eq("id", instructor!.id)
        .single();

      if (error) throw error;

      setAccountSettings({
        tax_code: data.tax_code || "1257L",
        hourly_rate: data.hourly_rate || 40,
        vehicle_mpg: data.vehicle_mpg || 40,
        fuel_cost_per_litre: data.fuel_cost_per_litre || 1.45,
      });
    } catch (error) {
      console.error("Error fetching account settings:", error);
    }
  };

  if (!instructor?.id) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Accounts
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
            <TabsTrigger value="earnings" className="gap-1.5 text-xs md:text-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Earnings</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5 text-xs md:text-sm">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="mileage" className="gap-1.5 text-xs md:text-sm">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Mileage</span>
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-1.5 text-xs md:text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Tax Report</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5 text-xs md:text-sm">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs md:text-sm">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="annual" className="gap-1.5 text-xs md:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Annual</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings">
            <EarningsCalculator instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="expenses">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Expense Analysis</h2>
                <p className="text-muted-foreground">
                  See where your money is being spent
                </p>
              </div>
              <ExpenseCategoryChart instructorId={instructor.id} />
            </div>
          </TabsContent>

          <TabsContent value="mileage">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Lesson Mileage</h2>
                <p className="text-muted-foreground">
                  Track miles for each lesson to claim HMRC mileage allowance
                </p>
              </div>
              <LessonMileageTracker instructorId={instructor.id} />
            </div>
          </TabsContent>

          <TabsContent value="tax">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Tax Year Report</h2>
                <p className="text-muted-foreground">
                  Generate a comprehensive report for self-assessment
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TaxYearReport
                  instructorId={instructor.id}
                  instructorName={instructor.name || "Instructor"}
                  taxCode={accountSettings.tax_code}
                  hourlyRate={accountSettings.hourly_rate}
                  vehicleMpg={accountSettings.vehicle_mpg}
                  fuelCostPerLitre={accountSettings.fuel_cost_per_litre}
                />
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-[#0075c9]/5 dark:bg-[#0075c9]/10 border border-[#0075c9]/20 dark:border-[#0075c9]/30">
                    <h3 className="font-medium text-[#0075c9] mb-2">
                      Tax Report Includes
                    </h3>
                    <ul className="text-sm text-[#0075c9]/80 space-y-1">
                      <li>• Gross income from all lessons</li>
                      <li>• HMRC mileage allowance calculation</li>
                      <li>• Expenses breakdown by category</li>
                      <li>• Estimated Income Tax</li>
                      <li>• Estimated National Insurance (Class 4)</li>
                      <li>• Net profit after tax</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                      Important Notice
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      This report provides estimates only. Please consult a qualified
                      accountant or tax advisor for official tax advice and filing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Export & Sync</h2>
                <p className="text-muted-foreground">
                  Export data for your accounting software
                </p>
              </div>
              <AccountingExport instructorId={instructor.id} />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <AccountSettings instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="annual">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Annual Business Report</h2>
                <p className="text-muted-foreground">
                  Comprehensive overview of your business performance
                </p>
              </div>
              <AnnualBusinessReport instructorId={instructor.id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
