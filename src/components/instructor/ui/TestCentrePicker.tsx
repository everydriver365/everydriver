import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MapPin, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { IOSSheet, IOSSheetBody, IOSSheetHeader, IOSSheetTitle } from "@/components/ui/IOSSheet";
import { SearchInput } from "@/components/instructor/ui/SearchInput";
import { FormInputCard } from "@/components/instructor/ui/FormInputCard";

interface TestCentre {
  id: string;
  name: string;
}

export interface TestCentrePickerProps {
  selectedId: string | null;
  selectedName: string | null;
  onSelect: (centre: { id: string; name: string }) => void;
  invalid?: boolean;
}

/**
 * Picker for the official `test_centres` table. Promotes data integrity by
 * standardising the saved name. Existing free-text values from older records
 * are still displayed verbatim with a small "Update" hint until the user
 * picks a standard centre.
 */
export function TestCentrePicker({
  selectedId,
  selectedName,
  onSelect,
  invalid,
}: TestCentrePickerProps) {
  const [open, setOpen] = useState(false);
  const [centres, setCentres] = useState<TestCentre[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("test_centres")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (!cancelled && data) setCentres(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return centres;
    return centres.filter((c) => c.name.toLowerCase().includes(q));
  }, [centres, search]);

  const isLegacyValue = !!selectedName && !selectedId;
  const displayValue = selectedName ?? "";

  return (
    <>
      <FormInputCard
        icon={<MapPin size={18} strokeWidth={1.8} />}
        placeholder="Select test centre"
        invalid={invalid}
        onClick={() => setOpen(true)}
        trailing={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {isLegacyValue && (
              <span
                style={{
                  fontSize: 10,
                  color: "#6E6E73",
                  background: "#F2F2F4",
                  padding: "2px 6px",
                  borderRadius: 4,
                  letterSpacing: 0.2,
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                Update
              </span>
            )}
            <ChevronDown size={12} strokeWidth={1.6} />
          </span>
        }
      >
        {displayValue ? (
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#000000",
              letterSpacing: -0.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
            }}
          >
            {displayValue}
          </span>
        ) : null}
      </FormInputCard>

      <IOSSheet open={open} onOpenChange={setOpen} snapPoints={[0.7, 1]}>
        <IOSSheetHeader>
          <IOSSheetTitle>Test centre</IOSSheetTitle>
        </IOSSheetHeader>
        <div style={{ padding: "0 16px 12px" }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search test centres"
          />
        </div>
        <IOSSheetBody>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "#6E6E73", fontSize: 14 }}>
              No test centres found.
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {filtered.map((c) => {
                const active = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect({ id: c.id, name: c.name });
                        setOpen(false);
                        setSearch("");
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 4px",
                        background: "transparent",
                        border: "none",
                        borderBottom: "0.5px solid #E5E5EA",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          fontSize: 15,
                          color: "#000000",
                          fontWeight: active ? 500 : 400,
                        }}
                      >
                        {c.name}
                      </span>
                      {active && <Check size={16} strokeWidth={1.8} color="#2B7BC8" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </IOSSheetBody>
      </IOSSheet>
    </>
  );
}
