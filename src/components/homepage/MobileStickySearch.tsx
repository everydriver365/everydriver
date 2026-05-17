import { useEffect, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";

/**
 * Slim sticky search bar shown on mobile after the hero scrolls off-screen.
 * Triggers once the user has scrolled past ~80vh so it doesn't compete with
 * the hero's own search card.
 */
export function MobileStickySearch() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [postcode, setPostcode] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed left-0 right-0 top-16 z-40 px-3 transition-all duration-300 md:hidden ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (postcode.trim()) navigate(`/courses?postcode=${encodeURIComponent(postcode.trim())}`);
        }}
        className="flex items-center gap-0 bg-white rounded-full overflow-hidden shadow-lg border border-border/40"
      >
        <div className="flex-1 relative min-w-0">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <PostcodeAutocomplete
            value={postcode}
            onChange={setPostcode}
            onSelect={(pc) => navigate(`/courses?postcode=${pc}`)}
            placeholder="Find courses near you..."
            inputClassName="h-10 text-sm bg-transparent border-0 rounded-none pl-9 pr-2 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            showGeolocation={false}
          />
        </div>
        <button
          type="submit"
          className="h-10 px-4 flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
