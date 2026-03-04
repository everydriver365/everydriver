import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { cn } from '@/lib/utils';
import {
  DVSA_SYLLABUS,
  getCompetenciesByCategory,
  type SyllabusCompetency,
} from '@/constants/dvsaSyllabus';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CompetencyPickerProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  compact?: boolean;
}

export function CompetencyPicker({ selected, onChange, compact = false }: CompetencyPickerProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const categorized = getCompetenciesByCategory();

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  };

  const selectedCompetencies = DVSA_SYLLABUS.filter((c) => selected.includes(c.id));

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selectedCompetencies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCompetencies.map((c) => (
            <Badge
              key={c.id}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-destructive/10"
              onClick={() => toggle(c.id)}
            >
              {c.name}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Category accordions */}
      <div className="space-y-1">
        {Object.entries(categorized).map(([category, competencies]) => {
          const isOpen = expandedCategory === category;
          const selectedInCategory = competencies.filter((c) => selected.includes(c.id)).length;

          return (
            <Collapsible key={category} open={isOpen} onOpenChange={(open) => setExpandedCategory(open ? category : null)}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-8 px-2 text-xs font-medium"
                >
                  <span>{category}</span>
                  <div className="flex items-center gap-1.5">
                    {selectedInCategory > 0 && (
                      <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px]">
                        {selectedInCategory}
                      </Badge>
                    )}
                    <ExpandChevron isExpanded={isOpen} size={12} />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 gap-0.5 pl-2 pb-1">
                  {competencies.map((c) => {
                    const isSelected = selected.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggle(c.id)}
                        className={cn(
                          'text-left text-xs px-2 py-1.5 rounded transition-colors',
                          isSelected
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
