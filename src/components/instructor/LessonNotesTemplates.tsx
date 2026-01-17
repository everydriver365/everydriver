import { useState } from "react";
import { FileText, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LessonNotesTemplatesProps {
  onSelect: (template: string) => void;
}

const LESSON_TEMPLATES = [
  {
    category: "Progress",
    templates: [
      "Great progress today! Showed real confidence with...",
      "Needs more practice with... but making steady improvement",
      "Excellent lesson - ready to move on to...",
      "Good effort today. Focus areas for next lesson:",
    ],
  },
  {
    category: "Manoeuvres",
    templates: [
      "Practiced parallel parking - getting more consistent",
      "Bay parking completed successfully, minor adjustments needed",
      "Reverse around corner needs more observation checks",
      "Emergency stop was well executed",
      "Turn in the road - good progress with clutch control",
    ],
  },
  {
    category: "Road Skills",
    templates: [
      "Roundabout positioning has improved significantly",
      "Dual carriageway driving was confident and safe",
      "Junction approaches - remember to check mirrors earlier",
      "Good lane discipline on multi-lane roads",
      "Speed awareness improving in residential areas",
    ],
  },
  {
    category: "Test Ready",
    templates: [
      "Mock test completed - passed with minor faults",
      "Test ready! Just need to work on nerves",
      "Almost test ready - one or two areas to polish",
      "Recommend booking test after 2-3 more lessons",
    ],
  },
  {
    category: "Areas to Improve",
    templates: [
      "Work on mirror checks before signalling",
      "Practice clutch control on hills",
      "Focus on observations at junctions",
      "Need to improve response to road signs",
      "Steering could be smoother in turns",
    ],
  },
];

export function LessonNotesTemplates({ onSelect }: LessonNotesTemplatesProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (template: string) => {
    onSelect(template);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <FileText className="h-3 w-3" />
          Templates
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <p className="text-sm font-medium">Quick Templates</p>
          <p className="text-xs text-muted-foreground">Click to insert</p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {LESSON_TEMPLATES.map((category) => (
            <div key={category.category} className="p-2 border-b last:border-b-0">
              <Badge variant="outline" className="mb-2 text-xs">
                {category.category}
              </Badge>
              <div className="space-y-1">
                {category.templates.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(template)}
                    className="w-full text-left text-xs p-2 rounded hover:bg-muted transition-colors line-clamp-2"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
