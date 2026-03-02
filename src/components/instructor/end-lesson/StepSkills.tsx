import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PostLessonReview } from "@/components/instructor/PostLessonReview";

interface StepSkillsProps {
  lessonId: string;
  pupilId: string;
  instructorId: string;
  onSaved: () => void;
}

export function StepSkills({ lessonId, pupilId, instructorId, onSaved }: StepSkillsProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
        <span className="text-sm font-medium text-foreground">
          {open ? "Update Skills" : "Tap to update skills"}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <PostLessonReview
          lessonId={lessonId}
          pupilId={pupilId}
          instructorId={instructorId}
          onSaved={onSaved}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
