import {
  Pencil,
  Minus,
  ArrowRight,
  Circle,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Save,
  FolderOpen,
  FilePlus,
  Hand,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DrawingTool = "pen" | "line" | "arrow" | "circle" | "text";
export type DrawingColor = string;

const TOOLS: { tool: DrawingTool; icon: React.ElementType; label: string }[] = [
  { tool: "pen", icon: Pencil, label: "Freehand" },
  { tool: "line", icon: Minus, label: "Line" },
  { tool: "arrow", icon: ArrowRight, label: "Arrow" },
  { tool: "circle", icon: Circle, label: "Circle" },
  { tool: "text", icon: Type, label: "Text" },
];

const COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#000000", // black
  "#ffffff", // white
  "#f59e0b", // amber
];

const WIDTHS = [2, 4, 6, 8];

interface Props {
  activeTool: DrawingTool;
  onToolChange: (t: DrawingTool) => void;
  activeColor: DrawingColor;
  onColorChange: (c: DrawingColor) => void;
  lineWidth: number;
  onLineWidthChange: (w: number) => void;
  isDrawing: boolean;
  onToggleDrawing: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNew: () => void;
  currentName: string;
  onNameChange: (n: string) => void;
}

export function DoodlepadToolbar({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  lineWidth,
  onLineWidthChange,
  isDrawing,
  onToggleDrawing,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onLoad,
  onNew,
  currentName,
  onNameChange,
}: Props) {
  return (
    <div className="absolute bottom-20 left-2 right-2 z-[600] flex flex-col gap-2 md:bottom-4 md:left-4 md:right-4">
      {/* Name input */}
      <div className="flex gap-2 justify-center">
        <Input
          value={currentName}
          onChange={(e) => onNameChange(e.target.value)}
          className="max-w-[200px] h-9 bg-white/95 dark:bg-card/95 backdrop-blur text-sm shadow-lg border-border/50"
          placeholder="Jotter name"
        />
      </div>

      {/* Main toolbar */}
      <div className="flex items-center justify-center gap-1 flex-wrap bg-white/95 dark:bg-card/95 backdrop-blur rounded-none shadow-lg border border-border/50 px-2 py-2">
        {/* Draw / Pan toggle */}
        <Button
          variant={isDrawing ? "default" : "outline"}
          size="icon"
          className="h-9 w-9"
          onClick={onToggleDrawing}
          title={isDrawing ? "Switch to pan" : "Switch to draw"}
        >
          {isDrawing ? <Pencil className="h-4 w-4" /> : <Hand className="h-4 w-4" />}
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Tools */}
        {TOOLS.map(({ tool, icon: Icon, label }) => (
          <Button
            key={tool}
            variant={activeTool === tool && isDrawing ? "default" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              onToolChange(tool);
              if (!isDrawing) onToggleDrawing();
            }}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Colors */}
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-transform",
              activeColor === c ? "border-primary scale-110" : "border-border/50"
            )}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Line widths */}
        {WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => onLineWidthChange(w)}
            className={cn(
              "h-8 w-8 rounded-none flex items-center justify-center transition-colors",
              lineWidth === w ? "bg-primary/20" : "hover:bg-muted"
            )}
            title={`Width ${w}`}
          >
            <div className="rounded-full bg-foreground" style={{ width: w + 2, height: w + 2 }} />
          </button>
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Actions */}
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClear} title="Clear all">
          <Trash2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onNew} title="New">
          <FilePlus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onSave} title="Save">
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onLoad} title="Load saved">
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
