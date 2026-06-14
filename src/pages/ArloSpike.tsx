import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ArloSpike() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("arlo-spike-create-course");
      if (error) throw error;
      setResult(data);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const finalResult: string | undefined = result?.FINAL_RESULT;
  const finalColor = finalResult?.startsWith("SUCCESS")
    ? "#0a7a2f"
    : finalResult?.startsWith("PARTIAL")
    ? "#b46b00"
    : finalResult
    ? "#a8121a"
    : "#333";

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Arlo Course Creation Spike</h1>
      <p style={{ color: "#666", marginTop: 4 }}>Throwaway test — not linked from anywhere</p>

      <button
        onClick={run}
        disabled={loading}
        style={{
          marginTop: 16,
          padding: "10px 18px",
          fontSize: 16,
          fontWeight: 600,
          background: "#111",
          color: "#fff",
          border: 0,
          borderRadius: 8,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Testing…" : "Run Arlo spike test"}
      </button>

      {error && (
        <pre style={{ marginTop: 16, padding: 12, background: "#fee", color: "#a8121a", borderRadius: 8, whiteSpace: "pre-wrap" }}>
          Error invoking function: {error}
        </pre>
      )}

      {finalResult && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            fontSize: 22,
            fontWeight: 800,
            color: finalColor,
            background: "#f6f6f6",
            border: `2px solid ${finalColor}`,
            borderRadius: 8,
          }}
        >
          {finalResult}
        </div>
      )}

      {result && (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            background: "#0b0f17",
            color: "#d6e1ff",
            borderRadius: 8,
            maxHeight: "70vh",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
