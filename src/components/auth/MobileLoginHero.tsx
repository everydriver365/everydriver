import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobileLoginHeroProps {
  /** Imported hero image */
  heroSrc: string;
  /** Imported logo image (shown above the hero photo) */
  logoSrc: string;
  logoAlt: string;
  title: string;
  subtitle: string;
  /** When true, shows a back chevron that pops history */
  showBack?: boolean;
  /** Optional logo height tweak (default h-7) */
  logoClassName?: string;
}

/**
 * Mobile-only login hero header — driving-school photo banner with the
 * portal logo above it and a clean title/subtitle block beneath.
 * Designed to sit at the top of a login page on mobile (hidden on md+).
 */
export function MobileLoginHero({
  heroSrc,
  logoSrc,
  logoAlt,
  title,
  subtitle,
  showBack = true,
  logoClassName = "h-7",
}: MobileLoginHeroProps) {
  const navigate = useNavigate();

  return (
    <div className="md:hidden bg-white">
      {/* Top bar: back chevron + centred logo */}
      <div className="relative flex items-center justify-center px-4 pt-4 pb-3">
        {showBack && (
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            aria-label="Back"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 -m-2 text-slate-700 active:opacity-60"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
          </button>
        )}
        <img src={logoSrc} alt={logoAlt} className={`${logoClassName} object-contain`} />
      </div>

      {/* Hero photo */}
      <div className="w-full aspect-[16/11] overflow-hidden bg-slate-100">
        <img
          src={heroSrc}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* Title + subtitle */}
      <div className="px-6 pt-7 pb-5 text-center bg-white">
        <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-[14px] leading-[1.45] text-slate-500 max-w-[320px] mx-auto">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
