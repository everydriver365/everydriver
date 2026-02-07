import { useState } from "react";
import { StickyNote } from "lucide-react";
import { NotesList } from "./NotesList";
import { NoteEditor } from "./NoteEditor";
import { Badge } from "@/components/ui/badge";
import type { Note } from "@/hooks/useNotes";

interface NotesLayoutProps {
  notes: Note[];
  selectedNote: Note | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFolder: string;
  onFolderChange: (f: string) => void;
  folders: string[];
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onMoveToFolder: (id: string, folder: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  /** Extra content for the editor header, e.g. share controls */
  editorExtras?: React.ReactNode;
}

export function NotesLayout({
  notes,
  selectedNote,
  searchQuery,
  onSearchChange,
  activeFolder,
  onFolderChange,
  folders,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDelete,
  onTogglePin,
  onMoveToFolder,
  onUpdateNote,
  editorExtras,
}: NotesLayoutProps) {
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");
  const isRecentlyDeleted = activeFolder === "Recently Deleted";

  const handleSelectNote = (note: Note) => {
    onSelectNote(note);
    setMobileView("editor");
  };

  const handleBack = () => {
    setMobileView("list");
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] md:h-[600px] border border-border rounded-lg overflow-hidden bg-background">
      {/* Sidebar - hide on mobile when editing */}
      <div className={`w-full md:w-80 md:border-r border-border flex-shrink-0 ${mobileView === "editor" ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
        <NotesList
          notes={notes}
          selectedNote={selectedNote}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          activeFolder={activeFolder}
          onFolderChange={onFolderChange}
          folders={folders}
          onSelectNote={handleSelectNote}
          onCreateNote={onCreateNote}
          onDeleteNote={onDeleteNote}
          onRestoreNote={onRestoreNote}
          onPermanentlyDelete={onPermanentlyDelete}
          onTogglePin={onTogglePin}
          onMoveToFolder={onMoveToFolder}
          isRecentlyDeleted={isRecentlyDeleted}
        />
      </div>

      {/* Editor - hide on mobile when list is shown */}
      <div className={`flex-1 ${mobileView === "list" ? "hidden md:block" : ""}`}>
        {selectedNote ? (
          <div className="h-full flex flex-col">
            {editorExtras}
            <NoteEditor
              note={selectedNote}
              onUpdate={onUpdateNote}
              onBack={handleBack}
              showBack={mobileView === "editor"}
              readOnly={isRecentlyDeleted}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <StickyNote className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Select a note or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
