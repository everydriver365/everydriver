import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Plus,
  Flag,
  Calendar as CalendarIcon,
  ChevronRight,
  Trash2,
  ListTodo,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useInstructorTodos, InstructorTodo } from "@/hooks/useInstructorTodos";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const PRIORITY_COLORS: Record<number, string> = {
  1: "text-red-500 border-red-500",
  2: "text-orange-500 border-orange-500",
  3: "text-primary border-primary",
  4: "text-muted-foreground/40 border-muted-foreground/30",
};

const PRIORITY_FLAGS: Record<number, string> = {
  1: "text-red-500",
  2: "text-orange-500",
  3: "text-primary",
  4: "text-muted-foreground/30",
};

function formatDueDate(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "d MMM");
}

function getDueDateColor(dateStr: string) {
  const d = parseISO(dateStr);
  if (isPast(d) && !isToday(d)) return "text-red-500";
  if (isToday(d)) return "text-emerald-600";
  return "text-muted-foreground";
}

interface TodoHomeTileProps {
  instructorId: string | undefined;
  className?: string;
}

export function TodoHomeTile({ instructorId, className }: TodoHomeTileProps) {
  const { data: todos = [], addTodo, toggleTodo, updateTodo, deleteTodo } = useInstructorTodos(instructorId);
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState(4);
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTodos = todos.filter((t) => !t.is_completed).slice(0, 5);
  const totalActive = todos.filter((t) => !t.is_completed).length;

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTodo.mutate({
      title: newTitle.trim(),
      priority: newPriority,
      due_date: newDueDate ? format(newDueDate, "yyyy-MM-dd") : null,
    });
    setNewTitle("");
    setNewPriority(4);
    setNewDueDate(undefined);
    setShowInput(false);
  };

  const cyclePriority = () => {
    setNewPriority((p) => (p === 1 ? 4 : p - 1));
  };

  return (
    <div className={cn("bg-card border border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">To Do</h3>
          {totalActive > 0 && (
            <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5">
              {totalActive}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowInput(!showInput)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Link to="/instructor/todos">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick add input */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-2">
              <div className="flex gap-2 items-center">
                <button onClick={cyclePriority} className="shrink-0">
                  <Flag className={cn("h-4 w-4", PRIORITY_FLAGS[newPriority])} />
                </button>
                <Input
                  ref={inputRef}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="Add a task…"
                  className="h-8 text-sm border-0 border-b border-border/50 rounded-2xl px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {newDueDate ? format(newDueDate, "d MMM") : "Due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newDueDate}
                      onSelect={setNewDueDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {newDueDate && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setNewDueDate(undefined)}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <div className="flex-1" />
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleAdd} disabled={!newTitle.trim()}>
                  Add
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Todo items */}
      <div className="px-3 pb-3">
        {activeTodos.length === 0 && !showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="w-full py-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4 mx-auto mb-1 opacity-50" />
            Add your first task
          </button>
        )}

        <AnimatePresence mode="popLayout">
          {activeTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo.mutate({ id: todo.id, is_completed: true })}
              onDelete={() => deleteTodo.mutate(todo.id)}
              onUpdate={(updates) => updateTodo.mutate({ id: todo.id, ...updates })}
            />
          ))}
        </AnimatePresence>

        {totalActive > 5 && (
          <Link to="/instructor/todos" className="block text-center text-xs text-primary font-medium pt-2 hover:underline">
            View all {totalActive} tasks →
          </Link>
        )}
      </div>
    </div>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
  onUpdate,
}: {
  todo: InstructorTodo;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<InstructorTodo>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(
    todo.due_date ? parseISO(todo.due_date) : undefined
  );
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && editRef.current) editRef.current.focus();
  }, [editing]);

  const handleSave = () => {
    if (!editTitle.trim()) return;
    onUpdate({
      title: editTitle.trim(),
      due_date: editDueDate ? format(editDueDate, "yyyy-MM-dd") : null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <motion.div layout className="py-2 border-b border-border/30 last:border-0 space-y-2">
        <Input
          ref={editRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-8 text-sm"
        />
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                <CalendarIcon className="h-3 w-3" />
                {editDueDate ? format(editDueDate, "d MMM") : "Due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={editDueDate}
                onSelect={setEditDueDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {editDueDate && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditDueDate(undefined)}>
              <X className="h-3 w-3" />
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSave}>
            Save
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80, transition: { duration: 0.2 } }}
      className="flex items-start gap-2.5 py-2 border-b border-border/30 last:border-0 group"
    >
      <button
        onClick={onToggle}
        className={cn(
          "mt-0.5 h-[18px] w-[18px] rounded-full border-2 shrink-0 flex items-center justify-center transition-colors hover:bg-muted",
          PRIORITY_COLORS[todo.priority]
        )}
      >
        <Check className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-tight">{todo.title}</p>
        {todo.due_date && (
          <div className="flex items-center gap-1 mt-0.5">
            <CalendarIcon className="h-3 w-3" />
            <span className={cn("text-[11px]", getDueDateColor(todo.due_date))}>
              {formatDueDate(todo.due_date)}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setEditTitle(todo.title);
          setEditDueDate(todo.due_date ? parseISO(todo.due_date) : undefined);
          setEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
      </button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </motion.div>
  );
}
