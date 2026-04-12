import { useState, useRef, useEffect, useMemo } from "react";
import agendaIcon from "@/assets/agenda-icon.png";
import { Link } from "react-router-dom";
import {
  Check,
  Plus,
  Flag,
  Calendar as CalendarIcon,
  ChevronDown,
  Trash2,
  Pencil,
  X,
  Bell,
  Clock,
  CheckCircle2,
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

// ─── Helpers ────────────────────────────────────────────────────
function formatDueDate(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isPast(d)) return "Overdue";
  return format(d, "d MMM");
}

function isOverdue(dateStr: string) {
  const d = parseISO(dateStr);
  return isPast(d) && !isToday(d);
}

const PRIORITY_COLORS: Record<number, string> = {
  1: "text-red-500",
  2: "text-orange-500",
  3: "text-primary",
  4: "text-muted-foreground/40",
};

// ─── Types ──────────────────────────────────────────────────────
interface TimelineEntry {
  type: "reminder" | "todo" | "manual-reminder";
  sortKey: string;
  id: string;
  overdue?: boolean;
  pupilName?: string;
  startTime?: string;
  sent24h?: boolean;
  sent1h?: boolean;
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

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={cn("rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-border/40 bg-card overflow-hidden", className)}>
      {/* Header — matching Quick Access tile style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-3.5 flex items-center gap-3"
      >
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-2xl overflow-hidden">
            <img src={agendaIcon} alt="Agenda" className="w-full h-full object-cover" style={{ borderRadius: '7px' }} />
          </div>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center shadow-sm z-10">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] font-semibold text-foreground leading-tight">Agenda</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <span
                role="button"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center h-7 w-7 rounded-full text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-1 z-50 bg-card border border-border shadow-lg" align="end" side="bottom">
              <button
                onClick={() => { setAddMode("task"); setShowInput(true); setIsExpanded(true); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-2xl hover:bg-muted transition-colors"
              >
                <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                Add Task
              </button>
              <button
                onClick={() => { setAddMode("reminder"); setShowInput(true); setIsExpanded(true); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-2xl hover:bg-muted transition-colors"
              >
                <Bell className="h-3.5 w-3.5 text-amber-500" />
                Add Reminder
              </button>
            </PopoverContent>
          </Popover>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", !isExpanded && "-rotate-90")} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Divider */}
            <div className="h-px bg-border mx-4" />

            {/* Quick add form */}
            <AnimatePresence>
              {showInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3 space-y-2.5 bg-muted/30">
                    {/* Mode toggle */}
                    <div className="flex gap-1 bg-muted rounded-2xl p-0.5">
                      <button
                        onClick={() => setAddMode("task")}
                        className={cn(
                          "flex-1 text-[11px] font-medium py-1.5 rounded-2xl transition-colors flex items-center justify-center gap-1",
                          addMode === "task" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                        )}
                      >
                        <Check className="h-3 w-3" /> Task
                      </button>
                      <button
                        onClick={() => setAddMode("reminder")}
                        className={cn(
                          "flex-1 text-[11px] font-medium py-1.5 rounded-2xl transition-colors flex items-center justify-center gap-1",
                          addMode === "reminder" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                        )}
                      >
                        <Bell className="h-3 w-3" /> Reminder
                      </button>
                    </div>

                    {/* Input */}
                    <div className="flex gap-2 items-center">
                      {addMode === "task" ? (
                        <button onClick={cyclePriority} className="shrink-0">
                          <Flag className={cn("h-4 w-4", PRIORITY_COLORS[newPriority])} />
                        </button>
                      ) : (
                        <Bell className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <Input
                        ref={inputRef}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        placeholder={addMode === "task" ? "Add a task…" : "Remind me to…"}
                        className="h-8 text-sm bg-card"
                      />
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-2">
                      {addMode === "reminder" && (
                        <Input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="h-7 w-24 text-xs px-2 bg-card"
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
                      <Button size="sm" className="h-7 px-3 text-xs" onClick={handleAdd} disabled={!newTitle.trim()}>
                        Add
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items list */}
            <div className="px-4 py-2">
              {timeline.length === 0 && !showInput && (
                <button
                  onClick={() => setShowInput(true)}
                  className="w-full py-5 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4 mx-auto mb-1 opacity-40" />
                  Add your first task
                </button>
              )}

              <AnimatePresence mode="popLayout">
                {timeline.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -60, transition: { duration: 0.15 } }}
                  >
                    {idx > 0 && <div className="h-px bg-border/50 my-0.5" />}
                    <div className="group py-2">
                      {entry.type === "reminder" ? (
                        <ReminderRow
                          pupilName={entry.pupilName!}
                          startTime={entry.startTime!}
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
                <Link to="/instructor/todos" className="block text-center text-xs text-primary font-medium py-2 hover:underline">
                  View all {activeTodos.length} tasks →
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Reminder row ──────────────────────────────────────────────
function ReminderRow({ pupilName, startTime, sent1h }: {
  pupilName: string;
  startTime: string;
  sent1h: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Bell className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{pupilName}</p>
        <p className="text-[11px] text-muted-foreground">{startTime} lesson</p>
      </div>
      <span className={cn(
        "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0",
        sent1h
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-amber-500/10 text-amber-600"
      )}>
        {sent1h ? "Sent" : "Pending"}
      </span>
    </div>
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
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        className="h-7 w-7 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 hover:bg-amber-500/20 transition-colors"
      >
        <Bell className="h-3.5 w-3.5 text-amber-500" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{todo.title}</p>
        {timeLabel && <p className="text-[11px] text-muted-foreground">{timeLabel}</p>}
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-2xl hover:bg-muted text-muted-foreground hover:text-red-500 transition-all shrink-0">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Todo row ──────────────────────────────────────────────────
function TodoRow({ todo, isOverdue: overdue, onToggle, onDelete, onUpdate }: {
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
    <div className="flex items-center gap-3">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          "h-5 w-5 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-colors",
          overdue
            ? "border-red-400 hover:bg-red-50"
            : todo.priority === 1
            ? "border-red-400 hover:bg-red-50"
            : todo.priority === 2
            ? "border-orange-400 hover:bg-orange-50"
            : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            onBlur={saveEdit}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className={cn("text-sm font-medium truncate", overdue && "text-red-500")}>
              {todo.title}
            </span>
            {todo.due_date && (
              <span className={cn(
                "text-[10px] shrink-0",
                overdue ? "text-red-500 font-semibold" : "text-muted-foreground"
              )}>
                {formatDueDate(todo.due_date)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all shrink-0">
        <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-2xl hover:bg-muted text-muted-foreground transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-2xl hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
