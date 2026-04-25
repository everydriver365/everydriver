import { Search } from "lucide-react";
import { ChangeEvent } from "react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

/**
 * Premium tile-system search input. Pale fill (#F2F2F4), no shadow, single 1.5px line icon.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  ariaLabel,
  className,
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
    </div>
  );
}
