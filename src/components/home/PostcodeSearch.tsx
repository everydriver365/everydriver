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
        .pcs-row { display: flex; flex-direction: row; gap: 10px; max-width: 560px; margin: 0 auto; width: 100%; }
        .pcs-input {
          flex: 1; min-width: 0; background: #ffffff;
          border: 1.5px solid #d6e0f5; border-radius: 10px;
          padding: 14px 16px; font-size: 14px; color: #0F2044;
          outline: none; font-family: 'Poppins', sans-serif;
          transition: border-color 120ms ease;
          box-sizing: border-box;
        }
        .pcs-input::placeholder { color: #9CA3AF; }
        .pcs-input:focus { border-color: #0070C0; }
        .pcs-btn {
          background: #D12E2E; color: #ffffff; border: none;
          border-radius: 10px; padding: 14px 28px;
          font-size: 14px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; font-family: 'Poppins', sans-serif;
          transition: background 120ms ease; white-space: nowrap;
        }
        .pcs-btn:hover { background: #b52626; }
        @media (max-width: 520px) {
          .pcs-row { flex-direction: column; }
          .pcs-btn { width: 100%; }
        }
      `}</style>
      <div className="pcs-row">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Find driving instructors near you"
          aria-label="Postcode"
          className="pcs-input"
        />
        <button type="button" onClick={submit} className="pcs-btn">
          SEARCH
          <Search size={14} color="#FFFFFF" strokeWidth={2.5} />
        </button>
      </div>
      {error && (
        <div style={{ color: "#EF4444", fontSize: 12, marginTop: 6, textAlign: "center" }}>
          {error}
        </div>
      )}
    </div>
  );
}
