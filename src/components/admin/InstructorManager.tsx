import { useState, useEffect, useCallback } from "react";
import { 
  Search, Plus, Edit2, Trash2, Users, Power, 
  MoreVertical, Crown, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArloPageLayout } from "@/components/ui/arlo-page-layout";
import { InstructorForm } from "./InstructorForm";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  max_pupils: number | null;
  sms_credits_monthly: number;
  features: unknown; // JSON type
  display_order: number;
  is_active: boolean;
}

interface Instructor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  home_postcode: string;
  radius_miles: number;
  car_type: string;
  car_make: string | null;
  car_model: string | null;
  profile_image_url: string | null;
  car_image_url: string | null;
  bio: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
  website_slug?: string | null;
  pupil_count?: number;
  completed_courses?: number;
  subscription?: {
    plan_id: string;
    plan_name: string;
    plan_slug: string;
    status: string;
  } | null;
}

interface InstructorManagerProps {
  onEdit: (instructor: Instructor) => void;
  onViewProfile?: (instructorId: string) => void;
}

// Plan badge component with color coding
function PlanBadge({ planSlug, planName }: { planSlug?: string; planName?: string }) {
  const getPlanStyle = (slug?: string) => {
    switch (slug) {
      case "pro":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "max":
        return "bg-purple-500/10 text-purple-600 border-purple-500/30";
      case "multi":
        return "bg-accent/10 text-accent border-accent/30";
      case "enterprise":
        return "bg-primary/10 text-primary border-primary/30";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const displayName = planName || "Free";
  const icon = planSlug === "enterprise" || planSlug === "multi" ? (
    <Crown className="h-3 w-3 mr-1" />
  ) : planSlug === "max" || planSlug === "pro" ? (
    <Sparkles className="h-3 w-3 mr-1" />
  ) : null;

  return (
    <Badge variant="outline" className={cn("text-xs", getPlanStyle(planSlug))}>
      {icon}
      {displayName}
    </Badge>
  );
}

export function InstructorManager({ onEdit, onViewProfile }: InstructorManagerProps) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("active");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .order("name");

      if (error) throw error;

      // Get pupil counts for each instructor
      const instructorIds = (data || []).map(i => i.id);
      const { data: pupilCounts } = await supabase
        .from("pupils")
        .select("instructor_id")
        .in("instructor_id", instructorIds);

      // Get subscriptions for each instructor
      const { data: subscriptions } = await supabase
        .from("instructor_subscriptions")
        .select("instructor_id, plan_id, status, subscription_plans(name, slug)")
        .in("instructor_id", instructorIds);

      const countMap: Record<string, number> = {};
      pupilCounts?.forEach(p => {
        countMap[p.instructor_id] = (countMap[p.instructor_id] || 0) + 1;
      });

      const subMap: Record<string, Instructor["subscription"]> = {};
      subscriptions?.forEach((s: any) => {
        subMap[s.instructor_id] = {
          plan_id: s.plan_id,
          plan_name: s.subscription_plans?.name || "Unknown",
          plan_slug: s.subscription_plans?.slug || "free",
          status: s.status,
        };
      });

      const enrichedData = (data || []).map(i => ({
        ...i,
        pupil_count: countMap[i.id] || 0,
        subscription: subMap[i.id] || null,
      }));

      setInstructors(enrichedData);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast.error("Failed to load instructors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Instructor deleted");
      fetchInstructors();
    } catch (error) {
      console.error("Error deleting instructor:", error);
      toast.error("Failed to delete instructor");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (instructor: Instructor) => {
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ is_active: !instructor.is_active })
        .eq("id", instructor.id);

      if (error) throw error;
      toast.success(instructor.is_active ? "Instructor deactivated" : "Instructor activated");
      fetchInstructors();
    } catch (error) {
      console.error("Error updating instructor:", error);
      toast.error("Failed to update instructor");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInstructors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInstructors.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Filter instructors
  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch = 
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.home_postcode.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "active") return matchesSearch && instructor.is_active;
    if (activeFilter === "inactive") return matchesSearch && !instructor.is_active;
    if (activeFilter === "with-pupils") return matchesSearch && (instructor.pupil_count || 0) > 0;
    if (activeFilter === "no-pupils") return matchesSearch && (instructor.pupil_count || 0) === 0;
    return matchesSearch;
  });

  // Stats
  const stats = {
    total: instructors.length,
    active: instructors.filter(i => i.is_active).length,
    inactive: instructors.filter(i => !i.is_active).length,
  };

  const statusFilters = [
    { id: "all", label: "All", count: stats.total },
    { id: "active", label: "Active", count: stats.active, color: "text-emerald-600" },
    { id: "inactive", label: "Inactive", count: stats.inactive, color: "text-muted-foreground" },
    { id: "with-pupils", label: "With Pupils", count: instructors.filter(i => (i.pupil_count || 0) > 0).length },
    { id: "no-pupils", label: "No Pupils", count: instructors.filter(i => (i.pupil_count || 0) === 0).length, color: "text-amber-600" },
  ];

  const arloStats = [
    { value: stats.total, label: "Instructors" },
    { value: stats.active, label: "Active", color: "success" as const },
    { value: stats.inactive, label: "Inactive", color: "muted" as const },
  ];

  const handleEditInstructor = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setIsFormOpen(true);
  };

  return (
    <ArloPageLayout
      stats={arloStats}
      filters={statusFilters}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button onClick={() => { setEditingInstructor(null); setIsFormOpen(true); }} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Instructor
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filteredInstructors.length} items</span>
          <Button variant="link" size="sm" onClick={toggleSelectAll} className="text-primary">
            Select all
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search instructors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredInstructors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="mb-2 h-12 w-12 opacity-50" />
          <p>No instructors found</p>
        </div>
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedIds.size === filteredInstructors.length && filteredInstructors.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-primary font-semibold">Name</TableHead>
                  <TableHead className="text-primary font-semibold">Email</TableHead>
                  <TableHead className="text-primary font-semibold hidden md:table-cell">Phone</TableHead>
                  <TableHead className="text-primary font-semibold hidden lg:table-cell">Location</TableHead>
                  <TableHead className="text-primary font-semibold text-center">Plan</TableHead>
                  <TableHead className="text-primary font-semibold text-center">Pupils</TableHead>
                  <TableHead className="text-primary font-semibold text-center">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstructors.map((instructor) => (
                  <TableRow 
                    key={instructor.id}
                    className={cn(
                      "hover:bg-muted/50",
                      selectedIds.has(instructor.id) && "bg-primary/5"
                    )}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(instructor.id)}
                        onCheckedChange={() => toggleSelect(instructor.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                          {instructor.profile_image_url ? (
                            <img 
                              src={instructor.profile_image_url} 
                              alt={instructor.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-primary">
                              {instructor.name.split(" ").map(n => n[0]).join("")}
                            </span>
                          )}
                        </div>
                        <button 
                          className="text-primary hover:underline text-left font-medium"
                          onClick={() => onViewProfile ? onViewProfile(instructor.id) : null}
                        >
                          {instructor.name}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {instructor.email ? (
                        <a href={`mailto:${instructor.email}`} className="text-primary hover:underline text-sm">
                          {instructor.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {instructor.phone || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {instructor.home_postcode}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanDialogInstructor(instructor);
                          setSelectedPlanId(instructor.subscription?.plan_id || "");
                        }}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <PlanBadge planSlug={instructor.subscription?.plan_slug} planName={instructor.subscription?.plan_name} />
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-medium",
                        (instructor.pupil_count || 0) > 0 ? "text-primary" : "text-muted-foreground"
                      )}>
                        {instructor.pupil_count || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {instructor.is_active ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedInstructor(instructor)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditInstructor(instructor)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setReassignInstructor(instructor)}>
                            <Users className="mr-2 h-4 w-4" />
                            Reassign Pupils
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setPlanDialogInstructor(instructor);
                            setSelectedPlanId(instructor.subscription?.plan_id || "");
                          }}>
                            <Crown className="mr-2 h-4 w-4" />
                            Change Plan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleActive(instructor)}>
                            <Power className="mr-2 h-4 w-4" />
                            {instructor.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(instructor.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Instructor Details Dialog — Combined Layout */}
      <Dialog open={!!selectedInstructor} onOpenChange={() => setSelectedInstructor(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Instructor Details</DialogTitle>
          </DialogHeader>
          {selectedInstructor && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: Activity Timeline (1/3) */}
              <div className="lg:col-span-1">
                <div className="bg-muted/30 border border-border rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Overview
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{selectedInstructor.email || "No email"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedInstructor.phone || "No phone"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedInstructor.home_postcode} ({selectedInstructor.radius_miles} mi)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedInstructor.pupil_count || 0} pupils</span>
                    </div>
                    {selectedInstructor.car_type && (
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        <p className="text-muted-foreground text-xs mb-1">Vehicle</p>
                        <p className="font-medium">{selectedInstructor.car_make} {selectedInstructor.car_model} ({selectedInstructor.car_type})</p>
                      </div>
                    )}
                    {selectedInstructor.bio && (
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        <p className="text-muted-foreground text-xs mb-1">Bio</p>
                        <p>{selectedInstructor.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Dashboard Cards (2/3) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedInstructor.profile_image_url ? (
                      <img src={selectedInstructor.profile_image_url} alt={selectedInstructor.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-medium text-primary">
                        {selectedInstructor.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{selectedInstructor.name}</h3>
                      <Badge variant={selectedInstructor.is_active ? "default" : "secondary"}>
                        {selectedInstructor.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <PlanBadge planSlug={selectedInstructor.subscription?.plan_slug} planName={selectedInstructor.subscription?.plan_name} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedInstructor.email}</p>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4">
                    <div className="text-xs text-muted-foreground mb-1">Pupils</div>
                    <div className="text-2xl font-bold">{selectedInstructor.pupil_count || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="text-xs text-muted-foreground mb-1">Rate</div>
                    <div className="text-2xl font-bold">{selectedInstructor.hourly_rate ? `£${selectedInstructor.hourly_rate}/hr` : "—"}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="text-xs text-muted-foreground mb-1">Coverage</div>
                    <div className="text-2xl font-bold">{selectedInstructor.radius_miles} mi</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => { handleEditInstructor(selectedInstructor); setSelectedInstructor(null); }}>
                    <Edit2 className="mr-2 h-4 w-4" /> Edit Instructor
                  </Button>
                  {selectedInstructor.website_slug && (
                    <Button variant="outline" asChild>
                      <a href={`/instructor/${selectedInstructor.website_slug}`} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-2 h-4 w-4" /> View Website
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instructor?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the instructor
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reassign Pupils Dialog */}
      <ReassignPupilsDialog
        open={!!reassignInstructor}
        onOpenChange={() => setReassignInstructor(null)}
        sourceInstructor={reassignInstructor}
        allInstructors={instructors}
        onComplete={fetchInstructors}
      />

      {/* Add/Edit Instructor Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInstructor ? "Edit Instructor" : "Add New Instructor"}
            </DialogTitle>
          </DialogHeader>
          <InstructorForm
            onSuccess={() => { setIsFormOpen(false); fetchInstructors(); }}
            onCancel={() => setIsFormOpen(false)}
            initialData={editingInstructor || undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={!!planDialogInstructor} onOpenChange={() => setPlanDialogInstructor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              Change Subscription Plan
            </DialogTitle>
            <DialogDescription>
              Select a plan for {planDialogInstructor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId} className="space-y-3">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                    selectedPlanId === plan.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <RadioGroupItem value={plan.id} id={plan.id} />
                  <div className="flex-1">
                    <Label htmlFor={plan.id} className="font-medium cursor-pointer flex items-center gap-2">
                      {plan.name}
                      {(plan.slug === "multi" || plan.slug === "enterprise") && (
                        <Crown className="h-3.5 w-3.5 text-accent" />
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {plan.price_monthly === 0 ? "Free" : `£${plan.price_monthly}/month`}
                      {plan.max_pupils ? ` • Up to ${plan.max_pupils} pupils` : " • Unlimited pupils"}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPlanDialogInstructor(null)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!planDialogInstructor || !selectedPlanId) return;
                setSavingPlan(true);
                
                // Check if subscription exists
                const { data: existing } = await supabase
                  .from("instructor_subscriptions")
                  .select("id")
                  .eq("instructor_id", planDialogInstructor.id)
                  .single();
                
                if (existing) {
                  // Update existing
                  const { error } = await supabase
                    .from("instructor_subscriptions")
                    .update({ plan_id: selectedPlanId, status: "active" })
                    .eq("instructor_id", planDialogInstructor.id);
                  
                  if (error) {
                    toast.error("Failed to update plan");
                  } else {
                    toast.success("Plan updated successfully");
                    fetchInstructors();
                    setPlanDialogInstructor(null);
                  }
                } else {
                  // Insert new
                  const { error } = await supabase
                    .from("instructor_subscriptions")
                    .insert({
                      instructor_id: planDialogInstructor.id,
                      plan_id: selectedPlanId,
                      status: "active",
                    });
                  
                  if (error) {
                    toast.error("Failed to assign plan");
                  } else {
                    toast.success("Plan assigned successfully");
                    fetchInstructors();
                    setPlanDialogInstructor(null);
                  }
                }
                setSavingPlan(false);
              }}
              disabled={savingPlan || !selectedPlanId}
            >
              {savingPlan ? "Saving..." : "Save Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ArloPageLayout>
  );
}
