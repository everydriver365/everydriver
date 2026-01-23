import { useState, useEffect } from "react";
import { Globe, Save, Loader2, Info, CreditCard, Gift, AlertTriangle, Download, RotateCcw, Database, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CMSImageUpload } from "./CMSImageUpload";

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  label: string;
  description: string | null;
  display_order: number;
}

export function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [confirmResetText, setConfirmResetText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => 
      prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update each setting
      for (const setting of settings) {
        const { error } = await supabase
          .from("site_settings")
          .update({ setting_value: setting.setting_value })
          .eq("id", setting.id);

        if (error) throw error;
      }

      toast({ title: "Settings saved", description: "Your site settings have been updated" });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResetStats = async () => {
    if (confirmResetText !== "RESET") return;
    
    setResetting(true);
    try {
      // Reset payment history
      await supabase.from("payment_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // Reset scheduled lessons
      await supabase.from("scheduled_lessons").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // Reset driving test results
      await supabase.from("driving_test_results").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      toast({ title: "Stats Reset", description: "All statistics have been reset successfully" });
      setResetDialogOpen(false);
      setConfirmResetText("");
    } catch (error) {
      console.error("Error resetting stats:", error);
      toast({ title: "Error", description: "Failed to reset statistics", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const handleExportData = async (tableName: string, displayName: string) => {
    setExporting(tableName);
    try {
      const { data, error } = await supabase.from(tableName as any).select("*");
      
      if (error) throw error;
      
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tableName}_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Export Complete", description: `${displayName} data exported successfully` });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({ title: "Error", description: `Failed to export ${displayName}`, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const handleExportAllData = async () => {
    setExporting("all");
    try {
      const tables = [
        "instructors",
        "pupils",
        "scheduled_lessons",
        "payment_history",
        "course_templates",
        "instructor_subscriptions",
        "course_enquiries",
      ];
      
      const allData: Record<string, any[]> = {};
      
      for (const table of tables) {
        const { data } = await supabase.from(table as any).select("*");
        allData[table] = data || [];
      }
      
      const jsonStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `full_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Full Backup Complete", description: "All data exported successfully" });
    } catch (error) {
      console.error("Error exporting all data:", error);
      toast({ title: "Error", description: "Failed to create full backup", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const renderInput = (setting: SiteSetting) => {
    const value = setting.setting_value || "";
    
    switch (setting.setting_type) {
      case "textarea":
        return (
          <div className="space-y-1">
            <Textarea
              value={value}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              rows={3}
              className="resize-none"
            />
            {setting.setting_key === "meta_description" && (
              <p className={`text-xs ${value.length > 160 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {value.length}/160 characters
              </p>
            )}
          </div>
        );
      
      case "image":
        return (
          <CMSImageUpload
            value={value}
            onChange={(url) => handleChange(setting.setting_key, url || "")}
            bucket="instructor-images"
            folder="site-settings"
            label="Upload Image"
          />
        );
      
      case "color":
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || "#3b82f6"}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              className="h-10 w-14 rounded border cursor-pointer"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              placeholder="#3b82f6"
              className="w-32 font-mono text-sm"
            />
            {value && (
              <div 
                className="h-10 flex-1 rounded border flex items-center justify-center text-sm"
                style={{ backgroundColor: value, color: value > "#888888" ? "#000" : "#fff" }}
              >
                Preview
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="space-y-1">
            <Input
              type={setting.setting_type === "email" ? "email" : setting.setting_type === "tel" ? "tel" : "text"}
              value={value}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            />
            {setting.setting_key === "site_title" && (
              <p className={`text-xs ${value.length > 60 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {value.length}/60 characters
              </p>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group settings
  const seoSettings = settings.filter(s => 
    ["site_title", "meta_description", "og_title", "og_description", "og_image_url"].includes(s.setting_key)
  );
  const socialSettings = settings.filter(s => 
    ["twitter_handle", "google_analytics_id"].includes(s.setting_key)
  );
  const contactSettings = settings.filter(s => 
    ["contact_email", "contact_phone", "footer_copyright"].includes(s.setting_key)
  );
  const paymentSettings = settings.filter(s => 
    ["npi_merchant_name", "npi_brand_color", "npi_merchant_logo"].includes(s.setting_key)
  );
  const rewardsSettings = settings.filter(s => 
    ["points_per_lesson", "points_for_free_lesson", "lessons_for_free_lesson"].includes(s.setting_key)
  );

  return (
    <div className="space-y-6">
      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            SEO & Meta Tags
          </CardTitle>
          <CardDescription>
            Configure how your site appears in search engines and when shared on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {seoSettings.map((setting) => (
            <div key={setting.id} className="space-y-2">
              <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
                {setting.label}
                {setting.description && (
                  <span className="text-xs text-muted-foreground font-normal">
                    — {setting.description}
                  </span>
                )}
              </Label>
              {renderInput(setting)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Social & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Social & Analytics</CardTitle>
          <CardDescription>
            Connect your social accounts and analytics tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialSettings.map((setting) => (
            <div key={setting.id} className="space-y-2">
              <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
                {setting.label}
                {setting.description && (
                  <span className="text-xs text-muted-foreground font-normal">
                    — {setting.description}
                  </span>
                )}
              </Label>
              {renderInput(setting)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Contact & Footer</CardTitle>
          <CardDescription>
            Contact information displayed across the site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactSettings.map((setting) => (
            <div key={setting.id} className="space-y-2">
              <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
                {setting.label}
                {setting.description && (
                  <span className="text-xs text-muted-foreground font-normal">
                    — {setting.description}
                  </span>
                )}
              </Label>
              {renderInput(setting)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Page Settings */}
      {paymentSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Page Branding
            </CardTitle>
            <CardDescription>
              Customize the hosted payment page appearance for NPI/Cardstream
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentSettings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
                  {setting.label}
                  {setting.description && (
                    <span className="text-xs text-muted-foreground font-normal">
                      — {setting.description}
                    </span>
                  )}
                </Label>
                {renderInput(setting)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rewards Settings */}
      {rewardsSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Pupil Rewards Configuration
            </CardTitle>
            <CardDescription>
              Configure how points are earned and redeemed for free lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rewardsSettings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <Label htmlFor={setting.setting_key} className="flex items-center gap-2">
                  {setting.label}
                  {setting.description && (
                    <span className="text-xs text-muted-foreground font-normal">
                      — {setting.description}
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={setting.setting_value || ""}
                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                  className="max-w-[200px]"
                />
              </div>
            ))}
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-muted-foreground">
              <p><strong>How it works:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Pupils earn points when lessons are marked as completed</li>
                <li>Points can be redeemed for free lessons during booking</li>
                <li>Alternatively, completing a set number of lessons also earns a free lesson</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Export & Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Export & Backup
          </CardTitle>
          <CardDescription>
            Download backups of your data for safekeeping or migration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleExportData("instructors", "Instructors")}
              disabled={exporting !== null}
              className="justify-start"
            >
              {exporting === "instructors" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 mr-2" />
              )}
              Export Instructors
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData("pupils", "Pupils")}
              disabled={exporting !== null}
              className="justify-start"
            >
              {exporting === "pupils" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 mr-2" />
              )}
              Export Pupils
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData("scheduled_lessons", "Lessons")}
              disabled={exporting !== null}
              className="justify-start"
            >
              {exporting === "scheduled_lessons" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 mr-2" />
              )}
              Export Lessons
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData("payment_history", "Payments")}
              disabled={exporting !== null}
              className="justify-start"
            >
              {exporting === "payment_history" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 mr-2" />
              )}
              Export Payments
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData("course_enquiries", "Enquiries")}
              disabled={exporting !== null}
              className="justify-start"
            >
              {exporting === "course_enquiries" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 mr-2" />
              )}
              Export Enquiries
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData("instructor_subscriptions", "Subscriptions")}
              disabled={exporting !== null}
              className="justify-start"
            >
              {exporting === "instructor_subscriptions" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 mr-2" />
              )}
              Export Subscriptions
            </Button>
          </div>
          <div className="pt-2 border-t">
            <Button
              onClick={handleExportAllData}
              disabled={exporting !== null}
              className="w-full sm:w-auto"
            >
              {exporting === "all" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download Full Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Reset Stats */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your data permanently
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div>
              <h4 className="font-medium">Reset All Statistics</h4>
              <p className="text-sm text-muted-foreground">
                Clear all payment history, lessons, and test results. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setResetDialogOpen(true)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 flex gap-3">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Note about SEO changes</p>
          <p>
            Changes to the site title and meta description will take effect immediately for new visitors. 
            Search engines may take a few days to update their cached versions.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Settings
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All payment history records</li>
                <li>All scheduled lessons</li>
                <li>All driving test results</li>
              </ul>
              <p className="pt-2">
                Type <strong>RESET</strong> below to confirm:
              </p>
              <Input
                value={confirmResetText}
                onChange={(e) => setConfirmResetText(e.target.value.toUpperCase())}
                placeholder="Type RESET to confirm"
                className="font-mono"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmResetText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetStats}
              disabled={confirmResetText !== "RESET" || resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reset All Stats
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
