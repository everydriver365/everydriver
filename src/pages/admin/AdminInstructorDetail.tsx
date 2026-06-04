import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { InstructorHeroCard } from "@/components/admin/instructor-detail/InstructorHeroCard";
import { ActionsStack } from "@/components/admin/instructor-detail/ActionsStack";
import { SectionColumn } from "@/components/admin/instructor-detail/SectionColumn";
import { Section } from "@/components/admin/instructor-detail/SectionCard";
import { buildDefaultSections, InstructorRelatedCounts } from "@/components/admin/instructor-detail/defaultSections";
import { EditProfileModal, EditProfileValues } from "@/components/admin/instructor-detail/modals/EditProfileModal";
import { toast } from "@/hooks/use-toast";

export default function AdminInstructorDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { isAdmin } = useAdminAuth();
  const [instructor, setInstructor] = useState<Record<string, any> | null>(null);
  const [counts, setCounts] = useState<InstructorRelatedCounts>({
    activePupils: null, totalPupilsAllTime: null, passesThisYear: null, totalLoyaltyPoints: null, openComplaints: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  const [col2, setCol2] = useState<Section[]>([]);
  const [col3, setCol3] = useState<Section[]>([]);
  const [col4, setCol4] = useState<Section[]>([]);
  const [sectionsBuiltFor, setSectionsBuiltFor] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const { data: ins, error: insErr } = await supabase
      .from("instructors").select("*").eq("id", id).maybeSingle();
    if (insErr || !ins) {
      setError(insErr?.message || "Instructor not found");
      setLoading(false);
      return;
    }
    setInstructor(ins);

    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const pupilsActive = await supabase.from("pupils").select("id", { count: "exact", head: true })
      .eq("instructor_id", id).is("deleted_at", null);
    const pupilsAll = await supabase.from("pupils").select("id", { count: "exact", head: true })
      .eq("instructor_id", id);
    const passes = await supabase.from("driving_test_results").select("id", { count: "exact", head: true })
      .eq("instructor_id", id).eq("result", "pass").gte("created_at", yearStart);
    const points = await supabase.from("pupils").select("reward_points")
      .eq("instructor_id", id).is("deleted_at", null);

    const totalPoints = (points.data as Array<{ reward_points: number | null }> | null)?.reduce(
      (sum, p) => sum + (Number(p.reward_points) || 0), 0,
    ) ?? null;

    setCounts({
      activePupils: pupilsActive.error ? null : (pupilsActive.count ?? 0),
      totalPupilsAllTime: pupilsAll.error ? null : (pupilsAll.count ?? 0),
      passesThisYear: passes.error ? null : (passes.count ?? 0),
      totalLoyaltyPoints: points.error ? null : totalPoints,
    });
    setLoading(false);
  };


  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // Build default sections once per instructor load
  useEffect(() => {
    if (!instructor) return;
    if (sectionsBuiltFor === instructor.id) return;
    const built = buildDefaultSections(instructor, counts);
    setCol2(built.col2);
    setCol3(built.col3);
    setCol4(built.col4);
    setSectionsBuiltFor(instructor.id);
  }, [instructor, counts, sectionsBuiltFor]);

  const handleSaveProfile = async (v: EditProfileValues) => {
    if (!id) return;
    const { error } = await supabase.from("instructors").update({
      name: v.name,
      email: v.email || null,
      phone: v.phone || null,
      adi_badge_number: v.adi_badge_number || null,
      is_active: v.is_active,
      instructor_grade: v.instructor_grade || null,
    }).eq("id", id);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile updated" });
    setEditingProfile(false);
    setSectionsBuiltFor(null); // allow re-build with new data
    await load();
  };

  const handleSuspend = async () => {
    if (!id || !instructor) return;
    const next = !instructor.is_active;
    if (!confirm(next ? "Re-activate this instructor?" : "Suspend this instructor?")) return;
    const { error } = await supabase.from("instructors").update({ is_active: next }).eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: next ? "Re-activated" : "Suspended" });
    await load();
  };

  const handleRemove = async () => {
    if (!id) return;
    if (!confirm("Permanently remove this instructor from the platform? This cannot be undone.")) return;
    toast({ title: "Removal requires support", description: "Use the danger zone in the instructor profile tools." });
  };

  const initialProfile: EditProfileValues | null = useMemo(() => instructor ? ({
    name: instructor.name ?? "",
    email: instructor.email ?? "",
    phone: instructor.phone ?? "",
    adi_badge_number: instructor.adi_badge_number ?? "",
    is_active: !!instructor.is_active,
    instructor_grade: instructor.instructor_grade ?? "",
  }) : null, [instructor]);

  return (
    <>
      {/* Mobile fallback — do not modify mobile portal */}
      <div className="md:hidden" style={{ padding: 24, textAlign: "center", color: "#6B7280" }}>
        Open this page on a desktop screen to view the instructor admin summary.
      </div>

      <div className="hidden md:block" style={{ minHeight: "100vh", background: "#F3F4F6" }}>
        {/* Top bar */}
        <div
          style={{
            background: "#0A2B6B", height: 50, padding: "0 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link to="/admin" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <span style={{
                background: "#D12E2E", color: "#fff", padding: "3px 6px",
                fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
              }}>DRIVE</span>
              <span style={{
                background: "#fff", color: "#0A2B6B", padding: "3px 6px",
                fontSize: 11, fontWeight: 800,
              }}>365</span>
            </Link>
            <div style={{ fontSize: 11, opacity: 0.85 }}>
              <Link to="/admin/network-instructors" style={{ color: "#fff", textDecoration: "none", opacity: 0.7 }}>
                Instructors
              </Link>
              <span style={{ opacity: 0.5, margin: "0 6px" }}>›</span>
              <span style={{ fontWeight: 600 }}>{instructor?.name || "—"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setEditingProfile(true)}
              style={{
                background: "transparent", color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "5px 12px", borderRadius: 6,
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              ✏ Edit profile
            </button>
            {isAdmin && (
              <button
                onClick={handleSuspend}
                style={{
                  background: "#D12E2E", color: "#fff", border: "none",
                  padding: "5px 12px", borderRadius: 6,
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >
                ⚠ {instructor?.is_active ? "Suspend" : "Re-activate"}
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        {loading && <div style={{ padding: 24, color: "#6B7280", fontSize: 12 }}>Loading…</div>}
        {error && <div style={{ padding: 24, color: "#DC2626", fontSize: 12 }}>Error: {error}</div>}

        {!loading && !error && instructor && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr 1fr 1fr",
              gap: 14,
              padding: "16px 24px",
              alignItems: "start",
            }}
          >
            <div>
              <InstructorHeroCard instructor={instructor} />
              <ActionsStack
                instructorId={instructor.id}
                isAdmin={isAdmin}
                onEditProfile={() => setEditingProfile(true)}
                onSuspend={handleSuspend}
                onRemove={handleRemove}
                onMessage={() => nav(`/admin/messages?instructor=${instructor.id}`)}
              />
            </div>
            <SectionColumn sections={col2} onChange={setCol2} />
            <SectionColumn sections={col3} onChange={setCol3} />
            <SectionColumn sections={col4} onChange={setCol4} />
          </div>
        )}
      </div>

      {editingProfile && initialProfile && (
        <EditProfileModal
          initial={initialProfile}
          onClose={() => setEditingProfile(false)}
          onSave={handleSaveProfile}
        />
      )}
    </>
  );
}
