import { useEffect, useState } from "react";
import { isNativePlatform, isWrappedApp } from "@/lib/biometricAuth";

interface Props {
  className?: string;
}

/**
 * Tiny helper line shown under the Remember me row so users understand
 * where Face ID actually works (only inside the native app).
 */
export function SignInEnvironmentHint({ className }: Props) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    if (isNativePlatform()) {
      setText("Face ID / Touch ID is enabled on this device.");
    } else if (isWrappedApp()) {
      setText("Quick Sign In appears here after your first sign-in.");
    } else {
      setText(
        "Face ID is only available in the iOS or Android app. Remember me keeps you signed in on this browser.",
      );
    }
  }, []);

  if (!text) return null;
  return (
    <p className={`text-xs leading-snug text-muted-foreground ${className ?? ""}`}>
      {text}
    </p>
  );
}
