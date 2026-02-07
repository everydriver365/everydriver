import { useNotes } from "@/hooks/useNotes";
import { NotesLayout } from "@/components/notes/NotesLayout";
import { useAdminAuth } from "@/context/AdminAuthContext";

const ADMIN_FOLDERS = ["General", "Instructors", "Operations", "Internal"];

// Admin notes use a fixed owner_id since admin is authenticated via admin auth context
const ADMIN_OWNER_ID = "00000000-0000-0000-0000-000000000001";

export function AdminNotesManager() {
  const notesHook = useNotes({
    ownerType: "admin",
    ownerId: ADMIN_OWNER_ID,
    folders: ADMIN_FOLDERS,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Admin Notes</h2>
        <p className="text-sm text-muted-foreground">Private notes for the admin team</p>
      </div>
      <NotesLayout
        notes={notesHook.notes}
        selectedNote={notesHook.selectedNote}
        searchQuery={notesHook.searchQuery}
        onSearchChange={notesHook.setSearchQuery}
        activeFolder={notesHook.activeFolder}
        onFolderChange={notesHook.setActiveFolder}
        folders={ADMIN_FOLDERS}
        onSelectNote={notesHook.setSelectedNote}
        onCreateNote={notesHook.createNote}
        onDeleteNote={notesHook.deleteNote}
        onRestoreNote={notesHook.restoreNote}
        onPermanentlyDelete={notesHook.permanentlyDelete}
        onTogglePin={notesHook.togglePin}
        onMoveToFolder={(id, folder) => notesHook.updateNote(id, { folder })}
        onUpdateNote={notesHook.debouncedUpdate}
      />
    </div>
  );
}
