import { useState, useEffect } from "react";
import { PlanFeatureDescriptionsManager } from "./PlanFeatureDescriptionsManager";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Pencil, Trash2, Star, GripVertical, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  description: string | null;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  cta_text: string | null;
  max_pupils: number | null;
  sms_credits_monthly: number | null;
  display_order: number;
  gocardless_plan_id: string | null;
  show_contact_us: boolean;
  commission_rate_percent: number | null;
  commission_fixed_pence: number | null;
}

const defaultPlan: Omit<SubscriptionPlan, "id"> = {
  name: "",
  slug: "",
  price_monthly: 0,
  price_yearly: null,
  description: "",
  features: [],
  is_active: true,
  is_popular: false,
  cta_text: "Get Started",
  max_pupils: null,
  sms_credits_monthly: 0,
  display_order: 0,
  gocardless_plan_id: null,
  show_contact_us: false,
  commission_rate_percent: null,
  commission_fixed_pence: null,
};

export function SubscriptionPlansManager() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to fetch plans");
      return;
    }

    const typedPlans = (data || []).map((plan) => ({
      ...plan,
      features: (plan.features as string[]) || [],
      is_popular: plan.is_popular || false,
      show_contact_us: (plan as any).show_contact_us || false,
      commission_rate_percent: (plan as any).commission_rate_percent ?? null,
      commission_fixed_pence: (plan as any).commission_fixed_pence ?? null,
    }));
    setPlans(typedPlans);
    setLoading(false);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan({
      id: "",
      ...defaultPlan,
      display_order: plans.length + 1,
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    const planData = {
      name: editingPlan.name,
      slug: editingPlan.slug,
      price_monthly: editingPlan.price_monthly,
      price_yearly: editingPlan.price_yearly,
      description: editingPlan.description,
      features: editingPlan.features,
      is_active: editingPlan.is_active,
      is_popular: editingPlan.is_popular,
      cta_text: editingPlan.cta_text,
      max_pupils: editingPlan.max_pupils,
      sms_credits_monthly: editingPlan.sms_credits_monthly,
      display_order: editingPlan.display_order,
      gocardless_plan_id: editingPlan.gocardless_plan_id,
      show_contact_us: editingPlan.show_contact_us,
      commission_rate_percent: editingPlan.commission_rate_percent,
      commission_fixed_pence: editingPlan.commission_fixed_pence,
    };

    if (isCreating) {
      const { error } = await supabase
        .from("subscription_plans")
        .insert(planData);

      if (error) {
        toast.error("Failed to create plan");
        return;
      }
      toast.success("Plan created successfully");
    } else {
      const { error } = await supabase
        .from("subscription_plans")
        .update(planData)
        .eq("id", editingPlan.id);

      if (error) {
        toast.error("Failed to update plan");
        return;
      }
      toast.success("Plan updated successfully");
    }

    setIsDialogOpen(false);
    setEditingPlan(null);
    fetchPlans();
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    const { error } = await supabase
      .from("subscription_plans")
      .delete()
      .eq("id", planId);

    if (error) {
      toast.error("Failed to delete plan");
      return;
    }

    toast.success("Plan deleted successfully");
    fetchPlans();
  };

  const handleSetPopular = async (planId: string) => {
    // First, unset all popular flags
    await supabase
      .from("subscription_plans")
      .update({ is_popular: false })
      .neq("id", "none");

    // Then set the selected one
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_popular: true })
      .eq("id", planId);

    if (error) {
      toast.error("Failed to update popular plan");
      return;
    }

    toast.success("Popular plan updated");
    fetchPlans();
  };

  const addFeature = () => {
    if (!newFeature.trim() || !editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, newFeature.trim()],
    });
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index),
    });
  };

  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.is_active).length,
    paid: plans.filter((p) => p.price_monthly > 0).length,
  };

  if (loading) {
    return <div className="p-6">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Plans</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Plans</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid Plans</CardDescription>
            <CardTitle className="text-3xl">{stats.paid}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Subscription Plans</h2>
          <p className="text-sm text-muted-foreground">
            Manage pricing tiers and features
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/instructor/plans"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview Plans Page
          </a>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </div>

      {/* Plans Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {plan.slug}
                        </div>
                      </div>
                      {plan.is_popular && (
                        <Badge className="bg-amber-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        £{plan.price_monthly}/mo
                      </div>
                      {plan.price_yearly && (
                        <div className="text-xs text-muted-foreground">
                          £{plan.price_yearly}/yr
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>
                        Pupils:{" "}
                        {plan.max_pupils === null
                          ? "Unlimited"
                          : plan.max_pupils}
                      </div>
                      <div className="text-muted-foreground">
                        SMS: {plan.sms_credits_monthly || 0}/mo
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {plan.features.length} features
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={plan.is_active ? "default" : "secondary"}
                    >
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetPopular(plan.id)}
                        title="Set as popular"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            plan.is_popular
                              ? "fill-amber-500 text-amber-500"
                              : ""
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Create Plan" : "Edit Plan"}
            </DialogTitle>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, name: e.target.value })
                    }
                    placeholder="e.g. Pro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editingPlan.slug}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, slug: e.target.value })
                    }
                    placeholder="e.g. pro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingPlan.description || ""}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of the plan"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Price (£)</Label>
                  <Input
                    type="number"
                    value={editingPlan.price_monthly}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        price_monthly: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yearly Price (£)</Label>
                  <Input
                    type="number"
                    value={editingPlan.price_yearly || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        price_yearly: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Commission Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingPlan.commission_rate_percent ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        commission_rate_percent: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g. 2.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Platform fee % per card payment
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Fixed Fee (pence)</Label>
                  <Input
                    type="number"
                    value={editingPlan.commission_fixed_pence ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        commission_fixed_pence: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g. 20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fixed fee in pence per transaction
                  </p>
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max Pupils</Label>
                  <Input
                    type="number"
                    value={editingPlan.max_pupils || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        max_pupils: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMS Credits/Month</Label>
                  <Input
                    type="number"
                    value={editingPlan.sms_credits_monthly || 0}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        sms_credits_monthly: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={editingPlan.display_order}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        display_order: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Input
                  value={editingPlan.cta_text || ""}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, cta_text: e.target.value })
                  }
                  placeholder="e.g. Get Started"
                />
              </div>

              {/* GoCardless Integration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  GoCardless Plan ID
                  <span className="text-xs text-muted-foreground font-normal">
                    (for recurring payments)
                  </span>
                </Label>
                <Input
                  value={editingPlan.gocardless_plan_id || ""}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, gocardless_plan_id: e.target.value || null })
                  }
                  placeholder="e.g. PLN_xxxxxxxx"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Create a plan in GoCardless dashboard and paste the ID here
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyDown={(e) => e.key === "Enter" && addFeature()}
                  />
                  <Button type="button" onClick={addFeature}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editingPlan.features.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {feature}
                      <button
                        onClick={() => removeFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPlan.is_active}
                    onCheckedChange={(checked) =>
                      setEditingPlan({ ...editingPlan, is_active: checked })
                    }
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPlan.is_popular}
                    onCheckedChange={(checked) =>
                      setEditingPlan({ ...editingPlan, is_popular: checked })
                    }
                  />
                  <Label>Popular Badge</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPlan.show_contact_us}
                    onCheckedChange={(checked) =>
                      setEditingPlan({ ...editingPlan, show_contact_us: checked })
                    }
                  />
                  <Label>Show "Contact Us" instead of price</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isCreating ? "Create Plan" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Descriptions Section */}
      <div className="border-t pt-6">
        <PlanFeatureDescriptionsManager />
      </div>
    </div>
  );
}
