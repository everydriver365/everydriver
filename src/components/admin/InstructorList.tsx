import { useState } from "react";
import { MapPin, Car, Edit2, Trash2, User, MoreVertical, UserX, Users, Power, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReassignPupilsDialog } from "./ReassignPupilsDialog";
import { ResetStatsDialog } from "@/components/instructor/ResetStatsDialog";

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
}

interface InstructorListProps {
  instructors: Instructor[];
  onEdit: (instructor: Instructor) => void;
  onRefresh: () => void;
}

export function InstructorList({ instructors, onEdit, onRefresh }: InstructorListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [reassignInstructor, setReassignInstructor] = useState<Instructor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("Instructor archived — can be restored later");
      onRefresh();
    } catch (error: unknown) {
      console.error("Error archiving instructor:", error);
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as any).message)
          : "Failed to archive instructor";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;

    const instructor = instructors.find((i) => i.id === deactivateId);
    const newStatus = !instructor?.is_active;

    setIsDeactivating(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ is_active: newStatus })
        .eq("id", deactivateId);

      if (error) throw error;

      toast.success(
        newStatus
          ? "Instructor activated successfully"
          : "Instructor deactivated successfully"
      );
      onRefresh();
    } catch (error: unknown) {
      console.error("Error updating instructor status:", error);
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as { message: string }).message)
          : "Failed to update instructor status";
      toast.error(message);
    } finally {
      setIsDeactivating(false);
      setDeactivateId(null);
    }
  };

  if (instructors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
        <User className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-2 font-semibold">No instructors yet</h3>
        <p className="text-sm text-muted-foreground">Add your first instructor to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {instructors.map((instructor) => (
          <Card key={instructor.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Header with images */}
              <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                {instructor.car_image_url && (
                  <img
                    src={instructor.car_image_url}
                    alt="Car"
                    className="h-full w-full object-cover opacity-50"
                  />
                )}
                <div className="absolute -bottom-8 left-4">
                  <div className="h-16 w-16 overflow-hidden rounded-xl border-4 border-background bg-muted">
                    {instructor.profile_image_url ? (
                      <img
                        src={instructor.profile_image_url}
                        alt={instructor.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary text-xl font-bold text-primary-foreground">
                        {instructor.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(instructor)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setReassignInstructor(instructor)}>
                        <Users className="mr-2 h-4 w-4" />
                        Reassign Pupils
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeactivateId(instructor.id)}
                      >
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
                </div>
              </div>

              {/* Content */}
              <div className="p-4 pt-10">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{instructor.name}</h3>
                    {instructor.hourly_rate && (
                      <p className="text-sm text-muted-foreground">
                        £{instructor.hourly_rate}/hour
                      </p>
                    )}
                  </div>
                  <Badge variant={instructor.is_active ? "default" : "secondary"}>
                    {instructor.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {instructor.home_postcode} • {instructor.radius_miles} mile radius
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Car className="h-4 w-4" />
                    <span>
                      {instructor.car_type}
                      {instructor.car_make && ` • ${instructor.car_make}`}
                      {instructor.car_model && ` ${instructor.car_model}`}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instructor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this instructor? This will permanently remove all their data including pupils, lessons, and payment history. This action cannot be undone.
              <br /><br />
              <strong>Consider deactivating instead</strong> to keep historical data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={!!deactivateId} onOpenChange={() => setDeactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {instructors.find((i) => i.id === deactivateId)?.is_active
                ? "Deactivate Instructor"
                : "Activate Instructor"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {instructors.find((i) => i.id === deactivateId)?.is_active
                ? "This instructor will be hidden from public searches and course discovery, but all their data will be preserved. They can be reactivated at any time."
                : "This instructor will become visible in public searches and course discovery."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isDeactivating}
            >
              {isDeactivating
                ? "Updating..."
                : instructors.find((i) => i.id === deactivateId)?.is_active
                  ? "Deactivate"
                  : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reassign Pupils Dialog */}
      <ReassignPupilsDialog
        open={!!reassignInstructor}
        onOpenChange={(open) => !open && setReassignInstructor(null)}
        sourceInstructor={reassignInstructor}
        allInstructors={instructors}
        onComplete={onRefresh}
      />
    </>
  );
}
