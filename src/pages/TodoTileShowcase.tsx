import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Plus, Flag, Calendar, Bell, Clock, CheckCircle2, ListTodo, CircleDot, MessageSquare, Mail, Smartphone, Pencil, Trash2, ChevronRight, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Mock data
const mockTodos = [
  { id: "1", title: "Book MOT for Yaris", priority: 1, due_date: "Today", overdue: false },
  { id: "2", title: "Chase Sarah's theory test date", priority: 2, due_date: "Tomorrow", overdue: false },
  { id: "3", title: "Submit CPD log entry", priority: 3, due_date: "14 Feb", overdue: false },
  { id: "4", title: "Update lesson prices", priority: 4, due_date: null, overdue: false },
  { id: "5", title: "Order new L plates", priority: 2, due_date: "7 Feb", overdue: true },
];

const mockReminders = [
  { pupil: "James W.", time: "09:00", sent24h: true, sent1h: false },
  { pupil: "Emily R.", time: "11:30", sent24h: true, sent1h: true },
  { pupil: "Sophie M.", time: "14:00", sent24h: false, sent1h: false },
];

const PRIORITY_DOT: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-blue-500",
  4: "bg-muted-foreground/30",
};

const PRIORITY_BORDER: Record<number, string> = {
  1: "border-l-red-500",
  2: "border-l-orange-500",
  3: "border-l-blue-500",
  4: "border-l-muted-foreground/20",
};

// ─── OPTION A: Minimal Checklist ─────────────────────────────
function OptionA() {
  return (
    <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <ListTodo className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Tasks & Reminders</h3>
            <p className="text-[10px] text-muted-foreground">3 tasks · 2 reminders due</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Reminders section */}
      <div className="px-4 pb-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          <Bell className="h-3 w-3 inline mr-1" />Lesson Reminders
        </p>
        {mockReminders.slice(0, 2).map((r, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">{r.pupil}</span>
              <span className="text-[10px] text-muted-foreground">{r.time}</span>
            </div>
            <div className="flex gap-1">
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", r.sent24h ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                24h {r.sent24h ? "✓" : "⏳"}
              </span>
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", r.sent1h ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                1h {r.sent1h ? "✓" : "⏳"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-4 border-t border-border/40" />

      {/* Tasks section */}
      <div className="px-4 pt-2 pb-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          <CheckCircle2 className="h-3 w-3 inline mr-1" />To Do
        </p>
        {mockTodos.slice(0, 4).map((todo) => (
          <div key={todo.id} className="flex items-center gap-2.5 py-1.5 group">
            <button className={cn("h-[16px] w-[16px] rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
              todo.priority === 1 ? "border-red-500" : todo.priority === 2 ? "border-orange-500" : todo.priority === 3 ? "border-blue-500" : "border-muted-foreground/30"
            )}>
              <Check className="h-2.5 w-2.5 opacity-0 group-hover:opacity-40" />
            </button>
            <span className="text-sm flex-1 min-w-0 truncate">{todo.title}</span>
            {todo.due_date && (
              <span className={cn("text-[10px] shrink-0", todo.overdue ? "text-red-500 font-semibold" : "text-muted-foreground")}>
                {todo.due_date}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OPTION B: Kanban-Inspired Cards ─────────────────────────
function OptionB() {
  const overdue = mockTodos.filter(t => t.overdue);
  const today = mockTodos.filter(t => t.due_date === "Today");
  const upcoming = mockTodos.filter(t => !t.overdue && t.due_date !== "Today");

  return (
    <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <ListTodo className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">Tasks & Reminders</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]">1 overdue</Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Reminder banner */}
      <div className="mx-4 mb-3 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">3 lessons today</span>
          </div>
          <div className="flex gap-1">
            <MessageSquare className="h-3 w-3 text-emerald-500" />
            <Mail className="h-3 w-3 text-emerald-500" />
            <Smartphone className="h-3 w-3 text-amber-500" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">2 of 3 reminders sent · 1 pending</p>
      </div>

      {/* Scrollable cards */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
        {/* Overdue */}
        {overdue.map(todo => (
          <div key={todo.id} className="shrink-0 w-[160px] p-3 rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-red-600 uppercase">Overdue</span>
            </div>
            <p className="text-xs font-medium leading-tight">{todo.title}</p>
            <p className="text-[10px] text-red-500 mt-1">{todo.due_date}</p>
          </div>
        ))}
        {/* Today */}
        {today.map(todo => (
          <div key={todo.id} className="shrink-0 w-[160px] p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-emerald-600 uppercase">Today</span>
            </div>
            <p className="text-xs font-medium leading-tight">{todo.title}</p>
          </div>
        ))}
        {/* Upcoming */}
        {upcoming.slice(0, 2).map(todo => (
          <div key={todo.id} className="shrink-0 w-[160px] p-3 rounded-xl border border-border/60 bg-muted/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Upcoming</span>
            </div>
            <p className="text-xs font-medium leading-tight">{todo.title}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{todo.due_date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OPTION C: Progress Ring ──────────────────────────────────
function OptionC() {
  const completed = 4;
  const total = 7;
  const pct = Math.round((completed / total) * 100);
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 overflow-hidden">
      {/* Header with ring */}
      <div className="p-4 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" className="stroke-muted/30" />
            <circle
              cx="32" cy="32" r="28" fill="none" strokeWidth="4"
              strokeLinecap="round"
              className="stroke-primary"
              style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{pct}%</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-foreground">Today's Progress</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{completed} of {total} tasks done</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] px-2 py-0 border-amber-500/30 bg-amber-500/10 text-amber-600">
              <Bell className="h-2.5 w-2.5 mr-0.5" /> 1 pending reminder
            </Badge>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="mx-4 border-t border-border/40" />

      {/* Remaining tasks */}
      <div className="px-4 py-3">
        {mockTodos.slice(0, 3).map((todo) => (
          <div key={todo.id} className={cn("flex items-center gap-2.5 py-2 border-l-2 pl-3 mb-1 rounded-r-lg", PRIORITY_BORDER[todo.priority])}>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{todo.title}</p>
              {todo.due_date && (
                <p className={cn("text-[10px]", todo.overdue ? "text-red-500 font-semibold" : "text-muted-foreground")}>
                  {todo.due_date}
                </p>
              )}
            </div>
            <button className="h-6 w-6 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center hover:bg-muted shrink-0">
              <Check className="h-3 w-3 text-muted-foreground/30" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OPTION D: Timeline View ──────────────────────────────────
function OptionD() {
  const items = [
    { type: "reminder", label: "Reminder: James W.", sub: "09:00 lesson", time: "08:00", status: "sent", icon: Bell },
    { type: "todo", label: "Book MOT for Yaris", sub: null, time: "Due today", priority: 1, icon: Flag },
    { type: "reminder", label: "Reminder: Emily R.", sub: "11:30 lesson", time: "10:30", status: "pending", icon: Bell },
    { type: "todo", label: "Chase Sarah's theory test", sub: null, time: "Tomorrow", priority: 2, icon: Flag },
    { type: "todo", label: "Order new L plates", sub: null, time: "Overdue!", priority: 2, icon: Flag, overdue: true },
  ];

  return (
    <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Timer className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Agenda</h3>
            <p className="text-[10px] text-muted-foreground">5 items today</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 pb-4">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn("h-3 w-3 rounded-full border-2 shrink-0 mt-1",
                item.overdue ? "border-red-500 bg-red-500 animate-pulse" :
                item.type === "reminder" ? "border-primary bg-primary/20" :
                item.priority === 1 ? "border-red-500 bg-red-500/20" :
                item.priority === 2 ? "border-orange-500 bg-orange-500/20" :
                "border-muted-foreground/30 bg-muted"
              )} />
              {i < items.length - 1 && <div className="w-px flex-1 bg-border/60 my-0.5" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-3">
              <div className="flex items-center justify-between">
                <p className={cn("text-sm font-medium truncate", item.overdue && "text-red-500")}>{item.label}</p>
                <span className={cn("text-[10px] shrink-0 ml-2",
                  item.overdue ? "text-red-500 font-bold" :
                  item.status === "sent" ? "text-emerald-600" :
                  item.status === "pending" ? "text-amber-600" :
                  "text-muted-foreground"
                )}>
                  {item.time}
                </span>
              </div>
              {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
              {item.status && (
                <Badge variant="outline" className={cn("text-[9px] mt-1 px-1.5 py-0",
                  item.status === "sent" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                )}>
                  {item.status === "sent" ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <Clock className="h-2.5 w-2.5 mr-0.5" />}
                  {item.status === "sent" ? "Sent" : "Pending"}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SHOWCASE PAGE ─────────────────────────────────────────────
export default function TodoTileShowcase() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg">Tasks & Reminders Tile — Pick a Style</h1>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-8">
        <div>
          <h2 className="text-sm font-bold text-primary mb-1">OPTION A — Minimal Checklist</h2>
          <p className="text-xs text-muted-foreground mb-3">Clean list with priority dots, inline reminders section, compact add input.</p>
          <OptionA />
        </div>

        <div>
          <h2 className="text-sm font-bold text-primary mb-1">OPTION B — Kanban Cards</h2>
          <p className="text-xs text-muted-foreground mb-3">Horizontally scrolling cards grouped by status. Reminder banner at top.</p>
          <OptionB />
        </div>

        <div>
          <h2 className="text-sm font-bold text-primary mb-1">OPTION C — Progress Ring</h2>
          <p className="text-xs text-muted-foreground mb-3">Motivational progress circle with remaining tasks listed below.</p>
          <OptionC />
        </div>

        <div>
          <h2 className="text-sm font-bold text-primary mb-1">OPTION D — Timeline Agenda</h2>
          <p className="text-xs text-muted-foreground mb-3">Vertical timeline mixing reminders and tasks. Overdue items pulse red.</p>
          <OptionD />
        </div>
      </div>
    </div>
  );
}
