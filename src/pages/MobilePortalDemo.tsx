import { useState } from "react";
import { 
  BookOpen, Clock, PoundSterling, MapPin, Calendar, ChevronRight, 
  Users, TrendingUp, MessageSquare, Briefcase, Settings, 
  Car, Fuel, CheckCircle, Bell, Star, Globe, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/ui/StatCard";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import edLogo from "@/assets/ed-black-white-logo.png";

// Mock data for demo
const mockNextLesson = {
  pupilName: "Sarah Johnson",
  startTime: "10:30 AM",
  pickupPostcode: "SW1A 1AA",
  minutesUntil: 25,
};

const mockTodayStats = {
  lessons: 4,
  hours: 6,
  earnings: 180,
};

const mockPupils = [
  { name: "Sarah Johnson", initials: "SJ", nextLesson: "Today 10:30", balance: 120 },
  { name: "James Wilson", initials: "JW", nextLesson: "Tomorrow 2:00", balance: -45 },
  { name: "Emily Brown", initials: "EB", nextLesson: "Thu 9:00", balance: 0 },
];

const mockTomorrow = {
  lessons: 3,
  hours: 4.5,
  earnings: 135,
  firstTime: "09:00 AM",
};

export default function MobilePortalDemo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={edLogo} alt="Logo" className="h-5" />
            <span className="text-sm font-semibold text-muted-foreground">Design Demo</span>
          </div>
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* ── HERO BANNER ── navy gradient, brand-identity */}
      <div className="bg-gradient-to-br from-[#142040] to-[#1e3a6e] px-4 py-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12 border-2 border-white/20">
            <AvatarFallback className="bg-white/20 text-white font-bold">JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold">Good morning, John!</h1>
            <p className="text-white/60 text-xs">4 lessons today · Online</p>
          </div>
        </div>

        {/* Inline stats row inside hero */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-white/70" />
              <span className="text-lg font-bold">{mockTodayStats.lessons}</span>
            </div>
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Lessons</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-3.5 w-3.5 text-white/70" />
              <span className="text-lg font-bold">{mockTodayStats.hours}</span>
            </div>
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Hours</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1">
              <PoundSterling className="h-3.5 w-3.5 text-white/70" />
              <span className="text-lg font-bold">£{mockTodayStats.earnings}</span>
            </div>
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Expected</span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="px-4 pb-24 space-y-4 mt-4">

        {/* ── NEXT LESSON CARD ── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 to-transparent px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Next Up</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              In {mockNextLesson.minutesUntil} mins
            </Badge>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">SJ</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{mockNextLesson.pupilName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{mockNextLesson.startTime}</span>
                  <MapPin className="h-3 w-3 ml-1" />
                  <span>{mockNextLesson.pickupPostcode}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ── gradient backgrounds */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">TODAY'S STATS</p>
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={BookOpen} label="Lessons" value={mockTodayStats.lessons} variant="primary" />
            <StatCard icon={Clock} label="Hours" value={mockTodayStats.hours} variant="info" />
            <StatCard icon={PoundSterling} label="Earnings" value={`£${mockTodayStats.earnings}`} variant="success" />
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">QUICK ACTIONS</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: MessageSquare, label: "Messages", color: "text-primary" },
              { icon: Calendar, label: "Schedule", color: "text-primary" },
              { icon: Users, label: "Pupils", color: "text-primary" },
              { icon: MapPin, label: "Track", color: "text-primary" },
              { icon: Car, label: "Sat Nav", color: "text-primary" },
              { icon: Briefcase, label: "Jobs", color: "text-primary" },
            ].map((action) => (
              <div key={action.label} className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-1.5 cursor-pointer hover:shadow-sm transition-all">
                <action.icon className={cn("h-5 w-5", action.color)} />
                <span className="text-[10px] font-medium text-muted-foreground">{action.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── COLLAPSIBLE SECTIONS ── matching desktop SectionPanel style */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">INSIGHTS</p>

          <div className="space-y-3">
            {/* Payment Summary */}
            <SectionPanel
              title="Payment Summary"
              icon={<PoundSterling className="h-4 w-4 text-primary" />}
              badge={<Badge variant="secondary" className="text-[10px]">This Week</Badge>}
              defaultOpen
              headerGradient
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Collected</span>
                  <span className="text-sm font-bold text-emerald-600">£540</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                  <span className="text-sm font-bold text-rose-600">£85</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-sm font-medium">Total Expected</span>
                  <span className="text-sm font-bold">£625</span>
                </div>
              </div>
            </SectionPanel>

            {/* Pupils Overview */}
            <SectionPanel
              title="Pupils"
              icon={<Users className="h-4 w-4 text-primary" />}
              badge={<Badge variant="secondary" className="text-[10px]">{mockPupils.length}</Badge>}
              headerGradient
            >
              <div className="space-y-2">
                {mockPupils.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 py-2">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{p.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-primary">{p.nextLesson}</p>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      p.balance > 0 ? "text-emerald-600" : p.balance < 0 ? "text-rose-600" : "text-muted-foreground"
                    )}>
                      {p.balance < 0 ? `-£${Math.abs(p.balance)}` : `£${p.balance}`}
                    </span>
                  </div>
                ))}
              </div>
            </SectionPanel>

            {/* Tomorrow Preview */}
            <SectionPanel
              title="Tomorrow"
              icon={<Calendar className="h-4 w-4 text-primary" />}
              badge={<Badge variant="secondary" className="text-[10px]">{mockTomorrow.lessons} lessons</Badge>}
              headerGradient
            >
              <div className="grid grid-cols-3 gap-2">
                <StatCard icon={BookOpen} label="Lessons" value={mockTomorrow.lessons} variant="primary" />
                <StatCard icon={Clock} label="Hours" value={mockTomorrow.hours} variant="info" />
                <StatCard icon={PoundSterling} label="Expected" value={`£${mockTomorrow.earnings}`} variant="success" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">First lesson at {mockTomorrow.firstTime}</p>
            </SectionPanel>

            {/* Reminders */}
            <SectionPanel
              title="Reminders"
              icon={<Bell className="h-4 w-4 text-primary" />}
              badge={<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">All Sent</Badge>}
              headerGradient
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-muted-foreground">24h reminders sent (3/3)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-muted-foreground">1h reminders sent (3/3)</span>
                </div>
              </div>
            </SectionPanel>

            {/* Plan */}
            <SectionPanel
              title="Your Plan"
              icon={<Star className="h-4 w-4 text-primary" />}
              badge={<Badge className="bg-primary/10 text-primary text-[10px]">Pro</Badge>}
              headerGradient
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">Pro — £14.99/mo</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SMS Credits</span>
                  <span className="font-medium text-emerald-600">42 remaining</span>
                </div>
                <Progress value={70} className="h-1.5 mt-1" />
              </div>
            </SectionPanel>

            {/* Referrals */}
            <SectionPanel
              title="Referrals"
              icon={<Globe className="h-4 w-4 text-primary" />}
              headerGradient
            >
              <div className="grid grid-cols-3 gap-2">
                <StatCard icon={Users} label="Referred" value={5} variant="primary" />
                <StatCard icon={CheckCircle} label="Converted" value={3} variant="success" />
                <StatCard icon={PoundSterling} label="Earned" value="£45" variant="info" />
              </div>
            </SectionPanel>
          </div>
        </div>

        {/* ── WEEKLY STATS ── */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">THIS WEEK</p>
          <div className="grid grid-cols-2 gap-2">
            <StatCard icon={TrendingUp} label="Earnings" value="£540" subtitle="↑ 12% vs last week" variant="success" />
            <StatCard icon={Clock} label="Hours" value="22" subtitle="Goal: 30h" variant="info" />
          </div>
          <div className="mt-2">
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Weekly Goal Progress</span>
                <span className="text-xs font-bold">73%</span>
              </div>
              <Progress value={73} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
