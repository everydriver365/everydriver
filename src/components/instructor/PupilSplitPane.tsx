import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, Users, Phone, Mail, MapPin, Calendar, GraduationCap,
  PoundSterling, Clock, BookOpen, X, Sparkles, ArrowDownAZ,
  AlertCircle, CalendarClock, MoonStar, MessageSquare,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { LessonHistory } from "@/components/instructor/LessonHistory";
import { CertificateGenerator } from "@/components/instructor/CertificateGenerator";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";

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
  last_lesson_date?: string | null;
}

interface PupilSplitPaneProps {
  instructorId: string;
}

type SortMode = "smart" | "az";
const SORT_STORAGE_KEY = "instructor.pupils.sortMode";

// Status chip evaluation
type ChipKey = "owes" | "test_soon" | "dormant";
interface Chip {
  key: ChipKey;
  label: string;
  className: string;
  icon: typeof AlertCircle;
}

function getPupilChips(p: Pupil): Chip[] {
  const chips: Chip[] = [];
  if ((p.account_balance ?? 0) < 0) {
    chips.push({
      key: "owes",
      label: `Owes £${Math.abs(p.account_balance ?? 0).toFixed(0)}`,
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: AlertCircle,
    });
  }
  if (p.test_date) {
    const days = differenceInDays(parseISO(p.test_date), new Date());
    if (days >= 0 && days <= 21) {
      chips.push({
        key: "test_soon",
        label: days === 0 ? "Test today" : `Test in ${days}d`,
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        icon: CalendarClock,
      });
    }
  }
  if (p.last_lesson_date) {
    const days = differenceInDays(new Date(), parseISO(p.last_lesson_date));
    if (days > 21 && (p.status || "active") === "active") {
      chips.push({
        key: "dormant",
        label: `${days}d quiet`,
        className: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
        icon: MoonStar,
      });
    }
  }
  return chips;
}

// Smart-sort score: higher = needs attention sooner
function smartScore(p: Pupil): number {
  let s = 0;
  if ((p.account_balance ?? 0) < 0) s += 1000 + Math.abs(p.account_balance ?? 0);
  if (p.test_date) {
    const days = differenceInDays(parseISO(p.test_date), new Date());
    if (days >= 0 && days <= 21) s += 500 - days * 10;
  }
  if (p.last_lesson_date) {
    const days = differenceInDays(new Date(), parseISO(p.last_lesson_date));
    if (days > 21 && (p.status || "active") === "active") s += 100 + Math.min(days, 90);
  }
  return s;
}

export function PupilSplitPane({ instructorId }: PupilSplitPaneProps) {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window === "undefined") return "smart";
    return (localStorage.getItem(SORT_STORAGE_KEY) as SortMode) || "smart";
  });
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, sortMode);
  }, [sortMode]);

  useEffect(() => {
    fetchPupils();
  }, [instructorId]);

  const fetchPupils = async () => {
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select(
          "id, name, email, phone, postcode, address, course_type, lessons_completed, progress, status, account_balance, test_date, profile_image_url, created_at, notes"
        )
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .order("name");

      if (error) throw error;

      // Fetch most-recent lesson date per pupil for dormant detection
      const pupilIds = (data || []).map((p) => p.id);
      let lastLessonMap = new Map<string, string>();
      if (pupilIds.length) {
        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("pupil_id, lesson_date")
          .in("pupil_id", pupilIds)
          .eq("status", "completed")
          .order("lesson_date", { ascending: false });
        (lessons || []).forEach((l: any) => {
          if (!lastLessonMap.has(l.pupil_id)) lastLessonMap.set(l.pupil_id, l.lesson_date);
        });
      }

      setPupils(
        (data || []).map((p) => ({
          ...p,
          last_lesson_date: lastLessonMap.get(p.id) || null,
        }))
      );
    } catch (err) {
      console.error("Error fetching pupils:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSorted = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const list = pupils.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.postcode?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q);
      if (statusFilter === "all") return matchesSearch;
      return matchesSearch && (p.status || "active") === statusFilter;
    });
    if (sortMode === "smart") {
      return [...list].sort((a, b) => {
        const diff = smartScore(b) - smartScore(a);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [pupils, searchQuery, statusFilter, sortMode]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const selectedPupils = pupils.filter((p) => selectedIds.has(p.id));
  const eligibleForWhatsApp = selectedPupils.filter((p) => !!p.phone);

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-10rem)] rounded-2xl border bg-card">
      {/* Left: Pupil list */}
      <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
        <div className="flex flex-col h-full">
          {/* Search & toolbar */}
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

            <div className="flex items-center gap-1.5">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-[11px] flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setSortMode((m) => (m === "smart" ? "az" : "smart"))}
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] h-7 px-2 rounded-md border",
                  sortMode === "smart"
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border text-muted-foreground"
                )}
                aria-label={`Sort: ${sortMode === "smart" ? "Needs attention" : "A–Z"}`}
                title={sortMode === "smart" ? "Sorted by needs attention" : "Sorted A–Z"}
              >
                {sortMode === "smart" ? (
                  <>
                    <Sparkles className="h-3 w-3" /> Smart
                  </>
                ) : (
                  <>
                    <ArrowDownAZ className="h-3 w-3" /> A–Z
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                className={cn(
                  "inline-flex items-center text-[11px] h-7 px-2 rounded-md border",
                  selectMode
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border text-muted-foreground"
                )}
                aria-pressed={selectMode}
              >
                {selectMode ? "Cancel" : "Select"}
              </button>
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
            ) : filteredSorted.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                No pupils found
              </div>
            ) : (
              <div className="divide-y">
                {filteredSorted.map((pupil) => {
                  const chips = getPupilChips(pupil);
                  const isChecked = selectedIds.has(pupil.id);
                  const isActive = selectedPupil?.id === pupil.id && !selectMode;

                  const handleClick = () => {
                    if (selectMode) toggleSelected(pupil.id);
                    else setSelectedPupil(pupil);
                  };

                  return (
                    <button
                      key={pupil.id}
                      onClick={handleClick}
                      className={cn(
                        "w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors",
                        isActive && "bg-primary/5 border-l-2 border-l-primary",
                        isChecked && "bg-primary/10"
                      )}
                    >
                      {selectMode ? (
                        <div className="pt-1.5">
                          <Checkbox checked={isChecked} aria-label={`Select ${pupil.name}`} />
                        </div>
                      ) : (
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={pupil.profile_image_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {pupil.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{pupil.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>{pupil.lessons_completed || 0} lessons</span>
                          <span>·</span>
                          <span>{pupil.progress || 0}%</span>
                        </div>
                        {chips.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {chips.map((c) => {
                              const Icon = c.icon;
                              return (
                                <span
                                  key={c.key}
                                  className={cn(
                                    "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded border",
                                    c.className
                                  )}
                                >
                                  <Icon className="h-2.5 w-2.5" />
                                  {c.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {!selectMode && (
                        <Badge className={cn("text-[9px] h-4 px-1.5 border-0 mt-0.5", statusColor(pupil.status))}>
                          {(pupil.status || "active").replace("_", " ")}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer / bulk action bar */}
          {selectMode ? (
            <div className="border-t px-3 py-2 flex items-center justify-between gap-2 bg-primary/5">
              <span className="text-[11px] text-foreground">
                {selectedIds.size} selected
                {selectedIds.size > 0 && eligibleForWhatsApp.length < selectedIds.size && (
                  <span className="text-muted-foreground">
                    {" "}· {selectedIds.size - eligibleForWhatsApp.length} no phone
                  </span>
                )}
              </span>
              <Button
                size="sm"
                className="h-7 text-[11px]"
                disabled={eligibleForWhatsApp.length === 0}
                onClick={() => setBulkOpen(true)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                WhatsApp ({eligibleForWhatsApp.length})
              </Button>
            </div>
          ) : (
            <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
              {filteredSorted.length} of {pupils.length} pupils
            </div>
          )}
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

      <BulkWhatsAppDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        instructorId={instructorId}
        recipients={eligibleForWhatsApp}
        onComplete={() => exitSelectMode()}
      />
    </ResizablePanelGroup>
  );
}

// =============================================================================
// Bulk WhatsApp dialog
// =============================================================================
function BulkWhatsAppDialog({
  open,
  onOpenChange,
  instructorId,
  recipients,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  instructorId: string;
  recipients: Pupil[];
  onComplete: () => void;
}) {
  const { templates = [], sendTemplate } = useWhatsAppTemplates(instructorId);
  const [mode, setMode] = useState<"template" | "freeform">("template");
  const [templateName, setTemplateName] = useState<string>("");
  const [freeformBody, setFreeformBody] = useState("");
  const [sending, setSending] = useState(false);

  const approvedTemplates = templates.filter((t) => t.status === "APPROVED" || t.status === "approved");

  const handleSend = async () => {
    if (recipients.length === 0) return;
    setSending(true);
    let ok = 0;
    let fail = 0;

    if (mode === "template") {
      const template = approvedTemplates.find((t) => t.name === templateName);
      if (!template) {
        toast.error("Choose a template");
        setSending(false);
        return;
      }
      for (const p of recipients) {
        try {
          await sendTemplate.mutateAsync({
            to: p.phone!,
            template_name: template.name,
            language: template.language || "en",
            variables: [p.name.split(" ")[0]],
          });
          ok++;
        } catch {
          fail++;
        }
      }
    } else {
      // Freeform fallback opens the wa.me link per recipient (only one can open at a time)
      for (const p of recipients) {
        const url = `https://wa.me/${(p.phone || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(
          freeformBody.replace(/\{name\}/gi, p.name.split(" ")[0])
        )}`;
        window.open(url, "_blank", "noopener");
        ok++;
      }
    }

    setSending(false);
    if (ok > 0) toast.success(`Sent to ${ok} pupil${ok === 1 ? "" : "s"}${fail ? ` · ${fail} failed` : ""}`);
    if (ok === 0 && fail > 0) toast.error("All sends failed");
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send WhatsApp to {recipients.length} pupil{recipients.length === 1 ? "" : "s"}</DialogTitle>
          <DialogDescription>
            {mode === "template"
              ? "Approved templates send through WhatsApp Business. {{1}} will be replaced with the pupil's first name."
              : "Freeform messages open WhatsApp Web tabs (one per recipient). Use {name} to insert their first name."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode("template")}
              className={cn(
                "flex-1 text-xs h-8 rounded-md border",
                mode === "template" ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground"
              )}
            >
              Approved template
            </button>
            <button
              type="button"
              onClick={() => setMode("freeform")}
              className={cn(
                "flex-1 text-xs h-8 rounded-md border",
                mode === "freeform" ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground"
              )}
            >
              Freeform (wa.me)
            </button>
          </div>

          {mode === "template" ? (
            <div>
              <Label className="text-xs">Template</Label>
              <Select value={templateName} onValueChange={setTemplateName}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder={approvedTemplates.length ? "Choose template" : "No approved templates"} />
                </SelectTrigger>
                <SelectContent>
                  {approvedTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templateName && (
                <p className="text-[11px] text-muted-foreground mt-2 p-2 rounded bg-muted/40 whitespace-pre-wrap">
                  {approvedTemplates.find((t) => t.name === templateName)?.body_text}
                </p>
              )}
            </div>
          ) : (
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea
                value={freeformBody}
                onChange={(e) => setFreeformBody(e.target.value)}
                placeholder="Hi {name}, just a quick reminder…"
                className="mt-1 min-h-[100px] text-sm"
              />
            </div>
          )}

          <div className="text-[11px] text-muted-foreground max-h-20 overflow-y-auto">
            <span className="font-medium text-foreground">Recipients: </span>
            {recipients.map((r) => r.name.split(" ")[0]).join(", ")}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              sending ||
              recipients.length === 0 ||
              (mode === "template" && !templateName) ||
              (mode === "freeform" && freeformBody.trim().length === 0)
            }
          >
            {sending ? "Sending…" : `Send ${recipients.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Detail panel for selected pupil
// =============================================================================
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
  const chips = getPupilChips(pupil);

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
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className={cn("text-[10px] border-0", statusColor(pupil.status))}>
                  {(pupil.status || "active").replace("_", " ")}
                </Badge>
                {pupil.course_type && (
                  <Badge variant="outline" className="text-[10px]">{pupil.course_type}</Badge>
                )}
                {chips.map((c) => {
                  const Icon = c.icon;
                  return (
                    <span
                      key={c.key}
                      className={cn(
                        "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border",
                        c.className
                      )}
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {c.label}
                    </span>
                  );
                })}
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
                <div key={lesson.id} className="flex items-center justify-between py-1.5 px-2 rounded-2xl bg-muted/30 text-sm">
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
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-2xl p-3">{pupil.notes}</p>
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
