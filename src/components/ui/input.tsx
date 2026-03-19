import * as React from "react";
import { cn } from "@/lib/utils";
import { DictationButton } from "./dictation-button";

export interface InputProps extends React.ComponentProps<"input"> {
  enableDictation?: boolean;
  dictationLang?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, enableDictation = true, dictationLang, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref]
    );

    const isTextType = !type || ["text", "search", "url", "email", "tel"].includes(type);
    const showDictation = enableDictation && isTextType && !props.disabled && !props.readOnly;

    const handleTranscript = React.useCallback((text: string) => {
      const el = innerRef.current;
      if (!el) return;
      // Insert at cursor or append
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      const spacer = before.length > 0 && !before.endsWith(" ") ? " " : "";
      const newValue = before + spacer + text + after;

      // Use native setter to trigger React's onChange
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(el, newValue);
      el.dispatchEvent(new Event("input", { bubbles: true }));

      // Move cursor after inserted text
      const newPos = (before + spacer + text).length;
      setTimeout(() => el.setSelectionRange(newPos, newPos), 0);
    }, []);

    return (
      <div className="relative flex items-center w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            showDictation && "pr-9",
            className,
          )}
          ref={setRefs}
          {...props}
        />
        {showDictation && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <DictationButton onTranscript={handleTranscript} lang={dictationLang} />
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
