import { useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useTypewriter } from "@/hooks/useTypewriter";

const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/;

export function PostcodeSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const placeholderText = useTypewriter({
    phrases: [
      "Enter your postcode (e.g. SW1A 1AA)",
      "Find driving instructors near you",
      "Compare prices in your area",
      "Book your first lesson today",
    ],
    typingSpeed: 70,
    deletingSpeed: 35,
    pauseBetween: 1800,
  });

  const submit = () => {
    const v = value.trim().toUpperCase();
    if (!v) {
      setError("Please enter a postcode");
      return;
    }
    if (!UK_POSTCODE_RE.test(v)) {
      setError("Please enter a valid UK postcode");
      return;
    }
    setError(null);
    navigate(`/courses?postcode=${encodeURIComponent(v)}`);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <style>{`
        .ps-input::placeholder { color: #9CA3AF; }
      `}</style>
      <div
        style={{
          display: "flex",
          width: "100%",
          border: focused ? "1.5px solid #E8641A" : "1.5px solid #E5E7EB",
          borderRadius: 8,
          overflow: "hidden",
          transition: "border-color 120ms ease",
        }}
      >
        <input
          type="text"
          className="ps-input"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused || value ? "Enter your postcode (e.g. SW1A 1AA)" : placeholderText}
          aria-label="Postcode"
          style={{
            flex: "1 1 70%",
            background: "#FFFFFF",
            border: "none",
            outline: "none",
            padding: "13px 16px",
            fontSize: 14,
            color: "#0A0A0A",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={submit}
          style={{
            flex: "0 0 auto",
            background: "#E8641A",
            color: "#FFFFFF",
            border: "none",
            padding: "13px 22px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "inherit",
            transition: "background 120ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#D05516")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#E8641A")}
        >
          Search
          <Search size={14} color="#FFFFFF" strokeWidth={2.5} />
        </button>
      </div>
      {error && (
        <div style={{ color: "#EF4444", fontSize: 12, marginTop: 4, textAlign: "left" }}>
          {error}
        </div>
      )}
    </div>
  );
}
