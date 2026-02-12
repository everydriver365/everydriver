import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FaultEntry } from "./types";
import { cn } from "@/lib/utils";
import { Trash2, Palette } from "lucide-react";

interface FaultRowColors {
  minorBg?: string;
  seriousBg?: string;
  dangerousBg?: string;
  seriousCheckbox?: string;
  dangerousCheckbox?: string;
}

interface FaultRowProps {
  label: string;
  subLabel?: string;
  value: FaultEntry;
  onChange: (value: FaultEntry) => void;
  indent?: boolean;
  disabled?: boolean;
  colors?: FaultRowColors;
  onDelete?: () => void;
  onColorChange?: (colors: FaultRowColors) => void;
}

const defaultColors: FaultRowColors = {
  minorBg: "bg-amber-50",
  seriousBg: "bg-orange-100",
  dangerousBg: "bg-red-100",
  seriousCheckbox: "#E91E63",
  dangerousCheckbox: "#C2185B",
};

const colorPresets = [
  { label: "Amber", bg: "bg-amber-50", hex: "#fffbeb" },
  { label: "Orange", bg: "bg-orange-100", hex: "#ffedd5" },
  { label: "Red", bg: "bg-red-100", hex: "#fee2e2" },
  { label: "Green", bg: "bg-green-100", hex: "#dcfce7" },
  { label: "Blue", bg: "bg-[#0075c9]/10", hex: "#0075c9" },
  { label: "Purple", bg: "bg-purple-100", hex: "#f3e8ff" },
  { label: "Pink", bg: "bg-pink-100", hex: "#fce7f3" },
  { label: "Teal", bg: "bg-teal-100", hex: "#ccfbf1" },
];

export function FaultRow({
  label,
  subLabel,
  value,
  onChange,
  indent = false,
  disabled = false,
  colors = {},
  onDelete,
  onColorChange,
}: FaultRowProps) {
  const mergedColors = { ...defaultColors, ...colors };
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
  const deleteScale = useTransform(x, [-100, -50], [1, 0.8]);

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const total = parseInt(e.target.value) || 0;
    onChange({ ...value, total: Math.max(0, Math.min(99, total)) });
  };

  const handleSeriousChange = (checked: boolean) => {
    onChange({ ...value, serious: checked, dangerous: checked ? false : value.dangerous });
  };

  const handleDangerousChange = (checked: boolean) => {
    onChange({ ...value, dangerous: checked, serious: checked ? false : value.serious });
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x < -80 && onDelete) {
      onDelete();
    }
  };

  const hasAnyFault = value.total > 0 || value.serious || value.dangerous;

  return (
    <div className="relative overflow-hidden">
      {/* Delete background */}
      {onDelete && (
        <motion.div 
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-red-500"
          style={{ opacity: deleteOpacity, scale: deleteScale, width: 80 }}
        >
          <Trash2 className="h-5 w-5 text-white" />
        </motion.div>
      )}
      
      <motion.div
        drag={onDelete ? "x" : false}
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "grid grid-cols-[1fr_40px_28px_28px_24px] gap-0.5 items-center py-1 px-1.5 border-b border-slate-300 hover:bg-slate-100 transition-colors bg-white",
          indent && "pl-4",
          hasAnyFault && mergedColors.minorBg,
          value.serious && mergedColors.seriousBg,
          value.dangerous && mergedColors.dangerousBg,
          isDragging && "cursor-grabbing"
        )}
      >
        <div className="min-w-0 overflow-hidden">
          <span className="text-[11px] font-medium text-slate-800 truncate block leading-tight">{label}</span>
          {subLabel && (
            <span className="text-[9px] text-slate-500 truncate block leading-tight">{subLabel}</span>
          )}
        </div>
        <Input
          type="number"
          min={0}
          max={99}
          value={value.total || ""}
          onChange={handleTotalChange}
          disabled={disabled}
          className="h-6 w-10 text-center text-xs p-0.5 border-slate-400 bg-white"
          placeholder="0"
        />
        <Checkbox
          checked={value.serious}
          onCheckedChange={handleSeriousChange}
          disabled={disabled}
          className="h-5 w-5 border-slate-400"
          style={value.serious ? { backgroundColor: mergedColors.seriousCheckbox, borderColor: mergedColors.seriousCheckbox } : undefined}
          title="Serious"
        />
        <Checkbox
          checked={value.dangerous}
          onCheckedChange={handleDangerousChange}
          disabled={disabled}
          className="h-5 w-5 border-slate-400"
          style={value.dangerous ? { backgroundColor: mergedColors.dangerousCheckbox, borderColor: mergedColors.dangerousCheckbox } : undefined}
          title="Dangerous"
        />
        
        {/* Color picker */}
        {onColorChange && (
          <Popover>
            <PopoverTrigger asChild>
              <button 
                className="h-5 w-5 flex items-center justify-center rounded hover:bg-slate-200 transition-colors touch-manipulation"
                onClick={(e) => e.stopPropagation()}
              >
                <Palette className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-700">Row Color</p>
                <div className="grid grid-cols-4 gap-1">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.label}
                      className={cn(
                        "h-8 w-full rounded border-2 transition-all",
                        preset.bg,
                        mergedColors.minorBg === preset.bg ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-slate-300"
                      )}
                      onClick={() => onColorChange({ ...colors, minorBg: preset.bg })}
                      title={preset.label}
                    />
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-slate-700 mb-1">Custom</p>
                  <input
                    type="color"
                    className="w-full h-8 rounded cursor-pointer"
                    defaultValue={colorPresets.find(p => p.bg === mergedColors.minorBg)?.hex || "#fffbeb"}
                    onChange={(e) => {
                      const style = `bg-[${e.target.value}]`;
                      onColorChange({ ...colors, minorBg: style });
                    }}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        {!onColorChange && <div className="w-5" />}
      </motion.div>
    </div>
  );
}
