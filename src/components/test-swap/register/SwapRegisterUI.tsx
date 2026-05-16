import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  ArrowRight,
  Loader2,
} from "lucide-react";

export const swap = {
  navy: "#0F2044",
  blue: "#1A52A0",
  blueMid: "#B5D4F4",
  blueLight: "#E6F1FB",
  red: "#CC2229",
  redLight: "#FBEAEA",
  charcoal: "#2B2B2B",
  mid: "#6B7280",
  muted: "#9CA3AF",
  surface: "#F2F4F8",
  surfaceAlt: "#E8EDF6",
  white: "#FFFFFF",
  border: "#DDE3ED",
  borderDark: "#C4CEDF",
} as const;

/* ---------- Header ---------- */
export function SwapRegisterHeader({ backTo, backLabel }: { backTo: string; backLabel: string }) {
  return (
    <div style={{ background: swap.navy }} className="w-full">
      <div className="max-w-2xl mx-auto h-14 flex items-center px-4 md:px-6">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-[13px] hover:text-white transition-colors"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          {backLabel}
        </Link>
        <div className="flex-1 text-right">
          <span className="text-[17px] font-bold text-white tracking-tight">
            Drive<span style={{ color: "#5DCAA5" }}>365</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Hero ---------- */
const STEPS = [
  { n: 1, label: "Your details" },
  { n: 2, label: "Find a match" },
  { n: 3, label: "Call DVSA" },
  { n: 4, label: "Confirmed" },
];

export function SwapRegisterHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-4 md:px-6 pt-8 pb-2">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ background: swap.blue }} className="block w-5 h-[2px] rounded-sm" />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: swap.blue }}
        >
          Test swap network
        </span>
      </div>
      <h1
        className="text-[26px] md:text-[30px] font-bold leading-tight tracking-tight mb-2"
        style={{ color: swap.navy }}
      >
        {title}
      </h1>
      <p
        className="text-sm font-light leading-relaxed mb-6 max-w-xl"
        style={{ color: swap.mid }}
      >
        {subtitle}
      </p>

      {/* Progress steps */}
      <div className="flex items-center mb-2">
        {STEPS.map((s, i) => {
          const active = s.n === 1;
          return (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
                  style={{
                    background: active ? swap.blue : swap.surfaceAlt,
                    border: active ? "none" : `1.5px solid ${swap.borderDark}`,
                  }}
                >
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: active ? swap.white : swap.muted }}
                  >
                    {s.n}
                  </span>
                </div>
                <span
                  className="text-[10px] leading-tight text-center whitespace-nowrap"
                  style={{
                    color: active ? swap.navy : swap.muted,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-[1.5px] mx-1.5 mb-5"
                  style={{ background: swap.border }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Field wrapper ---------- */
export function SwapField({
  label,
  required,
  optional,
  hint,
  htmlFor,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: swap.mid }}
      >
        {label}
        {required && <span style={{ color: swap.red }}> *</span>}
        {optional && (
          <span
            className="ml-1 normal-case tracking-normal font-light"
            style={{ color: swap.muted }}
          >
            · optional
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] mt-1.5 leading-snug font-light" style={{ color: swap.muted }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/* Shared input class — mirrors the spec's fieldInput */
export const swapInputClass =
  "w-full rounded-[9px] border-[1.5px] px-3.5 py-2.5 text-sm bg-white outline-none transition-shadow focus:ring-[3px]";
export const swapInputStyle: React.CSSProperties = {
  borderColor: swap.border,
  color: swap.charcoal,
};

/* ---------- Section header ---------- */
export function SectionHeader({
  n,
  color,
  title,
  subtitle,
}: {
  n: number;
  color: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3.5 mb-5">
      <div
        className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: color, borderRadius: 9 }}
      >
        <span className="text-[13px] font-bold text-white">{n}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold mb-0.5" style={{ color: swap.navy }}>
          {title}
        </div>
        <div className="text-xs leading-snug font-light" style={{ color: swap.mid }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/* ---------- Form card wrapper ---------- */
export function SwapFormCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-white overflow-hidden"
      style={{
        border: `1px solid ${swap.border}`,
        borderRadius: 16,
        boxShadow: "0 2px 16px rgba(15,32,68,0.06)",
      }}
    >
      {React.Children.toArray(children).map((child, i, arr) => (
        <React.Fragment key={i}>
          {child}
          {i < arr.length - 1 && <div style={{ height: 1, background: swap.surface }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------- Info box (section 3) ---------- */
export function SwapInfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-2.5 p-3 mb-5"
      style={{
        background: swap.blueLight,
        border: `1px solid ${swap.blueMid}`,
        borderRadius: 10,
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: swap.blue }}
      >
        <Info className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
      </div>
      <div className="text-xs leading-relaxed flex-1" style={{ color: "#0C3D7A" }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- Decorative arrow between date inputs ---------- */
export function DateArrow() {
  return (
    <div className="hidden md:flex items-center justify-center pb-2.5 self-end">
      <ArrowRight className="w-4 h-4" strokeWidth={1.5} style={{ color: swap.borderDark }} />
    </div>
  );
}

/* ---------- Footer (consent + submit) ---------- */
export function SwapFormFooter({
  consentGiven,
  onConsentChange,
  canSubmit,
  submitting,
  submitLabel,
}: {
  consentGiven: boolean;
  onConsentChange: (v: boolean) => void;
  canSubmit: boolean;
  submitting: boolean;
  submitLabel: string;
}) {
  const disabled = !canSubmit || submitting;
  return (
    <div
      className="p-5 mt-0"
      style={{
        background: swap.surface,
        border: `1px solid ${swap.border}`,
        borderTop: "none",
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
      }}
    >
      {/* Consent */}
      <button
        type="button"
        onClick={() => onConsentChange(!consentGiven)}
        className="flex items-start gap-3 w-full text-left mb-5"
      >
        <span
          className="flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            width: 19,
            height: 19,
            borderRadius: 4,
            background: consentGiven ? swap.blue : swap.white,
            border: consentGiven ? "none" : `1.5px solid ${swap.borderDark}`,
          }}
        >
          {consentGiven && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        </span>
        <span className="text-xs leading-relaxed font-light flex-1" style={{ color: swap.mid }}>
          I agree to be contacted about potential swap matches and accept the{" "}
          <Link
            to="/privacy-policy"
            className="underline"
            style={{ color: swap.blue }}
            onClick={(e) => e.stopPropagation()}
          >
            privacy policy
          </Link>
          . I understand swaps are completed by calling{" "}
          <span className="font-medium" style={{ color: swap.charcoal }}>
            DVSA on 0300 200 1122
          </span>{" "}
          — Drive365 finds your match, DVSA completes the swap.
        </span>
      </button>

      {/* Submit row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium" style={{ color: swap.mid }}>
            Free to join.
          </div>
          <div className="text-xs font-light mt-0.5" style={{ color: swap.muted }}>
            We'll notify you when a match is found.
          </div>
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-2 transition-opacity"
          style={{
            background: swap.red,
            color: swap.white,
            borderRadius: 9,
            padding: "13px 22px",
            fontSize: 14,
            fontWeight: 600,
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{submitLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
