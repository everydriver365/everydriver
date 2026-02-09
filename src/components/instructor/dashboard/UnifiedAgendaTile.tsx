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
  ListTodo,
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
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow, isPast, parseISO, addHours } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// ─── Priority styling ───────────────────────────────────────────────
const PRIORITY_COLORS: Record<number, string> = {
  1: "border-red-500",
  2: "border-orange-500",
  3: "border-blue-500",
  4: "border-muted-foreground/30",
};

const PRIORITY_FLAGS: Record<number, string> = {
  1: "text-red-500",
  2: "text-orange-500",
  3: "text-blue-500",
  4: "text-muted-foreground/30",
};

// ─── Helpers ────────────────────────────────────────────────────────
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

// ─── Types ──────────────────────────────────────────────────────────
interface TimelineEntry {
  type: "reminder" | "todo";
  time: string; // sortable ISO or HH:MM
  id: string;
  // reminder fields
  pupilName?: string;
  startTime?: string;
  sent24h?: boolean;
  sent1h?: boolean;
  // todo fields
  todo?: InstructorTodo;
}

interface UnifiedAgendaTileProps {
  instructorId: string | undefined;
  className?: string;
}

// ─── Main component ─────────────────────────────────────────────────
export function UnifiedAgendaTile({ instructorId, className }: UnifiedAgendaTileProps) {
  const { instructor } = useInstructorAuth();
  const { data: todos = [], addTodo, toggleTodo, updateTodo, deleteTodo } = useInstructorTodos(instructorId);

  // Reminder state
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

  // Quick-add state
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

  // Build merged timeline
  const activeTodos = todos.filter((t) => !t.is_completed);
  const totalActive = activeTodos.length + lessons.length;

  const timeline: TimelineEntry[] = useMemo(() => {
    const entries: TimelineEntry[] = [];

    // Add reminders
    lessons.forEach((l) => {
      entries.push({
        type: "reminder",
        time: l.startTime,
        id: `r-${l.id}`,
        pupilName: l.pupilName,
        startTime: l.startTime,
        sent24h: l.sent24h,
        sent1h: l.sent1h,
      });
    });

    // Add todos (use due_date or created_at for sorting)
    activeTodos.slice(0, 5).forEach((t) => {
      entries.push({
        type: "todo",
        time: t.due_date || t.created_at,
        id: `t-${t.id}`,
        todo: t,
      });
    });

    // Sort: overdue first, then by time
    entries.sort((a, b) => {
      const aOverdue = a.type === "todo" && a.todo?.due_date && isPast(parseISO(a.todo.due_date)) && !isToday(parseISO(a.todo.due_date));
      const bOverdue = b.type === "todo" && b.todo?.due_date && isPast(parseISO(b.todo.due_date)) && !isToday(parseISO(b.todo.due_date));
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return a.time.localeCompare(b.time);
    });

    return entries;
  }, [lessons, activeTodos]);

  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border/40 shadow-[0_2px_12px_rgba(20,37,66,0.10)]",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <ListTodo className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">Agenda</h3>
          {totalActive > 0 && (
            <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
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
      <div className="px-3 pb-3">
        {timeline.length === 0 && !showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="w-full py-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4 mx-auto mb-1 opacity-50" />
            Add your first task
          </button>
        )}

        <div className="relative">
          {/* Vertical timeline line */}
          {timeline.length > 0 && (
            <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border/60" />
          )}

          <AnimatePresence mode="popLayout">
            {timeline.map((entry, idx) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80, transition: { duration: 0.2 } }}
              >
                {entry.type === "reminder" ? (
                  <ReminderTimelineItem
                    pupilName={entry.pupilName!}
                    startTime={entry.startTime!}
                    sent24h={entry.sent24h!}
                    sent1h={entry.sent1h!}
                  />
                ) : (
                  <TodoTimelineItem
                    todo={entry.todo!}
                    onToggle={() => toggleTodo.mutate({ id: entry.todo!.id, is_completed: true })}
                    onDelete={() => deleteTodo.mutate(entry.todo!.id)}
                    onUpdate={(updates) => updateTodo.mutate({ id: entry.todo!.id, ...updates })}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {activeTodos.length > 5 && (
          <Link to="/instructor/todos" className="block text-center text-xs text-primary font-medium pt-2 hover:underline">
            View all {activeTodos.length} tasks →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Reminder timeline item ────────────────────────────────────────
function ReminderTimelineItem({
  pupilName,
  startTime,
  sent24h,
  sent1h,
}: {
  pupilName: string;
  startTime: string;
  sent24h: boolean;
  sent1h: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2 group relative">
      {/* Timeline dot */}
      <div className="relative z-10 mt-1 h-[18px] w-[18px] rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center shrink-0">
        <Bell className="h-2.5 w-2.5 text-amber-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">Reminder</span>
        </div>
        <p className="text-sm font-medium text-foreground leading-tight mt-0.5">{pupilName}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {startTime}
          </span>
          <span className={cn(
            "text-[9px] px-1.5 py-0 rounded-full border inline-flex items-center gap-0.5",
            sent24h
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              : "border-amber-500/30 bg-amber-500/10 text-amber-600"
          )}>
            {sent24h ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
            24h
          </span>
          <span className={cn(
            "text-[9px] px-1.5 py-0 rounded-full border inline-flex items-center gap-0.5",
            sent1h
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              : "border-amber-500/30 bg-amber-500/10 text-amber-600"
          )}>
            {sent1h ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
            1h
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Todo timeline item ────────────────────────────────────────────
function TodoTimelineItem({
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
  const isOverdue = todo.due_date && isPast(parseISO(todo.due_date)) && !isToday(parseISO(todo.due_date));

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
      <div className="flex items-start gap-3 py-2 relative">
        <div className="relative z-10 mt-1 h-[18px] w-[18px] rounded-full border-2 border-muted-foreground/30 shrink-0" />
        <div className="flex-1 space-y-2">
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
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3 py-2 group relative", isOverdue && "animate-pulse-subtle")}>
      {/* Timeline dot = priority circle + check */}
      <button
        onClick={onToggle}
        className={cn(
          "relative z-10 mt-0.5 h-[18px] w-[18px] rounded-full border-2 shrink-0 flex items-center justify-center transition-colors hover:bg-muted",
          PRIORITY_COLORS[todo.priority]
        )}
      >
        <Check className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity text-foreground" />
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm text-foreground leading-tight", isOverdue && "text-red-600 font-medium")}>
          {todo.title}
        </p>
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
    </div>
  );
}
