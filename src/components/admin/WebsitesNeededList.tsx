import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebsiteItem {
  id: string;
  title: string;
  is_completed: boolean;
  display_order: number;
}

export function WebsitesNeededList() {
  const [items, setItems] = useState<WebsiteItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("admin-websites-needed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_websites_needed" },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("admin_websites_needed")
      .select("*")
      .order("is_completed", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching websites:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const addItem = async () => {
    if (!newItem.trim()) return;

    const maxOrder = items.length > 0 
      ? Math.max(...items.map(t => t.display_order)) + 1 
      : 0;

    const { error } = await supabase.from("admin_websites_needed").insert({
      title: newItem.trim(),
      display_order: maxOrder,
    });

    if (error) {
      toast.error("Failed to add website");
    } else {
      setNewItem("");
    }
  };

  const toggleItem = async (id: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from("admin_websites_needed")
      .update({ is_completed: !isCompleted })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update website");
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from("admin_websites_needed")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete website");
    }
  };

  const incompleteItems = items.filter(t => !t.is_completed);
  const completedItems = items.filter(t => t.is_completed);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-orange-500" />
          Websites Needed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new item */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a website..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="flex-1"
          />
          <Button size="icon" onClick={addItem} disabled={!newItem.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No websites listed. Add one above!</p>
          ) : (
            <>
              {incompleteItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
                >
                  <Checkbox
                    checked={item.is_completed}
                    onCheckedChange={() => toggleItem(item.id, item.is_completed)}
                  />
                  <span className="flex-1 text-sm">{item.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              
              {completedItems.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Completed ({completedItems.length})
                  </div>
                  {completedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
                    >
                      <Checkbox
                        checked={item.is_completed}
                        onCheckedChange={() => toggleItem(item.id, item.is_completed)}
                      />
                      <span className={cn("flex-1 text-sm line-through text-muted-foreground")}>
                        {item.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
