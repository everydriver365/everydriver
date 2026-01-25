import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  title: string;
  is_completed: boolean;
  display_order: number;
}

export function AdminTodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();

    const channel = supabase
      .channel("admin-todos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_todos" },
        () => fetchTodos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from("admin_todos")
      .select("*")
      .order("is_completed", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching todos:", error);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    const maxOrder = todos.length > 0 
      ? Math.max(...todos.map(t => t.display_order)) + 1 
      : 0;

    const { error } = await supabase.from("admin_todos").insert({
      title: newTodo.trim(),
      display_order: maxOrder,
    });

    if (error) {
      toast.error("Failed to add task");
    } else {
      setNewTodo("");
    }
  };

  const toggleTodo = async (id: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from("admin_todos")
      .update({ is_completed: !isCompleted })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update task");
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from("admin_todos")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete task");
    }
  };

  const incompleteTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListTodo className="h-5 w-5 text-primary" />
          To-Do List
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new todo */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            className="flex-1"
          />
          <Button size="icon" onClick={addTodo} disabled={!newTodo.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Todo list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : todos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks yet. Add one above!</p>
          ) : (
            <>
              {incompleteTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
                >
                  <Checkbox
                    checked={todo.is_completed}
                    onCheckedChange={() => toggleTodo(todo.id, todo.is_completed)}
                  />
                  <span className="flex-1 text-sm">{todo.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              
              {completedTodos.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Completed ({completedTodos.length})
                  </div>
                  {completedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
                    >
                      <Checkbox
                        checked={todo.is_completed}
                        onCheckedChange={() => toggleTodo(todo.id, todo.is_completed)}
                      />
                      <span className={cn("flex-1 text-sm line-through text-muted-foreground")}>
                        {todo.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteTodo(todo.id)}
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
