import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Settings2,
  User,
  MapPin,
  Calendar as CalendarIcon,
  ChevronRight,
  Heart,
} from "lucide-react";
import courseHours10 from "@/assets/course-hours-10.png";
import courseHours20 from "@/assets/course-hours-20.png";
import courseHours30 from "@/assets/course-hours-30.png";
import courseHours40 from "@/assets/course-hours-40.png";
import courseTestInAWeek from "@/assets/course-test-in-a-week.png";
import klarnaLogo from "@/assets/klarna-logo.svg";
import clearpayLogo from "@/assets/clearpay-logo.svg";

const HOURS_ICONS: Record<number, string> = {
  10: courseHours10,
  20: courseHours20,
  30: courseHours30,
  40: courseHours40,
};

interface CourseRowCardProps {
  instructor: {
    id: string;
    name?: string | null;
    klarna_enabled?: boolean | null;
    clearpay_enabled?: boolean | null;
    home_postcode?: string | null;
    car_type?: string | null;
  };
  hours: number;
  nextAvailable?: Date | null;
  distance?: number;
  isIntensive?: boolean;
  price: number;
  discountedPrice?: number | null;
  areaName?: string | null;
  title?: string;
}

function splitDate(d: Date) {
  return {
    dow: format(d, "EEE"),
    dm: format(d, "d MMM"),
    year: format(d, "yyyy"),
  };
}

function getCourseIcon(hours: number, title: string): string | undefined {
  if (/test\s*in\s*a\s*week/i.test(title)) return courseTestInAWeek;
  return HOURS_ICONS[hours];
}

export function CourseRowCard({
  instructor,
  hours,
  nextAvailable,
  distance,
  price,
  discountedPrice,
  areaName,
  title,
}: CourseRowCardProps) {
  const navigate = useNavigate();
  // Match DynamicCourseCard pricing: discountedPrice replaces total when truthy.
  const totalPrice = price;
  const finalPrice = discountedPrice || totalPrice;
  const hasDiscount = !!discountedPrice && discountedPrice < totalPrice;
  const courseTitle = title || `${hours} Hour Course`;
  const icon = getCourseIcon(hours, courseTitle);
  const date = nextAvailable ? splitDate(nextAvailable) : null;

  const transmission =
    instructor.car_type === "automatic"
      ? "Automatic"
      : instructor.car_type === "both"
      ? "Manual & Auto"
      : "Manual";

  const handleBook = () => {
    const dateParam = nextAvailable ? `&date=${format(nextAvailable, "yyyy-MM-dd")}` : "";
    navigate(`/book/${instructor.id}?hours=${hours}${dateParam}`);
  };

  return (
    <article className="group relative flex items-stretch gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Accent strip */}
      <div className="w-1.5 shrink-0 bg-gradient-to-b from-[#0B2545] to-[#13346b]" />

      {/* Hours / icon */}
      <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-r border-slate-100 bg-slate-50/50 px-4 py-4">
        {icon ? (
          <img src={icon} alt={`${hours} hours`} className="h-14 w-14 object-contain" />
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B2545] to-[#13346b] text-white shadow-sm">
              <span className="text-lg font-black leading-none">{hours}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">hr</span>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4 py-3">
        <h3 className="truncate text-[15px] font-bold leading-tight text-slate-900">{courseTitle}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
          <span className="flex items-center gap-1">
            <Settings2 className="h-3 w-3 text-slate-400" />
            {transmission}
          </span>
          {instructor.name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3 text-slate-400" />
              {instructor.name}
            </span>
          )}
          {(areaName || typeof distance === "number") && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" />
              {areaName || ""}
              {areaName && typeof distance === "number" ? " · " : ""}
              {typeof distance === "number" ? `${distance.toFixed(1)} mi` : ""}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {date && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50 px-2 py-1">
              <CalendarIcon className="h-3 w-3 text-sky-600" />
              <span className="text-[12px] font-bold text-sky-800">
                {date.dow}, {date.dm}
              </span>
              <span className="text-[11px] text-sky-600">{date.year}</span>
            </div>
          )}
          {instructor.klarna_enabled && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-2.5 py-1 text-[11px] font-semibold text-pink-800">
              <img src={klarnaLogo} alt="" className="h-4 w-4" />3 × £{(finalPrice / 3).toFixed(0)}
            </span>
          )}
          {instructor.clearpay_enabled && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800">
              <img src={clearpayLogo} alt="" className="h-4 w-4" />4 × £{(finalPrice / 4).toFixed(0)}
            </span>
          )}
        </div>
      </div>

      {/* Right: price + CTAs */}
      <div className="flex shrink-0 flex-col items-end justify-center gap-2 border-l border-slate-100 bg-slate-50/30 px-4 py-3">
        <div className="text-right">
          {hasDiscount && (
            <div className="text-[11px] font-medium leading-none text-slate-400 line-through">
              £{Math.round(totalPrice).toLocaleString()}
            </div>
          )}
          <div className={`text-[22px] font-extrabold leading-none tracking-tight ${hasDiscount ? "text-emerald-600" : "text-[#0B2545]"} ${hasDiscount ? "mt-1" : ""}`}>
            £{Math.round(finalPrice).toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {hasDiscount ? `Save £${Math.round(totalPrice - finalPrice)}` : "Total"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBook}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-[#0B2545] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#13346b]"
          >
            View &amp; Book
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Save course"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:text-rose-500"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
