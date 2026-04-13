import { createContext, useContext, ReactNode } from "react";

interface SchoolDemoContextType {
  isDemo: boolean;
}

const SchoolDemoContext = createContext<SchoolDemoContextType>({ isDemo: false });

export function SchoolDemoProvider({ isDemo, children }: { isDemo: boolean; children: ReactNode }) {
  return <SchoolDemoContext.Provider value={{ isDemo }}>{children}</SchoolDemoContext.Provider>;
}

export function useSchoolDemo() {
  return useContext(SchoolDemoContext);
}
