import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SavedDoodlepad {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  zoom_level: number;
  annotations: any;
  created_at: string;
  updated_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  instructorId: string;
  onLoad: (d: SavedDoodlepad) => void;
}

export function SavedAnnotationsDrawer({ open, onOpenChange, instructorId, onLoad }: Props) {
  const [items, setItems] = useState<SavedDoodlepad[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("doodlepads")
      .select("*")
      .eq("instructor_id", instructorId)
      .order("updated_at", { ascending: false });

    if (!error && data) setItems(data as SavedDoodlepad[]);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchItems();
  }, [open]); // eslint-disable-line

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("doodlepads").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] z-[700]">
        <SheetHeader>
          <SheetTitle>Saved Jotters</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(60vh-80px)]">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">No saved jotters yet.</p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-border p-3 hover:bg-muted/50 transition-colors"
            >
              <button onClick={() => onLoad(item)} className="flex-1 text-left">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(item.updated_at), "d MMM yyyy, HH:mm")}
                </div>
              </button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
