import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User } from "lucide-react";

interface Pupil {
  id: string;
  name: string;
}

interface PupilSelectorProps {
  instructorId: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function PupilSelector({ instructorId, value, onChange, disabled }: PupilSelectorProps) {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPupils = async () => {
      try {
        const { data, error } = await supabase
          .from("pupils")
          .select("id, name")
          .eq("instructor_id", instructorId)
          .order("name");

        if (error) throw error;
        setPupils(data || []);
      } catch (error) {
        console.error("Error fetching pupils:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPupils();
  }, [instructorId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading pupils...
      </div>
    );
  }

  if (pupils.length === 0) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground border rounded-2xl">
        <User className="h-4 w-4" />
        No pupils found
      </div>
    );
  }

  return (
    <Select 
      value={value || "none"} 
      onValueChange={(v) => onChange(v === "none" ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a pupil (optional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No pupil linked</span>
        </SelectItem>
        {pupils.map((pupil) => (
          <SelectItem key={pupil.id} value={pupil.id}>
            {pupil.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
