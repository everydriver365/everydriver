import { useState } from "react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
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
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
        <span className="text-sm font-medium text-foreground">
          {open ? "Update Skills" : "Tap to update skills"}
        </span>
        <ExpandChevron isExpanded={open} />
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
