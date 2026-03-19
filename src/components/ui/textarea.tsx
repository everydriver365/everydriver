import * as React from "react";
import { cn } from "@/lib/utils";
import { DictationButton } from "./dictation-button";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  enableDictation?: boolean;
  dictationLang?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, enableDictation = true, dictationLang, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      },
      [ref]
    );

    const showDictation = enableDictation && !props.disabled && !props.readOnly;

    const handleTranscript = React.useCallback((text: string) => {
      const el = innerRef.current;
      if (!el) return;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      const spacer = before.length > 0 && !before.endsWith(" ") ? " " : "";
      const newValue = before + spacer + text + after;

      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      nativeSetter?.call(el, newValue);
      el.dispatchEvent(new Event("input", { bubbles: true }));

      const newPos = (before + spacer + text).length;
      setTimeout(() => el.setSelectionRange(newPos, newPos), 0);
    }, []);

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
            showDictation && "pr-9",
            className,
          )}
          ref={setRefs}
          {...props}
        />
        {showDictation && (
          <div className="absolute right-1.5 top-2">
            <DictationButton onTranscript={handleTranscript} lang={dictationLang} />
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
