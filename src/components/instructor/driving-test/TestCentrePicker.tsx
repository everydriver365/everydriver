import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

export interface TestCentreOption {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
}

interface TestCentrePickerProps {
  value: string;
  onChange: (id: string, centre: TestCentreOption | null) => void;
  /** Optional: instructor's saved/preferred centres shown first */
  instructorId?: string | null;
  placeholder?: string;
}

/**
 * Single-select searchable test centre picker.
 * Loads ALL active UK test centres so any centre can be selected when scheduling
 * a driving test, with the instructor's saved centres pinned to the top.
 */
export function TestCentrePicker({
  value,
  onChange,
  instructorId,
  placeholder = "Search test centres...",
}: TestCentrePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [centres, setCentres] = useState<TestCentreOption[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [{ data: all }, savedRes] = await Promise.all([
        supabase
          .from("test_centres")
          .select("id, name, address, postcode")
          .eq("is_active", true)
          .order("name"),
        instructorId
          ? supabase
              .from("instructor_test_centres")
              .select("test_centre_id")
              .eq("instructor_id", instructorId)
          : Promise.resolve({ data: [] as { test_centre_id: string }[] }),
      ]);
      if (cancelled) return;
      setCentres((all as TestCentreOption[]) || []);
      setSavedIds(new Set(((savedRes.data as { test_centre_id: string }[]) || []).map((r) => r.test_centre_id)));
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? centres.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.postcode || "").toLowerCase().includes(q) ||
            (c.address || "").toLowerCase().includes(q)
        )
      : centres;
    // Pinned saved centres first
    return [...matches].sort((a, b) => {
      const sa = savedIds.has(a.id) ? 0 : 1;
      const sb = savedIds.has(b.id) ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name);
    });
  }, [centres, savedIds, query]);

  const selected = centres.find((c) => c.id === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 rounded-xl bg-white"
        >
          <span className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 shrink-0 text-[#2A394F]" />
            <span className="truncate text-left">
              {selected ? (
                <>
                  <span className="font-medium">{selected.name}</span>
                  {selected.postcode && (
                    <span className="text-muted-foreground"> · {selected.postcode}</span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, postcode, or area..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {loading ? "Loading..." : "No test centres found."}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((centre) => {
                const isSaved = savedIds.has(centre.id);
                const isSelected = value === centre.id;
                return (
                  <CommandItem
                    key={centre.id}
                    value={centre.id}
                    onSelect={() => {
                      onChange(centre.id, centre);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">
                        {centre.name}
                        {isSaved && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">
                            Saved
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {centre.postcode}
                        {centre.address && ` · ${centre.address}`}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
