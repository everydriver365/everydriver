import { useEffect, useState } from "react";
import { ExternalLink, Share2, X, PartyPopper } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestPassCelebrationProps {
  pupilId: string;
  pupilName?: string | null;
}

interface TestRow {
  test_date: string | null;
  result: string | null;
}

interface InstructorRow {
  name: string | null;
  google_review_url: string | null;
}

export function TestPassCelebration({ pupilId, pupilName }: TestPassCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const [test, setTest] = useState<TestRow | null>(null);
  const [instructor, setInstructor] = useState<InstructorRow | null>(null);

  const seenKey = `pupil_test_pass_seen_${pupilId}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (localStorage.getItem(seenKey) === "1") return;
        const { data: pupilRow } = await supabase
          .from("pupils")
          .select("test_passed, instructor_id")
          .eq("id", pupilId)
          .maybeSingle();
        if (!pupilRow || !(pupilRow as any).test_passed) return;

        const [{ data: testRow }, { data: instRow }] = await Promise.all([
          supabase
            .from("driving_test_results")
            .select("test_date, result")
            .eq("pupil_id", pupilId)
            .eq("result", "pass")
            .order("test_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("instructors")
            .select("name, google_review_url" as any)
            .eq("id", (pupilRow as any).instructor_id)
            .maybeSingle(),
        ]);

        if (!alive) return;
        setTest((testRow as TestRow) || null);
        setInstructor((instRow as InstructorRow) || null);
        setVisible(true);
      } catch (e) {
        console.error("TestPassCelebration load failed", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pupilId, seenKey]);

  const close = () => {
    localStorage.setItem(seenKey, "1");
    setVisible(false);
  };

  const share = async () => {
    const text = `${pupilName ? `${pupilName} just` : "I just"} passed my driving test! 🎉`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: "I passed!", text, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`.trim());
      toast.success("Link copied!");
    } catch {
      toast.error("Could not share");
    }
  };

  if (!visible) return null;

  const dateLabel = test?.test_date ? format(parseISO(test.test_date), "d MMMM yyyy") : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#F2F4F8",
        fontFamily: "Poppins, sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: 24,
        overflowY: "auto",
      }}
    >
      <button
        onClick={close}
        aria-label="Close"
        style={{
          alignSelf: "flex-end",
          background: "transparent",
          border: "none",
          padding: 8,
          cursor: "pointer",
          color: "#6b7280",
        }}
      >
        <X size={24} />
      </button>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 16 }}>🎉</div>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 12px",
            lineHeight: 1.1,
          }}
        >
          You passed!
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "#374151",
            margin: "0 0 8px",
            lineHeight: 1.5,
          }}
        >
          Congratulations — you've passed your driving test!
        </p>
        {dateLabel && (
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 32px" }}>
            Passed on {dateLabel}
          </p>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            maxWidth: 320,
          }}
        >
          {instructor?.google_review_url && (
            <a
              href={instructor.google_review_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "#141b43",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 600,
                padding: "14px 20px",
                borderRadius: 12,
                textDecoration: "none",
              }}
            >
              <ExternalLink size={16} />
              Leave {instructor.name || "your instructor"} a review
            </a>
          )}

          <button
            onClick={share}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#ffffff",
              color: "#111827",
              fontSize: 15,
              fontWeight: 600,
              padding: "14px 20px",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              cursor: "pointer",
            }}
          >
            <Share2 size={16} />
            Share the news
          </button>

          <button
            onClick={close}
            style={{
              backgroundColor: "transparent",
              color: "#6b7280",
              fontSize: 14,
              fontWeight: 500,
              padding: "12px 20px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#d97706",
            fontSize: 13,
          }}
        >
          <PartyPopper size={14} />
          <span>A moment to remember</span>
        </div>
      </div>
    </div>
  );
}
