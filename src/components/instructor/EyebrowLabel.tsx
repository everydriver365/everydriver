import { ReactNode } from "react";

interface EyebrowLabelProps {
  children: ReactNode;
  className?: string;
}

export function EyebrowLabel({ children, className }: EyebrowLabelProps) {
  return (
    <p
      className={className}
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: "#6E6E73",
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        margin: "0 0 10px",
      }}
    >
      {children}
    </p>
  );
}
