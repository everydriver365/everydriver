import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Plus,
  Flag,
  Calendar as CalendarIcon,
  ChevronRight,
  Trash2,
  Pencil,
  X,
  Bell,
  Clock,
  CheckCircle2,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useInstructorTodos, InstructorTodo } from "@/hooks/useInstructorTodos";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow, isPast, parseISO, addHours } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// ─── Helpers ────────────────────────────────────────────────────
function formatDueDate(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Due today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isPast(d)) return "Overdue!";
  return format(d, "d MMM");
}

function isOverdue(dateStr: string) {
  const d = parseISO(dateStr);
  return isPast(d) && !isToday(d);
}

const PRIORITY_FLAGS: Record<number, string> = {
  1: "text-red-500",
  2: "text-orange-500",
  3: "text-blue-500",
  4: "text-muted-foreground/30",
};

// ─── Types ──────────────────────────────────────────────────────
interface TimelineEntry {
  type: "reminder" | "todo";
  sortKey: string;
  id: string;
  overdue?: boolean;
  // reminder
  pupilName?: string;
  startTime?: string;
  sent24h?: boolean;
  sent1h?: boolean;
  // todo
  todo?: InstructorTodo;
}

interface UnifiedAgendaTileProps {
  instructorId: string | undefined;
  className?: string;
}

// ─── Main ───────────────────────────────────────────────────────
export function UnifiedAgendaTile({ instructorId, className }: UnifiedAgendaTileProps) {
  const { instructor } = useInstructorAuth();
  const { data: todos = [], addTodo, toggleTodo, updateTodo, deleteTodo } = useInstructorTodos(instructorId);

  // Reminders
  const [lessons, setLessons] = useState<{ id: string; pupilName: string; startTime: string; sent24h: boolean; sent1h: boolean }[]>([]);

  useEffect(() => {
    if (!instructor?.id) return;
    const fetchLessons = async () => {
      const now = new Date();
      const in24h = addHours(now, 24);
      const today = format(now, "yyyy-MM-dd");
      const tomorrow = format(in24h, "yyyy-MM-dd");
      const { data } = await supabase
        .from("scheduled_lessons")
        .select("id, start_time, reminder_24h_sent_at, reminder_1h_sent_at, pupils(name)")
        .eq("instructor_id", instructor.id)
        .neq("status", "cancelled")
        .gte("lesson_date", today)
        .lte("lesson_date", tomorrow)
        .order("start_time", { ascending: true })
        .limit(6);
      if (data) {
        setLessons(data.map((l: any) => ({
          id: l.id,
          pupilName: l.pupils?.name || "Unknown",
          startTime: l.start_time,
          sent24h: !!l.reminder_24h_sent_at,
          sent1h: !!l.reminder_1h_sent_at,
        })));
      }
    };
    fetchLessons();
  }, [instructor?.id]);

  // Quick-add
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState(4);
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const cyclePriority = () => setNewPriority((p) => (p === 1 ? 4 : p - 1));

  const activeTodos = todos.filter((t) => !t.is_completed);
  const totalItems = activeTodos.length + lessons.length;

  // Build timeline
  const timeline: TimelineEntry[] = useMemo(() => {
    const entries: TimelineEntry[] = [];

    lessons.forEach((l) => {
      entries.push({
        type: "reminder",
        sortKey: l.startTime,
        id: `r-${l.id}`,
        pupilName: l.pupilName,
        startTime: l.startTime,
        sent24h: l.sent24h,
        sent1h: l.sent1h,
      });
    });

    activeTodos.slice(0, 5).forEach((t) => {
      const od = t.due_date ? isOverdue(t.due_date) : false;
      entries.push({
        type: "todo",
        sortKey: t.due_date || t.created_at,
        id: `t-${t.id}`,
        todo: t,
        overdue: od,
      });
    });

    entries.sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      return a.sortKey.localeCompare(b.sortKey);
    });

    return entries;
  }, [lessons, activeTodos]);

  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border/40 shadow-[0_2px_12px_rgba(20,37,66,0.10)] overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Timer className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Agenda</h3>
            <p className="text-[10px] text-muted-foreground">
              {totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? "s" : ""} today` : "Nothing scheduled"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setShowInput(!showInput)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Link to="/instructor/todos">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Quick add */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
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
                  className="h-8 text-sm border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
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
                    <Calendar mode="single" selected={newDueDate} onSelect={setNewDueDate} initialFocus className="p-3 pointer-events-auto" />
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

      {/* Timeline */}
      <div className="px-4 pb-4">
        {timeline.length === 0 && !showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="w-full py-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4 mx-auto mb-1 opacity-50" />
            Add your first task
          </button>
        )}

        <AnimatePresence mode="popLayout">
          {timeline.map((entry, idx) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -80, transition: { duration: 0.2 } }}
              className="flex gap-3"
            >
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  "h-3 w-3 rounded-full border-2 shrink-0 mt-1",
                  entry.overdue
                    ? "border-red-500 bg-red-500 animate-pulse"
                    : entry.type === "reminder"
                    ? "border-primary bg-primary/20"
                    : entry.todo?.priority === 1
                    ? "border-red-500 bg-red-500/20"
                    : entry.todo?.priority === 2
                    ? "border-orange-500 bg-orange-500/20"
                    : entry.todo?.priority === 3
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-muted-foreground/30 bg-muted"
                )} />
                {idx < timeline.length - 1 && <div className="w-px flex-1 bg-border/60 my-0.5" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-3 group">
                {entry.type === "reminder" ? (
                  <ReminderRow
                    pupilName={entry.pupilName!}
                    startTime={entry.startTime!}
                    sent24h={entry.sent24h!}
                    sent1h={entry.sent1h!}
                  />
                ) : (
                  <TodoRow
                    todo={entry.todo!}
                    isOverdue={!!entry.overdue}
                    onToggle={() => toggleTodo.mutate({ id: entry.todo!.id, is_completed: true })}
                    onDelete={() => deleteTodo.mutate(entry.todo!.id)}
                    onUpdate={(updates) => updateTodo.mutate({ id: entry.todo!.id, ...updates })}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {activeTodos.length > 5 && (
          <Link to="/instructor/todos" className="block text-center text-xs text-primary font-medium pt-1 hover:underline">
            View all {activeTodos.length} tasks →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Reminder row ──────────────────────────────────────────────
function ReminderRow({ pupilName, startTime, sent24h, sent1h }: {
  pupilName: string;
  startTime: string;
  sent24h: boolean;
  sent1h: boolean;
}) {
  const status = sent1h ? "sent" : "pending";
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium truncate">Reminder: {pupilName}</p>
        <span className={cn(
          "text-[10px] shrink-0 ml-2",
          status === "sent" ? "text-emerald-600" : "text-amber-600"
        )}>
          {startTime}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">{startTime} lesson</p>
      <Badge variant="outline" className={cn(
        "text-[9px] mt-1 px-1.5 py-0",
        status === "sent"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          : "border-amber-500/30 bg-amber-500/10 text-amber-600"
      )}>
        {status === "sent" ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <Clock className="h-2.5 w-2.5 mr-0.5" />}
        {status === "sent" ? "Sent" : "Pending"}
      </Badge>
    </>
  );
}

// ─── Todo row ──────────────────────────────────────────────────
function TodoRow({ todo, isOverdue: overdue, onToggle, onDelete, onUpdate }: {
  todo: InstructorTodo;
  isOverdue: boolean;
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
      <div className="space-y-2">
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
              <Calendar mode="single" selected={editDueDate} onSelect={setEditDueDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {editDueDate && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditDueDate(undefined)}>
              <X className="h-3 w-3" />
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSave}>Save</Button>
        </div>
      </div>
    );
  }

  const timeLabel = todo.due_date ? formatDueDate(todo.due_date) : "";

  return (
    <>
      <div className="flex items-center justify-between">
        <button onClick={onToggle} className="text-sm font-medium truncate text-left hover:line-through transition-all">
          <span className={cn(overdue && "text-red-500")}>{todo.title}</span>
        </button>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {timeLabel && (
            <span className={cn(
              "text-[10px]",
              overdue ? "text-red-500 font-bold" : "text-muted-foreground"
            )}>
              {timeLabel}
            </span>
          )}
          <button
            onClick={() => {
              setEditTitle(todo.title);
              setEditDueDate(todo.due_date ? parseISO(todo.due_date) : undefined);
              setEditing(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
    </>
  );
}
