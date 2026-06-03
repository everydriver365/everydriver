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
      {/* Top navy bar with brand + search pill */}
      <div className="hidden md:block bg-[#0A2B6B]">
        <div className="mx-auto max-w-7xl h-16 px-8 flex items-center gap-6">
          {/* DRIVE / 365 split logo */}
          <a href="/" className="flex items-baseline gap-1.5 shrink-0 select-none">
            <span className="text-white font-extrabold tracking-[-0.5px] text-[22px] leading-none">
              DRIVE
            </span>
            <span className="text-[#D12E2E] font-extrabold tracking-[-0.5px] text-[22px] leading-none">
              365
            </span>
          </a>

          {/* White pill search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex-1 max-w-3xl ml-auto flex items-stretch h-10 bg-white rounded-full overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
          >
            <div className="flex items-center gap-2 px-4 flex-[1.6] min-w-0">
              <MapPin size={14} className="text-[#9CA3AF] shrink-0" />
              <PostcodeAutocomplete
                value={postcode}
                onChange={(v) => setPostcode(v.toUpperCase())}
                onSelect={(pc) => {
                  setPostcode(pc);
                  setTimeout(() => handleSearch(), 100);
                }}
                placeholder="Postcode"
                className="flex-1 min-w-0"
                inputClassName="h-7 border-0 bg-transparent p-0 text-[13px] font-medium shadow-none focus-visible:ring-0 placeholder:text-[#9CA3AF]"
                showInputIcon={false}
                showGeolocation={false}
              />
            </div>
            <div className="w-px self-stretch bg-[#E5E7EB] my-2" />
            <div className="relative flex items-center px-4 flex-1 min-w-0">
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full appearance-none bg-transparent pr-5 text-[13px] font-medium text-[#0A0E27] outline-none cursor-pointer"
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="15">15 miles</option>
                <option value="20">20 miles</option>
                <option value="30">30 miles</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-3 text-[#9CA3AF]" />
            </div>
            <div className="w-px self-stretch bg-[#E5E7EB] my-2" />
            <div className="relative flex items-center px-4 flex-1 min-w-0">
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full appearance-none bg-transparent pr-5 text-[13px] font-medium text-[#0A0E27] outline-none cursor-pointer"
              >
                <option value="all">Any transmission</option>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-3 text-[#9CA3AF]" />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center justify-center gap-1.5 bg-[#D12E2E] hover:bg-[#b32525] text-white px-6 text-[13px] font-bold transition-colors disabled:opacity-60"
            >
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} strokeWidth={2.4} />}
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Title + filter chips */}
      <div className="hidden md:block border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-7xl px-8 py-5">
          <h1 className="text-[24px] font-bold text-[#0A0E27] tracking-[-0.5px]">{title}</h1>
          {showFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => {
                const active = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter?.(f.id)}
                    className="rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors"
                    style={{
                      borderColor: active ? "#0A2B6B" : "#E5E7EB",
                      backgroundColor: active ? "#0A2B6B" : "#FFF",
                      color: active ? "#FFF" : "#0A0E27",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile fallback: original header */}
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
