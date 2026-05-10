import { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from "react";

interface DirtyEntry {
  save: () => Promise<void> | void;
  reset: () => void;
}

interface Ctx {
  dirty: boolean;
  saving: boolean;
  register: (key: string, entry: DirtyEntry | null) => void;
  saveAll: () => Promise<void>;
  resetAll: () => void;
  /** Track per-key dirty so children can mark/unmark. */
  setDirty: (key: string, isDirty: boolean) => void;
}

const SettingsDirtyContext = createContext<Ctx | null>(null);

export function SettingsDirtyProvider({ children }: { children: ReactNode }) {
  const entries = useRef<Record<string, DirtyEntry>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const register = useCallback((key: string, entry: DirtyEntry | null) => {
    if (entry) entries.current[key] = entry;
    else {
      delete entries.current[key];
      setDirtyKeys(prev => {
        if (!prev.has(key)) return prev;
        const next = new Set(prev); next.delete(key); return next;
      });
    }
  }, []);

  const setDirty = useCallback((key: string, isDirty: boolean) => {
    setDirtyKeys(prev => {
      const has = prev.has(key);
      if (isDirty === has) return prev;
      const next = new Set(prev);
      if (isDirty) next.add(key); else next.delete(key);
      return next;
    });
  }, []);

  const saveAll = useCallback(async () => {
    setSaving(true);
    try {
      for (const key of Array.from(dirtyKeys)) {
        const e = entries.current[key];
        if (e) await e.save();
      }
      setDirtyKeys(new Set());
    } finally {
      setSaving(false);
    }
  }, [dirtyKeys]);

  const resetAll = useCallback(() => {
    for (const key of Array.from(dirtyKeys)) {
      entries.current[key]?.reset();
    }
    setDirtyKeys(new Set());
  }, [dirtyKeys]);

  const value = useMemo<Ctx>(() => ({
    dirty: dirtyKeys.size > 0,
    saving,
    register,
    saveAll,
    resetAll,
    setDirty,
  }), [dirtyKeys.size, saving, register, saveAll, resetAll, setDirty]);

  return <SettingsDirtyContext.Provider value={value}>{children}</SettingsDirtyContext.Provider>;
}

export function useSettingsDirty() {
  const ctx = useContext(SettingsDirtyContext);
  if (!ctx) throw new Error("useSettingsDirty must be used within SettingsDirtyProvider");
  return ctx;
}
