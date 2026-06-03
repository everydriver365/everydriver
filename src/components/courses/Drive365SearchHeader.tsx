import { Search, ChevronDown, Loader2, MapPin } from "lucide-react";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";

export type CourseFilterId = "all" | "intensive" | "semi-intensive" | "weekly";

interface Props {
  title: string;
  postcode: string;
  setPostcode: (v: string) => void;
  radius: string;
  setRadius: (v: string) => void;
  transmission: string;
  setTransmission: (v: string) => void;
  isSearching: boolean;
  onSearch: () => void;
  activeFilter?: CourseFilterId;
  setActiveFilter?: (v: CourseFilterId) => void;
}

const FILTERS: { id: CourseFilterId; label: string }[] = [
  { id: "all", label: "All courses" },
  { id: "intensive", label: "Intensive" },
  { id: "semi-intensive", label: "Semi-intensive" },
  { id: "weekly", label: "Weekly lessons" },
];

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: "#9CA3AF",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  lineHeight: 1,
};

const VALUE_STYLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#0A0E27",
  lineHeight: 1.2,
};

export function Drive365SearchHeader({
  title,
  postcode,
  setPostcode,
  radius,
  setRadius,
  transmission,
  setTransmission,
  isSearching,
  onSearch,
  activeFilter,
  setActiveFilter,
}: Props) {
  const handleSearch = () => {
    if (typeof document !== "undefined") {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    onSearch();
  };

  const showFilters = Boolean(activeFilter && setActiveFilter);

  return (
    <>
      {/* Desktop: full-width navy search bar */}
      <div className="hidden md:block" style={{ background: "#0A2B6B" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          style={{
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              background: "#FFF",
              borderRadius: 8,
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              gap: 0,
            }}
          >
            {/* Postcode */}
            <div
              style={{
                flex: 1.4,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                padding: "4px 12px",
                borderRight: "1px solid #E5E7EB",
                minWidth: 0,
              }}
            >
              <span style={LABEL_STYLE}>POSTCODE</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <MapPin size={12} color="#9CA3AF" style={{ flexShrink: 0 }} />
                <PostcodeAutocomplete
                  value={postcode}
                  onChange={(v) => setPostcode(v.toUpperCase())}
                  onSelect={(pc) => {
                    setPostcode(pc);
                    setTimeout(() => handleSearch(), 100);
                  }}
                  placeholder="Postcode"
                  className="flex-1 min-w-0"
                  inputClassName="h-5 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 placeholder:text-[#9CA3AF]"
                  showInputIcon={false}
                  showGeolocation={false}
                />
              </div>
            </div>

            {/* Radius */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                padding: "4px 12px",
                borderRight: "1px solid #E5E7EB",
                minWidth: 0,
              }}
            >
              <span style={LABEL_STYLE}>SEARCH RADIUS</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  style={{
                    ...VALUE_STYLE,
                    width: "100%",
                    appearance: "none",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    paddingRight: 18,
                    cursor: "pointer",
                  }}
                >
                  <option value="5">5 miles</option>
                  <option value="10">10 miles</option>
                  <option value="15">15 miles</option>
                  <option value="20">20 miles</option>
                  <option value="30">30 miles</option>
                </select>
                <ChevronDown
                  size={12}
                  color="#9CA3AF"
                  style={{ position: "absolute", right: 0, pointerEvents: "none" }}
                />
              </div>
            </div>

            {/* Transmission */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                padding: "4px 12px",
                minWidth: 0,
              }}
            >
              <span style={LABEL_STYLE}>TRANSMISSION</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  style={{
                    ...VALUE_STYLE,
                    width: "100%",
                    appearance: "none",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    paddingRight: 18,
                    cursor: "pointer",
                  }}
                >
                  <option value="all">Any transmission</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
                <ChevronDown
                  size={12}
                  color="#9CA3AF"
                  style={{ position: "absolute", right: 0, pointerEvents: "none" }}
                />
              </div>
            </div>
          </div>

          {/* Search button */}
          <button
            type="submit"
            disabled={isSearching}
            style={{
              marginLeft: 6,
              background: "#D12E2E",
              color: "#FFF",
              border: "none",
              borderRadius: 6,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: isSearching ? "not-allowed" : "pointer",
              opacity: isSearching ? 0.7 : 1,
            }}
          >
            {isSearching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} strokeWidth={2.4} />
            )}
            Search
          </button>
        </form>
      </div>

      {/* Desktop: heading + filter chips */}
      <div
        className="hidden md:block"
        style={{
          background: "#FFF",
          borderBottom: "1px solid #E5E7EB",
          padding: "16px 32px",
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "#0070C0",
              marginBottom: 4,
            }}
          >
            Driving courses near you
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0A0E27",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            {title}
          </h1>
        </div>

        {showFilters && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginRight: 4 }}>
              Filter:
            </span>
            {FILTERS.map((f) => {
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter?.(f.id)}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "#FFF";
                  }}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 20,
                    fontSize: 12,
                    border: `1px solid ${active ? "#0A2B6B" : "#E5E7EB"}`,
                    background: active ? "#0A2B6B" : "#FFF",
                    color: active ? "#FFF" : "#4B5563",
                    fontWeight: active ? 700 : 600,
                    cursor: "pointer",
                    transition: "background-color 120ms",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile fallback: original header unchanged */}
      <div className="md:hidden">
        <MobileFallback
          title={title}
          postcode={postcode}
          setPostcode={setPostcode}
          radius={radius}
          setRadius={setRadius}
          transmission={transmission}
          setTransmission={setTransmission}
          isSearching={isSearching}
          onSearch={onSearch}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
      </div>
    </>
  );
}

// Lazy re-import to keep mobile unchanged
import { CourseSearchHeader } from "@/components/courses/CourseSearchHeader";
function MobileFallback(props: Props) {
  return <CourseSearchHeader {...props} />;
}
