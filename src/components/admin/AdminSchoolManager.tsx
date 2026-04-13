import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2, Users, CreditCard, GraduationCap, MapPin, Award,
  CalendarDays, FileText, Bell, Palette, Link2, Wallet, Settings,
} from "lucide-react";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

interface SchoolRow {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  enabled_features: Json;
  payment_gateway_mode: string | null;
  created_at: string;
}

const FEATURE_DEFS = [
  // Overview
  { key: "live-map", label: "Live Map", icon: MapPin, group: "Overview" },
  { key: "revenue-analytics", label: "Revenue Analytics", icon: Settings, group: "Overview" },
  { key: "leaderboard", label: "Leaderboard", icon: Award, group: "Overview" },
  // Management
  { key: "instructors", label: "Instructors", icon: Users, group: "Management" },
  { key: "pupils", label: "Pupils", icon: GraduationCap, group: "Management" },
  { key: "bookings", label: "Bookings", icon: CalendarDays, group: "Management" },
  { key: "calendar", label: "Calendar", icon: CalendarDays, group: "Management" },
  { key: "courses", label: "Courses", icon: GraduationCap, group: "Management" },
  { key: "enquiries", label: "Enquiries", icon: Bell, group: "Management" },
  { key: "messages", label: "Messages", icon: Bell, group: "Management" },
  { key: "compliance", label: "Compliance", icon: Award, group: "Management" },
  // Financials
  { key: "payments", label: "Payments", icon: CreditCard, group: "Financials" },
  { key: "payment-gateways", label: "Payment Gateways", icon: CreditCard, group: "Financials" },
  { key: "bnpl", label: "Buy Now, Pay Later", icon: CreditCard, group: "Financials" },
  { key: "payroll", label: "Payroll", icon: Wallet, group: "Financials" },
  { key: "reports", label: "Reports", icon: FileText, group: "Financials" },
  { key: "subscription", label: "Subscription & Billing", icon: CreditCard, group: "Financials" },
  // Operations
  { key: "fleet", label: "Fleet Tracking", icon: MapPin, group: "Operations" },
  { key: "test-results", label: "Test Results", icon: Award, group: "Operations" },
  // Engagement
  { key: "discount-codes", label: "Discount Codes", icon: Settings, group: "Engagement" },
  { key: "campaigns", label: "Campaigns", icon: Bell, group: "Engagement" },
  // Settings
  { key: "branding", label: "Branding", icon: Palette, group: "Settings" },
  { key: "booking-page", label: "School Page", icon: Link2, group: "Settings" },
  { key: "booking-pages", label: "Booking Pages", icon: Link2, group: "Settings" },
  { key: "website", label: "Website", icon: Link2, group: "Settings" },
  { key: "notifications", label: "Notifications", icon: Bell, group: "Settings" },
] as const;

export function AdminSchoolManager() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [instructorCounts, setInstructorCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SchoolRow | null>(null);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchSchools = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("schools")
      .select("id, name, slug, owner_user_id, contact_email, contact_phone, enabled_features, payment_gateway_mode, created_at")
      .order("name");

    if (data) {
      setSchools(data as SchoolRow[]);
      // fetch instructor counts
      const { data: links } = await supabase
        .from("school_instructors")
        .select("school_id");
      if (links) {
        const counts: Record<string, number> = {};
        links.forEach((l: { school_id: string }) => {
          counts[l.school_id] = (counts[l.school_id] || 0) + 1;
        });
        setInstructorCounts(counts);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchSchools(); }, []);

  const openSchool = (s: SchoolRow) => {
    setSelected(s);
    const ef = (typeof s.enabled_features === "object" && s.enabled_features && !Array.isArray(s.enabled_features))
      ? s.enabled_features as Record<string, Json>
      : {};
    const mapped: Record<string, boolean> = {};
    FEATURE_DEFS.forEach(f => {
      mapped[f.key] = ef[f.key] !== false; // default true if missing
    });
    setFeatures(mapped);
  };

  const toggleFeature = (key: string) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveFeatures = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("schools")
      .update({ enabled_features: features as unknown as Json })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save features");
    } else {
      toast.success("Features updated for " + selected.name);
      setSelected(null);
      fetchSchools();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">School Manager</h2>
        <p className="text-sm text-muted-foreground">
          Configure features and functions for each school that uses School Manager.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading schools…</div>
      ) : schools.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p>No schools have been set up yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map(s => (
            <Card
              key={s.id}
              className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-shadow"
              onClick={() => openSchool(s)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {s.payment_gateway_mode === "own" ? "Own Gateway" : "Platform"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">/{s.slug}</p>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{instructorCounts[s.id] || 0} instructors</span>
                </div>
                {s.contact_email && (
                  <p className="text-xs text-muted-foreground truncate">{s.contact_email}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Feature toggles dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selected?.name}
            </DialogTitle>
            <DialogDescription>
              Toggle which School Manager features this school can access.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Info strip */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {instructorCounts[selected.id] || 0} instructors
                </span>
                <span>Gateway: <strong>{selected.payment_gateway_mode === "own" ? "Own" : "Platform"}</strong></span>
                
              </div>

              {/* Feature toggles grouped */}
              {["Overview", "Management", "Financials", "Operations", "Engagement", "Settings"].map(group => {
                const groupFeatures = FEATURE_DEFS.filter(f => f.group === group);
                if (groupFeatures.length === 0) return null;
                return (
                  <div key={group} className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group}</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {groupFeatures.map(f => {
                        const Icon = f.icon;
                        return (
                          <div
                            key={f.key}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`ft-${f.key}`} className="text-sm cursor-pointer">{f.label}</Label>
                            </div>
                            <Switch
                              id={`ft-${f.key}`}
                              checked={features[f.key] ?? true}
                              onCheckedChange={() => toggleFeature(f.key)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveFeatures} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
