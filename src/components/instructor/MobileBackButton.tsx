import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Floating mobile back button shown on instructor sub-pages so pupils
 * navigating from the home Quick Access tiles can always return home.
 *
 * Hidden on:
 *  - non-instructor routes
 *  - the instructor home itself (/instructor, /instructor/)
 *  - desktop viewports (md+)
 */
export function MobileBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Schedule renders its own chrome and skips MobileBlueHeader, so the
  // shared header back button isn't available there. Show a floating
  // fallback only on that route.
  const normalized = pathname.replace(/\/+$/, "");
  if (normalized !== "/instructor/schedule") return null;



  return (
    <button
      type="button"
      aria-label="Back to home"
      onClick={() => navigate("/instructor")}
      className="md:hidden fixed left-3 z-[60] flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-3 py-2 shadow-md border border-black/5 active:scale-95 transition"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 10px)",
        fontFamily: "Poppins, system-ui, sans-serif",
      }}
    >
      <ChevronLeft size={18} strokeWidth={2.25} color="#1a1a1f" />
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1f" }}>Home</span>
    </button>
  );
}
