import { StickyNote, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotes } from "@/hooks/useNotes";
import { format } from "date-fns";

interface NotesWidgetProps {
  instructorId: string;
}

export function NotesWidget({ instructorId }: NotesWidgetProps) {
  const { notes, loading } = useNotes({ ownerType: "instructor", ownerId: instructorId, folders: ["General", "Lessons", "Pupils", "Personal"] });

  const recentNotes = notes.slice(0, 4);

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
          <Link to="/instructor/notes" className="block py-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="h-4 w-4 mx-auto mb-1 opacity-50" />
            Create your first note
          </Link>
        ) : (
          <div className="space-y-1.5">
            {recentNotes.map((note) => (
              <Link
                key={note.id}
                to="/instructor/notes"
                className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {note.title || "Untitled"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {note.content?.replace(/<[^>]*>/g, "").slice(0, 60) || "Empty note"}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  {format(new Date(note.updated_at), "d MMM")}
                </span>
              </Link>
            ))}
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
