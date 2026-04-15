import { createContext, useContext, ReactNode } from "react";

const DSMContext = createContext(false);

export function useDSMMode() {
  return useContext(DSMContext);
}

export function DSMProvider({ children }: { children: ReactNode }) {
  return <DSMContext.Provider value={true}>{children}</DSMContext.Provider>;
}
