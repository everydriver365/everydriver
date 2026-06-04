import { motion } from "framer-motion";
import { Search, ChevronDown, Loader2, MapPin, Map as MapIcon, Zap, SlidersHorizontal } from "lucide-react";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";

export type CourseFilterId = "all" | "intensive" | "semi-intensive" | "weekly";

interface CourseSearchHeaderProps {
  title: string;
  postcode: string;
  setPostcode: (value: string) => void;
  radius: string;
  setRadius: (value: string) => void;
  transmission: string;
  setTransmission: (value: string) => void;
  isSearching: boolean;
  onSearch: () => void;
  activeFilter?: CourseFilterId;
  setActiveFilter?: (value: CourseFilterId) => void;
  onMoreFilters?: () => void;
  variant?: "default" | "chapmans";
}

const FILTER_OPTIONS: { id: CourseFilterId; label: string; icon?: typeof Zap }[] = [
  { id: "all", label: "All courses" },
  { id: "intensive", label: "Intensive", icon: Zap },
  { id: "semi-intensive", label: "Semi-intensive" },
  { id: "weekly", label: "Weekly lessons" },
];

const tokens = {
  navy: "#0A0A0A",
  blue: "#0F2044",
  blueHover: "#1A3370",
  red: "#0F2044",
  mid: "#0A0A0A",
  muted: "#9CA3AF",
  border: "#EAF0FF",
  pillBorder: "#E5E7EB",
};

export function CourseSearchHeader({
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
  onMoreFilters,
  variant = "default",
}: CourseSearchHeaderProps) {
  const showFilters = Boolean(activeFilter && setActiveFilter);
  const isChapmans = variant === "chapmans";

  const handleSearch = () => {
    if (typeof document !== "undefined") {
      const el = document.activeElement as HTMLElement | null;
      el?.blur?.();
    }
    onSearch();
  };

  return (
    <>
      {isChapmans && (
        <ChapmansMobileSearch
          postcode={postcode}
          setPostcode={setPostcode}
          radius={radius}
          setRadius={setRadius}
          transmission={transmission}
          setTransmission={setTransmission}
          isSearching={isSearching}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onSearch={handleSearch}
          showFilters={showFilters}
        />
      )}
    <section
      className={
        isChapmans
          ? "hidden md:block md:px-5 md:pt-5 md:pb-3"
          : "px-5 pt-3 pb-2 md:pt-5 md:pb-3"
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl"
      >
        {/* Eyebrow */}
        <div className="mb-1.5 flex items-center gap-[7px]">
          <span
            className="inline-block h-[2px] w-[18px] rounded-sm"
            style={{ backgroundColor: tokens.blue }}
          />
          <span
            className="font-heading text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ color: tokens.blue }}
          >
            Driving courses
          </span>
        </div>

        {/* Title */}
        <h1
          className="font-heading mb-3 mt-1 text-[22px] font-bold leading-tight tracking-[-0.5px] md:mb-5 md:text-[32px]"
          style={{ color: tokens.navy }}
        >
          {title}
        </h1>

        {/* Search card */}
        <div
          className="mb-3 bg-white"
          style={{
            borderRadius: 4,
            border: `1px solid ${tokens.border}`,
            padding: 20,
            boxShadow: "0 2px 12px rgba(15,32,68,0.05)",
          }}
        >

          {isChapmans ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="mb-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center"
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                padding: 16,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              {/* Postcode */}
              <div
                className="w-full min-w-0 sm:flex-[1.5]"
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  Postcode
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <MapPin size={11} strokeWidth={2} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                  <PostcodeAutocomplete
                    value={postcode}
                    onChange={(v) => setPostcode(v.toUpperCase())}
                    onSelect={(pc) => {
                      setPostcode(pc);
                      setTimeout(() => handleSearch(), 100);
                    }}
                    placeholder="Enter postcode"
                    className="flex-1 min-w-0"
                    inputClassName="h-6 border-0 bg-transparent p-0 text-[13px] font-medium shadow-none focus-visible:ring-0 placeholder:text-[#C4C9D4]"
                    showInputIcon={false}
                    showGeolocation={true}
                    enableDictation={true}
                  />
                </div>
              </div>

              {/* Radius */}
              <div
                className="w-full min-w-0 sm:flex-1"
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  Radius
                </div>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    style={{
                      flex: 1,
                      appearance: "none",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      paddingRight: 16,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#0A0E27",
                    }}
                  >
                    <option value="5">5 miles</option>
                    <option value="10">10 miles</option>
                    <option value="15">15 miles</option>
                    <option value="20">20 miles</option>
                    <option value="30">30 miles</option>
                  </select>
                  <ChevronDown
                    size={11}
                    strokeWidth={2}
                    style={{ color: "#9CA3AF", position: "absolute", right: 0, pointerEvents: "none" }}
                  />
                </div>
              </div>

              {/* Transmission */}
              <div
                className="w-full min-w-0 sm:flex-1"
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  Transmission
                </div>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    style={{
                      flex: 1,
                      appearance: "none",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      paddingRight: 16,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#0A0E27",
                    }}
                  >
                    <option value="all">Any</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </select>
                  <ChevronDown
                    size={11}
                    strokeWidth={2}
                    style={{ color: "#9CA3AF", position: "absolute", right: 0, pointerEvents: "none" }}
                  />
                </div>
              </div>

              {/* Search button */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full sm:w-auto"
                style={{
                  background: "#E8641A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 28px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  flexShrink: 0,
                  cursor: isSearching ? "default" : "pointer",
                  opacity: isSearching ? 0.6 : 1,
                }}
              >
                {isSearching ? (
                  <Loader2 size={13} strokeWidth={2.2} className="animate-spin" />
                ) : (
                  <Search size={13} strokeWidth={2.2} color="#FFFFFF" />
                )}
                <span>Search</span>
              </button>
            </form>
          ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="mb-3.5 flex flex-col rounded-[10px] border-[1.5px] md:flex-row"
            style={{ borderColor: tokens.border }}
          >
            {/* Postcode */}
            <div
              className="flex-[1.8] px-3.5 py-2.5 md:border-r border-b md:border-b-0"
              style={{ borderColor: tokens.border }}
            >
              <div
                className="font-heading mb-[5px] text-[10px] font-bold uppercase tracking-[0.6px]"
                style={{ color: tokens.muted }}
              >
                Postcode
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} strokeWidth={1.8} style={{ color: tokens.border }} />
                <PostcodeAutocomplete
                  value={postcode}
                  onChange={(v) => setPostcode(v.toUpperCase())}
                  onSelect={(pc) => {
                    setPostcode(pc);
                    setTimeout(() => handleSearch(), 100);
                  }}
                  placeholder="Enter your postcode"
                  className="flex-1"
                  inputClassName="h-7 border-0 bg-transparent p-0 text-[15px] font-medium shadow-none focus-visible:ring-0 placeholder:text-[#C4C9D4]"
                  showInputIcon={false}
                  showGeolocation={true}
                  enableDictation={true}
                />
              </div>
            </div>

            {/* Radius */}
            <div
              className="flex-1 px-3.5 py-2.5 md:border-r border-b md:border-b-0"
              style={{ borderColor: tokens.border }}
            >
              <div
                className="font-heading mb-[5px] text-[10px] font-bold uppercase tracking-[0.6px]"
                style={{ color: tokens.muted }}
              >
                Search radius
              </div>
              <div className="relative flex items-center gap-2">
                <MapIcon size={16} strokeWidth={1.8} style={{ color: tokens.border }} />
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="font-heading flex-1 appearance-none bg-transparent pr-5 text-[15px] font-medium outline-none"
                  style={{ color: tokens.navy }}
                >
                  <option value="5">5 miles</option>
                  <option value="10">10 miles</option>
                  <option value="15">15 miles</option>
                  <option value="20">20 miles</option>
                  <option value="30">30 miles</option>
                </select>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className="pointer-events-none absolute right-0"
                  style={{ color: "#C4C9D4" }}
                />
              </div>
            </div>

            {/* Transmission */}
            <div
              className="flex-1 px-3.5 py-2.5 md:border-r border-b md:border-b-0"
              style={{ borderColor: tokens.border }}
            >
              <div
                className="font-heading mb-[5px] text-[10px] font-bold uppercase tracking-[0.6px]"
                style={{ color: tokens.muted }}
              >
                Transmission
              </div>
              <div className="relative flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tokens.border} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M12 10V3M10.5 13.5L5 19M13.5 13.5L19 19" />
                </svg>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="font-heading flex-1 appearance-none bg-transparent pr-5 text-[15px] font-medium outline-none"
                  style={{ color: tokens.navy }}
                >
                  <option value="all">Any</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className="pointer-events-none absolute right-0"
                  style={{ color: "#C4C9D4" }}
                />
              </div>
            </div>

            {/* Search button */}
            <button
              type="submit"
              disabled={isSearching}
              className="flex flex-shrink-0 items-center justify-center gap-2 text-white transition-colors hover:!bg-[#1A3370] disabled:opacity-60"
              style={{ backgroundColor: tokens.red, padding: "14px 28px", borderRadius: 2 }}
            >
              {isSearching ? (
                <Loader2 size={16} strokeWidth={2.2} className="animate-spin" />
              ) : (
                <Search size={16} strokeWidth={2.2} />
              )}
              <span className="font-heading text-sm font-medium">Search</span>
            </button>
          </form>
          )}

          {/* Filter row */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-[7px]">
              <span
                className="font-heading mr-0.5 text-xs font-medium"
                style={{ color: tokens.muted }}
              >
                Filter:
              </span>
              {FILTER_OPTIONS.map((opt) => {
                const isActive = activeFilter === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActiveFilter?.(opt.id)}
                    className="font-heading inline-flex items-center gap-[5px] rounded-full border text-[13px] font-medium transition-colors hover:!border-[#0F2044] hover:!text-[#0F2044] data-[active=true]:hover:!text-white"
                    data-active={isActive}
                    style={{
                      padding: "8px 16px",
                      borderColor: isActive ? tokens.blue : tokens.pillBorder,
                      backgroundColor: isActive ? tokens.blue : "#FFF",
                      color: isActive ? "#FFF" : tokens.navy,
                    }}
                  >
                    {Icon && <Icon size={13} strokeWidth={2} />}
                    {opt.label}
                  </button>
                );
              })}

              <span
                className="mx-1 inline-block h-5 w-px"
                style={{ backgroundColor: tokens.border }}
              />

              <button
                type="button"
                onClick={onMoreFilters}
                className="font-heading inline-flex items-center gap-[5px] rounded-full border bg-white px-3 py-[5px] text-[13px] font-medium"
                style={{ borderColor: tokens.border, color: tokens.mid }}
              >
                <SlidersHorizontal size={14} strokeWidth={1.8} />
                More filters
                <ChevronDown size={14} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </section>
    </>
  );
}

interface ChapmansMobileSearchProps {
  postcode: string;
  setPostcode: (v: string) => void;
  radius: string;
  setRadius: (v: string) => void;
  transmission: string;
  setTransmission: (v: string) => void;
  isSearching: boolean;
  activeFilter?: CourseFilterId;
  setActiveFilter?: (v: CourseFilterId) => void;
  onSearch: () => void;
  showFilters: boolean;
}

function ChapmansMobileSearch({
  postcode,
  setPostcode,
  radius,
  setRadius,
  transmission,
  setTransmission,
  isSearching,
  activeFilter,
  setActiveFilter,
  onSearch,
  showFilters,
}: ChapmansMobileSearchProps) {
  return (
    <div className="md:hidden">
      <style>{`.chapmans-tabs::-webkit-scrollbar{display:none}`}</style>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        style={{
          background: "#FFF",
          margin: "-16px 16px 0",
          borderRadius: 14,
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ overflow: "hidden", borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
          {/* Postcode */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: 6,
                display: "block",
              }}
            >
              Postcode
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                <MapPin size={14} strokeWidth={2} style={{ color: "#C4C9D4", flexShrink: 0 }} />
                <PostcodeAutocomplete
                  value={postcode}
                  onChange={(v) => setPostcode(v.toUpperCase())}
                  onSelect={(pc) => {
                    setPostcode(pc);
                    setTimeout(() => onSearch(), 100);
                  }}
                  placeholder="Enter postcode"
                  className="flex-1 min-w-0"
                  inputClassName="h-7 border-0 bg-transparent p-0 text-[15px] font-medium shadow-none focus-visible:ring-0 placeholder:text-[#C4C9D4]"
                  showInputIcon={false}
                  showGeolocation={true}
                  enableDictation={true}
                />
              </div>
            </div>
          </div>

          {/* Radius */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: 6,
                display: "block",
              }}
            >
              Search radius
            </div>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                style={{
                  flex: 1,
                  appearance: "none",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  paddingRight: 20,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#0A0E27",
                }}
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="15">15 miles</option>
                <option value="20">20 miles</option>
                <option value="30">30 miles</option>
              </select>
              <ChevronDown
                size={16}
                strokeWidth={2}
                style={{ color: "#9CA3AF", position: "absolute", right: 0, pointerEvents: "none" }}
              />
            </div>
          </div>

          {/* Transmission */}
          <div style={{ padding: "12px 16px", borderBottom: showFilters && activeFilter && setActiveFilter ? "1px solid #F3F4F6" : "none" }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: 8,
                display: "block",
              }}
            >
              Transmission
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { value: "all", label: "All" },
                { value: "manual", label: "Manual" },
                { value: "automatic", label: "Automatic" },
              ].map((opt) => {
                const isActive = transmission === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTransmission(opt.value)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      background: isActive ? "#E8641A" : "#FFF",
                      color: isActive ? "#FFF" : "#4B5563",
                      border: `1px solid ${isActive ? "#E8641A" : "#E5E7EB"}`,
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Course type filter (moved inside card, directly under Transmission) */}
          {showFilters && activeFilter && setActiveFilter && (
            <div style={{ padding: "12px 16px" }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Course type
              </div>
              <div
                className="chapmans-tabs"
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  scrollbarWidth: "none",
                }}
              >
                {FILTER_OPTIONS.map((opt) => {
                  const isActive = activeFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setActiveFilter(opt.id)}
                      data-active={isActive}
                      style={{
                        padding: "7px 16px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        background: isActive ? "#E8641A" : "#FFF",
                        color: isActive ? "#FFF" : "#4B5563",
                        border: `1px solid ${isActive ? "#E8641A" : "#E5E7EB"}`,
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Search button */}
        <button
          type="submit"
          disabled={isSearching}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            margin: "14px 16px 16px",
            padding: 14,
            background: "#E8641A",
            color: "#FFF",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            width: "calc(100% - 32px)",
            cursor: isSearching ? "default" : "pointer",
            opacity: isSearching ? 0.6 : 1,
          }}
        >
          {isSearching ? (
            <Loader2 size={16} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <Search size={16} strokeWidth={2.2} />
          )}
          <span>Search courses</span>
        </button>
      </form>

      {/* Filter tabs */}
      {showFilters && activeFilter && setActiveFilter && (
        <div style={{ padding: "16px 16px 0" }}>
          <div
            style={{
              fontSize: 11,
              color: "#9CA3AF",
              fontWeight: 500,
              marginBottom: 10,
            }}
          >
            Filter by course type:
          </div>
          <div
            className="chapmans-tabs"
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 14,
              scrollbarWidth: "none",
            }}
          >
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActiveFilter(opt.id)}
                  data-active={isActive}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    background: isActive ? "#E8641A" : "#FFF",
                    color: isActive ? "#FFF" : "#4B5563",
                    border: `1px solid ${isActive ? "#E8641A" : "#E5E7EB"}`,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

