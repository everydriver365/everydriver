import { useState, useEffect } from "react";
import { Search, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import SchoolPupilDetailPanel from "./SchoolPupilDetailPanel";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolPupils } from "@/data/demoSchoolData";

interface Props { instructorIds: string[]; }

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Pupils</h2>
        <p className="text-muted-foreground">View all pupils across your school</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-16rem)]">
        <div className="w-80 flex-shrink-0 flex flex-col border rounded-xl overflow-hidden">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search pupils..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pupils found</p>
            ) : filtered.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b",
                  selectedId === p.id && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{(p as any).instructors?.name || "Unassigned"}</p>
                </div>
                <Badge variant="outline" className="text-[10px] flex-shrink-0">{p.course_status || "active"}</Badge>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 border rounded-xl overflow-hidden">
          {selectedId ? (
            <SchoolPupilDetailPanel pupilId={selectedId} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a pupil to view their details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
