import React, { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => Promise<void>;
  loading: boolean;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const { instructor, refreshInstructor } = useInstructorAuth();
  const [loading, setLoading] = useState(false);

  // Read demo_mode from instructor profile — fallback to false
  const isDemoMode = (instructor as any)?.demo_mode === true;

  const toggleDemoMode = useCallback(async () => {
    if (!instructor?.id) return;
    setLoading(true);
    try {
      const newValue = !isDemoMode;
      const { error } = await supabase
        .from("instructors")
        .update({ demo_mode: newValue } as any)
        .eq("id", instructor.id);

      if (error) throw error;
      await refreshInstructor();
    } catch (error) {
      console.error("Error toggling demo mode:", error);
    } finally {
      setLoading(false);
    }
  }, [instructor?.id, isDemoMode, refreshInstructor]);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode, loading }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return context;
}
