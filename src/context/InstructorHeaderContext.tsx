import React, { createContext, useContext } from "react";

interface InstructorHeaderActions {
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  onOpenPaymentSheet: () => void;
  onNavigate: (path: string) => void;
  instructorId: string | undefined;
  instructorName: string | undefined;
  instructorProfileImage: string | null | undefined;
}

const InstructorHeaderContext = createContext<InstructorHeaderActions | null>(null);

export const InstructorHeaderProvider = InstructorHeaderContext.Provider;

export function useInstructorHeaderActions() {
  const ctx = useContext(InstructorHeaderContext);
  if (!ctx) throw new Error("useInstructorHeaderActions must be used within InstructorHeaderProvider");
  return ctx;
}
