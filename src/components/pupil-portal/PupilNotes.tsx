import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft, Pin, Search, MoreVertical, Trash2, StickyNote, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Note {
  id: string;
  owner_type: string;
  owner_id: string;
  shared_with_id: string | null;
  title: string;
  content: string;
  is_pinned: boolean;
  folder: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PupilNotesProps {
  pupilId: string;
  instructorId: string;
  brandColour: string | null;
  instructorName?: string;
}

async function invokeNotes(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("pupil-notes", { body });
  if (error) throw error;
  return data;
}

export function PupilNotes({ pupilId, instructorId, brandColour, instructorName }: PupilNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "editor">("list");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchNotes = useCallback(async () => {
    try {
      const result = await invokeNotes({ action: "list", pupil_id: pupilId });
      setNotes((result.own as Note[]) || []);
      setSharedNotes((result.shared as Note[]) || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  }, [pupilId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const allNotes = [...notes, ...sharedNotes].filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const createNote = async () => {
    try {
      const result = await invokeNotes({ action: "create", pupil_id: pupilId });
      const n = result.note as Note;
      setNotes((prev) => [n, ...prev]);
      selectNote(n);
    } catch {
      toast.error("Failed to create note");
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setView("editor");
  };

  const isReadOnly = selectedNote?.owner_type === "instructor";

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote({ title: val }), 1000);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote({ content: val }), 1000);
  };

  const saveNote = async (updates: Partial<Note>) => {
    if (!selectedNote || isReadOnly) return;
    try {
      await invokeNotes({ action: "update", pupil_id: pupilId, note_id: selectedNote.id, ...updates });
      setNotes((prev) => prev.map((n) => n.id === selectedNote.id ? { ...n, ...updates } : n));
    } catch {
      toast.error("Failed to save");
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await invokeNotes({ action: "delete", pupil_id: pupilId, note_id: id });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) { setSelectedNote(null); setView("list"); }
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const togglePin = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    try {
      await invokeNotes({ action: "update", pupil_id: pupilId, note_id: id, is_pinned: !note.is_pinned });
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, is_pinned: !n.is_pinned } : n));
    } catch {
      toast.error("Failed to update");
    }
  };

  if (view === "editor" && selectedNote) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView("list")} style={{ color: 'var(--brand-text)' }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {isReadOnly && (
            <Badge style={{ backgroundColor: `${brandColour}20`, color: brandColour || '#1e3a5f' }}>
              <User className="h-3 w-3 mr-1" /> From {instructorName || "Instructor"}
            </Badge>
          )}
        </div>
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          readOnly={isReadOnly}
          className="text-lg font-semibold border-0 px-0 focus-visible:ring-0"
          style={{ backgroundColor: 'transparent', color: 'var(--brand-text)' }}
          placeholder="Note title..."
        />
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          readOnly={isReadOnly}
          className="min-h-[300px] border-0 px-0 focus-visible:ring-0 resize-none text-sm leading-relaxed"
          style={{ backgroundColor: 'transparent', color: 'var(--brand-text)' }}
          placeholder="Start writing..."
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--brand-muted)' }} />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
            style={{ backgroundColor: 'var(--brand-card)', color: 'var(--brand-text)', borderColor: 'var(--brand-border)' }}
          />
        </div>
        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          style={{ backgroundColor: brandColour || '#1e3a5f', color: '#fff' }}
          onClick={createNote}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {allNotes.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--brand-muted)' }}>
          <StickyNote className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No notes yet. Create your first note!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allNotes.map((note) => (
            <Card
              key={note.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}
              onClick={() => selectNote(note)}
            >
              <CardContent className="p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {note.is_pinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
                    <span className="font-medium text-sm truncate" style={{ color: 'var(--brand-text)' }}>
                      {note.title || "Untitled"}
                    </span>
                    {note.owner_type === "instructor" && (
                      <Badge variant="outline" className="text-[9px] px-1.5 shrink-0" style={{ borderColor: brandColour || '#1e3a5f', color: brandColour || '#1e3a5f' }}>
                        Instructor
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--brand-muted)' }}>
                    {note.content?.substring(0, 60) || "No content"}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--brand-muted)', opacity: 0.6 }}>
                    {format(new Date(note.updated_at), "dd/MM/yy")}
                  </p>
                </div>
                {note.owner_type === "pupil" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-black/5" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" style={{ color: 'var(--brand-muted)' }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => togglePin(note.id)}>
                        <Pin className="h-4 w-4 mr-2" /> {note.is_pinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteNote(note.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
