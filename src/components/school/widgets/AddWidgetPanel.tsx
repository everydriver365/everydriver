import { X, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVAILABLE_WIDGETS, WIDGET_CATEGORIES } from "./WidgetDefinitions";

interface Props {
  open: boolean;
  onClose: () => void;
  activeWidgets: string[];
  onToggleWidget: (id: string) => void;
}

export default function AddWidgetPanel({ open, onClose, activeWidgets, onToggleWidget }: Props) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-bold text-lg">Add Widget</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {WIDGET_CATEGORIES.map(category => {
            const widgets = AVAILABLE_WIDGETS.filter(w => w.category === category);
            return (
              <div key={category}>
                <h4 className="text-sm font-semibold text-primary mb-3">{category}</h4>
                <div className="space-y-1">
                  {widgets.map(widget => {
                    const isActive = activeWidgets.includes(widget.id);
                    return (
                      <button
                        key={widget.id}
                        onClick={() => onToggleWidget(widget.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group
                          ${isActive ? "bg-primary/5" : "hover:bg-muted"}`}
                      >
                        <widget.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-sm flex-1 ${isActive ? "font-medium text-primary" : "text-foreground"}`}>
                          {widget.label}
                        </span>
                        {isActive ? (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
