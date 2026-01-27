import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CompetencySectionProps {
  title: string;
  number?: string;
  children: ReactNode;
  className?: string;
}

export function CompetencySection({
  title,
  number,
  children,
  className,
}: CompetencySectionProps) {
  return (
    <div className={cn("border border-slate-400 rounded overflow-hidden", className)}>
      <div className="bg-[#007A8C] px-3 py-1.5 border-b border-slate-400">
        <h4 className="text-xs font-semibold text-white">
          {number && <span className="mr-1">{number}</span>}
          {title}
        </h4>
      </div>
      <div className="divide-y divide-slate-300">{children}</div>
    </div>
  );
}

export function SectionHeader() {
  return (
    <div className="grid grid-cols-[1fr_40px_28px_28px] gap-0.5 items-center py-1 px-1.5 bg-slate-200 text-[10px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-300">
      <span></span>
      <span className="text-center text-[9px]">Tot</span>
      <span className="text-center bg-[#E91E63] text-white rounded text-[9px] py-0.5">S</span>
      <span className="text-center bg-[#E91E63] text-white rounded text-[9px] py-0.5">D</span>
    </div>
  );
}
