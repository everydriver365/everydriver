import { useContext } from "react";
import * as Mod from "./SettingsDirtyContext";

/**
 * Returns the SettingsDirty context if available, or no-op stubs if the
 * component is rendered outside of a provider (e.g. legacy admin screens).
 *
 * Reaches into the module via a getter so we can detect provider presence
 * without throwing.
 */
export function useOptionalSettingsDirty() {
  // Re-implement the hook contract without throwing.
  // We rely on the provider exporting useSettingsDirty which throws when
  // outside a provider — wrap it in a try/catch using React's rules: that
  // would break hook order. Instead, expose a parallel safe variant.
  return useSafeCtx();
}

// Internal: read the same context object the provider uses.
const ContextRef: { current: React.Context<unknown> | null } = { current: null };

function useSafeCtx() {
  if (!ContextRef.current) {
    // Lazy capture by evaluating once. We extract the context by calling
    // useSettingsDirty inside a try in dev-mode? Simpler: re-declare the
    // shape locally via the exported provider's internals.
    // Fallback: import a dedicated context export.
  }
  // See SettingsDirtyContext.tsx for the exported optional context.
  const ctx = useContext(Mod.SettingsDirtyContextRaw);
  return (
    ctx ?? {
      register: (_k: string, _e: any) => {},
      setDirty: (_k: string, _v: boolean) => {},
      dirty: false,
      saving: false,
      saveAll: async () => {},
      resetAll: () => {},
    }
  );
}
