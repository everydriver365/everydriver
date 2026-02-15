// ============= Full file contents =============

import { useState, useRef, useEffect, useMemo } from "react";
import agendaIcon from "@/assets/agenda-icon.png";
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
  3: "text-primary",
  4: "text-muted-foreground/30",
};

// ─── Types ──────────────────────────────────────────────────────
interface TimelineEntry {
  type: "reminder" | "todo" | "manual-reminder";
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
  const [addMode, setAddMode] = useState<"task" | "reminder">("task");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState(4);
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput, addMode]);

  const resetForm = () => {
    setNewTitle("");
    setNewPriority(4);
    setNewDueDate(undefined);
    setNewTime("");
    setShowInput(false);
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const isReminder = addMode === "reminder";
    addTodo.mutate({
      title: isReminder && newTime ? `${newTime} — ${newTitle.trim()}` : newTitle.trim(),
      priority: isReminder ? 3 : newPriority,
      due_date: newDueDate ? format(newDueDate, "yyyy-MM-dd") : (isReminder ? format(new Date(), "yyyy-MM-dd") : null),
      project: isReminder ? "Reminders" : "Inbox",
    });
    resetForm();
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
      const isManualReminder = t.project === "Reminders";
      entries.push({
        type: isManualReminder ? "manual-reminder" : "todo",
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
      "bg-card rounded-2xl shadow-sm overflow-hidden",
      className
    )}>
      {/* Gradient header */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={agendaIcon} alt="Agenda" className="h-10 w-10" />
            <div>
              <h3 className="font-semibold text-sm">Agenda</h3>
              <p className="text-white/70 text-[10px]">
                {totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? "s" : ""} today` : "Nothing scheduled"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-white hover:bg-white/20">
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-36 p-1 z-50 bg-card border border-border shadow-lg" align="end" side="bottom">
                <button
                  onClick={() => { setAddMode("task"); setShowInput(true); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                >
                  <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                  Add Task
                </button>
                <button
                  onClick={() => { setAddMode("reminder"); setShowInput(true); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                >
                  <Bell className="h-3.5 w-3.5 text-amber-500" />
                  Add Reminder
                </button>
              </PopoverContent>
            </Popover>
            <Link to="/instructor/todos">
              <ChevronRight className="h-4 w-4 text-white/60" />
            </Link>
          </div>
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
              {/* Tab toggle */}
              <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
                <button
                  onClick={() => setAddMode("task")}
                  className={cn(
                    "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5",
                    addMode === "task" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Flag className="h-3 w-3" /> Task
                </button>
                <button
                  onClick={() => setAddMode("reminder")}
                  className={cn(
                    "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5",
                    addMode === "reminder" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Bell className="h-3 w-3" /> Reminder
                </button>
              </div>

              {/* Input row */}
              <div className="flex gap-2 items-center">
                {addMode === "task" && (
                  <button onClick={cyclePriority} className="shrink-0">
                    <Flag className={cn("h-4 w-4", PRIORITY_FLAGS[newPriority])} />
                  </button>
                )}
                {addMode === "reminder" && (
                  <Bell className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <Input
                  ref={inputRef}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder={addMode === "task" ? "Add a task…" : "Remind me to…"}
                  className="h-8 text-sm border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
              </div>

              {/* Options row */}
              <div className="flex items-center gap-2">
                {addMode === "reminder" && (
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="h-7 w-24 text-xs px-2"
                    placeholder="Time"
                  />
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {newDueDate ? format(newDueDate, "d MMM") : "Date"}
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
      <div className="px-4 pt-2 pb-4 pl-8">
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
                    : (entry.type === "reminder" || entry.type === "manual-reminder")
                    ? "border-primary bg-primary/20"
                    : entry.todo?.priority === 1
                    ? "border-red-500 bg-red-500/20"
                    : entry.todo?.priority === 2
                    ? "border-orange-500 bg-orange-500/20"
                    : entry.todo?.priority === 3
                    ? "border-primary bg-primary/20"
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
                ) : entry.type === "manual-reminder" ? (
                  <ManualReminderRow
                    todo={entry.todo!}
                    onToggle={() => toggleTodo.mutate({ id: entry.todo!.id, is_completed: true })}
                    onDelete={() => deleteTodo.mutate(entry.todo!.id)}
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

// ─── Manual reminder row ───────────────────────────────────────
function ManualReminderRow({ todo, onToggle, onDelete }: {
  todo: InstructorTodo;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const timeLabel = todo.due_date ? formatDueDate(todo.due_date) : "";
  return (
    <>
      <div className="flex items-center justify-between">
        <button onClick={onToggle} className="text-sm font-medium truncate text-left hover:line-through transition-all">
          {todo.title}
        </button>
        {timeLabel && (
          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
            {timeLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onDelete} className="text-muted-foreground hover:text-red-500">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </>
  );
}

// ─── Todo row ──────────────────────────────────────────────────
function TodoRow({ todo, isOverdue, onToggle, onDelete, onUpdate }: {
  todo: InstructorTodo;
  isOverdue: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (u: Partial<InstructorTodo>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const saveEdit = () => {
    if (editTitle.trim() !== todo.title) {
      onUpdate({ title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className="relative">
      <div className="flex items-start gap-2">
        {/* Checkbox area */}
        <button
          onClick={onToggle}
          className="mt-0.5 h-4 w-4 rounded border border-muted-foreground/40 hover:border-primary flex items-center justify-center transition-colors"
        >
          {/* Empty square */}
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                onBlur={saveEdit}
                className="h-6 text-sm px-1 py-0"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <span className={cn("text-sm font-medium truncate", isOverdue && "text-red-500")}>
                {todo.title}
              </span>
              {todo.due_date && (
                <span className={cn("text-[10px]", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
                  {formatDueDate(todo.due_date)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute right-0 top-0 hidden group-hover:flex items-center gap-1 bg-card/80 backdrop-blur-sm pl-2">
        <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-muted rounded text-muted-foreground">
          <Pencil className="h-3 w-3" />
        </button>
        <button onClick={onDelete} className="p-1 hover:bg-red-100 hover:text-red-600 rounded text-muted-foreground">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
