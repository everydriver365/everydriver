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
}

const FILTER_OPTIONS: { id: CourseFilterId; label: string; icon?: typeof Zap }[] = [
  { id: "all", label: "All courses" },
  { id: "intensive", label: "Intensive", icon: Zap },
  { id: "semi-intensive", label: "Semi-intensive" },
  { id: "weekly", label: "Weekly lessons" },
];

const tokens = {
  navy: "#0A0A0A",
  blue: "#2D3FE7",
  blueHover: "#1F2DC9",
  red: "#2D3FE7",
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
}: CourseSearchHeaderProps) {
  const showFilters = Boolean(activeFilter && setActiveFilter);

  const handleSearch = () => {
    if (typeof document !== "undefined") {
      const el = document.activeElement as HTMLElement | null;
      el?.blur?.();
    }
    onSearch();
  };

  return (
    <section className="px-5 pt-5 pb-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl"
      >
        {/* Eyebrow */}
        <div className="mb-2 flex items-center gap-[7px]">
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
          className="font-heading mb-5 text-[28px] font-bold leading-tight tracking-[-0.5px]"
          style={{ color: tokens.navy }}
        >
          {title}
        </h1>

        {/* Search card */}
        <div
          className="mb-3 rounded-[14px] border bg-white p-4"
          style={{
            borderColor: tokens.border,
            boxShadow: "0 2px 12px rgba(15,32,68,0.07)",
          }}
        >
          {/* Unified search bar */}
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
              className="flex flex-shrink-0 items-center justify-center gap-2 px-6 py-3 text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: tokens.red }}
            >
              {isSearching ? (
                <Loader2 size={16} strokeWidth={2.2} className="animate-spin" />
              ) : (
                <Search size={16} strokeWidth={2.2} />
              )}
              <span className="font-heading text-sm font-bold">Search</span>
            </button>
          </form>

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
                    className="font-heading inline-flex items-center gap-[5px] rounded-full border px-[13px] py-[5px] text-[13px] font-medium transition-colors"
                    style={{
                      borderColor: isActive ? tokens.blue : tokens.border,
                      backgroundColor: isActive ? tokens.blue : "#FFF",
                      color: isActive ? "#FFF" : tokens.mid,
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
  );
}
