import { useState, useEffect } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useNotes } from "@/hooks/useNotes";
import { NotesLayout } from "@/components/notes/NotesLayout";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

const INSTRUCTOR_FOLDERS = ["General", "Lessons", "Pupils", "Personal"];

export default function InstructorNotes() {
  const { instructor } = useInstructorAuth();
  const notesHook = useNotes({
    ownerType: "instructor",
    ownerId: instructor?.id,
    folders: INSTRUCTOR_FOLDERS,
  });

  const [pupils, setPupils] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!instructor?.id) return;
    supabase
      .from("pupils")
      .select("id, name")
      .eq("instructor_id", instructor.id)
      .order("name")
      .then(({ data }) => setPupils(data || []));
  }, [instructor?.id]);

  const handleShareChange = (pupilId: string) => {
    if (!notesHook.selectedNote) return;
    const sharedId = pupilId === "none" ? null : pupilId;
    notesHook.updateNote(notesHook.selectedNote.id, { shared_with_id: sharedId } as any);
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Notes</h1>
          <p className="text-sm text-muted-foreground">Your personal notebook</p>
        </div>

        <NotesLayout
          notes={notesHook.notes}
          selectedNote={notesHook.selectedNote}
          searchQuery={notesHook.searchQuery}
          onSearchChange={notesHook.setSearchQuery}
          activeFolder={notesHook.activeFolder}
          onFolderChange={notesHook.setActiveFolder}
          folders={INSTRUCTOR_FOLDERS}
          onSelectNote={notesHook.setSelectedNote}
          onCreateNote={notesHook.createNote}
          onDeleteNote={notesHook.deleteNote}
          onRestoreNote={notesHook.restoreNote}
          onPermanentlyDelete={notesHook.permanentlyDelete}
          onTogglePin={notesHook.togglePin}
          onMoveToFolder={(id, folder) => notesHook.updateNote(id, { folder })}
          onUpdateNote={notesHook.debouncedUpdate}
          editorExtras={
            notesHook.selectedNote && !notesHook.selectedNote.deleted_at ? (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Share with pupil:</span>
                <Select
                  value={notesHook.selectedNote.shared_with_id || "none"}
                  onValueChange={handleShareChange}
                >
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <SelectValue placeholder="Not shared" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not shared</SelectItem>
                    {pupils.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {notesHook.selectedNote.shared_with_id && (
                  <Badge variant="secondary" className="text-[10px]">Shared</Badge>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
    </InstructorPortalLayout>
  );
}
