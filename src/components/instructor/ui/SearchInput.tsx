import { Search, X } from "lucide-react";
import { ChangeEvent } from "react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  clearable?: boolean;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  ariaLabel,
  className,
  clearable = true,
}: SearchInputProps) {
  return (
    <div
      className={className}
      style={{
        background: "#F2F2F4",
        borderRadius: 10,
        padding: "9px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Search size={16} strokeWidth={1.5} color="#6E6E73" aria-hidden="true" />
      <input
        type="text"
        value={value}
        aria-label={ariaLabel ?? placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          background: "transparent",
          border: "none",
          outline: "none",
          padding: 0,
          fontSize: 13,
          color: "#000000",
          fontFamily: FONT_STACK,
        }}
      />
      {clearable && value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}
        >
          <X size={14} strokeWidth={2.5} color="#8E8E93" />
        </button>
      )}
    </div>
  );
}
