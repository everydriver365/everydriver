import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  body: React.ReactNode;
}

interface Props {
  title?: string;
  steps: Step[];
  defaultOpen?: boolean;
}

export function IntegrationInstructions({ title = "How to set this up", steps, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <BookOpen className="h-4 w-4 text-primary" />
          {title}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="px-4 pb-4 space-y-3 list-none">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <div className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {i + 1}
              </div>
              <div className="text-sm space-y-1 min-w-0">
                <div className="font-medium">{s.title}</div>
                <div className="text-muted-foreground text-xs leading-relaxed">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
