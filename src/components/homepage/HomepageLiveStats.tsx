import { useEffect, useState } from "react";
import { Users, MapPin, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live trust strip.
 * - Instructor count: live from DB (public_instructors).
 * - Postcode areas: full UK coverage (124 = total UK postcode areas).
 * - Course options: brand-level count across templates + instructor variants.
 */
const UK_POSTCODE_AREAS = 124;
const COURSE_OPTIONS = 15;

export function HomepageLiveStats() {
  const [instructors, setInstructors] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("public_instructors")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      if (!cancelled) setInstructors(count ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  if (instructors === null) return null;

  const tiles = [
    {
      icon: Users,
      value: instructors,
      label: "DVSA-approved instructors",
      suffix: "+",
      numColor: "#0070C0",
      iconBg: "#EFF6FF",
      iconStroke: "#0070C0",
    },
    {
      icon: MapPin,
      value: UK_POSTCODE_AREAS,
      label: "UK postcode areas covered",
      suffix: "",
      numColor: "#E8641A",
      iconBg: "#FFF7ED",
      iconStroke: "#E8641A",
    },
    {
      icon: GraduationCap,
      value: COURSE_OPTIONS,
      label: "Course options to choose from",
      suffix: "+",
      numColor: "#059669",
      iconBg: "#F0FDF4",
      iconStroke: "#059669",
    },
  ];

  return (
    <section style={{ padding: "24px 5%", background: "#F6F6F8", width: "100%" }}>
      <div
        style={{
          background: "#F3F4F6",
          padding: 24,
          borderRadius: 14,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {tiles.map(({ icon: Icon, value, label, suffix, numColor, iconBg, iconStroke }) => (
          <div
            key={label}
            style={{
              background: "#FFFFFF",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              padding: 20,
              display: "flex",
              alignItems: "center",
              gap: 14,
              transition: "box-shadow 150ms ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={22} color={iconStroke} strokeWidth={1.8} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                  color: numColor,
                }}
              >
                {value.toLocaleString("en-GB")}
                {suffix}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  marginTop: 2,
                  lineHeight: 1.4,
                }}
              >
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

