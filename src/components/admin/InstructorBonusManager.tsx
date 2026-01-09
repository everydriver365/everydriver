import { useState, useEffect } from "react";
import { Gift, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Instructor {
  id: string;
  name: string;
  bonus_earned: number;
}

export function InstructorBonusManager() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, name, bonus_earned")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast.error("Failed to load instructors");
    } finally {
      setLoading(false);
    }
  };

  const updateBonus = async (instructorId: string, newBonus: number) => {
    setUpdating(instructorId);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ bonus_earned: Math.max(0, newBonus) })
        .eq("id", instructorId);

      if (error) throw error;

      setInstructors((prev) =>
        prev.map((i) =>
          i.id === instructorId ? { ...i, bonus_earned: Math.max(0, newBonus) } : i
        )
      );
      toast.success("Bonus updated");
    } catch (error) {
      console.error("Error updating bonus:", error);
      toast.error("Failed to update bonus");
    } finally {
      setUpdating(null);
    }
  };

  const addBonus = (instructor: Instructor) => {
    updateBonus(instructor.id, (instructor.bonus_earned || 0) + 50);
  };

  const removeBonus = (instructor: Instructor) => {
    updateBonus(instructor.id, (instructor.bonus_earned || 0) - 50);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Gift className="h-5 w-5" />
          <span className="font-medium">Course Completion Bonus</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Add £50 bonus for each completed course. Use the + button to award a bonus or - to adjust.
        </p>
      </div>

      <div className="space-y-3">
        {instructors.map((instructor) => (
          <Card key={instructor.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium">{instructor.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Current bonus: £{instructor.bonus_earned || 0}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeBonus(instructor)}
                    disabled={updating === instructor.id || (instructor.bonus_earned || 0) < 50}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-20 text-center">
                    <span className="text-lg font-bold text-amber-600">
                      £{instructor.bonus_earned || 0}
                    </span>
                  </div>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => addBonus(instructor)}
                    disabled={updating === instructor.id}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {instructors.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No active instructors found
          </p>
        )}
      </div>
    </div>
  );
}
