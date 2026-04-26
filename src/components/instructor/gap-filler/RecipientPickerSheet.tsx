import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { BottomSheet } from "@/components/instructor/ui/BottomSheet";
import { SearchInput } from "@/components/instructor/ui/SearchInput";
import { pupilAvatarColor } from "@/lib/pupilAvatarColor";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

export interface RecipientPupil {
  id: string;
  name: string;
  phone: string | null;
}

export interface RecipientPickerSheetProps {
  open: boolean;
  onClose: () => void;
  pupils: RecipientPupil[];
  selectedIds: Set<string>;
  /** Called with the new selection when the user taps Apply. */
  onApply: (nextIds: Set<string>) => void;
}

export function RecipientPickerSheet({
  open,
  onClose,
  pupils,
  selectedIds,
  onApply,
}: RecipientPickerSheetProps) {
  const [draft, setDraft] = useState<Set<string>>(new Set(selectedIds));
  const [query, setQuery] = useState("");

  // Reset draft each time we re-open
  useEffect(() => {
    if (open) {
      setDraft(new Set(selectedIds));
      setQuery("");
    }
  }, [open, selectedIds]);

  const withPhone = useMemo(
    () => pupils.filter((p) => !!(p.phone && p.phone.trim())),
    [pupils]
  );
  const withoutPhone = useMemo(
    () => pupils.filter((p) => !p.phone || !p.phone.trim()),
    [pupils]
  );

  const matches = (p: RecipientPupil) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q)
    );
  };

  const visibleWithPhone = withPhone.filter(matches);
  const visibleWithoutPhone = withoutPhone.filter(matches);

  const toggle = (id: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setDraft(new Set(visibleWithPhone.map((p) => p.id)));
  };
  const clearAll = () => setDraft(new Set());

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Recipients"
      subtitle={`${draft.size} selected`}
      bodyMaxHeight="60vh"
      footer={
        <button
          type="button"
          onClick={() => onApply(draft)}
          style={{
            width: "100%",
            background: "#2B7BC8",
            border: "none",
            borderRadius: 10,
            padding: 12,
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
            cursor: "pointer",
            fontFamily: FONT_STACK,
          }}
        >
          Apply
        </button>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search pupils"
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={selectAll}
          style={linkStyle("#2B7BC8")}
        >
          Select all
        </button>
        <button
          type="button"
          onClick={clearAll}
          style={linkStyle("#6E6E73")}
        >
          Clear
        </button>
      </div>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {visibleWithPhone.map((p) => {
          const isSelected = draft.has(p.id);
          const initial = (p.name || "?").trim().charAt(0).toUpperCase() || "?";
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => toggle(p.id)}
                style={{
                  width: "100%",
                  background: isSelected ? "#E6F1FB" : "transparent",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: FONT_STACK,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    background: isSelected ? "#2B7BC8" : "#FFFFFF",
                    border: isSelected ? "none" : "1.5px solid #C7C7CC",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <Check
                      size={11}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      color="#FFFFFF"
                    />
                  )}
                </span>

                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: pupilAvatarColor(p.id || p.name),
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {initial}
                </span>

                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#000000",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: "#6E6E73",
                    flexShrink: 0,
                  }}
                >
                  {p.phone}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {visibleWithoutPhone.length > 0 && (
        <>
          <div
            style={{
              marginTop: 16,
              marginBottom: 4,
              padding: "0 4px",
              fontSize: 11,
              fontWeight: 500,
              color: "#6E6E73",
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            No phone number on file
          </div>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              opacity: 0.5,
            }}
          >
            {visibleWithoutPhone.map((p) => {
              const initial = (p.name || "?").trim().charAt(0).toUpperCase() || "?";
              return (
                <li
                  key={p.id}
                  style={{
                    padding: "10px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontFamily: FONT_STACK,
                  }}
                >
                  <span style={{ width: 18, flexShrink: 0 }} />
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: pupilAvatarColor(p.id || p.name),
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#000000",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </span>
                  <Link
                    to={`/instructor/pupils/${p.id}`}
                    style={{
                      ...linkStyle("#2B7BC8"),
                      textDecoration: "none",
                      pointerEvents: "auto",
                      opacity: 1,
                    }}
                  >
                    Add number
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </BottomSheet>
  );
}

function linkStyle(color: string): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    color,
    fontFamily: FONT_STACK,
  };
}
