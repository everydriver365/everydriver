import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Users, Phone, Mail, MapPin, Calendar, GraduationCap,
  PoundSterling, Clock, ChevronRight, BookOpen, MessageCircle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { LessonHistory } from "@/components/instructor/LessonHistory";
import { CertificateGenerator } from "@/components/instructor/CertificateGenerator";

interface Pupil {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  postcode: string;
  address: string;
  course_type: string | null;
  lessons_completed: number | null;
  progress: number | null;
  status: string | null;
  account_balance: number | null;
  test_date: string | null;
  profile_image_url: string | null;
  created_at: string;
  notes: string | null;
}

interface PupilSplitPaneProps {
  instructorId: string;
}

export function PupilSplitPane({ instructorId }: PupilSplitPaneProps) {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchPupils();
  }, [instructorId]);

  const fetchPupils = async () => {
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name, email, phone, postcode, address, course_type, lessons_completed, progress, status, account_balance, test_date, profile_image_url, created_at, notes")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .order("name");

      if (error) throw error;
      setPupils(data || []);
    } catch (err) {
      console.error("Error fetching pupils:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = pupils.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.postcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && (p.status || "active") === statusFilter;
  });

  const statusColor = (s: string | null) => {
    switch (s || "active") {
      case "active": return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
      case "passed": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "inactive": return "bg-muted text-muted-foreground";
      case "on_hold": return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-10rem)] rounded-none border bg-card">
      {/* Left: Pupil list */}
      <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
        <div className="flex flex-col h-full">
          {/* Search & filter */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pupils..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1">
              {["all", "active", "passed", "on_hold", "inactive"].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "ghost"}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? "All" : s === "on_hold" ? "Hold" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Pupil list */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3.5 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                No pupils found
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map((pupil) => (
                  <button
                    key={pupil.id}
                    onClick={() => setSelectedPupil(pupil)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors",
                      selectedPupil?.id === pupil.id && "bg-primary/5 border-l-2 border-l-primary"
                    )}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={pupil.profile_image_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {pupil.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pupil.name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>{pupil.lessons_completed || 0} lessons</span>
                        <span>·</span>
                        <span>{pupil.progress || 0}%</span>
                      </div>
                    </div>
                    <Badge className={cn("text-[9px] h-4 px-1.5 border-0", statusColor(pupil.status))}>
                      {(pupil.status || "active").replace("_", " ")}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer count */}
          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            {filtered.length} of {pupils.length} pupils
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right: Pupil detail */}
      <ResizablePanel defaultSize={65}>
        {selectedPupil ? (
          <PupilDetailPanel pupil={selectedPupil} instructorId={instructorId} onClose={() => setSelectedPupil(null)} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Users className="h-12 w-12 mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium">Select a pupil</p>
            <p className="text-xs mt-1">Click on a pupil to view their full profile</p>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

// Detail panel for selected pupil
function PupilDetailPanel({ pupil, instructorId, onClose }: { pupil: Pupil; instructorId: string; onClose: () => void }) {
  const [recentLessons, setRecentLessons] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, end_time, status, pickup_location, price")
        .eq("pupil_id", pupil.id)
        .order("lesson_date", { ascending: false })
        .limit(5);
      if (data) setRecentLessons(data);
    };
    fetchRecent();
  }, [pupil.id]);

  const balance = pupil.account_balance || 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={pupil.profile_image_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {pupil.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{pupil.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("text-[10px] border-0", statusColor(pupil.status))}>
                  {(pupil.status || "active").replace("_", " ")}
                </Badge>
                {pupil.course_type && (
                  <Badge variant="outline" className="text-[10px]">{pupil.course_type}</Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-3">
          {pupil.phone && (
            <a href={`tel:${pupil.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="h-4 w-4 text-primary" /> {pupil.phone}
            </a>
          )}
          {pupil.email && (
            <a href={`mailto:${pupil.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors truncate">
              <Mail className="h-4 w-4 text-primary" /> {pupil.email}
            </a>
          )}
          {pupil.address && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground col-span-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" /> {pupil.address}, {pupil.postcode}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Lessons", value: pupil.lessons_completed || 0, icon: BookOpen, color: "text-primary" },
            { label: "Progress", value: `${pupil.progress || 0}%`, icon: GraduationCap, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Balance", value: `£${Math.abs(balance).toFixed(0)}`, icon: PoundSterling, color: balance < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400" },
            { label: "Test", value: pupil.test_date ? format(new Date(pupil.test_date), "dd MMM") : "None", icon: Calendar, color: "text-amber-600 dark:text-amber-400" },
          ].map((stat) => (
            <Card key={stat.label} className="p-3 text-center">
              <stat.icon className={cn("h-4 w-4 mx-auto mb-1", stat.color)} />
              <p className="text-sm font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Recent lessons */}
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Lessons
          </h3>
          {recentLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lessons recorded yet</p>
          ) : (
            <div className="space-y-1.5">
              {recentLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between py-1.5 px-2 rounded-none bg-muted/30 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{format(new Date(lesson.lesson_date), "dd MMM yyyy")}</span>
                    {lesson.start_time && (
                      <span className="text-muted-foreground text-xs">{lesson.start_time.slice(0, 5)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {lesson.price && <span className="font-medium">£{lesson.price}</span>}
                    <Badge
                      variant={lesson.status === "completed" ? "default" : lesson.status === "cancelled" ? "destructive" : "secondary"}
                      className="text-[9px] h-4"
                    >
                      {lesson.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {pupil.notes && (
          <div>
            <h3 className="text-sm font-semibold mb-1">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-none p-3">{pupil.notes}</p>
          </div>
        )}

        {/* Certificate Generator */}
        <CertificateGenerator
          pupilName={pupil.name}
          pupilId={pupil.id}
          instructorName=""
          instructorId={instructorId}
        />
      </div>
    </ScrollArea>
  );
}

function statusColor(s: string | null) {
  switch (s || "active") {
    case "active": return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "passed": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "inactive": return "bg-muted text-muted-foreground";
    case "on_hold": return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    default: return "bg-muted text-muted-foreground";
  }
}
