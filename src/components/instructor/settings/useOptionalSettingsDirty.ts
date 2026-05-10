import { useContext } from "react";
import { SettingsDirtyContextRaw } from "./SettingsDirtyContext";

const NOOP = {
  register: (_k: string, _e: any) => {},
  setDirty: (_k: string, _v: boolean) => {},
  dirty: false,
  saving: false,
  saveAll: async () => {},
  resetAll: () => {},
};

/**
 * Same shape as useSettingsDirty, but returns no-ops if there is no provider
 * (e.g. when an editor is mounted on a legacy admin route).
 */
export function useOptionalSettingsDirty() {
  const ctx = useContext(SettingsDirtyContextRaw);
  return ctx ?? NOOP;
}
