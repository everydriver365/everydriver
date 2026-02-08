import { useState } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone, Mail, MapPin, Navigation, MessageSquare, Star,
  Calendar, GraduationCap, FileText, History, Award,
  ClipboardList, Car, PoundSterling, QrCode, Edit, Trash2,
  CheckCircle2, FileSignature, Route, Send, ExternalLink,
  UserCheck, Clock, ChevronDown, ChevronRight, CreditCard,
  AlertCircle, TrendingUp, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock pupil data
const mockPupil = {
  name: "Sarah Thompson",
  address: "42 Maple Drive, Northfield",
  postcode: "B31 2QT",
  phone: "07700 123456",
  email: "sarah.t@email.com",
  what3words: "filled.count.soap",
  course_type: "intensive",
  lessons_completed: 24,
  prepaid_hours: 6,
  account_balance: -120,
  progress: 68,
  test_date: "2026-03-15",
  notes: "Needs extra work on parallel parking and roundabouts. Confident on dual carriageways.",
  status: "active",
  payment_type: "deposit",
  deposit_paid: 200,
  balance_due_date: "2026-02-20",
  mock_tests: 2,
  real_tests: 0,
};

const QuickActionButton = ({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick?: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
    <div className={cn("h-11 w-11 rounded-full flex items-center justify-center", color)}>
      <Icon className="h-5 w-5" />
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const StatBox = ({ value, label, alert }: { value: string; label: string; alert?: boolean }) => (
  <div className={cn("rounded-xl p-3 text-center", alert ? "bg-rose-50 dark:bg-rose-950/30" : "bg-muted/50")}>
    <div className={cn("text-xl font-bold", alert && "text-rose-600")}>{value}</div>
    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
  </div>
);

const ToolButton = ({ icon: Icon, label, color = "text-primary" }: { icon: any; label: string; color?: string }) => (
  <Button variant="outline" size="sm" className="flex-col h-auto py-3 gap-1.5">
    <Icon className={cn("h-5 w-5", color)} />
    <span className="text-[10px]">{label}</span>
  </Button>
);

// ─── Option A: Tabbed Layout ───────────────────────────
function TabbedLayout() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 border-b border-border">
        <div className="relative">
          <Avatar className="h-14 w-14 ring-2 ring-primary ring-offset-2">
            <AvatarFallback className="text-white text-base font-bold" style={{ backgroundColor: '#1877F2' }}>ST</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base">{mockPupil.name}</h3>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">
              <UserCheck className="h-3 w-3 mr-0.5" /> Active
            </Badge>
          </div>
          <p className="text-sm text-primary mt-0.5">Intensive · Test 15 Mar</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={68} className="h-1.5 flex-1" />
            <span className="text-xs font-semibold text-primary">68%</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-around py-3 px-4 bg-muted/30 border-b border-border">
        <QuickActionButton icon={Phone} label="Call" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" />
        <QuickActionButton icon={MessageSquare} label="Text" color="bg-blue-100 dark:bg-blue-900/30 text-blue-600" />
        <QuickActionButton icon={Navigation} label="Navigate" color="bg-purple-100 dark:bg-purple-900/30 text-purple-600" />
        <QuickActionButton icon={Mail} label="Chat" color="bg-primary/10 text-primary" />
        <QuickActionButton icon={PoundSterling} label="Pay" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
          {["Overview", "Payments", "Progress", "Tests", "History"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase()}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 text-xs font-medium"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="p-4 space-y-4 mt-0">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatBox value="24" label="Lessons" />
            <StatBox value="6h" label="Credit" />
            <StatBox value="-£120" label="Balance" alert />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p>{mockPupil.address}</p>
                <p className="text-muted-foreground">{mockPupil.postcode}</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-sm text-primary hover:underline ml-6">
              <span className="font-medium">///</span>
              <span>{mockPupil.what3words}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          {/* Test Date */}
          <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-xl p-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Test: Sat, 15 Mar</span>
            <span className="text-xs text-muted-foreground ml-auto">35 days</span>
          </div>

          {/* Payment Due */}
          <div className="flex items-center gap-2 text-sm bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-xl p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>£120 due by 20 Feb (12 days left)</span>
          </div>

          {/* Notes */}
          <div className="flex items-start gap-2 text-sm bg-muted/30 rounded-xl p-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground">{mockPupil.notes}</p>
          </div>

          {/* T&Cs */}
          <Button variant="outline" size="sm" className="w-full border-emerald-500 text-emerald-600">
            <CheckCircle2 className="h-4 w-4 mr-2" /> T&Cs Signed
          </Button>

          {/* Edit/Delete */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>
            <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="p-4 space-y-4 mt-0">
          <div className="grid grid-cols-3 gap-2">
            <StatBox value="£200" label="Deposit" />
            <StatBox value="6h" label="Credit" />
            <StatBox value="-£120" label="Owed" alert />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><PoundSterling className="h-4 w-4 mr-1" /> Record</Button>
            <Button variant="outline" size="sm"><QrCode className="h-4 w-4 mr-1" /> QR</Button>
            <Button variant="outline" size="sm" className="text-amber-600"><Send className="h-4 w-4 mr-1" /> Remind</Button>
          </div>
          {/* Mock payment history */}
          {[
            { date: "5 Feb", amount: "£40.00", method: "Card" },
            { date: "29 Jan", amount: "£40.00", method: "Cash" },
            { date: "22 Jan", amount: "£200.00", method: "Card", note: "Deposit" },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{p.amount}</p>
                <p className="text-xs text-muted-foreground">{p.date} · {p.method}{p.note ? ` · ${p.note}` : ""}</p>
              </div>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="progress" className="p-4 space-y-4 mt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-bold">68%</span>
            </div>
            <Progress value={68} className="h-3" />
          </div>
          <Button variant="outline" className="w-full"><GraduationCap className="h-4 w-4 mr-2" /> Open Syllabus</Button>
          {/* Mock syllabus progress */}
          {[
            { skill: "Moving Off & Stopping", level: 5 },
            { skill: "Use of Mirrors", level: 4 },
            { skill: "Roundabouts", level: 2 },
            { skill: "Parallel Parking", level: 1 },
            { skill: "Emergency Stop", level: 3 },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm flex-1">{s.skill}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((l) => (
                  <div key={l} className={cn("h-2 w-4 rounded-sm", l <= s.level ? "bg-primary" : "bg-muted")} />
                ))}
              </div>
            </div>
          ))}
          {/* Feedback */}
          <div className="bg-muted/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Wed, 5 Feb</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("h-3 w-3", s <= 4 ? "fill-amber-400 text-amber-400" : "text-muted")} />
                ))}
              </div>
            </div>
            <p className="text-sm">Great progress on junctions today. Focus on mirror checks before roundabouts next.</p>
          </div>
          <Button variant="outline" size="sm" className="w-full"><Send className="h-4 w-4 mr-2" /> Add Feedback</Button>
        </TabsContent>

        <TabsContent value="tests" className="p-4 space-y-4 mt-0">
          <div className="grid grid-cols-2 gap-2">
            <StatBox value="2" label="Mock Tests" />
            <StatBox value="0" label="Real Tests" />
          </div>
          {mockPupil.test_date && (
            <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-xl p-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Test booked: Sat, 15 Mar</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm"><Award className="h-4 w-4 mr-1" /> Record Test</Button>
            <Button variant="outline" size="sm"><ClipboardList className="h-4 w-4 mr-1" /> Record Mock</Button>
          </div>
          {/* Mock test results */}
          {[
            { date: "1 Feb", type: "Mock", result: "fail", minors: 8, serious: 2 },
            { date: "15 Jan", type: "Mock", result: "fail", minors: 12, serious: 1 },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                <div>
                  <p className="text-sm font-medium">{t.type} Test — Fail</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {t.minors}m <span className="text-rose-500">{t.serious}s</span>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="history" className="p-4 space-y-4 mt-0">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm"><History className="h-4 w-4 mr-1" /> Lesson Log</Button>
            <Button variant="outline" size="sm"><Car className="h-4 w-4 mr-1" /> Driving Report</Button>
          </div>
          <Button variant="outline" size="sm" className="w-full"><Route className="h-4 w-4 mr-2" /> Tracking History</Button>
          {/* Mock lesson history */}
          {[
            { date: "Wed, 5 Feb", time: "09:00", duration: 120, topic: "Roundabouts & junctions" },
            { date: "Mon, 3 Feb", time: "14:00", duration: 60, topic: "Dual carriageway practice" },
            { date: "Fri, 31 Jan", time: "10:00", duration: 120, topic: "Mock test route" },
          ].map((l, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{l.topic}</p>
                <p className="text-xs text-muted-foreground">{l.date} at {l.time} · {l.duration}min</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{l.duration}m</Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Option B: Timeline / Feed Layout ─────────────────
function TimelineLayout() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Sticky header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-white text-base font-bold" style={{ backgroundColor: '#1877F2' }}>ST</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base">{mockPupil.name}</h3>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]"><UserCheck className="h-3 w-3 mr-0.5" /> Active</Badge>
              <Badge variant="secondary" className="text-[10px]">Intensive</Badge>
              <Badge className="bg-primary/10 text-primary text-[10px]">68%</Badge>
            </div>
          </div>
        </div>
        {/* Inline stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center">
            <div className="text-lg font-bold">24</div>
            <div className="text-[9px] text-muted-foreground uppercase">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">6h</div>
            <div className="text-[9px] text-muted-foreground uppercase">Credit</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-rose-600">-£120</div>
            <div className="text-[9px] text-muted-foreground uppercase">Owed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">35d</div>
            <div className="text-[9px] text-muted-foreground uppercase">To Test</div>
          </div>
        </div>
      </div>

      {/* Action pills */}
      <div className="flex gap-2 p-3 overflow-x-auto border-b border-border">
        {[
          { icon: Phone, label: "Call" },
          { icon: MessageSquare, label: "Text" },
          { icon: Navigation, label: "Nav" },
          { icon: PoundSterling, label: "Pay" },
          { icon: GraduationCap, label: "Syllabus" },
          { icon: Award, label: "Test" },
          { icon: Car, label: "Report" },
          { icon: Edit, label: "Edit" },
        ].map((a) => (
          <Button key={a.label} variant="outline" size="sm" className="shrink-0 text-xs gap-1.5 rounded-full px-3">
            <a.icon className="h-3.5 w-3.5" /> {a.label}
          </Button>
        ))}
      </div>

      {/* Timeline feed */}
      <div className="p-4">
        <div className="relative border-l-2 border-primary/20 ml-3 space-y-6">
          {/* Payment due warning */}
          <TimelineItem
            icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
            time="Due 20 Feb"
            color="bg-amber-100"
          >
            <p className="text-sm font-medium text-amber-700">£120 outstanding balance</p>
            <p className="text-xs text-muted-foreground">12 days until due date</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" className="text-xs h-7"><PoundSterling className="h-3 w-3 mr-1" /> Record</Button>
              <Button variant="outline" size="sm" className="text-xs h-7"><Send className="h-3 w-3 mr-1" /> Remind</Button>
            </div>
          </TimelineItem>

          {/* Latest feedback */}
          <TimelineItem
            icon={<Star className="h-4 w-4 text-amber-500" />}
            time="Wed, 5 Feb"
            color="bg-amber-50"
          >
            <div className="flex items-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn("h-3 w-3", s <= 4 ? "fill-amber-400 text-amber-400" : "text-muted")} />
              ))}
            </div>
            <p className="text-sm">Great progress on junctions today. Focus on mirror checks before roundabouts next.</p>
          </TimelineItem>

          {/* Lesson */}
          <TimelineItem
            icon={<Calendar className="h-4 w-4 text-primary" />}
            time="Wed, 5 Feb · 09:00"
            color="bg-primary/10"
          >
            <p className="text-sm font-medium">2hr lesson — Roundabouts & junctions</p>
            <p className="text-xs text-muted-foreground">Covered 18.4 miles · Avg 24 mph</p>
          </TimelineItem>

          {/* Payment */}
          <TimelineItem
            icon={<PoundSterling className="h-4 w-4 text-emerald-600" />}
            time="Wed, 5 Feb"
            color="bg-emerald-50"
          >
            <p className="text-sm font-medium text-emerald-700">£40.00 received</p>
            <p className="text-xs text-muted-foreground">Card payment</p>
          </TimelineItem>

          {/* Lesson */}
          <TimelineItem
            icon={<Calendar className="h-4 w-4 text-primary" />}
            time="Mon, 3 Feb · 14:00"
            color="bg-primary/10"
          >
            <p className="text-sm font-medium">1hr lesson — Dual carriageway practice</p>
          </TimelineItem>

          {/* Mock test */}
          <TimelineItem
            icon={<ClipboardList className="h-4 w-4 text-rose-500" />}
            time="Sat, 1 Feb"
            color="bg-rose-50"
          >
            <p className="text-sm font-medium">Mock Test — Fail</p>
            <p className="text-xs text-muted-foreground">8 minors · 2 serious faults</p>
          </TimelineItem>

          {/* Payment */}
          <TimelineItem
            icon={<PoundSterling className="h-4 w-4 text-emerald-600" />}
            time="Wed, 29 Jan"
            color="bg-emerald-50"
          >
            <p className="text-sm font-medium text-emerald-700">£40.00 received</p>
            <p className="text-xs text-muted-foreground">Cash</p>
          </TimelineItem>
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button variant="outline" size="sm" className="w-full border-emerald-500 text-emerald-600">
          <CheckCircle2 className="h-4 w-4 mr-2" /> T&Cs Signed
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>
          <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ icon, time, color, children }: { icon: React.ReactNode; time: string; color: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-8">
      <div className={cn("absolute -left-[9px] top-0 h-5 w-5 rounded-full flex items-center justify-center", color)}>
        {icon}
      </div>
      <p className="text-[10px] text-muted-foreground font-medium mb-1">{time}</p>
      <div className="bg-muted/30 rounded-xl p-3">{children}</div>
    </div>
  );
}

// ─── Option C: Dashboard Cards Layout ──────────────────
function DashboardCardsLayout() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Compact header */}
      <div className="p-4 flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="text-white text-sm font-bold" style={{ backgroundColor: '#1877F2' }}>ST</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px]">{mockPupil.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">Active</Badge>
            <Badge variant="secondary" className="text-[10px]">Intensive</Badge>
          </div>
        </div>
        {/* Quick icons */}
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MessageSquare className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Navigation className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Dashboard stat cards — 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Lessons</span>
            </div>
            <div className="text-2xl font-bold">24</div>
            <Progress value={68} className="h-1 mt-1" />
            <p className="text-[10px] text-muted-foreground mt-0.5">68% complete</p>
          </CardContent>
        </Card>

        <Card className={cn("border-rose-200 dark:border-rose-800", "bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20")}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <PoundSterling className="h-4 w-4 text-rose-600" />
              <span className="text-xs text-muted-foreground">Finance</span>
            </div>
            <div className="text-2xl font-bold text-rose-600">-£120</div>
            <p className="text-[10px] text-muted-foreground">6h credit · £200 deposit</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Test Date</span>
            </div>
            <div className="text-lg font-bold">15 Mar</div>
            <p className="text-[10px] text-muted-foreground">35 days away</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Tests</span>
            </div>
            <div className="text-lg font-bold">2 mock</div>
            <p className="text-[10px] text-muted-foreground">0 real tests</p>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible sections */}
      <div className="border-t border-border">
        <CollapsibleSection
          title="Contact & Address"
          icon={<MapPin className="h-4 w-4" />}
          open={expandedSection === "contact"}
          onToggle={() => toggle("contact")}
        >
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p>{mockPupil.address}</p>
                <p className="text-muted-foreground">{mockPupil.postcode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{mockPupil.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{mockPupil.email}</span>
            </div>
            <button className="flex items-center gap-2 text-sm text-primary hover:underline ml-6">
              <span className="font-medium">///</span>
              <span>{mockPupil.what3words}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Payments"
          icon={<PoundSterling className="h-4 w-4" />}
          open={expandedSection === "payments"}
          onToggle={() => toggle("payments")}
          badge={<Badge variant="destructive" className="text-[10px]">£120 owed</Badge>}
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><PoundSterling className="h-4 w-4 mr-1" /> Record</Button>
              <Button variant="outline" size="sm"><QrCode className="h-4 w-4 mr-1" /> QR</Button>
              <Button variant="outline" size="sm"><Send className="h-4 w-4 mr-1" /> Remind</Button>
            </div>
            {[
              { date: "5 Feb", amount: "£40.00", method: "Card" },
              { date: "29 Jan", amount: "£40.00", method: "Cash" },
              { date: "22 Jan", amount: "£200.00", method: "Card", note: "Deposit" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium">{p.amount}</p>
                  <p className="text-xs text-muted-foreground">{p.date} · {p.method}</p>
                </div>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Lesson Feedback"
          icon={<Star className="h-4 w-4" />}
          open={expandedSection === "feedback"}
          onToggle={() => toggle("feedback")}
        >
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Wed, 5 Feb</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("h-3 w-3", s <= 4 ? "fill-amber-400 text-amber-400" : "text-muted")} />
                  ))}
                </div>
              </div>
              <p className="text-sm">Great progress on junctions. Focus on mirrors before roundabouts.</p>
            </div>
            <Button variant="outline" size="sm" className="w-full"><Send className="h-4 w-4 mr-2" /> Add Feedback</Button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Syllabus & Progress"
          icon={<GraduationCap className="h-4 w-4" />}
          open={expandedSection === "syllabus"}
          onToggle={() => toggle("syllabus")}
        >
          <div className="space-y-3">
            {[
              { skill: "Moving Off & Stopping", level: 5 },
              { skill: "Use of Mirrors", level: 4 },
              { skill: "Roundabouts", level: 2 },
              { skill: "Parallel Parking", level: 1 },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm flex-1">{s.skill}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((l) => (
                    <div key={l} className={cn("h-2 w-4 rounded-sm", l <= s.level ? "bg-primary" : "bg-muted")} />
                  ))}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full"><GraduationCap className="h-4 w-4 mr-2" /> Full Syllabus</Button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Tracking & Routes"
          icon={<Route className="h-4 w-4" />}
          open={expandedSection === "tracking"}
          onToggle={() => toggle("tracking")}
        >
          <div className="space-y-2">
            {[
              { date: "5 Feb 09:00", distance: "18.4 mi", duration: "1h 52m" },
              { date: "3 Feb 14:00", distance: "12.1 mi", duration: "58m" },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium">{t.date}</p>
                  <p className="text-xs text-muted-foreground">{t.distance} · {t.duration}</p>
                </div>
                <Route className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Tests & Results"
          icon={<Award className="h-4 w-4" />}
          open={expandedSection === "tests"}
          onToggle={() => toggle("tests")}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm"><Award className="h-4 w-4 mr-1" /> Record Test</Button>
              <Button variant="outline" size="sm"><ClipboardList className="h-4 w-4 mr-1" /> Record Mock</Button>
            </div>
            {[
              { date: "1 Feb", type: "Mock", result: "fail", minors: 8, serious: 2 },
              { date: "15 Jan", type: "Mock", result: "fail", minors: 12, serious: 1 },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                  <div>
                    <p className="text-sm font-medium">{t.type} — Fail</p>
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{t.minors}m <span className="text-rose-500">{t.serious}s</span></span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm"><History className="h-4 w-4 mr-1" /> Lessons</Button>
          <Button variant="outline" size="sm"><Car className="h-4 w-4 mr-1" /> Report</Button>
          <Button variant="outline" size="sm"><FileSignature className="h-4 w-4 mr-1" /> T&Cs</Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>
          <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon, open, onToggle, badge, children }: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
          {badge}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ─── Option D: Combined Layout (Timeline left, Dashboard right) ───
function CombinedLayout() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left column — Timeline (1/3) */}
      <div className="lg:col-span-1">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Compact header */}
          <div className="p-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-white text-xs font-bold" style={{ backgroundColor: '#1877F2' }}>ST</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-bold text-sm">{mockPupil.name}</h3>
                <p className="text-xs text-muted-foreground">Pupil Journey</p>
              </div>
            </div>
          </div>

          {/* Timeline feed */}
          <ScrollArea className="h-[600px]">
            <div className="p-4">
              <div className="relative border-l-2 border-primary/20 ml-3 space-y-5">
                <TimelineItem icon={<AlertCircle className="h-4 w-4 text-amber-600" />} time="Due 20 Feb" color="bg-amber-100">
                  <p className="text-sm font-medium text-amber-700">£120 outstanding</p>
                  <p className="text-xs text-muted-foreground">12 days until due</p>
                </TimelineItem>

                <TimelineItem icon={<Star className="h-4 w-4 text-amber-500" />} time="Wed, 5 Feb" color="bg-amber-50">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-3 w-3", s <= 4 ? "fill-amber-400 text-amber-400" : "text-muted")} />
                    ))}
                  </div>
                  <p className="text-sm">Great progress on junctions. Focus on mirrors before roundabouts.</p>
                </TimelineItem>

                <TimelineItem icon={<Calendar className="h-4 w-4 text-primary" />} time="Wed, 5 Feb · 09:00" color="bg-primary/10">
                  <p className="text-sm font-medium">2hr — Roundabouts & junctions</p>
                  <p className="text-xs text-muted-foreground">18.4 mi · Avg 24 mph</p>
                </TimelineItem>

                <TimelineItem icon={<PoundSterling className="h-4 w-4 text-emerald-600" />} time="Wed, 5 Feb" color="bg-emerald-50">
                  <p className="text-sm font-medium text-emerald-700">£40.00 received</p>
                  <p className="text-xs text-muted-foreground">Card payment</p>
                </TimelineItem>

                <TimelineItem icon={<Calendar className="h-4 w-4 text-primary" />} time="Mon, 3 Feb · 14:00" color="bg-primary/10">
                  <p className="text-sm font-medium">1hr — Dual carriageway</p>
                </TimelineItem>

                <TimelineItem icon={<ClipboardList className="h-4 w-4 text-rose-500" />} time="Sat, 1 Feb" color="bg-rose-50">
                  <p className="text-sm font-medium">Mock Test — Fail</p>
                  <p className="text-xs text-muted-foreground">8 minors · 2 serious</p>
                </TimelineItem>

                <TimelineItem icon={<PoundSterling className="h-4 w-4 text-emerald-600" />} time="Wed, 29 Jan" color="bg-emerald-50">
                  <p className="text-sm font-medium text-emerald-700">£40.00 received</p>
                  <p className="text-xs text-muted-foreground">Cash</p>
                </TimelineItem>

                <TimelineItem icon={<Calendar className="h-4 w-4 text-primary" />} time="Fri, 31 Jan · 10:00" color="bg-primary/10">
                  <p className="text-sm font-medium">2hr — Mock test route</p>
                </TimelineItem>

                <TimelineItem icon={<PoundSterling className="h-4 w-4 text-emerald-600" />} time="Wed, 22 Jan" color="bg-emerald-50">
                  <p className="text-sm font-medium text-emerald-700">£200.00 deposit</p>
                  <p className="text-xs text-muted-foreground">Card payment</p>
                </TimelineItem>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right column — Dashboard Cards (2/3) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header with actions */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-primary ring-offset-2">
                <AvatarFallback className="text-white text-base font-bold" style={{ backgroundColor: '#1877F2' }}>ST</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{mockPupil.name}</h3>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">
                  <UserCheck className="h-3 w-3 mr-0.5" /> Active
                </Badge>
                <Badge variant="secondary" className="text-[10px]">Intensive</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{mockPupil.address}, {mockPupil.postcode}</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <QuickActionButton icon={Phone} label="Call" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" />
              <QuickActionButton icon={MessageSquare} label="Text" color="bg-blue-100 dark:bg-blue-900/30 text-blue-600" />
              <QuickActionButton icon={Navigation} label="Nav" color="bg-purple-100 dark:bg-purple-900/30 text-purple-600" />
              <QuickActionButton icon={Mail} label="Chat" color="bg-primary/10 text-primary" />
              <QuickActionButton icon={PoundSterling} label="Pay" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Stat cards — 2x2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Lessons</span>
              </div>
              <div className="text-3xl font-bold">24</div>
              <Progress value={68} className="h-1.5 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">68% syllabus complete</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 border-rose-200 dark:border-rose-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <PoundSterling className="h-4 w-4 text-rose-600" />
                <span className="text-xs text-muted-foreground">Finance</span>
              </div>
              <div className="text-3xl font-bold text-rose-600">-£120</div>
              <p className="text-xs text-muted-foreground mt-1">6h credit · £200 deposit</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">Test Date</span>
              </div>
              <div className="text-2xl font-bold">15 Mar</div>
              <p className="text-xs text-muted-foreground mt-1">35 days away</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Tests</span>
              </div>
              <div className="text-2xl font-bold">2 mock</div>
              <p className="text-xs text-muted-foreground mt-1">0 real tests</p>
            </CardContent>
          </Card>
        </div>

        {/* Collapsible detail sections */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <CollapsibleSection
            title="Contact & Address"
            icon={<MapPin className="h-4 w-4" />}
            open={expandedSection === "contact"}
            onToggle={() => toggle("contact")}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{mockPupil.address}</p>
                    <p className="text-muted-foreground">{mockPupil.postcode}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-sm text-primary hover:underline ml-6">
                  <span className="font-medium">///</span>
                  <span>{mockPupil.what3words}</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{mockPupil.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{mockPupil.email}</span>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Payments"
            icon={<PoundSterling className="h-4 w-4" />}
            open={expandedSection === "payments"}
            onToggle={() => toggle("payments")}
            badge={<Badge variant="destructive" className="text-[10px]">£120 owed</Badge>}
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><PoundSterling className="h-4 w-4 mr-1" /> Record</Button>
                <Button variant="outline" size="sm"><QrCode className="h-4 w-4 mr-1" /> QR</Button>
                <Button variant="outline" size="sm"><Send className="h-4 w-4 mr-1" /> Remind</Button>
              </div>
              {[
                { date: "5 Feb", amount: "£40.00", method: "Card" },
                { date: "29 Jan", amount: "£40.00", method: "Cash" },
                { date: "22 Jan", amount: "£200.00", method: "Card", note: "Deposit" },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm font-medium">{p.amount}</p>
                    <p className="text-xs text-muted-foreground">{p.date} · {p.method}{p.note ? ` · ${p.note}` : ""}</p>
                  </div>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Syllabus & Progress"
            icon={<GraduationCap className="h-4 w-4" />}
            open={expandedSection === "syllabus"}
            onToggle={() => toggle("syllabus")}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { skill: "Moving Off & Stopping", level: 5 },
                  { skill: "Use of Mirrors", level: 4 },
                  { skill: "Roundabouts", level: 2 },
                  { skill: "Parallel Parking", level: 1 },
                  { skill: "Emergency Stop", level: 3 },
                  { skill: "Dual Carriageways", level: 4 },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm flex-1">{s.skill}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((l) => (
                        <div key={l} className={cn("h-2 w-4 rounded-sm", l <= s.level ? "bg-primary" : "bg-muted")} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full"><GraduationCap className="h-4 w-4 mr-2" /> Full Syllabus</Button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Lesson Feedback"
            icon={<Star className="h-4 w-4" />}
            open={expandedSection === "feedback"}
            onToggle={() => toggle("feedback")}
          >
            <div className="space-y-3">
              <div className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Wed, 5 Feb</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-3 w-3", s <= 4 ? "fill-amber-400 text-amber-400" : "text-muted")} />
                    ))}
                  </div>
                </div>
                <p className="text-sm">Great progress on junctions. Focus on mirrors before roundabouts.</p>
              </div>
              <Button variant="outline" size="sm" className="w-full"><Send className="h-4 w-4 mr-2" /> Add Feedback</Button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Tests & Results"
            icon={<Award className="h-4 w-4" />}
            open={expandedSection === "tests"}
            onToggle={() => toggle("tests")}
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Award className="h-4 w-4 mr-1" /> Record Test</Button>
                <Button variant="outline" size="sm"><ClipboardList className="h-4 w-4 mr-1" /> Record Mock</Button>
              </div>
              {[
                { date: "1 Feb", type: "Mock", minors: 8, serious: 2 },
                { date: "15 Jan", type: "Mock", minors: 12, serious: 1 },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <div>
                      <p className="text-sm font-medium">{t.type} — Fail</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{t.minors}m <span className="text-rose-500">{t.serious}s</span></span>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Tracking & Routes"
            icon={<Route className="h-4 w-4" />}
            open={expandedSection === "tracking"}
            onToggle={() => toggle("tracking")}
          >
            <div className="space-y-2">
              {[
                { date: "5 Feb 09:00", distance: "18.4 mi", duration: "1h 52m" },
                { date: "3 Feb 14:00", distance: "12.1 mi", duration: "58m" },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm font-medium">{t.date}</p>
                    <p className="text-xs text-muted-foreground">{t.distance} · {t.duration}</p>
                  </div>
                  <Route className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>

        {/* Footer actions */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><History className="h-4 w-4 mr-1" /> Lesson Log</Button>
              <Button variant="outline" size="sm"><Car className="h-4 w-4 mr-1" /> Driving Report</Button>
              <Button variant="outline" size="sm"><FileSignature className="h-4 w-4 mr-1" /> T&Cs</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>
              <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
            </div>
          </div>

          {/* Notes */}
          <div className="flex items-start gap-2 text-sm bg-muted/30 rounded-xl p-3 mt-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground">{mockPupil.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Demo Page ────────────────────────────────────
export default function PupilCardDemo() {
  const [selectedOption, setSelectedOption] = useState("combined");

  return (
    <InstructorPortalLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Pupil Card Redesign Options</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compare 4 layout options. All include the same features: contact actions, stats, payments, feedback, syllabus, tests, tracking, T&Cs, and edit/delete.
          </p>
        </div>

        {/* Selector */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "All Options" },
            { value: "tabbed", label: "A: Tabbed" },
            { value: "timeline", label: "B: Timeline" },
            { value: "dashboard", label: "C: Dashboard Cards" },
            { value: "combined", label: "D: Combined" },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={selectedOption === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedOption(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Options display */}
        {selectedOption === "combined" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">D</Badge>
              <h2 className="font-semibold">Combined — Timeline + Dashboard Cards</h2>
            </div>
            <p className="text-xs text-muted-foreground">Timeline feed on the left showing the pupil's chronological journey. Dashboard stat cards and collapsible sections on the right for quick access to all tools.</p>
            <CombinedLayout />
          </div>
        ) : (
          <div className={cn(
            "gap-6",
            selectedOption === "all" ? "grid md:grid-cols-3" : "max-w-md mx-auto"
          )}>
            {(selectedOption === "all" || selectedOption === "tabbed") && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">A</Badge>
                  <h2 className="font-semibold">Tabbed Sections</h2>
                </div>
                <p className="text-xs text-muted-foreground">Clean separation. Each feature area in its own tab. Minimal scrolling within each view.</p>
                <TabbedLayout />
              </div>
            )}

            {(selectedOption === "all" || selectedOption === "timeline") && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">B</Badge>
                  <h2 className="font-semibold">Timeline / Feed</h2>
                </div>
                <p className="text-xs text-muted-foreground">Chronological view mixing lessons, payments, tests, and feedback. Shows the pupil's journey at a glance.</p>
                <TimelineLayout />
              </div>
            )}

            {(selectedOption === "all" || selectedOption === "dashboard") && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">C</Badge>
                  <h2 className="font-semibold">Dashboard Cards</h2>
                </div>
                <p className="text-xs text-muted-foreground">Key metrics up front in coloured cards. Drill into any section via collapsible panels.</p>
                <DashboardCardsLayout />
              </div>
            )}
          </div>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
