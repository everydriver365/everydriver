import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Note } from "@/hooks/useNotes";

interface NoteEditorProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onBack?: () => void;
  showBack?: boolean;
  readOnly?: boolean;
  badge?: React.ReactNode;
}

export function NoteEditor({ note, onUpdate, onBack, showBack, readOnly, badge }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id, note.title, note.content]);

  // Auto-focus title on new untitled notes
  useEffect(() => {
    if (note.title === "Untitled" && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [note.id]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    onUpdate(note.id, { title: val });
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    onUpdate(note.id, { content: val });
  };

  return (
    <div className="flex flex-col h-full">
      {(showBack || badge) && (
        <div className="flex items-center gap-2 p-3 border-b border-border">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          {badge && <div className="ml-auto">{badge}</div>}
        </div>
      )}
      <div className="flex-1 p-4 space-y-3 overflow-auto">
        <Input
          ref={titleRef}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title..."
          className="text-lg font-semibold border-0 px-0 focus-visible:ring-0 bg-transparent"
          readOnly={readOnly}
        />
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing..."
          className="flex-1 min-h-[300px] border-0 px-0 focus-visible:ring-0 resize-none bg-transparent text-sm leading-relaxed"
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
