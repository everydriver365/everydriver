import { Loader2 } from "lucide-react";

export function RouterFallback() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#2B7BC8" }} />
    </div>
  );
}
