import { useState, useRef, useEffect } from "react";
import { Check, X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { cn } from "@/lib/utils";

interface InlineEditFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "date" | "time" | "number" | "datetime-local" | "textarea" | "address";
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
  label?: string;
  emptyText?: string;
  disabled?: boolean;
  onPostcodeChange?: (postcode: string) => void;
}

export function InlineEditField({
  value,
  onSave,
  placeholder,
  type = "text",
  className,
  textClassName,
  icon,
  label,
  emptyText = "Click to add",
  disabled = false,
  onPostcodeChange,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch {
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          {label && <span className="text-[10px] text-muted-foreground block">{label}</span>}
          <div className="flex items-center gap-1">
            {type === "textarea" ? (
              <Textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="text-sm min-h-[60px]"
                disabled={saving}
              />
            ) : type === "address" ? (
              <GoogleAddressAutocomplete
                value={editValue}
                onChange={(v) => setEditValue(v)}
                onPostcodeChange={onPostcodeChange}
                placeholder={placeholder || "Start typing an address..."}
                className="flex-1"
              />
            ) : (
              <Input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-7 text-sm"
                disabled={saving}
              />
            )}
            <div className="flex gap-1 shrink-0">
              <button onClick={handleSave} disabled={saving} className="h-6 w-6 rounded flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleCancel} className="h-6 w-6 rounded flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      className={cn(
        "group flex items-center gap-2 text-left rounded-md px-1 -mx-1 py-0.5 transition-colors",
        !disabled && "hover:bg-muted/50 cursor-pointer",
        disabled && "cursor-default",
        className
      )}
    >
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        {label && <span className="text-[10px] text-muted-foreground block">{label}</span>}
        <span className={cn(
          "text-sm truncate block",
          value ? "text-foreground" : "text-muted-foreground italic",
          textClassName
        )}>
          {value || emptyText}
        </span>
      </div>
      {!disabled && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
}
