import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  /** @deprecated dictation has been removed; accepted for backward compatibility */
  enableDictation?: boolean;
  /** @deprecated dictation has been removed; accepted for backward compatibility */
  dictationLang?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  // Strip the legacy dictation props so they aren't forwarded to the DOM.
  ({ className, type, enableDictation: _enableDictation, dictationLang: _dictationLang, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
