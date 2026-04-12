import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";

type PupilLite = {
  id: string;
  name: string;
};

interface PupilPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupils: PupilLite[];
  onSelect: (pupil: PupilLite) => void;
  title?: string;
  description?: string;
}

export function PupilPickerDialog({
  open,
  onOpenChange,
  pupils,
  onSelect,
  title = "Select a pupil",
  description = "Choose who this action applies to.",
}: PupilPickerDialogProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pupils;
    return pupils.filter((p) => p.name.toLowerCase().includes(q));
  }, [pupils, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pupils…"
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-72 rounded-2xl border">
            <div className="p-2">
              {filtered.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No pupils match that search.</p>
              ) : (
                <div className="space-y-1">
                  {filtered.map((pupil) => (
                    <Button
                      key={pupil.id}
                      type="button"
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => onSelect(pupil)}
                    >
                      {pupil.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
