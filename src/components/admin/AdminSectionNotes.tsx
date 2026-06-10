import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionNote {
  id: string;
  section_key: string;
  title: string;
  content: string;
  display_order: number;
  is_visible: boolean;
  note_type: string;
  created_at: string;
  updated_at: string;
}

interface AdminSectionNotesProps {
  sectionKey: string;
  className?: string;
}

const NOTE_TYPES = [
  { value: "info", label: "Information", icon: Info, color: "text-blue-500 bg-blue-500/10" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10" },
  { value: "success", label: "Success", icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10" },
  { value: "tip", label: "Tip", icon: Lightbulb, color: "text-purple-500 bg-purple-500/10" },
];

export function AdminSectionNotes({ sectionKey, className }: AdminSectionNotesProps) {
  const [notes, setNotes] = useState<SectionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<SectionNote | null>(null);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<SectionNote | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState("info");

  useEffect(() => {
    fetchNotes();
  }, [sectionKey]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_section_notes")
        .select("*")
        .eq("section_key", sectionKey)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setNoteType("info");
    setDialogOpen(true);
  };

  const openEditDialog = (note: SectionNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setNoteType(note.note_type);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      if (editingNote) {
        const { error } = await supabase
          .from("admin_section_notes")
          .update({
            title: title.trim(),
            content: content.trim(),
            note_type: noteType,
          })
          .eq("id", editingNote.id);

        if (error) throw error;
        toast.success("Note updated");
      } else {
        const maxOrder = notes.length > 0 ? Math.max(...notes.map(n => n.display_order)) : -1;
        const { error } = await supabase
          .from("admin_section_notes")
          .insert({
            section_key: sectionKey,
            title: title.trim(),
            content: content.trim(),
            note_type: noteType,
            display_order: maxOrder + 1,
          });

        if (error) throw error;
        toast.success("Note added");
      }

      setDialogOpen(false);
      fetchNotes();
    } catch (err: any) {
      console.error("Error saving note:", err);
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (note: SectionNote) => {
    try {
      const { error } = await supabase
        .from("admin_section_notes")
        .update({ is_visible: !note.is_visible })
        .eq("id", note.id);

      if (error) throw error;
      setNotes(notes.map(n => n.id === note.id ? { ...n, is_visible: !n.is_visible } : n));
    } catch (err) {
      toast.error("Failed to update visibility");
    }
  };

  const deleteNote = async (note: SectionNote) => {
    if (!confirm("Delete this note?")) return;

    try {
      const { error } = await supabase
        .from("admin_section_notes")
        .delete()
        .eq("id", note.id);

      if (error) throw error;
      toast.success("Note deleted");
      setNotes(notes.filter(n => n.id !== note.id));
    } catch (err) {
      toast.error("Failed to delete note");
    }
  };

  const visibleNotes = notes.filter(n => n.is_visible);

  if (loading) {
    return null;
  }

  const getNoteTypeConfig = (type: string) => {
    return NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0];
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Display visible notes */}
      {visibleNotes.map((note) => {
        const typeConfig = getNoteTypeConfig(note.note_type);
        const Icon = typeConfig.icon;
        
        return (
          <div
            key={note.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border",
              typeConfig.color
            )}
          >
            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{note.title}</h4>
              <p className="text-sm opacity-80 mt-0.5 whitespace-pre-wrap">{note.content}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openEditDialog(note)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => toggleVisibility(note)}
              >
                <EyeOff className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteNote(note)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}

      {/* Add note button & hidden notes count */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openAddDialog}
          className="text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Note
        </Button>
        {notes.length > visibleNotes.length && (
          <Badge variant="secondary" className="text-xs">
            {notes.length - visibleNotes.length} hidden
          </Badge>
        )}
      </div>

      {/* Hidden notes (collapsed) */}
      {notes.filter(n => !n.is_visible).length > 0 && (
        <div className="space-y-1">
          {notes.filter(n => !n.is_visible).map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-2 p-2 rounded bg-muted/50 text-muted-foreground text-xs"
            >
              <EyeOff className="h-3 w-3" />
              <span className="flex-1 truncate">{note.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleVisibility(note)}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => openEditDialog(note)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Edit Note" : "Add Note"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Note content..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingNote ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
