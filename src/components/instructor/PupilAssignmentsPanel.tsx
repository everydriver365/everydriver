import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Plus,
  Check,
  Clock,
  XCircle,
  Play,
  BookOpen,
  Eye,
  Car,
  Target,
  Trash2,
  Edit,
  Star,
} from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePupilAssignments, PupilAssignment } from "@/hooks/usePupilAssignments";
import { toast } from "sonner";
import { format } from "date-fns";

interface PupilAssignmentsPanelProps {
  pupilId: string;
  instructorId: string;
  pupilName?: string;
}

const assignmentTypeIcons = {
  practice: Car,
  theory: BookOpen,
  observation: Eye,
  manoeuvre: Target,
};

const assignmentTypeLabels = {
  practice: "Practice",
  theory: "Theory",
  observation: "Observation",
  manoeuvre: "Manoeuvre",
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-primary/10 text-primary dark:bg-primary/20", icon: Play },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400", icon: Check },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle },
};

export function PupilAssignmentsPanel({ pupilId, instructorId, pupilName }: PupilAssignmentsPanelProps) {
  const { assignments, isLoading, createAssignment, updateAssignment, deleteAssignment, refetch } = usePupilAssignments({ pupilId });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<PupilAssignment | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignment_type: "practice" as PupilAssignment['assignment_type'],
    due_date: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignment_type: "practice",
      due_date: "",
      notes: "",
    });
    setEditingAssignment(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleEditAssignment = (assignment: PupilAssignment) => {
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      assignment_type: assignment.assignment_type,
      due_date: assignment.due_date || "",
      notes: assignment.notes || "",
    });
    setEditingAssignment(assignment);
    setShowAddDialog(true);
  };

  const handleSaveAssignment = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);
    try {
      if (editingAssignment) {
        const { error } = await updateAssignment(editingAssignment.id, {
          title: formData.title,
          description: formData.description || null,
          assignment_type: formData.assignment_type,
          due_date: formData.due_date || null,
          notes: formData.notes || null,
        });

        if (error) throw new Error(error);
        toast.success("Assignment updated");
      } else {
        const { error } = await createAssignment({
          pupil_id: pupilId,
          instructor_id: instructorId,
          title: formData.title,
          description: formData.description || null,
          assignment_type: formData.assignment_type,
          status: "pending",
          due_date: formData.due_date || null,
          notes: formData.notes || null,
          rating: null,
          feedback: null,
        });

        if (error) throw new Error(error);
        toast.success("Assignment created");
      }

      setShowAddDialog(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (assignment: PupilAssignment, newStatus: PupilAssignment['status']) => {
    const { error } = await updateAssignment(assignment.id, { status: newStatus });
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Assignment marked as ${statusConfig[newStatus].label.toLowerCase()}`);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    
    const { error } = await deleteAssignment(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Assignment deleted");
    }
  };

  const pendingCount = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;

  return (
    <div className="bg-muted/30 rounded-2xl border">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-2xl"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Assignments</span>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingCount} active
            </Badge>
          )}
          {completedCount > 0 && (
            <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              {completedCount} done
            </Badge>
          )}
        </div>
        <ExpandChevron isExpanded={isExpanded} />
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">
              {/* Add Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenAddDialog}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>

              {/* Assignments List */}
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Loading assignments...
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No assignments yet
                </div>
              ) : (
                <div className="space-y-2">
                  {assignments.map((assignment) => {
                    const StatusIcon = statusConfig[assignment.status].icon;
                    const TypeIcon = assignmentTypeIcons[assignment.assignment_type];
                    
                    return (
                      <div
                        key={assignment.id}
                        className="bg-card rounded-2xl shadow-lift border p-3 space-y-2"
                      >
                        {/* Assignment Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm truncate">{assignment.title}</span>
                          </div>
                          <Badge className={`shrink-0 text-xs ${statusConfig[assignment.status].color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[assignment.status].label}
                          </Badge>
                        </div>

                        {/* Description */}
                        {assignment.description && (
                          <p className="text-xs text-muted-foreground">{assignment.description}</p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {assignmentTypeLabels[assignment.assignment_type]}
                          </span>
                          {assignment.due_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due {format(new Date(assignment.due_date), "MMM d")}
                            </span>
                          )}
                          {assignment.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {assignment.rating}/5
                            </span>
                          )}
                        </div>

                        {/* Feedback */}
                        {assignment.feedback && (
                          <div className="bg-muted/50 rounded p-2 text-xs">
                            <span className="font-medium">Feedback:</span> {assignment.feedback}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 pt-1">
                          {assignment.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => handleStatusChange(assignment, 'in_progress')}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {assignment.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-emerald-600"
                              onClick={() => handleStatusChange(assignment, 'completed')}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => handleEditAssignment(assignment)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? "Edit Assignment" : "Add Assignment"}
            </DialogTitle>
            <DialogDescription>
              {editingAssignment 
                ? "Update the assignment details"
                : `Create a new assignment${pupilName ? ` for ${pupilName}` : ""}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Practice parallel parking"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <Select
                value={formData.assignment_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignment_type: value as PupilAssignment['assignment_type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="theory">Theory</SelectItem>
                  <SelectItem value="observation">Observation</SelectItem>
                  <SelectItem value="manoeuvre">Manoeuvre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what the pupil should focus on..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignment} disabled={saving}>
              {saving ? "Saving..." : editingAssignment ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
