import { useState } from "react";
import { StickyNote, ChevronRight, Plus, Pencil, Trash2, Share2, X, Check, Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotes } from "@/hooks/useNotes";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface NotesWidgetProps {
  instructorId: string;
}

export function NotesWidget({ instructorId }: NotesWidgetProps) {
  const {
    notes,
    loading,
    updateNote,
    deleteNote,
    restoreNote,
    activeFolder,
  } = useNotes({
    ownerType: "instructor",
    ownerId: instructorId,
    folders: ["General", "Lessons", "Pupils", "Personal"],
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [sharingId, setSharingId] = useState<string | null>(null);

  const { data: pupils } = useQuery({
    queryKey: ["instructor-pupils-names", instructorId],
    queryFn: async () => {
      const { data } = await (supabase.from("pupils") as any)
        .select("id, name")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .order("name");
      return (data || []) as { id: string; name: string }[];
    },
    enabled: !!instructorId,
  });

  const recentNotes = notes.slice(0, 4);

  const startEdit = (note: { id: string; title: string; content: string }) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content?.replace(/<[^>]*>/g, "") || "");
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateNote(editingId, { title: editTitle, content: editContent });
    setEditingId(null);
    toast.success("Note updated");
  };

  const handleShare = async (noteId: string, pupilId: string) => {
    await updateNote(noteId, { shared_with_id: pupilId || null } as any);
    setSharingId(null);
    toast.success(pupilId ? "Note shared with pupil" : "Sharing removed");
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    if (editingId === id) setEditingId(null);
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-amber-500" />
            <h3 className="font-medium text-sm text-foreground">Notes</h3>
            {notes.length > 0 && (
              <span className="text-[10px] font-medium bg-amber-500/10 text-amber-600 px-1.5 py-0.5">
                {notes.length}
              </span>
            )}
          </div>
          <Link to="/instructor/notes">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="py-4 text-center text-xs text-muted-foreground">Loading...</div>
        ) : recentNotes.length === 0 ? (
          <Link
            to="/instructor/notes"
            className="block py-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4 mx-auto mb-1 opacity-50" />
            Create your first note
          </Link>
        ) : (
          <div className="space-y-1.5">
            {recentNotes.map((note) => {
              if (editingId === note.id) {
                return (
                  <div key={note.id} className="p-2 rounded-2xl border border-border space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="h-7 text-sm"
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Content..."
                      className="text-xs min-h-[60px] resize-none"
                    />
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" className="h-6 px-2 text-xs" onClick={saveEdit}>
                        <Check className="h-3 w-3 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                );
              }

              if (sharingId === note.id) {
                return (
                  <div key={note.id} className="p-2 rounded-2xl border border-border space-y-2">
                    <p className="text-xs font-medium truncate">Share "{note.title}"</p>
                    <Select
                      value={note.shared_with_id || ""}
                      onValueChange={(val) => handleShare(note.id, val)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select pupil..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No one (remove sharing)</SelectItem>
                        {(pupils || []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs w-full" onClick={() => setSharingId(null)}>
                      Cancel
                    </Button>
                  </div>
                );
              }

              const isDeleted = !!note.deleted_at;

              return (
                <div
                  key={note.id}
                  className={`flex items-start gap-2 p-2 rounded-2xl hover:bg-muted/50 transition-colors group ${isDeleted ? "opacity-50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {note.title || "Untitled"}
                      {note.shared_with_id && (
                        <Share2 className="inline h-3 w-3 ml-1 text-primary" />
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {note.content?.replace(/<[^>]*>/g, "").slice(0, 60) || "Empty note"}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isDeleted ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => restoreNote(note.id)}
                        title="Restore"
                      >
                        <Undo2 className="h-3 w-3" />
                      </Button>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(note)} title="Edit">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSharingId(note.id)} title="Share">
                          <Share2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(note.id)} title="Delete">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {format(new Date(note.updated_at), "d MMM")}
                  </span>
                </div>
              );
            })}
            {notes.length > 4 && (
              <Link
                to="/instructor/notes"
                className="block text-center text-xs text-primary font-medium pt-1 hover:underline"
              >
                View all {notes.length} notes →
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
