import { useState, useEffect, useCallback } from "react";
import { 
  Search, Plus, Edit2, Trash2, Users, Power, 
  MoreVertical, Crown, Sparkles, RotateCcw, ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLogger";
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
                      <PlanBadge planSlug={instructor.subscription?.plan_slug} planName={instructor.subscription?.plan_name} />
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
                          <DropdownMenuItem onClick={() => onViewProfile?.(instructor.id)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            View / Edit Profile
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
    </ArloPageLayout>
  );
}
