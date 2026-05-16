import { useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/;

export function PostcodeSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

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
    navigate(`/instructors?postcode=${encodeURIComponent(v)}`);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", width: "100%" }}>
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Enter your postcode (e.g. SW1A 1AA)"
          aria-label="Postcode"
          style={{
            flex: "1 1 70%",
            background: "#FFFFFF",
            border: focused ? "2px solid #2D3FE7" : "1px solid #2D3FE7",
            borderRight: "none",
            borderRadius: "2px 0 0 2px",
            padding: focused ? "13px 15px" : "14px 16px",
            height: 48,
            fontSize: 14,
            color: "#0A0A0A",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={submit}
          style={{
            flex: "0 0 30%",
            background: "#2D3FE7",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "0 2px 2px 0",
            padding: "14px 24px",
            height: 48,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "inherit",
            transition: "background 120ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1F2DC9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#2D3FE7")}
        >
          SEARCH
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
