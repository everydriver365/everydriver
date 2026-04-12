import { useState, useRef, useEffect } from "react";
import {
  Check,
  Plus,
  Flag,
  Calendar as CalendarIcon,
  Trash2,
  Circle,
  ChevronDown,
  ChevronRight,
  Inbox,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useInstructorTodos, InstructorTodo } from "@/hooks/useInstructorTodos";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const PRIORITY_COLORS: Record<number, string> = {
  1: "text-red-500 border-red-500",
  2: "text-orange-500 border-orange-500",
  3: "text-[#0075c9] border-[#0075c9]",
  4: "text-muted-foreground/40 border-muted-foreground/30",
};

const PRIORITY_FLAGS: Record<number, string> = {
  1: "text-red-500",
  2: "text-orange-500",
  3: "text-[#0075c9]",
  4: "text-muted-foreground/30",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "None",
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

export default function InstructorTodos() {
  const { instructor } = useInstructorAuth();
  const { data: todos = [], addTodo, toggleTodo, updateTodo, deleteTodo } = useInstructorTodos(instructor?.id);
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState(4);
  const [newDueDate, setNewDueDate] = useState<Date | undefined>();
  const [newProject, setNewProject] = useState("Inbox");
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterProject, setFilterProject] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTodos = todos.filter((t) => !t.is_completed);
  const completedTodos = todos.filter((t) => t.is_completed);

  // Get unique projects
  const projects = [...new Set(todos.map((t) => t.project))].sort();

  const filteredActive =
    filterProject === "all"
      ? activeTodos
      : activeTodos.filter((t) => t.project === filterProject);

  const filteredCompleted =
    filterProject === "all"
      ? completedTodos
      : completedTodos.filter((t) => t.project === filterProject);

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTodo.mutate({
      title: newTitle.trim(),
      priority: newPriority,
      due_date: newDueDate ? format(newDueDate, "yyyy-MM-dd") : null,
      project: newProject,
    });
    setNewTitle("");
    setNewPriority(4);
    setNewDueDate(undefined);
    // Keep input open for rapid entry
  };

  const cyclePriority = () => {
    setNewPriority((p) => (p === 1 ? 4 : p - 1));
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 -mx-4 md:mx-0 pb-24">
        {/* Header */}
        <div className="px-4 md:px-0">
          <InstructorPageHeader
            lucideIcon={Check}
            title="To Do"
            subtitle={`${activeTodos.length} task${activeTodos.length !== 1 ? "s" : ""} remaining`}
            action={
              <Button size="sm" className="gap-1" onClick={() => setShowInput(true)}>
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            }
          />
        </div>

        {/* Project filter */}
        {projects.length > 1 && (
          <div className="px-4 md:px-0 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilterProject("all")}
              className={cn(
                "px-3 py-1 text-xs font-medium border shrink-0 rounded-lg transition-colors",
                filterProject === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              All
            </button>
            {projects.map((p) => (
              <button
                key={p}
                onClick={() => setFilterProject(p)}
                className={cn(
                  "px-3 py-1 text-xs font-medium border shrink-0 transition-colors",
                  filterProject === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Add task input */}
        <AnimatePresence>
          {showInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-4 md:px-0"
            >
              <div className="bg-[#F2F3F5] dark:bg-[#1C1C1E] rounded-[20px] shadow-[0px_8px_20px_rgba(0,0,0,0.08),0px_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0px_8px_20px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-white/60 dark:ring-white/5 p-3 space-y-3">
                <div className="flex gap-2 items-center">
                  <Input
                    ref={inputRef}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                      if (e.key === "Escape") setShowInput(false);
                    }}
                    placeholder="Task name"
                    className="h-9 text-sm border-0 border-b border-border/50 rounded-2xl px-0 focus-visible:ring-0 focus-visible:border-primary"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Priority */}
                  <button
                    onClick={cyclePriority}
                    className="flex items-center gap-1 text-xs px-2 py-1 border border-border hover:bg-muted transition-colors"
                  >
                    <Flag className={cn("h-3 w-3", PRIORITY_FLAGS[newPriority])} />
                    {PRIORITY_LABELS[newPriority]}
                  </button>

                  {/* Due date */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1 text-xs px-2 py-1 border border-border hover:bg-muted transition-colors">
                        <CalendarIcon className="h-3 w-3" />
                        {newDueDate ? format(newDueDate, "d MMM") : "Due date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[800]" align="start">
                      <Calendar
                        mode="single"
                        selected={newDueDate}
                        onSelect={setNewDueDate}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Project */}
                  <Select value={newProject} onValueChange={setNewProject}>
                    <SelectTrigger className="w-auto h-7 text-xs border-border gap-1 px-2">
                      <Inbox className="h-3 w-3" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[800]">
                      <SelectItem value="Inbox">Inbox</SelectItem>
                      <SelectItem value="Lessons">Lessons</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Vehicle">Vehicle</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex-1" />
                  <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={!newTitle.trim()}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowInput(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active tasks */}
        <div className="px-4 md:px-0 space-y-1">
          <AnimatePresence mode="popLayout">
            {filteredActive.map((todo) => (
              <FullTodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => toggleTodo.mutate({ id: todo.id, is_completed: true })}
                onDelete={() => deleteTodo.mutate(todo.id)}
                onUpdatePriority={(p) => updateTodo.mutate({ id: todo.id, priority: p })}
              />
            ))}
          </AnimatePresence>

          {filteredActive.length === 0 && (
            <div className="py-12 text-center">
              <Check className="h-10 w-10 text-emerald-500/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All done! 🎉</p>
            </div>
          )}
        </div>

        {/* Completed section */}
        {filteredCompleted.length > 0 && (
          <div className="px-4 md:px-0">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              {showCompleted ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Completed ({filteredCompleted.length})
            </button>

            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-1"
                >
                  {filteredCompleted.map((todo) => (
                    <CompletedTodoItem
                      key={todo.id}
                      todo={todo}
                      onUncomplete={() => toggleTodo.mutate({ id: todo.id, is_completed: false })}
                      onDelete={() => deleteTodo.mutate(todo.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </InstructorPortalLayout>
  );
}

function FullTodoItem({
  todo,
  onToggle,
  onDelete,
  onUpdatePriority,
}: {
  todo: InstructorTodo;
  onToggle: () => void;
  onDelete: () => void;
  onUpdatePriority: (p: number) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
      className="flex items-start gap-3 py-3 px-3 bg-[#F2F3F5] dark:bg-[#1C1C1E] rounded-[20px] shadow-[0px_8px_20px_rgba(0,0,0,0.08),0px_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0px_8px_20px_rgba(0,0,0,0.3),0px_2px_6px_rgba(0,0,0,0.15)] ring-1 ring-inset ring-white/60 dark:ring-white/5 group transition-shadow"
    >
      {/* Priority checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          "mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors hover:bg-muted",
          PRIORITY_COLORS[todo.priority]
        )}
      >
        <Check className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-tight">{todo.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {todo.due_date && (
            <span className={cn("flex items-center gap-1 text-[11px]", getDueDateColor(todo.due_date))}>
              <CalendarIcon className="h-3 w-3" />
              {formatDueDate(todo.due_date)}
            </span>
          )}
          {todo.project !== "Inbox" && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              {todo.project}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onUpdatePriority(todo.priority === 1 ? 4 : todo.priority - 1)}
          title="Change priority"
        >
          <Flag className={cn("h-4 w-4", PRIORITY_FLAGS[todo.priority])} />
        </button>
        <button onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </motion.div>
  );
}

function CompletedTodoItem({
  todo,
  onUncomplete,
  onDelete,
}: {
  todo: InstructorTodo;
  onUncomplete: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 group">
      <button
        onClick={onUncomplete}
        className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0 flex items-center justify-center bg-muted-foreground/10"
      >
        <Check className="h-3 w-3 text-muted-foreground" />
      </button>
      <p className="text-sm text-muted-foreground line-through flex-1">{todo.title}</p>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}
