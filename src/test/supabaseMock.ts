/**
 * Hoisted Supabase mock — must be safe to call from inside `vi.hoisted` so that
 * the returned `supabase` instance is available when `vi.mock` runs.
 */

type Row = Record<string, any>;

export interface SupabaseMockHandle {
  supabase: any;
  setTable: (table: string, rows: Row[]) => void;
  reset: () => void;
  calls: { table: string; filters: Record<string, any> }[];
}

export function createSupabaseMock(): SupabaseMockHandle {
  const tables = new Map<string, Row[]>();
  const calls: { table: string; filters: Record<string, any> }[] = [];

  const setTable = (table: string, rows: Row[]) => {
    tables.set(table, rows);
  };

  const reset = () => {
    tables.clear();
    calls.length = 0;
  };

  const buildBuilder = (table: string) => {
    const filters: Record<string, any> = {};
    calls.push({ table, filters });

    const apply = (): Row[] => {
      const rows = tables.get(table) ?? [];
      return rows.filter((row) =>
        Object.entries(filters).every(([k, v]) => row[k] === v),
      );
    };

    const builder: any = {
      select: () => builder,
      order: () => builder,
      limit: () => builder,
      eq: (col: string, val: any) => {
        filters[col] = val;
        return builder;
      },
      in: () => builder,
      gte: () => builder,
      lte: () => builder,
      neq: () => builder,
      is: () => builder,
      maybeSingle: async () => ({ data: apply()[0] ?? null, error: null }),
      single: async () => {
        const rows = apply();
        if (rows.length === 0) {
          return { data: null, error: { code: "PGRST116", message: "No rows" } };
        }
        return { data: rows[0], error: null };
      },
      then: (resolve: any, reject: any) =>
        Promise.resolve({ data: apply(), error: null }).then(resolve, reject),
    };

    return builder;
  };

  const supabase = {
    from: (table: string) => buildBuilder(table),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    removeChannel: () => {},
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  };

  return { supabase, setTable, reset, calls };
}
