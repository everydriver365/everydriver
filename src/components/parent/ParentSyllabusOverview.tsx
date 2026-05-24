import { useState, useEffect } from "react";
import { Loader2, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DVSA_SYLLABUS, SYLLABUS_CATEGORIES, SKILL_LEVELS } from "@/constants/dvsaSyllabus";

interface ParentSyllabusOverviewProps {
  childId: string;
  childName: string;
}

interface ProgressRow {
  competency_id: string;
  level: number;
  instructor_notes?: string | null;
  updated_at?: string | null;
}

const FONT = "Poppins, -apple-system, BlinkMacSystemFont, sans-serif";

export function ParentSyllabusOverview({ childId, childName }: ParentSyllabusOverviewProps) {
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const parentPhone = localStorage.getItem("parent_phone_verified");
        if (!parentPhone) {
          throw new Error("Parent session not found. Please log in again.");
        }
        const { data, error: invokeErr } = await supabase.functions.invoke(
          "parent-get-syllabus",
          { body: { parent_phone: parentPhone, pupil_id: childId } },
        );
        if (invokeErr) throw invokeErr;
        if (!active) return;
        setProgress((data?.progress as ProgressRow[]) || []);
        setReadiness(typeof data?.readiness === "number" ? data.readiness : 0);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Could not load syllabus");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [childId]);

  if (loading) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: "0.5px solid #E0E3EA",
          padding: 24,
          display: "flex",
          justifyContent: "center",
          fontFamily: FONT,
        }}
      >
        <Loader2 size={18} className="animate-spin" color="#6B7280" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: "0.5px solid #E0E3EA",
          padding: 20,
          fontFamily: FONT,
        }}
      >
        <p style={{ fontSize: 13, color: "#B91C1C", margin: 0 }}>{error}</p>
      </div>
    );
  }

  const progressMap = Object.fromEntries(progress.map((p) => [p.competency_id, p.level]));
  const updatedMap = Object.fromEntries(
    progress.filter((p) => p.updated_at).map((p) => [p.competency_id, p.updated_at as string]),
  );
  const formatLastPracticed = (iso: string | undefined): string | null => {
    if (!iso) return null;
    const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (diffDays <= 0) return "Practiced today";
    if (diffDays === 1) return "Practiced yesterday";
    return `Last practiced ${diffDays} days ago`;
  };
  const masteredCount = DVSA_SYLLABUS.filter((c) => (progressMap[c.id] || 0) >= 5).length;
  const score = readiness ?? 0;
  const readinessColor = score >= 80 ? "#15803D" : score >= 50 ? "#B8801F" : "#B91C1C";
  const readinessBg = score >= 80 ? "#DCFCE7" : score >= 50 ? "#FEF3C7" : "#FEE2E2";

  const categoryData = SYLLABUS_CATEGORIES.map((category) => {
    const comps = DVSA_SYLLABUS.filter((c) => c.category === category);
    const totalPoints = comps.length * 5;
    const earned = comps.reduce((s, c) => s + (progressMap[c.id] || 0), 0);
    const percent = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0;
    return { category, percent, total: comps.length, comps };
  });

  return (
    <div style={{ fontFamily: FONT, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Readiness header */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: "0.5px solid #E0E3EA",
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "#EDF2FE",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GraduationCap size={20} color="#3D55A1" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
            DVSA syllabus — {childName}
          </p>
          <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0" }}>
            {masteredCount} of {DVSA_SYLLABUS.length} at Independent level
          </p>
        </div>
        <div
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            background: readinessBg,
            color: readinessColor,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {score}% ready
        </div>
      </div>

      {/* Category breakdown */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: "0.5px solid #E0E3EA",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {categoryData.map(({ category, percent, total, comps }) => {
          const mastered = comps.filter((c) => (progressMap[c.id] || 0) >= 5).length;
          return (
            <div key={category}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                  {category}
                </span>
                <span style={{ fontSize: 11, color: "#6B7280" }}>
                  {mastered}/{total} · {percent}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "#F1F3F7",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${percent}%`,
                    background: percent >= 80 ? "#15803D" : percent >= 50 ? "#3D55A1" : "#9CA3AF",
                    transition: "width 300ms ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Competency list (read-only) */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: "0.5px solid #E0E3EA",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "0.5px solid #E0E3EA",
            background: "#F8FAFC",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#6B7280",
              letterSpacing: 0.4,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            All competencies
          </p>
        </div>
        {DVSA_SYLLABUS.map((c, idx) => {
          const level = progressMap[c.id] || 0;
          const info = SKILL_LEVELS[level];
          return (
            <div
              key={c.id}
              style={{
                padding: "10px 16px",
                borderTop: idx === 0 ? "none" : "0.5px solid #F1F3F7",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#111827" }}>{c.name}</div>
                {formatLastPracticed(updatedMap[c.id]) && (
                  <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>
                    {formatLastPracticed(updatedMap[c.id])}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: level >= 5 ? "#DCFCE7" : level >= 3 ? "#DBEAFE" : "#F1F3F7",
                  color: level >= 5 ? "#15803D" : level >= 3 ? "#1D4ED8" : "#6B7280",
                }}
              >
                {info?.label || "Not started"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
