import { Pin, Search, Plus, MoreVertical, Trash2, FolderOpen, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Note } from "@/hooks/useNotes";

interface NotesListProps {
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
  onRestoreNote?: (id: string) => void;
  onPermanentlyDelete?: (id: string) => void;
  onTogglePin: (id: string) => void;
  onMoveToFolder: (id: string, folder: string) => void;
  isRecentlyDeleted?: boolean;
}

export function NotesList({
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
  isRecentlyDeleted,
}: NotesListProps) {
  const allFolders = ["All", ...folders, "Recently Deleted"];

  return (
    <div className="flex flex-col h-full">
      {/* Search + New */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Button size="icon" variant="default" className="h-9 w-9 shrink-0" onClick={onCreateNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Folder tabs */}
        <div className="flex gap-1 flex-wrap">
          {allFolders.map((f) => (
            <button
              key={f}
              onClick={() => onFolderChange(f)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                activeFolder === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Notes list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {notes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {isRecentlyDeleted ? "No deleted notes" : "No notes yet"}
            </div>
          )}
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note)}
              className={cn(
                "group relative p-3 rounded-lg cursor-pointer transition-colors",
                selectedNote?.id === note.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {note.is_pinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
                    <span className="font-medium text-sm truncate">{note.title || "Untitled"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {note.content?.substring(0, 60) || "No content"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {format(new Date(note.updated_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {isRecentlyDeleted ? (
                      <>
                        {onRestoreNote && (
                          <DropdownMenuItem onClick={() => onRestoreNote(note.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" /> Restore
                          </DropdownMenuItem>
                        )}
                        {onPermanentlyDelete && (
                          <DropdownMenuItem className="text-destructive" onClick={() => onPermanentlyDelete(note.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Forever
                          </DropdownMenuItem>
                        )}
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => onTogglePin(note.id)}>
                          <Pin className="h-4 w-4 mr-2" /> {note.is_pinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FolderOpen className="h-4 w-4 mr-2" /> Move to...
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {folders.map((f) => (
                              <DropdownMenuItem key={f} onClick={() => onMoveToFolder(note.id, f)}>
                                {f}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDeleteNote(note.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
