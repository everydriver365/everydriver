import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import klarnaClearpayPills from "@/assets/klarna-clearpay-pills.png";

const RADIUS_OPTIONS = [
  { value: "1", label: "1 mile" },
  { value: "3", label: "3 miles" },
  { value: "5", label: "5 miles" },
  { value: "10", label: "10 miles" },
  { value: "15", label: "15 miles" },
  { value: "20", label: "20 miles" },
  { value: "30", label: "30 miles" },
];

const TRANSMISSION_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
];

interface HeroSearchSectionProps {
  backgroundImage?: string;
  className?: string;
}

export function HeroSearchSection({
  backgroundImage = "/src/assets/hero-driving.jpg",
  className = "",
}: HeroSearchSectionProps) {
  const navigate = useNavigate();
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState("10");
  const [transmission, setTransmission] = useState("all");
  const [postcodeError, setPostcodeError] = useState(false);

  const radiusRef = useRef<HTMLSelectElement>(null);
  const transmissionRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postcode.trim()) {
      setPostcodeError(true);
      return;
    }
    setPostcodeError(false);
    const params = new URLSearchParams({
      postcode: postcode.trim(),
      radius,
      transmission,
    });
    // Preserve ?everydriver=1 preview override so the EveryDriver clone keeps
    // rendering after navigation (otherwise the param drops and we fall back
    // to the Drive365 search page).
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("everydriver") === "1"
    ) {
      params.set("everydriver", "1");
    }
    navigate(`/drive365/search?${params.toString()}`);
  };

  useEffect(() => {
    if (postcode.trim()) setPostcodeError(false);
  }, [postcode]);

  return (
    <div className={`mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 mb-[60px] sm:mb-16 ${className}`}>
      {/* Hero wrapper — relative, NO overflow hidden so search box can overhang */}
      <div className="relative">
        {/* Image container — rounded + overflow hidden */}
        <div
          className="drive365-hero-rounded relative isolate transform-gpu w-full h-[200px] sm:h-[300px] lg:h-[360px] overflow-hidden rounded-3xl bg-neutral-900"
        >
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "65% center" }}
            loading="eager"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(9,14,30,0.85) 0%, rgba(9,14,30,0.55) 38%, rgba(9,14,30,0) 65%)",
            }}
          />
          {/* Text overlay */}
          <div className="absolute inset-0 flex items-start pt-6 sm:pt-10 lg:pt-12">
            <div className="px-6 sm:px-10 lg:px-14 max-w-[60%] sm:max-w-[55%] lg:max-w-[50%]">
              {/* Premium badge */}
              <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-400" />
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                  DVSA Approved
                </span>
              </div>
              {/* Headline */}
              <h2 className="text-white text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight drop-shadow-2xl">
                Learn to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-sky-300 to-sky-500">
                  Drive
                </span>
              </h2>
              {/* Subtext */}
              <p className="text-white/85 text-xs sm:text-base lg:text-lg mt-3 sm:mt-4 font-medium leading-snug max-w-md drop-shadow-md">
                <span className="text-white font-semibold">Money back</span> if you pass first time,{" "}
                <span className="text-white font-semibold">FREE retest</span> if you don't.
              </p>
              {/* Pay later logos */}
              <div className="mt-3 sm:mt-4 flex items-center gap-2">
                <span className="text-white/70 text-[10px] sm:text-xs font-medium uppercase tracking-wider drop-shadow">
                  spread your payments
                </span>
                <img
                  src={klarnaClearpayPills}
                  alt="Klarna and Clearpay"
                  className="h-7 sm:h-9 lg:h-10 w-auto drop-shadow-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop / tablet pill — overhangs the hero bottom */}
        <form
          onSubmit={handleSubmit}
          aria-label="Search for driving instructors"
          className="hidden sm:block absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: "-30px",
            width: "min(90%, 980px)",
          }}
        >
          <div
            className="flex items-center bg-white h-[78px] lg:h-[84px] w-full rounded-full"
            style={{
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            {/* Postcode */}
            <div className="flex-1 flex flex-col justify-center pl-7 pr-5 min-w-0 relative">
              <label className="text-[13px] font-bold text-black leading-tight">
                Postcode<span className="text-[#CC2229] ml-0.5">*</span>
              </label>
              <PostcodeAutocomplete
                value={postcode}
                onChange={setPostcode}
                onSelect={(pc) => setPostcode(pc)}
                placeholder="e.g. SO30 2TD"
                className="w-full"
                inputClassName={`h-7 lg:h-8 border-0 bg-transparent p-0 text-[15px] lg:text-base font-normal focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#9CA3AF] ${
                  postcodeError ? "text-[#CC2229] placeholder:text-[#CC2229]" : "text-black"
                }`}
                showGeolocation={false}
                showInputIcon={false}
              />
              {postcodeError && (
                <span className="absolute -bottom-5 left-7 text-xs text-[#CC2229]">
                  Please enter a postcode
                </span>
              )}
            </div>

            <div className="self-center w-px bg-[#e3e3ea] shrink-0" style={{ height: "44px" }} />

            {/* Radius */}
            <div className="flex-1 flex flex-col justify-center px-5 min-w-0">
              <label htmlFor="hero-radius" className="text-[13px] font-bold text-black leading-tight">
                Radius
              </label>
              <div className="relative">
                <select
                  id="hero-radius"
                  ref={radiusRef}
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full h-7 lg:h-8 appearance-none bg-transparent border-0 py-0 pl-2 pr-6 text-[15px] lg:text-base font-normal text-black focus:ring-0 cursor-pointer"
                  aria-label="Search radius"
                >
                  {RADIUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            <div className="self-center w-px bg-[#e3e3ea] shrink-0" style={{ height: "44px" }} />

            {/* Transmission */}
            <div className="flex-1 flex flex-col justify-center px-5 min-w-0">
              <label htmlFor="hero-transmission" className="text-[13px] font-bold text-black leading-tight">
                Transmission
              </label>
              <div className="relative">
                <select
                  id="hero-transmission"
                  ref={transmissionRef}
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full h-7 lg:h-8 appearance-none bg-transparent border-0 py-0 pl-2 pr-6 text-[15px] lg:text-base font-normal text-black focus:ring-0 cursor-pointer"
                  aria-label="Transmission type"
                >
                  {TRANSMISSION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            {/* Search button */}
            <div className="flex items-center pr-2 pl-3 shrink-0">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 h-[60px] lg:h-[68px] px-5 lg:px-7 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-sm lg:text-base rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 whitespace-nowrap"
                aria-label="Search all instructors"
              >
                <Search className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden="true" />
                <span className="hidden lg:inline">Search all Instructors</span>
                <span className="lg:hidden">Search</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Mobile search box — sits BELOW the hero image, stacked */}
      <div className="sm:hidden mt-4">
        <form
          onSubmit={handleSubmit}
          className="w-full"
          aria-label="Search for driving instructors"
        >
          <div className="flex flex-col bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-hidden w-full">
            <div className="px-5 py-4 border-b border-[#e3e3ea]">
              <label className="block text-sm font-bold text-black mb-1">
                Postcode<span className="text-[#CC2229] ml-0.5">*</span>
              </label>
              <PostcodeAutocomplete
                value={postcode}
                onChange={setPostcode}
                onSelect={(pc) => setPostcode(pc)}
                placeholder="e.g. SO30 2TD"
                className="w-full"
                inputClassName={`h-8 border-0 bg-transparent p-0 text-lg font-normal focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#9CA3AF] ${
                  postcodeError ? "text-[#CC2229] placeholder:text-[#CC2229]" : "text-black"
                }`}
                showGeolocation={false}
              />
              {postcodeError && (
                <span className="text-xs text-[#CC2229] mt-1 block">
                  Please enter a postcode
                </span>
              )}
            </div>

            <div className="px-5 py-4 border-b border-[#e3e3ea]">
              <label htmlFor="hero-radius-mobile" className="block text-sm font-bold text-black mb-1">
                Radius
              </label>
              <div className="relative">
                <select
                  id="hero-radius-mobile"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full h-8 appearance-none bg-transparent border-0 p-0 pr-6 text-lg font-normal text-black focus:ring-0 cursor-pointer"
                  aria-label="Search radius"
                >
                  {RADIUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            <div className="px-5 py-4 border-b border-[#e3e3ea]">
              <label htmlFor="hero-transmission-mobile" className="block text-sm font-bold text-black mb-1">
                Transmission
              </label>
              <div className="relative">
                <select
                  id="hero-transmission-mobile"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full h-8 appearance-none bg-transparent border-0 p-0 pr-6 text-lg font-normal text-black focus:ring-0 cursor-pointer"
                  aria-label="Transmission type"
                >
                  {TRANSMISSION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            <div className="px-5 py-4">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full h-14 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-lg rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
                aria-label="Search all instructors"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
                Search all Instructors
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
