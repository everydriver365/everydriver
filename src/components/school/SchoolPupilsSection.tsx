import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import SchoolPupilDetailPanel from "./SchoolPupilDetailPanel";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolPupils } from "@/data/demoSchoolData";

interface Props { instructorIds: string[]; }

function getStatusColor(status: string) {
  switch (status) {
    case "completed": return "text-emerald-700";
    case "active": return "text-primary";
    case "paused": return "text-amber-600";
    default: return "text-foreground";
  }
}

export default function SchoolPupilsSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [pupils, setPupils] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) { setPupils(demoSchoolPupils); setLoading(false); return; }
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchPupils();
  }, [instructorIds, isDemo]);

  const fetchPupils = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pupils")
      .select("id, name, email, phone, course_status, instructor_id, instructors(name)")
      .in("instructor_id", instructorIds)
      .is("deleted_at", null)
      .order("name", { ascending: true });
    setPupils(data || []);
    setLoading(false);
  };

  const filtered = pupils.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Top bar like EMIS */}
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center gap-4 rounded-t-lg text-sm">
        <span className="font-semibold">Pupils</span>
        <span className="text-primary-foreground/70">Total: {pupils.length}</span>
        <span className="text-primary-foreground/70">Active: {pupils.filter(p => p.course_status === "active").length}</span>
        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary-foreground/50" />
          <Input
            placeholder="Search pupils..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 w-56"
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 border border-t-0 rounded-b-lg overflow-hidden">
        {/* Left table panel */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Column headers */}
          <div className="grid grid-cols-[28px_1fr_160px_120px_100px] text-[11px] font-semibold text-muted-foreground border-b bg-muted/30 px-1 py-1.5 select-none">
            <span></span>
            <span className="px-2">Pupil</span>
            <span className="px-2">Instructor</span>
            <span className="px-2">Status</span>
            <span className="px-2">Progress</span>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pupils found</p>
            ) : filtered.map((p, i) => {
              const letter = i < 26 ? alpha[i] : String(i + 1);
              const isSelected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "w-full grid grid-cols-[28px_1fr_160px_120px_100px] text-left text-[12px] border-b transition-colors items-center px-1 py-1",
                    isSelected
                      ? "bg-primary/10 font-medium"
                      : "hover:bg-muted/40"
                  )}
                >
                  <span className="text-muted-foreground text-[11px] text-center font-mono">{letter}</span>
                  <span className="px-2 truncate">
                    <span className="font-medium">{p.name}</span>
                  </span>
                  <span className="px-2 truncate text-muted-foreground">{(p as any).instructors?.name || "Unassigned"}</span>
                  <span className={cn("px-2 capitalize", getStatusColor(p.course_status || "active"))}>
                    {p.course_status || "active"}
                  </span>
                  <span className="px-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-7 text-right">{p.progress || 0}%</span>
                    </div>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right detail panel — "Detailed View" */}
        <div className="w-[380px] border-l flex flex-col bg-card shrink-0">
          <div className="text-[11px] text-muted-foreground px-3 py-1.5 border-b bg-muted/20 text-right font-medium select-none">
            Detailed View
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedId ? (
              <SchoolPupilDetailPanel pupilId={selectedId} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-xs">Select a pupil to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
